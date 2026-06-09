import { describe, it, expect } from "bun:test";
import { setup, readJson } from "./helpers";

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const { app } = setup();
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect((await readJson(res)).status).toBe("ok");
  });

  it("404s unknown routes as JSON", async () => {
    const { app } = setup();
    const res = await app.request("/api/nope");
    expect(res.status).toBe(404);
    expect((await readJson(res)).error.message).toBe("Not found.");
  });
});
