import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { createLogger } from "./logger";
const log = createLogger("routes-bill-status");


/**
 * Register bill status API routes
 */
export function registerBillStatusRoutes(app: Express): void {
  /**
   * Get the current status of a bill
   */
  app.get("/api/bills/:billId/status", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Get the bill from storage
      const bill = await storage.getBillById(billId);
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Parse the sponsors if it's a JSON string
      let sponsors = [];
      try {
        if (typeof bill.sponsors === 'string') {
          sponsors = JSON.parse(bill.sponsors);
        } else if (Array.isArray(bill.sponsors)) {
          sponsors = bill.sponsors;
        }
      } catch (e: any) {
        // If parsing fails, use empty array
        sponsors = [];
      }
      
      // Return the bill status information
      res.status(200).json({
        billId: bill.id,
        status: bill.status || "Filed",
        lastUpdated: bill.updatedAt || new Date().toISOString(),
        chamber: bill.chamber || determineDefaultChamber(billId),
        metadata: {
          title: bill.title,
          sponsors: sponsors,
          // We don't have trackCount in the standard bill model
          trackCount: 0
        }
      });
    } catch (error: any) {
      log.error({ err: error }, `Error retrieving bill status for ${req.params.billId}`);
      res.status(500).json({ message: "Error retrieving bill status" });
    }
  });
  
  /**
   * Bulk fetch status for multiple bills
   */
  app.post("/api/bills/status/bulk", async (req: Request, res: Response) => {
    try {
      const { billIds } = req.body;
      
      if (!Array.isArray(billIds) || billIds.length === 0) {
        return res.status(400).json({ message: "Invalid request. Expected an array of bill IDs" });
      }
      
      // Get each bill individually since we don't have a getBillsByIds method
      const billPromises = billIds.map(id => storage.getBillById(id));
      const bills = (await Promise.all(billPromises)).filter(bill => bill !== null);
      
      // Format the response
      const statusUpdates = bills.map(bill => {
        if (!bill) return null; // Skip null bills
        
        // Parse sponsors if needed
        let sponsors = [];
        try {
          if (typeof bill.sponsors === 'string') {
            sponsors = JSON.parse(bill.sponsors);
          } else if (Array.isArray(bill.sponsors)) {
            sponsors = bill.sponsors;
          }
        } catch (e: any) {
          sponsors = [];
        }
        
        return {
          billId: bill.id,
          status: bill.status || "Filed",
          lastUpdated: bill.updatedAt || new Date().toISOString(),
          chamber: bill.chamber || determineDefaultChamber(bill.id),
          metadata: {
            title: bill.title,
            sponsors: sponsors,
            trackCount: 0
          }
        };
      }).filter(Boolean); // Remove any null entries
      
      res.status(200).json(statusUpdates);
    } catch (error: any) {
      log.error({ err: error }, "Error retrieving bulk bill status");
      res.status(500).json({ message: "Error retrieving bulk bill status" });
    }
  });
  
  /**
   * Get status changes for bills since a specific time
   */
  app.get("/api/bills/status/changes", async (req: Request, res: Response) => {
    try {
      const sinceTimestamp = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
      
      // Get all bills and filter by updated date
      const allBills = await storage.getAllBills();
      
      // Filter to only include bills updated after the given timestamp
      const statusChanges = allBills
        .filter(bill => bill && bill.updatedAt && new Date(bill.updatedAt) > sinceTimestamp)
        .map(bill => {
          if (!bill) return null; // Skip null bills
          
          // Parse sponsors if needed
          let sponsors = [];
          try {
            if (typeof bill.sponsors === 'string') {
              sponsors = JSON.parse(bill.sponsors);
            } else if (Array.isArray(bill.sponsors)) {
              sponsors = bill.sponsors;
            }
          } catch (e: any) {
            sponsors = [];
          }
          
          return {
            billId: bill.id,
            status: bill.status || "Filed",
            lastUpdated: bill.updatedAt || new Date().toISOString(),
            chamber: bill.chamber || determineDefaultChamber(bill.id),
            metadata: {
              title: bill.title,
              sponsors: sponsors
            }
          };
        }).filter(Boolean); // Remove any null entries
      
      res.status(200).json(statusChanges);
    } catch (error: any) {
      log.error({ err: error }, "Error retrieving bill status changes");
      res.status(500).json({ message: "Error retrieving bill status changes" });
    }
  });
}

/**
 * Helper function to determine chamber based on bill ID
 */
function determineDefaultChamber(billId: string): "House" | "Senate" {
  const lowerBillId = billId.toLowerCase();
  if (lowerBillId.includes("hb") || lowerBillId.includes("hr")) {
    return "House";
  } else if (lowerBillId.includes("sb") || lowerBillId.includes("sr")) {
    return "Senate";
  }
  
  // Default to House if can't determine
  return "House";
}