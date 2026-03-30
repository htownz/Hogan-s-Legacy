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

const API_TOKEN = process.env.POLICY_INTEL_API_TOKEN ?? "";

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
