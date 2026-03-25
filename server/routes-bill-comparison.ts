import { Request, Response, Express } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { bills } from "../shared/schema";
import { storage } from "./storage";
import { generateBillComparison } from "./services/legislative-impact-analyzer";

// Define validation schema for bill comparison request
const billComparisonRequestSchema = z.object({
  billId1: z.string().min(1),
  billId2: z.string().min(1)
});

/**
 * Register routes for the bill comparison feature
 */
export function registerBillComparisonRoutes(app: Express): void {
  /**
   * Get a comparison between two bills
   */
  app.get("/api/bills/compare", async (req: Request, res: Response) => {
    try {
      const { billId1, billId2 } = req.query;
      
      if (!billId1 || !billId2) {
        return res.status(400).json({ error: "Two bill IDs are required for comparison" });
      }

      // Get both bills
      const [bill1, bill2] = await Promise.all([
        storage.getBillById(billId1 as string),
        storage.getBillById(billId2 as string)
      ]);

      if (!bill1) {
        return res.status(404).json({ error: `Bill ${billId1} not found` });
      }

      if (!bill2) {
        return res.status(404).json({ error: `Bill ${billId2} not found` });
      }

      // Get bill versions
      const [versions1, versions2] = await Promise.all([
        storage.getBillVersions(billId1 as string),
        storage.getBillVersions(billId2 as string)
      ]);

      // Get bill amendments
      const [amendments1, amendments2] = await Promise.all([
        storage.getBillAmendments(billId1 as string),
        storage.getBillAmendments(billId2 as string)
      ]);

      // Enhance bills with versions and amendments
      const enhancedBill1 = {
        ...bill1,
        versions: versions1,
        amendments: amendments1
      };

      const enhancedBill2 = {
        ...bill2,
        versions: versions2,
        amendments: amendments2
      };

      return res.json({
        bill1: enhancedBill1,
        bill2: enhancedBill2
      });
    } catch (error: any) {
      console.error("Error comparing bills:", error);
      return res.status(500).json({ error: "Failed to compare bills: " + error.message });
    }
  });

  /**
   * Generate an enhanced comparison between two bills with analytical insights
   */
  app.get("/api/bills/compare/analysis", async (req: Request, res: Response) => {
    try {
      const { billId1, billId2 } = req.query;
      
      // Validate input
      if (!billId1 || !billId2) {
        return res.status(400).json({ error: "Two bill IDs are required for comparison analysis" });
      }

      // Get both bills
      const [bill1, bill2] = await Promise.all([
        storage.getBillById(billId1 as string),
        storage.getBillById(billId2 as string)
      ]);

      if (!bill1) {
        return res.status(404).json({ error: `Bill ${billId1} not found` });
      }

      if (!bill2) {
        return res.status(404).json({ error: `Bill ${billId2} not found` });
      }

      // Generate the comparison analysis
      const analysis = await generateBillComparison(bill1, bill2);
      
      return res.json({
        bill1,
        bill2,
        analysis
      });
    } catch (error: any) {
      console.error("Error generating bill comparison analysis:", error);
      return res.status(500).json({ 
        error: "Failed to generate bill comparison analysis: " + error.message 
      });
    }
  });

  /**
   * Get detailed differences between specific versions of two bills
   */
  app.get("/api/bills/compare/versions", async (req: Request, res: Response) => {
    try {
      const { billId1, billId2, versionId1, versionId2 } = req.query;
      
      if (!billId1 || !billId2) {
        return res.status(400).json({ error: "Two bill IDs are required" });
      }

      if (!versionId1 || !versionId2) {
        return res.status(400).json({ error: "Two version IDs are required" });
      }

      // Fetch the specific versions
      // This would be implemented with actual version content retrieval
      // For now we return a placeholder
      
      return res.json({
        differences: {
          added: ["Section regarding environmental protections", "Funding allocation amendment"],
          removed: ["Section on regulatory enforcement", "Timeline for implementation"],
          changed: ["Penalty amounts", "Scope of application"]
        },
        diffStats: {
          additions: 15,
          deletions: 12,
          changes: 8
        }
      });
    } catch (error: any) {
      console.error("Error comparing bill versions:", error);
      return res.status(500).json({ error: "Failed to compare bill versions: " + error.message });
    }
  });
}