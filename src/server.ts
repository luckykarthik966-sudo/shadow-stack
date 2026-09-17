import "dotenv/config";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { MemoryAuctionStore } from "./memory-store.js";
import { createPool, ensureDatabase, PgAuctionStore } from "./pg-store.js";
import { AuctionError } from "./types.js";
import { bidSchema, createAuctionSchema, participantSchema, updateAuctionSchema } from "./validation.js";

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? "0.0.0.0";
const maxParticipants = Number(process.env.MAX_PARTICIPANTS ?? 20);
const allowedOrigins = (process.env.CORS_ORIGIN ?? "*").split(",").map((origin) => origin.trim());
const app = express();
const httpServer = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });
const rooms = new Map<string, Set<WebSocket>>();
const participants = new Map<string, { id: string; displayName: string; joinedAt: string }>();
const memoryStore = new MemoryAuctionStore();
const pool = process.env.DATABASE_URL ? createPool(process.env.DATABASE_URL) : undefined;
const store = pool ? new PgAuctionStore(pool) : memoryStore;

app.use(cors({ origin: allowedOrigins.includes("*") ? true : allowedOrigins }));
app.use(express.json({ limit: "64kb" }));

function requireHost(req: Request, res: Response, next: NextFunction) {
  const configured = process.env.HOST_ADMIN_TOKEN;
  if (!configured) return next();
  const received = req.header("x-host-token") ?? req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (received !== configured) return res.status(401).json({ error: "Host authentication required" });
  return next();
}

function broadcast(auctionId: string, payload: unknown) {
  const message = JSON.stringify(payload);
  for (const socket of rooms.get(auctionId) ?? []) {
    if (socket.readyState === WebSocket.OPEN) socket.send(message);
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AuctionError) {
    const status = error.code === "NOT_FOUND" ? 404 : error.code === "AUCTION_NOT_LIVE" ? 409 : 400;
    return res.status(status).json({ error: error.message, code: error.code });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}

app.get("/api/health", async (_req, res) => {
  let database = "memory";
  if (pool) {
    try { await pool.query("SELECT 1"); database = "postgres"; } catch { database = "postgres_unavailable"; }
  }
  res.json({ ok: database !== "postgres_unavailable", database, connectedRooms: rooms.size, participants: participants.size, maxParticipants });
});

app.post("/api/participants", (req, res) => {
  const parsed = participantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (participants.size >= maxParticipants) return res.status(409).json({ error: "This room has reached its participant limit" });
  const participant = { id: randomUUID(), displayName: parsed.data.displayName, joinedAt: new Date().toISOString() };
  participants.set(participant.id, participant);
  return res.status(201).json({ participant, remainingSlots: maxParticipants - participants.size });
});

app.get("/api/auctions", async (_req, res) => {
  try { return res.json({ auctions: await store.listAuctions() }); } catch (error) { return sendError(res, error); }
});

app.post("/api/auctions", requireHost, async (req, res) => {
  const parsed = createAuctionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try { return res.status(201).json({ auction: await store.createAuction(parsed.data) }); } catch (error) { return sendError(res, error); }
});

app.get("/api/auctions/:id", async (req, res) => {
  try {
    const auction = await store.getAuction(req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    const bids = await store.getBidHistory(req.params.id, 100);
    return res.json({ auction, bids });
  } catch (error) { return sendError(res, error); }
});

app.patch("/api/auctions/:id", requireHost, async (req, res) => {
  const parsed = updateAuctionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const auction = await store.updateAuction(String(req.params.id), parsed.data);
    broadcast(auction.id, { type: "auction.updated", auction });
    return res.json({ auction });
  } catch (error) { return sendError(res, error); }
});

app.post("/api/auctions/:id/bids", async (req, res) => {
  const parsed = bidSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const result = await store.placeBid({ auctionId: req.params.id, ...parsed.data });
    if (!result.accepted) {
      broadcast(req.params.id, { type: "bid.rejected", auction: result.auction, reason: result.reason });
      return res.status(409).json(result);
    }
    broadcast(req.params.id, { type: "bid.accepted", bid: result.bid, auction: result.auction });
    return res.status(201).json(result);
  } catch (error) { return sendError(res, error); }
});

app.get("/api/auctions/:id/bids", async (req, res) => {
  const rawLimit = Number(req.query.limit ?? 100);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 200) : 100;
  try { return res.json({ bids: await store.getBidHistory(req.params.id, limit) }); } catch (error) { return sendError(res, error); }
});

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => sendError(res, error));

httpServer.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url ?? "/", "http://auction.local");
    if (url.pathname !== "/ws" || !url.searchParams.get("auctionId")) { socket.destroy(); return; }
    const auctionId = url.searchParams.get("auctionId")!;
    wsServer.handleUpgrade(request, socket, head, (client) => {
      wsServer.emit("connection", client, request, auctionId);
    });
  } catch { socket.destroy(); }
});

wsServer.on("connection", async (socket: WebSocket, _request: IncomingMessage, auctionId: string) => {
  const auction = await store.getAuction(auctionId);
  if (!auction) { socket.close(1008, "Auction not found"); return; }
  const room = rooms.get(auctionId) ?? new Set<WebSocket>();
  room.add(socket); rooms.set(auctionId, room);
  socket.send(JSON.stringify({ type: "auction.snapshot", auction, bids: await store.getBidHistory(auctionId, 100) }));
  socket.on("close", () => { room.delete(socket); if (!room.size) rooms.delete(auctionId); });
  socket.on("error", () => socket.close());
});

async function start() {
  if (pool) await ensureDatabase(pool);
  httpServer.listen(port, host, () => console.log(`Wise Money auction backend listening on ${host}:${port}`));
}

void start().catch((error) => { console.error("Failed to start backend", error); process.exit(1); });

export { app, httpServer, store };
