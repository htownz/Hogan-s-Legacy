// @ts-nocheck
import { Router, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { 
  getUserInterests, 
  createUserInterests, 
  updateUserInterests, 
  deleteUserInterests,
  getUserBillRecommendations,
  getBillRecommendation,
  updateBillRecommendationStatus,
  generateRecommendationsForUser,
  getRecommendedBillsWithDetails
} from "./storage-interests";
import { z } from "zod";
import { inferUserInterestsFromBills } from "./services/bill-recommendation-service";
import { storage } from "./storage";

const router = Router();

// Validation schemas
const interestsSchema = z.object({
  topics: z.array(z.string()).optional(),
  causes: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  settings: z.string().optional()
});

const recommendationStatusSchema = z.object({
  viewed: z.boolean().optional(),
  saved: z.boolean().optional(),
  dismissed: z.boolean().optional()
});

/**
 * Get current user's interests
 */
router.get("/interests", isAuthenticated, async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const interests = await getUserInterests(userId);
    
    if (interests.length === 0) {
      return res.json({
        topics: [],
        causes: [],
        keywords: [],
        settings: "{}"
      });
    }
    
    res.json(interests[0]);
  } catch (error: any) {
    console.error("Error fetching user interests:", error);
    res.status(500).json({ error: "Failed to fetch user interests" });
  }
});

/**
 * Create or update user interests
 */
router.post("/interests", isAuthenticated, async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = interestsSchema.parse(req.body);
    
    // Check if user already has interests
    const existingInterests = await getUserInterests(userId);
    
    if (existingInterests.length === 0) {
      // Create new interests
      const created = await createUserInterests({
        userId,
        ...validatedData
      });
      
      res.status(201).json(created[0]);
    } else {
      // Update existing interests
      const updated = await updateUserInterests(userId, validatedData);
      res.json(updated[0]);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid interest data", details: error.errors });
    } else {
      console.error("Error creating/updating user interests:", error);
      res.status(500).json({ error: "Failed to save user interests" });
    }
  }
});

/**
 * Infer user interests based on bill interactions
 */
router.post("/interests/infer", isAuthenticated, async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get bills the user has tracked
    const trackedBills = await storage.getUserTrackedBills(userId);
    
    // Store bills in a map (in case we add more sources in the future)
    const billMap = new Map();
    trackedBills.forEach((bill: any) => {
      billMap.set(bill.id, bill);
    });
    
    const userBills = Array.from(billMap.values());
    
    if (userBills.length === 0) {
      return res.status(400).json({ error: "Not enough bill interaction data to infer interests" });
    }
    
    // Infer interests from bills
    const inferredInterests = await inferUserInterestsFromBills(userBills);
    
    // Get existing user interests
    const existingInterests = await getUserInterests(userId);
    
    if (existingInterests.length === 0) {
      // Create new interests based on inference
      const created = await createUserInterests({
        userId,
        topics: inferredInterests,
        causes: [],
        keywords: []
      });
      
      res.json({
        interests: created[0],
        inferred: true,
        source: "bill_interactions",
        billCount: userBills.length
      });
    } else {
      // Update existing interests with inferred topics
      const currentInterests = existingInterests[0];
      const currentTopics = currentInterests.topics || [];
      
      // Merge existing and inferred topics without duplicates
      const allTopics = new Set([...currentTopics, ...inferredInterests]);
      
      const updated = await updateUserInterests(userId, {
        topics: Array.from(allTopics)
      });
      
      res.json({
        interests: updated[0],
        inferred: true,
        source: "bill_interactions",
        billCount: userBills.length
      });
    }
  } catch (error: any) {
    console.error("Error inferring user interests:", error);
    res.status(500).json({ error: "Failed to infer user interests" });
  }
});

/**
 * Get bill recommendations for current user
 */
router.get("/recommendations", isAuthenticated, async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const includeViewed = req.query.includeViewed === "true";
    const includeDismissed = req.query.includeDismissed === "true";
    const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : 0;
    const includeDetails = req.query.includeDetails === "true";
    
    // Check if user has recommendations
    let recommendations;
    
    if (includeDetails) {
      recommendations = await getRecommendedBillsWithDetails(userId, {
        limit,
        offset,
        includeViewed,
        includeDismissed,
        minScore
      });
    } else {
      recommendations = await getUserBillRecommendations(userId, {
        limit,
        offset,
        includeViewed,
        includeDismissed,
        minScore
      });
    }
    
    res.json(recommendations);
  } catch (error: any) {
    console.error("Error fetching bill recommendations:", error);
    res.status(500).json({ error: "Failed to fetch bill recommendations" });
  }
});

/**
 * Generate new recommendations for current user
 */
router.post("/recommendations/generate", isAuthenticated, async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = req.body.limit ? parseInt(req.body.limit) : 5;
    
    // Check if user has interests
    const interests = await getUserInterests(userId);
    
    if (interests.length === 0) {
      return res.status(400).json({ 
        error: "No user interests found", 
        message: "Please set your interests first or use the infer endpoint"
      });
    }
    
    // Generate recommendations
    const recommendations = await generateRecommendationsForUser(userId, limit);
    
    res.json({
      recommendations,
      generated: recommendations.length,
      message: `Generated ${recommendations.length} new bill recommendations`
    });
  } catch (error: any) {
    console.error("Error generating bill recommendations:", error);
    res.status(500).json({ error: "Failed to generate bill recommendations" });
  }
});

/**
 * Update recommendation status (viewed, saved, dismissed)
 */
router.patch("/recommendations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const recommendationId = parseInt(req.params.id);
    
    // Validate input
    const validatedData = recommendationStatusSchema.parse(req.body);
    
    // Check if recommendation exists and belongs to the user
    const recommendation = await getBillRecommendation(recommendationId);
    
    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }
    
    if (recommendation.userId !== userId) {
      return res.status(403).json({ error: "You don't have permission to update this recommendation" });
    }
    
    // Update status
    const updated = await updateBillRecommendationStatus(recommendationId, validatedData);
    
    res.json(updated[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid status data", details: error.errors });
    } else {
      console.error("Error updating recommendation status:", error);
      res.status(500).json({ error: "Failed to update recommendation status" });
    }
  }
});

/**
 * Get popular topics/interests across all users
 */
router.get("/topics/popular", async (_req: Request, res: Response) => {
  try {
    // This is a placeholder - in a real implementation, you would query
    // the database to find the most common topics across all users
    res.json([
      "Education",
      "Healthcare",
      "Criminal Justice",
      "Environment",
      "Transportation",
      "Taxes",
      "Local Government",
      "Public Safety",
      "Economic Development",
      "Privacy"
    ]);
  } catch (error: any) {
    console.error("Error fetching popular topics:", error);
    res.status(500).json({ error: "Failed to fetch popular topics" });
  }
});

export default router;