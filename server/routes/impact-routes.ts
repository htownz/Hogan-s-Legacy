// @ts-nocheck
import { Express, Request, Response } from "express";
import { z } from "zod";
import { DatabaseImpactStorage } from "../storage-impact";
import { isAuthenticated } from "../auth";
import * as openAiService from "../services/openai-service";

// Define UserDemographics interface
interface UserDemographics {
  location?: string;
  occupation?: string;
  familySize?: number;
  age?: number;
  interests?: string[];
  concerns?: string[];
}
import { db } from "../db";
import { bills, personalImpactAssessments, insertPersonalImpactAssessmentSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Import CustomRequest from types file instead of redefining
import { CustomRequest } from "../types";

// Initialize impact storage
const impactStorage = new DatabaseImpactStorage();

// Schema for user demographics input
const userDemographicsSchema = z.object({
  location: z.string().optional(),
  occupation: z.string().optional(),
  familySize: z.number().optional(),
  age: z.number().optional(),
  interests: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
});

// Schema for personal impact generation request
const generatePersonalImpactSchema = z.object({
  billId: z.string(),
  userDemographics: userDemographicsSchema
});

// Schema for point of order analysis request
const pointOfOrderAnalysisSchema = z.object({
  billId: z.string(),
  includeRuleCitations: z.boolean().default(true),
  depth: z.enum(["basic", "detailed"]).default("detailed"),
});

export function registerImpactRoutes(app: Express) {
  // Get bill general impact summary
  app.get("/api/bills/:billId/impact-summary", async (req: Request, res: Response) => {
    try {
      const billId = req.params.billId;
      
      // Get bill details
      const [bill] = await db.select().from(bills).$dynamic().where(eq(bills.id, billId));
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // If the bill doesn't have an impact summary, generate one
      if (!bill.impactSummary) {
        const impactSummary = await openAiService.generateGeneralImpactSummary(bill);
        
        if (impactSummary) {
          // Update the bill with the new impact summary
          await impactStorage.updateBillImpactSummary(billId, impactSummary);
          
          // Return the newly generated summary
          return res.status(200).json({ impactSummary });
        } else {
          return res.status(500).json({ message: "Failed to generate impact summary" });
        }
      }
      
      // Return the existing impact summary
      return res.status(200).json({ impactSummary: bill.impactSummary });
    } catch (error: any) {
      console.error("Error fetching impact summary:", error);
      return res.status(500).json({ message: "Failed to fetch impact summary" });
    }
  });

  // Get personal impact assessment for a specific user and bill
  app.get("/api/personal-impact/:billId", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const billId = req.params.billId;
      const userId = req.user!.id;
      
      // Get bill details
      const [bill] = await db.select().from(bills).$dynamic().where(eq(bills.id, billId));
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Check if a personal impact assessment already exists
      const existingAssessment = await impactStorage.getPersonalImpactAssessment(userId, billId);
      
      if (existingAssessment) {
        return res.status(200).json(existingAssessment);
      }
      
      // No existing assessment, inform the client they need to generate one
      return res.status(404).json({ 
        message: "No personal impact assessment found for this bill",
        needsGeneration: true 
      });
    } catch (error: any) {
      console.error("Error fetching personal impact assessment:", error);
      return res.status(500).json({ message: "Failed to fetch personal impact assessment" });
    }
  });

  // Get all personal impact assessments for a user
  app.get("/api/personal-impacts", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const assessments = await impactStorage.getPersonalImpactAssessmentsByUser(userId);
      return res.status(200).json(assessments);
    } catch (error: any) {
      console.error("Error fetching personal impact assessments:", error);
      return res.status(500).json({ message: "Failed to fetch personal impact assessments" });
    }
  });

  // Generate a personal impact assessment
  app.post("/api/personal-impact/generate", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate request body
      const validationResult = generatePersonalImpactSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validationResult.error.errors });
      }
      
      const { billId, userDemographics } = validationResult.data;
      const userId = req.user!.id;
      
      // Get bill details
      const [bill] = await db.select().from(bills).$dynamic().where(eq(bills.id, billId));
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Check if a personal impact assessment already exists
      const existingAssessment = await impactStorage.getPersonalImpactAssessment(userId, billId);
      
      if (existingAssessment) {
        return res.status(200).json({
          message: "Personal impact assessment already exists", 
          assessment: existingAssessment
        });
      }
      
      // Generate a personal impact assessment
      const assessmentData = await openAiService.generatePersonalImpactAssessment(bill, userDemographics as UserDemographics);
      
      if (!assessmentData) {
        return res.status(500).json({ message: "Failed to generate personal impact assessment data" });
      }
      
      // Create a new assessment
      const newAssessment = await impactStorage.createPersonalImpactAssessment({
        userId,
        billId,
        personalImpact: assessmentData.personalImpact,
        userContext: assessmentData.userContext,
        relevanceScore: assessmentData.relevanceScore,
        sentiment: assessmentData.sentiment,
        impactAreas: assessmentData.impactAreas,
      });
      
      return res.status(201).json(newAssessment);
    } catch (error: any) {
      console.error("Error generating personal impact assessment:", error);
      return res.status(500).json({ message: "Failed to generate personal impact assessment" });
    }
  });

  // Update user demographics for a personal impact assessment
  app.put("/api/personal-impact/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = insertPersonalImpactAssessmentSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validationResult.error.errors });
      }
      
      // Get all user assessments and find the one with the matching ID
      const assessments = await impactStorage.getPersonalImpactAssessmentsByUser(userId);
      const existingAssessment = assessments.find(a => a.id === id);
      
      if (!existingAssessment) {
        return res.status(404).json({ message: "Personal impact assessment not found" });
      }
      
      // Ensure the user owns this assessment
      if (existingAssessment.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this assessment" });
      }
      
      // Update the assessment
      const updatedAssessment = await impactStorage.updatePersonalImpactAssessment(id, validationResult.data);
      
      return res.status(200).json(updatedAssessment);
    } catch (error: any) {
      console.error("Error updating personal impact assessment:", error);
      return res.status(500).json({ message: "Failed to update personal impact assessment" });
    }
  });

  // Delete a personal impact assessment
  app.delete("/api/personal-impact/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get all user assessments and find the one with the matching ID
      const assessments = await impactStorage.getPersonalImpactAssessmentsByUser(userId);
      const existingAssessment = assessments.find(a => a.id === id);
      
      if (!existingAssessment) {
        return res.status(404).json({ message: "Personal impact assessment not found" });
      }
      
      // Ensure the user owns this assessment
      if (existingAssessment.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this assessment" });
      }
      
      // Delete the assessment
      const success = await impactStorage.deletePersonalImpactAssessment(id);
      
      if (success) {
        return res.status(200).json({ message: "Personal impact assessment deleted successfully" });
      } else {
        return res.status(500).json({ message: "Failed to delete personal impact assessment" });
      }
    } catch (error: any) {
      console.error("Error deleting personal impact assessment:", error);
      return res.status(500).json({ message: "Failed to delete personal impact assessment" });
    }
  });

  // Analyze bill for potential points of order (procedural issues)
  app.post("/api/bills/:billId/point-of-order-analysis", async (req: Request, res: Response) => {
    try {
      const billId = req.params.billId;
      
      // Validate request body
      const validationResult = pointOfOrderAnalysisSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validationResult.error.errors });
      }
      
      const { includeRuleCitations, depth } = validationResult.data;
      
      // Get bill details
      const [bill] = await db.select().from(bills).$dynamic().where(eq(bills.id, billId));
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Call OpenAI service for point of order analysis
      const analysis = await openAiService.analyzeBillForPointsOfOrder(bill, {
        includeRuleCitations,
        depth
      });
      
      if (!analysis) {
        return res.status(500).json({ message: "Failed to generate point of order analysis" });
      }
      
      return res.status(200).json(analysis);
    } catch (error: any) {
      console.error("Error analyzing bill for points of order:", error);
      return res.status(500).json({ message: "Failed to analyze bill for points of order" });
    }
  });
}