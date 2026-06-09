import { describe, it, expect } from "bun:test";
import { setup, validGift, json, hex, readJson } from "./helpers";

async function registerGift(app: ReturnType<typeof setup>["app"], chain: ReturnType<typeof setup>["chain"]) {
  const g = validGift();
  chain.setLock(g.lockTxHash, {
    exists: true,
    scriptOutputCount: g.totalEnvelopes,
    scriptOutputLovelace: g.totalLovelace,
  });
  await app.request("/api/gifts", json(g));
  return g;
}

const claimBody = (overrides: Record<string, unknown> = {}) => ({
  claimerName: "Alice",
  claimerAddress: "addr_test1qalice",
  claimTxHash: hex("d"),
  amountLovelace: "10000000",
  ...overrides,
});

describe("POST /api/gifts/:hash/claims", () => {
  it("records a claim whose tx spent the gift on-chain", async () => {
    const { app, chain } = setup();
    const g = await registerGift(app, chain);
    const claim = claimBody();
    chain.setClaim(claim.claimTxHash, { exists: true, spendsGift: true });

    const res = await app.request(`/api/gifts/${g.lockTxHash}/claims`, json(claim));
    expect(res.status).toBe(201);
    const body = await readJson(res);
    expect(body.claim.claimerName).toBe("Alice");
    expect(body.claim.lockTxHash).toBe(g.lockTxHash);
  });

  it("404s when the gift is unknown", async () => {
    const { app, chain } = setup();
    const claim = claimBody();
    chain.setClaim(claim.claimTxHash, { exists: true, spendsGift: true });
    const res = await app.request(`/api/gifts/${hex("e")}/claims`, json(claim));
    expect(res.status).toBe(404);
  });

  it("rejects a claim tx that is not on-chain", async () => {
    const { app, chain } = setup();
    const g = await registerGift(app, chain);
    const res = await app.request(`/api/gifts/${g.lockTxHash}/claims`, json(claimBody()));
    expect(res.status).toBe(400);
    expect((await readJson(res)).error.message).toContain("not found on-chain");
  });

  it("rejects a claim tx that does not spend the gift", async () => {
    const { app, chain } = setup();
    const g = await registerGift(app, chain);
    const claim = claimBody();
    chain.setClaim(claim.claimTxHash, { exists: true, spendsGift: false });
    const res = await app.request(`/api/gifts/${g.lockTxHash}/claims`, json(claim));
    expect(res.status).toBe(400);
    expect((await readJson(res)).error.message).toContain("does not spend");
  });

  it("returns 409 on a duplicate claim tx", async () => {
    const { app, chain } = setup();
    const g = await registerGift(app, chain);
    const claim = claimBody();
    chain.setClaim(claim.claimTxHash, { exists: true, spendsGift: true });
    expect((await app.request(`/api/gifts/${g.lockTxHash}/claims`, json(claim))).status).toBe(201);
    const dup = await app.request(`/api/gifts/${g.lockTxHash}/claims`, json(claim));
    expect(dup.status).toBe(409);
  });
});

describe("GET /api/gifts/:hash/claims", () => {
  it("lists claims and surfaces them on the gift", async () => {
    const { app, chain } = setup();
    const g = await registerGift(app, chain);
    const claim = claimBody();
    chain.setClaim(claim.claimTxHash, { exists: true, spendsGift: true });
    await app.request(`/api/gifts/${g.lockTxHash}/claims`, json(claim));

    const list = await app.request(`/api/gifts/${g.lockTxHash}/claims`);
    expect((await readJson(list)).claims).toHaveLength(1);

    const gift = await app.request(`/api/gifts/${g.lockTxHash}`);
    expect((await readJson(gift)).claims[0].claimerName).toBe("Alice");
  });
});
