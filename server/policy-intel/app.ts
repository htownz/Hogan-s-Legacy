import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createPolicyIntelRouter } from "./routes";
import { policyIntelDb } from "./db";
import { sql } from "drizzle-orm";
import { metrics } from "./metrics";
import { authMiddleware } from "./auth";
import { safeErrorMessage } from "./security";
import { createLogger } from "./logger";

const log = createLogger("policy-intel");

export function createPolicyIntelApp() {
  const app = express();

  app.set("trust proxy", 1);

  // ── Security headers ──
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // allow loading cross-origin resources (e.g. legislator photos)
  }));

  const corsRaw = process.env.CORS_ORIGINS?.split(",").map(o => o.trim()).filter(Boolean);
  if ((!corsRaw || corsRaw.length === 0) && process.env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGINS must be set in production (comma-separated list of allowed origins)");
  }
  const allowedOrigins = corsRaw && corsRaw.length > 0
    ? corsRaw
    : ["http://localhost:5173", "http://localhost:5050"];
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Rate limiting ──
  const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later" },
  });

  const mutationLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_MUTATION_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MUTATION_MAX) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many write requests, please try again later" },
  });

  app.use("/api/intel", apiLimiter);
  app.use("/api/intel", (req, _res, next) => {
    if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") {
      return mutationLimiter(req, _res, next);
    }
    next();
  });

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

  // ── Liveness: always responds OK (container is running) ──
  app.get("/health/liveness", (_req, res) => {
    res.json({ ok: true, app: "actup-policy-intel" });
  });

  // ── Readiness: verifies DB connectivity ──
  app.get("/health", async (_req, res) => {
    try {
      await policyIntelDb.execute(sql`SELECT 1`);
      res.json({ ok: true, app: "actup-policy-intel" });
    } catch {
      res.status(503).json({ ok: false, app: "actup-policy-intel", error: "database unreachable" });
    }
  });

  // ── Prometheus metrics endpoint ──
  app.get("/metrics", (_req, res) => {
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(metrics.serialize());
  });

  app.use("/api/intel", authMiddleware, createPolicyIntelRouter());

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const message = safeErrorMessage(err);
    log.error({ method: req.method, path: req.path, err: message }, "request failed");
    const clientMessage = process.env.NODE_ENV === "production"
      ? "Internal server error"
      : message;
    res.status(500).json({ message: clientMessage });
  });

  return app;
}
