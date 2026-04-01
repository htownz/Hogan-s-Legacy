/**
 * Routes for enhanced points of order statistics and trends
 */

import { Request, Response, Express } from "express";
import { db } from "./db";
import { eq, and, desc, sql, asc, count, isNull, not } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import type { CustomRequest } from "./types";
import { enhancedBillPOOAnalyzer } from "./services/enhanced-bill-poo-analyzer";
import { pointsOfOrder, legislativeRules } from "@shared/schema";
import { createLogger } from "./logger";
const log = createLogger("routes-points-of-order-stats");


/**
 * Register routes for points of order statistics and trends
 */
export function registerPointsOfOrderStatsRoutes(app: Express): void {
  /**
   * Get points of order statistics
   * Provides aggregate data on points of order status, severity, type, and rule references
   */
  app.get("/api/points-of-order/statistics", async (req: Request, res: Response) => {
    try {
      // Optional billId parameter to get stats for a specific bill
      const { billId } = req.query;
      
      let query = db.select({
        id: pointsOfOrder.id,
        status: pointsOfOrder.status,
        type: pointsOfOrder.type,
        severity: pointsOfOrder.severity,
        ruleReference: pointsOfOrder.ruleReference,
      }).from(pointsOfOrder).$dynamic();
      
      if (billId) {
        query = query.where(eq(pointsOfOrder.billId, billId as string));
      }
      
      const pointsOfOrderData = await query;
      
      // Generate statistics by status
      const byStatus = {
        sustained: pointsOfOrderData.filter(poo => poo.status === 'sustained').length,
        overruled: pointsOfOrderData.filter(poo => poo.status === 'overruled').length,
        pending: pointsOfOrderData.filter(poo => poo.status === 'pending').length,
      };
      
      // Generate statistics by severity
      const bySeverity = {
        high: pointsOfOrderData.filter(poo => poo.severity === 'high').length,
        medium: pointsOfOrderData.filter(poo => poo.severity === 'medium').length,
        low: pointsOfOrderData.filter(poo => poo.severity === 'low').length,
      };
      
      // Generate statistics by type
      const byType: Record<string, number> = {};
      pointsOfOrderData.forEach(poo => {
        if (poo.type) {
          byType[poo.type] = (byType[poo.type] || 0) + 1;
        }
      });
      
      // Generate statistics by rule reference
      const byRuleReference: Record<string, number> = {};
      pointsOfOrderData.forEach(poo => {
        if (poo.ruleReference) {
          byRuleReference[poo.ruleReference] = (byRuleReference[poo.ruleReference] || 0) + 1;
        }
      });
      
      res.status(200).json({
        total: pointsOfOrderData.length,
        byStatus,
        bySeverity,
        byType,
        byRuleReference,
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching points of order statistics");
      res.status(500).json({ message: "Error fetching statistics" });
    }
  });

  /**
   * Get monthly trends in points of order 
   * Shows patterns over time
   */
  app.get("/api/points-of-order/trends", async (_req: Request, res: Response) => {
    try {
      // Get all points of order
      const pointsOfOrderData = await db.select().from(pointsOfOrder);
      
      // Group by month and status for trend analysis
      interface MonthGroup {
        month: string;
        status: string;
        count: number;
        avg_severity: number;
      }
      
      const monthlyTrends: MonthGroup[] = [];
      const monthMap: Record<string, Record<string, {count: number, totalSeverity: number}>> = {};
      
      pointsOfOrderData.forEach(poo => {
        const createdAt = poo.createdAt || new Date();
        const month = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        const status = poo.status || 'unknown';
        const severity = poo.severity === 'high' ? 3 : poo.severity === 'medium' ? 2 : 1;
        
        if (!monthMap[month]) {
          monthMap[month] = {};
        }
        
        if (!monthMap[month][status]) {
          monthMap[month][status] = { count: 0, totalSeverity: 0 };
        }
        
        monthMap[month][status].count += 1;
        monthMap[month][status].totalSeverity += severity;
      });
      
      // Convert map to array for the response
      Object.entries(monthMap).forEach(([month, statusMap]) => {
        Object.entries(statusMap).forEach(([status, data]) => {
          monthlyTrends.push({
            month,
            status,
            count: data.count,
            avg_severity: data.totalSeverity / data.count
          });
        });
      });
      
      // Sort by month ascending
      monthlyTrends.sort((a, b) => a.month.localeCompare(b.month));
      
      // Calculate success rates by point of order type
      interface TypeStats {
        type: string;
        total: number;
        sustained: number;
        success_rate: number;
      }
      
      const typeMap: Record<string, {total: number, sustained: number}> = {};
      
      pointsOfOrderData.forEach(poo => {
        const type = poo.type || 'unknown';
        
        if (!typeMap[type]) {
          typeMap[type] = { total: 0, sustained: 0 };
        }
        
        typeMap[type].total += 1;
        
        if (poo.status === 'sustained') {
          typeMap[type].sustained += 1;
        }
      });
      
      const typeSuccessRate: TypeStats[] = Object.entries(typeMap)
        .filter(([_, stats]) => stats.total >= 5) // Only include types with at least 5 occurrences
        .map(([type, stats]) => ({
          type,
          total: stats.total,
          sustained: stats.sustained,
          success_rate: (stats.sustained / stats.total) * 100
        }));
      
      res.status(200).json({
        monthlyTrends,
        typeSuccessRate
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching points of order trends");
      res.status(500).json({ message: "Error fetching trends" });
    }
  });
  
  /**
   * Get points of order rule references
   */
  app.get("/api/points-of-order/rule-references", async (_req: Request, res: Response) => {
    try {
      const ruleReferences = await db.select({
        ruleReference: pointsOfOrder.ruleReference,
        count: count(pointsOfOrder.id),
      })
      .from(pointsOfOrder).$dynamic()
      .where(not(isNull(pointsOfOrder.ruleReference)))
      .groupBy(pointsOfOrder.ruleReference)
      .orderBy(desc(count(pointsOfOrder.id)))
      .limit(20);
      
      res.status(200).json({ ruleReferences });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching rule references");
      res.status(500).json({ message: "Error fetching rule references" });
    }
  });
}