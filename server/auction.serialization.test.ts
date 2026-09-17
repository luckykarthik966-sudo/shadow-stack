import { describe, expect, it } from "vitest";
import { nextMinimumBid, serializeBidBatch } from "../shared/auction";

describe("auction bid serialization", () => {
  it("accepts only bids that advance the leading price", () => {
    const result = serializeBidBatch(1000, [
      { bidder: "alpha", amount: 1200 },
      { bidder: "bravo", amount: 1100 },
      { bidder: "charlie", amount: 1350 },
    ]);

    expect(result.map((bid) => bid.status)).toEqual(["accepted", "rejected", "accepted"]);
    expect(result[1]?.reason).toBe("stale_price");
    expect(result[2]?.sequence).toBe(3);
  });

  it("rejects invalid amounts without changing the price path", () => {
    const result = serializeBidBatch(1000, [
      { bidder: "empty", amount: 0 },
      { bidder: "nan", amount: Number.NaN },
      { bidder: "winner", amount: 1110 },
    ]);

    expect(result[0]?.reason).toBe("invalid_amount");
    expect(result[1]?.reason).toBe("invalid_amount");
    expect(result[2]?.status).toBe("accepted");
  });

  it("calculates the next minimum bid deterministically", () => {
    expect(nextMinimumBid(2840)).toBe(2950);
    expect(nextMinimumBid(2840, 250)).toBe(3090);
  });
});
