import { 
  infographics, 
  infographicShares, 
  infographicTemplates,
  type Infographic,
  type InsertInfographic,
  type InfographicShare,
  type InsertInfographicShare,
  type InfographicTemplate,
  type InsertInfographicTemplate
} from "@shared/schema-infographics";

import { bills } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, like, sql } from "drizzle-orm";

export interface IInfographicsStorage {
  // Infographic methods
  getInfographicById(id: number): Promise<Infographic | undefined>;
  getUserInfographics(userId: number): Promise<Infographic[]>;
  getBillInfographics(billId: string): Promise<Infographic[]>;
  searchInfographics(query: string): Promise<Infographic[]>;
  createInfographic(data: InsertInfographic): Promise<Infographic>;
  updateInfographic(id: number, userId: number, data: Partial<Infographic>): Promise<Infographic | undefined>;
  deleteInfographic(id: number, userId: number): Promise<void>;
  incrementShareCount(id: number): Promise<Infographic | undefined>;
  incrementViewCount(id: number): Promise<Infographic | undefined>;
  
  // Infographic shares methods
  getInfographicShares(infographicId: number): Promise<InfographicShare[]>;
  createInfographicShare(data: InsertInfographicShare): Promise<InfographicShare>;
  incrementShareClickCount(id: number): Promise<InfographicShare | undefined>;
  
  // Infographic template methods
  getAllTemplates(): Promise<InfographicTemplate[]>;
  getTemplatesByType(type: string): Promise<InfographicTemplate[]>;
  getTemplateById(id: number): Promise<InfographicTemplate | undefined>;
  createTemplate(data: InsertInfographicTemplate): Promise<InfographicTemplate>;
  updateTemplate(id: number, data: Partial<InfographicTemplate>): Promise<InfographicTemplate | undefined>;
}

export class InfographicsStorage implements IInfographicsStorage {
  async getInfographicById(id: number): Promise<Infographic | undefined> {
    const [result] = await db
      .select()
      .from(infographics).$dynamic()
      .where(eq(infographics.id, id));
    return result;
  }

  async getUserInfographics(userId: number): Promise<Infographic[]> {
    return db
      .select()
      .from(infographics).$dynamic()
      .where(eq(infographics.userId, userId))
      .orderBy(desc(infographics.createdAt));
  }

  async getBillInfographics(billId: string): Promise<Infographic[]> {
    return db
      .select()
      .from(infographics).$dynamic()
      .where(eq(infographics.billId, billId))
      .orderBy(desc(infographics.createdAt));
  }

  async searchInfographics(query: string): Promise<Infographic[]> {
    return db
      .select()
      .from(infographics).$dynamic()
      .where(
        or(
          like(infographics.title, `%${query}%`),
          like(infographics.description, `%${query}%`)
        )
      )
      .orderBy(desc(infographics.createdAt));
  }

  async createInfographic(data: InsertInfographic): Promise<Infographic> {
    const [result] = await db
      .insert(infographics)
      .values(data)
      .returning();
    return result;
  }

  async updateInfographic(id: number, userId: number, data: Partial<Infographic>): Promise<Infographic | undefined> {
    const [result] = await db
      .update(infographics)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(infographics.id, id),
          eq(infographics.userId, userId)
        )
      )
      .returning();
    return result;
  }

  async deleteInfographic(id: number, userId: number): Promise<void> {
    await db
      .delete(infographics)
      .where(
        and(
          eq(infographics.id, id),
          eq(infographics.userId, userId)
        )
      );
  }

  async incrementShareCount(id: number): Promise<Infographic | undefined> {
    const [result] = await db
      .update(infographics)
      .set({ 
        shareCount: sql`${infographics.shareCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(infographics.id, id))
      .returning();
    return result;
  }

  async incrementViewCount(id: number): Promise<Infographic | undefined> {
    const [result] = await db
      .update(infographics)
      .set({ 
        viewCount: sql`${infographics.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(infographics.id, id))
      .returning();
    return result;
  }

  async getInfographicShares(infographicId: number): Promise<InfographicShare[]> {
    return db
      .select()
      .from(infographicShares).$dynamic()
      .where(eq(infographicShares.infographicId, infographicId))
      .orderBy(desc(infographicShares.createdAt));
  }

  async createInfographicShare(data: InsertInfographicShare): Promise<InfographicShare> {
    const [result] = await db
      .insert(infographicShares)
      .values(data)
      .returning();
    
    // Increment the share count on the infographic itself
    await this.incrementShareCount(data.infographicId);
    
    return result;
  }

  async incrementShareClickCount(id: number): Promise<InfographicShare | undefined> {
    const [result] = await db
      .update(infographicShares)
      .set({ 
        clickCount: sql`${infographicShares.clickCount} + 1`
      })
      .where(eq(infographicShares.id, id))
      .returning();
    return result;
  }

  async getAllTemplates(): Promise<InfographicTemplate[]> {
    return db
      .select()
      .from(infographicTemplates).$dynamic()
      .where(eq(infographicTemplates.isActive, true))
      .orderBy(desc(infographicTemplates.createdAt));
  }

  async getTemplatesByType(type: string): Promise<InfographicTemplate[]> {
    return db
      .select()
      .from(infographicTemplates).$dynamic()
      .where(
        and(
          eq(infographicTemplates.type, type),
          eq(infographicTemplates.isActive, true)
        )
      )
      .orderBy(desc(infographicTemplates.createdAt));
  }

  async getTemplateById(id: number): Promise<InfographicTemplate | undefined> {
    const [result] = await db
      .select()
      .from(infographicTemplates).$dynamic()
      .where(
        and(
          eq(infographicTemplates.id, id),
          eq(infographicTemplates.isActive, true)
        )
      );
    return result;
  }

  async createTemplate(data: InsertInfographicTemplate): Promise<InfographicTemplate> {
    const [result] = await db
      .insert(infographicTemplates)
      .values(data)
      .returning();
    return result;
  }

  async updateTemplate(id: number, data: Partial<InfographicTemplate>): Promise<InfographicTemplate | undefined> {
    const [result] = await db
      .update(infographicTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(infographicTemplates.id, id))
      .returning();
    return result;
  }
}

export const infographicsStorage = new InfographicsStorage();