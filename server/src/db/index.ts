import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS gifts (
  lock_tx_hash     TEXT PRIMARY KEY,
  code             TEXT,
  owner_address    TEXT NOT NULL,
  title            TEXT,
  message          TEXT,
  hint             TEXT NOT NULL DEFAULT '[]',
  secret_hash      TEXT,
  total_envelopes  INTEGER NOT NULL,
  total_lovelace   TEXT NOT NULL,
  deadline_ms      INTEGER NOT NULL,
  network          TEXT NOT NULL,
  created_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gifts_owner ON gifts(owner_address);

CREATE TABLE IF NOT EXISTS claims (
  id               TEXT PRIMARY KEY,
  lock_tx_hash     TEXT NOT NULL REFERENCES gifts(lock_tx_hash) ON DELETE CASCADE,
  claimer_name     TEXT,
  claimer_address  TEXT NOT NULL,
  claim_tx_hash    TEXT NOT NULL UNIQUE,
  amount_lovelace  TEXT NOT NULL,
  created_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claims_gift ON claims(lock_tx_hash);
`;

/** Open (or create) the SQLite database and apply the schema. Pass ":memory:"
 *  for an ephemeral database (used in tests). */
export function createDb(path: string): Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}
