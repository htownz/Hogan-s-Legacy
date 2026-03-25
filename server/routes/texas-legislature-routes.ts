// @ts-nocheck
/**
 * Texas Legislature API Routes
 * 
 * This file contains API routes for accessing Texas legislature data:
 * - Bills and legislation
 * - Statutes and legal codes
 * - House and Senate rules
 * - Points of order detection and history
 */

import { Express, Request, Response } from "express";
import { db } from "../db";
import { 
  bills, 
  texasStatutes, 
  legislativeRules, 
  pointsOfOrder,
  legislativeSessions,
  billHistoryEvents,
  users
} from "@shared/schema";
// Temporarily commented out while fixing server startup
// import { 
//   fetchBillData, 
//   fetchHouseRules,
//   fetchSenateRules
// } from "../services/texas-legislature-api";
import { eq, and, like, or, desc } from "drizzle-orm";

// Custom typing for auth requests
interface CustomRequest extends Request {
  user?: { id: number; username: string; };
}

/**
 * Register Texas Legislature routes
 */
export async function registerTexasLegislatureRoutes(app: Express): Promise<void> {
  
  // Get current legislative session info
  app.get("/api/legislature/session", async (_req: Request, res: Response) => {
    try {
      const [currentSession] = await db
        .select()
        .from(legislativeSessions).$dynamic()
        .where(eq(legislativeSessions.isCurrent, true));
      
      if (!currentSession) {
        return res.status(404).json({ message: "No current legislative session found" });
      }
      
      res.json(currentSession);
    } catch (error: any) {
      console.error("Error fetching session info:", error);
      res.status(500).json({ message: "Error fetching legislative session information" });
    }
  });
  
  // Get all legislative sessions
  app.get("/api/legislature/sessions", async (_req: Request, res: Response) => {
    try {
      const sessions = await db
        .select()
        .from(legislativeSessions)
        .orderBy(desc(legislativeSessions.startDate));
      
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Error fetching legislative sessions" });
    }
  });
  
  // Get Texas statutes
  app.get("/api/legislature/statutes", async (req: Request, res: Response) => {
    try {
      const { code, chapter, section, query } = req.query;
      
      let statutes;
      
      if (query) {
        // Text search through content
        statutes = await db
          .select()
          .from(texasStatutes).$dynamic()
          .where(like(texasStatutes.content, `%${query}%`))
          .limit(50);
      } else if (code) {
        // Filter by code/chapter/section if provided
        const filters = [];
        filters.push(eq(texasStatutes.code, code as string));
        
        if (chapter) {
          filters.push(eq(texasStatutes.chapter, chapter as string));
        }
        
        if (section) {
          filters.push(eq(texasStatutes.section, section as string));
        }
        
        statutes = await db
          .select()
          .from(texasStatutes).$dynamic()
          .where(and(...filters));
      } else {
        // Just get statute titles/codes with no content
        statutes = await db
          .select({
            id: texasStatutes.id,
            code: texasStatutes.code,
            title: texasStatutes.title,
            chapter: texasStatutes.chapter,
            section: texasStatutes.section,
            url: texasStatutes.url,
            effectiveDate: texasStatutes.effectiveDate
          })
          .from(texasStatutes);
      }
      
      res.json(statutes);
    } catch (error: any) {
      console.error("Error fetching statutes:", error);
      res.status(500).json({ message: "Error fetching Texas statutes" });
    }
  });
  
  // Get specific statute by ID
  app.get("/api/legislature/statutes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [statute] = await db
        .select()
        .from(texasStatutes).$dynamic()
        .where(eq(texasStatutes.id, parseInt(id)));
      
      if (!statute) {
        return res.status(404).json({ message: "Statute not found" });
      }
      
      res.json(statute);
    } catch (error: any) {
      console.error("Error fetching specific statute:", error);
      res.status(500).json({ message: "Error fetching statute details" });
    }
  });
  
  // Get legislative rules
  app.get("/api/legislature/rules", async (req: Request, res: Response) => {
    try {
      const { chamber } = req.query;
      
      let rules;
      
      if (chamber && (chamber === 'house' || chamber === 'senate')) {
        rules = await db
          .select()
          .from(legislativeRules).$dynamic()
          .where(eq(legislativeRules.chamber, chamber as string));
      } else {
        rules = await db
          .select()
          .from(legislativeRules);
      }
      
      res.json(rules);
    } catch (error: any) {
      console.error("Error fetching rules:", error);
      res.status(500).json({ message: "Error fetching legislative rules" });
    }
  });
  
  // Get points of order for a specific bill
  app.get("/api/legislature/points-of-order/bill/:billId", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      const pointsOfOrderList = await db
        .select()
        .from(pointsOfOrder).$dynamic()
        .where(eq(pointsOfOrder.billId, billId));
      
      res.json(pointsOfOrderList);
    } catch (error: any) {
      console.error("Error fetching points of order:", error);
      res.status(500).json({ message: "Error fetching points of order" });
    }
  });
  
  // Get all potential points of order
  app.get("/api/legislature/points-of-order", async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      
      let pointsOfOrderList;
      
      if (status) {
        pointsOfOrderList = await db
          .select()
          .from(pointsOfOrder).$dynamic()
          .where(eq(pointsOfOrder.status, status as string));
      } else {
        pointsOfOrderList = await db
          .select()
          .from(pointsOfOrder);
      }
      
      res.json(pointsOfOrderList);
    } catch (error: any) {
      console.error("Error fetching points of order:", error);
      res.status(500).json({ message: "Error fetching points of order" });
    }
  });
  
  // Analyze bill text for points of order (requires auth)
  app.post("/api/legislature/analyze-bill", async (req: CustomRequest, res: Response) => {
    try {
      // Require authentication
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { billId, billText } = req.body;
      
      if (!billId || !billText) {
        return res.status(400).json({ message: "Bill ID and bill text are required" });
      }
      
      // Get the bill to make sure it exists
      const [bill] = await db
        .select()
        .from(bills).$dynamic()
        .where(eq(bills.id, billId));
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Analyze the bill text
      const pointsOfOrderFound = analyzePointsOfOrder(billText);
      
      // Save the points of order to the database
      const savedPointsOfOrder = [];
      
      for (const point of pointsOfOrderFound) {
        const [savedPoint] = await db
          .insert(pointsOfOrder)
          .values({
            billId,
            type: point.type,
            description: point.description,
            severity: point.severity,
            status: "potential",
            detectedBy: "ai",
          })
          .returning();
        
        savedPointsOfOrder.push(savedPoint);
      }
      
      res.json({
        billId,
        pointsOfOrder: savedPointsOfOrder,
        count: savedPointsOfOrder.length
      });
    } catch (error: any) {
      console.error("Error analyzing bill:", error);
      res.status(500).json({ message: "Error analyzing bill for points of order" });
    }
  });
  
  // Get bill history
  app.get("/api/legislature/bill-history/:billId", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      const events = await db
        .select()
        .from(billHistoryEvents).$dynamic()
        .where(eq(billHistoryEvents.billId, billId))
        .orderBy(desc(billHistoryEvents.eventDate));
      
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching bill history:", error);
      res.status(500).json({ message: "Error fetching bill history" });
    }
  });
  
  // Fetch and update bill data from TLO (requires auth)
  app.post("/api/legislature/fetch-bill/:billId", async (req: CustomRequest, res: Response) => {
    try {
      // Require authentication
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { billId } = req.params;
      
      // Remove the "TX-" prefix if present
      const rawBillId = billId.startsWith("TX-") ? billId.substring(3) : billId;
      
      // Fetch bill data from TLO
      const billData = await fetchBillData(rawBillId);
      
      if (!billData) {
        return res.status(404).json({ message: "Bill not found on Texas Legislature Online" });
      }
      
      // Check if bill exists and update it, or create new
      const [existingBill] = await db
        .select()
        .from(bills).$dynamic()
        .where(eq(bills.id, `TX-${rawBillId}`));
      
      let result;
      
      if (existingBill) {
        // Update existing bill
        [result] = await db
          .update(bills)
          .set(billData)
          .where(eq(bills.id, `TX-${rawBillId}`))
          .returning();
      } else {
        // Create new bill
        [result] = await db
          .insert(bills)
          .values(billData)
          .returning();
      }
      
      res.json({
        message: existingBill ? "Bill updated successfully" : "Bill created successfully",
        bill: result
      });
    } catch (error: any) {
      console.error("Error fetching bill from TLO:", error);
      res.status(500).json({ message: "Error fetching and updating bill data" });
    }
  });

  console.log("Texas Legislature routes registered");
}