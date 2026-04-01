import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { z } from "zod";
import { learningStorage } from "./storage-learning";
import learningService from "./services/learning-service";
import { storage } from "./storage";
import { db } from "./db";
import { insertContextualLearningContentSchema, insertCivicConceptSchema } from "@shared/schema-learning";
import { createLogger } from "./logger";
const log = createLogger("routes-learning");


/**
 * Register learning module API routes
 */
export function registerLearningRoutes(app: Express): void {
  /**
   * Get all learning modules
   */
  app.get("/api/learning/modules", async (req: Request, res: Response) => {
    try {
      const topics = req.query.topics ? (req.query.topics as string).split(",") : undefined;
      const difficulty = req.query.difficulty as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const isPublished = req.query.published === "true" ? true : undefined;
      
      const modules = await learningStorage.getLearningModules({
        topics,
        difficulty,
        limit,
        offset,
        isPublished
      });
      
      res.status(200).json(modules);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching learning modules");
      res.status(500).json({ message: "Failed to fetch learning modules" });
    }
  });
  
  /**
   * Get a specific learning module
   */
  app.get("/api/learning/modules/:id", async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id, 10);
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const module = await learningStorage.getLearningModuleById(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Learning module not found" });
      }
      
      // Get sections for this module
      const sections = await learningStorage.getLearningModuleSectionsByModuleId(moduleId);
      
      // Get quizzes for this module
      const quizzes = await learningStorage.getLearningQuizzesByModuleId(moduleId);
      
      res.status(200).json({
        module,
        sections,
        quizzes
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching learning module");
      res.status(500).json({ message: "Failed to fetch learning module" });
    }
  });
  
  /**
   * Create a new learning module (admin only in the future)
   */
  app.post("/api/learning/modules", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const moduleData = {
        ...req.body,
        createdBy: userId
      };
      
      const module = await learningStorage.createLearningModule(moduleData);
      res.status(201).json(module);
    } catch (error: any) {
      log.error({ err: error }, "Error creating learning module");
      res.status(500).json({ message: "Failed to create learning module" });
    }
  });
  
  /**
   * Generate learning module objectives
   */
  app.post("/api/learning/generate-objectives", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { topic, difficultyLevel } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      const objectives = await learningService.generateLearningObjectives(
        topic,
        difficultyLevel || "intermediate"
      );
      
      res.status(200).json(objectives);
    } catch (error: any) {
      log.error({ err: error }, "Error generating learning objectives");
      res.status(500).json({ message: "Failed to generate learning objectives" });
    }
  });
  
  /**
   * Get user's learning progress
   */
  app.get("/api/learning/progress", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const progress = await learningStorage.getUserLearningProgressByUserId(userId);
      
      res.status(200).json(progress);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching learning progress");
      res.status(500).json({ message: "Failed to fetch learning progress" });
    }
  });
  
  /**
   * Update user's learning progress for a module
   */
  app.post("/api/learning/progress/:moduleId", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const moduleId = parseInt(req.params.moduleId, 10);
      
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      // Check if user already has progress for this module
      let progress = await learningStorage.getUserLearningProgressByUserIdAndModuleId(userId, moduleId);
      
      if (progress) {
        // Update existing progress
        progress = await learningStorage.updateUserLearningProgress(progress.id, {
          ...req.body,
          updatedAt: new Date()
        });
      } else {
        // Create new progress
        progress = await learningStorage.createUserLearningProgress({
          userId,
          moduleId,
          ...req.body
        });
      }
      
      res.status(200).json(progress);
    } catch (error: any) {
      log.error({ err: error }, "Error updating learning progress");
      res.status(500).json({ message: "Failed to update learning progress" });
    }
  });
  
  /**
   * Generate contextual learning content for a specific query
   */
  app.post("/api/learning/contextual", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { query, billId, userContext } = req.body;
      
      // Validate request
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Generate content
      const content = await learningService.generateContextualLearningContent({
        query,
        userId,
        billId,
        userContext
      });
      
      // Store the generated content
      const validatedData = insertContextualLearningContentSchema.parse({
        userId,
        billId,
        query,
        content: content.content,
        topics: content.topics,
        metadata: {
          relatedConcepts: content.relatedConcepts,
          learningObjectives: content.learningObjectives,
          suggestedResources: content.suggestedResources,
          furtherQuestions: content.furtherQuestions
        }
      });
      
      const savedContent = await learningStorage.createContextualLearningContent(validatedData);
      
      res.status(200).json({
        ...savedContent,
        relatedConcepts: content.relatedConcepts,
        learningObjectives: content.learningObjectives,
        suggestedResources: content.suggestedResources,
        furtherQuestions: content.furtherQuestions
      });
    } catch (error: any) {
      log.error({ err: error }, "Error generating contextual learning content");
      res.status(500).json({ message: "Failed to generate learning content" });
    }
  });
  
  /**
   * Get user's contextual learning history
   */
  app.get("/api/learning/contextual/history", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      const history = await learningStorage.getContextualLearningContentByUserId(userId, limit);
      
      res.status(200).json(history);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching contextual learning history");
      res.status(500).json({ message: "Failed to fetch learning history" });
    }
  });
  
  /**
   * Search civic concepts
   */
  app.get("/api/learning/concepts", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const complexityLevel = req.query.complexityLevel as string | undefined;
      const searchTerm = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      
      const concepts = await learningStorage.getCivicConcepts({
        category,
        complexityLevel,
        searchTerm,
        limit,
        offset
      });
      
      res.status(200).json(concepts);
    } catch (error: any) {
      log.error({ err: error }, "Error searching civic concepts");
      res.status(500).json({ message: "Failed to search civic concepts" });
    }
  });
  
  /**
   * Get specific civic concept
   */
  app.get("/api/learning/concepts/:id", async (req: Request, res: Response) => {
    try {
      const conceptId = parseInt(req.params.id, 10);
      
      if (isNaN(conceptId)) {
        // Try to find by term if not a number
        const concept = await learningStorage.getCivicConceptByTerm(req.params.id);
        if (!concept) {
          return res.status(404).json({ message: "Civic concept not found" });
        }
        return res.status(200).json(concept);
      }
      
      const concept = await learningStorage.getCivicConceptById(conceptId);
      if (!concept) {
        return res.status(404).json({ message: "Civic concept not found" });
      }
      
      res.status(200).json(concept);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching civic concept");
      res.status(500).json({ message: "Failed to fetch civic concept" });
    }
  });
  
  /**
   * Generate civic concept definition
   */
  app.post("/api/learning/concepts/generate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { term, category, complexityLevel } = req.body;
      
      if (!term) {
        return res.status(400).json({ message: "Term is required" });
      }
      
      // Check if the concept already exists
      const existingConcept = await learningStorage.getCivicConceptByTerm(term);
      if (existingConcept) {
        return res.status(200).json(existingConcept);
      }
      
      // Generate concept definition
      const conceptData = await learningService.generateCivicConceptDefinition({
        term,
        category,
        complexityLevel
      });
      
      // Store the generated concept
      const validatedData = insertCivicConceptSchema.parse({
        term: conceptData.term,
        definition: conceptData.definition,
        category: conceptData.category,
        complexityLevel: conceptData.complexityLevel,
        examples: conceptData.examples,
        relatedTerms: conceptData.relatedTerms
      });
      
      const savedConcept = await learningStorage.createCivicConcept(validatedData);
      
      res.status(201).json(savedConcept);
    } catch (error: any) {
      log.error({ err: error }, "Error generating civic concept");
      res.status(500).json({ message: "Failed to generate civic concept" });
    }
  });
  
  /**
   * Generate quiz questions
   */
  app.post("/api/learning/quizzes/generate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { topic, difficultyLevel, numberOfQuestions, concepts, learningObjectives } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      const quizData = await learningService.generateQuizQuestions({
        topic,
        difficultyLevel: difficultyLevel || "intermediate",
        numberOfQuestions: numberOfQuestions || 5,
        concepts,
        learningObjectives
      });
      
      res.status(200).json(quizData);
    } catch (error: any) {
      log.error({ err: error }, "Error generating quiz questions");
      res.status(500).json({ message: "Failed to generate quiz questions" });
    }
  });
  
  /**
   * Submit quiz attempt and get feedback
   */
  app.post("/api/learning/quizzes/:id/submit", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const quizId = parseInt(req.params.id, 10);
      
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      
      const { answers } = req.body;
      
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers array is required" });
      }
      
      // Get the quiz
      const quiz = await learningStorage.getLearningQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Calculate score
      const questions = quiz.questions as any[];
      let correctAnswers = 0;
      
      for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
        if (answers[i].selectedOptionIndex === questions[i].correctOptionIndex) {
          correctAnswers++;
        }
      }
      
      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= quiz.passingScore;
      
      // Create quiz attempt
      const attempt = await learningStorage.createUserQuizAttempt({
        userId,
        quizId,
        score,
        answers,
        passed
      });
      
      // Generate feedback
      const feedback = await learningService.generateQuizFeedback({
        userAttempt: attempt,
        questions,
        userAnswers: answers
      });
      
      // Update attempt with feedback
      const updated = await learningStorage.updateUserQuizAttempt(
        attempt.id, 
        { feedbackGenerated: JSON.stringify(feedback) }
      );
      
      res.status(200).json({
        attempt: updated,
        feedback,
        score,
        passed
      });
    } catch (error: any) {
      log.error({ err: error }, "Error submitting quiz attempt");
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });
  
  /**
   * Get bill-specific learning content
   */
  app.get("/api/learning/bills/:billId", async (req: Request, res: Response) => {
    try {
      const billId = req.params.billId;
      
      // Get the bill
      const bill = await storage.getBillById(billId);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Get contextual learning content for this bill
      const content = await learningStorage.getContextualLearningContentByBillId(billId, 5);
      
      // Get related learning resources
      const relatedResources = await learningStorage.getLearningResources({
        relatedBillId: billId,
        limit: 5
      });
      
      // Get related civic concepts based on bill topics
      const concepts = await learningStorage.getCivicConcepts({
        limit: 10
      });
      
      // Filter concepts that are relevant to the bill's topics
      const filteredConcepts = concepts.filter(concept => {
        const lowerCaseTopics = bill.topics.map(topic => topic.toLowerCase());
        return lowerCaseTopics.some(topic => 
          concept.term.toLowerCase().includes(topic) || 
          concept.definition.toLowerCase().includes(topic)
        );
      }).slice(0, 5);
      
      res.status(200).json({
        content,
        resources: relatedResources,
        concepts: filteredConcepts
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching bill learning content");
      res.status(500).json({ message: "Failed to fetch bill learning content" });
    }
  });
}