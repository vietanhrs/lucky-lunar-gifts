import { describe, it, expect } from "vitest";
import {
  hashSecret,
  normalizeSecret,
  scrambleWord,
  secretToAnswerHex,
} from "./secret";

describe("normalizeSecret", () => {
  it("trims, lowercases and collapses whitespace", () => {
    expect(normalizeSecret("  Happy   New  Year ")).toBe("happy new year");
    expect(normalizeSecret("HELLO")).toBe("hello");
  });
});

describe("hashSecret", () => {
  it("matches the known sha2-256 vector for the normalized word", async () => {
    // sha256("happy new year") — must equal the value the validator compares.
    await expect(hashSecret("  Happy New Year  ")).resolves.toBe(
      "c4ad2dcce6c303133f00d55f88e13381a0fd352d267cb3d57f6572468018a659"
    );
  });

  it("is stable regardless of surrounding case/whitespace", async () => {
    const a = await hashSecret("Tết");
    const b = await hashSecret("  tết ");
    expect(a).toBe(b);
  });
});

describe("secretToAnswerHex", () => {
  it("hex-encodes the normalized UTF-8 bytes", () => {
    expect(secretToAnswerHex("Happy")).toBe("6861707079");
  });

  it("uses the same normalization as hashing", () => {
    expect(secretToAnswerHex("  HAPPY ")).toBe(secretToAnswerHex("happy"));
  });
});

describe("scrambleWord", () => {
  it("preserves the exact character multiset", () => {
    const word = "happy new year";
    const scrambled = scrambleWord(word);
    expect(scrambled.slice().sort()).toEqual(
      normalizeSecret(word).split("").sort()
    );
  });
});
