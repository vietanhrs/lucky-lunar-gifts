import { describe, it, expect } from "bun:test";
import { setup, validGift, json, hex, readJson } from "./helpers";

function acceptLock(chain: ReturnType<typeof setup>["chain"], g = validGift()) {
  chain.setLock(g.lockTxHash as string, {
    exists: true,
    scriptOutputCount: g.totalEnvelopes as number,
    scriptOutputLovelace: g.totalLovelace as string,
  });
  return g;
}

describe("POST /api/gifts", () => {
  it("registers a gift whose lock tx checks out on-chain", async () => {
    const { app, chain } = setup();
    const g = acceptLock(chain);
    const res = await app.request("/api/gifts", json(g));
    expect(res.status).toBe(201);
    const body = await readJson(res);
    expect(body.gift.lockTxHash).toBe(g.lockTxHash);
    expect(body.gift.hint).toEqual(g.hint);
    expect(body.gift.title).toBe(g.title);
  });

  it("rejects when the lock tx is not on-chain", async () => {
    const { app } = setup();
    const res = await app.request("/api/gifts", json(validGift()));
    expect(res.status).toBe(400);
    expect((await readJson(res)).error.message).toContain("not found on-chain");
  });

  it("rejects an envelope-count mismatch", async () => {
    const { app, chain } = setup();
    const g = validGift();
    chain.setLock(g.lockTxHash, {
      exists: true,
      scriptOutputCount: 5,
      scriptOutputLovelace: g.totalLovelace,
    });
    const res = await app.request("/api/gifts", json(g));
    expect(res.status).toBe(400);
    expect((await readJson(res)).error.message).toContain("count mismatch");
  });

  it("rejects a total-amount mismatch", async () => {
    const { app, chain } = setup();
    const g = validGift();
    chain.setLock(g.lockTxHash, {
      exists: true,
      scriptOutputCount: g.totalEnvelopes,
      scriptOutputLovelace: "999",
    });
    const res = await app.request("/api/gifts", json(g));
    expect(res.status).toBe(400);
    expect((await readJson(res)).error.message).toContain("amount mismatch");
  });

  it("rejects a network mismatch", async () => {
    const { app, chain } = setup();
    const g = acceptLock(chain, validGift({ network: "mainnet" }));
    const res = await app.request("/api/gifts", json(g));
    expect(res.status).toBe(400);
  });

  it("rejects invalid input with 400", async () => {
    const { app } = setup();
    const res = await app.request(
      "/api/gifts",
      json(validGift({ lockTxHash: "nope", totalEnvelopes: 0 })),
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 on duplicate registration", async () => {
    const { app, chain } = setup();
    const g = acceptLock(chain);
    expect((await app.request("/api/gifts", json(g))).status).toBe(201);
    const dup = await app.request("/api/gifts", json(g));
    expect(dup.status).toBe(409);
  });
});

describe("GET /api/gifts", () => {
  it("fetches a gift with an empty claims list", async () => {
    const { app, chain } = setup();
    const g = acceptLock(chain);
    await app.request("/api/gifts", json(g));
    const res = await app.request(`/api/gifts/${g.lockTxHash}`);
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.gift.lockTxHash).toBe(g.lockTxHash);
    expect(body.claims).toEqual([]);
  });

  it("404s for an unknown gift", async () => {
    const { app } = setup();
    const res = await app.request(`/api/gifts/${hex("b")}`);
    expect(res.status).toBe(404);
  });

  it("400s for a malformed hash", async () => {
    const { app } = setup();
    expect((await app.request("/api/gifts/not-a-hash")).status).toBe(400);
  });

  it("lists gifts filtered by owner", async () => {
    const { app, chain } = setup();
    const mine = acceptLock(chain, validGift({ ownerAddress: "addr_test1qme" }));
    const other = acceptLock(
      chain,
      validGift({ lockTxHash: hex("c"), ownerAddress: "addr_test1qother" }),
    );
    await app.request("/api/gifts", json(mine));
    await app.request("/api/gifts", json(other));

    const res = await app.request("/api/gifts?owner=addr_test1qme");
    const body = await readJson(res);
    expect(body.gifts).toHaveLength(1);
    expect(body.gifts[0].ownerAddress).toBe("addr_test1qme");
  });
});
