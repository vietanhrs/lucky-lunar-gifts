import { z } from "zod";

const hex64 = z
  .string()
  .regex(/^[0-9a-fA-F]{64}$/, "must be a 64-character hex string");
const lovelace = z
  .string()
  .regex(/^\d+$/, "must be a non-negative integer string (lovelace)");
const network = z.enum(["mainnet", "preprod", "preview"]);

export const createGiftSchema = z.object({
  lockTxHash: hex64,
  code: z.string().max(4096).optional(),
  ownerAddress: z.string().min(1).max(256),
  title: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  hint: z.array(z.string().max(16)).max(256).optional(),
  secretHash: hex64.optional(),
  totalEnvelopes: z.number().int().positive().max(10_000),
  totalLovelace: lovelace,
  deadlineMs: z.number().int().nonnegative(),
  network,
});
export type CreateGiftInput = z.infer<typeof createGiftSchema>;

export const createClaimSchema = z.object({
  claimerName: z.string().max(60).optional(),
  claimerAddress: z.string().min(1).max(256),
  claimTxHash: hex64,
  amountLovelace: lovelace,
});
export type CreateClaimInput = z.infer<typeof createClaimSchema>;

export const listGiftsQuerySchema = z.object({
  owner: z.string().min(1).max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
