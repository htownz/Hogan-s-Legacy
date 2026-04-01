import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { FeedbackStorage } from "./storage-feedback";
import { insertUserFeedbackSchema } from "@shared/schema-feedback";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { isUserAdminById } from "./middleware/auth-middleware";

// Create an instance of the feedback storage
const feedbackStorage = new FeedbackStorage();

/**
 * Register feedback API routes
 */
export function registerFeedbackRoutes(app: Express): void {
  const getCurrentUserId = (req: CustomRequest): number | null => {
    if (req?.session?.userId && Number.isInteger(req.session.userId)) {
      return Number(req.session.userId);
    }
    if (req?.user?.id && Number.isInteger(req.user.id)) {
      return Number(req.user.id);
    }
    return null;
  };

  /**
   * Create new feedback
   */
  app.post("/api/feedback", async (req: Request, res: Response) => {
    try {
      // Parse and validate the request body
      const feedbackData = insertUserFeedbackSchema.parse(req.body);
      
      // If request is authenticated, add user ID
      const currentUserId = getCurrentUserId(req as CustomRequest);
      if (currentUserId) {
        feedbackData.userId = currentUserId;
        feedbackData.isAnonymous = false;
      }
      
      // Add browser and platform info if available in headers
      const userAgent = req.headers["user-agent"];
      if (userAgent) {
        // Simple parsing of user agent string
        feedbackData.browser = parseBrowser(userAgent);
        feedbackData.operatingSystem = parseOS(userAgent);
      }
      
      // Create the feedback
      const feedback = await feedbackStorage.createFeedback(feedbackData);
      
      res.status(201).json({
        success: true,
        data: feedback
      });
    } catch (error: any) {
      console.error("Error creating feedback:", error);
      
      // Handle validation errors
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: fromZodError(error).message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to create feedback"
      });
    }
  });

  /**
   * Get all feedback (admin only)
   */
  app.get("/api/feedback", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId || !isUserAdminById(currentUserId)) {
        return res.status(403).json({
          success: false,
          error: "Admin privileges required"
        });
      }
      
      // Parse pagination parameters
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get all feedback
      const feedback = await feedbackStorage.getAllFeedback(limit, offset);
      
      res.json({
        success: true,
        data: feedback
      });
    } catch (error: any) {
      console.error("Error getting feedback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get feedback"
      });
    }
  });

  /**
   * Get feedback statistics (admin only)
   */
  app.get("/api/feedback/stats", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId || !isUserAdminById(currentUserId)) {
        return res.status(403).json({
          success: false,
          error: "Admin privileges required"
        });
      }
      
      // Get feedback statistics
      const stats = await feedbackStorage.getFeedbackStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error("Error getting feedback stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get feedback statistics"
      });
    }
  });

  /**
   * Update feedback status (admin only)
   */
  app.patch("/api/feedback/:id/status", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId || !isUserAdminById(currentUserId)) {
        return res.status(403).json({
          success: false,
          error: "Admin privileges required"
        });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!["new", "reviewed", "addressed", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status"
        });
      }
      
      // Update feedback status
      const updatedFeedback = await feedbackStorage.updateFeedbackStatus(id, status);
      
      if (!updatedFeedback) {
        return res.status(404).json({
          success: false,
          error: "Feedback not found"
        });
      }
      
      res.json({
        success: true,
        data: updatedFeedback
      });
    } catch (error: any) {
      console.error("Error updating feedback status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update feedback status"
      });
    }
  });
}

/**
 * Basic browser detection from user agent string
 */
function parseBrowser(userAgent: string): string {
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) return "Chrome";
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) return "Safari";
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("MSIE ") || userAgent.includes("Trident/")) return "Internet Explorer";
  return "Unknown";
}

/**
 * Basic OS detection from user agent string
 */
function parseOS(userAgent: string): string {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac OS X")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  return "Unknown";
}