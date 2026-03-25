import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { createPolicyIntelRouter } from "./routes";

export function createPolicyIntelApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, app: "actup-policy-intel" });
  });

  app.use("/api/intel", createPolicyIntelRouter());

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({ message });
  });

  return app;
}
