import { Express, Request, Response } from "express";
import { storage } from "../storage-updated";
import { z } from "zod";
import { CustomRequest } from "../types";
import { 
  insertWarRoomCampaignSchema, 
  insertWarRoomDiscussionSchema,
  insertWarRoomCampaignMemberSchema,
  insertWarRoomResourceSchema,
  insertWarRoomActionItemSchema,
  insertWarRoomActionItemAssignmentSchema,
  insertWarRoomReactionSchema
} from "@shared/schema";

export function registerWarRoomRoutes(app: Express) {
  // Get all campaigns
  app.get("/api/war-room/campaigns", async (req: CustomRequest, res: Response) => {
    try {
      const campaigns = await storage.getAllWarRoomCampaigns();
      res.json(campaigns);
    } catch (error: any) {
      console.error("Error fetching war room campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get user campaigns
  app.get("/api/war-room/user/campaigns", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const campaigns = await storage.getUserWarRoomCampaigns(userId);
      res.json(campaigns);
    } catch (error: any) {
      console.error("Error fetching user war room campaigns:", error);
      res.status(500).json({ error: "Failed to fetch user campaigns" });
    }
  });

  // Get a specific campaign
  app.get("/api/war-room/campaigns/:id", async (req: CustomRequest, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const campaign = await storage.getWarRoomCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error: any) {
      console.error("Error fetching war room campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Create a new campaign
  app.post("/api/war-room/campaigns", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertWarRoomCampaignSchema.parse({
        ...req.body,
        creatorId: userId
      });

      const newCampaign = await storage.createWarRoomCampaign(validatedData);
      res.status(201).json(newCampaign);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating war room campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Update a campaign
  app.patch("/api/war-room/campaigns/:id", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      // Check if user is the creator of the campaign
      const campaign = await storage.getWarRoomCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.creatorId !== userId) {
        return res.status(403).json({ error: "Only the creator can update the campaign" });
      }

      // Extract only the fields that can be updated
      const { title, description, priority, status } = req.body;
      const updatedCampaign = await storage.updateWarRoomCampaign(campaignId, {
        title,
        description,
        priority,
        status
      });

      res.json(updatedCampaign);
    } catch (error: any) {
      console.error("Error updating war room campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Get campaign members
  app.get("/api/war-room/campaigns/:id/members", async (req: CustomRequest, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const members = await storage.getWarRoomCampaignMembersByCampaignId(campaignId);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching war room campaign members:", error);
      res.status(500).json({ error: "Failed to fetch campaign members" });
    }
  });

  // Add a member to a campaign
  app.post("/api/war-room/campaigns/:id/members", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      // Check if user is already a member
      const isMember = await storage.isUserWarRoomCampaignMember(req.body.userId, campaignId);
      if (isMember) {
        return res.status(400).json({ error: "User is already a member of this campaign" });
      }

      const validatedData = insertWarRoomCampaignMemberSchema.parse({
        campaignId,
        userId: req.body.userId,
        role: req.body.role || "member"
      });

      const newMember = await storage.createWarRoomCampaignMember(validatedData);
      res.status(201).json(newMember);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding war room campaign member:", error);
      res.status(500).json({ error: "Failed to add campaign member" });
    }
  });

  // Get campaign discussions
  app.get("/api/war-room/campaigns/:id/discussions", async (req: CustomRequest, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const discussions = await storage.getWarRoomDiscussionsByCampaignId(campaignId);
      res.json(discussions);
    } catch (error: any) {
      console.error("Error fetching war room campaign discussions:", error);
      res.status(500).json({ error: "Failed to fetch campaign discussions" });
    }
  });

  // Post a new discussion message
  app.post("/api/war-room/campaigns/:id/discussions", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      // Check if user is a member of the campaign
      const isMember = await storage.isUserWarRoomCampaignMember(userId, campaignId);
      if (!isMember) {
        return res.status(403).json({ error: "Only members can post discussions" });
      }

      const validatedData = insertWarRoomDiscussionSchema.parse({
        campaignId,
        userId,
        message: req.body.message
      });

      const newDiscussion = await storage.createWarRoomDiscussion(validatedData);
      res.status(201).json(newDiscussion);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating war room discussion:", error);
      res.status(500).json({ error: "Failed to create discussion" });
    }
  });

  // Get campaign resources
  app.get("/api/war-room/campaigns/:id/resources", async (req: CustomRequest, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const resources = await storage.getWarRoomResourcesByCampaignId(campaignId);
      res.json(resources);
    } catch (error: any) {
      console.error("Error fetching war room resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // Create a new resource
  app.post("/api/war-room/campaigns/:id/resources", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      // Check if user is a member of the campaign
      const isMember = await storage.isUserWarRoomCampaignMember(userId, campaignId);
      if (!isMember) {
        return res.status(403).json({ error: "Only members can add resources" });
      }

      const validatedData = insertWarRoomResourceSchema.parse({
        campaignId,
        uploadedById: userId,
        title: req.body.title,
        type: req.body.type,
        url: req.body.url,
        description: req.body.description
      });

      const newResource = await storage.createWarRoomResource(validatedData);
      res.status(201).json(newResource);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating war room resource:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  // Increment resource download count
  app.post("/api/war-room/resources/:id/download", async (req: CustomRequest, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: "Invalid resource ID" });
      }

      const updatedResource = await storage.incrementWarRoomResourceDownloads(resourceId);
      res.json(updatedResource);
    } catch (error: any) {
      console.error("Error updating resource download count:", error);
      res.status(500).json({ error: "Failed to update download count" });
    }
  });

  // Get campaign action items
  app.get("/api/war-room/campaigns/:id/action-items", async (req: CustomRequest, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const actionItems = await storage.getWarRoomActionItemsByCampaignId(campaignId);
      res.json(actionItems);
    } catch (error: any) {
      console.error("Error fetching war room action items:", error);
      res.status(500).json({ error: "Failed to fetch action items" });
    }
  });

  // Create a new action item
  app.post("/api/war-room/campaigns/:id/action-items", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      // Check if user is a member of the campaign
      const isMember = await storage.isUserWarRoomCampaignMember(userId, campaignId);
      if (!isMember) {
        return res.status(403).json({ error: "Only members can create action items" });
      }

      const validatedData = insertWarRoomActionItemSchema.parse({
        campaignId,
        createdById: userId,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        status: req.body.status || "planned",
        priority: req.body.priority || "medium"
      });

      const newActionItem = await storage.createWarRoomActionItem(validatedData);
      res.status(201).json(newActionItem);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating war room action item:", error);
      res.status(500).json({ error: "Failed to create action item" });
    }
  });

  // Update an action item
  app.patch("/api/war-room/action-items/:id", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const actionItemId = parseInt(req.params.id);
      if (isNaN(actionItemId)) {
        return res.status(400).json({ error: "Invalid action item ID" });
      }

      // Get the action item to check permissions
      const actionItem = await storage.getWarRoomActionItemById(actionItemId);
      if (!actionItem) {
        return res.status(404).json({ error: "Action item not found" });
      }

      // Check if user is a member of the campaign
      const isMember = await storage.isUserWarRoomCampaignMember(userId, actionItem.campaignId);
      if (!isMember) {
        return res.status(403).json({ error: "Only campaign members can update action items" });
      }

      // Extract only the fields that can be updated
      const { title, description, dueDate, status, priority } = req.body;
      const updateData: Partial<typeof actionItem> = {};
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;

      const updatedActionItem = await storage.updateWarRoomActionItem(actionItemId, updateData);
      res.json(updatedActionItem);
    } catch (error: any) {
      console.error("Error updating war room action item:", error);
      res.status(500).json({ error: "Failed to update action item" });
    }
  });

  // Get action item assignments
  app.get("/api/war-room/action-items/:id/assignments", async (req: CustomRequest, res: Response) => {
    try {
      const actionItemId = parseInt(req.params.id);
      if (isNaN(actionItemId)) {
        return res.status(400).json({ error: "Invalid action item ID" });
      }

      const assignments = await storage.getWarRoomActionItemAssignmentsByActionItemId(actionItemId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching action item assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Create a new action item assignment
  app.post("/api/war-room/action-items/:id/assignments", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const actionItemId = parseInt(req.params.id);
      if (isNaN(actionItemId)) {
        return res.status(400).json({ error: "Invalid action item ID" });
      }

      // Get the action item to check campaign membership
      const actionItem = await storage.getWarRoomActionItemById(actionItemId);
      if (!actionItem) {
        return res.status(404).json({ error: "Action item not found" });
      }

      // Check if assigner is a member of the campaign
      const isMember = await storage.isUserWarRoomCampaignMember(userId, actionItem.campaignId);
      if (!isMember) {
        return res.status(403).json({ error: "Only campaign members can assign action items" });
      }

      // Make sure the assignee is a campaign member
      const isAssigneeMember = await storage.isUserWarRoomCampaignMember(req.body.userId, actionItem.campaignId);
      if (!isAssigneeMember) {
        return res.status(403).json({ error: "Can only assign to campaign members" });
      }

      const validatedData = insertWarRoomActionItemAssignmentSchema.parse({
        actionItemId,
        userId: req.body.userId,
        status: req.body.status || "assigned"
      });

      const newAssignment = await storage.createWarRoomActionItemAssignment(validatedData);
      res.status(201).json(newAssignment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating action item assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // Update an action item assignment
  app.patch("/api/war-room/action-item-assignments/:id", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const assignmentId = parseInt(req.params.id);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: "Invalid assignment ID" });
      }

      // Only status can be updated
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedAssignment = await storage.updateWarRoomActionItemAssignment(assignmentId, {
        status,
        completedAt: status === "completed" ? new Date() : undefined
      });

      if (!updatedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      res.json(updatedAssignment);
    } catch (error: any) {
      console.error("Error updating action item assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  // Get user's action item assignments
  app.get("/api/war-room/user/assignments", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const assignments = await storage.getUserWarRoomActionItemAssignments(userId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching user assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Add a reaction to a discussion
  app.post("/api/war-room/discussions/:id/reactions", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const discussionId = parseInt(req.params.id);
      if (isNaN(discussionId)) {
        return res.status(400).json({ error: "Invalid discussion ID" });
      }

      const validatedData = insertWarRoomReactionSchema.parse({
        discussionId,
        userId,
        type: req.body.type
      });

      const newReaction = await storage.createWarRoomReaction(validatedData);
      res.status(201).json(newReaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating reaction:", error);
      res.status(500).json({ error: "Failed to create reaction" });
    }
  });

  // Remove a reaction
  app.delete("/api/war-room/reactions/:id", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const reactionId = parseInt(req.params.id);
      if (isNaN(reactionId)) {
        return res.status(400).json({ error: "Invalid reaction ID" });
      }

      await storage.removeWarRoomReaction(reactionId, userId);
      res.status(204).end();
    } catch (error: any) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  // Get reactions for a discussion
  app.get("/api/war-room/discussions/:id/reactions", async (req: CustomRequest, res: Response) => {
    try {
      const discussionId = parseInt(req.params.id);
      if (isNaN(discussionId)) {
        return res.status(400).json({ error: "Invalid discussion ID" });
      }

      const reactions = await storage.getWarRoomReactionsByDiscussionId(discussionId);
      res.json(reactions);
    } catch (error: any) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });
}