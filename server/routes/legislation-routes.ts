// @ts-nocheck
import { Express } from "express";
import { storage } from "../storage";
import { insertBillSchema, insertUserBillTrackingSchema } from "@shared/schema";
import { z } from "zod";
import { CustomRequest } from "../types";
import { db } from "../db";
import { billHistoryEvents } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createLogger } from "../logger";
const log = createLogger("legislation-routes");


export function registerLegislationRoutes(app: Express) {
  // Get all bills
  app.get('/api/legislation/bills', async (_req, res) => {
    try {
      const bills = await storage.getAllBills();
      res.status(200).json(bills);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching all bills");
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  // Get a specific bill by ID
  app.get('/api/legislation/bills/:id', async (req, res) => {
    try {
      const bill = await storage.getBillById(req.params.id);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.status(200).json(bill);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching bill ${req.params.id}`);
      res.status(500).json({ message: "Failed to fetch bill details" });
    }
  });

  // Search bills by query
  app.get('/api/legislation/search', async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const bills = await storage.searchBills(query);
      res.status(200).json(bills);
    } catch (error: any) {
      log.error({ err: error }, "Error searching bills");
      res.status(500).json({ message: "Failed to search bills" });
    }
  });

  // Filter bills by status
  app.get('/api/legislation/filter/status/:status', async (req, res) => {
    try {
      const status = req.params.status;
      const bills = await storage.getBillsByStatus(status);
      res.status(200).json(bills);
    } catch (error: any) {
      log.error({ err: error }, `Error filtering bills by status ${req.params.status}`);
      res.status(500).json({ message: "Failed to filter bills by status" });
    }
  });
  
  // Filter bills by chamber
  app.get('/api/legislation/filter/chamber/:chamber', async (req, res) => {
    try {
      const chamber = req.params.chamber;
      const bills = await storage.getBillsByChamber(chamber);
      res.status(200).json(bills);
    } catch (error: any) {
      log.error({ err: error }, `Error filtering bills by chamber ${req.params.chamber}`);
      res.status(500).json({ message: "Failed to filter bills by chamber" });
    }
  });

  // Get tracked bills for the current user
  app.get('/api/legislation/tracked', async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const bills = await storage.getUserTrackedBills(req.session.userId);
      res.status(200).json(bills);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching tracked bills");
      res.status(500).json({ message: "Failed to fetch tracked bills" });
    }
  });

  // Track a bill
  app.post('/api/legislation/track', async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const trackSchema = z.object({
        billId: z.string()
      });
      
      const { billId } = trackSchema.parse(req.body);
      
      // Check if the bill exists
      const bill = await storage.getBillById(billId);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Check if already tracking
      const isTracking = await storage.isUserTrackingBill(req.session.userId, billId);
      if (isTracking) {
        return res.status(400).json({ message: "Already tracking this bill" });
      }
      
      const tracking = await storage.trackBill(req.session.userId, billId);
      res.status(201).json(tracking);
    } catch (error: any) {
      log.error({ err: error }, "Error tracking bill");
      res.status(500).json({ message: "Failed to track bill" });
    }
  });

  // Untrack a bill
  app.delete('/api/legislation/track/:billId', async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const billId = req.params.billId;
      
      // Check if the bill exists
      const bill = await storage.getBillById(billId);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Check if actually tracking
      const isTracking = await storage.isUserTrackingBill(req.session.userId, billId);
      if (!isTracking) {
        return res.status(400).json({ message: "Not tracking this bill" });
      }
      
      await storage.untrackBill(req.session.userId, billId);
      res.status(200).json({ message: "Bill untracked successfully" });
    } catch (error: any) {
      log.error({ err: error }, `Error untracking bill ${req.params.billId}`);
      res.status(500).json({ message: "Failed to untrack bill" });
    }
  });

  // Create a bill (admin only route in future)
  app.post('/api/legislation/bills', async (req, res) => {
    try {
      const billData = insertBillSchema.parse(req.body);
      const newBill = await storage.createBill(billData);
      res.status(201).json(newBill);
    } catch (error: any) {
      log.error({ err: error }, "Error creating bill");
      res.status(500).json({ message: "Failed to create bill" });
    }
  });
  
  // Get bill history events
  app.get('/api/legislation/history/:billId', async (req, res) => {
    try {
      const { billId } = req.params;
      
      // Check if the bill exists
      const bill = await storage.getBillById(billId);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Query history events for this bill
      const events = await db.select()
        .from(billHistoryEvents).$dynamic()
        .where(eq(billHistoryEvents.billId, billId))
        .orderBy(billHistoryEvents.eventDate);
      
      res.status(200).json(events);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching history for bill ${req.params.billId}`);
      res.status(500).json({ message: "Failed to fetch bill history" });
    }
  });
}