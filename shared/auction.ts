export type SerializedBid = {
  bidder: string;
  amount: number;
  sequence: number;
  status: "accepted" | "rejected";
  reason: "leading" | "stale_price" | "invalid_amount";
};

/**
 * Deterministically applies a batch of bids in arrival order. The first valid
 * bid above the current price wins the write, while stale bids are rejected.
 * This mirrors the transactional write path surfaced in the demo UI.
 */
export function serializeBidBatch(currentPrice: number, bids: Array<{ bidder: string; amount: number }>): SerializedBid[] {
  let price = currentPrice;
  return bids.map((bid, index) => {
    if (!Number.isFinite(bid.amount) || bid.amount <= 0) {
      return { ...bid, sequence: index + 1, status: "rejected", reason: "invalid_amount" };
    }
    if (bid.amount <= price) {
      return { ...bid, sequence: index + 1, status: "rejected", reason: "stale_price" };
    }
    price = bid.amount;
    return { ...bid, sequence: index + 1, status: "accepted", reason: "leading" };
  });
}

export function nextMinimumBid(currentPrice: number, increment = 110): number {
  return currentPrice + increment;
}
