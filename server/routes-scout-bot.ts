import { Express, Request, Response } from "express";
import { z } from "zod";
import {
  addScoutBotAffiliation,
  addScoutBotMediaMention,
  createScoutBotProfile,
  deleteScoutBotAffiliation,
  deleteScoutBotMediaMention,
  deleteScoutBotProfile,
  getCompleteScoutBotProfile,
  getScoutBotAffiliations,
  getScoutBotMediaMentions,
  getScoutBotProfileById,
  getScoutBotProfiles,
  getScoutBotStatistics,
  searchScoutBotProfiles,
  updateScoutBotAffiliation,
  updateScoutBotMediaMention,
  updateScoutBotProfile,
  updateScoutBotProfileStatus,
} from "./storage-scout-bot";
import { CustomRequest } from "./types";
import { isAuthenticated } from "./auth";
import {
  insertScoutBotAffiliationSchema,
  insertScoutBotMediaMentionSchema,
  insertScoutBotProfileSchema,
} from "../shared/schema-scout-bot";

/**
 * Register Scout Bot API routes
 */
export function registerScoutBotRoutes(app: Express) {
  /**
   * Get all Scout Bot profiles with pagination and filters
   */
  app.get("/api/scout-bot/profiles", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      const limit = parseInt(req.query.limit as string || "20");
      const offset = parseInt(req.query.offset as string || "0");

      const result = await getScoutBotProfiles(status, type, limit, offset);
      
      res.json({
        profiles: result.profiles,
        pagination: {
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error("Error fetching scout bot profiles:", error);
      res.status(500).json({ error: "Failed to fetch scout bot profiles" });
    }
  });

  /**
   * Search Scout Bot profiles
   */
  app.get("/api/scout-bot/profiles/search", async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm || searchTerm.length < 2) {
        return res.status(400).json({ error: "Search term must be at least 2 characters" });
      }

      const limit = parseInt(req.query.limit as string || "20");
      const offset = parseInt(req.query.offset as string || "0");

      const result = await searchScoutBotProfiles(searchTerm, limit, offset);
      
      res.json({
        profiles: result.profiles,
        pagination: {
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error("Error searching scout bot profiles:", error);
      res.status(500).json({ error: "Failed to search scout bot profiles" });
    }
  });

  /**
   * Get Scout Bot statistics
   */
  app.get("/api/scout-bot/statistics", async (_req: Request, res: Response) => {
    try {
      const statistics = await getScoutBotStatistics();
      res.json(statistics);
    } catch (error: any) {
      console.error("Error fetching scout bot statistics:", error);
      res.status(500).json({ error: "Failed to fetch scout bot statistics" });
    }
  });

  /**
   * Get a specific Scout Bot profile by ID with all related data
   */
  app.get("/api/scout-bot/profiles/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await getCompleteScoutBotProfile(id);
      
      if (!result.profile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching scout bot profile:", error);
      res.status(500).json({ error: "Failed to fetch scout bot profile" });
    }
  });

  /**
   * Create a new Scout Bot profile
   */
  app.post("/api/scout-bot/profiles", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const validatedData = insertScoutBotProfileSchema.parse(req.body);
      
      const profile = await createScoutBotProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      console.error("Error creating scout bot profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create scout bot profile" });
    }
  });

  /**
   * Update a Scout Bot profile
   */
  app.patch("/api/scout-bot/profiles/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate update data
      const updateSchema = insertScoutBotProfileSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedProfile = await updateScoutBotProfile(id, validatedData);
      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error updating scout bot profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update scout bot profile" });
    }
  });

  /**
   * Update a Scout Bot profile status (approve/reject)
   */
  app.patch("/api/scout-bot/profiles/:id/status", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate request
      const statusSchema = z.object({
        status: z.enum(["pending", "approved", "rejected"]),
        reviewNotes: z.string().optional(),
      });
      
      const { status, reviewNotes } = statusSchema.parse(req.body);
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const userId = req.user?.id || "system";
      const updatedProfile = await updateScoutBotProfileStatus(id, status, userId, reviewNotes);
      
      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error updating scout bot profile status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update scout bot profile status" });
    }
  });

  /**
   * Delete a Scout Bot profile
   */
  app.delete("/api/scout-bot/profiles/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const result = await deleteScoutBotProfile(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete scout bot profile" });
      }
    } catch (error: any) {
      console.error("Error deleting scout bot profile:", error);
      res.status(500).json({ error: "Failed to delete scout bot profile" });
    }
  });

  /**
   * Get affiliations for a Scout Bot profile
   */
  app.get("/api/scout-bot/profiles/:id/affiliations", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const affiliations = await getScoutBotAffiliations(id);
      res.json(affiliations);
    } catch (error: any) {
      console.error("Error fetching scout bot affiliations:", error);
      res.status(500).json({ error: "Failed to fetch scout bot affiliations" });
    }
  });

  /**
   * Add an affiliation to a Scout Bot profile
   */
  app.post("/api/scout-bot/profiles/:id/affiliations", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create affiliation
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotAffiliationSchema.parse(data);
      
      const affiliation = await addScoutBotAffiliation(validatedData);
      res.status(201).json(affiliation);
    } catch (error: any) {
      console.error("Error adding scout bot affiliation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add scout bot affiliation" });
    }
  });

  /**
   * Update an affiliation
   */
  app.patch("/api/scout-bot/affiliations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate update data
      const updateSchema = insertScoutBotAffiliationSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedAffiliation = await updateScoutBotAffiliation(id, validatedData);
      
      if (!updatedAffiliation) {
        return res.status(404).json({ error: "Scout Bot affiliation not found" });
      }
      
      res.json(updatedAffiliation);
    } catch (error: any) {
      console.error("Error updating scout bot affiliation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update scout bot affiliation" });
    }
  });

  /**
   * Delete an affiliation
   */
  app.delete("/api/scout-bot/affiliations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteScoutBotAffiliation(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Scout Bot affiliation not found" });
      }
    } catch (error: any) {
      console.error("Error deleting scout bot affiliation:", error);
      res.status(500).json({ error: "Failed to delete scout bot affiliation" });
    }
  });

  /**
   * Get media mentions for a Scout Bot profile
   */
  app.get("/api/scout-bot/profiles/:id/media-mentions", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const mediaMentions = await getScoutBotMediaMentions(id);
      res.json(mediaMentions);
    } catch (error: any) {
      console.error("Error fetching scout bot media mentions:", error);
      res.status(500).json({ error: "Failed to fetch scout bot media mentions" });
    }
  });

  /**
   * Add a media mention to a Scout Bot profile
   */
  app.post("/api/scout-bot/profiles/:id/media-mentions", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create media mention
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotMediaMentionSchema.parse(data);
      
      const mediaMention = await addScoutBotMediaMention(validatedData);
      res.status(201).json(mediaMention);
    } catch (error: any) {
      console.error("Error adding scout bot media mention:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add scout bot media mention" });
    }
  });

  /**
   * Update a media mention
   */
  app.patch("/api/scout-bot/media-mentions/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate update data
      const updateSchema = insertScoutBotMediaMentionSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedMediaMention = await updateScoutBotMediaMention(id, validatedData);
      
      if (!updatedMediaMention) {
        return res.status(404).json({ error: "Scout Bot media mention not found" });
      }
      
      res.json(updatedMediaMention);
    } catch (error: any) {
      console.error("Error updating scout bot media mention:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update scout bot media mention" });
    }
  });

  /**
   * Delete a media mention
   */
  app.delete("/api/scout-bot/media-mentions/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteScoutBotMediaMention(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Scout Bot media mention not found" });
      }
    } catch (error: any) {
      console.error("Error deleting scout bot media mention:", error);
      res.status(500).json({ error: "Failed to delete scout bot media mention" });
    }
  });
}