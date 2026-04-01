import { Express, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { CustomRequest } from "../types";
import { z } from "zod";
import { policyAnnotationStorage } from "../storage-policy-annotations";
import { insertPolicyAnnotationSchema, insertAnnotationReplySchema } from "../../shared/schema";
import { createLogger } from "../logger";
const log = createLogger("annotations-routes");


export function registerAnnotationRoutes(app: Express) {
  // Get all public annotations for a bill
  app.get("/api/annotations/bill/:billId", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const annotations = await policyAnnotationStorage.getPublicAnnotationsByBillId(billId);
      res.json(annotations);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching bill annotations");
      res.status(500).json({ error: "Failed to fetch annotations" });
    }
  });

  // Get all annotations for a bill with user details
  app.get("/api/annotations/bill/:billId/details", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const annotations = await policyAnnotationStorage.getAnnotationsWithUserDetails(billId);
      res.json(annotations);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching bill annotations with details");
      res.status(500).json({ error: "Failed to fetch annotations" });
    }
  });

  // Get circle-specific annotations for a bill
  app.get("/api/annotations/bill/:billId/circle/:circleId", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId, circleId } = req.params;
      const annotations = await policyAnnotationStorage.getCircleAnnotationsByBillId(billId, parseInt(circleId));
      res.json(annotations);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching circle annotations");
      res.status(500).json({ error: "Failed to fetch annotations" });
    }
  });

  // Get a user's annotations
  app.get("/api/annotations/user", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const annotations = await policyAnnotationStorage.getAnnotationsByUserId(req.session.userId);
      res.json(annotations);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching user annotations");
      res.status(500).json({ error: "Failed to fetch annotations" });
    }
  });

  // Get a specific annotation by ID
  app.get("/api/annotations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const annotation = await policyAnnotationStorage.getAnnotationById(parseInt(id));
      if (!annotation) {
        return res.status(404).json({ error: "Annotation not found" });
      }
      res.json(annotation);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching annotation");
      res.status(500).json({ error: "Failed to fetch annotation" });
    }
  });

  // Create a new annotation
  app.post("/api/annotations", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertPolicyAnnotationSchema.parse({
        ...req.body,
        userId: req.session.userId
      });

      const annotation = await policyAnnotationStorage.createAnnotation(validatedData);
      res.status(201).json(annotation);
    } catch (error: any) {
      log.error({ err: error }, "Error creating annotation");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create annotation" });
    }
  });

  // Update an annotation
  app.patch("/api/annotations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const annotation = await policyAnnotationStorage.getAnnotationById(parseInt(id));
      
      if (!annotation) {
        return res.status(404).json({ error: "Annotation not found" });
      }

      if (annotation.userId !== req.session.userId) {
        return res.status(403).json({ error: "You can only update your own annotations" });
      }

      const updatedAnnotation = await policyAnnotationStorage.updateAnnotation(
        parseInt(id), 
        req.body
      );
      
      res.json(updatedAnnotation);
    } catch (error: any) {
      log.error({ err: error }, "Error updating annotation");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update annotation" });
    }
  });

  // Delete an annotation (soft delete)
  app.delete("/api/annotations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const annotation = await policyAnnotationStorage.getAnnotationById(parseInt(id));
      
      if (!annotation) {
        return res.status(404).json({ error: "Annotation not found" });
      }

      if (annotation.userId !== req.session.userId) {
        return res.status(403).json({ error: "You can only delete your own annotations" });
      }

      const success = await policyAnnotationStorage.deleteAnnotation(parseInt(id));
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete annotation" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting annotation");
      res.status(500).json({ error: "Failed to delete annotation" });
    }
  });

  // Upvote an annotation
  app.post("/api/annotations/:id/upvote", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const annotation = await policyAnnotationStorage.upvoteAnnotation(parseInt(id));
      res.json(annotation);
    } catch (error: any) {
      log.error({ err: error }, "Error upvoting annotation");
      res.status(500).json({ error: "Failed to upvote annotation" });
    }
  });

  // Downvote an annotation
  app.post("/api/annotations/:id/downvote", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const annotation = await policyAnnotationStorage.downvoteAnnotation(parseInt(id));
      res.json(annotation);
    } catch (error: any) {
      log.error({ err: error }, "Error downvoting annotation");
      res.status(500).json({ error: "Failed to downvote annotation" });
    }
  });

  // Get replies for an annotation
  app.get("/api/annotations/:id/replies", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const replies = await policyAnnotationStorage.getRepliesWithUserDetails(parseInt(id));
      res.json(replies);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching replies");
      res.status(500).json({ error: "Failed to fetch replies" });
    }
  });

  // Add a reply to an annotation
  app.post("/api/annotations/:id/replies", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const validatedData = insertAnnotationReplySchema.parse({
        ...req.body,
        annotationId: parseInt(id),
        userId: req.session.userId
      });

      const reply = await policyAnnotationStorage.createReply(validatedData);
      res.status(201).json(reply);
    } catch (error: any) {
      log.error({ err: error }, "Error creating reply");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create reply" });
    }
  });

  // Delete a reply (soft delete)
  app.delete("/api/annotations/replies/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const reply = await policyAnnotationStorage.getReplyById(parseInt(id));
      
      if (!reply) {
        return res.status(404).json({ error: "Reply not found" });
      }

      if (reply.userId !== req.session.userId) {
        return res.status(403).json({ error: "You can only delete your own replies" });
      }

      const success = await policyAnnotationStorage.deleteReply(parseInt(id));
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete reply" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting reply");
      res.status(500).json({ error: "Failed to delete reply" });
    }
  });

  // Upvote a reply
  app.post("/api/annotations/replies/:id/upvote", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const reply = await policyAnnotationStorage.upvoteReply(parseInt(id));
      res.json(reply);
    } catch (error: any) {
      log.error({ err: error }, "Error upvoting reply");
      res.status(500).json({ error: "Failed to upvote reply" });
    }
  });

  // Downvote a reply
  app.post("/api/annotations/replies/:id/downvote", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const reply = await policyAnnotationStorage.downvoteReply(parseInt(id));
      res.json(reply);
    } catch (error: any) {
      log.error({ err: error }, "Error downvoting reply");
      res.status(500).json({ error: "Failed to downvote reply" });
    }
  });
}