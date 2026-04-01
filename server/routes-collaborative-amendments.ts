// @ts-nocheck
import express from 'express';
import { z } from 'zod';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from "./logger";
const log = createLogger("routes-collaborative-amendments");


declare global {
  // eslint-disable-next-line no-var
  var amendments: any[];
}

const router = express.Router();

/**
 * Collaborative Bill Amendment Suggestion Playground
 * Enables citizens to propose, discuss, and refine bill amendments collaboratively
 */

// Amendment suggestion schema
const amendmentSuggestionSchema = z.object({
  billId: z.string(),
  sectionNumber: z.string().optional(),
  lineNumber: z.number().optional(),
  amendmentType: z.enum(['addition', 'deletion', 'modification', 'substitution']),
  originalText: z.string(),
  proposedText: z.string(),
  rationale: z.string(),
  category: z.enum(['technical', 'policy', 'clarity', 'scope', 'enforcement']),
  impact: z.enum(['minor', 'moderate', 'major']),
  tags: z.array(z.string()).default([])
});

const commentSchema = z.object({
  amendmentId: z.string(),
  content: z.string(),
  commentType: z.enum(['support', 'oppose', 'suggestion', 'question']),
  isExpert: z.boolean().default(false),
  expertise: z.string().optional()
});

const voteSchema = z.object({
  amendmentId: z.string(),
  vote: z.enum(['support', 'oppose', 'neutral']),
  reasoning: z.string().optional()
});

/**
 * Submit a new amendment suggestion
 */
router.post('/api/amendments/suggest', async (req, res) => {
  try {
    const amendmentData = amendmentSuggestionSchema.parse(req.body);
    const userId = req.session?.userId || 'anonymous';
    
    const amendment = {
      id: uuidv4(),
      ...amendmentData,
      authorId: userId,
      status: 'open',
      votes: {
        support: 0,
        oppose: 0,
        neutral: 0
      },
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory for now (would be database in production)
    if (!global.amendments) {
      global.amendments = [];
    }
    global.amendments.push(amendment);

    log.info(`✅ New amendment suggestion created for bill ${amendmentData.billId}`);

    res.json({
      success: true,
      amendment,
      message: 'Amendment suggestion submitted successfully'
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error creating amendment suggestion');
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get amendment suggestions for a bill
 */
router.get('/api/amendments/bill/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    const { sortBy = 'votes', category, status } = req.query;

    if (!global.amendments) {
      global.amendments = [];
    }

    let amendments = global.amendments.filter((a: any) => a.billId === billId);

    // Apply filters
    if (category) {
      amendments = amendments.filter((a: any) => a.category === category);
    }
    if (status) {
      amendments = amendments.filter((a: any) => a.status === status);
    }

    // Sort amendments
    if (sortBy === 'votes') {
      amendments.sort((a: any, b: any) => b.votes.support - a.votes.support);
    } else if (sortBy === 'recent') {
      amendments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({
      success: true,
      amendments: amendments.map((a: any) => ({
        ...a,
        totalVotes: a.votes.support + a.votes.oppose + a.votes.neutral,
        supportPercentage: a.votes.support + a.votes.oppose + a.votes.neutral > 0 
          ? Math.round((a.votes.support / (a.votes.support + a.votes.oppose + a.votes.neutral)) * 100)
          : 0
      }))
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching amendments');
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get specific amendment details
 */
router.get('/api/amendments/:amendmentId', async (req, res) => {
  try {
    const { amendmentId } = req.params;

    if (!global.amendments) {
      global.amendments = [];
    }

    const amendment = global.amendments.find((a: any) => a.id === amendmentId);

    if (!amendment) {
      return res.status(404).json({
        success: false,
        message: 'Amendment not found'
      });
    }

    res.json({
      success: true,
      amendment: {
        ...amendment,
        totalVotes: amendment.votes.support + amendment.votes.oppose + amendment.votes.neutral,
        supportPercentage: amendment.votes.support + amendment.votes.oppose + amendment.votes.neutral > 0 
          ? Math.round((amendment.votes.support / (amendment.votes.support + amendment.votes.oppose + amendment.votes.neutral)) * 100)
          : 0
      }
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching amendment');
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Vote on an amendment
 */
router.post('/api/amendments/:amendmentId/vote', async (req, res) => {
  try {
    const { amendmentId } = req.params;
    const voteData = voteSchema.parse(req.body);
    const userId = req.session?.userId || 'anonymous';

    if (!global.amendments) {
      global.amendments = [];
    }

    const amendmentIndex = global.amendments.findIndex((a: any) => a.id === amendmentId);
    
    if (amendmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Amendment not found'
      });
    }

    const amendment = global.amendments[amendmentIndex];

    // Initialize user votes if not exists
    if (!amendment.userVotes) {
      amendment.userVotes = {};
    }

    // Remove previous vote if exists
    if (amendment.userVotes[userId]) {
      const previousVote = amendment.userVotes[userId];
      amendment.votes[previousVote]--;
    }

    // Add new vote
    amendment.userVotes[userId] = voteData.vote;
    amendment.votes[voteData.vote]++;
    amendment.updatedAt = new Date().toISOString();

    // Store vote reasoning if provided
    if (voteData.reasoning) {
      if (!amendment.voteReasons) {
        amendment.voteReasons = {};
      }
      amendment.voteReasons[userId] = voteData.reasoning;
    }

    global.amendments[amendmentIndex] = amendment;

    log.info(`✅ Vote recorded: ${voteData.vote} for amendment ${amendmentId}`);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      amendment: {
        ...amendment,
        totalVotes: amendment.votes.support + amendment.votes.oppose + amendment.votes.neutral,
        supportPercentage: amendment.votes.support + amendment.votes.oppose + amendment.votes.neutral > 0 
          ? Math.round((amendment.votes.support / (amendment.votes.support + amendment.votes.oppose + amendment.votes.neutral)) * 100)
          : 0
      }
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error recording vote');
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Add comment to an amendment
 */
router.post('/api/amendments/:amendmentId/comments', async (req, res) => {
  try {
    const { amendmentId } = req.params;
    const commentData = commentSchema.parse(req.body);
    const userId = req.session?.userId || 'anonymous';

    if (!global.amendments) {
      global.amendments = [];
    }

    const amendmentIndex = global.amendments.findIndex((a: any) => a.id === amendmentId);
    
    if (amendmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Amendment not found'
      });
    }

    const comment = {
      id: uuidv4(),
      ...commentData,
      authorId: userId,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: []
    };

    global.amendments[amendmentIndex].comments.push(comment);
    global.amendments[amendmentIndex].updatedAt = new Date().toISOString();

    log.info(`✅ Comment added to amendment ${amendmentId}`);

    res.json({
      success: true,
      comment,
      message: 'Comment added successfully'
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error adding comment');
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get amendment statistics and analytics
 */
router.get('/api/amendments/stats', async (req, res) => {
  try {
    if (!global.amendments) {
      global.amendments = [];
    }

    const stats = {
      totalAmendments: global.amendments.length,
      byCategory: {},
      byStatus: {},
      byImpact: {},
      totalVotes: 0,
      totalComments: 0,
      averageSupport: 0,
      mostActiveAuthors: {},
      recentActivity: []
    };

    // Calculate statistics
    global.amendments.forEach((amendment: any) => {
      // Category stats
      stats.byCategory[amendment.category] = (stats.byCategory[amendment.category] || 0) + 1;
      
      // Status stats
      stats.byStatus[amendment.status] = (stats.byStatus[amendment.status] || 0) + 1;
      
      // Impact stats
      stats.byImpact[amendment.impact] = (stats.byImpact[amendment.impact] || 0) + 1;
      
      // Vote and comment totals
      stats.totalVotes += amendment.votes.support + amendment.votes.oppose + amendment.votes.neutral;
      stats.totalComments += amendment.comments.length;
      
      // Author activity
      stats.mostActiveAuthors[amendment.authorId] = (stats.mostActiveAuthors[amendment.authorId] || 0) + 1;
      
      // Recent activity
      stats.recentActivity.push({
        type: 'amendment',
        id: amendment.id,
        title: amendment.proposedText.substring(0, 50) + '...',
        createdAt: amendment.createdAt
      });
    });

    // Calculate average support
    const amendmentsWithVotes = global.amendments.filter((a: any) => 
      (a.votes.support + a.votes.oppose + a.votes.neutral) > 0
    );
    
    if (amendmentsWithVotes.length > 0) {
      stats.averageSupport = Math.round(
        amendmentsWithVotes.reduce((acc: number, a: any) => {
          const total = a.votes.support + a.votes.oppose + a.votes.neutral;
          return acc + (a.votes.support / total);
        }, 0) / amendmentsWithVotes.length * 100
      );
    }

    // Sort recent activity
    stats.recentActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    stats.recentActivity = stats.recentActivity.slice(0, 10);

    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching amendment stats');
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Search amendments
 */
router.get('/api/amendments/search', async (req, res) => {
  try {
    const { q, category, impact, status } = req.query;

    if (!global.amendments) {
      global.amendments = [];
    }

    let results = [...global.amendments];

    // Text search
    if (q && typeof q === 'string') {
      const searchTerm = q.toLowerCase();
      results = results.filter((a: any) => 
        a.proposedText.toLowerCase().includes(searchTerm) ||
        a.rationale.toLowerCase().includes(searchTerm) ||
        a.originalText.toLowerCase().includes(searchTerm) ||
        a.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by category
    if (category && typeof category === 'string') {
      results = results.filter((a: any) => a.category === category);
    }

    // Filter by impact
    if (impact && typeof impact === 'string') {
      results = results.filter((a: any) => a.impact === impact);
    }

    // Filter by status
    if (status && typeof status === 'string') {
      results = results.filter((a: any) => a.status === status);
    }

    // Add calculated fields
    results = results.map((a: any) => ({
      ...a,
      totalVotes: a.votes.support + a.votes.oppose + a.votes.neutral,
      supportPercentage: a.votes.support + a.votes.oppose + a.votes.neutral > 0 
        ? Math.round((a.votes.support / (a.votes.support + a.votes.oppose + a.votes.neutral)) * 100)
        : 0
    }));

    res.json({
      success: true,
      results,
      count: results.length
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error searching amendments');
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;