import { describe, it, expect, vi } from "vitest";
import { fetchGift, isBackendEnabled } from "./api";

describe("isBackendEnabled", () => {
  it("is false when VITE_API_BASE_URL is unset (default in tests)", () => {
    expect(isBackendEnabled()).toBe(false);
  });
});

describe("fetchGift", () => {
  it("returns null when the gift is not found", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Gift not found." } }), {
          status: 404,
        }),
      );
    expect(await fetchGift("a".repeat(64))).toBeNull();
    spy.mockRestore();
  });

  it("parses a successful response", async () => {
    const payload = { gift: { lockTxHash: "x" }, claims: [] };
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    const data = await fetchGift("a".repeat(64));
    expect(data?.gift.lockTxHash).toBe("x");
    spy.mockRestore();
  });
});
