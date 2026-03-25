// @ts-nocheck
import { eq, desc, asc, and, or, inArray, isNull, sql, like } from 'drizzle-orm';
import { db } from './db';
import {
  feedPosts,
  feedComments,
  feedReactions,
  userInterests,
  feedInteractions,
  FeedPost,
  InsertFeedPost,
  FeedComment,
  InsertFeedComment,
  FeedReaction,
  InsertFeedReaction,
  UserInterest,
  InsertUserInterest,
  FeedInteraction,
  InsertFeedInteraction,
} from '../shared/schema-feed';
import { users } from '../shared/schema';

export interface IFeedStorage {
  // Feed posts
  createPost(data: InsertFeedPost): Promise<FeedPost>;
  getPost(id: number): Promise<FeedPost | null>;
  updatePost(id: number, data: Partial<InsertFeedPost>): Promise<FeedPost | null>;
  deletePost(id: number): Promise<boolean>;
  
  // Feed queries
  getMainFeed(limit?: number, offset?: number): Promise<(FeedPost & { author?: { name: string, profileImageUrl: string | null } })[]>;
  getUserFeed(userId: number, limit?: number, offset?: number): Promise<(FeedPost & { author?: { name: string, profileImageUrl: string | null } })[]>;
  getPostsByType(type: string, limit?: number, offset?: number): Promise<FeedPost[]>;
  getFeaturedPosts(limit?: number): Promise<FeedPost[]>;
  searchPosts(query: string, limit?: number, offset?: number): Promise<FeedPost[]>;
  getPostsByTags(tags: string[], limit?: number, offset?: number): Promise<FeedPost[]>;
  
  // Comments
  createComment(data: InsertFeedComment): Promise<FeedComment>;
  getPostComments(postId: number, limit?: number, offset?: number): Promise<(FeedComment & { user: { name: string, profileImageUrl: string | null } })[]>;
  getCommentReplies(commentId: number, limit?: number, offset?: number): Promise<FeedComment[]>;
  updateComment(id: number, data: Partial<InsertFeedComment>): Promise<FeedComment | null>;
  deleteComment(id: number): Promise<boolean>;
  
  // Reactions
  createReaction(data: InsertFeedReaction): Promise<FeedReaction>;
  getPostReactions(postId: number): Promise<{ type: string; count: number }[]>;
  getCommentReactions(commentId: number): Promise<{ type: string; count: number }[]>;
  getUserReaction(userId: number, postId?: number, commentId?: number): Promise<FeedReaction | null>;
  deleteReaction(id: number): Promise<boolean>;
  
  // User Interests
  getUserInterests(userId: number): Promise<UserInterest | null>;
  createOrUpdateUserInterests(data: InsertUserInterest): Promise<UserInterest>;
  
  // Interactions
  recordFeedInteraction(data: InsertFeedInteraction): Promise<FeedInteraction>;
  getUserInteractions(userId: number, limit?: number): Promise<FeedInteraction[]>;
}

export class FeedStorage implements IFeedStorage {
  // Feed posts
  async createPost(data: InsertFeedPost): Promise<FeedPost> {
    const [post] = await db.insert(feedPosts).values(data).returning();
    return post;
  }

  async getPost(id: number): Promise<FeedPost | null> {
    const posts = await db.select().from(feedPosts).$dynamic().where(eq(feedPosts.id, id));
    return posts.length > 0 ? posts[0] : null;
  }

  async updatePost(id: number, data: Partial<InsertFeedPost>): Promise<FeedPost | null> {
    const [post] = await db
      .update(feedPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedPosts.id, id))
      .returning();
    return post || null;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(feedPosts).where(eq(feedPosts.id, id));
    return true; // In Drizzle, delete operation doesn't return number of rows affected
  }

  // Feed queries
  async getMainFeed(limit = 20, offset = 0): Promise<(FeedPost & { author?: { name: string, profileImageUrl: string | null } })[]> {
    const posts = await db
      .select({
        ...feedPosts,
        author: {
          name: users.name,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(feedPosts)
      .leftJoin(users, eq(feedPosts.authorId, users.id))
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return posts;
  }

  async getUserFeed(userId: number, limit = 20, offset = 0): Promise<(FeedPost & { author?: { name: string, profileImageUrl: string | null } })[]> {
    // First, get user interests
    const userInterestsResult = await this.getUserInterests(userId);
    
    // If no interests found, return generic feed
    if (!userInterestsResult) {
      return this.getMainFeed(limit, offset);
    }
    
    // Query posts matching user interests
    const posts = await db
      .select({
        ...feedPosts,
        author: {
          name: users.name,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(feedPosts)
      .leftJoin(users, eq(feedPosts.authorId, users.id))
      .where(
        or(
          userInterestsResult.topics.length > 0 
            ? inArray(feedPosts.tags, userInterestsResult.topics) 
            : undefined,
          userInterestsResult.representatives.length > 0 
            ? sql`${feedPosts.metadata}->>'sourceName' = ANY(${userInterestsResult.representatives})` 
            : undefined,
          userInterestsResult.locations.length > 0 
            ? sql`${feedPosts.metadata}->>'location' = ANY(${userInterestsResult.locations})` 
            : undefined,
          userInterestsResult.committees.length > 0 
            ? sql`${feedPosts.metadata}->>'committee' = ANY(${userInterestsResult.committees})` 
            : undefined,
        )
      )
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    // If not enough interest-based posts, pad with general posts
    if (posts.length < limit) {
      const generalPosts = await db
        .select({
          ...feedPosts,
          author: {
            name: users.name,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(feedPosts)
        .leftJoin(users, eq(feedPosts.authorId, users.id))
        .orderBy(desc(feedPosts.createdAt))
        .limit(limit - posts.length)
        .offset(offset);
      
      return [...posts, ...generalPosts];
    }
    
    return posts;
  }

  async getPostsByType(type: string, limit = 20, offset = 0): Promise<FeedPost[]> {
    return db
      .select()
      .from(feedPosts).$dynamic()
      .where(eq(feedPosts.type, type))
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getFeaturedPosts(limit = 5): Promise<FeedPost[]> {
    return db
      .select()
      .from(feedPosts).$dynamic()
      .where(eq(feedPosts.isFeatured, true))
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit);
  }

  async searchPosts(query: string, limit = 20, offset = 0): Promise<FeedPost[]> {
    return db
      .select()
      .from(feedPosts).$dynamic()
      .where(
        or(
          like(feedPosts.title, `%${query}%`),
          like(feedPosts.content, `%${query}%`),
          sql`${feedPosts.tags} @> ARRAY[${query}]`
        )
      )
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPostsByTags(tags: string[], limit = 20, offset = 0): Promise<FeedPost[]> {
    return db
      .select()
      .from(feedPosts).$dynamic()
      .where(sql`${feedPosts.tags} && ARRAY[${tags}]`)
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Comments
  async createComment(data: InsertFeedComment): Promise<FeedComment> {
    const [comment] = await db.insert(feedComments).values(data).returning();
    return comment;
  }

  async getPostComments(postId: number, limit = 20, offset = 0): Promise<(FeedComment & { user: { name: string, profileImageUrl: string | null } })[]> {
    return db
      .select({
        ...feedComments,
        user: {
          name: users.name,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(feedComments)
      .innerJoin(users, eq(feedComments.userId, users.id))
      .where(
        and(
          eq(feedComments.postId, postId),
          isNull(feedComments.parentId) // Get only top-level comments
        )
      )
      .orderBy(asc(feedComments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCommentReplies(commentId: number, limit = 20, offset = 0): Promise<FeedComment[]> {
    return db
      .select()
      .from(feedComments).$dynamic()
      .where(eq(feedComments.parentId, commentId))
      .orderBy(asc(feedComments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateComment(id: number, data: Partial<InsertFeedComment>): Promise<FeedComment | null> {
    const [comment] = await db
      .update(feedComments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedComments.id, id))
      .returning();
    return comment || null;
  }

  async deleteComment(id: number): Promise<boolean> {
    await db.delete(feedComments).where(eq(feedComments.id, id));
    return true;
  }

  // Reactions
  async createReaction(data: InsertFeedReaction): Promise<FeedReaction> {
    // First check if user already reacted
    const existingReaction = await this.getUserReaction(
      data.userId,
      data.postId || undefined,
      data.commentId || undefined
    );

    if (existingReaction) {
      // If reaction type is the same, delete it (toggle off)
      if (existingReaction.type === data.type) {
        await this.deleteReaction(existingReaction.id);
        return existingReaction;
      }
      
      // If reaction type is different, update it
      const [updatedReaction] = await db
        .update(feedReactions)
        .set({ type: data.type })
        .where(eq(feedReactions.id, existingReaction.id))
        .returning();
        
      return updatedReaction;
    }

    // Create new reaction
    const [reaction] = await db.insert(feedReactions).values(data).returning();
    return reaction;
  }

  async getPostReactions(postId: number): Promise<{ type: string; count: number }[]> {
    return db
      .select({
        type: feedReactions.type,
        count: sql<number>`count(*)`,
      })
      .from(feedReactions).$dynamic()
      .where(eq(feedReactions.postId, postId))
      .groupBy(feedReactions.type);
  }

  async getCommentReactions(commentId: number): Promise<{ type: string; count: number }[]> {
    return db
      .select({
        type: feedReactions.type,
        count: sql<number>`count(*)`,
      })
      .from(feedReactions).$dynamic()
      .where(eq(feedReactions.commentId, commentId))
      .groupBy(feedReactions.type);
  }

  async getUserReaction(userId: number, postId?: number, commentId?: number): Promise<FeedReaction | null> {
    const conditions = [eq(feedReactions.userId, userId)];
    
    if (postId) {
      conditions.push(eq(feedReactions.postId, postId));
    }
    
    if (commentId) {
      conditions.push(eq(feedReactions.commentId, commentId));
    }
    
    const result = await db
      .select()
      .from(feedReactions).$dynamic()
      .where(and(...conditions))
      .limit(1);
      
    return result.length > 0 ? result[0] : null;
  }

  async deleteReaction(id: number): Promise<boolean> {
    await db.delete(feedReactions).where(eq(feedReactions.id, id));
    return true;
  }

  // User Interests
  async getUserInterests(userId: number): Promise<UserInterest | null> {
    const interests = await db
      .select()
      .from(userInterests).$dynamic()
      .where(eq(userInterests.userId, userId))
      .limit(1);
      
    return interests.length > 0 ? interests[0] : null;
  }

  async createOrUpdateUserInterests(data: InsertUserInterest): Promise<UserInterest> {
    const existing = await this.getUserInterests(data.userId);
    
    if (existing) {
      const [updated] = await db
        .update(userInterests)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userInterests.userId, data.userId))
        .returning();
      return updated;
    }
    
    const [newInterests] = await db.insert(userInterests).values(data).returning();
    return newInterests;
  }

  // Interactions
  async recordFeedInteraction(data: InsertFeedInteraction): Promise<FeedInteraction> {
    const [interaction] = await db.insert(feedInteractions).values(data).returning();
    return interaction;
  }

  async getUserInteractions(userId: number, limit = 50): Promise<FeedInteraction[]> {
    return db
      .select()
      .from(feedInteractions).$dynamic()
      .where(eq(feedInteractions.userId, userId))
      .orderBy(desc(feedInteractions.createdAt))
      .limit(limit);
  }
}