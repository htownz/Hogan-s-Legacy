import { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../middleware/auth-middleware";
import { EnhancedRequest } from "../types/request-types";
import { userActivityStorage } from "../storage-user-activity";
import { insertUserActivitySchema, insertUserActionTrackingSchema } from "@shared/schema-user-activity";

// Create validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.number().int().min(1).max(365).optional(),
});

const achievementSchema = z.object({
  achievementType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  relatedRole: z.string().optional(),
  badgeUrl: z.string().optional(),
  level: z.number().int().min(1).max(5).optional(),
  visible: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Register user activity API routes
 */
export function registerUserActivityRoutes(app: Express): void {
  /**
   * Track a new user activity
   */
  app.post("/api/user-activities", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = insertUserActivitySchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid activity data", 
          errors: validationResult.error.errors 
        });
      }
      
      const activity = await userActivityStorage.createActivity(validationResult.data);
      
      return res.status(201).json(activity);
    } catch (error: any) {
      console.error("Error tracking user activity:", error);
      return res.status(500).json({ message: "Failed to track activity" });
    }
  });
  
  /**
   * Get user activities (with optional filters)
   */
  app.get("/api/user-activities", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activityType = req.query.type as string | undefined;
      const role = req.query.role as string | undefined;
      
      let activities;
      
      if (activityType) {
        activities = await userActivityStorage.getUserActivitiesByType(userId, activityType);
      } else if (role) {
        activities = await userActivityStorage.getUserActivitiesByRole(userId, role);
      } else {
        activities = await userActivityStorage.getUserActivities(userId, limit);
      }
      
      return res.status(200).json(activities);
    } catch (error: any) {
      console.error("Error fetching user activities:", error);
      return res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  
  /**
   * Get recent user activities
   */
  app.get("/api/user-activities/recent", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      
      const activities = await userActivityStorage.getRecentUserActivities(userId, days);
      
      return res.status(200).json(activities);
    } catch (error: any) {
      console.error("Error fetching recent activities:", error);
      return res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });
  
  /**
   * Get activity count
   */
  app.get("/api/user-activities/count", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const activityType = req.query.type as string | undefined;
      
      const count = await userActivityStorage.getUserActivityCount(userId, activityType);
      
      return res.status(200).json({ count });
    } catch (error: any) {
      console.error("Error fetching activity count:", error);
      return res.status(500).json({ message: "Failed to fetch activity count" });
    }
  });
  
  /**
   * Track a completed civic action
   */
  app.post("/api/user-actions", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = insertUserActionTrackingSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid action data", 
          errors: validationResult.error.errors 
        });
      }
      
      const action = await userActivityStorage.createActionTracking(validationResult.data);
      
      return res.status(201).json(action);
    } catch (error: any) {
      console.error("Error tracking user action:", error);
      return res.status(500).json({ message: "Failed to track action" });
    }
  });
  
  /**
   * Get user's civic actions
   */
  app.get("/api/user-actions", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const actionType = req.query.type as string | undefined;
      const impact = req.query.impact as string | undefined;
      
      let actions;
      
      if (actionType) {
        actions = await userActivityStorage.getUserActionsByType(userId, actionType);
      } else if (impact) {
        actions = await userActivityStorage.getUserActionsByImpact(userId, impact);
      } else {
        actions = await userActivityStorage.getUserActions(userId, limit);
      }
      
      return res.status(200).json(actions);
    } catch (error: any) {
      console.error("Error fetching user actions:", error);
      return res.status(500).json({ message: "Failed to fetch actions" });
    }
  });
  
  /**
   * Get action count
   */
  app.get("/api/user-actions/count", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const actionType = req.query.type as string | undefined;
      
      const count = await userActivityStorage.getUserActionCount(userId, actionType);
      
      return res.status(200).json({ count });
    } catch (error: any) {
      console.error("Error fetching action count:", error);
      return res.status(500).json({ message: "Failed to fetch action count" });
    }
  });
  
  /**
   * Create a user achievement
   * (Admin or system only in production)
   */
  app.post("/api/user-achievements", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = achievementSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid achievement data", 
          errors: validationResult.error.errors 
        });
      }
      
      const achievement = await userActivityStorage.createAchievement({
        ...validationResult.data,
        userId
      });
      
      return res.status(201).json(achievement);
    } catch (error: any) {
      console.error("Error creating achievement:", error);
      return res.status(500).json({ message: "Failed to create achievement" });
    }
  });
  
  /**
   * Get user achievements
   */
  app.get("/api/user-achievements", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const role = req.query.role as string | undefined;
      
      let achievements;
      
      if (role) {
        achievements = await userActivityStorage.getUserAchievementsByRole(userId, role);
      } else {
        achievements = await userActivityStorage.getUserAchievements(userId);
      }
      
      return res.status(200).json(achievements);
    } catch (error: any) {
      console.error("Error fetching achievements:", error);
      return res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  /**
   * Get user activity streaks
   */
  app.get("/api/user-streaks/:streakType", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const streakType = req.params.streakType;
      
      const streak = await userActivityStorage.getOrCreateUserStreak(userId, streakType);
      
      return res.status(200).json(streak);
    } catch (error: any) {
      console.error("Error fetching streak:", error);
      return res.status(500).json({ message: "Failed to fetch streak" });
    }
  });
  
  /**
   * Get most active users (for leaderboards)
   */
  app.get("/api/analytics/most-active-users", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const users = await userActivityStorage.getMostActiveUsers(limit);
      
      return res.status(200).json(users);
    } catch (error: any) {
      console.error("Error fetching most active users:", error);
      return res.status(500).json({ message: "Failed to fetch most active users" });
    }
  });
  
  /**
   * Get most popular activities
   */
  app.get("/api/analytics/popular-activities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const activities = await userActivityStorage.getMostPopularActivities(limit);
      
      return res.status(200).json(activities);
    } catch (error: any) {
      console.error("Error fetching popular activities:", error);
      return res.status(500).json({ message: "Failed to fetch popular activities" });
    }
  });
  
  /**
   * Get user activity by time of day (for personal analytics)
   */
  app.get("/api/analytics/activity-by-time", isAuthenticated, async (req: EnhancedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      const timeData = await userActivityStorage.getUserActivityByTimeOfDay(userId);
      
      return res.status(200).json(timeData);
    } catch (error: any) {
      console.error("Error fetching activity time data:", error);
      return res.status(500).json({ message: "Failed to fetch activity time data" });
    }
  });
}