// @ts-nocheck
import { db } from "./db";
import { eq, desc, and, or, like, ilike, count, sql } from "drizzle-orm";
import {
  tecFileUploads,
  tecModerationQueue,
  type TecFileUpload,
  type InsertTecFileUpload,
  type TecModerationQueue,
  type InsertTecModerationQueue
} from "@shared/schema-tec-uploads";
import { politicalEntities, financialTransactions, entityRelationships } from "@shared/schema-campaign-finance";

/**
 * Interface for TEC file upload storage operations
 */
export interface ITecUploadStorage {
  // TEC File Upload operations
  createFileUpload(data: InsertTecFileUpload): Promise<TecFileUpload>;
  getFileUploadById(id: string): Promise<TecFileUpload | undefined>;
  getFileUploadsByUserId(userId: number): Promise<TecFileUpload[]>;
  getAllFileUploads(limit?: number, offset?: number): Promise<TecFileUpload[]>;
  updateFileUploadStatus(id: string, status: string, errorMessage?: string): Promise<TecFileUpload>;
  updateFileUploadProcessingStats(
    id: string, 
    stats: { 
      recordsTotal?: number; 
      recordsProcessed?: number; 
      entitiesFound?: number; 
      transactionsFound?: number; 
      relationshipsFound?: number; 
      moderationQueueItems?: number; 
    }
  ): Promise<TecFileUpload>;

  // TEC Moderation Queue operations
  createModerationQueueItem(data: InsertTecModerationQueue): Promise<TecModerationQueue>;
  getModerationQueueItemById(id: string): Promise<TecModerationQueue | undefined>;
  getModerationQueueByFileUploadId(fileUploadId: string, limit?: number, offset?: number): Promise<TecModerationQueue[]>;
  getPendingModerationItems(limit?: number, offset?: number): Promise<TecModerationQueue[]>;
  updateModerationQueueItem(id: string, data: Partial<InsertTecModerationQueue>): Promise<TecModerationQueue>;
  approveModerationQueueItem(id: string, reviewedBy: number, entityId: string, reviewNotes?: string): Promise<TecModerationQueue>;
  rejectModerationQueueItem(id: string, reviewedBy: number, reviewNotes?: string): Promise<TecModerationQueue>;
  
  // Count methods
  countFileUploads(userId?: number): Promise<number>;
  countPendingModeration(): Promise<number>;
}

/**
 * Database implementation for TEC file upload storage
 */
export class DatabaseTecUploadStorage implements ITecUploadStorage {
  async createFileUpload(data: InsertTecFileUpload): Promise<TecFileUpload> {
    const [result] = await db
      .insert(tecFileUploads)
      .values(data)
      .returning();
    return result;
  }

  async getFileUploadById(id: string): Promise<TecFileUpload | undefined> {
    const [result] = await db
      .select()
      .from(tecFileUploads).$dynamic()
      .where(eq(tecFileUploads.id, id));
    return result;
  }

  async getFileUploadsByUserId(userId: number): Promise<TecFileUpload[]> {
    return await db
      .select()
      .from(tecFileUploads).$dynamic()
      .where(eq(tecFileUploads.userId, userId))
      .orderBy(desc(tecFileUploads.uploadedAt));
  }

  async getAllFileUploads(limit = 20, offset = 0): Promise<TecFileUpload[]> {
    return await db
      .select()
      .from(tecFileUploads)
      .orderBy(desc(tecFileUploads.uploadedAt))
      .limit(limit)
      .offset(offset);
  }

  async updateFileUploadStatus(id: string, status: string, errorMessage?: string): Promise<TecFileUpload> {
    const data: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'processing') {
      data.processingStartedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      data.processingCompletedAt = new Date();
    }
    
    if (errorMessage) {
      data.errorMessage = errorMessage;
    }
    
    const [result] = await db
      .update(tecFileUploads)
      .set(data)
      .where(eq(tecFileUploads.id, id))
      .returning();
    
    return result;
  }

  async updateFileUploadProcessingStats(
    id: string, 
    stats: { 
      recordsTotal?: number; 
      recordsProcessed?: number; 
      entitiesFound?: number; 
      transactionsFound?: number; 
      relationshipsFound?: number; 
      moderationQueueItems?: number; 
    }
  ): Promise<TecFileUpload> {
    const [result] = await db
      .update(tecFileUploads)
      .set({
        ...stats,
        updatedAt: new Date()
      })
      .where(eq(tecFileUploads.id, id))
      .returning();
    
    return result;
  }

  async createModerationQueueItem(data: InsertTecModerationQueue): Promise<TecModerationQueue> {
    const [result] = await db
      .insert(tecModerationQueue)
      .values(data)
      .returning();
    return result;
  }

  async getModerationQueueItemById(id: string): Promise<TecModerationQueue | undefined> {
    const [result] = await db
      .select()
      .from(tecModerationQueue).$dynamic()
      .where(eq(tecModerationQueue.id, id));
    return result;
  }

  async getModerationQueueByFileUploadId(fileUploadId: string, limit = 20, offset = 0): Promise<TecModerationQueue[]> {
    return await db
      .select()
      .from(tecModerationQueue).$dynamic()
      .where(eq(tecModerationQueue.fileUploadId, fileUploadId))
      .orderBy(desc(tecModerationQueue.significanceScore))
      .limit(limit)
      .offset(offset);
  }

  async getPendingModerationItems(limit = 20, offset = 0): Promise<TecModerationQueue[]> {
    return await db
      .select()
      .from(tecModerationQueue).$dynamic()
      .where(eq(tecModerationQueue.status, 'pending_review'))
      .orderBy(desc(tecModerationQueue.significanceScore))
      .limit(limit)
      .offset(offset);
  }

  async updateModerationQueueItem(id: string, data: Partial<InsertTecModerationQueue>): Promise<TecModerationQueue> {
    const [result] = await db
      .update(tecModerationQueue)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tecModerationQueue.id, id))
      .returning();
    
    return result;
  }

  async approveModerationQueueItem(id: string, reviewedBy: number, entityId: string, reviewNotes?: string): Promise<TecModerationQueue> {
    const [result] = await db
      .update(tecModerationQueue)
      .set({
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        entityId,
        updatedAt: new Date()
      })
      .where(eq(tecModerationQueue.id, id))
      .returning();
    
    return result;
  }

  async rejectModerationQueueItem(id: string, reviewedBy: number, reviewNotes?: string): Promise<TecModerationQueue> {
    const [result] = await db
      .update(tecModerationQueue)
      .set({
        status: 'rejected',
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date()
      })
      .where(eq(tecModerationQueue.id, id))
      .returning();
    
    return result;
  }

  async countFileUploads(userId?: number): Promise<number> {
    const query = db
      .select({ count: count() })
      .from(tecFileUploads);
      
    if (userId) {
      query.where(eq(tecFileUploads.userId, userId));
    }
    
    const [result] = await query;
    return result?.count || 0;
  }

  async countPendingModeration(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(tecModerationQueue).$dynamic()
      .where(eq(tecModerationQueue.status, 'pending_review'));
    
    return result?.count || 0;
  }
}

export const tecUploadStorage = new DatabaseTecUploadStorage();