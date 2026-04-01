import { Request, Response, Express } from "express";
import { civicTermsStorage } from "./storage-civic-terms";
import { insertCivicTermSchema, insertCivicTermAppearanceSchema } from "@shared/schema-civic-terms";
import { isAuthenticated } from "./auth";
import { isAdmin } from "./middleware/auth-middleware";
import { CustomRequest } from "./types";
import { z } from "zod";

/**
 * Register civic terms API routes
 */
export function registerCivicTermsRoutes(app: Express): void {
  /**
   * Get all civic terms
   */
  app.get("/api/civic-terms", async (_req: Request, res: Response) => {
    try {
      const terms = await civicTermsStorage.getAllCivicTerms();
      res.json(terms);
    } catch (error: any) {
      console.error("Error getting civic terms:", error);
      res.status(500).json({ error: "Failed to get civic terms" });
    }
  });

  /**
   * Get civic term by ID
   */
  app.get("/api/civic-terms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const term = await civicTermsStorage.getCivicTerm(id);
      if (!term) {
        return res.status(404).json({ error: "Civic term not found" });
      }

      res.json(term);
    } catch (error: any) {
      console.error("Error getting civic term:", error);
      res.status(500).json({ error: "Failed to get civic term" });
    }
  });

  /**
   * Get civic terms by category
   */
  app.get("/api/civic-terms/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const terms = await civicTermsStorage.getCivicTermsByCategory(category);
      res.json(terms);
    } catch (error: any) {
      console.error("Error getting civic terms by category:", error);
      res.status(500).json({ error: "Failed to get civic terms by category" });
    }
  });

  /**
   * Get civic terms by difficulty level
   */
  app.get("/api/civic-terms/difficulty/:difficulty", async (req: Request, res: Response) => {
    try {
      const difficulty = req.params.difficulty;
      const terms = await civicTermsStorage.getCivicTermsByDifficulty(difficulty);
      res.json(terms);
    } catch (error: any) {
      console.error("Error getting civic terms by difficulty:", error);
      res.status(500).json({ error: "Failed to get civic terms by difficulty" });
    }
  });

  /**
   * Search civic terms
   */
  app.get("/api/civic-terms/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const terms = await civicTermsStorage.searchCivicTerms(query);
      res.json(terms);
    } catch (error: any) {
      console.error("Error searching civic terms:", error);
      res.status(500).json({ error: "Failed to search civic terms" });
    }
  });

  /**
   * Create a new civic term (admin only)
   */
  app.post("/api/civic-terms", isAuthenticated, isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const validatedData = insertCivicTermSchema.parse(req.body);
      const newTerm = await civicTermsStorage.createCivicTerm(validatedData);
      res.status(201).json(newTerm);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating civic term:", error);
      res.status(500).json({ error: "Failed to create civic term" });
    }
  });

  /**
   * Update a civic term (admin only)
   */
  app.patch("/api/civic-terms/:id", isAuthenticated, isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const validatedData = insertCivicTermSchema.partial().parse(req.body);
      const updatedTerm = await civicTermsStorage.updateCivicTerm(id, validatedData);
      
      if (!updatedTerm) {
        return res.status(404).json({ error: "Civic term not found" });
      }

      res.json(updatedTerm);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating civic term:", error);
      res.status(500).json({ error: "Failed to update civic term" });
    }
  });

  /**
   * Delete a civic term (admin only)
   */
  app.delete("/api/civic-terms/:id", isAuthenticated, isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const success = await civicTermsStorage.deleteCivicTerm(id);
      if (!success) {
        return res.status(404).json({ error: "Civic term not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting civic term:", error);
      res.status(500).json({ error: "Failed to delete civic term" });
    }
  });

  /**
   * Track a term appearance
   */
  app.post("/api/civic-terms/appearances", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCivicTermAppearanceSchema.parse(req.body);
      const id = await civicTermsStorage.trackTermAppearance(validatedData);
      res.status(201).json({ id });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error tracking term appearance:", error);
      res.status(500).json({ error: "Failed to track term appearance" });
    }
  });

  /**
   * Get related terms for a term
   */
  app.get("/api/civic-terms/:id/related", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const relatedTerms = await civicTermsStorage.getRelatedTerms(id);
      res.json(relatedTerms);
    } catch (error: any) {
      console.error("Error getting related terms:", error);
      res.status(500).json({ error: "Failed to get related terms" });
    }
  });
}