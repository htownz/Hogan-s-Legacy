import { Express, Request, Response } from "express";
import { CustomRequest } from "../types";
import { isAuthenticated } from "../auth";
import { actionCircleStorage } from "../storage-action-circle";
import { z } from "zod";

const createCircleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

const updateCircleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long").optional(),
  description: z.string().min(10, "Description must be at least 10 characters long").optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Register action circle related routes
 */
export function registerActionCirclesRoutes(app: Express): void {
  /**
   * Get all action circles
   * Query params:
   * - mine=true - returns only circles the user is a member of
   * - public=true - returns only public circles
   */
  app.get("/api/action-circles", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { mine, public: isPublic } = req.query;
      
      // If mine=true, get only user's circles
      if (mine === "true" && req.user) {
        const circles = await actionCircleStorage.getUserCircles(req.user.id);
        return res.json(circles);
      }
      
      // If public=true, get only public circles
      if (isPublic === "true") {
        const circles = await actionCircleStorage.getPublicCircles();
        return res.json(circles);
      }
      
      // Otherwise get all circles
      const circles = await actionCircleStorage.getActionCircles();
      return res.json(circles);
    } catch (error: any) {
      console.error("Error fetching action circles:", error);
      return res.status(500).json({ error: "Failed to fetch action circles" });
    }
  });

  /**
   * Get a specific action circle by ID
   */
  app.get("/api/action-circles/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const circle = await actionCircleStorage.getActionCircleById(parseInt(id));
      
      if (!circle) {
        return res.status(404).json({ error: "Action circle not found" });
      }

      // Check if the circle is public or the user is a member
      if (!circle.isPublic) {
        const member = await actionCircleStorage.getCircleMember(circle.id, req.user!.id);
        if (!member) {
          return res.status(403).json({ error: "You don't have access to this circle" });
        }
      }
      
      return res.json(circle);
    } catch (error: any) {
      console.error("Error fetching action circle:", error);
      return res.status(500).json({ error: "Failed to fetch action circle" });
    }
  });

  /**
   * Create a new action circle
   */
  app.post("/api/action-circles", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const parsedBody = createCircleSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.message });
      }
      
      const circleData = {
        ...parsedBody.data,
        createdBy: req.user!.id,
      };
      
      const circle = await actionCircleStorage.createActionCircle(circleData);
      
      // Add creator as a member with admin role
      await actionCircleStorage.addCircleMember({
        circleId: circle.id,
        userId: req.user!.id,
        role: "admin",
      });
      
      return res.status(201).json(circle);
    } catch (error: any) {
      console.error("Error creating action circle:", error);
      return res.status(500).json({ error: "Failed to create action circle" });
    }
  });

  /**
   * Update an action circle
   */
  app.patch("/api/action-circles/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const circleId = parseInt(id);
      
      // Check if circle exists
      const circle = await actionCircleStorage.getActionCircleById(circleId);
      if (!circle) {
        return res.status(404).json({ error: "Action circle not found" });
      }
      
      // Check if user is an admin of the circle
      const member = await actionCircleStorage.getCircleMember(circleId, req.user!.id);
      if (!member || member.role !== "admin") {
        return res.status(403).json({ error: "You don't have permission to update this circle" });
      }
      
      const parsedBody = updateCircleSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.message });
      }
      
      const updatedCircle = await actionCircleStorage.updateActionCircle(circleId, parsedBody.data);
      return res.json(updatedCircle);
    } catch (error: any) {
      console.error("Error updating action circle:", error);
      return res.status(500).json({ error: "Failed to update action circle" });
    }
  });

  /**
   * Delete an action circle
   */
  app.delete("/api/action-circles/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const circleId = parseInt(id);
      
      // Check if circle exists
      const circle = await actionCircleStorage.getActionCircleById(circleId);
      if (!circle) {
        return res.status(404).json({ error: "Action circle not found" });
      }
      
      // Check if user is the creator or an admin of the circle
      const member = await actionCircleStorage.getCircleMember(circleId, req.user!.id);
      if (!member || member.role !== "admin") {
        return res.status(403).json({ error: "You don't have permission to delete this circle" });
      }
      
      await actionCircleStorage.deleteActionCircle(circleId);
      return res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting action circle:", error);
      return res.status(500).json({ error: "Failed to delete action circle" });
    }
  });

  /**
   * Get members of an action circle
   */
  app.get("/api/action-circles/:id/members", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const circleId = parseInt(id);
      
      // Check if circle exists
      const circle = await actionCircleStorage.getActionCircleById(circleId);
      if (!circle) {
        return res.status(404).json({ error: "Action circle not found" });
      }
      
      // Check if the circle is public or the user is a member
      if (!circle.isPublic) {
        const member = await actionCircleStorage.getCircleMember(circleId, req.user!.id);
        if (!member) {
          return res.status(403).json({ error: "You don't have access to this circle" });
        }
      }
      
      const members = await actionCircleStorage.getCircleMembersWithUserDetails(circleId);
      return res.json(members);
    } catch (error: any) {
      console.error("Error fetching circle members:", error);
      return res.status(500).json({ error: "Failed to fetch circle members" });
    }
  });

  /**
   * Join an action circle
   */
  app.post("/api/action-circles/:id/join", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const circleId = parseInt(id);
      
      // Check if circle exists
      const circle = await actionCircleStorage.getActionCircleById(circleId);
      if (!circle) {
        return res.status(404).json({ error: "Action circle not found" });
      }
      
      // Check if the circle is public
      if (!circle.isPublic) {
        return res.status(403).json({ error: "This circle is private and requires an invitation" });
      }
      
      // Check if user is already a member
      const existingMember = await actionCircleStorage.getCircleMember(circleId, req.user!.id);
      if (existingMember) {
        return res.status(400).json({ error: "You are already a member of this circle" });
      }
      
      // Add user as a member with member role
      const member = await actionCircleStorage.addCircleMember({
        circleId,
        userId: req.user!.id,
        role: "member",
      });
      
      return res.status(201).json(member);
    } catch (error: any) {
      console.error("Error joining action circle:", error);
      return res.status(500).json({ error: "Failed to join action circle" });
    }
  });

  /**
   * Leave an action circle
   */
  app.post("/api/action-circles/:id/leave", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const circleId = parseInt(id);
      
      // Check if circle exists
      const circle = await actionCircleStorage.getActionCircleById(circleId);
      if (!circle) {
        return res.status(404).json({ error: "Action circle not found" });
      }
      
      // Check if user is a member
      const member = await actionCircleStorage.getCircleMember(circleId, req.user!.id);
      if (!member) {
        return res.status(400).json({ error: "You are not a member of this circle" });
      }
      
      // Check if the user is the last admin
      if (member.role === "admin") {
        const admins = (await actionCircleStorage.getCircleMembers(circleId)).filter(m => m.role === "admin");
        if (admins.length === 1) {
          return res.status(400).json({ 
            error: "You are the last admin of this circle. Please assign another admin before leaving." 
          });
        }
      }
      
      await actionCircleStorage.removeCircleMember(circleId, req.user!.id);
      return res.status(204).send();
    } catch (error: any) {
      console.error("Error leaving action circle:", error);
      return res.status(500).json({ error: "Failed to leave action circle" });
    }
  });

  /**
   * Get annotations for a specific circle
   */
  app.get("/api/annotations/bill/:billId/circle/:circleId", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId, circleId } = req.params;
      
      // Check if circle exists
      const circle = await actionCircleStorage.getActionCircleById(parseInt(circleId));
      if (!circle) {
        return res.status(404).json({ error: "Action circle not found" });
      }
      
      // Check if user is a member of the circle
      const member = await actionCircleStorage.getCircleMember(circle.id, req.user!.id);
      if (!member) {
        return res.status(403).json({ error: "You don't have access to this circle" });
      }
      
      // Get annotations for this bill in this circle
      const annotations = await actionCircleStorage.getCircleAnnotations(parseInt(circleId), billId);
      return res.json(annotations);
    } catch (error: any) {
      console.error("Error fetching circle annotations:", error);
      return res.status(500).json({ error: "Failed to fetch circle annotations" });
    }
  });
}