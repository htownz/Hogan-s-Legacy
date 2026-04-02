/**
 * Health & tech-stack routes.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

router.get("/tech-stack", (_req: Request, res: Response) => {
  res.sendFile("download_tech_stack.html", { root: "./client/public" });
});

router.get("/act_up_technical_stack.md", (_req: Request, res: Response) => {
  res.sendFile("act_up_technical_stack.md", { root: "./client/public" });
});

export default router;
