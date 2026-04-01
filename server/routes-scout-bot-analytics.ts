import { Express, Request, Response } from "express";
import { z } from "zod";
import {
  analyzeFinancialNetworks,
  createAdvancedAnalysis,
  createAutomatedReport,
  createCrossDatasetAnomaly,
  createHistoricalTrend,
  detectCrossDatasetAnomalies,
  generateAutomatedReport,
  getAdvancedAnalysisByProfileId,
  getAnomaliesByProfileId,
  getAutomatedReports,
  getHistoricalTrendsByEntityType,
  reviewAnomaly
} from "./storage-scout-bot-analytics";
import { CustomRequest } from "./types";
import { isAuthenticated } from "./auth";
import {
  insertScoutBotAdvancedAnalysisSchema,
  insertScoutBotAutomatedReportsSchema,
  insertScoutBotCrossDatasetAnomaliesSchema,
  insertScoutBotHistoricalTrendsSchema
} from "../shared/schema-scout-bot-analytics";
import { isAdmin } from "./middleware/auth-middleware";

/**
 * Register Scout Bot Analytics API routes
 */
export function registerScoutBotAnalyticsRoutes(app: Express) {
  /**
   * Get all advanced analyses
   */
  app.get("/api/scout-bot-analytics/analyses", async (req: Request, res: Response) => {
    // Explicitly set Content-Type header to application/json at the start
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      // For now, let's just return all analyses without filters
      const results = await getAdvancedAnalysisByProfileId(null, limit, offset);
      
      res.json({
        analyses: results.analyses,
        pagination: {
          total: results.total,
          limit,
          offset
        }
      });
    } catch (error: any) {
      console.error("Error fetching advanced analyses:", error);
      res.status(500).json({ error: "Failed to fetch advanced analyses" });
    }
  });

  /**
   * Get advanced analyses for a profile
   */
  app.get("/api/scout-bot-analytics/profiles/:id/analyses", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const results = await getAdvancedAnalysisByProfileId(id, limit, offset);
      
      res.json({
        analyses: results.analyses,
        pagination: {
          total: results.total,
          limit,
          offset
        }
      });
    } catch (error: any) {
      console.error("Error fetching advanced analyses:", error);
      res.status(500).json({ error: "Failed to fetch advanced analyses" });
    }
  });

  /**
   * Run financial network analysis for a profile
   */
  app.post("/api/scout-bot-analytics/profiles/:id/analyze-financial-networks", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await analyzeFinancialNetworks(id);
      
      if (!result) {
        return res.status(400).json({ error: "Not enough data to perform financial network analysis or profile not found" });
      }
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error analyzing financial networks:", error);
      res.status(500).json({ error: "Failed to analyze financial networks" });
    }
  });

  /**
   * Create a new advanced analysis
   */
  app.post("/api/scout-bot-analytics/advanced-analysis", isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const validatedData = insertScoutBotAdvancedAnalysisSchema.parse(req.body);
      
      const analysis = await createAdvancedAnalysis(validatedData);
      
      res.status(201).json(analysis);
    } catch (error: any) {
      console.error("Error creating advanced analysis:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create advanced analysis" });
    }
  });

  /**
   * Get historical trends by entity type
   */
  app.get("/api/scout-bot-analytics/historical-trends", async (req: Request, res: Response) => {
    // Explicitly set Content-Type header to application/json at the start
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const entityType = req.query.entity_type as string;
      
      if (!entityType) {
        return res.status(400).json({ error: "entity_type query parameter is required" });
      }
      
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const results = await getHistoricalTrendsByEntityType(entityType, limit, offset);
      
      res.json({
        trends: results.trends,
        pagination: {
          total: results.total,
          limit,
          offset
        }
      });
    } catch (error: any) {
      console.error("Error fetching historical trends:", error);
      res.status(500).json({ error: "Failed to fetch historical trends" });
    }
  });

  /**
   * Create a new historical trend
   */
  app.post("/api/scout-bot-analytics/historical-trends", isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const validatedData = insertScoutBotHistoricalTrendsSchema.parse(req.body);
      
      const trend = await createHistoricalTrend(validatedData);
      
      res.status(201).json(trend);
    } catch (error: any) {
      console.error("Error creating historical trend:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create historical trend" });
    }
  });

  /**
   * Get all cross-dataset anomalies
   */
  app.get("/api/scout-bot-analytics/anomalies", async (req: Request, res: Response) => {
    // Explicitly set Content-Type header to application/json at the start
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      // For now, let's just return all anomalies without filters
      const results = await getAnomaliesByProfileId(null, limit, offset);
      
      res.json({
        anomalies: results.anomalies,
        pagination: {
          total: results.total,
          limit,
          offset
        }
      });
    } catch (error: any) {
      console.error("Error fetching anomalies:", error);
      res.status(500).json({ error: "Failed to fetch anomalies" });
    }
  });

  /**
   * Get cross-dataset anomalies for a profile
   */
  app.get("/api/scout-bot-analytics/profiles/:id/anomalies", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const results = await getAnomaliesByProfileId(id, limit, offset);
      
      res.json({
        anomalies: results.anomalies,
        pagination: {
          total: results.total,
          limit,
          offset
        }
      });
    } catch (error: any) {
      console.error("Error fetching anomalies:", error);
      res.status(500).json({ error: "Failed to fetch anomalies" });
    }
  });

  /**
   * Run cross-dataset anomaly detection for a profile
   */
  app.post("/api/scout-bot-analytics/profiles/:id/detect-anomalies", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await detectCrossDatasetAnomalies(id);
      
      if (!result) {
        return res.status(400).json({ error: "Not enough data to perform anomaly detection or profile not found" });
      }
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error detecting cross-dataset anomalies:", error);
      res.status(500).json({ error: "Failed to detect cross-dataset anomalies" });
    }
  });

  /**
   * Create a new cross-dataset anomaly
   */
  app.post("/api/scout-bot-analytics/anomalies", isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const validatedData = insertScoutBotCrossDatasetAnomaliesSchema.parse(req.body);
      
      const anomaly = await createCrossDatasetAnomaly(validatedData);
      
      res.status(201).json(anomaly);
    } catch (error: any) {
      console.error("Error creating cross-dataset anomaly:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create cross-dataset anomaly" });
    }
  });

  /**
   * Review a cross-dataset anomaly
   */
  app.patch("/api/scout-bot-analytics/anomalies/:id/review", isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, review_notes } = req.body;
      
      if (!status || !review_notes) {
        return res.status(400).json({ error: "status and review_notes are required" });
      }
      
      if (!["pending", "confirmed", "dismissed"].includes(status)) {
        return res.status(400).json({ error: "status must be 'pending', 'confirmed', or 'dismissed'" });
      }
      
      const result = await reviewAnomaly(id, status, review_notes);
      
      if (!result) {
        return res.status(404).json({ error: "Anomaly not found" });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error reviewing anomaly:", error);
      res.status(500).json({ error: "Failed to review anomaly" });
    }
  });

  /**
   * Get automated reports
   */
  app.get("/api/scout-bot-analytics/reports", async (req: Request, res: Response) => {
    // Explicitly set Content-Type header to application/json at the start
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const reportType = req.query.report_type as string | undefined;
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const results = await getAutomatedReports(reportType, limit, offset);
      
      res.json({
        reports: results.reports,
        pagination: {
          total: results.total,
          limit,
          offset
        }
      });
    } catch (error: any) {
      console.error("Error fetching automated reports:", error);
      res.status(500).json({ error: "Failed to fetch automated reports" });
    }
  });

  /**
   * Generate an automated report
   */
  app.post("/api/scout-bot-analytics/reports/generate", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { report_type, entity_id, time_period } = req.body;
      
      if (!report_type) {
        return res.status(400).json({ error: "report_type is required" });
      }
      
      if (!["entity_profile", "network_analysis"].includes(report_type)) {
        return res.status(400).json({ error: "report_type must be 'entity_profile' or 'network_analysis'" });
      }
      
      if (report_type === "entity_profile" && !entity_id) {
        return res.status(400).json({ error: "entity_id is required for entity_profile reports" });
      }
      
      const result = await generateAutomatedReport(report_type, entity_id, time_period);
      
      if (!result) {
        return res.status(400).json({ error: "Failed to generate report, insufficient data or invalid parameters" });
      }
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error generating automated report:", error);
      res.status(500).json({ error: "Failed to generate automated report" });
    }
  });

  /**
   * Create a new automated report
   */
  app.post("/api/scout-bot-analytics/reports", isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const validatedData = insertScoutBotAutomatedReportsSchema.parse(req.body);
      
      const report = await createAutomatedReport(validatedData);
      
      res.status(201).json(report);
    } catch (error: any) {
      console.error("Error creating automated report:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create automated report" });
    }
  });
}