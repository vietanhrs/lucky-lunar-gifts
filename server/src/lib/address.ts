import { bech32Encode, hexToBytes } from "./bech32";

export type CardanoNetwork = "mainnet" | "preprod" | "preview";

/**
 * Derive the bech32 enterprise address of a Plutus script from its hash.
 *
 * Shelley address = [ header byte ] ++ [ 28-byte script hash ], where the
 * header's high nibble is the address type (0b0111 = enterprise script) and the
 * low nibble is the network id (mainnet = 1, testnets = 0).
 */
export function scriptAddress(
  scriptHashHex: string,
  network: CardanoNetwork,
): string {
  const networkId = network === "mainnet" ? 1 : 0;
  const header = 0x70 | networkId;
  const hrp = networkId === 1 ? "addr" : "addr_test";
  const payload = new Uint8Array([header, ...hexToBytes(scriptHashHex)]);
  return bech32Encode(hrp, payload);
}
