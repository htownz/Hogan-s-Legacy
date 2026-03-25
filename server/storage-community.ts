import { db } from "./db";
import { eq, and, desc, like, sql, count, asc, or } from "drizzle-orm";
import {
  billSuggestions,
  billSuggestionCategories,
  billSuggestionUpvotes,
  billSuggestionComments,
  BillSuggestion,
  InsertBillSuggestion,
  BillSuggestionCategory,
  InsertBillSuggestionCategory,
  BillSuggestionUpvote,
  InsertBillSuggestionUpvote,
  BillSuggestionComment,
  InsertBillSuggestionComment
} from "@shared/schema-community";
import { users } from "@shared/schema";

export interface CommunityStorageInterface {
  // Bill suggestion methods
  getAllBillSuggestions(page?: number, limit?: number): Promise<BillSuggestion[]>;
  getBillSuggestionById(id: number): Promise<BillSuggestion | undefined>;
  getBillSuggestionsByBillId(billId: string): Promise<BillSuggestion[]>;
  getBillSuggestionsByUserId(userId: number): Promise<BillSuggestion[]>;
  getFeaturedBillSuggestions(limit?: number): Promise<BillSuggestion[]>;
  getTrendingBillSuggestions(limit?: number): Promise<BillSuggestion[]>;
  searchBillSuggestions(query: string): Promise<BillSuggestion[]>;
  createBillSuggestion(data: InsertBillSuggestion): Promise<BillSuggestion>;
  updateBillSuggestion(id: number, data: Partial<BillSuggestion>): Promise<BillSuggestion | undefined>;
  deleteBillSuggestion(id: number): Promise<void>;
  setFeaturedStatus(id: number, featured: boolean): Promise<BillSuggestion | undefined>;
  
  // Category methods
  getAllCategories(): Promise<{ name: string; count: number }[]>;
  getSuggestionCategories(suggestionId: number): Promise<BillSuggestionCategory[]>;
  addCategory(data: InsertBillSuggestionCategory): Promise<BillSuggestionCategory>;
  removeCategory(id: number): Promise<void>;
  
  // Upvote methods
  toggleUpvote(userId: number, suggestionId: number): Promise<{ added: boolean }>;
  hasUserUpvoted(userId: number, suggestionId: number): Promise<boolean>;
  
  // Comment methods
  getSuggestionComments(suggestionId: number): Promise<(BillSuggestionComment & { user: { username: string, displayName: string | null } })[]>;
  addComment(data: InsertBillSuggestionComment): Promise<BillSuggestionComment>;
  updateComment(id: number, content: string): Promise<BillSuggestionComment | undefined>;
  deleteComment(id: number): Promise<void>;
}

export class DatabaseCommunityStorage implements CommunityStorageInterface {
  // Bill suggestion methods
  async getAllBillSuggestions(page = 1, limit = 10): Promise<BillSuggestion[]> {
    const offset = (page - 1) * limit;
    return db
      .select()
      .from(billSuggestions)
      .orderBy(desc(billSuggestions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBillSuggestionById(id: number): Promise<BillSuggestion | undefined> {
    const [suggestion] = await db
      .select()
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.id, id));
    return suggestion;
  }

  async getBillSuggestionsByBillId(billId: string): Promise<BillSuggestion[]> {
    return db
      .select()
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.billId, billId))
      .orderBy(desc(billSuggestions.upvoteCount));
  }

  async getBillSuggestionsByUserId(userId: number): Promise<BillSuggestion[]> {
    return db
      .select()
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.userId, userId))
      .orderBy(desc(billSuggestions.createdAt));
  }

  async getFeaturedBillSuggestions(limit = 10): Promise<BillSuggestion[]> {
    return db
      .select()
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.featured, true))
      .orderBy(desc(billSuggestions.upvoteCount))
      .limit(limit);
  }

  async getTrendingBillSuggestions(limit = 10): Promise<BillSuggestion[]> {
    return db
      .select()
      .from(billSuggestions)
      .orderBy(desc(billSuggestions.upvoteCount))
      .limit(limit);
  }

  async searchBillSuggestions(query: string): Promise<BillSuggestion[]> {
    return db
      .select()
      .from(billSuggestions).$dynamic()
      .where(
        or(
          like(billSuggestions.title, `%${query}%`),
          like(billSuggestions.description, `%${query}%`),
          like(billSuggestions.rationale, `%${query}%`)
        )
      )
      .orderBy(desc(billSuggestions.upvoteCount));
  }

  async createBillSuggestion(data: InsertBillSuggestion): Promise<BillSuggestion> {
    const [suggestion] = await db
      .insert(billSuggestions)
      .values({
        ...data,
        upvoteCount: 0,
        commentCount: 0,
        featured: false,
      })
      .returning();
    return suggestion;
  }

  async updateBillSuggestion(
    id: number,
    data: Partial<BillSuggestion>
  ): Promise<BillSuggestion | undefined> {
    const [updated] = await db
      .update(billSuggestions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(billSuggestions.id, id))
      .returning();
    return updated;
  }

  async deleteBillSuggestion(id: number): Promise<void> {
    // Delete associated categories, upvotes, and comments first
    await db
      .delete(billSuggestionCategories)
      .where(eq(billSuggestionCategories.suggestionId, id));
    
    await db
      .delete(billSuggestionUpvotes)
      .where(eq(billSuggestionUpvotes.suggestionId, id));
    
    await db
      .delete(billSuggestionComments)
      .where(eq(billSuggestionComments.suggestionId, id));
    
    // Now delete the suggestion itself
    await db
      .delete(billSuggestions)
      .where(eq(billSuggestions.id, id));
  }

  async setFeaturedStatus(
    id: number,
    featured: boolean
  ): Promise<BillSuggestion | undefined> {
    const [updated] = await db
      .update(billSuggestions)
      .set({ featured, updatedAt: new Date() })
      .where(eq(billSuggestions.id, id))
      .returning();
    return updated;
  }

  // Category methods
  async getAllCategories(): Promise<{ name: string; count: number }[]> {
    const result = await db
      .select({
        name: billSuggestionCategories.name,
        count: count(),
      })
      .from(billSuggestionCategories)
      .groupBy(billSuggestionCategories.name)
      .orderBy(desc(sql`count`));

    return result;
  }

  async getSuggestionCategories(suggestionId: number): Promise<BillSuggestionCategory[]> {
    return db
      .select()
      .from(billSuggestionCategories).$dynamic()
      .where(eq(billSuggestionCategories.suggestionId, suggestionId))
      .orderBy(asc(billSuggestionCategories.name));
  }

  async addCategory(data: InsertBillSuggestionCategory): Promise<BillSuggestionCategory> {
    // Check if category already exists for this suggestion
    const existing = await db
      .select()
      .from(billSuggestionCategories).$dynamic()
      .where(
        and(
          eq(billSuggestionCategories.suggestionId, data.suggestionId),
          eq(billSuggestionCategories.name, data.name)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [category] = await db
      .insert(billSuggestionCategories)
      .values(data)
      .returning();
    
    return category;
  }

  async removeCategory(id: number): Promise<void> {
    await db
      .delete(billSuggestionCategories)
      .where(eq(billSuggestionCategories.id, id));
  }

  // Upvote methods
  async toggleUpvote(userId: number, suggestionId: number): Promise<{ added: boolean }> {
    // Check if user has already upvoted
    const existing = await db
      .select()
      .from(billSuggestionUpvotes).$dynamic()
      .where(
        and(
          eq(billSuggestionUpvotes.userId, userId),
          eq(billSuggestionUpvotes.suggestionId, suggestionId)
        )
      );

    if (existing.length > 0) {
      // User has already upvoted, so remove the upvote
      await db
        .delete(billSuggestionUpvotes)
        .where(eq(billSuggestionUpvotes.id, existing[0].id));
      
      // Decrement the upvote count on the suggestion
      await db
        .update(billSuggestions)
        .set({ 
          upvoteCount: sql`${billSuggestions.upvoteCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(billSuggestions.id, suggestionId));
      
      return { added: false };
    } else {
      // User hasn't upvoted, so add an upvote
      await db
        .insert(billSuggestionUpvotes)
        .values({ userId, suggestionId });
      
      // Increment the upvote count on the suggestion
      await db
        .update(billSuggestions)
        .set({ 
          upvoteCount: sql`${billSuggestions.upvoteCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(billSuggestions.id, suggestionId));
      
      return { added: true };
    }
  }

  async hasUserUpvoted(userId: number, suggestionId: number): Promise<boolean> {
    const existing = await db
      .select()
      .from(billSuggestionUpvotes).$dynamic()
      .where(
        and(
          eq(billSuggestionUpvotes.userId, userId),
          eq(billSuggestionUpvotes.suggestionId, suggestionId)
        )
      );
    
    return existing.length > 0;
  }

  // Comment methods
  async getSuggestionComments(
    suggestionId: number
  ): Promise<(BillSuggestionComment & { user: { username: string, displayName: string | null } })[]> {
    const result = await db
      .select({
        comment: billSuggestionComments,
        user: {
          username: users.username,
          displayName: users.displayName,
        },
      })
      .from(billSuggestionComments)
      .innerJoin(users, eq(billSuggestionComments.userId, users.id))
      .where(eq(billSuggestionComments.suggestionId, suggestionId))
      .orderBy(desc(billSuggestionComments.createdAt));

    return result.map(r => ({
      ...r.comment,
      user: r.user,
    }));
  }

  async addComment(data: InsertBillSuggestionComment): Promise<BillSuggestionComment> {
    const [comment] = await db
      .insert(billSuggestionComments)
      .values(data)
      .returning();
    
    // Increment the comment count on the suggestion
    await db
      .update(billSuggestions)
      .set({ 
        commentCount: sql`${billSuggestions.commentCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(billSuggestions.id, data.suggestionId));
    
    return comment;
  }

  async updateComment(
    id: number,
    content: string
  ): Promise<BillSuggestionComment | undefined> {
    const [updated] = await db
      .update(billSuggestionComments)
      .set({ 
        content, 
        updatedAt: new Date() 
      })
      .where(eq(billSuggestionComments.id, id))
      .returning();
    
    return updated;
  }

  async deleteComment(id: number): Promise<void> {
    // Get the comment to find its suggestion ID
    const [comment] = await db
      .select()
      .from(billSuggestionComments).$dynamic()
      .where(eq(billSuggestionComments.id, id));
    
    if (comment) {
      // Delete the comment
      await db
        .delete(billSuggestionComments)
        .where(eq(billSuggestionComments.id, id));
      
      // Decrement the comment count on the suggestion
      await db
        .update(billSuggestions)
        .set({ 
          commentCount: sql`${billSuggestions.commentCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(billSuggestions.id, comment.suggestionId));
    }
  }
}

export const communityStorage = new DatabaseCommunityStorage();