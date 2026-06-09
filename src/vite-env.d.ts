/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CARDANO_NETWORK?: "mainnet" | "preprod" | "preview";
  readonly VITE_BLOCKFROST_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
