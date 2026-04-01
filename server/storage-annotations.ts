import { db } from './db';
import { and, asc, desc, eq, inArray, isNull, like, or, sql, is } from 'drizzle-orm';
import {
  billAnnotations,
  annotationReplies,
  annotationReactions,
  annotationTags,
  BillAnnotation,
  InsertBillAnnotation,
  AnnotationReply,
  InsertAnnotationReply,
  AnnotationReaction,
  InsertAnnotationReaction,
  AnnotationTag,
  InsertAnnotationTag
} from '../shared/schema-annotations';
import { users } from '../shared/schema';
import { createLogger } from "./logger";
const log = createLogger("storage-annotations");


/**
 * Interface for annotation storage operations
 */
export interface IAnnotationStorage {
  // Annotation operations
  getAnnotations(options: {
    billId?: string;
    userId?: number;
    circleId?: number;
    visibility?: 'private' | 'circle' | 'public';
    type?: string;
    section?: string;
    includeTags?: boolean;
    includeReplies?: boolean;
    includeReactions?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;
  
  getAnnotationById(id: number, options?: {
    includeTags?: boolean;
    includeReplies?: boolean;
    includeReactions?: boolean;
  }): Promise<any | null>;

  createAnnotation(data: InsertBillAnnotation): Promise<BillAnnotation>;
  updateAnnotation(id: number, data: Partial<InsertBillAnnotation>): Promise<BillAnnotation | null>;
  deleteAnnotation(id: number): Promise<void>;
  
  // Reply operations
  getReplies(annotationId: number): Promise<AnnotationReply[]>;
  createReply(data: InsertAnnotationReply): Promise<AnnotationReply>;
  updateReply(id: number, data: Partial<InsertAnnotationReply>): Promise<AnnotationReply | null>;
  deleteReply(id: number): Promise<void>;
  
  // Reaction operations
  getReactions(options: {
    annotationId?: number;
    replyId?: number;
    userId?: number;
  }): Promise<AnnotationReaction[]>;
  createReaction(data: InsertAnnotationReaction): Promise<AnnotationReaction>;
  deleteReaction(id: number): Promise<void>;
  
  // Tag operations
  getTags(annotationId: number): Promise<AnnotationTag[]>;
  createTag(data: InsertAnnotationTag): Promise<AnnotationTag>;
  deleteTag(id: number): Promise<void>;
  
  // Analytics & statistics
  getAnnotationStatistics(billId: string): Promise<any>;
  getTopAnnotatedSections(billId: string, limit?: number): Promise<any[]>;
  getMostDiscussedAnnotations(billId: string, limit?: number): Promise<any[]>;
}

/**
 * Implementation of annotation storage using database
 */
export class AnnotationStorage implements IAnnotationStorage {
  
  /**
   * Get annotations based on various filters
   */
  async getAnnotations(options: {
    billId?: string;
    userId?: number;
    circleId?: number;
    visibility?: 'private' | 'circle' | 'public';
    type?: string;
    section?: string;
    includeTags?: boolean;
    includeReplies?: boolean;
    includeReactions?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const {
        billId,
        userId,
        circleId,
        visibility,
        type,
        section,
        includeTags = false,
        includeReplies = false,
        includeReactions = false,
        limit = 100,
        offset = 0
      } = options;
      
      // Build filters
      let filters = sql`true`;
      
      if (billId) {
        filters = sql`${filters} AND ${billAnnotations.billId} = ${billId}`;
      }
      
      if (userId) {
        filters = sql`${filters} AND ${billAnnotations.userId} = ${userId}`;
      }
      
      if (circleId) {
        filters = sql`${filters} AND ${billAnnotations.circleId} = ${circleId}`;
      }
      
      if (visibility) {
        filters = sql`${filters} AND ${billAnnotations.visibility} = ${visibility}`;
      }
      
      if (type) {
        filters = sql`${filters} AND ${billAnnotations.annotationType} = ${type}`;
      }
      
      if (section) {
        filters = sql`${filters} AND ${billAnnotations.section} = ${section}`;
      }
      
      // Always filter for active annotations
      filters = sql`${filters} AND ${billAnnotations.isActive} = true`;
      
      // Basic query for annotations
      let query = db
        .select({
          id: billAnnotations.id,
          billId: billAnnotations.billId,
          userId: billAnnotations.userId,
          circleId: billAnnotations.circleId,
          textSelection: billAnnotations.textSelection,
          selectionStartIndex: billAnnotations.selectionStartIndex,
          selectionEndIndex: billAnnotations.selectionEndIndex,
          annotationType: billAnnotations.annotationType,
          content: billAnnotations.content,
          visibility: billAnnotations.visibility,
          createdAt: billAnnotations.createdAt,
          updatedAt: billAnnotations.updatedAt,
          section: billAnnotations.section,
          sentiment: billAnnotations.sentiment,
          userName: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl
        })
        .from(billAnnotations).$dynamic()
        .leftJoin(users, eq(billAnnotations.userId, users.id))
        .where(filters)
        .orderBy(desc(billAnnotations.createdAt))
        .limit(limit)
        .offset(offset);
      
      const annotations = await query;
      
      // If additional data requested, fetch and merge
      if (includeTags || includeReplies || includeReactions) {
        const annotationIds = annotations.map(a => a.id);
        
        const [tags, replies, reactions] = await Promise.all([
          includeTags ? this.getTagsForMultipleAnnotations(annotationIds) : Promise.resolve([]),
          includeReplies ? this.getRepliesForMultipleAnnotations(annotationIds) : Promise.resolve([]),
          includeReactions ? this.getReactionsForMultipleAnnotations(annotationIds) : Promise.resolve([])
        ]);
        
        // Map related data to annotations
        return annotations.map(annotation => {
          return {
            ...annotation,
            tags: includeTags ? tags.filter(t => t.annotationId === annotation.id) : undefined,
            replies: includeReplies ? replies.filter(r => r.annotationId === annotation.id) : undefined,
            reactions: includeReactions ? reactions.filter(r => r.annotationId === annotation.id) : undefined
          };
        });
      }
      
      return annotations;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting annotations');
      throw error;
    }
  }
  
  /**
   * Get a single annotation by ID with optional related data
   */
  async getAnnotationById(id: number, options?: {
    includeTags?: boolean;
    includeReplies?: boolean;
    includeReactions?: boolean;
  }): Promise<any | null> {
    try {
      const {
        includeTags = false,
        includeReplies = false,
        includeReactions = false
      } = options || {};
      
      const query = db
        .select({
          id: billAnnotations.id,
          billId: billAnnotations.billId,
          userId: billAnnotations.userId,
          circleId: billAnnotations.circleId,
          textSelection: billAnnotations.textSelection,
          selectionStartIndex: billAnnotations.selectionStartIndex,
          selectionEndIndex: billAnnotations.selectionEndIndex,
          annotationType: billAnnotations.annotationType,
          content: billAnnotations.content,
          visibility: billAnnotations.visibility,
          createdAt: billAnnotations.createdAt,
          updatedAt: billAnnotations.updatedAt,
          section: billAnnotations.section,
          sentiment: billAnnotations.sentiment,
          userName: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl
        })
        .from(billAnnotations)
        .leftJoin(users, eq(billAnnotations.userId, users.id))
        .where(and(
          eq(billAnnotations.id, id),
          eq(billAnnotations.isActive, true)
        ))
        .limit(1);
      
      const annotation = (await query)[0] || null;
      
      if (!annotation) {
        return null;
      }
      
      // If additional data requested, fetch and merge
      if (includeTags || includeReplies || includeReactions) {
        const [tags, replies, reactions] = await Promise.all([
          includeTags ? this.getTags(id) : Promise.resolve([]),
          includeReplies ? this.getReplies(id) : Promise.resolve([]),
          includeReactions ? this.getReactions({ annotationId: id }) : Promise.resolve([])
        ]);
        
        return {
          ...annotation,
          tags: includeTags ? tags : undefined,
          replies: includeReplies ? replies : undefined,
          reactions: includeReactions ? reactions : undefined
        };
      }
      
      return annotation;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting annotation by ID');
      throw error;
    }
  }
  
  /**
   * Create a new annotation
   */
  async createAnnotation(data: InsertBillAnnotation): Promise<BillAnnotation> {
    try {
      const result = await db.insert(billAnnotations).values(data).returning();
      return result[0];
    } catch (error: any) {
      log.error({ err: error }, 'Error creating annotation');
      throw error;
    }
  }
  
  /**
   * Update an existing annotation
   */
  async updateAnnotation(id: number, data: Partial<InsertBillAnnotation>): Promise<BillAnnotation | null> {
    try {
      // Add updated timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await db
        .update(billAnnotations)
        .set(updateData)
        .where(eq(billAnnotations.id, id))
        .returning();
      
      return result[0] || null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating annotation');
      throw error;
    }
  }
  
  /**
   * Soft delete an annotation by marking it as inactive
   */
  async deleteAnnotation(id: number): Promise<void> {
    try {
      await db
        .update(billAnnotations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(billAnnotations.id, id));
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting annotation');
      throw error;
    }
  }
  
  /**
   * Get replies for a specific annotation
   */
  async getReplies(annotationId: number): Promise<AnnotationReply[]> {
    try {
      const query = await db
        .select({
          id: annotationReplies.id,
          annotationId: annotationReplies.annotationId,
          userId: annotationReplies.userId,
          content: annotationReplies.content,
          createdAt: annotationReplies.createdAt,
          updatedAt: annotationReplies.updatedAt,
          isActive: annotationReplies.isActive,
          userName: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl
        })
        .from(annotationReplies)
        .leftJoin(users, eq(annotationReplies.userId, users.id))
        .where(and(
          eq(annotationReplies.annotationId, annotationId),
          eq(annotationReplies.isActive, true)
        ))
        .orderBy(asc(annotationReplies.createdAt));
      
      // Map to expected return type
      return query.map(reply => ({
        id: reply.id,
        annotationId: reply.annotationId,
        userId: reply.userId,
        content: reply.content,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        isActive: reply.isActive
      }));
    } catch (error: any) {
      log.error({ err: error }, 'Error getting replies');
      throw error;
    }
  }
  
  /**
   * Get replies for multiple annotations
   */
  private async getRepliesForMultipleAnnotations(annotationIds: number[]): Promise<any[]> {
    try {
      if (annotationIds.length === 0) {
        return [];
      }
      
      const query = db
        .select({
          id: annotationReplies.id,
          annotationId: annotationReplies.annotationId,
          userId: annotationReplies.userId,
          content: annotationReplies.content,
          createdAt: annotationReplies.createdAt,
          updatedAt: annotationReplies.updatedAt,
          userName: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl
        })
        .from(annotationReplies)
        .leftJoin(users, eq(annotationReplies.userId, users.id))
        .where(and(
          inArray(annotationReplies.annotationId, annotationIds),
          eq(annotationReplies.isActive, true)
        ))
        .orderBy(asc(annotationReplies.createdAt));
      
      return query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting replies for multiple annotations');
      throw error;
    }
  }
  
  /**
   * Create a new reply
   */
  async createReply(data: InsertAnnotationReply): Promise<AnnotationReply> {
    try {
      const result = await db.insert(annotationReplies).values(data).returning();
      return result[0];
    } catch (error: any) {
      log.error({ err: error }, 'Error creating reply');
      throw error;
    }
  }
  
  /**
   * Update an existing reply
   */
  async updateReply(id: number, data: Partial<InsertAnnotationReply>): Promise<AnnotationReply | null> {
    try {
      // Add updated timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await db
        .update(annotationReplies)
        .set(updateData)
        .where(eq(annotationReplies.id, id))
        .returning();
      
      return result[0] || null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating reply');
      throw error;
    }
  }
  
  /**
   * Soft delete a reply by marking it as inactive
   */
  async deleteReply(id: number): Promise<void> {
    try {
      await db
        .update(annotationReplies)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(annotationReplies.id, id));
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting reply');
      throw error;
    }
  }
  
  /**
   * Get reactions based on filters
   */
  async getReactions(options: {
    annotationId?: number;
    replyId?: number;
    userId?: number;
  }): Promise<AnnotationReaction[]> {
    try {
      const { annotationId, replyId, userId } = options;
      
      let filters = sql`true`;
      
      if (annotationId) {
        filters = sql`${filters} AND ${annotationReactions.annotationId} = ${annotationId}`;
      }
      
      if (replyId) {
        filters = sql`${filters} AND ${annotationReactions.replyId} = ${replyId}`;
      }
      
      if (userId) {
        filters = sql`${filters} AND ${annotationReactions.userId} = ${userId}`;
      }
      
      const query = db
        .select({
          id: annotationReactions.id,
          annotationId: annotationReactions.annotationId,
          replyId: annotationReactions.replyId,
          userId: annotationReactions.userId,
          reaction: annotationReactions.reaction,
          createdAt: annotationReactions.createdAt,
          userName: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl
        })
        .from(annotationReactions)
        .leftJoin(users, eq(annotationReactions.userId, users.id))
        .where(filters)
        .orderBy(asc(annotationReactions.createdAt));
      
      return query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting reactions');
      throw error;
    }
  }
  
  /**
   * Get reactions for multiple annotations
   */
  private async getReactionsForMultipleAnnotations(annotationIds: number[]): Promise<any[]> {
    try {
      if (annotationIds.length === 0) {
        return [];
      }
      
      const query = db
        .select({
          id: annotationReactions.id,
          annotationId: annotationReactions.annotationId,
          replyId: annotationReactions.replyId,
          userId: annotationReactions.userId,
          reaction: annotationReactions.reaction,
          createdAt: annotationReactions.createdAt,
          userName: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl
        })
        .from(annotationReactions)
        .leftJoin(users, eq(annotationReactions.userId, users.id))
        .where(inArray(annotationReactions.annotationId, annotationIds))
        .orderBy(asc(annotationReactions.createdAt));
      
      return query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting reactions for multiple annotations');
      throw error;
    }
  }
  
  /**
   * Create a new reaction
   */
  async createReaction(data: InsertAnnotationReaction): Promise<AnnotationReaction> {
    try {
      // First check if this reaction already exists (to avoid duplicates)
      const existingFilters: any = {
        userId: data.userId,
        reaction: data.reaction
      };
      
      if (data.annotationId) {
        existingFilters.annotationId = data.annotationId;
      } else if (data.replyId) {
        existingFilters.replyId = data.replyId;
      }
      
      const existing = await this.getReactions(existingFilters);
      
      if (existing.length > 0) {
        // Reaction already exists, return it
        return existing[0];
      }
      
      // Create new reaction
      const result = await db.insert(annotationReactions).values(data).returning();
      return result[0];
    } catch (error: any) {
      log.error({ err: error }, 'Error creating reaction');
      throw error;
    }
  }
  
  /**
   * Delete a reaction
   */
  async deleteReaction(id: number): Promise<void> {
    try {
      await db
        .delete(annotationReactions)
        .where(eq(annotationReactions.id, id));
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting reaction');
      throw error;
    }
  }
  
  /**
   * Get tags for an annotation
   */
  async getTags(annotationId: number): Promise<AnnotationTag[]> {
    try {
      const query = db
        .select()
        .from(annotationTags).$dynamic()
        .where(eq(annotationTags.annotationId, annotationId))
        .orderBy(asc(annotationTags.createdAt));
      
      return query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting tags');
      throw error;
    }
  }
  
  /**
   * Get tags for multiple annotations
   */
  private async getTagsForMultipleAnnotations(annotationIds: number[]): Promise<any[]> {
    try {
      if (annotationIds.length === 0) {
        return [];
      }
      
      const query = db
        .select()
        .from(annotationTags).$dynamic()
        .where(inArray(annotationTags.annotationId, annotationIds))
        .orderBy(asc(annotationTags.createdAt));
      
      return query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting tags for multiple annotations');
      throw error;
    }
  }
  
  /**
   * Create a new tag
   */
  async createTag(data: InsertAnnotationTag): Promise<AnnotationTag> {
    try {
      const result = await db.insert(annotationTags).values(data).returning();
      return result[0];
    } catch (error: any) {
      log.error({ err: error }, 'Error creating tag');
      throw error;
    }
  }
  
  /**
   * Delete a tag
   */
  async deleteTag(id: number): Promise<void> {
    try {
      await db
        .delete(annotationTags)
        .where(eq(annotationTags.id, id));
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting tag');
      throw error;
    }
  }
  
  /**
   * Get annotation statistics for a bill
   */
  async getAnnotationStatistics(billId: string): Promise<any> {
    try {
      // Get total count
      const totalCountQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(billAnnotations).$dynamic()
        .where(and(
          eq(billAnnotations.billId, billId),
          eq(billAnnotations.isActive, true)
        ));
      
      // Get type distribution
      const typeDistributionQuery = db
        .select({
          type: billAnnotations.annotationType,
          count: sql<number>`count(*)`
        })
        .from(billAnnotations).$dynamic()
        .where(and(
          eq(billAnnotations.billId, billId),
          eq(billAnnotations.isActive, true)
        ))
        .groupBy(billAnnotations.annotationType);
      
      // Get sentiment distribution
      const sentimentDistributionQuery = db
        .select({
          sentiment: sql<string>`
            CASE
              WHEN ${billAnnotations.sentiment} < -25 THEN 'strong_negative'
              WHEN ${billAnnotations.sentiment} < 0 THEN 'negative'
              WHEN ${billAnnotations.sentiment} = 0 THEN 'neutral'
              WHEN ${billAnnotations.sentiment} > 25 THEN 'strong_positive'
              WHEN ${billAnnotations.sentiment} > 0 THEN 'positive'
            END
          `,
          count: sql<number>`count(*)`
        })
        .from(billAnnotations).$dynamic()
        .where(and(
          eq(billAnnotations.billId, billId),
          eq(billAnnotations.isActive, true)
        ))
        .groupBy(sql`sentiment`);
      
      // Run all queries in parallel
      const [totalCount, typeDistribution, sentimentDistribution] = await Promise.all([
        totalCountQuery,
        typeDistributionQuery,
        sentimentDistributionQuery
      ]);
      
      return {
        totalCount: totalCount[0]?.count || 0,
        typeDistribution: typeDistribution,
        sentimentDistribution: sentimentDistribution
      };
    } catch (error: any) {
      log.error({ err: error }, 'Error getting annotation statistics');
      throw error;
    }
  }
  
  /**
   * Get top annotated sections of a bill
   */
  async getTopAnnotatedSections(billId: string, limit: number = 5): Promise<any[]> {
    try {
      const query = db
        .select({
          section: billAnnotations.section,
          count: sql<number>`count(*)`,
          // Get the most recent annotation for this section
          latestContent: sql<string>`
            (SELECT ${billAnnotations.content} 
             FROM ${billAnnotations} a2 
             WHERE a2.bill_id = ${billAnnotations.billId} 
             AND a2.section = ${billAnnotations.section}
             AND a2.is_active = true
             ORDER BY a2.created_at DESC 
             LIMIT 1)
          `
        })
        .from(billAnnotations).$dynamic()
        .where(and(
          eq(billAnnotations.billId, billId),
          eq(billAnnotations.isActive, true),
          // Only include annotations that have a section
          sql`${billAnnotations.section} IS NOT NULL`
        ))
        .groupBy(billAnnotations.section)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(limit);
      
      return query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting top annotated sections');
      throw error;
    }
  }
  
  /**
   * Get most discussed annotations for a bill
   */
  async getMostDiscussedAnnotations(billId: string, limit: number = 5): Promise<any[]> {
    try {
      // Use a subquery to count replies for each annotation
      const annotationsWithReplyCounts = db
        .select({
          annotationId: annotationReplies.annotationId,
          replyCount: sql<number>`count(*)`
        })
        .from(annotationReplies).$dynamic()
        .where(eq(annotationReplies.isActive, true))
        .groupBy(annotationReplies.annotationId)
        .as('reply_counts');
      
      // Join with annotations and filter by bill ID
      const query = db
        .select({
          id: billAnnotations.id,
          billId: billAnnotations.billId,
          userId: billAnnotations.userId,
          content: billAnnotations.content,
          textSelection: billAnnotations.textSelection,
          annotationType: billAnnotations.annotationType,
          section: billAnnotations.section,
          createdAt: billAnnotations.createdAt,
          replyCount: annotationsWithReplyCounts.replyCount,
          userName: users.username,
          displayName: users.displayName
        })
        .from(billAnnotations)
        .leftJoin(
          annotationsWithReplyCounts,
          eq(billAnnotations.id, annotationsWithReplyCounts.annotationId)
        )
        .leftJoin(users, eq(billAnnotations.userId, users.id))
        .where(and(
          eq(billAnnotations.billId, billId),
          eq(billAnnotations.isActive, true)
        ))
        .orderBy(desc(annotationsWithReplyCounts.replyCount))
        .limit(limit);
      
      return query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting most discussed annotations');
      throw error;
    }
  }
}

// Create and export the storage instance
export const annotationStorage = new AnnotationStorage();