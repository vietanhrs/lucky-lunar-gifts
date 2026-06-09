import { Hono } from "hono";
import type { AppDeps } from "../app";
import { GiftRepository } from "../repositories/gifts";
import { ClaimRepository } from "../repositories/claims";
import {
  createClaimSchema,
  createGiftSchema,
  listGiftsQuerySchema,
} from "../lib/validation";
import { ApiError } from "../lib/errors";

const HEX64 = /^[0-9a-fA-F]{64}$/;

function requireHash(hash: string): string {
  if (!HEX64.test(hash)) {
    throw new ApiError(400, "Invalid lock transaction hash.");
  }
  return hash;
}

export function giftsRoutes(deps: AppDeps) {
  const app = new Hono();
  const gifts = new GiftRepository(deps.db);
  const claims = new ClaimRepository(deps.db);

  // Register a gift after its lock transaction is on-chain.
  app.post("/", async (c) => {
    const input = createGiftSchema.parse(await c.req.json());

    if (input.network !== deps.network) {
      throw new ApiError(
        400,
        `This server is configured for ${deps.network}, not ${input.network}.`,
      );
    }

    // Strict on-chain verification: the lock tx must exist and its gift outputs
    // must match what's being registered.
    const facts = await deps.chain.getLockTxFacts(input.lockTxHash);
    if (!facts.exists) {
      throw new ApiError(400, "Lock transaction was not found on-chain.");
    }
    if (facts.scriptOutputCount === 0) {
      throw new ApiError(
        400,
        "Transaction has no gift envelopes at the script address.",
      );
    }
    if (facts.scriptOutputCount !== input.totalEnvelopes) {
      throw new ApiError(
        400,
        `Envelope count mismatch: ${facts.scriptOutputCount} on-chain, ${input.totalEnvelopes} submitted.`,
      );
    }
    if (facts.scriptOutputLovelace !== input.totalLovelace) {
      throw new ApiError(
        400,
        `Total amount mismatch: ${facts.scriptOutputLovelace} on-chain, ${input.totalLovelace} submitted.`,
      );
    }

    const gift = gifts.create(input);
    return c.json({ gift }, 201);
  });

  // List gifts, optionally filtered by owner address.
  app.get("/", (c) => {
    const q = listGiftsQuerySchema.parse(c.req.query());
    const items = q.owner
      ? gifts.listByOwner(q.owner, q.limit, q.offset)
      : gifts.list(q.limit, q.offset);
    return c.json({ gifts: items });
  });

  // Fetch one gift with its recorded claims.
  app.get("/:lockTxHash", (c) => {
    const hash = requireHash(c.req.param("lockTxHash"));
    const gift = gifts.getByLockTxHash(hash);
    if (!gift) throw new ApiError(404, "Gift not found.");
    return c.json({ gift, claims: claims.listByGift(hash) });
  });

  // Record a claim, after verifying its transaction spent the gift on-chain.
  app.post("/:lockTxHash/claims", async (c) => {
    const hash = requireHash(c.req.param("lockTxHash"));
    const gift = gifts.getByLockTxHash(hash);
    if (!gift) throw new ApiError(404, "Gift not found.");

    const input = createClaimSchema.parse(await c.req.json());

    const facts = await deps.chain.getClaimTxFacts(hash, input.claimTxHash);
    if (!facts.exists) {
      throw new ApiError(400, "Claim transaction was not found on-chain.");
    }
    if (!facts.spendsGift) {
      throw new ApiError(
        400,
        "Claim transaction does not spend this gift's envelopes.",
      );
    }

    const claim = claims.create(hash, input);
    return c.json({ claim }, 201);
  });

  // List a gift's claims.
  app.get("/:lockTxHash/claims", (c) => {
    const hash = requireHash(c.req.param("lockTxHash"));
    if (!gifts.exists(hash)) throw new ApiError(404, "Gift not found.");
    return c.json({ claims: claims.listByGift(hash) });
  });

  return app;
}
