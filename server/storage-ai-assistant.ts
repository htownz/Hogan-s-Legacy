import { db } from "./db";
import { eq, and, desc, sql, like } from "drizzle-orm";
import {
  AiAssistant,
  InsertAiAssistant,
  aiAssistants,
  AiAssistantConversation,
  InsertAiAssistantConversation,
  aiAssistantConversations,
  AiAssistantMessage,
  InsertAiAssistantMessage,
  aiAssistantMessages
} from "@shared/schema";

/**
 * Interface for AI Assistant storage operations
 */
export interface IAiAssistantStorage {
  // AI Assistant methods
  getAiAssistantById(id: number): Promise<AiAssistant | undefined>;
  getAiAssistantsByUserId(userId: number): Promise<AiAssistant[]>;
  getAiAssistantByUserIdAndRole(userId: number, role: string): Promise<AiAssistant | undefined>;
  createAiAssistant(assistant: InsertAiAssistant): Promise<AiAssistant>;
  updateAiAssistant(id: number, assistant: Partial<InsertAiAssistant>): Promise<AiAssistant | undefined>;
  
  // Conversation methods
  getConversationById(id: number): Promise<AiAssistantConversation | undefined>;
  getConversationsByAssistantId(assistantId: number): Promise<AiAssistantConversation[]>;
  createConversation(conversation: InsertAiAssistantConversation): Promise<AiAssistantConversation>;
  updateConversation(id: number, conversation: Partial<InsertAiAssistantConversation>): Promise<AiAssistantConversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Message methods
  getMessageById(id: number): Promise<AiAssistantMessage | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<AiAssistantMessage[]>;
  createMessage(message: InsertAiAssistantMessage): Promise<AiAssistantMessage>;
}

/**
 * Implementation of AI Assistant storage operations
 */
export class DatabaseAiAssistantStorage implements IAiAssistantStorage {
  // AI Assistant methods
  async getAiAssistantById(id: number): Promise<AiAssistant | undefined> {
    const [assistant] = await db
      .select()
      .from(aiAssistants).$dynamic()
      .where(eq(aiAssistants.id, id));
    
    return assistant;
  }

  async getAiAssistantsByUserId(userId: number): Promise<AiAssistant[]> {
    return db
      .select()
      .from(aiAssistants).$dynamic()
      .where(eq(aiAssistants.userId, userId));
  }

  async getAiAssistantByUserIdAndRole(userId: number, role: string): Promise<AiAssistant | undefined> {
    const [assistant] = await db
      .select()
      .from(aiAssistants).$dynamic()
      .where(and(
        eq(aiAssistants.userId, userId),
        eq(aiAssistants.role, role)
      ));
    
    return assistant;
  }

  async createAiAssistant(assistant: InsertAiAssistant): Promise<AiAssistant> {
    const [newAssistant] = await db
      .insert(aiAssistants)
      .values(assistant)
      .returning();
    
    return newAssistant;
  }

  async updateAiAssistant(id: number, assistant: Partial<InsertAiAssistant>): Promise<AiAssistant | undefined> {
    const [updatedAssistant] = await db
      .update(aiAssistants)
      .set({
        ...assistant,
        lastConversationAt: new Date()
      })
      .where(eq(aiAssistants.id, id))
      .returning();
    
    return updatedAssistant;
  }
  
  // Conversation methods
  async getConversationById(id: number): Promise<AiAssistantConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiAssistantConversations).$dynamic()
      .where(eq(aiAssistantConversations.id, id));
    
    return conversation;
  }

  async getConversationsByAssistantId(assistantId: number): Promise<AiAssistantConversation[]> {
    return db
      .select()
      .from(aiAssistantConversations).$dynamic()
      .where(eq(aiAssistantConversations.assistantId, assistantId))
      .orderBy(desc(aiAssistantConversations.updatedAt));
  }

  async createConversation(conversation: InsertAiAssistantConversation): Promise<AiAssistantConversation> {
    const [newConversation] = await db
      .insert(aiAssistantConversations)
      .values(conversation)
      .returning();
    
    return newConversation;
  }

  async updateConversation(id: number, conversation: Partial<InsertAiAssistantConversation>): Promise<AiAssistantConversation | undefined> {
    const [updatedConversation] = await db
      .update(aiAssistantConversations)
      .set({
        ...conversation,
        updatedAt: new Date()
      })
      .where(eq(aiAssistantConversations.id, id))
      .returning();
    
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    // First, delete all messages in this conversation
    await db
      .delete(aiAssistantMessages)
      .where(eq(aiAssistantMessages.conversationId, id));
    
    // Then delete the conversation
    const result = await db
      .delete(aiAssistantConversations)
      .where(eq(aiAssistantConversations.id, id))
      .returning({ id: aiAssistantConversations.id });
    
    return result.length > 0;
  }
  
  // Message methods
  async getMessageById(id: number): Promise<AiAssistantMessage | undefined> {
    const [message] = await db
      .select()
      .from(aiAssistantMessages).$dynamic()
      .where(eq(aiAssistantMessages.id, id));
    
    return message;
  }

  async getMessagesByConversationId(conversationId: number): Promise<AiAssistantMessage[]> {
    return db
      .select()
      .from(aiAssistantMessages).$dynamic()
      .where(eq(aiAssistantMessages.conversationId, conversationId))
      .orderBy(aiAssistantMessages.createdAt);
  }

  async createMessage(message: InsertAiAssistantMessage): Promise<AiAssistantMessage> {
    const [newMessage] = await db
      .insert(aiAssistantMessages)
      .values(message)
      .returning();
    
    // Update the conversation's updatedAt timestamp
    await db
      .update(aiAssistantConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiAssistantConversations.id, newMessage.conversationId));
    
    // Also update the assistant's lastConversationAt timestamp and increment the conversationCount
    const [conversation] = await db
      .select()
      .from(aiAssistantConversations).$dynamic()
      .where(eq(aiAssistantConversations.id, newMessage.conversationId));
    
    if (conversation) {
      await db
        .update(aiAssistants)
        .set({
          lastConversationAt: new Date(),
          conversationCount: sql`${aiAssistants.conversationCount} + 1`
        })
        .where(eq(aiAssistants.id, conversation.assistantId));
    }
    
    return newMessage;
  }
}

export const aiAssistantStorage = new DatabaseAiAssistantStorage();