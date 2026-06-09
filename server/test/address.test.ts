import { describe, it, expect } from "bun:test";
import { scriptAddress } from "../src/lib/address";
import { GIFT_SCRIPT_HASH } from "../src/contracts/giftScript";

describe("scriptAddress", () => {
  it("derives the testnet gift script address (matches Mesh)", () => {
    expect(scriptAddress(GIFT_SCRIPT_HASH, "preprod")).toBe(
      "addr_test1wz5htpm9vgzw4depw6nag4afjhqv7nrmp6x3n557n6tff6cprkxkv",
    );
  });

  it("derives a mainnet address with the addr prefix", () => {
    const addr = scriptAddress(GIFT_SCRIPT_HASH, "mainnet");
    expect(addr.startsWith("addr1")).toBe(true);
  });

  it("uses the same address for both testnets", () => {
    expect(scriptAddress(GIFT_SCRIPT_HASH, "preprod")).toBe(
      scriptAddress(GIFT_SCRIPT_HASH, "preview"),
    );
  });
});
