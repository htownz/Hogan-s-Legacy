// @ts-nocheck
import { Express, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { CustomRequest } from "../types";
import { z } from "zod";
import { civicActionStorage } from "../storage-civic-actions";
import { insertCivicActionSchema, insertUserCivicActionSchema } from "../../shared/schema";

export function registerCivicActionRoutes(app: Express) {
  // Get quick actions
  app.get("/api/civic-actions/quick", async (req: Request, res: Response) => {
    try {
      const actions = await civicActionStorage.getQuickActions();
      res.json(actions);
    } catch (error: any) {
      console.error("Error fetching quick actions:", error);
      res.status(500).json({ error: "Failed to fetch quick actions" });
    }
  });

  // Get all actions with creator and bill info
  app.get("/api/civic-actions", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const actions = await civicActionStorage.getActionsWithCreatorInfo(limit);
      res.json(actions);
    } catch (error: any) {
      console.error("Error fetching civic actions:", error);
      res.status(500).json({ error: "Failed to fetch civic actions" });
    }
  });

  // Get actions by type
  app.get("/api/civic-actions/type/:actionType", async (req: Request, res: Response) => {
    try {
      const { actionType } = req.params;
      const actions = await civicActionStorage.getActionsByType(actionType);
      res.json(actions);
    } catch (error: any) {
      console.error("Error fetching actions by type:", error);
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  // Get actions for a bill
  app.get("/api/civic-actions/bill/:billId", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const actions = await civicActionStorage.getActionsByBillId(billId);
      res.json(actions);
    } catch (error: any) {
      console.error("Error fetching bill actions:", error);
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  // Search for actions
  app.get("/api/civic-actions/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const actions = await civicActionStorage.searchActions(query);
      res.json(actions);
    } catch (error: any) {
      console.error("Error searching actions:", error);
      res.status(500).json({ error: "Failed to search actions" });
    }
  });

  // Get a specific action by ID
  app.get("/api/civic-actions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const action = await civicActionStorage.getActionById(parseInt(id));
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.json(action);
    } catch (error: any) {
      console.error("Error fetching action:", error);
      res.status(500).json({ error: "Failed to fetch action" });
    }
  });

  // Get participants for an action
  app.get("/api/civic-actions/:id/participants", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const participants = await civicActionStorage.getActionParticipants(parseInt(id));
      res.json(participants);
    } catch (error: any) {
      console.error("Error fetching action participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Create a new civic action
  app.post("/api/civic-actions", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertCivicActionSchema.parse({
        ...req.body,
        createdBy: req.session.userId
      });

      const action = await civicActionStorage.createAction(validatedData);
      res.status(201).json(action);
    } catch (error: any) {
      console.error("Error creating civic action:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create civic action" });
    }
  });

  // Update a civic action
  app.patch("/api/civic-actions/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const action = await civicActionStorage.getActionById(parseInt(id));
      
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }

      if (action.createdBy !== req.session.userId) {
        return res.status(403).json({ error: "You can only update actions you created" });
      }

      const updatedAction = await civicActionStorage.updateAction(
        parseInt(id), 
        req.body
      );
      
      res.json(updatedAction);
    } catch (error: any) {
      console.error("Error updating civic action:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update civic action" });
    }
  });

  // Delete a civic action (soft delete)
  app.delete("/api/civic-actions/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const action = await civicActionStorage.getActionById(parseInt(id));
      
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }

      if (action.createdBy !== req.session.userId) {
        return res.status(403).json({ error: "You can only delete actions you created" });
      }

      const success = await civicActionStorage.deleteAction(parseInt(id));
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete action" });
      }
    } catch (error: any) {
      console.error("Error deleting civic action:", error);
      res.status(500).json({ error: "Failed to delete civic action" });
    }
  });

  // Get user's civic actions
  app.get("/api/user/civic-actions", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const userActions = await civicActionStorage.getUserActionsByUserId(req.session.userId);
      res.json(userActions);
    } catch (error: any) {
      console.error("Error fetching user civic actions:", error);
      res.status(500).json({ error: "Failed to fetch user actions" });
    }
  });

  // Join/take a civic action
  app.post("/api/civic-actions/:id/join", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const actionId = parseInt(id);
      
      // Check if user already joined this action
      const existingUserAction = await civicActionStorage.getUserActionByUserAndAction(
        req.session.userId,
        actionId
      );
      
      if (existingUserAction) {
        return res.status(409).json({ 
          error: "You have already joined this action",
          userAction: existingUserAction
        });
      }

      const validatedData = insertUserCivicActionSchema.parse({
        userId: req.session.userId,
        actionId: actionId,
        status: "pending"
      });

      const userAction = await civicActionStorage.createUserAction(validatedData);
      res.status(201).json(userAction);
    } catch (error: any) {
      console.error("Error joining civic action:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to join civic action" });
    }
  });

  // Mark a civic action as completed
  app.post("/api/civic-actions/:id/complete", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const { notes, impactRating } = req.body;
      
      const completedAction = await civicActionStorage.completeUserAction(
        req.session.userId,
        parseInt(id),
        notes,
        impactRating
      );
      
      if (!completedAction) {
        return res.status(404).json({ error: "You have not joined this action" });
      }
      
      res.json(completedAction);
    } catch (error: any) {
      console.error("Error completing civic action:", error);
      res.status(500).json({ error: "Failed to complete civic action" });
    }
  });
}