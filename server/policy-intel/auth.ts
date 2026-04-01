/**
 * Simple bearer-token auth middleware for Policy Intel.
 *
 * Set POLICY_INTEL_API_TOKEN in env to enable.
 * When set, all requests to /api/intel/* (except /health and /metrics)
 * must include:
 *   Authorization: Bearer <token>
 *
 * When the env var is empty or unset, auth is disabled (open access).
 */
import type { Request, Response, NextFunction } from "express";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function resolveApiToken(): string {
  const token = process.env.POLICY_INTEL_API_TOKEN;
  return typeof token === "string" ? token.trim() : "";
}

const API_TOKEN = resolveApiToken();

export function validatePolicyIntelAuthConfiguration(): void {
  if (IS_PRODUCTION && !API_TOKEN) {
    throw new Error("POLICY_INTEL_API_TOKEN must be set in production");
  }
}

/** Paths that never require auth */
const PUBLIC_PATHS = new Set(["/health", "/", "/metrics"]);

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip if auth is not configured
  if (!API_TOKEN) return next();

  // Allow public paths through
  if (PUBLIC_PATHS.has(req.path)) return next();

  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header required (Bearer <token>)" });
  }

  const token = header.slice(7).trim();
  if (token !== API_TOKEN) {
    return res.status(403).json({ message: "Invalid API token" });
  }

  next();
}
