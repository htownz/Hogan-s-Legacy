import { Express, Request, Response } from "express";
import { z } from "zod";
import { CustomRequest } from "../types";
import { storage } from "../storage-verification";
import { isAuthenticated } from "../auth";
import { isAdmin, isUserAdminById } from "../middleware/auth-middleware";
import {
  insertLegislativeUpdateSchema,
  insertVerificationSchema,
  insertVerificationRuleSchema,
  insertVerificationSourceSchema,
  insertUserVerificationCredentialSchema
} from "@shared/schema";

export function registerVerificationRoutes(app: Express) {
  const getCurrentUserId = (req: CustomRequest): number | null => {
    if (req?.session?.userId && Number.isInteger(req.session.userId)) {
      return Number(req.session.userId);
    }
    if (req?.user?.id && Number.isInteger(req.user.id)) {
      return Number(req.user.id);
    }
    return null;
  };

  // ---- LEGISLATIVE UPDATES ROUTES ----
  
  // Get all legislative updates for a bill
  app.get("/api/verification/bill/:billId/updates", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const updates = await storage.getLegislativeUpdatesByBillId(billId);
      res.json(updates);
    } catch (error: any) {
      console.error("Error fetching legislative updates:", error);
      res.status(500).json({ error: "Failed to fetch legislative updates" });
    }
  });

  // Get recent legislative updates with optional limit
  app.get("/api/verification/updates/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const updates = await storage.getRecentLegislativeUpdates(limit);
      res.json(updates);
    } catch (error: any) {
      console.error("Error fetching recent updates:", error);
      res.status(500).json({ error: "Failed to fetch recent updates" });
    }
  });

  // Get pending legislative updates that need verification
  app.get("/api/verification/updates/pending", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const updates = await storage.getPendingLegislativeUpdates(limit);
      res.json(updates);
    } catch (error: any) {
      console.error("Error fetching pending updates:", error);
      res.status(500).json({ error: "Failed to fetch pending updates" });
    }
  });

  // Get verified legislative updates
  app.get("/api/verification/updates/verified", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const updates = await storage.getVerifiedLegislativeUpdates(limit);
      res.json(updates);
    } catch (error: any) {
      console.error("Error fetching verified updates:", error);
      res.status(500).json({ error: "Failed to fetch verified updates" });
    }
  });

  // Get a single legislative update by ID
  app.get("/api/verification/updates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const update = await storage.getLegislativeUpdateById(id);
      
      if (!update) {
        return res.status(404).json({ error: "Legislative update not found" });
      }
      
      res.json(update);
    } catch (error: any) {
      console.error("Error fetching legislative update:", error);
      res.status(500).json({ error: "Failed to fetch legislative update" });
    }
  });

  // Submit a new legislative update (requires authentication)
  app.post("/api/verification/updates", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const updateData = insertLegislativeUpdateSchema.parse({
        ...req.body,
        submittedBy: userId
      });
      
      const newUpdate = await storage.createLegislativeUpdate(updateData);
      
      // Check if user has verification credentials, if not create default one
      const credentials = await storage.getUserVerificationCredentialsByUserId(userId);
      if (credentials.length === 0) {
        await storage.createUserVerificationCredential({
          userId,
          credentialType: 'community_verified',
          verificationLevel: 1,
          verificationCount: 0,
          accuracyRate: 100,
          isActive: true
        });
      }
      
      res.status(201).json(newUpdate);
    } catch (error: any) {
      console.error("Error creating legislative update:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create legislative update" });
    }
  });

  // ---- VERIFICATION ROUTES ----
  
  // Get all verifications for a specific update
  app.get("/api/verification/updates/:updateId/verifications", async (req: Request, res: Response) => {
    try {
      const updateId = parseInt(req.params.updateId);
      const verifications = await storage.getVerificationsByUpdateId(updateId);
      res.json(verifications);
    } catch (error: any) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  // Submit a verification for an update (requires authentication)
  app.post("/api/verification/updates/:updateId/verify", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const updateId = parseInt(req.params.updateId);
      const userId = req.user!.id;
      
      // Check if update exists
      const update = await storage.getLegislativeUpdateById(updateId);
      if (!update) {
        return res.status(404).json({ error: "Legislative update not found" });
      }
      
      // Check if user already verified this update
      const existingVerification = await storage.getUserVerificationsByUpdateId(userId, updateId);
      if (existingVerification) {
        return res.status(400).json({ error: "You have already verified this update" });
      }
      
      // Create verification
      const verificationData = insertVerificationSchema.parse({
        ...req.body,
        updateId,
        userId
      });
      
      const newVerification = await storage.createVerification(verificationData);
      
      // Increment verification count on the update
      await storage.incrementVerificationCount(updateId);
      
      // Update user verification credentials
      // First, get user credentials or create default
      let credentials = await storage.getUserVerificationCredentialsByUserId(userId);
      let credential;
      
      if (credentials.length === 0) {
        credential = await storage.createUserVerificationCredential({
          userId,
          credentialType: 'community_verified',
          verificationLevel: 1,
          verificationCount: 1,
          accuracyRate: 100,
          isActive: true
        });
      } else {
        // Find matching credential type or use the first one
        credential = credentials.find(c => c.credentialType === 'community_verified') || credentials[0];
        await storage.incrementUserVerificationCount(userId, credential.credentialType);
      }
      
      // Check if update now meets verification threshold
      if (update.verificationCount + 1 >= update.verificationThreshold) {
        // Auto-update to verified status if threshold is met
        await storage.updateLegislativeUpdateStatus(updateId, 'verified');
      }
      
      res.status(201).json(newVerification);
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to submit verification" });
    }
  });

  // ---- VERIFICATION RULES ROUTES ----
  
  // Get all verification rules
  app.get("/api/verification/rules", async (_req: Request, res: Response) => {
    try {
      const rules = await storage.getAllVerificationRules();
      res.json(rules);
    } catch (error: any) {
      console.error("Error fetching verification rules:", error);
      res.status(500).json({ error: "Failed to fetch verification rules" });
    }
  });

  // Get verification rule by update type
  app.get("/api/verification/rules/:updateType", async (req: Request, res: Response) => {
    try {
      const { updateType } = req.params;
      const rule = await storage.getVerificationRuleByType(updateType);
      
      if (!rule) {
        return res.status(404).json({ error: "Verification rule not found" });
      }
      
      res.json(rule);
    } catch (error: any) {
      console.error("Error fetching verification rule:", error);
      res.status(500).json({ error: "Failed to fetch verification rule" });
    }
  });

  // Create a new verification rule (admin only)
  app.post("/api/verification/rules", isAuthenticated, isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const ruleData = insertVerificationRuleSchema.parse(req.body);
      const newRule = await storage.createVerificationRule(ruleData);
      res.status(201).json(newRule);
    } catch (error: any) {
      console.error("Error creating verification rule:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create verification rule" });
    }
  });

  // ---- VERIFICATION SOURCES ROUTES ----
  
  // Get all verification sources
  app.get("/api/verification/sources", async (_req: Request, res: Response) => {
    try {
      const sources = await storage.getAllVerificationSources();
      res.json(sources);
    } catch (error: any) {
      console.error("Error fetching verification sources:", error);
      res.status(500).json({ error: "Failed to fetch verification sources" });
    }
  });

  // Get verification sources by type
  app.get("/api/verification/sources/type/:sourceType", async (req: Request, res: Response) => {
    try {
      const { sourceType } = req.params;
      const sources = await storage.getVerificationSourcesByType(sourceType);
      res.json(sources);
    } catch (error: any) {
      console.error("Error fetching verification sources:", error);
      res.status(500).json({ error: "Failed to fetch verification sources" });
    }
  });

  // Add a trusted verification source (requires authentication)
  app.post("/api/verification/sources", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const sourceData = insertVerificationSourceSchema.parse({
        ...req.body,
        addedBy: userId
      });
      
      const newSource = await storage.createVerificationSource(sourceData);
      res.status(201).json(newSource);
    } catch (error: any) {
      console.error("Error adding verification source:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add verification source" });
    }
  });

  // ---- USER VERIFICATION CREDENTIALS ROUTES ----
  
  // Get user verification credentials
  app.get("/api/verification/users/:userId/credentials", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const credentials = await storage.getUserVerificationCredentialsByUserId(userId);
      res.json(credentials);
    } catch (error: any) {
      console.error("Error fetching user verification credentials:", error);
      res.status(500).json({ error: "Failed to fetch user verification credentials" });
    }
  });

  // Get current user's verification credentials (requires authentication)
  app.get("/api/verification/me/credentials", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const credentials = await storage.getUserVerificationCredentialsByUserId(userId);
      res.json(credentials);
    } catch (error: any) {
      console.error("Error fetching user verification credentials:", error);
      res.status(500).json({ error: "Failed to fetch user verification credentials" });
    }
  });

  // Update user verification credentials
  app.put("/api/verification/users/:userId/credentials/:credentialType", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { credentialType } = req.params;

      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const canEdit = currentUserId === userId || isUserAdminById(currentUserId);
      if (!canEdit) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const data = req.body;
      const updatedCredential = await storage.updateUserVerificationCredential(userId, credentialType, data);
      
      if (!updatedCredential) {
        return res.status(404).json({ error: "Credential not found" });
      }
      
      res.json(updatedCredential);
    } catch (error: any) {
      console.error("Error updating verification credential:", error);
      res.status(500).json({ error: "Failed to update verification credential" });
    }
  });
}