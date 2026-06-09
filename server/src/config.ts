import type { CardanoNetwork } from "./lib/address";

export interface Config {
  port: number;
  databasePath: string;
  corsOrigin: string;
  blockfrostProjectId: string;
  network: CardanoNetwork;
}

const NETWORKS: CardanoNetwork[] = ["mainnet", "preprod", "preview"];

/**
 * Load and validate configuration from the environment. On-chain verification
 * is mandatory, so a Blockfrost project id is required.
 */
export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): Config {
  const network = (env.CARDANO_NETWORK ?? "preprod") as CardanoNetwork;
  if (!NETWORKS.includes(network)) {
    throw new Error(
      `Invalid CARDANO_NETWORK "${network}". Expected one of: ${NETWORKS.join(", ")}.`,
    );
  }

  const blockfrostProjectId = env.BLOCKFROST_PROJECT_ID ?? "";
  if (!blockfrostProjectId) {
    throw new Error(
      "BLOCKFROST_PROJECT_ID is required — the service verifies every gift and claim on-chain.",
    );
  }

  return {
    port: Number(env.PORT ?? "8787"),
    databasePath: env.DATABASE_PATH ?? "./data/lucky-ada.db",
    corsOrigin: env.CORS_ORIGIN ?? "*",
    blockfrostProjectId,
    network,
  };
}
