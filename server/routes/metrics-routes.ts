/**
 * Metrics routes — tipping-point metrics and user network impact.
 */
import { Router, type Request, type Response } from "express";
import { storage } from "../storage";

const router = Router();

// Tipping point metrics
router.get("/tipping-point", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const metrics = await storage.getLatestTippingPointMetrics();
    res.status(200).json(metrics);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving tipping point metrics" });
  }
});

// User network impact
router.get("/users/me/network-impact", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const impact = await storage.getUserNetworkImpactByUserId(req.session.userId);
    if (!impact) {
      return res.status(404).json({ message: "Network impact data not found" });
    }
    res.status(200).json(impact);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving network impact" });
  }
});

export default router;
