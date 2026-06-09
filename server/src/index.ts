import { loadConfig } from "./config";
import { createDb } from "./db";
import { createApp } from "./app";
import { BlockfrostChainService } from "./services/chain";

const config = loadConfig();
const db = createDb(config.databasePath);
const chain = new BlockfrostChainService(
  config.blockfrostProjectId,
  config.network,
);
const app = createApp({
  db,
  chain,
  network: config.network,
  corsOrigin: config.corsOrigin,
  logging: true,
});

console.log(
  `🧧 Lucky ADA server listening on :${config.port} (${config.network})`,
);
console.log(`   gift script address: ${chain.scriptAddress}`);

export default {
  port: config.port,
  fetch: app.fetch,
};
