// @ts-nocheck
import { Request, Response } from "express";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Mock amendments data - in production this would be stored in database
let mockAmendments = [
  {
    id: "1",
    billId: "texas-authentic-1",
    section: "Section 2.1",
    originalText: "The department shall establish regulations within 90 days",
    proposedText: "The department shall establish regulations within 60 days and provide public comment period of 30 days",
    rationale: "This amendment reduces implementation time and ensures public input, making the process more efficient and transparent.",
    author: "Sarah Chen",
    status: "proposed" as const,
    votes: { up: 8, down: 2 },
    comments: [
      {
        id: "c1",
        amendmentId: "1",
        author: "Mike Johnson",
        text: "This makes sense for public transparency",
        type: "support" as const,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString()
  },
  {
    id: "2",
    billId: "texas-authentic-2",
    section: "Section 1.3",
    originalText: "Funding shall be allocated based on district size",
    proposedText: "Funding shall be allocated based on district size and economic need index",
    rationale: "Including economic need ensures equitable distribution of resources to areas that need them most.",
    author: "David Rodriguez",
    status: "reviewed" as const,
    votes: { up: 12, down: 1 },
    comments: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date().toISOString()
  }
];

export function registerAmendmentPlaygroundRoutes(app: any) {
  // Get all amendments for a specific bill
  app.get("/api/amendments/:billId?", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      let amendments = mockAmendments;
      
      if (billId) {
        amendments = mockAmendments.filter(amendment => amendment.billId === billId);
      }
      
      // Sort by most recent first
      amendments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(amendments);
    } catch (error: any) {
      console.error("Error fetching amendments:", error);
      res.status(500).json({ error: "Failed to fetch amendments" });
    }
  });

  // Create a new amendment
  app.post("/api/amendments", async (req: Request, res: Response) => {
    try {
      const {
        billId,
        section,
        originalText,
        proposedText,
        rationale,
        author
      } = req.body;

      // Validate required fields
      if (!billId || !proposedText || !rationale || !author) {
        return res.status(400).json({ 
          error: "Missing required fields: billId, proposedText, rationale, author" 
        });
      }

      // Create new amendment
      const newAmendment = {
        id: `amendment_${Date.now()}`,
        billId,
        section: section || "General",
        originalText: originalText || "",
        proposedText,
        rationale,
        author,
        status: "proposed" as const,
        votes: { up: 0, down: 0 },
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to mock storage
      mockAmendments.push(newAmendment);

      res.status(201).json(newAmendment);
    } catch (error: any) {
      console.error("Error creating amendment:", error);
      res.status(500).json({ error: "Failed to create amendment" });
    }
  });

  // Vote on an amendment
  app.post("/api/amendments/:amendmentId/vote", async (req: Request, res: Response) => {
    try {
      const { amendmentId } = req.params;
      const { vote } = req.body;

      if (!vote || !['up', 'down'].includes(vote)) {
        return res.status(400).json({ error: "Vote must be 'up' or 'down'" });
      }

      const amendmentIndex = mockAmendments.findIndex(a => a.id === amendmentId);
      
      if (amendmentIndex === -1) {
        return res.status(404).json({ error: "Amendment not found" });
      }

      // Update vote count
      if (vote === 'up') {
        mockAmendments[amendmentIndex].votes.up += 1;
      } else {
        mockAmendments[amendmentIndex].votes.down += 1;
      }

      mockAmendments[amendmentIndex].updatedAt = new Date().toISOString();

      res.json(mockAmendments[amendmentIndex]);
    } catch (error: any) {
      console.error("Error voting on amendment:", error);
      res.status(500).json({ error: "Failed to vote on amendment" });
    }
  });

  // Add comment to amendment
  app.post("/api/amendments/:amendmentId/comments", async (req: Request, res: Response) => {
    try {
      const { amendmentId } = req.params;
      const { author, text, type } = req.body;

      if (!author || !text || !type) {
        return res.status(400).json({ 
          error: "Missing required fields: author, text, type" 
        });
      }

      const amendmentIndex = mockAmendments.findIndex(a => a.id === amendmentId);
      
      if (amendmentIndex === -1) {
        return res.status(404).json({ error: "Amendment not found" });
      }

      const newComment = {
        id: `comment_${Date.now()}`,
        amendmentId,
        author,
        text,
        type,
        createdAt: new Date().toISOString()
      };

      mockAmendments[amendmentIndex].comments.push(newComment);
      mockAmendments[amendmentIndex].updatedAt = new Date().toISOString();

      res.status(201).json(newComment);
    } catch (error: any) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Update amendment status (for moderation)
  app.patch("/api/amendments/:amendmentId/status", async (req: Request, res: Response) => {
    try {
      const { amendmentId } = req.params;
      const { status } = req.body;

      const validStatuses = ['draft', 'proposed', 'reviewed', 'accepted', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Status must be one of: ${validStatuses.join(', ')}` 
        });
      }

      const amendmentIndex = mockAmendments.findIndex(a => a.id === amendmentId);
      
      if (amendmentIndex === -1) {
        return res.status(404).json({ error: "Amendment not found" });
      }

      mockAmendments[amendmentIndex].status = status;
      mockAmendments[amendmentIndex].updatedAt = new Date().toISOString();

      res.json(mockAmendments[amendmentIndex]);
    } catch (error: any) {
      console.error("Error updating amendment status:", error);
      res.status(500).json({ error: "Failed to update amendment status" });
    }
  });

  // Get amendment details
  app.get("/api/amendments/:amendmentId", async (req: Request, res: Response) => {
    try {
      const { amendmentId } = req.params;
      
      const amendment = mockAmendments.find(a => a.id === amendmentId);
      
      if (!amendment) {
        return res.status(404).json({ error: "Amendment not found" });
      }

      res.json(amendment);
    } catch (error: any) {
      console.error("Error fetching amendment:", error);
      res.status(500).json({ error: "Failed to fetch amendment" });
    }
  });

  // Generate AI suggestions for a bill (simulated)
  app.post("/api/amendments/ai-suggestions", async (req: Request, res: Response) => {
    try {
      const { billText, billId } = req.body;

      if (!billText) {
        return res.status(400).json({ error: "Bill text is required" });
      }

      // Simulate AI analysis with contextual suggestions
      const suggestions = [
        {
          type: 'clarity',
          suggestion: 'Consider adding specific implementation timelines to improve clarity',
          section: 'Section 2',
          confidence: 0.87,
          rationale: 'Bills with specific timelines have 23% higher success rates in implementation'
        },
        {
          type: 'legal',
          suggestion: 'Review compliance with Texas Administrative Code Section 1.15',
          section: 'Section 3',
          confidence: 0.74,
          rationale: 'Potential conflict with existing state regulations identified'
        },
        {
          type: 'impact',
          suggestion: 'Add provisions for small business exemptions or phase-in periods',
          section: 'Section 1',
          confidence: 0.69,
          rationale: 'Economic impact analysis suggests disproportionate effect on small businesses'
        },
        {
          type: 'accessibility',
          suggestion: 'Include language accessibility requirements for public notices',
          section: 'Section 4',
          confidence: 0.81,
          rationale: 'Texas has significant Spanish-speaking population requiring multilingual access'
        }
      ];

      res.json(suggestions);
    } catch (error: any) {
      console.error("Error generating AI suggestions:", error);
      res.status(500).json({ error: "Failed to generate AI suggestions" });
    }
  });

  // Get amendment statistics
  app.get("/api/amendments/stats", async (req: Request, res: Response) => {
    try {
      const stats = {
        totalAmendments: mockAmendments.length,
        byStatus: {
          proposed: mockAmendments.filter(a => a.status === 'proposed').length,
          reviewed: mockAmendments.filter(a => a.status === 'reviewed').length,
          accepted: mockAmendments.filter(a => a.status === 'accepted').length,
          rejected: mockAmendments.filter(a => a.status === 'rejected').length
        },
        topContributors: [
          { author: 'Sarah Chen', count: 3 },
          { author: 'David Rodriguez', count: 2 },
          { author: 'Maria Gonzalez', count: 2 }
        ],
        recentActivity: mockAmendments
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map(a => ({
            id: a.id,
            author: a.author,
            action: 'proposed amendment',
            billId: a.billId,
            timestamp: a.createdAt
          }))
      };

      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching amendment stats:", error);
      res.status(500).json({ error: "Failed to fetch amendment statistics" });
    }
  });
}