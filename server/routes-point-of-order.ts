/**
 * API routes for points of order management and queries
 */

import { Express, Request, Response } from "express";
import { db } from "./db";
import { pointsOfOrder, bills } from "@shared/schema";
import { eq, and, desc, sql, like, or, inArray } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { createId } from "@paralleldrive/cuid2";

export function registerPointOfOrderRoutes(app: Express): void {
  /**
   * Get all points of order with filtering options
   */
  app.get("/api/points-of-order", async (req: Request, res: Response) => {
    try {
      const { 
        status, 
        severity, 
        type, 
        billId, 
        search,
        aiDetected,
        validationStatus,
        detectedBy,
        limit = 100,
        offset = 0
      } = req.query;
      
      let filters = [];
      
      // Apply filters based on query parameters
      if (status) {
        if (Array.isArray(status)) {
          filters.push(inArray(pointsOfOrder.status, status as string[]));
        } else {
          filters.push(eq(pointsOfOrder.status, status as string));
        }
      }
      
      if (severity) {
        if (Array.isArray(severity)) {
          filters.push(inArray(pointsOfOrder.severity, severity as string[]));
        } else {
          filters.push(eq(pointsOfOrder.severity, severity as string));
        }
      }
      
      if (type) {
        if (Array.isArray(type)) {
          filters.push(inArray(pointsOfOrder.type, type as string[]));
        } else {
          filters.push(eq(pointsOfOrder.type, type as string));
        }
      }
      
      if (billId) {
        filters.push(eq(pointsOfOrder.billId, billId as string));
      }
      
      if (search) {
        filters.push(
          or(
            like(pointsOfOrder.description, `%${search}%`),
            like(pointsOfOrder.ruleReference, `%${search}%`)
          )
        );
      }
      
      if (aiDetected) {
        filters.push(eq(pointsOfOrder.aiDetected, aiDetected === 'true'));
      }
      
      if (validationStatus) {
        if (Array.isArray(validationStatus)) {
          filters.push(inArray(pointsOfOrder.validationStatus, validationStatus as string[]));
        } else {
          filters.push(eq(pointsOfOrder.validationStatus, validationStatus as string));
        }
      }
      
      if (detectedBy) {
        if (Array.isArray(detectedBy)) {
          filters.push(inArray(pointsOfOrder.detectedBy, detectedBy as string[]));
        } else {
          filters.push(eq(pointsOfOrder.detectedBy, detectedBy as string));
        }
      }
      
      // Execute query with applied filters
      const results = await db.query.pointsOfOrder.findMany({
        where: filters.length > 0 ? and(...filters) : undefined,
        orderBy: [
          desc(pointsOfOrder.severity),
          desc(pointsOfOrder.createdAt)
        ],
        limit: Number(limit),
        offset: Number(offset),
        // Include bill information for each point of order
        with: {
          bill: {
            columns: {
              id: true,
              title: true,
              chamber: true,
              status: true
            }
          }
        }
      });
      
      // Get total count of results (without pagination)
      const totalCountResult = await db.select({ count: sql`count(*)` })
        .from(pointsOfOrder).$dynamic()
        .where(filters.length > 0 ? and(...filters) : undefined);
      
      const totalCount = Number(totalCountResult[0]?.count || 0);
      
      return res.json({
        pointsOfOrder: results,
        pagination: {
          total: totalCount,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: totalCount > (Number(offset) + Number(limit))
        }
      });
    } catch (error: any) {
      console.error("Error fetching points of order:", error);
      return res.status(500).json({ error: "Failed to fetch points of order" });
    }
  });

  /**
   * Get a specific point of order by ID
   */
  app.get("/api/points-of-order/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const pointOfOrder = await db.query.pointsOfOrder.findFirst({
        where: eq(pointsOfOrder.id, id),
        // Include bill information
        with: {
          bill: {
            columns: {
              id: true,
              title: true,
              chamber: true,
              status: true,
              description: true,
              fullText: true
            }
          }
        }
      });
      
      if (!pointOfOrder) {
        return res.status(404).json({ error: "Point of order not found" });
      }
      
      return res.json(pointOfOrder);
    } catch (error: any) {
      console.error("Error fetching point of order:", error);
      return res.status(500).json({ error: "Failed to fetch point of order" });
    }
  });

  /**
   * Create a new point of order
   */
  app.post("/api/points-of-order", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { 
        billId, 
        type, 
        description, 
        severity, 
        ruleReference,
        ruleCitation,
        textLocation,
        precedents,
        suggestedFix,
        detectedBy = "user" // Default to user-detected if not specified
      } = req.body;
      
      // Validate required fields
      if (!billId || !type || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      // Create new point of order
      const newPointOfOrder = await db.insert(pointsOfOrder).values({
        id: createId(),
        billId,
        type,
        description,
        severity: severity || "medium",
        ruleReference,
        ruleCitation,
        textLocation,
        precedents: precedents ? JSON.stringify(precedents) : null,
        suggestedFix,
        status: "potential", // Default status for new points of order
        detectedBy,
        aiDetected: detectedBy === "ai",
        validationStatus: detectedBy === "ai" ? "pending" : "validated", // Auto-validate if added by human
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return res.status(201).json(newPointOfOrder[0]);
    } catch (error: any) {
      console.error("Error creating point of order:", error);
      return res.status(500).json({ error: "Failed to create point of order" });
    }
  });

  /**
   * Update a point of order
   */
  app.patch("/api/points-of-order/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        type, 
        description, 
        severity, 
        status,
        ruleReference,
        ruleCitation,
        textLocation,
        precedents,
        suggestedFix,
        resolution,
        validationStatus
      } = req.body;
      
      // Check if point of order exists
      const existingPOO = await db.query.pointsOfOrder.findFirst({
        where: eq(pointsOfOrder.id, id),
      });
      
      if (!existingPOO) {
        return res.status(404).json({ error: "Point of order not found" });
      }
      
      // Update the point of order
      const updatedPOO = await db.update(pointsOfOrder)
        .set({
          type: type || existingPOO.type,
          description: description || existingPOO.description,
          severity: severity || existingPOO.severity,
          status: status || existingPOO.status,
          ruleReference: ruleReference || existingPOO.ruleReference,
          ruleCitation: ruleCitation !== undefined ? ruleCitation : existingPOO.ruleCitation,
          textLocation: textLocation !== undefined ? textLocation : existingPOO.textLocation,
          precedents: precedents !== undefined ? JSON.stringify(precedents) : existingPOO.precedents,
          suggestedFix: suggestedFix !== undefined ? suggestedFix : existingPOO.suggestedFix,
          resolution: resolution !== undefined ? resolution : existingPOO.resolution,
          validationStatus: validationStatus || existingPOO.validationStatus,
          updatedAt: new Date()
        })
        .where(eq(pointsOfOrder.id, id))
        .returning();
      
      return res.json(updatedPOO[0]);
    } catch (error: any) {
      console.error("Error updating point of order:", error);
      return res.status(500).json({ error: "Failed to update point of order" });
    }
  });

  /**
   * Validate or reject an AI-detected point of order
   */
  app.post("/api/points-of-order/:id/validate", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { validationStatus, notes } = req.body;
      
      // Check if point of order exists
      const existingPOO = await db.query.pointsOfOrder.findFirst({
        where: eq(pointsOfOrder.id, id),
      });
      
      if (!existingPOO) {
        return res.status(404).json({ error: "Point of order not found" });
      }
      
      // Only AI-detected points of order can be validated/rejected
      if (!existingPOO.aiDetected) {
        return res.status(400).json({ error: "Only AI-detected points of order can be validated" });
      }
      
      if (validationStatus !== "validated" && validationStatus !== "rejected") {
        return res.status(400).json({ error: "Validation status must be 'validated' or 'rejected'" });
      }
      
      // Update validation status
      const updatedPOO = await db.update(pointsOfOrder)
        .set({
          validationStatus,
          resolution: notes || existingPOO.resolution, // Store notes in resolution
          updatedAt: new Date()
        })
        .where(eq(pointsOfOrder.id, id))
        .returning();
      
      return res.json(updatedPOO[0]);
    } catch (error: any) {
      console.error("Error validating point of order:", error);
      return res.status(500).json({ error: "Failed to validate point of order" });
    }
  });

  /**
   * Get validation statistics for AI-detected points of order
   */
  app.get("/api/points-of-order/validation/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await db.execute(sql`
        SELECT
          validation_status,
          COUNT(*) as count
        FROM points_of_order
        WHERE ai_detected = true
        GROUP BY validation_status
      `);
      
      const typeStats = await db.execute(sql`
        SELECT
          type,
          validation_status,
          COUNT(*) as count
        FROM points_of_order
        WHERE ai_detected = true
        GROUP BY type, validation_status
      `);
      
      return res.json({
        byValidationStatus: stats.rows,
        byType: typeStats.rows
      });
    } catch (error: any) {
      console.error("Error fetching validation statistics:", error);
      return res.status(500).json({ error: "Failed to fetch validation statistics" });
    }
  });

  /**
   * Delete a point of order (admin only)
   */
  app.delete("/api/points-of-order/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can delete points of order" });
      }
      
      // Check if point of order exists
      const existingPOO = await db.query.pointsOfOrder.findFirst({
        where: eq(pointsOfOrder.id, id),
      });
      
      if (!existingPOO) {
        return res.status(404).json({ error: "Point of order not found" });
      }
      
      // Delete the point of order
      await db.delete(pointsOfOrder).where(eq(pointsOfOrder.id, id));
      
      return res.json({ success: true, message: "Point of order deleted" });
    } catch (error: any) {
      console.error("Error deleting point of order:", error);
      return res.status(500).json({ error: "Failed to delete point of order" });
    }
  });
}