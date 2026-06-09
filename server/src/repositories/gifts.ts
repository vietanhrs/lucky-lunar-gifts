import type { Database } from "bun:sqlite";
import type { Gift } from "../types";
import type { CreateGiftInput } from "../lib/validation";
import { ApiError } from "../lib/errors";

interface GiftRow {
  lock_tx_hash: string;
  code: string | null;
  owner_address: string;
  title: string | null;
  message: string | null;
  hint: string;
  secret_hash: string | null;
  total_envelopes: number;
  total_lovelace: string;
  deadline_ms: number;
  network: string;
  created_at: number;
}

function toGift(row: GiftRow): Gift {
  return {
    lockTxHash: row.lock_tx_hash,
    code: row.code,
    ownerAddress: row.owner_address,
    title: row.title,
    message: row.message,
    hint: JSON.parse(row.hint) as string[],
    secretHash: row.secret_hash,
    totalEnvelopes: row.total_envelopes,
    totalLovelace: row.total_lovelace,
    deadlineMs: row.deadline_ms,
    network: row.network,
    createdAt: row.created_at,
  };
}

export class GiftRepository {
  constructor(private readonly db: Database) {}

  exists(lockTxHash: string): boolean {
    const row = this.db
      .query("SELECT 1 FROM gifts WHERE lock_tx_hash = $h")
      .get({ $h: lockTxHash.toLowerCase() });
    return row != null;
  }

  create(input: CreateGiftInput): Gift {
    const row: GiftRow = {
      lock_tx_hash: input.lockTxHash.toLowerCase(),
      code: input.code ?? null,
      owner_address: input.ownerAddress,
      title: input.title ?? null,
      message: input.message ?? null,
      hint: JSON.stringify(input.hint ?? []),
      secret_hash: input.secretHash?.toLowerCase() ?? null,
      total_envelopes: input.totalEnvelopes,
      total_lovelace: input.totalLovelace,
      deadline_ms: input.deadlineMs,
      network: input.network,
      created_at: Date.now(),
    };
    try {
      this.db
        .query(
          `INSERT INTO gifts
             (lock_tx_hash, code, owner_address, title, message, hint,
              secret_hash, total_envelopes, total_lovelace, deadline_ms,
              network, created_at)
           VALUES
             ($lock_tx_hash, $code, $owner_address, $title, $message, $hint,
              $secret_hash, $total_envelopes, $total_lovelace, $deadline_ms,
              $network, $created_at)`,
        )
        .run({
          $lock_tx_hash: row.lock_tx_hash,
          $code: row.code,
          $owner_address: row.owner_address,
          $title: row.title,
          $message: row.message,
          $hint: row.hint,
          $secret_hash: row.secret_hash,
          $total_envelopes: row.total_envelopes,
          $total_lovelace: row.total_lovelace,
          $deadline_ms: row.deadline_ms,
          $network: row.network,
          $created_at: row.created_at,
        });
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE")) {
        throw new ApiError(409, "This gift is already registered.");
      }
      throw err;
    }
    return toGift(row);
  }

  getByLockTxHash(lockTxHash: string): Gift | null {
    const row = this.db
      .query("SELECT * FROM gifts WHERE lock_tx_hash = $h")
      .get({ $h: lockTxHash.toLowerCase() }) as GiftRow | null;
    return row ? toGift(row) : null;
  }

  listByOwner(owner: string, limit: number, offset: number): Gift[] {
    const rows = this.db
      .query(
        "SELECT * FROM gifts WHERE owner_address = $o ORDER BY created_at DESC LIMIT $l OFFSET $off",
      )
      .all({ $o: owner, $l: limit, $off: offset }) as GiftRow[];
    return rows.map(toGift);
  }

  list(limit: number, offset: number): Gift[] {
    const rows = this.db
      .query("SELECT * FROM gifts ORDER BY created_at DESC LIMIT $l OFFSET $off")
      .all({ $l: limit, $off: offset }) as GiftRow[];
    return rows.map(toGift);
  }
}
