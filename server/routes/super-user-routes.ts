// @ts-nocheck
import { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { CustomRequest } from "../types";
import { superUserStorage } from "../storage-super-user";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { 
  superUserRoles, 
  progressionMilestones, 
  insertProgressionMilestoneSchema,
  userNetworkImpact, 
  insertUserNetworkImpactSchema,
  insertUserActivitySchema
} from "@shared/schema";
import { createLogger } from "../logger";
const log = createLogger("super-user-routes");


// Schemas for request validation
const roleSchema = z.object({
  role: z.string()
});

const networkImpactSchema = z.object({
  usersInvited: z.number().optional(),
  activeUsers: z.number().optional(),
  actionsInspired: z.number().optional(),
  totalReach: z.number().optional(),
  r0Value: z.number().optional()
});

const activitySchema = z.object({
  activityType: z.string(),
  activityData: z.record(z.any()).optional(),
  points: z.number().optional(),
  roleType: z.string().optional()
});

/**
 * Register super user dashboard routes
 */
export function registerSuperUserRoutes(app: Express) {
  // Get user's super user roles
  app.get("/api/super-user/roles", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const roles = await superUserStorage.getSuperUserRolesByUserId(userId);
      
      if (roles.length === 0) {
        // Create default roles if none exist
        const defaultRoles = ['catalyst', 'amplifier', 'convincer'];
        const createdRoles = [];
        
        for (const roleName of defaultRoles) {
          const role = await superUserStorage.createSuperUserRole({
            userId,
            role: roleName,
            level: 1,
            progressToNextLevel: 0
          });
          createdRoles.push(role);
        }
        
        return res.status(200).json(createdRoles);
      }
      
      return res.status(200).json(roles);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching super user roles");
      return res.status(500).json({ message: "Failed to fetch super user roles" });
    }
  });
  
  // Get specific super user role
  app.get("/api/super-user/roles/:role", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const roleName = req.params.role;
      
      // Validate role parameter
      const validationResult = roleSchema.safeParse({ role: roleName });
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role parameter" });
      }
      
      const role = await superUserStorage.getSuperUserRoleByUserId(userId, roleName);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      return res.status(200).json(role);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching super user role");
      return res.status(500).json({ message: "Failed to fetch super user role" });
    }
  });
  
  // Get progression milestones for a user
  app.get("/api/super-user/milestones", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const milestones = await superUserStorage.getProgressionMilestonesByUserId(userId);
      
      return res.status(200).json(milestones);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching progression milestones");
      return res.status(500).json({ message: "Failed to fetch progression milestones" });
    }
  });
  
  // Get progression milestones for a specific role
  app.get("/api/super-user/milestones/:role", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const roleName = req.params.role;
      
      // Validate role parameter
      const validationResult = roleSchema.safeParse({ role: roleName });
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role parameter" });
      }
      
      const milestones = await superUserStorage.getProgressionMilestonesByUserIdAndRole(userId, roleName);
      
      return res.status(200).json(milestones);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching role progression milestones");
      return res.status(500).json({ message: "Failed to fetch role progression milestones" });
    }
  });
  
  // Create a new progression milestone
  app.post("/api/super-user/milestones", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const validationResult = insertProgressionMilestoneSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid milestone data", errors: validationResult.error.errors });
      }
      
      const milestone = await superUserStorage.createProgressionMilestone(validationResult.data);
      
      return res.status(201).json(milestone);
    } catch (error: any) {
      log.error({ err: error }, "Error creating progression milestone");
      return res.status(500).json({ message: "Failed to create progression milestone" });
    }
  });
  
  // Update a progression milestone
  app.patch("/api/super-user/milestones/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const milestoneId = parseInt(req.params.id, 10);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ message: "Invalid milestone ID" });
      }
      
      // Get the milestone to verify ownership
      const milestone = await superUserStorage.getProgressionMilestoneById(milestoneId);
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      if (milestone.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this milestone" });
      }
      
      // Update the milestone
      const updatedMilestone = await superUserStorage.updateProgressionMilestone(milestoneId, req.body);
      
      // Check if milestone is completed
      if (updatedMilestone?.completed && milestone.role) {
        // Increment progress to next level for this role
        const userRole = await superUserStorage.getSuperUserRoleByUserId(userId, milestone.role);
        
        if (userRole) {
          await superUserStorage.updateSuperUserRole(userRole.id, {
            progressToNextLevel: Math.min(100, userRole.progressToNextLevel + 10)
          });
          
          // Check if user is eligible for a level upgrade
          if (userRole.progressToNextLevel + 10 >= 100) {
            await superUserStorage.upgradeSuperUserRole(userId, milestone.role);
          }
        }
      }
      
      return res.status(200).json(updatedMilestone);
    } catch (error: any) {
      log.error({ err: error }, "Error updating progression milestone");
      return res.status(500).json({ message: "Failed to update progression milestone" });
    }
  });
  
  // Get user's network impact metrics
  app.get("/api/super-user/network-impact", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      let networkImpact = await superUserStorage.getUserNetworkImpact(userId);
      
      if (!networkImpact) {
        // Create default impact metrics if none exist
        networkImpact = await superUserStorage.createUserNetworkImpact({
          userId,
          usersInvited: 0,
          activeUsers: 0,
          actionsInspired: 0,
          totalReach: 0,
          r0Value: 0
        });
      }
      
      return res.status(200).json(networkImpact);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching network impact");
      return res.status(500).json({ message: "Failed to fetch network impact metrics" });
    }
  });
  
  // Update user's network impact metrics
  app.patch("/api/super-user/network-impact", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = networkImpactSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid impact data", errors: validationResult.error.errors });
      }
      
      // Get existing network impact
      let networkImpact = await superUserStorage.getUserNetworkImpact(userId);
      
      if (!networkImpact) {
        // Create new network impact record
        networkImpact = await superUserStorage.createUserNetworkImpact({
          userId,
          ...validationResult.data
        });
      } else {
        // Update existing record
        networkImpact = await superUserStorage.updateUserNetworkImpact(userId, validationResult.data) as any;
      }
      
      return res.status(200).json(networkImpact);
    } catch (error: any) {
      log.error({ err: error }, "Error updating network impact");
      return res.status(500).json({ message: "Failed to update network impact metrics" });
    }
  });
  
  // Get top influencers by network impact
  app.get("/api/super-user/top-influencers", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || "10", 10);
      const topInfluencers = await superUserStorage.getTopNetworkInfluencers(limit);
      
      return res.status(200).json(topInfluencers);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching top influencers");
      return res.status(500).json({ message: "Failed to fetch top influencers" });
    }
  });
  
  // Get analytics data for super user dashboard
  app.get("/api/super-user/analytics", async (req: Request, res: Response) => {
    try {
      const [roleDistribution, activityTypes, userProgression] = await Promise.all([
        superUserStorage.getRoleDistribution(),
        superUserStorage.getActivitiesByType(),
        superUserStorage.getUserProgression()
      ]);
      
      return res.status(200).json({
        roleDistribution,
        activityTypes,
        userProgression
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching super user analytics");
      return res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  
  // Log a new user activity
  app.post("/api/super-user/activity", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = activitySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid activity data", errors: validationResult.error.errors });
      }
      
      const activity = await superUserStorage.createUserActivity({
        userId,
        ...validationResult.data
      });
      
      // Update progression based on activity type and role
      if (validationResult.data.roleType) {
        const role = await superUserStorage.getSuperUserRoleByUserId(userId, validationResult.data.roleType);
        
        if (role) {
          // Increment progress (5 points per activity)
          await superUserStorage.updateSuperUserRole(role.id, {
            progressToNextLevel: Math.min(100, role.progressToNextLevel + 5)
          });
          
          // Check if user is eligible for level upgrade
          if (role.progressToNextLevel + 5 >= 100) {
            await superUserStorage.upgradeSuperUserRole(userId, role.role);
          }
        }
      }
      
      return res.status(201).json(activity);
    } catch (error: any) {
      log.error({ err: error }, "Error creating user activity");
      return res.status(500).json({ message: "Failed to log user activity" });
    }
  });
  
  // Get user's activities
  app.get("/api/super-user/activity", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const roleType = req.query.role as string;
      
      let activities;
      if (roleType) {
        // Validate role parameter
        const validationResult = roleSchema.safeParse({ role: roleType });
        if (!validationResult.success) {
          return res.status(400).json({ message: "Invalid role parameter" });
        }
        
        activities = await superUserStorage.getUserActivitiesByUserIdAndRole(userId, roleType);
      } else {
        activities = await superUserStorage.getUserActivitiesByUserId(userId);
      }
      
      return res.status(200).json(activities);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching user activities");
      return res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });
  
  // Get available challenges
  app.get("/api/super-user/challenges", async (req: Request, res: Response) => {
    try {
      const roleType = req.query.role as string;
      
      let challenges;
      if (roleType) {
        // Validate role parameter
        const validationResult = roleSchema.safeParse({ role: roleType });
        if (!validationResult.success) {
          return res.status(400).json({ message: "Invalid role parameter" });
        }
        
        challenges = await superUserStorage.getChallengesByRole(roleType);
      } else {
        challenges = await superUserStorage.getAllChallenges();
      }
      
      return res.status(200).json(challenges);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching challenges");
      return res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });
  
  // Get a specific challenge
  app.get("/api/super-user/challenges/:id", async (req: Request, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id, 10);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const challenge = await superUserStorage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      return res.status(200).json(challenge);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching challenge");
      return res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });
  
  // Accept a challenge
  app.post("/api/super-user/challenges/:id/accept", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const challengeId = parseInt(req.params.id, 10);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      // Check if the challenge exists
      const challenge = await superUserStorage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // Check if the user already accepted this challenge
      const existingUserChallenge = await superUserStorage.getUserChallengeByIds(userId, challengeId);
      
      if (existingUserChallenge) {
        return res.status(409).json({ message: "Challenge already accepted", userChallenge: existingUserChallenge });
      }
      
      // Check if the user has the required super user level
      const userRole = await superUserStorage.getSuperUserRoleByUserId(userId, challenge.role);
      
      if (!userRole || userRole.level < challenge.requiredLevel) {
        return res.status(403).json({ message: `You need to be at level ${challenge.requiredLevel} or higher as a ${challenge.role} to accept this challenge` });
      }
      
      // Create a user challenge record
      const userChallenge = await superUserStorage.createUserChallenge({
        userId,
        challengeId,
        progress: 0,
        total: 100,
        completed: false
      });
      
      return res.status(201).json(userChallenge);
    } catch (error: any) {
      log.error({ err: error }, "Error accepting challenge");
      return res.status(500).json({ message: "Failed to accept challenge" });
    }
  });
  
  // Update user challenge progress
  app.patch("/api/super-user/challenges/:id/progress", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const challengeId = parseInt(req.params.id, 10);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      // Get the user challenge record
      const userChallenge = await superUserStorage.getUserChallengeByIds(userId, challengeId);
      
      if (!userChallenge) {
        return res.status(404).json({ message: "User challenge not found" });
      }
      
      // Validate request body (progress must be between 0 and 100)
      const progress = req.body.progress;
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Progress must be a number between 0 and 100" });
      }
      
      // Update the progress
      const updatedUserChallenge = await superUserStorage.updateUserChallenge(userId, challengeId, {
        progress,
        completed: progress >= 100
      });
      
      // If challenge is completed, update the user's super user role progress
      if (progress >= 100 && updatedUserChallenge) {
        const challenge = await superUserStorage.getChallengeById(challengeId);
        
        if (challenge) {
          const userRole = await superUserStorage.getSuperUserRoleByUserId(userId, challenge.role);
          
          if (userRole) {
            // Calculate progress points (at least 10, or challenge reward points)
            const progressPoints = Math.max(10, challenge.rewardPoints || 10);
            
            // Update the super user role progress
            await superUserStorage.updateSuperUserRole(userRole.id, {
              progressToNextLevel: Math.min(100, userRole.progressToNextLevel + progressPoints)
            });
            
            // Check if user is eligible for level upgrade
            if (userRole.progressToNextLevel + progressPoints >= 100) {
              await superUserStorage.upgradeSuperUserRole(userId, userRole.role);
            }
          }
        }
      }
      
      return res.status(200).json(updatedUserChallenge);
    } catch (error: any) {
      log.error({ err: error }, "Error updating challenge progress");
      return res.status(500).json({ message: "Failed to update challenge progress" });
    }
  });
}