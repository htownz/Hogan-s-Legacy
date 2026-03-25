import { 
  personalImpactAssessments, 
  bills,
  type PersonalImpactAssessment, 
  type InsertPersonalImpactAssessment,
  type Bill
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { IStorage } from "./storage-interface";

export interface IImpactStorage {
  // Personal impact assessment methods
  getPersonalImpactAssessment(userId: number, billId: string): Promise<PersonalImpactAssessment | undefined>;
  getPersonalImpactAssessmentsByUser(userId: number): Promise<PersonalImpactAssessment[]>;
  getPersonalImpactAssessmentsByBill(billId: string): Promise<PersonalImpactAssessment[]>;
  createPersonalImpactAssessment(assessment: InsertPersonalImpactAssessment): Promise<PersonalImpactAssessment>;
  updatePersonalImpactAssessment(id: number, assessment: Partial<InsertPersonalImpactAssessment>): Promise<PersonalImpactAssessment | undefined>;
  deletePersonalImpactAssessment(id: number): Promise<boolean>;
  
  // Bill impact summary methods
  updateBillImpactSummary(billId: string, impactSummary: string): Promise<Bill | undefined>;
  getBillsWithoutImpactSummary(): Promise<Bill[]>;
}

export class DatabaseImpactStorage implements IImpactStorage {
  // Personal impact assessment methods
  async getPersonalImpactAssessment(userId: number, billId: string): Promise<PersonalImpactAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(personalImpactAssessments).$dynamic()
      .where(
        and(
          eq(personalImpactAssessments.userId, userId),
          eq(personalImpactAssessments.billId, billId)
        )
      );
    
    return assessment;
  }

  async getPersonalImpactAssessmentsByUser(userId: number): Promise<PersonalImpactAssessment[]> {
    return db
      .select()
      .from(personalImpactAssessments).$dynamic()
      .where(eq(personalImpactAssessments.userId, userId))
      .orderBy(desc(personalImpactAssessments.generatedAt));
  }

  async getPersonalImpactAssessmentsByBill(billId: string): Promise<PersonalImpactAssessment[]> {
    return db
      .select()
      .from(personalImpactAssessments).$dynamic()
      .where(eq(personalImpactAssessments.billId, billId))
      .orderBy(desc(personalImpactAssessments.generatedAt));
  }

  async createPersonalImpactAssessment(assessment: InsertPersonalImpactAssessment): Promise<PersonalImpactAssessment> {
    const [newAssessment] = await db
      .insert(personalImpactAssessments)
      .values(assessment)
      .returning();
    
    return newAssessment;
  }

  async updatePersonalImpactAssessment(id: number, assessment: Partial<InsertPersonalImpactAssessment>): Promise<PersonalImpactAssessment | undefined> {
    const [updatedAssessment] = await db
      .update(personalImpactAssessments)
      .set({
        ...assessment,
        updatedAt: new Date()
      })
      .where(eq(personalImpactAssessments.id, id))
      .returning();
    
    return updatedAssessment;
  }

  async deletePersonalImpactAssessment(id: number): Promise<boolean> {
    const [deletedAssessment] = await db
      .delete(personalImpactAssessments)
      .where(eq(personalImpactAssessments.id, id))
      .returning({ id: personalImpactAssessments.id });
    
    return !!deletedAssessment;
  }

  // Bill impact summary methods
  async updateBillImpactSummary(billId: string, impactSummary: string): Promise<Bill | undefined> {
    const [updatedBill] = await db
      .update(bills)
      .set({
        impactSummary,
        updatedAt: new Date()
      })
      .where(eq(bills.id, billId))
      .returning();
    
    return updatedBill;
  }

  async getBillsWithoutImpactSummary(): Promise<Bill[]> {
    return db
      .select()
      .from(bills).$dynamic()
      .where(isNull(bills.impactSummary));
  }
}