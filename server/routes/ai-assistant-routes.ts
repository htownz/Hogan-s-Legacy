// @ts-nocheck
import { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { CustomRequest } from "../types";
import { aiAssistantStorage } from "../storage-ai-assistant";
import { superUserStorage } from "../storage-super-user";
import * as openAiService from "../services/openai-service";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { 
  insertAiAssistantSchema,
  insertAiAssistantConversationSchema,
  insertAiAssistantMessageSchema
} from "@shared/schema";

// Schemas for request validation
const roleSchema = z.object({
  role: z.enum(["catalyst", "amplifier", "convincer"])
});

const messageSchema = z.object({
  content: z.string().min(1).max(2000)
});

const createConversationSchema = z.object({
  title: z.string().min(1).max(100),
  assistantId: z.number().int().positive()
});

/**
 * Register AI assistant routes
 */
export function registerAiAssistantRoutes(app: Express) {
  // Get all assistants for a user
  app.get("/api/assistants", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const assistants = await aiAssistantStorage.getAiAssistantsByUserId(userId);
      
      if (assistants.length === 0) {
        // Create default assistants for each role
        const defaultRoles = ['catalyst', 'amplifier', 'convincer'];
        const createdAssistants = [];
        
        for (const roleName of defaultRoles) {
          const assistant = await aiAssistantStorage.createAiAssistant({
            userId,
            role: roleName,
            settings: {}
          });
          createdAssistants.push(assistant);
        }
        
        return res.status(200).json(createdAssistants);
      }
      
      return res.status(200).json(assistants);
    } catch (error: any) {
      console.error("Error fetching assistants:", error);
      return res.status(500).json({ message: "Failed to fetch assistants" });
    }
  });
  
  // Get a specific assistant by role
  app.get("/api/assistants/:role", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const roleName = req.params.role;
      
      // Validate role parameter
      const validationResult = roleSchema.safeParse({ role: roleName });
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role parameter", errors: validationResult.error.errors });
      }
      
      // Get the assistant, create if it doesn't exist
      let assistant = await aiAssistantStorage.getAiAssistantByUserIdAndRole(userId, roleName);
      
      if (!assistant) {
        assistant = await aiAssistantStorage.createAiAssistant({
          userId,
          role: roleName,
          settings: {}
        });
      }
      
      return res.status(200).json(assistant);
    } catch (error: any) {
      console.error("Error fetching assistant:", error);
      return res.status(500).json({ message: "Failed to fetch assistant" });
    }
  });
  
  // Get conversations for an assistant
  app.get("/api/assistants/:id/conversations", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const assistantId = parseInt(req.params.id, 10);
      
      if (isNaN(assistantId)) {
        return res.status(400).json({ message: "Invalid assistant ID" });
      }
      
      // Verify that the assistant belongs to the user
      const assistant = await aiAssistantStorage.getAiAssistantById(assistantId);
      
      if (!assistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }
      
      if (assistant.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this assistant" });
      }
      
      // Get the conversations
      const conversations = await aiAssistantStorage.getConversationsByAssistantId(assistantId);
      
      return res.status(200).json(conversations);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      return res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  
  // Create a new conversation
  app.post("/api/conversations", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = createConversationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid conversation data", errors: validationResult.error.errors });
      }
      
      // Verify that the assistant belongs to the user
      const assistant = await aiAssistantStorage.getAiAssistantById(validationResult.data.assistantId);
      
      if (!assistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }
      
      if (assistant.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this assistant" });
      }
      
      // Create the conversation
      const conversation = await aiAssistantStorage.createConversation({
        assistantId: validationResult.data.assistantId,
        title: validationResult.data.title,
        isActive: true
      });
      
      return res.status(201).json(conversation);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      return res.status(500).json({ message: "Failed to create conversation" });
    }
  });
  
  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const conversationId = parseInt(req.params.id, 10);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Verify that the conversation belongs to the user
      const conversation = await aiAssistantStorage.getConversationById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const assistant = await aiAssistantStorage.getAiAssistantById(conversation.assistantId);
      
      if (!assistant || assistant.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }
      
      // Get the messages
      const messages = await aiAssistantStorage.getMessagesByConversationId(conversationId);
      
      return res.status(200).json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  // Send a message to an assistant
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const conversationId = parseInt(req.params.id, 10);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Validate request body
      const validationResult = messageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid message data", errors: validationResult.error.errors });
      }
      
      // Verify that the conversation belongs to the user
      const conversation = await aiAssistantStorage.getConversationById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const assistant = await aiAssistantStorage.getAiAssistantById(conversation.assistantId);
      
      if (!assistant || assistant.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }
      
      // Save the user message
      const userMessage = await aiAssistantStorage.createMessage({
        conversationId,
        content: validationResult.data.content,
        role: "user",
        metadata: {}
      });
      
      // Get the user's super user role
      const superUserRole = await superUserStorage.getSuperUserRoleByUserId(userId, assistant.role);
      
      if (!superUserRole) {
        return res.status(404).json({ message: "Super user role not found" });
      }
      
      // Get conversation history
      const messages = await aiAssistantStorage.getMessagesByConversationId(conversationId);
      
      // Format message history for the OpenAI API
      const messageHistory = messages.map(message => ({
        role: message.role,
        content: message.content
      }));
      
      // Generate assistant response
      const assistantResponse = await openAiService.generateRoleAssistantResponse(
        assistant.role,
        superUserRole,
        messageHistory,
        validationResult.data.content
      );
      
      // Save the assistant response
      const aiMessage = await aiAssistantStorage.createMessage({
        conversationId,
        content: assistantResponse,
        role: "assistant",
        metadata: {}
      });
      
      // Return both messages
      return res.status(201).json({
        userMessage,
        assistantMessage: aiMessage
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Get skill assessment for a role
  app.get("/api/assistants/:role/assessment", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const roleName = req.params.role;
      
      // Validate role parameter
      const validationResult = roleSchema.safeParse({ role: roleName });
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role parameter", errors: validationResult.error.errors });
      }
      
      // Get the super user role
      const superUserRole = await superUserStorage.getSuperUserRoleByUserId(userId, roleName);
      
      if (!superUserRole) {
        return res.status(404).json({ message: "Super user role not found" });
      }
      
      // Get user activities for this role
      const activities = await superUserStorage.getUserActivitiesByUserIdAndRole(userId, roleName);
      
      // Generate skill assessment
      const userInfo = {
        userId,
        role: roleName,
        level: superUserRole.level,
        progressToNextLevel: superUserRole.progressToNextLevel
      };
      
      const assessment = await openAiService.generateRoleSkillAssessment(
        roleName,
        activities,
        userInfo
      );
      
      return res.status(200).json(assessment);
    } catch (error: any) {
      console.error("Error generating skill assessment:", error);
      return res.status(500).json({ message: "Failed to generate skill assessment" });
    }
  });
  
  // Get training plan for a role
  app.get("/api/assistants/:role/training-plan", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const roleName = req.params.role;
      
      // Validate role parameter
      const validationResult = roleSchema.safeParse({ role: roleName });
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role parameter", errors: validationResult.error.errors });
      }
      
      // Get the super user role
      const superUserRole = await superUserStorage.getSuperUserRoleByUserId(userId, roleName);
      
      if (!superUserRole) {
        return res.status(404).json({ message: "Super user role not found" });
      }
      
      // First get the assessment
      const activities = await superUserStorage.getUserActivitiesByUserIdAndRole(userId, roleName);
      
      const userInfo = {
        userId,
        role: roleName,
        level: superUserRole.level,
        progressToNextLevel: superUserRole.progressToNextLevel
      };
      
      const assessment = await openAiService.generateRoleSkillAssessment(
        roleName,
        activities,
        userInfo
      );
      
      // Generate training plan based on assessment
      const trainingPlan = await openAiService.generateRoleTrainingPlan(
        roleName,
        superUserRole,
        assessment
      );
      
      return res.status(200).json(trainingPlan);
    } catch (error: any) {
      console.error("Error generating training plan:", error);
      return res.status(500).json({ message: "Failed to generate training plan" });
    }
  });
  
  // Update assistant settings
  app.patch("/api/assistants/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const assistantId = parseInt(req.params.id, 10);
      
      if (isNaN(assistantId)) {
        return res.status(400).json({ message: "Invalid assistant ID" });
      }
      
      // Verify ownership
      const assistant = await aiAssistantStorage.getAiAssistantById(assistantId);
      
      if (!assistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }
      
      if (assistant.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this assistant" });
      }
      
      // Update settings
      const updatedAssistant = await aiAssistantStorage.updateAiAssistant(assistantId, {
        settings: req.body.settings || {}
      });
      
      return res.status(200).json(updatedAssistant);
    } catch (error: any) {
      console.error("Error updating assistant settings:", error);
      return res.status(500).json({ message: "Failed to update assistant settings" });
    }
  });
  
  // Delete a conversation
  app.delete("/api/conversations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const conversationId = parseInt(req.params.id, 10);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Verify ownership
      const conversation = await aiAssistantStorage.getConversationById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const assistant = await aiAssistantStorage.getAiAssistantById(conversation.assistantId);
      
      if (!assistant || assistant.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this conversation" });
      }
      
      // Delete the conversation
      const success = await aiAssistantStorage.deleteConversation(conversationId);
      
      if (success) {
        return res.status(200).json({ message: "Conversation deleted successfully" });
      } else {
        return res.status(500).json({ message: "Failed to delete conversation" });
      }
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      return res.status(500).json({ message: "Failed to delete conversation" });
    }
  });
}