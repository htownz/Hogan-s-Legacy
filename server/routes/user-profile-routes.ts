/**
 * User profile, role, milestone routes.
 */
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { superUserStorage } from "../storage-super-user";
import { insertSuperUserRoleSchema } from "@shared/schema";
import { createLogger } from "../logger";

const log = createLogger("routes-user-profile");
const router = Router();

// GET /api/users/me
router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving user" });
  }
});

// GET /api/users/me/role
router.get("/me/role", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userRoles = await superUserStorage.getSuperUserRolesByUserId(req.session.userId);
    const userRole = userRoles[0];
    if (!userRole) {
      return res.status(404).json({ message: "User role not found" });
    }
    res.status(200).json(userRole);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving user role" });
  }
});

// PUT /api/users/me/role
router.put("/me/role", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const roleData = insertSuperUserRoleSchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    const updatedRole = await superUserStorage.updateSuperUserRole(req.session.userId, roleData);
    res.status(200).json(updatedRole);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({ message: "Error updating user role" });
    }
  }
});

// GET /api/users/me/milestones
router.get("/me/milestones", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const milestones = await superUserStorage.getProgressionMilestonesByUserId(req.session.userId);
    res.status(200).json(milestones);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving milestones" });
  }
});

// PUT /api/users/me/milestones/:id
router.put("/me/milestones/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const milestoneId = parseInt(req.params.id);
    const milestoneData = z
      .object({
        progress: z.number().optional(),
        completed: z.boolean().optional(),
      })
      .parse(req.body);
    const updatedMilestone = await superUserStorage.updateProgressionMilestone(
      milestoneId,
      milestoneData,
    );
    if (!updatedMilestone) {
      return res.status(404).json({ message: "Milestone not found or does not belong to user" });
    }
    res.status(200).json(updatedMilestone);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({ message: "Error updating milestone" });
    }
  }
});

// GET /api/users/me/network-impact
router.get("/me/network-impact", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const impact = await (storage as any).getUserNetworkImpactByUserId(req.session.userId);
    if (!impact) {
      return res.status(404).json({ message: "Network impact data not found" });
    }
    res.status(200).json(impact);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving network impact" });
  }
});

export default router;
