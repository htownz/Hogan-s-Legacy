/**
 * Debug routes for troubleshooting the application
 * These should be disabled in production
 */

import { Express, Request, Response } from "express";
import { pool } from "./db";
import { isAuthenticated } from "./auth";
import { isAdmin } from "./middleware/auth-middleware";
import { createLogger } from "./logger";
const log = createLogger("routes-debug");


export function registerDebugRoutes(app: Express): void {
  const shouldEnableDebugRoutes =
    process.env.NODE_ENV !== "production" || process.env.ENABLE_DEBUG_ROUTES === "true";

  if (!shouldEnableDebugRoutes) {
    log.info("Debug routes are disabled in production (set ENABLE_DEBUG_ROUTES=true to enable)");
    return;
  }

  /**
   * Get a count of all bills in the database
   */
  app.get("/api/debug/bills/count", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM bills');
      const count = parseInt(result.rows[0].count);
      
      res.status(200).json({
        count,
        message: `There are ${count} bills in the database.`
      });
    } catch (error: any) {
      log.error({ err: error }, "Error counting bills");
      res.status(500).json({ message: "Failed to count bills", error: String(error) });
    }
  });

  /**
   * Get sample bills to inspect their structure
   */
  app.get("/api/debug/bills/sample", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const result = await pool.query(
        'SELECT * FROM bills ORDER BY last_action_at DESC LIMIT $1',
        [limit]
      );
      
      res.status(200).json(result.rows);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching sample bills");
      res.status(500).json({ message: "Failed to fetch sample bills", error: String(error) });
    }
  });

  /**
   * Get details about bill data validity
   */
  app.get("/api/debug/bills/validity", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    try {
      // Check for bills with empty titles
      const emptyTitleResult = await pool.query(
        'SELECT COUNT(*) FROM bills WHERE title = $1',
        ['']
      );
      const emptyTitles = parseInt(emptyTitleResult.rows[0].count);
      
      // Check for bills with empty descriptions
      const emptyDescResult = await pool.query(
        'SELECT COUNT(*) FROM bills WHERE description = $1',
        ['']
      );
      const emptyDescriptions = parseInt(emptyDescResult.rows[0].count);
      
      // Check bill chamber distribution
      const chamberResult = await pool.query(
        'SELECT chamber, COUNT(*) FROM bills GROUP BY chamber'
      );
      
      // Check status distribution
      const statusResult = await pool.query(
        'SELECT status, COUNT(*) FROM bills GROUP BY status'
      );
      
      res.status(200).json({
        emptyTitles,
        emptyDescriptions,
        chamberDistribution: chamberResult.rows,
        statusDistribution: statusResult.rows,
      });
    } catch (error: any) {
      log.error({ err: error }, "Error checking bill validity");
      res.status(500).json({ message: "Failed to check bill validity", error: String(error) });
    }
  });
}