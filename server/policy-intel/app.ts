import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { createPolicyIntelRouter } from "./routes";
import { metrics } from "./metrics";
import { authMiddleware } from "./auth";
import { safeErrorMessage } from "./security";

export function createPolicyIntelApp() {
  const app = express();

  app.set("trust proxy", 1);
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
    : ["http://localhost:5173", "http://localhost:5050"];
  app.use(cors({ origin: allowedOrigins, credentials: true }));
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

  app.use("/api/intel", authMiddleware, createPolicyIntelRouter());

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const message = safeErrorMessage(err);
    console.error(`[policy-intel] ${req.method} ${req.path} failed: ${message}`);
    res.status(500).json({ message });
  });

  return app;
}
