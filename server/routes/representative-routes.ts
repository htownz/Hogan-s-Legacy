/**
 * Representative tracking and lookup routes.
 */
import { Router } from "express";
import { storage } from "../storage";
import { createLogger } from "../logger";

const log = createLogger("routes-representatives");
const router = Router();

// GET /api/representatives
router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const district = (req.query.district as string) || user.district;
    let representatives;
    if (district) {
      representatives = await storage.getRepresentativesByDistrict(district);
    } else {
      representatives = await storage.getAllRepresentatives();
    }
    res.status(200).json(representatives);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving representatives" });
  }
});

// GET /api/representatives/:id/responses
router.get("/:id/responses", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const repId = parseInt(req.params.id);
    const responses = await storage.getRepResponsesByRepId(repId);
    res.status(200).json(responses);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving representative responses" });
  }
});

// POST /api/representatives/:id/track
router.post("/:id/track", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const repId = parseInt(req.params.id);
    const representative = await storage.getRepresentativeById(repId);
    if (!representative) {
      return res.status(404).json({ message: "Representative not found" });
    }
    const existingTracking = await storage.getUserRepTracking(req.session.userId, repId);
    if (existingTracking) {
      return res.status(409).json({ message: "User is already tracking this representative" });
    }
    const tracking = await storage.createUserRepTracking({
      userId: req.session.userId,
      repId,
    });
    res.status(201).json(tracking);
  } catch (error: any) {
    res.status(500).json({ message: "Error tracking representative" });
  }
});

// GET /api/tipping-point
router.get("/tipping-point", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const metrics = await (storage as any).getLatestTippingPointMetrics();
    res.status(200).json(metrics);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving tipping point metrics" });
  }
});

export default router;
