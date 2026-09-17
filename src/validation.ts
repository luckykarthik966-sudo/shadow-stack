import { z } from "zod";

export const createAuctionSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(2000).default(""),
  imageUrl: z.string().url().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  initialBidCents: z.number().int().nonnegative().default(0),
});

export const updateAuctionSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  status: z.enum(["draft", "live", "ended"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const bidSchema = z.object({
  bidderId: z.string().trim().min(1).max(100),
  amountCents: z.number().int().positive(),
  clientBidId: z.string().trim().min(8).max(120),
});

export const participantSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  ageConfirmed: z.literal(true),
});

export function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}
