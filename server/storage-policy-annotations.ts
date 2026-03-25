import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import { 
  policyAnnotations, 
  annotationReplies,
  PolicyAnnotation,
  InsertPolicyAnnotation,
  AnnotationReply,
  InsertAnnotationReply,
  users
} from "../shared/schema";

/**
 * Interface for Policy Annotation storage operations
 */
export interface IPolicyAnnotationStorage {
  // Annotation methods
  getAnnotationById(id: number): Promise<PolicyAnnotation | undefined>;
  getAnnotationsByBillId(billId: string): Promise<PolicyAnnotation[]>;
  getAnnotationsByUserId(userId: number): Promise<PolicyAnnotation[]>;
  getPublicAnnotationsByBillId(billId: string): Promise<PolicyAnnotation[]>;
  getCircleAnnotationsByBillId(billId: string, circleId: number): Promise<PolicyAnnotation[]>;
  createAnnotation(annotation: InsertPolicyAnnotation): Promise<PolicyAnnotation>;
  updateAnnotation(id: number, annotation: Partial<InsertPolicyAnnotation>): Promise<PolicyAnnotation | undefined>;
  deleteAnnotation(id: number): Promise<boolean>;
  
  // Reply methods
  getReplyById(id: number): Promise<AnnotationReply | undefined>;
  getRepliesByAnnotationId(annotationId: number): Promise<AnnotationReply[]>;
  createReply(reply: InsertAnnotationReply): Promise<AnnotationReply>;
  updateReply(id: number, reply: Partial<InsertAnnotationReply>): Promise<AnnotationReply | undefined>;
  deleteReply(id: number): Promise<boolean>;
  
  // Voting methods
  upvoteAnnotation(id: number): Promise<PolicyAnnotation | undefined>;
  downvoteAnnotation(id: number): Promise<PolicyAnnotation | undefined>;
  upvoteReply(id: number): Promise<AnnotationReply | undefined>;
  downvoteReply(id: number): Promise<AnnotationReply | undefined>;
  
  // Advanced methods
  getAnnotationsWithUserDetails(billId: string): Promise<(PolicyAnnotation & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]>;
  getRepliesWithUserDetails(annotationId: number): Promise<(AnnotationReply & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]>;
}

/**
 * Implementation of Policy Annotation storage operations using the database
 */
export class DatabasePolicyAnnotationStorage implements IPolicyAnnotationStorage {
  async getAnnotationById(id: number): Promise<PolicyAnnotation | undefined> {
    const results = await db.select().from(policyAnnotations).$dynamic().where(eq(policyAnnotations.id, id)).limit(1);
    return results[0];
  }
  
  async getAnnotationsByBillId(billId: string): Promise<PolicyAnnotation[]> {
    return db.select().from(policyAnnotations).$dynamic()
      .where(and(
        eq(policyAnnotations.billId, billId),
        eq(policyAnnotations.isActive, true)
      ))
      .orderBy(policyAnnotations.createdAt);
  }
  
  async getAnnotationsByUserId(userId: number): Promise<PolicyAnnotation[]> {
    return db.select().from(policyAnnotations).$dynamic()
      .where(and(
        eq(policyAnnotations.userId, userId),
        eq(policyAnnotations.isActive, true)
      ))
      .orderBy(policyAnnotations.createdAt);
  }
  
  async getPublicAnnotationsByBillId(billId: string): Promise<PolicyAnnotation[]> {
    return db.select().from(policyAnnotations).$dynamic()
      .where(and(
        eq(policyAnnotations.billId, billId),
        eq(policyAnnotations.visibility, "public"),
        eq(policyAnnotations.isActive, true)
      ))
      .orderBy(policyAnnotations.createdAt);
  }
  
  async getCircleAnnotationsByBillId(billId: string, circleId: number): Promise<PolicyAnnotation[]> {
    return db.select().from(policyAnnotations).$dynamic()
      .where(and(
        eq(policyAnnotations.billId, billId),
        eq(policyAnnotations.circleId, circleId),
        eq(policyAnnotations.visibility, "circle"),
        eq(policyAnnotations.isActive, true)
      ))
      .orderBy(policyAnnotations.createdAt);
  }
  
  async createAnnotation(annotation: InsertPolicyAnnotation): Promise<PolicyAnnotation> {
    const results = await db.insert(policyAnnotations).values(annotation).returning();
    return results[0];
  }
  
  async updateAnnotation(id: number, annotation: Partial<InsertPolicyAnnotation>): Promise<PolicyAnnotation | undefined> {
    const now = new Date();
    const results = await db.update(policyAnnotations)
      .set({ ...annotation, updatedAt: now })
      .where(eq(policyAnnotations.id, id))
      .returning();
    return results[0];
  }
  
  async deleteAnnotation(id: number): Promise<boolean> {
    try {
      await db.update(policyAnnotations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(policyAnnotations.id, id));
      return true;
    } catch (error: any) {
      console.error("Error deleting annotation:", error);
      return false;
    }
  }
  
  async getReplyById(id: number): Promise<AnnotationReply | undefined> {
    const results = await db.select().from(annotationReplies).$dynamic().where(eq(annotationReplies.id, id)).limit(1);
    return results[0];
  }
  
  async getRepliesByAnnotationId(annotationId: number): Promise<AnnotationReply[]> {
    return db.select().from(annotationReplies).$dynamic()
      .where(and(
        eq(annotationReplies.annotationId, annotationId),
        eq(annotationReplies.isActive, true)
      ))
      .orderBy(annotationReplies.createdAt);
  }
  
  async createReply(reply: InsertAnnotationReply): Promise<AnnotationReply> {
    const results = await db.insert(annotationReplies).values(reply).returning();
    return results[0];
  }
  
  async updateReply(id: number, reply: Partial<InsertAnnotationReply>): Promise<AnnotationReply | undefined> {
    const now = new Date();
    const results = await db.update(annotationReplies)
      .set({ ...reply, updatedAt: now })
      .where(eq(annotationReplies.id, id))
      .returning();
    return results[0];
  }
  
  async deleteReply(id: number): Promise<boolean> {
    try {
      await db.update(annotationReplies)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(annotationReplies.id, id));
      return true;
    } catch (error: any) {
      console.error("Error deleting reply:", error);
      return false;
    }
  }
  
  async upvoteAnnotation(id: number): Promise<PolicyAnnotation | undefined> {
    const results = await db.update(policyAnnotations)
      .set({ upvotes: sql`${policyAnnotations.upvotes} + 1`, updatedAt: new Date() })
      .where(eq(policyAnnotations.id, id))
      .returning();
    return results[0];
  }
  
  async downvoteAnnotation(id: number): Promise<PolicyAnnotation | undefined> {
    const results = await db.update(policyAnnotations)
      .set({ downvotes: sql`${policyAnnotations.downvotes} + 1`, updatedAt: new Date() })
      .where(eq(policyAnnotations.id, id))
      .returning();
    return results[0];
  }
  
  async upvoteReply(id: number): Promise<AnnotationReply | undefined> {
    const results = await db.update(annotationReplies)
      .set({ upvotes: sql`${annotationReplies.upvotes} + 1`, updatedAt: new Date() })
      .where(eq(annotationReplies.id, id))
      .returning();
    return results[0];
  }
  
  async downvoteReply(id: number): Promise<AnnotationReply | undefined> {
    const results = await db.update(annotationReplies)
      .set({ downvotes: sql`${annotationReplies.downvotes} + 1`, updatedAt: new Date() })
      .where(eq(annotationReplies.id, id))
      .returning();
    return results[0];
  }
  
  async getAnnotationsWithUserDetails(billId: string): Promise<(PolicyAnnotation & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]> {
    return db.select({
      id: policyAnnotations.id,
      billId: policyAnnotations.billId,
      userId: policyAnnotations.userId,
      text: policyAnnotations.text,
      sectionReference: policyAnnotations.sectionReference,
      pageNumber: policyAnnotations.pageNumber,
      visibility: policyAnnotations.visibility,
      circleId: policyAnnotations.circleId,
      upvotes: policyAnnotations.upvotes,
      downvotes: policyAnnotations.downvotes,
      createdAt: policyAnnotations.createdAt,
      updatedAt: policyAnnotations.updatedAt,
      isActive: policyAnnotations.isActive,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl
      }
    })
    .from(policyAnnotations)
    .innerJoin(users, eq(policyAnnotations.userId, users.id))
    .where(and(
      eq(policyAnnotations.billId, billId),
      eq(policyAnnotations.isActive, true)
    ))
    .orderBy(policyAnnotations.createdAt);
  }
  
  async getRepliesWithUserDetails(annotationId: number): Promise<(AnnotationReply & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]> {
    return db.select({
      id: annotationReplies.id,
      annotationId: annotationReplies.annotationId,
      userId: annotationReplies.userId,
      text: annotationReplies.text,
      upvotes: annotationReplies.upvotes,
      downvotes: annotationReplies.downvotes,
      createdAt: annotationReplies.createdAt,
      updatedAt: annotationReplies.updatedAt,
      isActive: annotationReplies.isActive,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl
      }
    })
    .from(annotationReplies)
    .innerJoin(users, eq(annotationReplies.userId, users.id))
    .where(and(
      eq(annotationReplies.annotationId, annotationId),
      eq(annotationReplies.isActive, true)
    ))
    .orderBy(annotationReplies.createdAt);
  }
}

export const policyAnnotationStorage = new DatabasePolicyAnnotationStorage();