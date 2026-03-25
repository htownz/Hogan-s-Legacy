import { db } from "./db";
import { userFeedback, InsertUserFeedback, UserFeedback } from "@shared/schema-feedback";
import { eq, desc, sql, gt } from "drizzle-orm";

/**
 * Storage class for user feedback
 */
export class FeedbackStorage {
  /**
   * Create a new feedback entry
   */
  async createFeedback(data: InsertUserFeedback): Promise<UserFeedback> {
    // Insert the feedback and return the created record
    const [created] = await db.insert(userFeedback)
      .values(data)
      .returning();
    
    return created;
  }

  /**
   * Get all feedback entries
   */
  async getAllFeedback(limit: number = 100, offset: number = 0): Promise<UserFeedback[]> {
    return db.select()
      .from(userFeedback)
      .orderBy(desc(userFeedback.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: number): Promise<UserFeedback | null> {
    const [feedback] = await db.select()
      .from(userFeedback).$dynamic()
      .where(eq(userFeedback.id, id));
    
    return feedback || null;
  }

  /**
   * Update feedback status
   */
  async updateFeedbackStatus(id: number, status: "new" | "reviewed" | "addressed" | "closed"): Promise<UserFeedback | null> {
    const [updated] = await db.update(userFeedback)
      .set({ status })
      .where(eq(userFeedback.id, id))
      .returning();
    
    return updated || null;
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<{
    totalCount: number;
    positiveCount: number;
    negativeCount: number;
    recentCount: number;
  }> {
    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFeedback) as [{ count: number }];
    
    // Get positive count
    const [{ count: positiveCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFeedback).$dynamic()
      .where(eq(userFeedback.sentiment, "positive")) as [{ count: number }];
    
    // Get negative count
    const [{ count: negativeCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFeedback).$dynamic()
      .where(eq(userFeedback.sentiment, "negative")) as [{ count: number }];
    
    // Get count from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [{ count: recentCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFeedback).$dynamic()
      .where(
        gt(userFeedback.createdAt, sql`${sevenDaysAgo}`)
      ) as [{ count: number }];
    
    return {
      totalCount,
      positiveCount,
      negativeCount,
      recentCount
    };
  }
}