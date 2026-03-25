import { and, eq } from "drizzle-orm";
import { db } from "./db";
import {
  OnboardingProgress,
  CivicInterest,
  EngagementPreference,
  TutorialProgress,
  InsertOnboardingProgress,
  InsertCivicInterest,
  InsertEngagementPreference,
  InsertTutorialProgress,
  onboardingProgress,
  civicInterests,
  engagementPreferences,
  tutorialProgress
} from "@shared/schema-onboarding";

export interface IOnboardingStorage {
  // Onboarding progress methods
  getOnboardingProgress(userId: number): Promise<OnboardingProgress[]>;
  getOnboardingStep(userId: number, step: string): Promise<OnboardingProgress | undefined>;
  upsertOnboardingStep(data: InsertOnboardingProgress): Promise<OnboardingProgress>;
  completeOnboardingStep(userId: number, step: string): Promise<OnboardingProgress | undefined>;
  
  // Civic interests methods
  getCivicInterests(userId: number): Promise<CivicInterest[]>;
  addCivicInterest(data: InsertCivicInterest): Promise<CivicInterest>;
  updateCivicInterest(id: number, data: Partial<InsertCivicInterest>): Promise<CivicInterest | undefined>;
  deleteCivicInterest(id: number): Promise<boolean>;
  
  // Engagement preferences methods
  getEngagementPreferences(userId: number): Promise<EngagementPreference | undefined>;
  upsertEngagementPreferences(data: InsertEngagementPreference): Promise<EngagementPreference>;
  
  // Tutorial progress methods
  getTutorialProgress(userId: number): Promise<TutorialProgress[]>;
  getTutorialStep(userId: number, tutorialId: string): Promise<TutorialProgress | undefined>;
  upsertTutorialStep(data: InsertTutorialProgress): Promise<TutorialProgress>;
  completeTutorialStep(userId: number, tutorialId: string): Promise<TutorialProgress | undefined>;
}

export class DatabaseOnboardingStorage implements IOnboardingStorage {
  // Onboarding progress methods
  async getOnboardingProgress(userId: number): Promise<OnboardingProgress[]> {
    return await db.select().from(onboardingProgress).$dynamic().where(eq(onboardingProgress.userId, userId));
  }

  async getOnboardingStep(userId: number, step: string): Promise<OnboardingProgress | undefined> {
    const results = await db.select().from(onboardingProgress).$dynamic()
      .where(and(
        eq(onboardingProgress.userId, userId),
        eq(onboardingProgress.step, step)
      ));
    return results[0];
  }

  async upsertOnboardingStep(data: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const existingStep = await this.getOnboardingStep(data.userId, data.step);
    
    if (existingStep) {
      const [updated] = await db.update(onboardingProgress)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(onboardingProgress.id, existingStep.id))
        .returning();
      return updated;
    } else {
      const [newStep] = await db.insert(onboardingProgress).values(data).returning();
      return newStep;
    }
  }

  async completeOnboardingStep(userId: number, step: string): Promise<OnboardingProgress | undefined> {
    const existingStep = await this.getOnboardingStep(userId, step);
    if (!existingStep) return undefined;
    
    const [updated] = await db.update(onboardingProgress)
      .set({
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(onboardingProgress.id, existingStep.id))
      .returning();
    
    return updated;
  }
  
  // Civic interests methods
  async getCivicInterests(userId: number): Promise<CivicInterest[]> {
    return await db.select().from(civicInterests).$dynamic().where(eq(civicInterests.userId, userId));
  }

  async addCivicInterest(data: InsertCivicInterest): Promise<CivicInterest> {
    const [newInterest] = await db.insert(civicInterests).values(data).returning();
    return newInterest;
  }

  async updateCivicInterest(id: number, data: Partial<InsertCivicInterest>): Promise<CivicInterest | undefined> {
    const [updated] = await db.update(civicInterests)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(civicInterests.id, id))
      .returning();
    
    return updated;
  }

  async deleteCivicInterest(id: number): Promise<boolean> {
    const result = await db.delete(civicInterests).where(eq(civicInterests.id, id));
    return true;
  }
  
  // Engagement preferences methods
  async getEngagementPreferences(userId: number): Promise<EngagementPreference | undefined> {
    const results = await db.select().from(engagementPreferences).$dynamic()
      .where(eq(engagementPreferences.userId, userId));
    return results[0];
  }

  async upsertEngagementPreferences(data: InsertEngagementPreference): Promise<EngagementPreference> {
    const existingPrefs = await this.getEngagementPreferences(data.userId);
    
    if (existingPrefs) {
      const [updated] = await db.update(engagementPreferences)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(engagementPreferences.id, existingPrefs.id))
        .returning();
      return updated;
    } else {
      const [newPrefs] = await db.insert(engagementPreferences).values(data).returning();
      return newPrefs;
    }
  }
  
  // Tutorial progress methods
  async getTutorialProgress(userId: number): Promise<TutorialProgress[]> {
    return await db.select().from(tutorialProgress).$dynamic().where(eq(tutorialProgress.userId, userId));
  }

  async getTutorialStep(userId: number, tutorialId: string): Promise<TutorialProgress | undefined> {
    const results = await db.select().from(tutorialProgress).$dynamic()
      .where(and(
        eq(tutorialProgress.userId, userId),
        eq(tutorialProgress.tutorialId, tutorialId)
      ));
    return results[0];
  }

  async upsertTutorialStep(data: InsertTutorialProgress): Promise<TutorialProgress> {
    const existingStep = await this.getTutorialStep(data.userId, data.tutorialId);
    
    if (existingStep) {
      const [updated] = await db.update(tutorialProgress)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(tutorialProgress.id, existingStep.id))
        .returning();
      return updated;
    } else {
      const [newStep] = await db.insert(tutorialProgress).values(data).returning();
      return newStep;
    }
  }

  async completeTutorialStep(userId: number, tutorialId: string): Promise<TutorialProgress | undefined> {
    const existingStep = await this.getTutorialStep(userId, tutorialId);
    if (!existingStep) return undefined;
    
    const [updated] = await db.update(tutorialProgress)
      .set({
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tutorialProgress.id, existingStep.id))
      .returning();
    
    return updated;
  }
}

export const onboardingStorage = new DatabaseOnboardingStorage();