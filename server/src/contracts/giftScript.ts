// Hash of the `gift` validator, taken from the Aiken blueprint
// (contracts/plutus.json, validator "gift.gift.spend"). The backend derives the
// script address from this hash to recognize a gift's envelope outputs on-chain.
//
// Keep this in sync with the contracts project: re-run `aiken build` and update
// the value here if the validator ever changes.
export const GIFT_SCRIPT_HASH =
  "a97587656204eab72176a7d457a995c0cf4c7b0e8d19d29e9e9694eb";
