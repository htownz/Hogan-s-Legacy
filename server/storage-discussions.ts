// @ts-nocheck
import { db } from './db';
import { eq, and, or, isNull, desc, sql, inArray } from 'drizzle-orm';
import { 
  discussionForums, 
  discussionThreads, 
  discussionPosts, 
  discussionReactions, 
  discussionModerators,
  discussionReports,
  InsertDiscussionForum,
  InsertDiscussionThread,
  InsertDiscussionPost,
  InsertDiscussionReaction,
  InsertDiscussionModerator,
  InsertDiscussionReport,
  DiscussionForum,
  DiscussionThread,
  DiscussionPost
} from '../shared/schema-discussions';
import { createLogger } from "./logger";
const log = createLogger("storage-discussions");


/**
 * Discussion forum storage implementation
 */
export const discussionStorage = {
  // ---- FORUMS ----
  async getForums(options: { 
    userId?: number;
    circleId?: number;
    billId?: string;
    category?: string;
    includePrivate?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { userId, circleId, billId, category, includePrivate = false, limit = 50, offset = 0 } = options;
    
    try {
      // Build query based on filters
      let query = db.select().from(discussionForums).$dynamic()
        .where(eq(discussionForums.isActive, true));
      
      // If not requesting to see private forums, only show public ones
      if (!includePrivate) {
        query = query.where(eq(discussionForums.visibility, 'public'));
      } else if (userId) {
        // Show public forums OR private forums created by this user
        query = query.where(
          or(
            eq(discussionForums.visibility, 'public'),
            and(
              eq(discussionForums.visibility, 'private'),
              eq(discussionForums.createdBy, userId)
            )
          )
        );
      }
      
      // Filter by circle if requested
      if (circleId) {
        query = query.where(eq(discussionForums.circleId, circleId));
      }
      
      // Filter by bill if requested
      if (billId) {
        query = query.where(eq(discussionForums.billId, billId));
      }
      
      // Filter by category if requested
      if (category) {
        query = query.where(eq(discussionForums.category, category));
      }
      
      // Order by pinned status (descending) and then by last activity
      query = query
        .orderBy(desc(discussionForums.isPinned), desc(discussionForums.lastActivityAt))
        .limit(limit)
        .offset(offset);
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting forums');
      throw error;
    }
  },
  
  async getForumById(id: number) {
    try {
      const forums = await db.select().from(discussionForums).$dynamic()
        .where(eq(discussionForums.id, id))
        .limit(1);
      
      return forums.length > 0 ? forums[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting forum by ID');
      throw error;
    }
  },
  
  async createForum(data: InsertDiscussionForum) {
    try {
      const result = await db.insert(discussionForums).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating forum');
      throw error;
    }
  },
  
  async updateForum(id: number, data: Partial<InsertDiscussionForum>) {
    try {
      const result = await db.update(discussionForums)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(discussionForums.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating forum');
      throw error;
    }
  },
  
  async deleteForum(id: number) {
    try {
      // Instead of actually deleting, set isActive to false
      await db.update(discussionForums)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(discussionForums.id, id));
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting forum');
      throw error;
    }
  },
  
  // ---- THREADS ----
  async getThreads(options: {
    forumId: number;
    userId?: number;
    onlyPinned?: boolean;
    includeModerated?: boolean;
    modStatus?: string[];
    limit?: number;
    offset?: number;
  }) {
    const { 
      forumId, 
      userId, 
      onlyPinned = false, 
      includeModerated = false, 
      modStatus = ['approved'], 
      limit = 20, 
      offset = 0 
    } = options;
    
    try {
      let query = db.select().from(discussionThreads).$dynamic()
        .where(
          and(
            eq(discussionThreads.forumId, forumId),
            eq(discussionThreads.isActive, true)
          )
        );
      
      // Filter by pinned status if requested
      if (onlyPinned) {
        query = query.where(eq(discussionThreads.isPinned, true));
      }
      
      // Filter by moderation status
      if (!includeModerated) {
        query = query.where(inArray(discussionThreads.moderationStatus, modStatus));
      }
      
      // Order by pinned status and then by last reply time
      query = query
        .orderBy(desc(discussionThreads.isPinned), desc(discussionThreads.lastReplyAt))
        .limit(limit)
        .offset(offset);
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting threads');
      throw error;
    }
  },
  
  async getThreadById(id: number, includeUserThreads = false) {
    try {
      const threads = await db.select().from(discussionThreads).$dynamic()
        .where(
          and(
            eq(discussionThreads.id, id),
            eq(discussionThreads.isActive, true)
          )
        )
        .limit(1);
      
      return threads.length > 0 ? threads[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting thread by ID');
      throw error;
    }
  },
  
  async createThread(data: InsertDiscussionThread) {
    try {
      // Start transaction to create thread and update forum
      const result = await db.transaction(async (tx) => {
        // Create the thread
        const threadResult = await tx.insert(discussionThreads).values(data).returning();
        
        // Update the forum stats
        await tx.update(discussionForums)
          .set({
            totalThreads: sql`${discussionForums.totalThreads} + 1`,
            lastActivityAt: new Date()
          })
          .where(eq(discussionForums.id, data.forumId));
        
        return threadResult;
      });
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating thread');
      throw error;
    }
  },
  
  async updateThread(id: number, data: Partial<InsertDiscussionThread>) {
    try {
      const result = await db.update(discussionThreads)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(discussionThreads.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating thread');
      throw error;
    }
  },
  
  async deleteThread(id: number) {
    try {
      // Get thread info before deleting
      const thread = await this.getThreadById(id);
      if (!thread) return false;
      
      // Start transaction to delete thread and update forum
      await db.transaction(async (tx) => {
        // Mark thread as inactive (soft delete)
        await tx.update(discussionThreads)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(discussionThreads.id, id));
        
        // Update forum stats
        await tx.update(discussionForums)
          .set({
            totalThreads: sql`${discussionForums.totalThreads} - 1`,
            totalPosts: sql`${discussionForums.totalPosts} - ${thread.totalReplies + 1}`,
            lastActivityAt: new Date()
          })
          .where(eq(discussionForums.id, thread.forumId));
      });
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting thread');
      throw error;
    }
  },
  
  async moderateThread(
    id: number, 
    status: 'approved' | 'rejected' | 'flagged', 
    moderatorId: number, 
    notes?: string
  ) {
    try {
      const result = await db.update(discussionThreads)
        .set({
          moderationStatus: status,
          moderatedBy: moderatorId,
          moderationNotes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(discussionThreads.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error moderating thread');
      throw error;
    }
  },
  
  // ---- POSTS (REPLIES) ----
  async getPosts(options: {
    threadId: number;
    includeModerated?: boolean;
    modStatus?: string[];
    limit?: number;
    offset?: number;
  }) {
    const { 
      threadId, 
      includeModerated = false, 
      modStatus = ['approved'], 
      limit = 50, 
      offset = 0 
    } = options;
    
    try {
      let query = db.select().from(discussionPosts).$dynamic()
        .where(
          and(
            eq(discussionPosts.threadId, threadId),
            eq(discussionPosts.isActive, true)
          )
        );
      
      // Filter by moderation status
      if (!includeModerated) {
        query = query.where(inArray(discussionPosts.moderationStatus, modStatus));
      }
      
      // Order by created time (chronological conversation flow)
      query = query
        .orderBy(discussionPosts.createdAt)
        .limit(limit)
        .offset(offset);
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting posts');
      throw error;
    }
  },
  
  async getPostById(id: number) {
    try {
      const posts = await db.select().from(discussionPosts).$dynamic()
        .where(
          and(
            eq(discussionPosts.id, id),
            eq(discussionPosts.isActive, true)
          )
        )
        .limit(1);
      
      return posts.length > 0 ? posts[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting post by ID');
      throw error;
    }
  },
  
  async createPost(data: InsertDiscussionPost) {
    try {
      // Get thread info first
      const thread = await this.getThreadById(data.threadId);
      if (!thread) throw new Error('Thread not found');
      
      // Start transaction to create post and update thread/forum
      const result = await db.transaction(async (tx) => {
        // Create the post
        const postResult = await tx.insert(discussionPosts).values(data).returning();
        
        // Update the thread stats
        await tx.update(discussionThreads)
          .set({
            totalReplies: sql`${discussionThreads.totalReplies} + 1`,
            lastReplyAt: new Date()
          })
          .where(eq(discussionThreads.id, data.threadId));
        
        // Update the forum stats
        await tx.update(discussionForums)
          .set({
            totalPosts: sql`${discussionForums.totalPosts} + 1`,
            lastActivityAt: new Date()
          })
          .where(eq(discussionForums.id, thread.forumId));
        
        return postResult;
      });
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating post');
      throw error;
    }
  },
  
  async updatePost(id: number, data: Partial<InsertDiscussionPost>) {
    try {
      const result = await db.update(discussionPosts)
        .set({
          ...data,
          isEdited: true,
          updatedAt: new Date()
        })
        .where(eq(discussionPosts.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating post');
      throw error;
    }
  },
  
  async deletePost(id: number) {
    try {
      // Get post info before deleting
      const post = await this.getPostById(id);
      if (!post) return false;
      
      // Get thread info
      const thread = await this.getThreadById(post.threadId);
      if (!thread) return false;
      
      // Start transaction to delete post and update thread/forum
      await db.transaction(async (tx) => {
        // Mark post as inactive (soft delete)
        await tx.update(discussionPosts)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(discussionPosts.id, id));
        
        // Update thread stats
        await tx.update(discussionThreads)
          .set({
            totalReplies: sql`${discussionThreads.totalReplies} - 1`,
            updatedAt: new Date()
          })
          .where(eq(discussionThreads.id, post.threadId));
        
        // Update forum stats
        await tx.update(discussionForums)
          .set({
            totalPosts: sql`${discussionForums.totalPosts} - 1`,
            updatedAt: new Date()
          })
          .where(eq(discussionForums.id, thread.forumId));
      });
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting post');
      throw error;
    }
  },
  
  async moderatePost(
    id: number, 
    status: 'approved' | 'rejected' | 'flagged', 
    moderatorId: number, 
    notes?: string
  ) {
    try {
      const result = await db.update(discussionPosts)
        .set({
          moderationStatus: status,
          moderatedBy: moderatorId,
          moderationNotes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(discussionPosts.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error moderating post');
      throw error;
    }
  },
  
  // ---- REACTIONS ----
  async getReactions(options: {
    threadId?: number;
    postId?: number;
    userId?: number;
  }) {
    const { threadId, postId, userId } = options;
    
    try {
      let query = db.select().from(discussionReactions).$dynamic();
      
      // Apply filters
      if (threadId) {
        query = query.where(eq(discussionReactions.threadId, threadId));
      }
      
      if (postId) {
        query = query.where(eq(discussionReactions.postId, postId));
      }
      
      if (userId) {
        query = query.where(eq(discussionReactions.userId, userId));
      }
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting reactions');
      throw error;
    }
  },
  
  async createReaction(data: InsertDiscussionReaction) {
    try {
      // Check for existing reaction from this user
      const existingReactions = await this.getReactions({
        threadId: data.threadId,
        postId: data.postId,
        userId: data.userId
      });
      
      // If user already reacted, return the existing reaction
      if (existingReactions.length > 0) {
        return existingReactions[0];
      }
      
      // Start transaction to create reaction and update thread or post
      const result = await db.transaction(async (tx) => {
        // Create the reaction
        const reactionResult = await tx.insert(discussionReactions).values(data).returning();
        
        // Update thread or post reaction count
        if (data.threadId) {
          await tx.update(discussionThreads)
            .set({
              totalReactions: sql`${discussionThreads.totalReactions} + 1`
            })
            .where(eq(discussionThreads.id, data.threadId));
        } else if (data.postId) {
          await tx.update(discussionPosts)
            .set({
              totalReactions: sql`${discussionPosts.totalReactions} + 1`
            })
            .where(eq(discussionPosts.id, data.postId));
        }
        
        return reactionResult;
      });
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating reaction');
      throw error;
    }
  },
  
  async deleteReaction(id: number) {
    try {
      // Get reaction info before deleting
      const reactions = await db.select().from(discussionReactions).$dynamic()
        .where(eq(discussionReactions.id, id))
        .limit(1);
      
      if (reactions.length === 0) return false;
      const reaction = reactions[0];
      
      // Start transaction to delete reaction and update thread or post
      await db.transaction(async (tx) => {
        // Delete the reaction
        await tx.delete(discussionReactions)
          .where(eq(discussionReactions.id, id));
        
        // Update thread or post reaction count
        if (reaction.threadId) {
          await tx.update(discussionThreads)
            .set({
              totalReactions: sql`${discussionThreads.totalReactions} - 1`
            })
            .where(eq(discussionThreads.id, reaction.threadId));
        } else if (reaction.postId) {
          await tx.update(discussionPosts)
            .set({
              totalReactions: sql`${discussionPosts.totalReactions} - 1`
            })
            .where(eq(discussionPosts.id, reaction.postId));
        }
      });
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting reaction');
      throw error;
    }
  },
  
  // ---- MODERATORS ----
  async getModerators(options: {
    forumId?: number;
    userId?: number;
    isSuperModerator?: boolean;
  } = {}) {
    const { forumId, userId, isSuperModerator } = options;
    
    try {
      let query = db.select().from(discussionModerators).$dynamic();
      
      // Apply filters
      if (forumId) {
        query = query.where(eq(discussionModerators.forumId, forumId));
      }
      
      if (userId) {
        query = query.where(eq(discussionModerators.userId, userId));
      }
      
      if (isSuperModerator !== undefined) {
        query = query.where(eq(discussionModerators.isSuperModerator, isSuperModerator));
      }
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting moderators');
      throw error;
    }
  },
  
  async isUserModerator(userId: number, forumId?: number): Promise<boolean> {
    try {
      // Check if user is a super moderator first (can moderate any forum)
      const superMods = await this.getModerators({
        userId,
        isSuperModerator: true
      });
      
      if (superMods.length > 0) return true;
      
      // If forumId is provided, check for forum-specific moderation rights
      if (forumId) {
        const forumMods = await this.getModerators({
          userId,
          forumId
        });
        
        return forumMods.length > 0;
      }
      
      // User is not a moderator
      return false;
    } catch (error: any) {
      log.error({ err: error }, 'Error checking moderator status');
      throw error;
    }
  },
  
  async addModerator(data: InsertDiscussionModerator) {
    try {
      // Check if moderator already exists
      const existingMods = await this.getModerators({
        userId: data.userId,
        forumId: data.forumId
      });
      
      if (existingMods.length > 0) {
        return existingMods[0];
      }
      
      // Add new moderator
      const result = await db.insert(discussionModerators).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error adding moderator');
      throw error;
    }
  },
  
  async removeModerator(id: number) {
    try {
      await db.delete(discussionModerators)
        .where(eq(discussionModerators.id, id));
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error removing moderator');
      throw error;
    }
  },
  
  // ---- REPORTS ----
  async getReports(options: {
    threadId?: number;
    postId?: number;
    reportedBy?: number;
    status?: string;
    reviewedBy?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const { 
      threadId, 
      postId, 
      reportedBy, 
      status, 
      reviewedBy,
      limit = 50, 
      offset = 0 
    } = options;
    
    try {
      let query = db.select().from(discussionReports).$dynamic();
      
      // Apply filters
      if (threadId) {
        query = query.where(eq(discussionReports.threadId, threadId));
      }
      
      if (postId) {
        query = query.where(eq(discussionReports.postId, postId));
      }
      
      if (reportedBy) {
        query = query.where(eq(discussionReports.reportedBy, reportedBy));
      }
      
      if (status) {
        query = query.where(eq(discussionReports.status, status));
      }
      
      if (reviewedBy) {
        query = query.where(eq(discussionReports.reviewedBy, reviewedBy));
      }
      
      // Order by creation date (newest first)
      query = query
        .orderBy(desc(discussionReports.createdAt))
        .limit(limit)
        .offset(offset);
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting reports');
      throw error;
    }
  },
  
  async createReport(data: InsertDiscussionReport) {
    try {
      // Check for existing report from this user for this content
      const existingReports = await this.getReports({
        threadId: data.threadId,
        postId: data.postId,
        reportedBy: data.reportedBy
      });
      
      // If already reported by this user, return existing report
      if (existingReports.length > 0) {
        return existingReports[0];
      }
      
      // Create new report
      const result = await db.insert(discussionReports).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating report');
      throw error;
    }
  },
  
  async updateReportStatus(
    id: number, 
    status: string, 
    reviewedBy: number, 
    resolution?: string
  ) {
    try {
      const result = await db.update(discussionReports)
        .set({
          status,
          reviewedBy,
          reviewedAt: new Date(),
          resolution: resolution || null
        })
        .where(eq(discussionReports.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating report status');
      throw error;
    }
  },
  
  // ---- STATISTICS AND ANALYTICS ----
  async getForumStats(forumId: number) {
    try {
      const forum = await this.getForumById(forumId);
      if (!forum) return null;
      
      // Get thread count
      const threadCount = forum.totalThreads;
      
      // Get post count
      const postCount = forum.totalPosts;
      
      // Get unique posters
      const uniquePostersQuery = db.select({ 
        userId: discussionThreads.userId 
      }).from(discussionThreads).$dynamic()
        .where(
          and(
            eq(discussionThreads.forumId, forumId),
            eq(discussionThreads.isActive, true)
          )
        )
        .union(
          db.select({ 
            userId: discussionPosts.userId 
          }).from(discussionPosts).$dynamic()
            .innerJoin(
              discussionThreads,
              eq(discussionPosts.threadId, discussionThreads.id)
            )
            .where(
              and(
                eq(discussionThreads.forumId, forumId),
                eq(discussionPosts.isActive, true)
              )
            )
        );
      
      const uniquePosters = await uniquePostersQuery;
      const uniqueParticipants = new Set(uniquePosters.map(p => p.userId)).size;
      
      // Get most active threads
      const mostActiveThreads = await db.select().from(discussionThreads).$dynamic()
        .where(
          and(
            eq(discussionThreads.forumId, forumId),
            eq(discussionThreads.isActive, true)
          )
        )
        .orderBy(desc(discussionThreads.totalReplies))
        .limit(5);
      
      return {
        threadCount,
        postCount,
        uniqueParticipants,
        mostActiveThreads,
        lastActivityAt: forum.lastActivityAt
      };
    } catch (error: any) {
      log.error({ err: error }, 'Error getting forum stats');
      throw error;
    }
  },
  
  async getUserActivityStats(userId: number) {
    try {
      // Count threads created by user
      const threadsCreated = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(discussionThreads).$dynamic()
        .where(
          and(
            eq(discussionThreads.userId, userId),
            eq(discussionThreads.isActive, true)
          )
        );
      
      // Count replies posted by user
      const repliesPosted = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(discussionPosts).$dynamic()
        .where(
          and(
            eq(discussionPosts.userId, userId),
            eq(discussionPosts.isActive, true)
          )
        );
      
      // Count reactions given by user
      const reactionsGiven = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(discussionReactions).$dynamic()
        .where(eq(discussionReactions.userId, userId));
      
      // Count reactions received on user's threads and posts
      const threadReactions = await db.select({ 
        count: sql<number>`coalesce(sum(${discussionThreads.totalReactions}), 0)` 
      }).from(discussionThreads).$dynamic()
        .where(
          and(
            eq(discussionThreads.userId, userId),
            eq(discussionThreads.isActive, true)
          )
        );
      
      const postReactions = await db.select({ 
        count: sql<number>`coalesce(sum(${discussionPosts.totalReactions}), 0)` 
      }).from(discussionPosts).$dynamic()
        .where(
          and(
            eq(discussionPosts.userId, userId),
            eq(discussionPosts.isActive, true)
          )
        );
      
      // Get forums moderated by user
      const moderatedForums = await this.getModerators({ userId });
      
      return {
        threadsCreated: threadsCreated[0]?.count || 0,
        repliesPosted: repliesPosted[0]?.count || 0,
        reactionsGiven: reactionsGiven[0]?.count || 0,
        reactionsReceived: 
          (threadReactions[0]?.count || 0) + 
          (postReactions[0]?.count || 0),
        forumsModerated: moderatedForums.length
      };
    } catch (error: any) {
      log.error({ err: error }, 'Error getting user activity stats');
      throw error;
    }
  }
};