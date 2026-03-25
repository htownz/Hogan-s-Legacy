/**
 * User Goals and Team Lobbying API Routes
 */

import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { goalsStorage } from "./storage-goals";
import { actionCircleStorage } from "./storage-action-circle";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { 
  insertUserGoalSchema, 
  insertGoalMilestoneSchema, 
  insertGoalBillSchema,
  insertTeamGoalSchema,
  insertTeamGoalMilestoneSchema,
  insertTeamGoalAssignmentSchema,
  insertLobbyingActivitySchema
} from "@shared/schema-goals";
import { z } from "zod";

/**
 * Register goals API routes
 */
export function registerGoalsRoutes(app: Express): void {
  
  // === USER PERSONAL GOALS ROUTES ===
  
  /**
   * Get user's goals
   */
  app.get('/api/goals', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goals = await goalsStorage.getUserGoals(userId);
      res.json(goals);
    } catch (error: any) {
      console.error("Error fetching user goals:", error);
      res.status(500).json({ error: "Failed to fetch user goals" });
    }
  });
  
  /**
   * Get a specific goal by ID
   */
  app.get('/api/goals/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      const goal = await goalsStorage.getUserGoalById(goalId, userId);
      
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      res.json(goal);
    } catch (error: any) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });
  
  /**
   * Create a new goal
   */
  app.post('/api/goals', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Validate request body
      const validatedData = insertUserGoalSchema.parse({
        ...req.body,
        userId
      });
      
      const newGoal = await goalsStorage.createUserGoal(validatedData);
      res.status(201).json(newGoal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });
  
  /**
   * Update a goal
   */
  app.patch('/api/goals/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Get existing goal to verify ownership
      const existingGoal = await goalsStorage.getUserGoalById(goalId, userId);
      
      if (!existingGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      // Validate request body
      const validatedData = insertUserGoalSchema.partial().parse(req.body);
      
      const updatedGoal = await goalsStorage.updateUserGoal(goalId, userId, validatedData);
      res.json(updatedGoal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });
  
  /**
   * Delete a goal
   */
  app.delete('/api/goals/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Check if goal exists and belongs to user
      const existingGoal = await goalsStorage.getUserGoalById(goalId, userId);
      
      if (!existingGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      await goalsStorage.deleteUserGoal(goalId, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });
  
  /**
   * Get public goals for community inspiration
   */
  app.get('/api/goals/public/list', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const publicGoals = await goalsStorage.getPublicGoals(limit);
      res.json(publicGoals);
    } catch (error: any) {
      console.error("Error fetching public goals:", error);
      res.status(500).json({ error: "Failed to fetch public goals" });
    }
  });
  
  /**
   * Get goal progress statistics
   */
  app.get('/api/goals/stats', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const stats = await goalsStorage.getGoalStatsByUserId(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching goal stats:", error);
      res.status(500).json({ error: "Failed to fetch goal statistics" });
    }
  });
  
  // === GOAL MILESTONES ROUTES ===
  
  /**
   * Get milestones for a goal
   */
  app.get('/api/goals/:goalId/milestones', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Verify goal ownership
      const goal = await goalsStorage.getUserGoalById(goalId, userId);
      
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      const milestones = await goalsStorage.getGoalMilestones(goalId);
      res.json(milestones);
    } catch (error: any) {
      console.error("Error fetching goal milestones:", error);
      res.status(500).json({ error: "Failed to fetch goal milestones" });
    }
  });
  
  /**
   * Create a milestone for a goal
   */
  app.post('/api/goals/:goalId/milestones', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Verify goal ownership
      const goal = await goalsStorage.getUserGoalById(goalId, userId);
      
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      // Validate request body
      const validatedData = insertGoalMilestoneSchema.parse({
        ...req.body,
        goalId
      });
      
      const newMilestone = await goalsStorage.createGoalMilestone(validatedData);
      
      // Recalculate goal progress
      const allMilestones = await goalsStorage.getGoalMilestones(goalId);
      const completedCount = allMilestones.filter(m => m.status === 'completed').length;
      const totalCount = allMilestones.length;
      const progress = Math.round((completedCount / totalCount) * 100);
      await goalsStorage.updateGoalProgress(goalId, progress);
      
      res.status(201).json(newMilestone);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });
  
  /**
   * Update a milestone
   */
  app.patch('/api/goals/milestones/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ error: "Invalid milestone ID" });
      }
      
      // Get milestone to verify ownership
      const milestone = await goalsStorage.getGoalMilestoneById(milestoneId);
      
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Verify goal ownership
      const goal = await goalsStorage.getUserGoalById(milestone.goalId, userId);
      
      if (!goal) {
        return res.status(403).json({ error: "Not authorized to update this milestone" });
      }
      
      // Validate request body
      const validatedData = insertGoalMilestoneSchema.partial().parse(req.body);
      
      const updatedMilestone = await goalsStorage.updateGoalMilestone(milestoneId, validatedData);
      
      // If status changed to completed, recalculate goal progress
      if (validatedData.status === 'completed') {
        const allMilestones = await goalsStorage.getGoalMilestones(milestone.goalId);
        const completedCount = allMilestones.filter(m => m.status === 'completed').length;
        const totalCount = allMilestones.length;
        const progress = Math.round((completedCount / totalCount) * 100);
        await goalsStorage.updateGoalProgress(milestone.goalId, progress);
      }
      
      res.json(updatedMilestone);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating milestone:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });
  
  /**
   * Complete a milestone
   */
  app.post('/api/goals/milestones/:id/complete', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ error: "Invalid milestone ID" });
      }
      
      // Get milestone to verify ownership
      const milestone = await goalsStorage.getGoalMilestoneById(milestoneId);
      
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Verify goal ownership
      const goal = await goalsStorage.getUserGoalById(milestone.goalId, userId);
      
      if (!goal) {
        return res.status(403).json({ error: "Not authorized to update this milestone" });
      }
      
      const completedMilestone = await goalsStorage.completeGoalMilestone(milestoneId);
      res.json(completedMilestone);
    } catch (error: any) {
      console.error("Error completing milestone:", error);
      res.status(500).json({ error: "Failed to complete milestone" });
    }
  });
  
  /**
   * Delete a milestone
   */
  app.delete('/api/goals/milestones/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ error: "Invalid milestone ID" });
      }
      
      // Get milestone to verify ownership
      const milestone = await goalsStorage.getGoalMilestoneById(milestoneId);
      
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Verify goal ownership
      const goal = await goalsStorage.getUserGoalById(milestone.goalId, userId);
      
      if (!goal) {
        return res.status(403).json({ error: "Not authorized to delete this milestone" });
      }
      
      await goalsStorage.deleteGoalMilestone(milestoneId);
      
      // Recalculate goal progress
      const allMilestones = await goalsStorage.getGoalMilestones(milestone.goalId);
      const completedCount = allMilestones.filter(m => m.status === 'completed').length;
      const totalCount = allMilestones.length;
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      await goalsStorage.updateGoalProgress(milestone.goalId, progress);
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });
  
  // === GOAL BILLS ROUTES ===
  
  /**
   * Get related bills for a goal
   */
  app.get('/api/goals/:goalId/bills', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Verify goal ownership
      const goal = await goalsStorage.getUserGoalById(goalId, userId);
      
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      const goalBills = await goalsStorage.getGoalBills(goalId);
      res.json(goalBills);
    } catch (error: any) {
      console.error("Error fetching goal bills:", error);
      res.status(500).json({ error: "Failed to fetch goal bills" });
    }
  });
  
  /**
   * Add a bill to a goal
   */
  app.post('/api/goals/:goalId/bills', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Verify goal ownership
      const goal = await goalsStorage.getUserGoalById(goalId, userId);
      
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      // Validate request body
      const validatedData = insertGoalBillSchema.parse({
        ...req.body,
        goalId
      });
      
      // Verify bill exists
      const bill = await storage.getBillById(validatedData.billId);
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      const newGoalBill = await goalsStorage.createGoalBill(validatedData);
      res.status(201).json(newGoalBill);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding bill to goal:", error);
      res.status(500).json({ error: "Failed to add bill to goal" });
    }
  });
  
  /**
   * Update a goal-bill relationship
   */
  app.patch('/api/goals/bills/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalBillId = parseInt(req.params.id);
      
      if (isNaN(goalBillId)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      // Validate request body
      const validatedData = insertGoalBillSchema.partial().parse(req.body);
      
      // Update goal-bill relationship
      const updatedGoalBill = await goalsStorage.updateGoalBill(goalBillId, validatedData);
      
      if (!updatedGoalBill) {
        return res.status(404).json({ error: "Goal-bill relationship not found" });
      }
      
      res.json(updatedGoalBill);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating goal-bill relationship:", error);
      res.status(500).json({ error: "Failed to update goal-bill relationship" });
    }
  });
  
  /**
   * Remove a bill from a goal
   */
  app.delete('/api/goals/bills/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalBillId = parseInt(req.params.id);
      
      if (isNaN(goalBillId)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      await goalsStorage.deleteGoalBill(goalBillId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error removing bill from goal:", error);
      res.status(500).json({ error: "Failed to remove bill from goal" });
    }
  });
  
  // === TEAM GOALS ROUTES (FOR ACTION CIRCLES) ===
  
  /**
   * Get team goals for a circle
   */
  app.get('/api/action-circles/:circleId/goals', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const circleId = parseInt(req.params.circleId);
      
      if (isNaN(circleId)) {
        return res.status(400).json({ error: "Invalid circle ID" });
      }
      
      // Verify circle membership
      const isMember = await (async () => !!(await actionCircleStorage.getCircleMember(circleId, userId)))();
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      const teamGoals = await goalsStorage.getTeamGoalsByCircleId(circleId);
      res.json(teamGoals);
    } catch (error: any) {
      console.error("Error fetching team goals:", error);
      res.status(500).json({ error: "Failed to fetch team goals" });
    }
  });
  
  /**
   * Get a specific team goal
   */
  app.get('/api/action-circles/goals/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      const teamGoal = await goalsStorage.getTeamGoalById(goalId);
      
      if (!teamGoal) {
        return res.status(404).json({ error: "Team goal not found" });
      }
      
      // Verify circle membership
      const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, userId));
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      res.json(teamGoal);
    } catch (error: any) {
      console.error("Error fetching team goal:", error);
      res.status(500).json({ error: "Failed to fetch team goal" });
    }
  });
  
  /**
   * Create a team goal
   */
  app.post('/api/action-circles/:circleId/goals', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const circleId = parseInt(req.params.circleId);
      
      if (isNaN(circleId)) {
        return res.status(400).json({ error: "Invalid circle ID" });
      }
      
      // Verify circle exists and user is a member
      const circle = await actionCircleStorage.getActionCircleById(circleId);
      
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }
      
      const isMember = await (async () => !!(await actionCircleStorage.getCircleMember(circleId, userId)))();
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      // Validate request body
      const validatedData = insertTeamGoalSchema.parse({
        ...req.body,
        circleId,
        createdById: userId
      });
      
      const newTeamGoal = await goalsStorage.createTeamGoal(validatedData);
      res.status(201).json(newTeamGoal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating team goal:", error);
      res.status(500).json({ error: "Failed to create team goal" });
    }
  });
  
  /**
   * Update a team goal
   */
  app.patch('/api/action-circles/goals/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Get team goal
      const teamGoal = await goalsStorage.getTeamGoalById(goalId);
      
      if (!teamGoal) {
        return res.status(404).json({ error: "Team goal not found" });
      }
      
      // Verify circle membership
      const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, userId));
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      // Validate request body
      const validatedData = insertTeamGoalSchema.partial().parse(req.body);
      
      const updatedTeamGoal = await goalsStorage.updateTeamGoal(goalId, teamGoal.circleId, validatedData);
      res.json(updatedTeamGoal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating team goal:", error);
      res.status(500).json({ error: "Failed to update team goal" });
    }
  });
  
  /**
   * Delete a team goal
   */
  app.delete('/api/action-circles/goals/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Get team goal
      const teamGoal = await goalsStorage.getTeamGoalById(goalId);
      
      if (!teamGoal) {
        return res.status(404).json({ error: "Team goal not found" });
      }
      
      // Verify circle membership and admin rights
      const circleMember = await actionCircleStorage.getCircleMember(teamGoal.circleId, userId);
      
      if (!circleMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      // Only creator or coordinators/leaders can delete
      if (teamGoal.createdById !== userId && !['coordinator', 'leader'].includes(circleMember.role)) {
        return res.status(403).json({ error: "Not authorized to delete this goal" });
      }
      
      await goalsStorage.deleteTeamGoal(goalId, teamGoal.circleId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting team goal:", error);
      res.status(500).json({ error: "Failed to delete team goal" });
    }
  });
  
  /**
   * Get team goal stats
   */
  app.get('/api/action-circles/:circleId/goals/stats', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const circleId = parseInt(req.params.circleId);
      
      if (isNaN(circleId)) {
        return res.status(400).json({ error: "Invalid circle ID" });
      }
      
      // Verify circle membership
      const isMember = await (async () => !!(await actionCircleStorage.getCircleMember(circleId, userId)))();
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      const stats = await goalsStorage.getTeamGoalStatsByCircleId(circleId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching team goal stats:", error);
      res.status(500).json({ error: "Failed to fetch team goal statistics" });
    }
  });
  
  // === TEAM GOAL MILESTONES ROUTES ===
  
  /**
   * Get milestones for a team goal
   */
  app.get('/api/action-circles/goals/:goalId/milestones', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Get team goal
      const teamGoal = await goalsStorage.getTeamGoalById(goalId);
      
      if (!teamGoal) {
        return res.status(404).json({ error: "Team goal not found" });
      }
      
      // Verify circle membership
      const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, userId));
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      const milestones = await goalsStorage.getTeamGoalMilestones(goalId);
      res.json(milestones);
    } catch (error: any) {
      console.error("Error fetching team goal milestones:", error);
      res.status(500).json({ error: "Failed to fetch team goal milestones" });
    }
  });
  
  /**
   * Create a milestone for a team goal
   */
  app.post('/api/action-circles/goals/:goalId/milestones', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Get team goal
      const teamGoal = await goalsStorage.getTeamGoalById(goalId);
      
      if (!teamGoal) {
        return res.status(404).json({ error: "Team goal not found" });
      }
      
      // Verify circle membership
      const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, userId));
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      // Validate request body
      const validatedData = insertTeamGoalMilestoneSchema.parse({
        ...req.body,
        teamGoalId: goalId
      });
      
      const newMilestone = await goalsStorage.createTeamGoalMilestone(validatedData);
      res.status(201).json(newMilestone);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating team goal milestone:", error);
      res.status(500).json({ error: "Failed to create team goal milestone" });
    }
  });
  
  /**
   * Update a team goal milestone
   */
  app.patch('/api/action-circles/milestones/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ error: "Invalid milestone ID" });
      }
      
      // Validate request body
      const validatedData = insertTeamGoalMilestoneSchema.partial().parse(req.body);
      
      // Update the milestone
      const updatedMilestone = await goalsStorage.updateTeamGoalMilestone(milestoneId, validatedData);
      
      if (!updatedMilestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      res.json(updatedMilestone);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating team goal milestone:", error);
      res.status(500).json({ error: "Failed to update team goal milestone" });
    }
  });
  
  /**
   * Delete a team goal milestone
   */
  app.delete('/api/action-circles/milestones/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ error: "Invalid milestone ID" });
      }
      
      await goalsStorage.deleteTeamGoalMilestone(milestoneId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting team goal milestone:", error);
      res.status(500).json({ error: "Failed to delete team goal milestone" });
    }
  });
  
  // === TEAM GOAL ASSIGNMENTS ROUTES ===
  
  /**
   * Get assignments for a team goal
   */
  app.get('/api/action-circles/goals/:goalId/assignments', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Get team goal
      const teamGoal = await goalsStorage.getTeamGoalById(goalId);
      
      if (!teamGoal) {
        return res.status(404).json({ error: "Team goal not found" });
      }
      
      // Verify circle membership
      const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, userId));
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      const assignments = await goalsStorage.getTeamGoalAssignments(goalId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching team goal assignments:", error);
      res.status(500).json({ error: "Failed to fetch team goal assignments" });
    }
  });
  
  /**
   * Get user's assignments across all circles
   */
  app.get('/api/users/me/assignments', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const assignments = await goalsStorage.getUserAssignments(userId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching user assignments:", error);
      res.status(500).json({ error: "Failed to fetch user assignments" });
    }
  });
  
  /**
   * Create an assignment for a team goal
   */
  app.post('/api/action-circles/goals/:goalId/assignments', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      // Get team goal
      const teamGoal = await goalsStorage.getTeamGoalById(goalId);
      
      if (!teamGoal) {
        return res.status(404).json({ error: "Team goal not found" });
      }
      
      // Verify circle membership and role
      const circleMember = await actionCircleStorage.getCircleMember(teamGoal.circleId, userId);
      
      if (!circleMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }
      
      // Only coordinators and leaders can create assignments
      if (!['coordinator', 'leader'].includes(circleMember.role) && teamGoal.createdById !== userId) {
        return res.status(403).json({ error: "Not authorized to create assignments" });
      }
      
      // Validate request body
      const validatedData = insertTeamGoalAssignmentSchema.parse({
        ...req.body,
        teamGoalId: goalId
      });
      
      // Verify assignee is a member of the circle
      const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, validatedData.userId));
      
      if (!isMember) {
        return res.status(400).json({ error: "Assignee is not a member of this circle" });
      }
      
      const newAssignment = await goalsStorage.createTeamGoalAssignment(validatedData);
      res.status(201).json(newAssignment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating team goal assignment:", error);
      res.status(500).json({ error: "Failed to create team goal assignment" });
    }
  });
  
  /**
   * Update an assignment
   */
  app.patch('/api/action-circles/assignments/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const assignmentId = parseInt(req.params.id);
      
      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: "Invalid assignment ID" });
      }
      
      // Validate request body
      const validatedData = insertTeamGoalAssignmentSchema.partial().parse(req.body);
      
      // Update the assignment
      const updatedAssignment = await goalsStorage.updateTeamGoalAssignment(assignmentId, validatedData);
      
      if (!updatedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      res.json(updatedAssignment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating team goal assignment:", error);
      res.status(500).json({ error: "Failed to update team goal assignment" });
    }
  });
  
  /**
   * Delete an assignment
   */
  app.delete('/api/action-circles/assignments/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const assignmentId = parseInt(req.params.id);
      
      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: "Invalid assignment ID" });
      }
      
      await goalsStorage.deleteTeamGoalAssignment(assignmentId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting team goal assignment:", error);
      res.status(500).json({ error: "Failed to delete team goal assignment" });
    }
  });
  
  // === LOBBYING ACTIVITIES ROUTES ===
  
  /**
   * Get lobbying activities
   */
  app.get('/api/lobbying/activities', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const teamGoalId = req.query.teamGoalId ? parseInt(req.query.teamGoalId as string) : undefined;
      
      if (req.query.teamGoalId && isNaN(teamGoalId!)) {
        return res.status(400).json({ error: "Invalid team goal ID" });
      }
      
      // If teamGoalId is provided, verify circle membership
      if (teamGoalId) {
        const teamGoal = await goalsStorage.getTeamGoalById(teamGoalId);
        
        if (!teamGoal) {
          return res.status(404).json({ error: "Team goal not found" });
        }
        
        const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, userId));
        
        if (!isMember) {
          return res.status(403).json({ error: "Not a member of this circle" });
        }
      }
      
      const activities = await goalsStorage.getLobbyingActivities(teamGoalId, req.query.all ? undefined : userId);
      res.json(activities);
    } catch (error: any) {
      console.error("Error fetching lobbying activities:", error);
      res.status(500).json({ error: "Failed to fetch lobbying activities" });
    }
  });
  
  /**
   * Get a specific lobbying activity
   */
  app.get('/api/lobbying/activities/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ error: "Invalid activity ID" });
      }
      
      const activity = await goalsStorage.getLobbyingActivityById(activityId);
      
      if (!activity) {
        return res.status(404).json({ error: "Lobbying activity not found" });
      }
      
      res.json(activity);
    } catch (error: any) {
      console.error("Error fetching lobbying activity:", error);
      res.status(500).json({ error: "Failed to fetch lobbying activity" });
    }
  });
  
  /**
   * Create a lobbying activity
   */
  app.post('/api/lobbying/activities', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Validate request body
      const validatedData = insertLobbyingActivitySchema.parse({
        ...req.body,
        userId
      });
      
      // If teamGoalId is provided, verify circle membership
      if (validatedData.teamGoalId) {
        const teamGoal = await goalsStorage.getTeamGoalById(validatedData.teamGoalId);
        
        if (!teamGoal) {
          return res.status(404).json({ error: "Team goal not found" });
        }
        
        const isMember = !!(await actionCircleStorage.getCircleMember(teamGoal.circleId, userId));
        
        if (!isMember) {
          return res.status(403).json({ error: "Not a member of this circle" });
        }
      }
      
      // If billId is provided, verify bill exists
      if (validatedData.billId) {
        const bill = await storage.getBillById(validatedData.billId);
        
        if (!bill) {
          return res.status(404).json({ error: "Bill not found" });
        }
      }
      
      const newActivity = await goalsStorage.createLobbyingActivity(validatedData);
      res.status(201).json(newActivity);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating lobbying activity:", error);
      res.status(500).json({ error: "Failed to create lobbying activity" });
    }
  });
  
  /**
   * Update a lobbying activity
   */
  app.patch('/api/lobbying/activities/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ error: "Invalid activity ID" });
      }
      
      // Get activity to verify ownership
      const activity = await goalsStorage.getLobbyingActivityById(activityId);
      
      if (!activity) {
        return res.status(404).json({ error: "Lobbying activity not found" });
      }
      
      // Only creator can update
      if (activity.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this activity" });
      }
      
      // Validate request body
      const validatedData = insertLobbyingActivitySchema.partial().parse(req.body);
      
      const updatedActivity = await goalsStorage.updateLobbyingActivity(activityId, validatedData);
      res.json(updatedActivity);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating lobbying activity:", error);
      res.status(500).json({ error: "Failed to update lobbying activity" });
    }
  });
  
  /**
   * Delete a lobbying activity
   */
  app.delete('/api/lobbying/activities/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ error: "Invalid activity ID" });
      }
      
      await goalsStorage.deleteLobbyingActivity(activityId, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting lobbying activity:", error);
      res.status(500).json({ error: "Failed to delete lobbying activity" });
    }
  });
  
  /**
   * Get lobbying statistics for the current user
   */
  app.get('/api/lobbying/stats', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const stats = await goalsStorage.getLobbyingStatsByUserId(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching lobbying stats:", error);
      res.status(500).json({ error: "Failed to fetch lobbying statistics" });
    }
  });
}