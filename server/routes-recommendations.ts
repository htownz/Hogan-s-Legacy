// @ts-nocheck
import express from "express";
import { isAuthenticated } from "./auth";
import {
  getUserInterests,
  createUserInterests,
  updateUserInterests,
  getUserBillRecommendations,
  updateBillRecommendationStatus,
  recordUserInterestInference,
  inferUserInterests,
  generateRecommendationsForUser
} from "./storage-recommendations";
import { CustomRequest } from "./types";

const router = express.Router();

// Note: Interest routes have been moved to server/routes-interests.ts
// This ensures we have one definitive source for these endpoints

// Get bill recommendations for the current user
router.get('/', isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const includeViewed = req.query.includeViewed === 'true';
    const includeDismissed = req.query.includeDismissed === 'true';
    
    const recommendations = await getUserBillRecommendations(userId, {
      limit,
      offset,
      includeViewed,
      includeDismissed
    });
    
    res.json(recommendations);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Update recommendation status (viewed, saved, dismissed)
router.patch('/:id', isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const id = req.params.id;
    const { viewed, saved, dismissed } = req.body;
    
    const result = await updateBillRecommendationStatus(userId, id, {
      viewed,
      saved,
      dismissed
    });
    
    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating recommendation status:', error);
    res.status(500).json({ error: 'Failed to update recommendation status' });
  }
});

// Generate new recommendations for the user
router.post('/generate', isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // First try to infer interests if user hasn't set them
    const interests = await getUserInterests(userId);
    if (interests.length === 0 || 
        (!interests[0].topics?.length && !interests[0].causes?.length && !interests[0].keywords?.length)) {
      await inferUserInterests(userId);
    }
    
    // Generate recommendations
    const recommendations = await generateRecommendationsForUser(userId);
    
    res.json({ 
      recommendations,
      generated: recommendations.length,
      message: `Generated ${recommendations.length} new bill recommendations`
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Record user interaction for interest inference
router.post('/record-interaction', isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { action, billId, topics } = req.body;
    
    await recordUserInterestInference({
      userId,
      action,
      billId,
      topics
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

export default router;