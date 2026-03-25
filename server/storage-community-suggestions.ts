import { eq, desc, and, sql, count, asc, gt } from "drizzle-orm";
import { db } from "./db";
import { 
  billSuggestions,
  billSuggestionUpvotes,
  billSuggestionComments,
  type BillSuggestion,
  type InsertBillSuggestion,
  type BillSuggestionUpvote,
  type InsertBillSuggestionUpvote,
  type BillSuggestionComment,
  type InsertBillSuggestionComment
} from "@shared/schema-community-suggestions";

class CommunityStorage {
  // ===== SUGGESTIONS =====
  
  /**
   * Create a new bill suggestion
   */
  async createSuggestion(data: InsertBillSuggestion): Promise<BillSuggestion> {
    const [suggestion] = await db
      .insert(billSuggestions)
      .values(data)
      .returning();
      
    return suggestion;
  }
  
  /**
   * Get a bill suggestion by ID
   */
  async getSuggestionById(id: number): Promise<BillSuggestion | undefined> {
    const [suggestion] = await db
      .select()
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.id, id));
      
    return suggestion;
  }
  
  /**
   * List all bill suggestions with pagination and featured filtering
   */
  async listSuggestions(
    limit: number = 50, 
    offset: number = 0,
    featured: boolean = false
  ): Promise<BillSuggestion[]> {
    const suggestions = await db
      .select()
      .from(billSuggestions).$dynamic()
      .where(featured ? eq(billSuggestions.featured, true) : sql`1=1`)
      .orderBy(desc(billSuggestions.upvoteCount), desc(billSuggestions.createdAt))
      .limit(limit)
      .offset(offset);
      
    return suggestions;
  }
  
  /**
   * List bill suggestions by priority
   */
  async listSuggestionsByPriority(
    priority: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BillSuggestion[]> {
    const suggestions = await db
      .select()
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.priority, priority))
      .orderBy(desc(billSuggestions.upvoteCount), desc(billSuggestions.createdAt))
      .limit(limit)
      .offset(offset);
      
    return suggestions;
  }
  
  /**
   * List bill suggestions by user
   */
  async listSuggestionsByUser(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<BillSuggestion[]> {
    const suggestions = await db
      .select()
      .from(billSuggestions).$dynamic()
      .where(eq(billSuggestions.userId, userId))
      .orderBy(desc(billSuggestions.createdAt))
      .limit(limit)
      .offset(offset);
      
    return suggestions;
  }
  
  /**
   * Get trending suggestions based on upvote count
   */
  async getTrendingSuggestions(limit: number = 10): Promise<BillSuggestion[]> {
    // Get suggestions with highest upvote count
    const suggestions = await db
      .select()
      .from(billSuggestions)
      .orderBy(desc(billSuggestions.upvoteCount), desc(billSuggestions.createdAt))
      .limit(limit);
      
    return suggestions;
  }
  
  /**
   * Update a bill suggestion
   */
  async updateSuggestion(
    id: number,
    data: Partial<InsertBillSuggestion>
  ): Promise<BillSuggestion | undefined> {
    const [suggestion] = await db
      .update(billSuggestions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(billSuggestions.id, id))
      .returning();
      
    return suggestion;
  }
  
  /**
   * Delete a bill suggestion
   */
  async deleteSuggestion(id: number): Promise<boolean> {
    try {
      await db
        .delete(billSuggestions)
        .where(eq(billSuggestions.id, id));
      
      return true;
    } catch (error: any) {
      console.error('Error deleting suggestion:', error);
      return false;
    }
  }
  
  /**
   * Update upvote count for a suggestion
   */
  async updateSuggestionUpvoteCount(id: number): Promise<void> {
    const suggestion = await this.getSuggestionById(id);
    if (!suggestion) return;
    
    // Get upvote count
    const upvoteCount = await this.getUpvoteCount(id);
    
    // Update the suggestion with new upvote count
    await db
      .update(billSuggestions)
      .set({
        upvoteCount: upvoteCount,
        updatedAt: new Date()
      })
      .where(eq(billSuggestions.id, id));
  }
  
  // ===== UPVOTES =====
  
  /**
   * Add an upvote to a suggestion
   */
  async addUpvote(data: InsertBillSuggestionUpvote): Promise<BillSuggestionUpvote> {
    const [upvote] = await db
      .insert(billSuggestionUpvotes)
      .values(data)
      .returning();
      
    // Update upvote count
    await this.updateSuggestionUpvoteCount(data.suggestionId);
      
    return upvote;
  }
  
  /**
   * Remove an upvote from a suggestion
   */
  async removeUpvote(suggestionId: number, userId: number): Promise<boolean> {
    try {
      await db
        .delete(billSuggestionUpvotes)
        .where(
          and(
            eq(billSuggestionUpvotes.suggestionId, suggestionId),
            eq(billSuggestionUpvotes.userId, userId)
          )
        );
      
      // Update upvote count
      await this.updateSuggestionUpvoteCount(suggestionId);
      
      return true;
    } catch (error: any) {
      console.error('Error removing upvote:', error);
      return false;
    }
  }
  
  /**
   * Check if a user has already upvoted a suggestion
   */
  async hasUserUpvoted(suggestionId: number, userId: number): Promise<boolean> {
    const [upvote] = await db
      .select()
      .from(billSuggestionUpvotes).$dynamic()
      .where(
        and(
          eq(billSuggestionUpvotes.suggestionId, suggestionId),
          eq(billSuggestionUpvotes.userId, userId)
        )
      );
      
    return !!upvote;
  }
  
  /**
   * Get the count of upvotes for a suggestion
   */
  async getUpvoteCount(suggestionId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(billSuggestionUpvotes).$dynamic()
      .where(eq(billSuggestionUpvotes.suggestionId, suggestionId));
      
    return result?.count || 0;
  }
  
  // ===== COMMENTS =====
  
  /**
   * Add a comment to a suggestion
   */
  async addComment(data: InsertBillSuggestionComment): Promise<BillSuggestionComment> {
    const [comment] = await db
      .insert(billSuggestionComments)
      .values(data)
      .returning();
      
    return comment;
  }
  
  /**
   * Get a comment by ID
   */
  async getCommentById(id: number): Promise<BillSuggestionComment | undefined> {
    const [comment] = await db
      .select()
      .from(billSuggestionComments).$dynamic()
      .where(eq(billSuggestionComments.id, id));
      
    return comment;
  }
  
  /**
   * List all comments for a suggestion
   */
  async listCommentsBySuggestion(suggestionId: number): Promise<BillSuggestionComment[]> {
    const comments = await db
      .select()
      .from(billSuggestionComments).$dynamic()
      .where(eq(billSuggestionComments.suggestionId, suggestionId))
      .orderBy(asc(billSuggestionComments.createdAt));
      
    return comments;
  }
  
  /**
   * Update a comment
   */
  async updateComment(id: number, content: string): Promise<BillSuggestionComment | undefined> {
    const [comment] = await db
      .update(billSuggestionComments)
      .set({
        content,
        updatedAt: new Date()
      })
      .where(eq(billSuggestionComments.id, id))
      .returning();
      
    return comment;
  }
  
  /**
   * Delete a comment
   */
  async deleteComment(id: number): Promise<boolean> {
    try {
      await db
        .delete(billSuggestionComments)
        .where(eq(billSuggestionComments.id, id));
      
      return true;
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }
}

export const communityStorage = new CommunityStorage();