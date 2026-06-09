import { describe, it, expect } from "vitest";
import { decodeGiftCode, encodeGiftCode } from "./giftCode";

const TX = "a".repeat(64);

describe("gift code round-trip", () => {
  it("encodes and decodes the payload", () => {
    const payload = { t: TX, h: ["h", "a", "p", "p", "y"], d: 1_700_000_000_000 };
    const decoded = decodeGiftCode(encodeGiftCode(payload));
    expect(decoded).toEqual(payload);
  });

  it("handles unicode hints", () => {
    const payload = { t: TX, h: ["t", "ế", "t", "🧧"], d: 0 };
    const decoded = decodeGiftCode(encodeGiftCode(payload));
    expect(decoded.h).toEqual(payload.h);
  });

  it("does not contain the original ordering in plaintext", () => {
    const code = encodeGiftCode({ t: TX, h: ["x", "y", "z"], d: 0 });
    expect(code).not.toContain(TX);
  });
});

describe("decodeGiftCode fallbacks", () => {
  it("treats a bare 64-char hex string as a tx hash", () => {
    const decoded = decodeGiftCode(TX);
    expect(decoded.t).toBe(TX);
    expect(decoded.h).toEqual([]);
    expect(decoded.d).toBe(0);
  });

  it("lowercases a bare hex tx hash", () => {
    expect(decodeGiftCode("A".repeat(64)).t).toBe(TX);
  });

  it("throws on an unrecognized code", () => {
    expect(() => decodeGiftCode("!!!not-valid!!!")).toThrow();
  });
});
