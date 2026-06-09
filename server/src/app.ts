import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Database } from "bun:sqlite";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import type { ChainService } from "./services/chain";
import type { CardanoNetwork } from "./lib/address";
import { giftsRoutes } from "./routes/gifts";
import { healthRoutes } from "./routes/health";
import { ApiError } from "./lib/errors";

export interface AppDeps {
  db: Database;
  chain: ChainService;
  network: CardanoNetwork;
  corsOrigin?: string;
  /** Enable request logging (off by default in tests). */
  logging?: boolean;
}

export function createApp(deps: AppDeps) {
  const app = new Hono();

  if (deps.logging) app.use("*", logger());
  app.use("*", cors({ origin: deps.corsOrigin ?? "*" }));

  app.route("/api/health", healthRoutes());
  app.route("/api/gifts", giftsRoutes(deps));

  app.notFound((c) => c.json({ error: { message: "Not found." } }, 404));

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json(
        { error: { message: err.message, code: err.code } },
        err.status as ContentfulStatusCode,
      );
    }
    if (err instanceof ZodError) {
      return c.json(
        { error: { message: "Validation failed.", issues: err.issues } },
        400,
      );
    }
    if (err instanceof SyntaxError) {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    console.error(err);
    return c.json({ error: { message: "Internal server error." } }, 500);
  });

  return app;
}
