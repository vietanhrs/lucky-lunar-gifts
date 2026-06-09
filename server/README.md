# 🧧 Lucky ADA — Backend Service

A metadata/registry API for the Lucky ADA gift dApp. The Cardano chain is the
source of truth for funds; this service stores the things that can't live
on-chain — gift titles, messages, the puzzle hint, and claim records (including
claimer names) — and **verifies every write against the chain** before
accepting it.

Built with [Bun](https://bun.sh), [Hono](https://hono.dev), and SQLite
(`bun:sqlite`). Validation with [Zod](https://zod.dev).

## How it works

- A "gift" is identified by its **lock transaction hash**. Each red envelope is
  a UTxO at the `gift` validator's script address.
- **Strict on-chain verification (mandatory).** A `BLOCKFROST_PROJECT_ID` is
  required. When a gift is registered, the service confirms the lock tx exists
  and that its outputs to the script address match the submitted envelope count
  and total. When a claim is recorded, it confirms the claim tx exists and
  actually spends one of that gift's envelopes.
- The script address is derived from the `gift` validator hash (see
  `src/contracts/giftScript.ts`) — keep that in sync with `contracts/plutus.json`.

## Getting started

```sh
cd server
bun install
cp .env.example .env   # then set BLOCKFROST_PROJECT_ID
bun run dev            # http://localhost:8787
```

### Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `bun run dev`      | Start with watch/reload              |
| `bun run start`    | Start the server                     |
| `bun test`         | Run the test suite (in-memory DB)    |
| `bun run typecheck`| Type-check with `tsc`                |

## Configuration

| Variable                | Default                 | Description                                   |
| ----------------------- | ----------------------- | --------------------------------------------- |
| `PORT`                  | `8787`                  | Listen port                                   |
| `DATABASE_PATH`         | `./data/lucky-ada.db`   | SQLite file (`:memory:` for ephemeral)        |
| `CORS_ORIGIN`           | `*`                     | Allowed CORS origin                           |
| `CARDANO_NETWORK`       | `preprod`               | `mainnet` \| `preprod` \| `preview`           |
| `BLOCKFROST_PROJECT_ID` | — (**required**)        | Blockfrost key for the same network           |

## API

All responses are JSON. Errors are `{ "error": { "message", "code?" } }`.

### `GET /api/health`
Liveness probe → `{ "status": "ok", "time": <ms> }`.

### `POST /api/gifts`
Register a gift after its lock tx is on-chain.

```jsonc
{
  "lockTxHash": "<64-hex>",      // required
  "ownerAddress": "addr_test1...", // required
  "totalEnvelopes": 2,             // required, must match chain
  "totalLovelace": "20000000",     // required, must match chain
  "deadlineMs": 1900000000000,     // required
  "network": "preprod",            // required, must match server
  "code": "<gift code>",           // optional
  "title": "Tết lì xì",           // optional
  "message": "Happy New Year!",    // optional
  "hint": ["h","a","p","p","y"],   // optional — scrambled letters
  "secretHash": "<64-hex>"         // optional
}
```
`201` → `{ "gift": Gift }`. `400` on validation/chain-mismatch, `409` if already registered.

### `GET /api/gifts?owner=<address>&limit=&offset=`
List gifts (optionally by owner) → `{ "gifts": Gift[] }`.

### `GET /api/gifts/:lockTxHash`
One gift with its claims → `{ "gift": Gift, "claims": Claim[] }`. `404` if unknown.

### `POST /api/gifts/:lockTxHash/claims`
Record a claim after its tx is on-chain.

```jsonc
{
  "claimTxHash": "<64-hex>",       // required, must spend the gift on-chain
  "claimerAddress": "addr_test1...", // required
  "amountLovelace": "10000000",    // required
  "claimerName": "Alice"           // optional
}
```
`201` → `{ "claim": Claim }`. `400` on validation/chain-mismatch, `404` if the gift is unknown, `409` if the claim tx is already recorded.

### `GET /api/gifts/:lockTxHash/claims`
List a gift's claims → `{ "claims": Claim[] }`.

## Docker

```sh
docker build -t lucky-ada-server ./server
docker run -p 8787:8787 \
  -e BLOCKFROST_PROJECT_ID=preprod... \
  -e CARDANO_NETWORK=preprod \
  -v "$PWD/data:/app/data" \
  lucky-ada-server
```

## Notes

- The service is advisory metadata on top of the chain; even with strict
  verification it never holds funds. The validator and the lock/claim/refund
  transactions remain the real enforcement.
- SQLite suits a single-instance deployment. For horizontal scaling, swap the
  repository layer (`src/repositories/`) for a client/server database.
