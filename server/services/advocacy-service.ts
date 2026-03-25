// @ts-nocheck
import { dynamoService } from "../aws/dynamoService";

// Table names in DynamoDB
const ADVOCACY_MESSAGES_TABLE = "act_up_advocacy_messages";

export interface AdvocacyMessage {
  id: string;
  userId: number;
  representativeId: string;
  subject: string;
  message: string;
  status: "sent" | "delivered" | "read" | "responded" | "failed";
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  respondedAt?: string;
  response?: string;
  channelType: "email" | "social" | "phone" | "letter";
}

export class AdvocacyService {
  /**
   * Submit a new advocacy message
   */
  async submitMessage(messageData: Omit<AdvocacyMessage, "id" | "createdAt" | "status">): Promise<AdvocacyMessage> {
    const newMessage: AdvocacyMessage = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    
    try {
      await dynamoService.putItem(ADVOCACY_MESSAGES_TABLE, newMessage);
      return newMessage;
    } catch (error: any) {
      console.error("Error submitting advocacy message:", error);
      throw new Error("Failed to submit advocacy message");
    }
  }

  /**
   * Get an advocacy message by ID
   */
  async getMessage(messageId: string): Promise<AdvocacyMessage | null> {
    try {
      return await dynamoService.getItem<AdvocacyMessage>(ADVOCACY_MESSAGES_TABLE, { id: messageId });
    } catch (error: any) {
      console.error(`Error getting advocacy message ${messageId}:`, error);
      throw new Error("Failed to get advocacy message");
    }
  }

  /**
   * Update an advocacy message status
   */
  async updateMessageStatus(
    messageId: string, 
    status: AdvocacyMessage["status"], 
    additionalData?: Partial<AdvocacyMessage>
  ): Promise<AdvocacyMessage | null> {
    try {
      const message = await this.getMessage(messageId);
      
      if (!message) {
        return null;
      }
      
      const now = new Date().toISOString();
      
      const updates: Partial<AdvocacyMessage> = {
        status,
        ...additionalData,
      };
      
      // Set timestamp based on status
      if (status === "delivered" && !message.deliveredAt) {
        updates.deliveredAt = now;
      } else if (status === "read" && !message.readAt) {
        updates.readAt = now;
      } else if (status === "responded" && !message.respondedAt) {
        updates.respondedAt = now;
      }
      
      const updatedMessage: AdvocacyMessage = {
        ...message,
        ...updates,
      };
      
      await dynamoService.putItem(ADVOCACY_MESSAGES_TABLE, updatedMessage);
      return updatedMessage;
    } catch (error: any) {
      console.error(`Error updating advocacy message ${messageId}:`, error);
      throw new Error("Failed to update advocacy message");
    }
  }

  /**
   * Get all advocacy messages for a user
   */
  async getUserMessages(userId: number): Promise<AdvocacyMessage[]> {
    try {
      return await dynamoService.queryItems<AdvocacyMessage>(
        ADVOCACY_MESSAGES_TABLE,
        "userId = :userId",
        { ":userId": userId }
      );
    } catch (error: any) {
      console.error(`Error getting advocacy messages for user ${userId}:`, error);
      throw new Error("Failed to get user advocacy messages");
    }
  }

  /**
   * Get all advocacy messages for a representative
   */
  async getRepresentativeMessages(representativeId: string): Promise<AdvocacyMessage[]> {
    try {
      return await dynamoService.queryItems<AdvocacyMessage>(
        ADVOCACY_MESSAGES_TABLE,
        "representativeId = :representativeId",
        { ":representativeId": representativeId }
      );
    } catch (error: any) {
      console.error(`Error getting advocacy messages for representative ${representativeId}:`, error);
      throw new Error("Failed to get representative advocacy messages");
    }
  }
}

export const advocacyService = new AdvocacyService();