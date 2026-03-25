import { db } from "./db";
import {
  civicTerms,
  civicTermAppearances,
  type CivicTerm,
  type InsertCivicTerm,
  type InsertCivicTermAppearance,
} from "@shared/schema-civic-terms";
import { and, eq, ilike, inArray, or } from "drizzle-orm";

export interface ICivicTermsStorage {
  /**
   * Get a civic term by ID
   */
  getCivicTerm(id: number): Promise<CivicTerm | undefined>;

  /**
   * Get a civic term by term name (exact match)
   */
  getCivicTermByName(term: string): Promise<CivicTerm | undefined>;

  /**
   * Get all civic terms
   */
  getAllCivicTerms(): Promise<CivicTerm[]>;

  /**
   * Get civic terms by category
   */
  getCivicTermsByCategory(category: string): Promise<CivicTerm[]>;

  /**
   * Get civic terms by difficulty level
   */
  getCivicTermsByDifficulty(difficulty: string): Promise<CivicTerm[]>;

  /**
   * Search civic terms by keyword in term or definition
   */
  searchCivicTerms(query: string): Promise<CivicTerm[]>;

  /**
   * Create a new civic term
   */
  createCivicTerm(term: InsertCivicTerm): Promise<CivicTerm>;

  /**
   * Update a civic term
   */
  updateCivicTerm(id: number, term: Partial<InsertCivicTerm>): Promise<CivicTerm | undefined>;

  /**
   * Delete a civic term
   */
  deleteCivicTerm(id: number): Promise<boolean>;

  /**
   * Track a term appearance in the application
   */
  trackTermAppearance(appearance: InsertCivicTermAppearance): Promise<number>;

  /**
   * Get related terms for a given term
   */
  getRelatedTerms(termId: number): Promise<CivicTerm[]>;
}

export class DatabaseCivicTermsStorage implements ICivicTermsStorage {
  async getCivicTerm(id: number): Promise<CivicTerm | undefined> {
    const [term] = await db.select().from(civicTerms).$dynamic().where(eq(civicTerms.id, id));
    return term;
  }

  async getCivicTermByName(term: string): Promise<CivicTerm | undefined> {
    const [result] = await db
      .select()
      .from(civicTerms).$dynamic()
      .where(eq(civicTerms.term, term));
    return result;
  }

  async getAllCivicTerms(): Promise<CivicTerm[]> {
    return db.select().from(civicTerms);
  }

  async getCivicTermsByCategory(category: string): Promise<CivicTerm[]> {
    return db
      .select()
      .from(civicTerms).$dynamic()
      .where(eq(civicTerms.category, category as any));
  }

  async getCivicTermsByDifficulty(difficulty: string): Promise<CivicTerm[]> {
    return db
      .select()
      .from(civicTerms).$dynamic()
      .where(eq(civicTerms.difficulty, difficulty as any));
  }

  async searchCivicTerms(query: string): Promise<CivicTerm[]> {
    return db
      .select()
      .from(civicTerms).$dynamic()
      .where(
        or(
          ilike(civicTerms.term, `%${query}%`),
          ilike(civicTerms.definition, `%${query}%`)
        )
      );
  }

  async createCivicTerm(term: InsertCivicTerm): Promise<CivicTerm> {
    const [newTerm] = await db
      .insert(civicTerms)
      .values({
        ...term,
        updatedAt: new Date(),
      })
      .returning();
    return newTerm;
  }

  async updateCivicTerm(
    id: number,
    term: Partial<InsertCivicTerm>
  ): Promise<CivicTerm | undefined> {
    const [updatedTerm] = await db
      .update(civicTerms)
      .set({
        ...term,
        updatedAt: new Date(),
      })
      .where(eq(civicTerms.id, id))
      .returning();
    return updatedTerm;
  }

  async deleteCivicTerm(id: number): Promise<boolean> {
    const result = await db
      .delete(civicTerms)
      .where(eq(civicTerms.id, id))
      .returning({ id: civicTerms.id });
    return result.length > 0;
  }

  async trackTermAppearance(appearance: InsertCivicTermAppearance): Promise<number> {
    const [result] = await db
      .insert(civicTermAppearances)
      .values(appearance)
      .returning({ id: civicTermAppearances.id });
    return result.id;
  }

  async getRelatedTerms(termId: number): Promise<CivicTerm[]> {
    const term = await this.getCivicTerm(termId);
    if (!term || !term.relatedTerms || term.relatedTerms.length === 0) {
      return [];
    }

    return db
      .select()
      .from(civicTerms).$dynamic()
      .where(inArray(civicTerms.term, term.relatedTerms));
  }
}

// Initialize and export the storage instance
export const civicTermsStorage = new DatabaseCivicTermsStorage();