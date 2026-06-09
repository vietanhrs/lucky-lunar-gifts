import {
  applyParamsToScript,
  BlockfrostProvider,
  MeshTxBuilder,
  serializePlutusScript,
} from "@meshsdk/core";
import blueprint from "@/contracts/plutus.json";

export type CardanoNetwork = "mainnet" | "preprod" | "preview";

/** Network we target, from VITE_CARDANO_NETWORK (defaults to preprod). */
export const NETWORK: CardanoNetwork =
  (import.meta.env.VITE_CARDANO_NETWORK as CardanoNetwork) ?? "preprod";

const BLOCKFROST_PROJECT_ID = import.meta.env.VITE_BLOCKFROST_PROJECT_ID ?? "";

/** Address network tag: mainnet = 1, all testnets = 0. */
export const NETWORK_ID = NETWORK === "mainnet" ? 1 : 0;

/** Whether the Blockfrost provider has been configured via env. */
export function isConfigured(): boolean {
  return BLOCKFROST_PROJECT_ID.length > 0;
}

let provider: BlockfrostProvider | null = null;

/** Lazily-created Blockfrost provider, used as fetcher/submitter/evaluator. */
export function getProvider(): BlockfrostProvider {
  if (!isConfigured()) {
    throw new Error(
      "Blockfrost is not configured. Set VITE_BLOCKFROST_PROJECT_ID and VITE_CARDANO_NETWORK in your .env file.",
    );
  }
  if (!provider) provider = new BlockfrostProvider(BLOCKFROST_PROJECT_ID);
  return provider;
}

// The `gift` validator, encoded exactly the way its on-chain hash was derived
// (applyParamsToScript with no parameters), so the script address and witness
// match the blueprint hash.
export const GIFT_SCRIPT_CBOR = applyParamsToScript(
  blueprint.validators[0].compiledCode,
  [],
);

export const GIFT_SCRIPT_HASH = blueprint.validators[0].hash;

export const GIFT_SCRIPT_ADDRESS = serializePlutusScript(
  { code: GIFT_SCRIPT_CBOR, version: "V3" },
  undefined,
  NETWORK_ID,
).address;

/** A fresh transaction builder wired to the Blockfrost provider. */
export function getTxBuilder(): MeshTxBuilder {
  const p = getProvider();
  return new MeshTxBuilder({
    fetcher: p,
    submitter: p,
    evaluator: p,
    verbose: false,
  });
}
