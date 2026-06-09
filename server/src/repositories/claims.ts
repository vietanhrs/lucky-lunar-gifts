import type { Database } from "bun:sqlite";
import type { Claim } from "../types";
import type { CreateClaimInput } from "../lib/validation";
import { ApiError } from "../lib/errors";

interface ClaimRow {
  id: string;
  lock_tx_hash: string;
  claimer_name: string | null;
  claimer_address: string;
  claim_tx_hash: string;
  amount_lovelace: string;
  created_at: number;
}

function toClaim(row: ClaimRow): Claim {
  return {
    id: row.id,
    lockTxHash: row.lock_tx_hash,
    claimerName: row.claimer_name,
    claimerAddress: row.claimer_address,
    claimTxHash: row.claim_tx_hash,
    amountLovelace: row.amount_lovelace,
    createdAt: row.created_at,
  };
}

export class ClaimRepository {
  constructor(private readonly db: Database) {}

  create(lockTxHash: string, input: CreateClaimInput): Claim {
    const row: ClaimRow = {
      id: crypto.randomUUID(),
      lock_tx_hash: lockTxHash.toLowerCase(),
      claimer_name: input.claimerName ?? null,
      claimer_address: input.claimerAddress,
      claim_tx_hash: input.claimTxHash.toLowerCase(),
      amount_lovelace: input.amountLovelace,
      created_at: Date.now(),
    };
    try {
      this.db
        .query(
          `INSERT INTO claims
             (id, lock_tx_hash, claimer_name, claimer_address, claim_tx_hash,
              amount_lovelace, created_at)
           VALUES
             ($id, $lock_tx_hash, $claimer_name, $claimer_address,
              $claim_tx_hash, $amount_lovelace, $created_at)`,
        )
        .run({
          $id: row.id,
          $lock_tx_hash: row.lock_tx_hash,
          $claimer_name: row.claimer_name,
          $claimer_address: row.claimer_address,
          $claim_tx_hash: row.claim_tx_hash,
          $amount_lovelace: row.amount_lovelace,
          $created_at: row.created_at,
        });
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE")) {
        throw new ApiError(409, "This claim transaction is already recorded.");
      }
      throw err;
    }
    return toClaim(row);
  }

  listByGift(lockTxHash: string): Claim[] {
    const rows = this.db
      .query(
        "SELECT * FROM claims WHERE lock_tx_hash = $h ORDER BY created_at ASC",
      )
      .all({ $h: lockTxHash.toLowerCase() }) as ClaimRow[];
    return rows.map(toClaim);
  }
}
