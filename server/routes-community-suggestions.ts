// @ts-nocheck
import { Router } from "express";
import { z } from "zod";
import { db } from "./db";
import { billSuggestions, billSuggestionComments, billSuggestionUpvotes } from "@shared/schema";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import { createLogger } from "./logger";
const log = createLogger("routes-community-suggestions");


const router = Router();

// Validation schemas
const createSuggestionSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(2000),
  category: z.enum(["healthcare", "education", "environment", "economy", "transportation", "housing", "criminal_justice"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  tags: z.array(z.string()).default([])
});

const voteSchema = z.object({
  voteType: z.enum(["up", "down"])
});

const commentSchema = z.object({
  content: z.string().min(10).max(1000)
});

// Get all bill suggestions with filtering and sorting
router.get("/bill-suggestions", async (req, res) => {
  try {
    const { search = "", category = "all", sortBy = "trending", limit = "20" } = req.query;
    
    let query = db
      .select({
        id: billSuggestions.id,
        title: billSuggestions.title,
        description: billSuggestions.description,
        category: billSuggestions.category,
        priority: billSuggestions.priority,
        submittedBy: billSuggestions.submittedBy,
        submittedAt: billSuggestions.submittedAt,
        upvotes: billSuggestions.upvotes,
        downvotes: billSuggestions.downvotes,
        commentCount: billSuggestions.commentCount,
        status: billSuggestions.status,
        tags: billSuggestions.tags,
        views: billSuggestions.views
      })
      .from(billSuggestions).$dynamic();

    // Apply category filter
    if (category !== "all") {
      query = query.where(eq(billSuggestions.category, category as string));
    }

    // Apply search filter
    if (search) {
      query = query.where(
        sql`${billSuggestions.title} ILIKE ${'%' + search + '%'} OR ${billSuggestions.description} ILIKE ${'%' + search + '%'}`
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        query = query.orderBy(desc(billSuggestions.submittedAt));
        break;
      case "most_voted":
        query = query.orderBy(desc(billSuggestions.upvotes));
        break;
      case "most_discussed":
        query = query.orderBy(desc(billSuggestions.commentCount));
        break;
      case "trending":
      default:
        // Trending: combination of recent upvotes and comments
        query = query.orderBy(
          desc(sql`(${billSuggestions.upvotes} * 2 + ${billSuggestions.commentCount}) / EXTRACT(days FROM NOW() - ${billSuggestions.submittedAt} + 1)`)
        );
        break;
    }

    query = query.limit(parseInt(limit as string));

    const suggestions = await query;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(billSuggestions);
    
    const total = totalResult[0]?.count || 0;

    // Get stats
    const activeThisWeekResult = await db
      .select({ count: count() })
      .from(billSuggestions).$dynamic()
      .where(sql`${billSuggestions.submittedAt} >= NOW() - INTERVAL '7 days'`);
    
    const implementedResult = await db
      .select({ count: count() })
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.status, "implemented"));

    res.json({
      suggestions,
      total,
      activeThisWeek: activeThisWeekResult[0]?.count || 0,
      implemented: implementedResult[0]?.count || 0,
      query: search
    });
  } catch (error: any) {
    log.error({ err: error }, "Error fetching bill suggestions");
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Create a new bill suggestion
router.post("/bill-suggestions", async (req, res) => {
  try {
    const validatedData = createSuggestionSchema.parse(req.body);
    
    // For demo purposes, using a default user. In production, get from session/auth
    const submittedBy = req.user?.username || "Demo User";
    
    const newSuggestion = await db
      .insert(billSuggestions)
      .values({
        ...validatedData,
        submittedBy,
        submittedAt: new Date(),
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        status: "proposed",
        views: 0
      })
      .returning();

    res.json({
      success: true,
      suggestion: newSuggestion[0]
    });
  } catch (error: any) {
    log.error({ err: error }, "Error creating bill suggestion");
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to create suggestion" });
    }
  }
});

// Vote on a suggestion
router.post("/suggestions/:id/vote", async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = voteSchema.parse(req.body);
    
    // For demo purposes, using a default user
    const userId = req.user?.id || "demo-user-1";
    
    // Check if user already voted
    const existingVote = await db
      .select()
      .from(billSuggestionUpvotes).$dynamic()
      .where(
        and(
          eq(billSuggestionUpvotes.suggestionId, parseInt(id)),
          eq(billSuggestionUpvotes.userId, userId)
        )
      );

    if (existingVote.length > 0) {
      // Update existing vote
      await db
        .update(billSuggestionUpvotes)
        .set({ 
          voteType,
          votedAt: new Date()
        })
        .where(
          and(
            eq(billSuggestionUpvotes.suggestionId, parseInt(id)),
            eq(billSuggestionUpvotes.userId, userId)
          )
        );
    } else {
      // Create new vote
      await db
        .insert(billSuggestionUpvotes)
        .values({
          suggestionId: parseInt(id),
          userId,
          voteType,
          votedAt: new Date()
        });
    }

    // Update vote counts on the suggestion
    const upvotes = await db
      .select({ count: count() })
      .from(billSuggestionUpvotes).$dynamic()
      .where(
        and(
          eq(billSuggestionUpvotes.suggestionId, parseInt(id)),
          eq(billSuggestionUpvotes.voteType, "up")
        )
      );

    const downvotes = await db
      .select({ count: count() })
      .from(billSuggestionUpvotes).$dynamic()
      .where(
        and(
          eq(billSuggestionUpvotes.suggestionId, parseInt(id)),
          eq(billSuggestionUpvotes.voteType, "down")
        )
      );

    await db
      .update(billSuggestions)
      .set({
        upvotes: upvotes[0]?.count || 0,
        downvotes: downvotes[0]?.count || 0
      })
      .where(eq(billSuggestions.id, parseInt(id)));

    res.json({ success: true });
  } catch (error: any) {
    log.error({ err: error }, "Error voting on suggestion");
    res.status(500).json({ error: "Failed to vote" });
  }
});

// Get comments for a suggestion
router.get("/suggestions/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    
    const comments = await db
      .select()
      .from(billSuggestionComments).$dynamic()
      .where(eq(billSuggestionComments.suggestionId, parseInt(id)))
      .orderBy(desc(billSuggestionComments.createdAt));

    res.json(comments);
  } catch (error: any) {
    log.error({ err: error }, "Error fetching comments");
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a comment to a suggestion
router.post("/suggestions/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = commentSchema.parse(req.body);
    
    // For demo purposes, using a default user
    const author = req.user?.username || "Demo User";
    
    const newComment = await db
      .insert(billSuggestionComments)
      .values({
        suggestionId: parseInt(id),
        content,
        author,
        createdAt: new Date(),
        upvotes: 0
      })
      .returning();

    // Update comment count on the suggestion
    await db
      .update(billSuggestions)
      .set({
        commentCount: sql`${billSuggestions.commentCount} + 1`
      })
      .where(eq(billSuggestions.id, parseInt(id)));

    res.json({
      success: true,
      comment: newComment[0]
    });
  } catch (error: any) {
    log.error({ err: error }, "Error adding comment");
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to add comment" });
    }
  }
});

// Get trending tags
router.get("/trending-tags", async (req, res) => {
  try {
    // This would be more complex in a real implementation
    // For now, return some sample trending tags
    const trendingTags = [
      { tag: "affordable-housing", count: 24 },
      { tag: "climate-action", count: 18 },
      { tag: "education-funding", count: 15 },
      { tag: "healthcare-access", count: 12 },
      { tag: "transportation", count: 10 }
    ];

    res.json(trendingTags);
  } catch (error: any) {
    log.error({ err: error }, "Error fetching trending tags");
    res.status(500).json({ error: "Failed to fetch trending tags" });
  }
});

// Get top contributors
router.get("/top-contributors", async (req, res) => {
  try {
    // This would query actual user data in production
    const topContributors = [
      { name: "Sarah Chen", suggestions: 12, upvotes: 145 },
      { name: "Mike Rodriguez", suggestions: 8, upvotes: 98 },
      { name: "Emily Johnson", suggestions: 6, upvotes: 76 },
      { name: "David Park", suggestions: 5, upvotes: 62 },
      { name: "Lisa Thompson", suggestions: 4, upvotes: 55 }
    ];

    res.json(topContributors);
  } catch (error: any) {
    log.error({ err: error }, "Error fetching top contributors");
    res.status(500).json({ error: "Failed to fetch top contributors" });
  }
});

export default router;