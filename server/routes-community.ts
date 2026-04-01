import { Router } from "express";
import { z } from "zod";
import { communityStorage } from "./storage-community";
import {
  insertBillSuggestionSchema,
  insertBillSuggestionCategorySchema,
  insertBillSuggestionCommentSchema,
} from "../shared/schema-community";
import { CustomRequest } from "./types";
import { isUserAdminById } from "./middleware/auth-middleware";
import { createLogger } from "./logger";
const log = createLogger("routes-community");


// Define extended schemas with additional validation
const createBillSuggestionSchema = insertBillSuggestionSchema.extend({
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  rationale: z.string().min(10),
});

const createBillSuggestionCommentSchema = insertBillSuggestionCommentSchema.extend({
  content: z.string().min(3).max(1000),
});

export const registerCommunityRoutes = (router: Router): void => {
  // Get all bill suggestions with pagination
  router.get("/api/community/suggestions", async (req: CustomRequest, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      
      const suggestions = await communityStorage.getAllBillSuggestions(page, limit);
      res.status(200).json(suggestions);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching bill suggestions");
      res.status(500).json({ error: "Failed to fetch bill suggestions" });
    }
  });

  // Get a specific bill suggestion by ID
  router.get("/api/community/suggestions/:id", async (req: CustomRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const suggestion = await communityStorage.getBillSuggestionById(id);
      if (!suggestion) {
        return res.status(404).json({ error: "Bill suggestion not found" });
      }

      res.status(200).json(suggestion);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching bill suggestion");
      res.status(500).json({ error: "Failed to fetch bill suggestion" });
    }
  });

  // Get suggestions for a specific bill
  router.get("/api/community/suggestions/bill/:billId", async (req: CustomRequest, res) => {
    try {
      const { billId } = req.params;
      const suggestions = await communityStorage.getBillSuggestionsByBillId(billId);
      res.status(200).json(suggestions);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching bill suggestions for bill");
      res.status(500).json({ error: "Failed to fetch bill suggestions" });
    }
  });

  // Get suggestions by a specific user
  router.get("/api/community/suggestions/user/:userId", async (req: CustomRequest, res) => {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }

      const suggestions = await communityStorage.getBillSuggestionsByUserId(userId);
      res.status(200).json(suggestions);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching user's bill suggestions");
      res.status(500).json({ error: "Failed to fetch user's bill suggestions" });
    }
  });

  // Get featured bill suggestions
  router.get("/api/community/suggestions/featured", async (req: CustomRequest, res) => {
    try {
      const limit = Number(req.query.limit) || 5;
      const suggestions = await communityStorage.getFeaturedBillSuggestions(limit);
      res.status(200).json(suggestions);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching featured bill suggestions");
      res.status(500).json({ error: "Failed to fetch featured bill suggestions" });
    }
  });

  // Get trending bill suggestions (most upvoted)
  router.get("/api/community/suggestions/trending", async (req: CustomRequest, res) => {
    try {
      const limit = Number(req.query.limit) || 5;
      const suggestions = await communityStorage.getTrendingBillSuggestions(limit);
      res.status(200).json(suggestions);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching trending bill suggestions");
      res.status(500).json({ error: "Failed to fetch trending bill suggestions" });
    }
  });

  // Search bill suggestions
  router.get("/api/community/suggestions/search", async (req: CustomRequest, res) => {
    try {
      const query = String(req.query.q || "");
      if (!query || query.length < 3) {
        return res.status(400).json({ error: "Search query must be at least 3 characters" });
      }

      const suggestions = await communityStorage.searchBillSuggestions(query);
      res.status(200).json(suggestions);
    } catch (error: any) {
      log.error({ err: error }, "Error searching bill suggestions");
      res.status(500).json({ error: "Failed to search bill suggestions" });
    }
  });

  // Create a new bill suggestion
  router.post("/api/community/suggestions", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to create a suggestion" });
      }

      const userId = req.session.userId;
      const validationResult = createBillSuggestionSchema.safeParse({
        ...req.body,
        userId
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid suggestion data", 
          details: validationResult.error.errors 
        });
      }

      const suggestion = await communityStorage.createBillSuggestion(validationResult.data);
      
      // Add categories if provided
      if (req.body.categories && Array.isArray(req.body.categories)) {
        for (const categoryName of req.body.categories) {
          if (typeof categoryName === 'string' && categoryName.trim()) {
            await communityStorage.addCategory({
              suggestionId: suggestion.id,
              name: categoryName.trim()
            });
          }
        }
      }

      res.status(201).json(suggestion);
    } catch (error: any) {
      log.error({ err: error }, "Error creating bill suggestion");
      res.status(500).json({ error: "Failed to create bill suggestion" });
    }
  });

  // Update a bill suggestion
  router.put("/api/community/suggestions/:id", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to update a suggestion" });
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Verify user owns the suggestion
      const suggestion = await communityStorage.getBillSuggestionById(id);
      if (!suggestion) {
        return res.status(404).json({ error: "Bill suggestion not found" });
      }

      if (suggestion.userId !== req.session.userId) {
        return res.status(403).json({ error: "You can only update your own suggestions" });
      }

      // Only allow updating certain fields
      const allowedUpdates = [
        "title", "description", "rationale", "actionItems", "priority", "impact"
      ];
      
      const updates: Record<string, any> = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedSuggestion = await communityStorage.updateBillSuggestion(id, updates);
      res.status(200).json(updatedSuggestion);
    } catch (error: any) {
      log.error({ err: error }, "Error updating bill suggestion");
      res.status(500).json({ error: "Failed to update bill suggestion" });
    }
  });

  // Delete a bill suggestion
  router.delete("/api/community/suggestions/:id", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to delete a suggestion" });
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Verify user owns the suggestion
      const suggestion = await communityStorage.getBillSuggestionById(id);
      if (!suggestion) {
        return res.status(404).json({ error: "Bill suggestion not found" });
      }

      if (suggestion.userId !== req.session.userId) {
        return res.status(403).json({ error: "You can only delete your own suggestions" });
      }

      await communityStorage.deleteBillSuggestion(id);
      res.status(200).json({ message: "Bill suggestion deleted successfully" });
    } catch (error: any) {
      log.error({ err: error }, "Error deleting bill suggestion");
      res.status(500).json({ error: "Failed to delete bill suggestion" });
    }
  });

  // Set featured status (admin only)
  router.patch("/api/community/suggestions/:id/feature", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      if (!isUserAdminById(req.session.userId)) {
        return res.status(403).json({ error: "Only admins can feature suggestions" });
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const suggestion = await communityStorage.getBillSuggestionById(id);
      if (!suggestion) {
        return res.status(404).json({ error: "Bill suggestion not found" });
      }

      const featured = req.body.featured === true;
      const updatedSuggestion = await communityStorage.setFeaturedStatus(id, featured);

      res.status(200).json(updatedSuggestion);
    } catch (error: any) {
      log.error({ err: error }, "Error featuring bill suggestion");
      res.status(500).json({ error: "Failed to update featured status" });
    }
  });

  // Get all categories with counts
  router.get("/api/community/categories", async (req: CustomRequest, res) => {
    try {
      const categories = await communityStorage.getAllCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching categories");
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get categories for a specific suggestion
  router.get("/api/community/suggestions/:id/categories", async (req: CustomRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const categories = await communityStorage.getSuggestionCategories(id);
      res.status(200).json(categories);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching suggestion categories");
      res.status(500).json({ error: "Failed to fetch suggestion categories" });
    }
  });

  // Add a category to a suggestion
  router.post("/api/community/suggestions/:id/categories", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      const suggestionId = Number(req.params.id);
      if (isNaN(suggestionId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Verify user owns the suggestion
      const suggestion = await communityStorage.getBillSuggestionById(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: "Bill suggestion not found" });
      }

      if (suggestion.userId !== req.session.userId) {
        return res.status(403).json({ error: "You can only add categories to your own suggestions" });
      }

      const validationResult = insertBillSuggestionCategorySchema.safeParse({
        suggestionId,
        name: req.body.name
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid category data", 
          details: validationResult.error.errors 
        });
      }

      const category = await communityStorage.addCategory(validationResult.data);
      res.status(201).json(category);
    } catch (error: any) {
      log.error({ err: error }, "Error adding category");
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  // Remove a category from a suggestion
  router.delete("/api/community/categories/:id", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      const categoryId = Number(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const category = await communityStorage.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const suggestion = await communityStorage.getBillSuggestionById(category.suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: "Associated suggestion not found" });
      }

      const isOwner = suggestion.userId === req.session.userId;
      const isAdmin = isUserAdminById(req.session.userId);
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "You can only remove categories from your own suggestions" });
      }

      await communityStorage.removeCategory(categoryId);
      res.status(200).json({ message: "Category removed successfully" });
    } catch (error: any) {
      log.error({ err: error }, "Error removing category");
      res.status(500).json({ error: "Failed to remove category" });
    }
  });

  // Toggle upvote on a suggestion
  router.post("/api/community/suggestions/:id/upvote", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to upvote" });
      }

      const suggestionId = Number(req.params.id);
      if (isNaN(suggestionId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const suggestion = await communityStorage.getBillSuggestionById(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: "Bill suggestion not found" });
      }

      const result = await communityStorage.toggleUpvote(req.session.userId, suggestionId);
      
      res.status(200).json({ 
        message: result.added ? "Upvote added" : "Upvote removed",
        added: result.added
      });
    } catch (error: any) {
      log.error({ err: error }, "Error toggling upvote");
      res.status(500).json({ error: "Failed to toggle upvote" });
    }
  });

  // Check if user has upvoted a suggestion
  router.get("/api/community/suggestions/:id/upvoted", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      const suggestionId = Number(req.params.id);
      if (isNaN(suggestionId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const hasUpvoted = await communityStorage.hasUserUpvoted(req.session.userId, suggestionId);
      res.status(200).json({ hasUpvoted });
    } catch (error: any) {
      log.error({ err: error }, "Error checking upvote status");
      res.status(500).json({ error: "Failed to check upvote status" });
    }
  });

  // Get comments for a suggestion
  router.get("/api/community/suggestions/:id/comments", async (req: CustomRequest, res) => {
    try {
      const suggestionId = Number(req.params.id);
      if (isNaN(suggestionId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const comments = await communityStorage.getSuggestionComments(suggestionId);
      res.status(200).json(comments);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching comments");
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Add a comment to a suggestion
  router.post("/api/community/suggestions/:id/comments", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to comment" });
      }

      const suggestionId = Number(req.params.id);
      if (isNaN(suggestionId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const validationResult = createBillSuggestionCommentSchema.safeParse({
        suggestionId,
        userId: req.session.userId,
        content: req.body.content
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid comment data", 
          details: validationResult.error.errors 
        });
      }

      const suggestion = await communityStorage.getBillSuggestionById(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: "Bill suggestion not found" });
      }

      const comment = await communityStorage.addComment(validationResult.data);
      res.status(201).json(comment);
    } catch (error: any) {
      log.error({ err: error }, "Error adding comment");
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Update a comment
  router.put("/api/community/comments/:id", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      const commentId = Number(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const existingComment = await communityStorage.getCommentById(commentId);
      if (!existingComment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const isOwner = existingComment.userId === req.session.userId;
      const isAdmin = isUserAdminById(req.session.userId);
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "You can only update your own comments" });
      }
      
      const content = req.body.content;
      if (!content || typeof content !== 'string' || content.length < 3) {
        return res.status(400).json({ error: "Comment must be at least 3 characters" });
      }

      const updatedComment = await communityStorage.updateComment(commentId, content);
      if (!updatedComment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      res.status(200).json(updatedComment);
    } catch (error: any) {
      log.error({ err: error }, "Error updating comment");
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  // Delete a comment
  router.delete("/api/community/comments/:id", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      const commentId = Number(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const existingComment = await communityStorage.getCommentById(commentId);
      if (!existingComment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const isOwner = existingComment.userId === req.session.userId;
      const isAdmin = isUserAdminById(req.session.userId);
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "You can only delete your own comments" });
      }

      await communityStorage.deleteComment(commentId);
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error: any) {
      log.error({ err: error }, "Error deleting comment");
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });
};