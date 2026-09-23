import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppConfig } from "./config.js";
import { RunStore, ValidationError, validateNewRun } from "./runs.js";

export const APP_VERSION = "1.0.0";

export interface AppContext {
  config: AppConfig;
  store: RunStore;
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

export function createApp({ config, store }: AppContext): Express {
  const app = express();
  app.use(express.json());
  app.use(express.static(publicDir));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: APP_VERSION, region: config.region });
  });

  app.get("/api/runs", (req, res) => {
    const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
    res.json(store.list(vehicleId));
  });

  app.get("/api/runs/:id", (req, res) => {
    const run = store.get(req.params.id);
    if (!run) return res.status(404).json({ error: "run not found", id: req.params.id });
    return res.json(run);
  });

  app.patch("/api/runs/:id/status", (req, res) => {
    const run = store.get(req.params.id);
    if (!run) return res.status(404).json({ error: "run not found", id: req.params.id });

    const requestedStatus = req.body?.status;
    const to = typeof requestedStatus === "string" ? requestedStatus : null;
    if (run.status === "planned" && to === "running") {
      return res.json(store.updateStatus(req.params.id, "running"));
    }
    if (run.status === "running" && to === "done") {
      return res.json(store.updateStatus(req.params.id, "done"));
    }

    return res.status(409).json({ error: "invalid transition", from: run.status, to });
  });

  app.post("/api/runs", (req, res) => {
    const input = validateNewRun(req.body);
    const run = store.create(input);
    res.status(201).json(run);
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message, details: err.details });
    }
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: "invalid JSON body" });
    }
    console.error(JSON.stringify({ level: "error", msg: "unhandled", err: String(err) }));
    return res.status(500).json({ error: "internal error" });
  });

  return app;
}
