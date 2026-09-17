import { beforeEach, describe, expect, it } from "vitest";
import { MemoryAuctionStore } from "../src/memory-store.js";

describe("Wise Money auction store", () => {
  let store: MemoryAuctionStore;

  beforeEach(() => { store = new MemoryAuctionStore(); });

  it("accepts arbitrary higher amounts without requiring a fixed increment", async () => {
    const auction = await store.createAuction({ title: "Test lot", description: "", initialBidCents: 3000 });
    await store.updateAuction(auction.id, { status: "live" });
    const result = await store.placeBid({ auctionId: auction.id, bidderId: "person-a", amountCents: 3000, clientBidId: "client-a-0001" });
    expect(result.accepted).toBe(false);
    const next = await store.placeBid({ auctionId: auction.id, bidderId: "person-b", amountCents: 3200, clientBidId: "client-b-0001" });
    expect(next.accepted).toBe(true);
    expect(next.auction.currentBidCents).toBe(3200);
  });

  it("serializes concurrent bids so only a strictly higher sequence advances the price", async () => {
    const auction = await store.createAuction({ title: "Race lot", description: "", initialBidCents: 3000 });
    await store.updateAuction(auction.id, { status: "live" });
    const amounts = [3050, 3060, 3060, 3040, 3150, 3120, 3300, 3290, 3500, 3400];
    const results = await Promise.all(amounts.map((amount, index) => store.placeBid({ auctionId: auction.id, bidderId: `bidder-${index}`, amountCents: amount, clientBidId: `client-${index}-0001` })));
    const accepted = results.filter((result) => result.accepted);
    expect(accepted.length).toBeGreaterThan(0);
    expect(accepted.every((result, index) => index === 0 || result.auction.currentBidCents > accepted[index - 1]!.auction.currentBidCents)).toBe(true);
    const finalAuction = await store.getAuction(auction.id);
    expect(finalAuction?.currentBidCents).toBe(3500);
  });

  it("returns the original result for a retried client bid id", async () => {
    const auction = await store.createAuction({ title: "Retry lot", description: "", initialBidCents: 1000 });
    await store.updateAuction(auction.id, { status: "live" });
    const input = { auctionId: auction.id, bidderId: "person-a", amountCents: 1250, clientBidId: "retry-key-0001" };
    const first = await store.placeBid(input);
    const retry = await store.placeBid(input);
    expect(first.accepted).toBe(true);
    expect(retry.accepted).toBe(true);
    expect(retry.bid.id).toBe(first.bid.id);
    expect((await store.getBidHistory(auction.id, 100)).length).toBe(1);
  });
});
