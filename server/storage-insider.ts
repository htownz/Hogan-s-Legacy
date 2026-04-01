// @ts-nocheck
import { db } from './db';
import { eq, and, or, desc, sql, inArray, like, not, isNull } from 'drizzle-orm';
import { 
  insiderUpdates,
  insiderVerifications,
  insiderReactions,
  insiderSources,
  insiderTags,
  insiderVerifiers,
  InsertInsiderUpdate,
  InsertInsiderVerification,
  InsertInsiderReaction,
  InsertInsiderSource,
  InsertInsiderTag,
  InsertInsiderVerifier,
  InsiderUpdate
} from '../shared/schema-insider';
import { superUserStorage } from './storage-super-user';
import { createLogger } from "./logger";
const log = createLogger("storage-insider");


/**
 * Insider updates storage implementation
 */
export const insiderStorage = {
  // ---- UPDATES ----
  async getUpdates(options: { 
    userId?: number;
    billId?: string;
    committeeId?: number;
    updateType?: string | string[];
    verificationStatus?: string | string[];
    tag?: string;
    limit?: number;
    offset?: number;
    includeExpired?: boolean;
    sortBy?: 'newest' | 'importance' | 'verification';
  } = {}) {
    const { 
      userId, 
      billId, 
      committeeId, 
      updateType,
      verificationStatus,
      tag,
      limit = 20, 
      offset = 0,
      includeExpired = false,
      sortBy = 'newest'
    } = options;
    
    try {
      // Start with the base query
      let query = db.select().from(insiderUpdates).$dynamic()
        .where(eq(insiderUpdates.isActive, true));
      
      // Apply filters
      if (userId) {
        query = query.where(eq(insiderUpdates.userId, userId));
      }
      
      if (billId) {
        query = query.where(eq(insiderUpdates.billId, billId));
      }
      
      if (committeeId) {
        query = query.where(eq(insiderUpdates.committeeId, committeeId));
      }
      
      if (updateType) {
        if (Array.isArray(updateType)) {
          query = query.where(inArray(insiderUpdates.updateType, updateType));
        } else {
          query = query.where(eq(insiderUpdates.updateType, updateType));
        }
      }
      
      if (verificationStatus) {
        if (Array.isArray(verificationStatus)) {
          query = query.where(inArray(insiderUpdates.verificationStatus, verificationStatus));
        } else {
          query = query.where(eq(insiderUpdates.verificationStatus, verificationStatus));
        }
      }
      
      // Filter by expiry date (if not including expired)
      if (!includeExpired) {
        query = query.where(
          or(
            isNull(insiderUpdates.expiryDate),
            sql`${insiderUpdates.expiryDate} > NOW()`
          )
        );
      }
      
      // Apply tag filter (if provided)
      if (tag) {
        // This is a more complex query requiring a join
        const updatesWithTag = db.select({ id: insiderTags.updateId })
          .from(insiderTags).$dynamic()
          .where(eq(insiderTags.tag, tag));
        
        query = query.where(
          inArray(
            insiderUpdates.id,
            updatesWithTag
          )
        );
      }
      
      // Apply sorting
      if (sortBy === 'importance') {
        query = query.orderBy(desc(insiderUpdates.importance), desc(insiderUpdates.createdAt));
      } else if (sortBy === 'verification') {
        // Sort verified items first, then by importance and recency
        query = query.orderBy(
          // Custom ordering by verification status
          sql`CASE 
            WHEN ${insiderUpdates.verificationStatus} = 'confirmed_by_multiple' THEN 1
            WHEN ${insiderUpdates.verificationStatus} = 'verified' THEN 2
            WHEN ${insiderUpdates.verificationStatus} = 'pending' THEN 3
            WHEN ${insiderUpdates.verificationStatus} = 'disputed' THEN 4
            WHEN ${insiderUpdates.verificationStatus} = 'unverified' THEN 5
            ELSE 6
          END`,
          desc(insiderUpdates.importance),
          desc(insiderUpdates.createdAt)
        );
      } else {
        // Default sort by newest
        query = query.orderBy(desc(insiderUpdates.createdAt));
      }
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider updates');
      throw error;
    }
  },
  
  async getUpdateById(id: number, includeDetails: boolean = false) {
    try {
      // Get the basic update
      const updates = await db.select().from(insiderUpdates).$dynamic()
        .where(and(
          eq(insiderUpdates.id, id),
          eq(insiderUpdates.isActive, true)
        ))
        .limit(1);
      
      if (updates.length === 0) return null;
      const update = updates[0];
      
      // If details are requested, fetch additional data
      if (includeDetails) {
        // Get verifications
        const verifications = await db.select().from(insiderVerifications).$dynamic()
          .where(eq(insiderVerifications.updateId, id));
        
        // Get reactions
        const reactions = await db.select().from(insiderReactions).$dynamic()
          .where(eq(insiderReactions.updateId, id));
        
        // Get tags
        const tags = await db.select().from(insiderTags).$dynamic()
          .where(eq(insiderTags.updateId, id));
        
        return {
          ...update,
          verifications,
          reactions,
          tags: tags.map(t => t.tag)
        };
      }
      
      return update;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider update by ID');
      throw error;
    }
  },
  
  async createUpdate(data: InsertInsiderUpdate, tags?: string[]) {
    try {
      return await db.transaction(async (tx) => {
        // Create the update
        const updateResult = await tx.insert(insiderUpdates).values(data).returning();
        
        if (updateResult.length === 0) throw new Error('Failed to create insider update');
        const newUpdate = updateResult[0];
        
        // Add tags if provided
        if (tags && tags.length > 0) {
          const tagInserts = tags.map(tag => ({
            updateId: newUpdate.id,
            tag
          }));
          
          await tx.insert(insiderTags).values(tagInserts);
        }
        
        return newUpdate;
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error creating insider update');
      throw error;
    }
  },
  
  async updateUpdate(id: number, data: Partial<InsertInsiderUpdate>, tags?: string[]) {
    try {
      return await db.transaction(async (tx) => {
        // Update the update record
        const updateResult = await tx.update(insiderUpdates)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(insiderUpdates.id, id))
          .returning();
        
        if (updateResult.length === 0) throw new Error('Failed to update insider update');
        const updatedUpdate = updateResult[0];
        
        // Handle tags if provided
        if (tags !== undefined) {
          // Delete existing tags
          await tx.delete(insiderTags)
            .where(eq(insiderTags.updateId, id));
          
          // Add new tags
          if (tags.length > 0) {
            const tagInserts = tags.map(tag => ({
              updateId: id,
              tag
            }));
            
            await tx.insert(insiderTags).values(tagInserts);
          }
        }
        
        return updatedUpdate;
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error updating insider update');
      throw error;
    }
  },
  
  async deleteUpdate(id: number) {
    try {
      // Soft delete the update
      await db.update(insiderUpdates)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(insiderUpdates.id, id));
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting insider update');
      throw error;
    }
  },
  
  async verifyUpdate(
    id: number, 
    verifierId: number, 
    status: 'verified' | 'disputed' | 'unverified' | 'confirmed_by_multiple', 
    notes?: string
  ) {
    try {
      // Update the verification status
      const result = await db.update(insiderUpdates)
        .set({
          verificationStatus: status,
          verifiedBy: verifierId,
          verificationNotes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(insiderUpdates.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error verifying insider update');
      throw error;
    }
  },
  
  // ---- VERIFICATIONS ----
  async getVerificationsForUpdate(updateId: number) {
    try {
      return await db.select().from(insiderVerifications).$dynamic()
        .where(eq(insiderVerifications.updateId, updateId));
    } catch (error: any) {
      log.error({ err: error }, 'Error getting verifications for update');
      throw error;
    }
  },
  
  async createVerification(data: InsertInsiderVerification) {
    try {
      // Check for existing verification from this user
      const existingVerifications = await db.select().from(insiderVerifications).$dynamic()
        .where(
          and(
            eq(insiderVerifications.updateId, data.updateId),
            eq(insiderVerifications.userId, data.userId)
          )
        );
      
      if (existingVerifications.length > 0) {
        // Update existing verification
        return await db.update(insiderVerifications)
          .set({
            isVerified: data.isVerified,
            verificationNotes: data.verificationNotes,
            credentials: data.credentials
          })
          .where(eq(insiderVerifications.id, existingVerifications[0].id))
          .returning();
      }
      
      // Start transaction to create verification and update counts
      return await db.transaction(async (tx) => {
        // Create the verification
        const verificationResult = await tx.insert(insiderVerifications).values(data).returning();
        
        // Update the verifier's total verifications count
        await tx.update(insiderVerifiers)
          .set({
            totalVerifications: sql`${insiderVerifiers.totalVerifications} + 1`
          })
          .where(eq(insiderVerifiers.userId, data.userId));
        
        // Check if this update should be marked as confirmed by multiple
        const verifications = await tx.select().from(insiderVerifications).$dynamic()
          .where(
            and(
              eq(insiderVerifications.updateId, data.updateId),
              eq(insiderVerifications.isVerified, true)
            )
          );
        
        // If 3+ verifiers have confirmed, update the status
        if (verifications.length >= 3) {
          await tx.update(insiderUpdates)
            .set({
              verificationStatus: 'confirmed_by_multiple',
              updatedAt: new Date()
            })
            .where(eq(insiderUpdates.id, data.updateId));
        }
        // If this is a dispute, update the status accordingly
        else if (!data.isVerified) {
          await tx.update(insiderUpdates)
            .set({
              verificationStatus: 'disputed',
              updatedAt: new Date()
            })
            .where(eq(insiderUpdates.id, data.updateId));
        }
        
        return verificationResult;
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error creating verification');
      throw error;
    }
  },
  
  async deleteVerification(id: number) {
    try {
      // Get verification info first
      const verifications = await db.select().from(insiderVerifications).$dynamic()
        .where(eq(insiderVerifications.id, id))
        .limit(1);
      
      if (verifications.length === 0) return false;
      const verification = verifications[0];
      
      // Start transaction to delete verification and update counts
      await db.transaction(async (tx) => {
        // Delete the verification
        await tx.delete(insiderVerifications)
          .where(eq(insiderVerifications.id, id));
        
        // Update the verifier's total verifications count
        await tx.update(insiderVerifiers)
          .set({
            totalVerifications: sql`${insiderVerifiers.totalVerifications} - 1`
          })
          .where(eq(insiderVerifiers.userId, verification.userId));
        
        // Check remaining verifications for this update
        const remainingVerifications = await tx.select().from(insiderVerifications).$dynamic()
          .where(eq(insiderVerifications.updateId, verification.updateId));
        
        const positiveVerifications = remainingVerifications.filter(v => v.isVerified).length;
        const negativeVerifications = remainingVerifications.filter(v => !v.isVerified).length;
        
        // Update the update's verification status based on remaining verifications
        let newStatus = 'pending';
        if (positiveVerifications >= 3) {
          newStatus = 'confirmed_by_multiple';
        } else if (positiveVerifications > 0) {
          newStatus = 'verified';
        } else if (negativeVerifications > 0) {
          newStatus = 'disputed';
        }
        
        await tx.update(insiderUpdates)
          .set({
            verificationStatus: newStatus,
            updatedAt: new Date()
          })
          .where(eq(insiderUpdates.id, verification.updateId));
      });
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting verification');
      throw error;
    }
  },
  
  // ---- REACTIONS ----
  async getReactionsForUpdate(updateId: number) {
    try {
      return await db.select().from(insiderReactions).$dynamic()
        .where(eq(insiderReactions.updateId, updateId));
    } catch (error: any) {
      log.error({ err: error }, 'Error getting reactions for update');
      throw error;
    }
  },
  
  async createReaction(data: InsertInsiderReaction) {
    try {
      // Check for existing reaction from this user with the same type
      const existingReactions = await db.select().from(insiderReactions).$dynamic()
        .where(
          and(
            eq(insiderReactions.updateId, data.updateId),
            eq(insiderReactions.userId, data.userId),
            eq(insiderReactions.reaction, data.reaction)
          )
        );
      
      if (existingReactions.length > 0) {
        // Already reacted, return existing
        return existingReactions[0];
      }
      
      // Create the reaction
      const result = await db.insert(insiderReactions).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating reaction');
      throw error;
    }
  },
  
  async deleteReaction(id: number) {
    try {
      await db.delete(insiderReactions)
        .where(eq(insiderReactions.id, id));
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting reaction');
      throw error;
    }
  },
  
  // ---- SOURCES ----
  async getSources(options: {
    userId?: number;
    sourceType?: string;
    verificationStatus?: string;
  } = {}) {
    const { userId, sourceType, verificationStatus } = options;
    
    try {
      let query = db.select().from(insiderSources).$dynamic()
        .where(eq(insiderSources.isActive, true));
      
      // Apply filters
      if (userId) {
        query = query.where(eq(insiderSources.userId, userId));
      }
      
      if (sourceType) {
        query = query.where(eq(insiderSources.sourceType, sourceType));
      }
      
      if (verificationStatus) {
        query = query.where(eq(insiderSources.verificationStatus, verificationStatus));
      }
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider sources');
      throw error;
    }
  },
  
  async getSourceById(id: number) {
    try {
      const sources = await db.select().from(insiderSources).$dynamic()
        .where(
          and(
            eq(insiderSources.id, id),
            eq(insiderSources.isActive, true)
          )
        )
        .limit(1);
      
      return sources.length > 0 ? sources[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider source by ID');
      throw error;
    }
  },
  
  async createSource(data: InsertInsiderSource) {
    try {
      const result = await db.insert(insiderSources).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating insider source');
      throw error;
    }
  },
  
  async updateSource(id: number, data: Partial<InsertInsiderSource>) {
    try {
      const result = await db.update(insiderSources)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(insiderSources.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating insider source');
      throw error;
    }
  },
  
  async deleteSource(id: number) {
    try {
      // Soft delete the source
      await db.update(insiderSources)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(insiderSources.id, id));
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting insider source');
      throw error;
    }
  },
  
  async verifySource(id: number, verifierId: number, status: string, notes?: string) {
    try {
      const result = await db.update(insiderSources)
        .set({
          verificationStatus: status,
          verifiedBy: verifierId,
          updatedAt: new Date()
        })
        .where(eq(insiderSources.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error verifying insider source');
      throw error;
    }
  },
  
  // ---- VERIFIERS ----
  async getVerifiers(options: {
    userId?: number;
    level?: number;
    expertise?: string;
  } = {}) {
    const { userId, level, expertise } = options;
    
    try {
      let query = db.select().from(insiderVerifiers).$dynamic()
        .where(eq(insiderVerifiers.isActive, true));
      
      // Apply filters
      if (userId) {
        query = query.where(eq(insiderVerifiers.userId, userId));
      }
      
      if (level) {
        query = query.where(eq(insiderVerifiers.verifierLevel, level));
      }
      
      if (expertise) {
        // This is a bit tricky with arrays - need to check if the array contains the value
        query = query.where(
          sql`${expertise} = ANY(${insiderVerifiers.expertise})`
        );
      }
      
      return await query;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider verifiers');
      throw error;
    }
  },
  
  async getVerifierByUserId(userId: number) {
    try {
      const verifiers = await db.select().from(insiderVerifiers).$dynamic()
        .where(
          and(
            eq(insiderVerifiers.userId, userId),
            eq(insiderVerifiers.isActive, true)
          )
        )
        .limit(1);
      
      return verifiers.length > 0 ? verifiers[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider verifier by user ID');
      throw error;
    }
  },
  
  async isUserVerifier(userId: number): Promise<boolean> {
    try {
      const verifier = await this.getVerifierByUserId(userId);
      return verifier !== null;
    } catch (error: any) {
      log.error({ err: error }, 'Error checking if user is a verifier');
      throw error;
    }
  },
  
  async createVerifier(data: InsertInsiderVerifier) {
    try {
      // Check if verifier already exists for this user
      const existingVerifier = await this.getVerifierByUserId(data.userId);
      
      if (existingVerifier) {
        // Update existing verifier
        return await this.updateVerifier(existingVerifier.id, data);
      }
      
      // Create new verifier
      const result = await db.insert(insiderVerifiers).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating insider verifier');
      throw error;
    }
  },
  
  async updateVerifier(id: number, data: Partial<InsertInsiderVerifier>) {
    try {
      const result = await db.update(insiderVerifiers)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(insiderVerifiers.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating insider verifier');
      throw error;
    }
  },
  
  async deleteVerifier(id: number) {
    try {
      // Soft delete the verifier
      await db.update(insiderVerifiers)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(insiderVerifiers.id, id));
      
      return true;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting insider verifier');
      throw error;
    }
  },
  
  // ---- TAGS ----
  async getTagsForUpdate(updateId: number) {
    try {
      const tags = await db.select().from(insiderTags).$dynamic()
        .where(eq(insiderTags.updateId, updateId));
      
      return tags.map(t => t.tag);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting tags for update');
      throw error;
    }
  },
  
  async getPopularTags(limit: number = 10) {
    try {
      // This requires a more complex query to count occurrences
      const tagCounts = await db.select({
        tag: insiderTags.tag,
        count: sql<number>`count(*)`.as('count')
      })
      .from(insiderTags)
      .groupBy(insiderTags.tag)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);
      
      return tagCounts;
    } catch (error: any) {
      log.error({ err: error }, 'Error getting popular tags');
      throw error;
    }
  },
  
  // ---- STATISTICS AND ANALYTICS ----
  async getInsiderStats(userId?: number) {
    try {
      // Base query for total updates
      let updateCountQuery = db.select({ 
        count: sql<number>`count(*)` 
      }).from(insiderUpdates).$dynamic()
        .where(eq(insiderUpdates.isActive, true));
      
      // If userId provided, filter to just their updates
      if (userId) {
        updateCountQuery = updateCountQuery.where(eq(insiderUpdates.userId, userId));
      }
      
      const updateCount = await updateCountQuery;
      
      // Get verification stats
      let verificationQuery = db.select({ 
        total: sql<number>`count(*)`,
        verified: sql<number>`sum(CASE WHEN ${insiderUpdates.verificationStatus} IN ('verified', 'confirmed_by_multiple') THEN 1 ELSE 0 END)`,
        disputed: sql<number>`sum(CASE WHEN ${insiderUpdates.verificationStatus} = 'disputed' THEN 1 ELSE 0 END)`,
        pending: sql<number>`sum(CASE WHEN ${insiderUpdates.verificationStatus} = 'pending' THEN 1 ELSE 0 END)`
      }).from(insiderUpdates).$dynamic()
        .where(eq(insiderUpdates.isActive, true));
      
      if (userId) {
        verificationQuery = verificationQuery.where(eq(insiderUpdates.userId, userId));
      }
      
      const verificationStats = await verificationQuery;
      
      // Get most active update types
      let typeCountQuery = db.select({
        type: insiderUpdates.updateType,
        count: sql<number>`count(*)`
      })
      .from(insiderUpdates).$dynamic()
      .where(eq(insiderUpdates.isActive, true));
      
      if (userId) {
        typeCountQuery = typeCountQuery.where(eq(insiderUpdates.userId, userId));
      }
      
      typeCountQuery = typeCountQuery
        .groupBy(insiderUpdates.updateType)
        .orderBy(sql`count(*) DESC`);
      
      const typeCounts = await typeCountQuery;
      
      // Get top users if no specific user requested
      let topUsersData = [];
      if (!userId) {
        topUsersData = await db.select({
          userId: insiderUpdates.userId,
          count: sql<number>`count(*)`
        })
        .from(insiderUpdates).$dynamic()
        .where(eq(insiderUpdates.isActive, true))
        .groupBy(insiderUpdates.userId)
        .orderBy(sql`count(*) DESC`)
        .limit(5);
      }
      
      return {
        totalUpdates: updateCount[0]?.count || 0,
        verificationStats: {
          total: verificationStats[0]?.total || 0,
          verified: verificationStats[0]?.verified || 0,
          disputed: verificationStats[0]?.disputed || 0,
          pending: verificationStats[0]?.pending || 0
        },
        updateTypeDistribution: typeCounts,
        topUsers: topUsersData
      };
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider stats');
      throw error;
    }
  },
  
  async getBillInsiderStats(billId: string) {
    try {
      // Get count of updates for this bill
      const updateCount = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(insiderUpdates).$dynamic()
        .where(
          and(
            eq(insiderUpdates.billId, billId),
            eq(insiderUpdates.isActive, true)
          )
        );
      
      // Get most recent updates
      const recentUpdates = await db.select().from(insiderUpdates).$dynamic()
        .where(
          and(
            eq(insiderUpdates.billId, billId),
            eq(insiderUpdates.isActive, true)
          )
        )
        .orderBy(desc(insiderUpdates.createdAt))
        .limit(5);
      
      // Get verification stats
      const verificationStats = await db.select({ 
        total: sql<number>`count(*)`,
        verified: sql<number>`sum(CASE WHEN ${insiderUpdates.verificationStatus} IN ('verified', 'confirmed_by_multiple') THEN 1 ELSE 0 END)`,
        disputed: sql<number>`sum(CASE WHEN ${insiderUpdates.verificationStatus} = 'disputed' THEN 1 ELSE 0 END)`,
        pending: sql<number>`sum(CASE WHEN ${insiderUpdates.verificationStatus} = 'pending' THEN 1 ELSE 0 END)`
      }).from(insiderUpdates).$dynamic()
        .where(
          and(
            eq(insiderUpdates.billId, billId),
            eq(insiderUpdates.isActive, true)
          )
        );
      
      return {
        totalUpdates: updateCount[0]?.count || 0,
        recentUpdates,
        verificationStats: {
          total: verificationStats[0]?.total || 0,
          verified: verificationStats[0]?.verified || 0,
          disputed: verificationStats[0]?.disputed || 0,
          pending: verificationStats[0]?.pending || 0
        }
      };
    } catch (error: any) {
      log.error({ err: error }, 'Error getting bill insider stats');
      throw error;
    }
  }
};