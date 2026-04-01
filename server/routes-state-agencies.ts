/**
 * State Agency API Routes
 * 
 * This file contains API routes for accessing Texas state agency data:
 * - State agencies information
 * - Agency bill reports and analyses
 * - Legislative contacts
 * - Agency initiatives related to legislation
 */

import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { db } from "./db";
import { 
  stateAgencies, 
  agencyBillReports,
  agencyLegislativeContacts,
  agencyInitiatives,
  bills,
  insertAgencyBillReportSchema,
  insertAgencyLegislativeContactSchema,
  insertAgencyInitiativeSchema
} from "@shared/schema";
import { 
  eq, 
  and, 
  like, 
  or, 
  desc, 
  asc, 
  gte, 
  lte, 
  inArray, 
  sql
} from "drizzle-orm";
import { z } from "zod";
import { createLogger } from "./logger";
const log = createLogger("routes-state-agencies");


/**
 * Register state agency API routes
 */
export function registerStateAgencyRoutes(app: Express): void {
  /**
   * Get all state agencies
   */
  app.get("/api/state-agencies", async (_req: Request, res: Response) => {
    try {
      const agencies = await db.query.stateAgencies.findMany({
        orderBy: [asc(stateAgencies.name)]
      });
      
      res.json(agencies);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching state agencies");
      res.status(500).json({ message: "Error fetching state agencies" });
    }
  });

  /**
   * Get a specific state agency by ID
   */
  app.get("/api/state-agencies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const agency = await db.query.stateAgencies.findFirst({
        where: eq(stateAgencies.id, id)
      });
      
      if (!agency) {
        return res.status(404).json({ message: "State agency not found" });
      }
      
      res.json(agency);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching state agency ${req.params.id}`);
      res.status(500).json({ message: "Error fetching state agency" });
    }
  });

  /**
   * Get all agency bill reports
   */
  app.get("/api/agency-reports", async (req: Request, res: Response) => {
    try {
      const { 
        agencyId, 
        billId, 
        limit = '20', 
        offset = '0',
        sort = 'date',
        order = 'desc' 
      } = req.query;
      
      // Build the query with filters
      let query = db.select().from(agencyBillReports).$dynamic();
      
      if (agencyId) {
        query = query.where(eq(agencyBillReports.agencyId, agencyId as string));
      }
      
      if (billId) {
        // This requires a more complex query since billIds is an array
        query = query.where(
          sql`${billId}::text = ANY(${agencyBillReports.billIds})`
        );
      }
      
      // Apply sorting
      if (sort === 'date') {
        if (order === 'asc') {
          query = query.orderBy(asc(agencyBillReports.publishDate));
        } else {
          query = query.orderBy(desc(agencyBillReports.publishDate));
        }
      } else if (sort === 'title') {
        if (order === 'asc') {
          query = query.orderBy(asc(agencyBillReports.title));
        } else {
          query = query.orderBy(desc(agencyBillReports.title));
        }
      }
      
      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string));
      
      const reports = await query;
      
      // Get the total count for pagination
      const countQuery = db.select({ count: sql`count(*)` }).from(agencyBillReports);
      if (agencyId) {
        countQuery.where(eq(agencyBillReports.agencyId, agencyId as string));
      }
      if (billId) {
        countQuery.where(
          sql`${billId}::text = ANY(${agencyBillReports.billIds})`
        );
      }
      
      const [countResult] = await countQuery;
      const totalCount = Number(countResult?.count || 0);
      
      // For each report, fetch the agency name
      const reportsWithAgency = await Promise.all(
        reports.map(async (report) => {
          const agency = await db.query.stateAgencies.findFirst({
            where: eq(stateAgencies.id, report.agencyId)
          });
          
          return {
            ...report,
            agencyName: agency?.name || 'Unknown Agency'
          };
        })
      );
      
      res.json({
        reports: reportsWithAgency,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching agency reports");
      res.status(500).json({ message: "Error fetching agency reports" });
    }
  });

  /**
   * Get a specific agency bill report by ID
   */
  app.get("/api/agency-reports/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const report = await db.query.agencyBillReports.findFirst({
        where: eq(agencyBillReports.id, parseInt(id))
      });
      
      if (!report) {
        return res.status(404).json({ message: "Agency report not found" });
      }
      
      // Get the agency
      const agency = await db.query.stateAgencies.findFirst({
        where: eq(stateAgencies.id, report.agencyId)
      });
      
      // Get information about the bills referenced
      let billDetails: any[] = [];
      
      if (report.billIds && report.billIds.length > 0) {
        billDetails = await Promise.all(
          report.billIds.map(async (billId) => {
            const bill = await db.query.bills.findFirst({
              where: eq(bills.id, billId)
            });
            
            return bill || { id: billId, title: 'Unknown Bill' };
          })
        );
      }
      
      res.json({
        ...report,
        agency,
        bills: billDetails
      });
    } catch (error: any) {
      log.error({ err: error }, `Error fetching agency report ${req.params.id}`);
      res.status(500).json({ message: "Error fetching agency report" });
    }
  });

  /**
   * Get all agency reports related to a specific bill
   */
  app.get("/api/bills/:billId/agency-reports", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Find bill first to confirm it exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId)
      });
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // This requires a more complex query since billIds is an array
      const reports = await db.query.agencyBillReports.findMany({
        where: sql`${billId}::text = ANY(${agencyBillReports.billIds})`,
        orderBy: [desc(agencyBillReports.publishDate)]
      });
      
      // Fetch agency names for each report
      const reportsWithAgency = await Promise.all(
        reports.map(async (report) => {
          const agency = await db.query.stateAgencies.findFirst({
            where: eq(stateAgencies.id, report.agencyId)
          });
          
          return {
            ...report,
            agencyName: agency?.name || 'Unknown Agency'
          };
        })
      );
      
      res.json(reportsWithAgency);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching agency reports for bill ${req.params.billId}`);
      res.status(500).json({ message: "Error fetching agency reports for bill" });
    }
  });

  /**
   * Search agency reports
   */
  app.get("/api/agency-reports/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const reports = await db.query.agencyBillReports.findMany({
        where: or(
          like(agencyBillReports.title, `%${query}%`),
          like(agencyBillReports.summary, `%${query}%`)
        ),
        orderBy: [desc(agencyBillReports.publishDate)],
        limit: 20
      });
      
      // Fetch agency names for each report
      const reportsWithAgency = await Promise.all(
        reports.map(async (report) => {
          const agency = await db.query.stateAgencies.findFirst({
            where: eq(stateAgencies.id, report.agencyId)
          });
          
          return {
            ...report,
            agencyName: agency?.name || 'Unknown Agency'
          };
        })
      );
      
      res.json(reportsWithAgency);
    } catch (error: any) {
      log.error({ err: error }, `Error searching agency reports`);
      res.status(500).json({ message: "Error searching agency reports" });
    }
  });

  /**
   * Get all agency legislative contacts
   */
  app.get("/api/agency-contacts", async (req: Request, res: Response) => {
    try {
      const { agencyId } = req.query;
      
      let query = db.select().from(agencyLegislativeContacts).$dynamic();
      
      if (agencyId) {
        query = query.where(eq(agencyLegislativeContacts.agencyId, agencyId as string));
      }
      
      query = query.orderBy(asc(agencyLegislativeContacts.name));
      
      const contacts = await query;
      
      // Fetch agency names for each contact
      const contactsWithAgency = await Promise.all(
        contacts.map(async (contact) => {
          const agency = await db.query.stateAgencies.findFirst({
            where: eq(stateAgencies.id, contact.agencyId)
          });
          
          return {
            ...contact,
            agencyName: agency?.name || 'Unknown Agency'
          };
        })
      );
      
      res.json(contactsWithAgency);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching agency contacts");
      res.status(500).json({ message: "Error fetching agency contacts" });
    }
  });

  /**
   * Get all agency initiatives
   */
  app.get("/api/agency-initiatives", async (req: Request, res: Response) => {
    try {
      const { agencyId, status } = req.query;
      
      let query = db.select().from(agencyInitiatives).$dynamic();
      
      if (agencyId) {
        query = query.where(eq(agencyInitiatives.agencyId, agencyId as string));
      }
      
      if (status) {
        query = query.where(eq(agencyInitiatives.status, status as string));
      }
      
      query = query.orderBy(desc(agencyInitiatives.startDate));
      
      const initiatives = await query;
      
      // Fetch agency names for each initiative
      const initiativesWithAgency = await Promise.all(
        initiatives.map(async (initiative) => {
          const agency = await db.query.stateAgencies.findFirst({
            where: eq(stateAgencies.id, initiative.agencyId)
          });
          
          return {
            ...initiative,
            agencyName: agency?.name || 'Unknown Agency'
          };
        })
      );
      
      res.json(initiativesWithAgency);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching agency initiatives");
      res.status(500).json({ message: "Error fetching agency initiatives" });
    }
  });

  /**
   * Get related agencies for a bill
   */
  app.get("/api/bills/:billId/related-agencies", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Find bill first to confirm it exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId)
      });
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Find reports that mention this bill
      const reports = await db.query.agencyBillReports.findMany({
        where: sql`${billId}::text = ANY(${agencyBillReports.billIds})`
      });
      
      // Get unique agency IDs using object keys to avoid Set iteration issues
      const agencyIdsMap: {[key: string]: boolean} = {};
      reports.forEach(report => agencyIdsMap[report.agencyId] = true);
      const agencyIds = Object.keys(agencyIdsMap);
      
      if (agencyIds.length === 0) {
        return res.json([]);
      }
      
      // Get agency details
      const agencies = await db.query.stateAgencies.findMany({
        where: inArray(stateAgencies.id, agencyIds)
      });
      
      // For each agency, count how many reports mention this bill
      const agenciesWithReportCount = await Promise.all(
        agencies.map(async (agency) => {
          const count = reports.filter(report => report.agencyId === agency.id).length;
          
          return {
            ...agency,
            reportCount: count
          };
        })
      );
      
      // Sort by report count (most active agencies first)
      agenciesWithReportCount.sort((a, b) => b.reportCount - a.reportCount);
      
      res.json(agenciesWithReportCount);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching related agencies for bill ${req.params.billId}`);
      res.status(500).json({ message: "Error fetching related agencies for bill" });
    }
  });

  /**
   * Get trending agencies (most active in reports)
   */
  app.get("/api/trending/agencies", async (_req: Request, res: Response) => {
    try {
      // Get all agencies
      const agencies = await db.query.stateAgencies.findMany();
      
      // For each agency, count reports in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const agenciesWithActivity = await Promise.all(
        agencies.map(async (agency) => {
          const recentReports = await db.query.agencyBillReports.findMany({
            where: and(
              eq(agencyBillReports.agencyId, agency.id),
              gte(agencyBillReports.publishDate, thirtyDaysAgo)
            )
          });
          
          return {
            ...agency,
            recentReportCount: recentReports.length
          };
        })
      );
      
      // Sort by recent activity (most active first)
      agenciesWithActivity.sort((a, b) => b.recentReportCount - a.recentReportCount);
      
      // Return top 5
      res.json(agenciesWithActivity.slice(0, 5));
    } catch (error: any) {
      log.error({ err: error }, "Error fetching trending agencies");
      res.status(500).json({ message: "Error fetching trending agencies" });
    }
  });
}