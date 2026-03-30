import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { createPolicyIntelRouter } from "./routes";
import { metrics } from "./metrics";

export function createPolicyIntelApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── HTTP metrics middleware ──
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const route = req.route?.path ?? req.path;
      const method = req.method;
      metrics.inc("policy_intel_http_requests_total", { method, route, status: String(res.statusCode) });
      metrics.observe("policy_intel_http_duration_ms", { method, route }, Date.now() - start);
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, app: "actup-policy-intel" });
  });

  // ── Prometheus metrics endpoint ──
  app.get("/metrics", (_req, res) => {
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(metrics.serialize());
  });

  app.use("/api/intel", createPolicyIntelRouter());

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({ message });
  });

  return app;
}
