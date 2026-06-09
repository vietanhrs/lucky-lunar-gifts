# 🧧 Lucky ADA — Smart Contracts

On-chain [Aiken](https://aiken-lang.org) validators for the Lucky ADA gift dApp,
targeting **Plutus V3**.

## Overview

A "gift" is a set of red-envelope UTxOs locked at the `gift` validator's script
address. Every envelope carries a `GiftDatum`. Recipients claim an envelope by
revealing the secret word; the owner can reclaim unclaimed envelopes after a
deadline.

### `gift` validator

**Datum — `GiftDatum`**

| Field         | Type                  | Description                                                                 |
| ------------- | --------------------- | --------------------------------------------------------------------------- |
| `secret_hash` | `ByteArray`           | `sha2_256` of the **normalized** secret word. Plaintext is never on-chain.  |
| `owner`       | `VerificationKeyHash` | Key allowed to refund after the deadline.                                   |
| `deadline`    | `Int`                 | POSIX time in **milliseconds**; owner may refund on/after this time.        |

**Redeemer — `GiftRedeemer`**

- `Claim { answer: ByteArray }` — succeeds when `sha2_256(answer) == secret_hash`.
  The claimant builds a transaction that spends the envelope and pays the value
  to their own address.
- `Refund` — succeeds when the transaction is signed by `owner` **and** its
  validity range starts on/after `deadline` (a finite lower bound is required,
  so an unbounded range cannot bypass the deadline).

### Security notes

- **Hash-lock trade-off:** once the first `Claim` is submitted, the preimage is
  public on-chain. Anyone could then claim the *remaining* envelopes sharing the
  same secret. This matches the product model (a secret shared among
  family/friends) but is an intentional, documented limitation.
- **Normalization:** the off-chain code must normalize the word (e.g. trim +
  lowercase) identically before hashing — both when locking (`secret_hash`) and
  when claiming (`answer`) — or the hashes will never match.

## Development

Requires the [Aiken toolchain](https://aiken-lang.org/installation-instructions)
(`v1.1.22`, matching `aiken.toml`).

```sh
aiken check        # type-check + run tests
aiken build        # compile and emit ./plutus.json (the blueprint)
aiken fmt          # format sources
aiken docs         # generate HTML docs
```

`aiken check -m <pattern>` runs only matching tests.

## Blueprint

`aiken build` produces **`plutus.json`** (CIP-57 blueprint) at the project root.
This file is committed so the web client can import the compiled validator,
derive the script address, and build claim/refund transactions with the Mesh
SDK. Re-run `aiken build` and commit the updated `plutus.json` whenever a
validator changes.
