export type AuctionStatus = "draft" | "live" | "ended";

export type Auction = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  status: AuctionStatus;
  currentBidCents: number;
  leadingBidderId?: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Bid = {
  id: string;
  auctionId: string;
  bidderId: string;
  amountCents: number;
  clientBidId: string;
  createdAt: string;
};

export type PlaceBidResult = {
  accepted: boolean;
  bid: Bid;
  auction: Auction;
  reason?: "stale_price" | "auction_not_live";
};

export type AuctionStore = {
  listAuctions(): Promise<Auction[]>;
  getAuction(id: string): Promise<Auction | undefined>;
  getBidHistory(auctionId: string, limit: number): Promise<Bid[]>;
  createAuction(input: CreateAuctionInput): Promise<Auction>;
  updateAuction(id: string, patch: UpdateAuctionInput): Promise<Auction>;
  placeBid(input: PlaceBidInput): Promise<PlaceBidResult>;
};

export type CreateAuctionInput = {
  title: string;
  description: string;
  imageUrl?: string;
  startsAt?: string;
  endsAt?: string;
  initialBidCents?: number;
};

export type UpdateAuctionInput = Partial<Pick<Auction, "title" | "description" | "imageUrl" | "startsAt" | "endsAt" | "status">>;

export type PlaceBidInput = {
  auctionId: string;
  bidderId: string;
  amountCents: number;
  clientBidId: string;
};

export class AuctionError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_BID" | "AUCTION_NOT_LIVE", message: string) {
    super(message);
    this.name = "AuctionError";
  }
}
