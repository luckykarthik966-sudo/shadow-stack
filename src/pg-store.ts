import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { AuctionError } from "./types.js";
import type { Auction, AuctionStore, Bid, CreateAuctionInput, PlaceBidInput, PlaceBidResult, UpdateAuctionInput } from "./types.js";

type AuctionRow = { id: string; title: string; description: string; image_url: string | null; status: Auction["status"]; current_bid_cents: string; leading_bidder_id: string | null; starts_at: Date | null; ends_at: Date | null; created_at: Date; updated_at: Date };
type BidRow = { id: string; auction_id: string; bidder_id: string; amount_cents: string; client_bid_id: string; created_at: Date };

function auctionFromRow(row: AuctionRow): Auction {
  return { id: row.id, title: row.title, description: row.description, imageUrl: row.image_url ?? undefined, status: row.status, currentBidCents: Number(row.current_bid_cents), leadingBidderId: row.leading_bidder_id ?? undefined, startsAt: row.starts_at?.toISOString(), endsAt: row.ends_at?.toISOString(), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() };
}
function bidFromRow(row: BidRow): Bid {
  return { id: String(row.id), auctionId: row.auction_id, bidderId: row.bidder_id, amountCents: Number(row.amount_cents), clientBidId: row.client_bid_id, createdAt: row.created_at.toISOString() };
}

export class PgAuctionStore implements AuctionStore {
  constructor(private readonly pool: Pool) {}

  async listAuctions(): Promise<Auction[]> {
    const result = await this.pool.query<AuctionRow>("SELECT * FROM auctions ORDER BY updated_at DESC");
    return result.rows.map(auctionFromRow);
  }
  async getAuction(id: string): Promise<Auction | undefined> {
    const result = await this.pool.query<AuctionRow>("SELECT * FROM auctions WHERE id = $1", [id]);
    return result.rows[0] ? auctionFromRow(result.rows[0]) : undefined;
  }
  async getBidHistory(auctionId: string, limit: number): Promise<Bid[]> {
    const result = await this.pool.query<BidRow>("SELECT * FROM bids WHERE auction_id = $1 ORDER BY created_at DESC LIMIT $2", [auctionId, limit]);
    return result.rows.map(bidFromRow);
  }
  async createAuction(input: CreateAuctionInput): Promise<Auction> {
    const id = randomUUID();
    const result = await this.pool.query<AuctionRow>("INSERT INTO auctions (id, title, description, image_url, current_bid_cents, starts_at, ends_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", [id, input.title, input.description, input.imageUrl ?? null, input.initialBidCents ?? 0, input.startsAt ?? null, input.endsAt ?? null]);
    return auctionFromRow(result.rows[0]!);
  }
  async updateAuction(id: string, patch: UpdateAuctionInput): Promise<Auction> {
    const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
    if (!entries.length) throw new AuctionError("INVALID_BID", "No auction fields supplied");
    const columnMap: Record<string, string> = { title: "title", description: "description", imageUrl: "image_url", startsAt: "starts_at", endsAt: "ends_at", status: "status" };
    const sets = entries.map(([key], index) => `${columnMap[key]} = $${index + 2}`);
    const values = entries.map(([, value]) => value);
    const result = await this.pool.query<AuctionRow>(`UPDATE auctions SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, ...values]);
    if (!result.rows[0]) throw new AuctionError("NOT_FOUND", "Auction not found");
    return auctionFromRow(result.rows[0]);
  }

  async placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
        const auctionResult = await client.query<AuctionRow>("SELECT * FROM auctions WHERE id = $1 FOR UPDATE", [input.auctionId]);
        const row = auctionResult.rows[0];
        if (!row) throw new AuctionError("NOT_FOUND", "Auction not found");
        const existingResult = await client.query<BidRow>("SELECT * FROM bids WHERE auction_id = $1 AND client_bid_id = $2", [input.auctionId, input.clientBidId]);
        if (existingResult.rows[0]) { await client.query("COMMIT"); return { accepted: true, bid: bidFromRow(existingResult.rows[0]), auction: auctionFromRow(row) }; }
        if (row.status !== "live") throw new AuctionError("AUCTION_NOT_LIVE", "This auction is not accepting bids");
        const baseBid: Bid = { id: "pending", auctionId: input.auctionId, bidderId: input.bidderId, amountCents: input.amountCents, clientBidId: input.clientBidId, createdAt: new Date().toISOString() };
        if (input.amountCents <= Number(row.current_bid_cents)) { await client.query("ROLLBACK"); return { accepted: false, bid: baseBid, auction: auctionFromRow(row), reason: "stale_price" }; }
        const inserted = await client.query<BidRow>("INSERT INTO bids (auction_id, bidder_id, amount_cents, client_bid_id) VALUES ($1,$2,$3,$4) RETURNING *", [input.auctionId, input.bidderId, input.amountCents, input.clientBidId]);
        const updated = await client.query<AuctionRow>("UPDATE auctions SET current_bid_cents = $2, leading_bidder_id = $3, updated_at = NOW() WHERE id = $1 RETURNING *", [input.auctionId, input.amountCents, input.bidderId]);
        await client.query("COMMIT");
        return { accepted: true, bid: bidFromRow(inserted.rows[0]!), auction: auctionFromRow(updated.rows[0]!) };
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        if (error instanceof Error && error.message.includes("could not serialize access") && attempt < 2) continue;
        throw error;
      } finally { client.release(); }
    }
    throw new Error("Bid transaction failed after retries");
  }
}

export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: Number(process.env.PG_POOL_MAX ?? 10), idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
}

export async function ensureDatabase(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auctions (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', image_url TEXT, status TEXT NOT NULL CHECK (status IN ('draft','live','ended')) DEFAULT 'draft', current_bid_cents BIGINT NOT NULL DEFAULT 0 CHECK (current_bid_cents >= 0), leading_bidder_id TEXT, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS bids (id BIGSERIAL PRIMARY KEY, auction_id TEXT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE, bidder_id TEXT NOT NULL, amount_cents BIGINT NOT NULL CHECK (amount_cents > 0), client_bid_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (auction_id, client_bid_id));
    CREATE INDEX IF NOT EXISTS bids_auction_created_idx ON bids (auction_id, created_at DESC);
  `);
}

export type { PoolClient };
