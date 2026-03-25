// @ts-nocheck
import { db } from "./db";
import { eq, desc, and, like, sql, asc, inArray } from "drizzle-orm";
import {
  learningResources,
  learningModules,
  learningModuleSections,
  userLearningProgress,
  learningQuizzes,
  userQuizAttempts,
  contextualLearningContent,
  civicConcepts,
  InsertLearningResource,
  InsertLearningModule,
  InsertLearningModuleSection,
  InsertUserLearningProgress,
  InsertLearningQuiz,
  InsertUserQuizAttempt,
  InsertContextualLearningContent,
  InsertCivicConcept,
  LearningResource,
  LearningModule,
  LearningModuleSection,
  UserLearningProgress,
  LearningQuiz,
  UserQuizAttempt,
  ContextualLearningContent,
  CivicConcept
} from "@shared/schema-learning";
import { users, bills } from "@shared/schema";

/**
 * Interface for Learning Module storage operations
 */
export interface ILearningStorage {
  // Learning resources
  getLearningResourceById(id: number): Promise<LearningResource | undefined>;
  getLearningResources(options?: {
    resourceType?: string;
    readLevel?: string;
    tags?: string[];
    topics?: string[];
    relatedBillId?: string;
    limit?: number;
    offset?: number;
  }): Promise<LearningResource[]>;
  createLearningResource(resource: InsertLearningResource): Promise<LearningResource>;
  updateLearningResource(id: number, resource: Partial<InsertLearningResource>): Promise<LearningResource | undefined>;
  deleteLearningResource(id: number): Promise<boolean>;
  
  // Learning modules
  getLearningModuleById(id: number): Promise<LearningModule | undefined>;
  getLearningModules(options?: {
    topics?: string[];
    difficulty?: string;
    limit?: number;
    offset?: number;
    isPublished?: boolean;
  }): Promise<LearningModule[]>;
  createLearningModule(module: InsertLearningModule): Promise<LearningModule>;
  updateLearningModule(id: number, module: Partial<InsertLearningModule>): Promise<LearningModule | undefined>;
  deleteLearningModule(id: number): Promise<boolean>;
  
  // Learning module sections
  getLearningModuleSectionById(id: number): Promise<LearningModuleSection | undefined>;
  getLearningModuleSectionsByModuleId(moduleId: number): Promise<LearningModuleSection[]>;
  createLearningModuleSection(section: InsertLearningModuleSection): Promise<LearningModuleSection>;
  updateLearningModuleSection(id: number, section: Partial<InsertLearningModuleSection>): Promise<LearningModuleSection | undefined>;
  deleteLearningModuleSection(id: number): Promise<boolean>;
  
  // User learning progress
  getUserLearningProgressById(id: number): Promise<UserLearningProgress | undefined>;
  getUserLearningProgressByUserIdAndModuleId(userId: number, moduleId: number): Promise<UserLearningProgress | undefined>;
  getUserLearningProgressByUserId(userId: number): Promise<UserLearningProgress[]>;
  createUserLearningProgress(progress: InsertUserLearningProgress): Promise<UserLearningProgress>;
  updateUserLearningProgress(id: number, progress: Partial<InsertUserLearningProgress>): Promise<UserLearningProgress | undefined>;
  
  // Learning quizzes
  getLearningQuizById(id: number): Promise<LearningQuiz | undefined>;
  getLearningQuizzesByModuleId(moduleId: number): Promise<LearningQuiz[]>;
  createLearningQuiz(quiz: InsertLearningQuiz): Promise<LearningQuiz>;
  updateLearningQuiz(id: number, quiz: Partial<InsertLearningQuiz>): Promise<LearningQuiz | undefined>;
  deleteLearningQuiz(id: number): Promise<boolean>;
  
  // User quiz attempts
  getUserQuizAttemptById(id: number): Promise<UserQuizAttempt | undefined>;
  getUserQuizAttemptsByUserId(userId: number, quizId?: number): Promise<UserQuizAttempt[]>;
  createUserQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt>;
  updateUserQuizAttempt(id: number, attempt: Partial<InsertUserQuizAttempt>): Promise<UserQuizAttempt | undefined>;
  
  // Contextual learning content
  getContextualLearningContentById(id: number): Promise<ContextualLearningContent | undefined>;
  getContextualLearningContentByUserId(userId: number, limit?: number): Promise<ContextualLearningContent[]>;
  getContextualLearningContentByBillId(billId: string, limit?: number): Promise<ContextualLearningContent[]>;
  createContextualLearningContent(content: InsertContextualLearningContent): Promise<ContextualLearningContent>;
  updateContextualLearningContent(id: number, content: Partial<InsertContextualLearningContent>): Promise<ContextualLearningContent | undefined>;
  
  // Civic concepts
  getCivicConceptById(id: number): Promise<CivicConcept | undefined>;
  getCivicConceptByTerm(term: string): Promise<CivicConcept | undefined>;
  getCivicConcepts(options?: {
    category?: string;
    complexityLevel?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<CivicConcept[]>;
  createCivicConcept(concept: InsertCivicConcept): Promise<CivicConcept>;
  updateCivicConcept(id: number, concept: Partial<InsertCivicConcept>): Promise<CivicConcept | undefined>;
}

/**
 * Implementation of Learning storage operations
 */
export class LearningStorage implements ILearningStorage {
  // Learning resources
  async getLearningResourceById(id: number): Promise<LearningResource | undefined> {
    const results = await db.select().from(learningResources).$dynamic().where(eq(learningResources.id, id));
    return results[0];
  }
  
  async getLearningResources(options?: {
    resourceType?: string;
    readLevel?: string;
    tags?: string[];
    topics?: string[];
    relatedBillId?: string;
    limit?: number;
    offset?: number;
  }): Promise<LearningResource[]> {
    let query = db.select().from(learningResources).$dynamic();
    
    if (options?.resourceType) {
      query = query.where(eq(learningResources.resourceType, options.resourceType));
    }
    
    if (options?.readLevel) {
      query = query.where(eq(learningResources.readLevel, options.readLevel));
    }
    
    // Handle array filters (tags, topics)
    if (options?.tags && options.tags.length > 0) {
      query = query.where(sql`${learningResources.tags} && ${options.tags}`);
    }
    
    if (options?.topics && options.topics.length > 0) {
      query = query.where(sql`${learningResources.topics} && ${options.topics}`);
    }
    
    if (options?.relatedBillId) {
      query = query.where(sql`${options.relatedBillId} = ANY(${learningResources.relatedBillIds})`);
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    // Order by creation date
    query = query.orderBy(desc(learningResources.createdAt));
    
    return await query;
  }
  
  async createLearningResource(resource: InsertLearningResource): Promise<LearningResource> {
    const results = await db.insert(learningResources).values(resource).returning();
    return results[0];
  }
  
  async updateLearningResource(id: number, resource: Partial<InsertLearningResource>): Promise<LearningResource | undefined> {
    const results = await db.update(learningResources)
      .set({
        ...resource,
        updatedAt: new Date()
      })
      .where(eq(learningResources.id, id))
      .returning();
    return results[0];
  }
  
  async deleteLearningResource(id: number): Promise<boolean> {
    const result = await db.delete(learningResources).where(eq(learningResources.id, id));
    return result.rowCount > 0;
  }
  
  // Learning modules
  async getLearningModuleById(id: number): Promise<LearningModule | undefined> {
    const results = await db.select().from(learningModules).$dynamic().where(eq(learningModules.id, id));
    return results[0];
  }
  
  async getLearningModules(options?: {
    topics?: string[];
    difficulty?: string;
    limit?: number;
    offset?: number;
    isPublished?: boolean;
  }): Promise<LearningModule[]> {
    let query = db.select().from(learningModules).$dynamic();
    
    if (options?.topics && options.topics.length > 0) {
      query = query.where(sql`${learningModules.topics} && ${options.topics}`);
    }
    
    if (options?.difficulty) {
      query = query.where(eq(learningModules.difficulty, options.difficulty));
    }
    
    if (options?.isPublished !== undefined) {
      query = query.where(eq(learningModules.isPublished, options.isPublished));
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    // Order by creation date
    query = query.orderBy(desc(learningModules.createdAt));
    
    return await query;
  }
  
  async createLearningModule(module: InsertLearningModule): Promise<LearningModule> {
    const results = await db.insert(learningModules).values(module).returning();
    return results[0];
  }
  
  async updateLearningModule(id: number, module: Partial<InsertLearningModule>): Promise<LearningModule | undefined> {
    const results = await db.update(learningModules)
      .set({
        ...module,
        updatedAt: new Date()
      })
      .where(eq(learningModules.id, id))
      .returning();
    return results[0];
  }
  
  async deleteLearningModule(id: number): Promise<boolean> {
    const result = await db.delete(learningModules).where(eq(learningModules.id, id));
    return result.rowCount > 0;
  }
  
  // Learning module sections
  async getLearningModuleSectionById(id: number): Promise<LearningModuleSection | undefined> {
    const results = await db.select().from(learningModuleSections).$dynamic().where(eq(learningModuleSections.id, id));
    return results[0];
  }
  
  async getLearningModuleSectionsByModuleId(moduleId: number): Promise<LearningModuleSection[]> {
    return await db.select()
      .from(learningModuleSections).$dynamic()
      .where(eq(learningModuleSections.moduleId, moduleId))
      .orderBy(asc(learningModuleSections.order));
  }
  
  async createLearningModuleSection(section: InsertLearningModuleSection): Promise<LearningModuleSection> {
    const results = await db.insert(learningModuleSections).values(section).returning();
    return results[0];
  }
  
  async updateLearningModuleSection(id: number, section: Partial<InsertLearningModuleSection>): Promise<LearningModuleSection | undefined> {
    const results = await db.update(learningModuleSections)
      .set({
        ...section,
        updatedAt: new Date()
      })
      .where(eq(learningModuleSections.id, id))
      .returning();
    return results[0];
  }
  
  async deleteLearningModuleSection(id: number): Promise<boolean> {
    const result = await db.delete(learningModuleSections).where(eq(learningModuleSections.id, id));
    return result.rowCount > 0;
  }
  
  // User learning progress
  async getUserLearningProgressById(id: number): Promise<UserLearningProgress | undefined> {
    const results = await db.select().from(userLearningProgress).$dynamic().where(eq(userLearningProgress.id, id));
    return results[0];
  }
  
  async getUserLearningProgressByUserIdAndModuleId(userId: number, moduleId: number): Promise<UserLearningProgress | undefined> {
    const results = await db.select()
      .from(userLearningProgress).$dynamic()
      .where(and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.moduleId, moduleId)
      ));
    return results[0];
  }
  
  async getUserLearningProgressByUserId(userId: number): Promise<UserLearningProgress[]> {
    return await db.select()
      .from(userLearningProgress).$dynamic()
      .where(eq(userLearningProgress.userId, userId))
      .orderBy(desc(userLearningProgress.updatedAt));
  }
  
  async createUserLearningProgress(progress: InsertUserLearningProgress): Promise<UserLearningProgress> {
    const results = await db.insert(userLearningProgress).values(progress).returning();
    return results[0];
  }
  
  async updateUserLearningProgress(id: number, progress: Partial<InsertUserLearningProgress>): Promise<UserLearningProgress | undefined> {
    const results = await db.update(userLearningProgress)
      .set({
        ...progress,
        updatedAt: new Date()
      })
      .where(eq(userLearningProgress.id, id))
      .returning();
    return results[0];
  }
  
  // Learning quizzes
  async getLearningQuizById(id: number): Promise<LearningQuiz | undefined> {
    const results = await db.select().from(learningQuizzes).$dynamic().where(eq(learningQuizzes.id, id));
    return results[0];
  }
  
  async getLearningQuizzesByModuleId(moduleId: number): Promise<LearningQuiz[]> {
    return await db.select()
      .from(learningQuizzes).$dynamic()
      .where(eq(learningQuizzes.moduleId, moduleId));
  }
  
  async createLearningQuiz(quiz: InsertLearningQuiz): Promise<LearningQuiz> {
    const results = await db.insert(learningQuizzes).values(quiz).returning();
    return results[0];
  }
  
  async updateLearningQuiz(id: number, quiz: Partial<InsertLearningQuiz>): Promise<LearningQuiz | undefined> {
    const results = await db.update(learningQuizzes)
      .set({
        ...quiz,
        updatedAt: new Date()
      })
      .where(eq(learningQuizzes.id, id))
      .returning();
    return results[0];
  }
  
  async deleteLearningQuiz(id: number): Promise<boolean> {
    const result = await db.delete(learningQuizzes).where(eq(learningQuizzes.id, id));
    return result.rowCount > 0;
  }
  
  // User quiz attempts
  async getUserQuizAttemptById(id: number): Promise<UserQuizAttempt | undefined> {
    const results = await db.select().from(userQuizAttempts).$dynamic().where(eq(userQuizAttempts.id, id));
    return results[0];
  }
  
  async getUserQuizAttemptsByUserId(userId: number, quizId?: number): Promise<UserQuizAttempt[]> {
    let query = db.select()
      .from(userQuizAttempts).$dynamic()
      .where(eq(userQuizAttempts.userId, userId));
    
    if (quizId) {
      query = query.where(eq(userQuizAttempts.quizId, quizId));
    }
    
    return await query.orderBy(desc(userQuizAttempts.completedAt));
  }
  
  async createUserQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt> {
    const results = await db.insert(userQuizAttempts).values(attempt).returning();
    return results[0];
  }
  
  async updateUserQuizAttempt(id: number, attempt: Partial<InsertUserQuizAttempt>): Promise<UserQuizAttempt | undefined> {
    const results = await db.update(userQuizAttempts)
      .set(attempt)
      .where(eq(userQuizAttempts.id, id))
      .returning();
    return results[0];
  }
  
  // Contextual learning content
  async getContextualLearningContentById(id: number): Promise<ContextualLearningContent | undefined> {
    const results = await db.select().from(contextualLearningContent).$dynamic().where(eq(contextualLearningContent.id, id));
    return results[0];
  }
  
  async getContextualLearningContentByUserId(userId: number, limit?: number): Promise<ContextualLearningContent[]> {
    let query = db.select()
      .from(contextualLearningContent).$dynamic()
      .where(eq(contextualLearningContent.userId, userId))
      .orderBy(desc(contextualLearningContent.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getContextualLearningContentByBillId(billId: string, limit?: number): Promise<ContextualLearningContent[]> {
    let query = db.select()
      .from(contextualLearningContent).$dynamic()
      .where(eq(contextualLearningContent.billId, billId))
      .orderBy(desc(contextualLearningContent.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async createContextualLearningContent(content: InsertContextualLearningContent): Promise<ContextualLearningContent> {
    const results = await db.insert(contextualLearningContent).values(content).returning();
    return results[0];
  }
  
  async updateContextualLearningContent(id: number, content: Partial<InsertContextualLearningContent>): Promise<ContextualLearningContent | undefined> {
    const results = await db.update(contextualLearningContent)
      .set(content)
      .where(eq(contextualLearningContent.id, id))
      .returning();
    return results[0];
  }
  
  // Civic concepts
  async getCivicConceptById(id: number): Promise<CivicConcept | undefined> {
    const results = await db.select().from(civicConcepts).$dynamic().where(eq(civicConcepts.id, id));
    return results[0];
  }
  
  async getCivicConceptByTerm(term: string): Promise<CivicConcept | undefined> {
    const results = await db.select().from(civicConcepts).$dynamic().where(eq(civicConcepts.term, term));
    return results[0];
  }
  
  async getCivicConcepts(options?: {
    category?: string;
    complexityLevel?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<CivicConcept[]> {
    let query = db.select().from(civicConcepts).$dynamic();
    
    if (options?.category) {
      query = query.where(eq(civicConcepts.category, options.category));
    }
    
    if (options?.complexityLevel) {
      query = query.where(eq(civicConcepts.complexityLevel, options.complexityLevel));
    }
    
    if (options?.searchTerm) {
      const searchPattern = `%${options.searchTerm}%`;
      query = query.where(
        sql`${civicConcepts.term} ILIKE ${searchPattern} OR ${civicConcepts.definition} ILIKE ${searchPattern}`
      );
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query.orderBy(asc(civicConcepts.term));
  }
  
  async createCivicConcept(concept: InsertCivicConcept): Promise<CivicConcept> {
    const results = await db.insert(civicConcepts).values(concept).returning();
    return results[0];
  }
  
  async updateCivicConcept(id: number, concept: Partial<InsertCivicConcept>): Promise<CivicConcept | undefined> {
    const results = await db.update(civicConcepts)
      .set({
        ...concept,
        updatedAt: new Date()
      })
      .where(eq(civicConcepts.id, id))
      .returning();
    return results[0];
  }
}

export const learningStorage = new LearningStorage();