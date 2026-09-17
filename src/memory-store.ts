import { randomUUID } from "node:crypto";
import { AuctionError } from "./types.js";
import type { Auction, AuctionStore, Bid, CreateAuctionInput, PlaceBidInput, PlaceBidResult, UpdateAuctionInput } from "./types.js";

export class MemoryAuctionStore implements AuctionStore {
  private auctions = new Map<string, Auction>();
  private bids = new Map<string, Bid[]>();
  private idempotency = new Map<string, Bid>();
  private locks = new Map<string, Promise<void>>();

  async listAuctions(): Promise<Auction[]> {
    return [...this.auctions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getAuction(id: string): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }

  async getBidHistory(auctionId: string, limit: number): Promise<Bid[]> {
    return (this.bids.get(auctionId) ?? []).slice(0, limit);
  }

  async createAuction(input: CreateAuctionInput): Promise<Auction> {
    const now = new Date().toISOString();
    const auction: Auction = {
      id: randomUUID(), title: input.title, description: input.description, imageUrl: input.imageUrl,
      status: "draft", currentBidCents: input.initialBidCents ?? 0, startsAt: input.startsAt, endsAt: input.endsAt,
      createdAt: now, updatedAt: now,
    };
    this.auctions.set(auction.id, auction);
    this.bids.set(auction.id, []);
    return auction;
  }

  async updateAuction(id: string, patch: UpdateAuctionInput): Promise<Auction> {
    const current = this.auctions.get(id);
    if (!current) throw new AuctionError("NOT_FOUND", "Auction not found");
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.auctions.set(id, updated);
    return updated;
  }

  async placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
    return this.withLock(input.auctionId, async () => {
      const auction = this.auctions.get(input.auctionId);
      if (!auction) throw new AuctionError("NOT_FOUND", "Auction not found");
      const existing = this.idempotency.get(`${input.auctionId}:${input.clientBidId}`);
      if (existing) return { accepted: true, bid: existing, auction };
      if (auction.status !== "live") throw new AuctionError("AUCTION_NOT_LIVE", "This auction is not accepting bids");
      const baseBid: Bid = { id: randomUUID(), auctionId: input.auctionId, bidderId: input.bidderId, amountCents: input.amountCents, clientBidId: input.clientBidId, createdAt: new Date().toISOString() };
      if (input.amountCents <= auction.currentBidCents) return { accepted: false, bid: baseBid, auction, reason: "stale_price" };
      const updated: Auction = { ...auction, currentBidCents: input.amountCents, leadingBidderId: input.bidderId, updatedAt: baseBid.createdAt };
      this.auctions.set(input.auctionId, updated);
      this.bids.set(input.auctionId, [baseBid, ...(this.bids.get(input.auctionId) ?? [])]);
      this.idempotency.set(`${input.auctionId}:${input.clientBidId}`, baseBid);
      return { accepted: true, bid: baseBid, auction: updated };
    });
  }

  private async withLock<T>(auctionId: string, work: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(auctionId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    this.locks.set(auctionId, current);
    await previous;
    try { return await work(); } finally { release(); if (this.locks.get(auctionId) === current) this.locks.delete(auctionId); }
  }
}
