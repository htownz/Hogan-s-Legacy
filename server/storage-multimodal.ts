import { db } from "./db";
import { eq, and, desc, sql, like } from "drizzle-orm";
import {
  MultimodalSession,
  InsertMultimodalSession,
  multimodalSessions,
  MultimodalMessage,
  InsertMultimodalMessage,
  multimodalMessages,
  MultimodalAttachment,
  InsertMultimodalAttachment,
  multimodalAttachments,
  MultimodalSavedQuery,
  InsertMultimodalSavedQuery,
  multimodalSavedQueries
} from "@shared/schema-multimodal-assistant";

/**
 * Interface for Multimodal AI Assistant storage operations
 */
export interface IMultimodalStorage {
  // Session methods
  getSessionById(id: number): Promise<MultimodalSession | undefined>;
  getSessionsByUserId(userId: number): Promise<MultimodalSession[]>;
  createSession(session: InsertMultimodalSession): Promise<MultimodalSession>;
  updateSession(id: number, session: Partial<InsertMultimodalSession>): Promise<MultimodalSession | undefined>;
  deleteSession(id: number): Promise<boolean>;
  
  // Message methods
  getMessageById(id: number): Promise<MultimodalMessage | undefined>;
  getMessagesBySessionId(sessionId: number): Promise<MultimodalMessage[]>;
  createMessage(message: InsertMultimodalMessage): Promise<MultimodalMessage>;
  updateMessage(id: number, message: Partial<InsertMultimodalMessage>): Promise<MultimodalMessage | undefined>;
  
  // Attachment methods
  getAttachmentById(id: number): Promise<MultimodalAttachment | undefined>;
  getAttachmentsByMessageId(messageId: number): Promise<MultimodalAttachment[]>;
  createAttachment(attachment: InsertMultimodalAttachment): Promise<MultimodalAttachment>;
  updateAttachment(id: number, attachment: Partial<InsertMultimodalAttachment>): Promise<MultimodalAttachment | undefined>;
  
  // Saved query methods
  getSavedQueryById(id: number): Promise<MultimodalSavedQuery | undefined>;
  getSavedQueriesByUserId(userId: number): Promise<MultimodalSavedQuery[]>;
  createSavedQuery(query: InsertMultimodalSavedQuery): Promise<MultimodalSavedQuery>;
  updateSavedQuery(id: number, query: Partial<InsertMultimodalSavedQuery>): Promise<MultimodalSavedQuery | undefined>;
  deleteSavedQuery(id: number): Promise<boolean>;
  incrementSavedQueryUseCount(id: number): Promise<MultimodalSavedQuery | undefined>;
}

/**
 * Implementation of Multimodal AI Assistant storage operations using PostgreSQL
 */
class DatabaseMultimodalStorage implements IMultimodalStorage {
  // Session methods
  async getSessionById(id: number): Promise<MultimodalSession | undefined> {
    const [session] = await db
      .select()
      .from(multimodalSessions).$dynamic()
      .where(eq(multimodalSessions.id, id));
    
    return session;
  }

  async getSessionsByUserId(userId: number): Promise<MultimodalSession[]> {
    return db
      .select()
      .from(multimodalSessions).$dynamic()
      .where(eq(multimodalSessions.userId, userId))
      .orderBy(desc(multimodalSessions.updatedAt));
  }

  async createSession(session: InsertMultimodalSession): Promise<MultimodalSession> {
    const [newSession] = await db
      .insert(multimodalSessions)
      .values(session)
      .returning();
    
    return newSession;
  }

  async updateSession(id: number, session: Partial<InsertMultimodalSession>): Promise<MultimodalSession | undefined> {
    const [updatedSession] = await db
      .update(multimodalSessions)
      .set({
        ...session,
        updatedAt: new Date()
      })
      .where(eq(multimodalSessions.id, id))
      .returning();
    
    return updatedSession;
  }

  async deleteSession(id: number): Promise<boolean> {
    // First, delete all related messages and their attachments
    const messages = await this.getMessagesBySessionId(id);
    
    for (const message of messages) {
      await db
        .delete(multimodalAttachments)
        .where(eq(multimodalAttachments.messageId, message.id));
    }
    
    await db
      .delete(multimodalMessages)
      .where(eq(multimodalMessages.sessionId, id));
    
    // Then delete the session
    const result = await db
      .delete(multimodalSessions)
      .where(eq(multimodalSessions.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Message methods
  async getMessageById(id: number): Promise<MultimodalMessage | undefined> {
    const [message] = await db
      .select()
      .from(multimodalMessages).$dynamic()
      .where(eq(multimodalMessages.id, id));
    
    return message;
  }

  async getMessagesBySessionId(sessionId: number): Promise<MultimodalMessage[]> {
    return db
      .select()
      .from(multimodalMessages).$dynamic()
      .where(eq(multimodalMessages.sessionId, sessionId))
      .orderBy(multimodalMessages.createdAt);
  }

  async createMessage(message: InsertMultimodalMessage): Promise<MultimodalMessage> {
    const [newMessage] = await db
      .insert(multimodalMessages)
      .values(message)
      .returning();
    
    // Update the session's updatedAt timestamp
    await db
      .update(multimodalSessions)
      .set({ updatedAt: new Date() })
      .where(eq(multimodalSessions.id, newMessage.sessionId));
    
    return newMessage;
  }

  async updateMessage(id: number, message: Partial<InsertMultimodalMessage>): Promise<MultimodalMessage | undefined> {
    const [updatedMessage] = await db
      .update(multimodalMessages)
      .set(message)
      .where(eq(multimodalMessages.id, id))
      .returning();
    
    if (updatedMessage) {
      // Update the session's updatedAt timestamp
      await db
        .update(multimodalSessions)
        .set({ updatedAt: new Date() })
        .where(eq(multimodalSessions.id, updatedMessage.sessionId));
    }
    
    return updatedMessage;
  }
  
  // Attachment methods
  async getAttachmentById(id: number): Promise<MultimodalAttachment | undefined> {
    const [attachment] = await db
      .select()
      .from(multimodalAttachments).$dynamic()
      .where(eq(multimodalAttachments.id, id));
    
    return attachment;
  }

  async getAttachmentsByMessageId(messageId: number): Promise<MultimodalAttachment[]> {
    return db
      .select()
      .from(multimodalAttachments).$dynamic()
      .where(eq(multimodalAttachments.messageId, messageId));
  }

  async createAttachment(attachment: InsertMultimodalAttachment): Promise<MultimodalAttachment> {
    const [newAttachment] = await db
      .insert(multimodalAttachments)
      .values(attachment)
      .returning();
    
    // Update the related message to indicate it has an attachment
    await db
      .update(multimodalMessages)
      .set({ 
        hasAttachment: true,
        attachmentType: attachment.fileType.startsWith('image') ? 'image' : 'document'
      })
      .where(eq(multimodalMessages.id, newAttachment.messageId));
    
    return newAttachment;
  }

  async updateAttachment(id: number, attachment: Partial<InsertMultimodalAttachment>): Promise<MultimodalAttachment | undefined> {
    const [updatedAttachment] = await db
      .update(multimodalAttachments)
      .set(attachment)
      .where(eq(multimodalAttachments.id, id))
      .returning();
    
    return updatedAttachment;
  }
  
  // Saved query methods
  async getSavedQueryById(id: number): Promise<MultimodalSavedQuery | undefined> {
    const [query] = await db
      .select()
      .from(multimodalSavedQueries).$dynamic()
      .where(eq(multimodalSavedQueries.id, id));
    
    return query;
  }

  async getSavedQueriesByUserId(userId: number): Promise<MultimodalSavedQuery[]> {
    return db
      .select()
      .from(multimodalSavedQueries).$dynamic()
      .where(eq(multimodalSavedQueries.userId, userId))
      .orderBy(desc(multimodalSavedQueries.lastUsedAt));
  }

  async createSavedQuery(query: InsertMultimodalSavedQuery): Promise<MultimodalSavedQuery> {
    const [newQuery] = await db
      .insert(multimodalSavedQueries)
      .values({
        ...query,
        lastUsedAt: new Date()
      })
      .returning();
    
    return newQuery;
  }

  async updateSavedQuery(id: number, query: Partial<InsertMultimodalSavedQuery>): Promise<MultimodalSavedQuery | undefined> {
    const [updatedQuery] = await db
      .update(multimodalSavedQueries)
      .set(query)
      .where(eq(multimodalSavedQueries.id, id))
      .returning();
    
    return updatedQuery;
  }

  async deleteSavedQuery(id: number): Promise<boolean> {
    const result = await db
      .delete(multimodalSavedQueries)
      .where(eq(multimodalSavedQueries.id, id))
      .returning();
    
    return result.length > 0;
  }

  async incrementSavedQueryUseCount(id: number): Promise<MultimodalSavedQuery | undefined> {
    const [updatedQuery] = await db
      .update(multimodalSavedQueries)
      .set({ 
        useCount: sql`${multimodalSavedQueries.useCount} + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(multimodalSavedQueries.id, id))
      .returning();
    
    return updatedQuery;
  }
}

// Export a singleton instance of the storage implementation
export const multimodalStorage = new DatabaseMultimodalStorage();