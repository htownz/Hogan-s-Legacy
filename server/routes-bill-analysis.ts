/**
 * API routes for bill analysis including points of order prediction
 */

import { Express, Request, Response } from "express";
import { db } from "./db";
import { billPOOAnalyzer } from "./services/bill-point-of-order-analyzer";
import { pointsOfOrder, bills } from "@shared/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";

export function registerBillAnalysisRoutes(app: Express): void {
  /**
   * Analyze a bill for potential points of order
   */
  app.post("/api/bills/:billId/analyze-points-of-order", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      // Run the analysis
      const analysisResults = await billPOOAnalyzer.analyzeBill(billId);
      
      // Store the results if there are any detected issues
      if (analysisResults.analysis && 
          Array.isArray(analysisResults.analysis) && 
          analysisResults.analysis.length > 0 &&
          !analysisResults.analysis[0].error) {
        await billPOOAnalyzer.storePointsOfOrderResults(analysisResults);
      }
      
      return res.json({
        success: true,
        billId,
        analysis: analysisResults,
      });
    } catch (error: any) {
      console.error("Error analyzing bill for points of order:", error);
      return res.status(500).json({ error: "Failed to analyze bill" });
    }
  });

  /**
   * Get potential points of order for a specific bill
   */
  app.get("/api/bills/:billId/points-of-order", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Fetch all points of order for this bill
      const pointsOfOrderData = await db.query.pointsOfOrder.findMany({
        where: eq(pointsOfOrder.billId, billId),
        orderBy: [
          desc(pointsOfOrder.severity),
          desc(pointsOfOrder.createdAt)
        ],
      });
      
      return res.json({
        billId,
        pointsOfOrder: pointsOfOrderData,
      });
    } catch (error: any) {
      console.error("Error fetching points of order for bill:", error);
      return res.status(500).json({ error: "Failed to fetch points of order" });
    }
  });

  /**
   * Schedule batch analysis for multiple bills
   */
  app.post("/api/bills/batch-analyze-points-of-order", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billIds = [], storeResults = true } = req.body;
      
      if (!Array.isArray(billIds) || billIds.length === 0) {
        return res.status(400).json({ error: "No bill IDs provided" });
      }
      
      if (billIds.length > 20) {
        return res.status(400).json({ error: "Maximum 20 bills can be analyzed in one batch" });
      }
      
      // Start analysis in background
      res.json({
        success: true,
        message: `Started analysis of ${billIds.length} bills. Check status endpoint for results.`,
        billIds,
      });
      
      // Run the analysis asynchronously after responding to the request
      billPOOAnalyzer.analyzeBillBatch(billIds, storeResults)
        .then(results => {
          console.log(`Completed batch analysis of ${results.length} bills`);
        })
        .catch(err => {
          console.error("Error in background bill analysis:", err);
        });
      
    } catch (error: any) {
      console.error("Error scheduling batch analysis:", error);
      return res.status(500).json({ error: "Failed to schedule batch analysis" });
    }
  });

  /**
   * Analyze an amendment for potential points of order
   */
  app.post("/api/bills/:billId/analyze-amendment", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const { amendmentText } = req.body;
      
      if (!amendmentText || typeof amendmentText !== 'string') {
        return res.status(400).json({ error: "Amendment text is required" });
      }
      
      // Check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      // Run amendment analysis
      const analysis = await billPOOAnalyzer.analyzeAmendment(billId, amendmentText);
      
      return res.json({
        success: true,
        billId,
        analysis,
      });
    } catch (error: any) {
      console.error("Error analyzing amendment:", error);
      return res.status(500).json({ error: "Failed to analyze amendment" });
    }
  });

  /**
   * Get historical points of order patterns and statistics
   */
  app.get("/api/points-of-order/patterns", async (_req: Request, res: Response) => {
    try {
      const typeStats = await db.execute(sql`
        SELECT
          type,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'sustained' THEN 1 END) as sustained_count,
          COUNT(CASE WHEN status = 'overruled' THEN 1 END) as overruled_count
        FROM points_of_order
        GROUP BY type
        ORDER BY count DESC
      `);
      
      const ruleStats = await db.execute(sql`
        SELECT
          rule_reference,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'sustained' THEN 1 END) as sustained_count
        FROM points_of_order
        GROUP BY rule_reference
        ORDER BY count DESC
      `);
      
      const severityStats = await db.execute(sql`
        SELECT
          severity,
          COUNT(*) as count
        FROM points_of_order
        GROUP BY severity
        ORDER BY
          CASE severity
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            ELSE 4
          END
      `);
      
      return res.json({
        patterns: {
          byType: typeStats.rows,
          byRule: ruleStats.rows,
          bySeverity: severityStats.rows
        }
      });
    } catch (error: any) {
      console.error("Error fetching points of order patterns:", error);
      return res.status(500).json({ error: "Failed to fetch points of order patterns" });
    }
  });
}