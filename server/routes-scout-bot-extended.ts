import { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { getScoutBotProfileById } from "./storage-scout-bot";
import {
  addCampaignFinance,
  addEntityRelationship,
  addFamilyAppointment,
  addFilingCorrection,
  addFirmRegistration,
  addLegislativeAppearance,
  addLobbyistReport,
  addPacLeadership,
  checkCrawlTriggers,
  createFlag,
  deleteCampaignFinance,
  deleteEntityRelationship,
  deleteFamilyAppointment,
  deleteFilingCorrection,
  deleteFlag,
  deleteFirmRegistration,
  deleteLegislativeAppearance,
  deleteLobbyistReport,
  deletePacLeadership,
  getCampaignFinances,
  getCompleteExtendedProfile,
  getEntityRelationships,
  getFamilyAppointments,
  getFilingCorrections,
  getFlags,
  getFirmRegistrations,
  getLegislativeAppearances,
  getLobbyistReports,
  getPacLeaderships,
  updateFlag,
  updateProfileTransparencyMetrics
} from "./storage-scout-bot-extended";
import {
  insertScoutBotCampaignFinanceSchema,
  insertScoutBotEntityRelationshipSchema,
  insertScoutBotFamilyAppointmentSchema,
  insertScoutBotFilingCorrectionSchema,
  insertScoutBotFirmRegistrationSchema,
  insertScoutBotFlagSchema,
  insertScoutBotLegislativeAppearanceSchema,
  insertScoutBotLobbyistReportSchema,
  insertScoutBotPacLeadershipSchema
} from "../shared/schema-scout-bot-extended";
import { createLogger } from "./logger";
const log = createLogger("routes-scout-bot-extended");


/**
 * Register extended Scout Bot API routes
 */
export function registerExtendedScoutBotRoutes(app: Express) {
  /**
   * Get a complete profile with all extended data
   */
  app.get("/api/scout-bot/profiles/:id/extended", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await getCompleteExtendedProfile(id);
      
      if (!result.profile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      res.json(result);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching extended scout bot profile");
      res.status(500).json({ error: "Failed to fetch extended scout bot profile" });
    }
  });
  
  /**
   * Check if a profile meets crawl triggers criteria
   */
  app.get("/api/scout-bot/profiles/:id/check-crawl-triggers", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const result = await checkCrawlTriggers(id);
      res.json(result);
    } catch (error: any) {
      log.error({ err: error }, "Error checking crawl triggers");
      res.status(500).json({ error: "Failed to check crawl triggers" });
    }
  });
  
  /**
   * Update profile transparency metrics
   */
  app.patch("/api/scout-bot/profiles/:id/transparency", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { transparencyScore, flagCount, datasetsFoundIn } = req.body;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const result = await updateProfileTransparencyMetrics(
        id,
        transparencyScore,
        flagCount,
        datasetsFoundIn
      );
      
      if (result) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to update transparency metrics" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error updating transparency metrics");
      res.status(500).json({ error: "Failed to update transparency metrics" });
    }
  });

  /**
   * Lobbyist Reports routes
   */
  app.get("/api/scout-bot/profiles/:id/lobbyist-reports", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const reports = await getLobbyistReports(id);
      res.json(reports);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching lobbyist reports");
      res.status(500).json({ error: "Failed to fetch lobbyist reports" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/lobbyist-reports", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create report
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotLobbyistReportSchema.parse(data);
      
      const report = await addLobbyistReport(validatedData);
      res.status(201).json(report);
    } catch (error: any) {
      log.error({ err: error }, "Error adding lobbyist report");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add lobbyist report" });
    }
  });
  
  app.delete("/api/scout-bot/lobbyist-reports/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteLobbyistReport(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Lobbyist report not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting lobbyist report");
      res.status(500).json({ error: "Failed to delete lobbyist report" });
    }
  });

  /**
   * Campaign Finance routes
   */
  app.get("/api/scout-bot/profiles/:id/campaign-finances", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const finances = await getCampaignFinances(id);
      res.json(finances);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching campaign finances");
      res.status(500).json({ error: "Failed to fetch campaign finances" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/campaign-finances", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create finance record
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotCampaignFinanceSchema.parse(data);
      
      const finance = await addCampaignFinance(validatedData);
      res.status(201).json(finance);
    } catch (error: any) {
      log.error({ err: error }, "Error adding campaign finance");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add campaign finance" });
    }
  });
  
  app.delete("/api/scout-bot/campaign-finances/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteCampaignFinance(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Campaign finance record not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting campaign finance");
      res.status(500).json({ error: "Failed to delete campaign finance" });
    }
  });

  /**
   * Filing Corrections routes
   */
  app.get("/api/scout-bot/profiles/:id/filing-corrections", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const corrections = await getFilingCorrections(id);
      res.json(corrections);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching filing corrections");
      res.status(500).json({ error: "Failed to fetch filing corrections" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/filing-corrections", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create correction
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotFilingCorrectionSchema.parse(data);
      
      const correction = await addFilingCorrection(validatedData);
      res.status(201).json(correction);
    } catch (error: any) {
      log.error({ err: error }, "Error adding filing correction");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add filing correction" });
    }
  });
  
  app.delete("/api/scout-bot/filing-corrections/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteFilingCorrection(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Filing correction not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting filing correction");
      res.status(500).json({ error: "Failed to delete filing correction" });
    }
  });

  /**
   * Firm Registrations routes
   */
  app.get("/api/scout-bot/profiles/:id/firm-registrations", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const registrations = await getFirmRegistrations(id);
      res.json(registrations);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching firm registrations");
      res.status(500).json({ error: "Failed to fetch firm registrations" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/firm-registrations", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create registration
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotFirmRegistrationSchema.parse(data);
      
      const registration = await addFirmRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error: any) {
      log.error({ err: error }, "Error adding firm registration");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add firm registration" });
    }
  });
  
  app.delete("/api/scout-bot/firm-registrations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteFirmRegistration(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Firm registration not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting firm registration");
      res.status(500).json({ error: "Failed to delete firm registration" });
    }
  });

  /**
   * Family Appointments routes
   */
  app.get("/api/scout-bot/profiles/:id/family-appointments", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const appointments = await getFamilyAppointments(id);
      res.json(appointments);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching family appointments");
      res.status(500).json({ error: "Failed to fetch family appointments" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/family-appointments", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create appointment
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotFamilyAppointmentSchema.parse(data);
      
      const appointment = await addFamilyAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error: any) {
      log.error({ err: error }, "Error adding family appointment");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add family appointment" });
    }
  });
  
  app.delete("/api/scout-bot/family-appointments/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteFamilyAppointment(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Family appointment not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting family appointment");
      res.status(500).json({ error: "Failed to delete family appointment" });
    }
  });

  /**
   * PAC Leadership routes
   */
  app.get("/api/scout-bot/profiles/:id/pac-leadership", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const pacLeaderships = await getPacLeaderships(id);
      res.json(pacLeaderships);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching PAC leadership records");
      res.status(500).json({ error: "Failed to fetch PAC leadership records" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/pac-leadership", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create PAC leadership record
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotPacLeadershipSchema.parse(data);
      
      const pacLeadership = await addPacLeadership(validatedData);
      res.status(201).json(pacLeadership);
    } catch (error: any) {
      log.error({ err: error }, "Error adding PAC leadership record");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add PAC leadership record" });
    }
  });
  
  app.delete("/api/scout-bot/pac-leadership/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deletePacLeadership(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "PAC leadership record not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting PAC leadership record");
      res.status(500).json({ error: "Failed to delete PAC leadership record" });
    }
  });

  /**
   * Legislative Appearances routes
   */
  app.get("/api/scout-bot/profiles/:id/legislative-appearances", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const appearances = await getLegislativeAppearances(id);
      res.json(appearances);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching legislative appearances");
      res.status(500).json({ error: "Failed to fetch legislative appearances" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/legislative-appearances", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create appearance
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotLegislativeAppearanceSchema.parse(data);
      
      const appearance = await addLegislativeAppearance(validatedData);
      res.status(201).json(appearance);
    } catch (error: any) {
      log.error({ err: error }, "Error adding legislative appearance");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add legislative appearance" });
    }
  });
  
  app.delete("/api/scout-bot/legislative-appearances/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteLegislativeAppearance(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Legislative appearance not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting legislative appearance");
      res.status(500).json({ error: "Failed to delete legislative appearance" });
    }
  });

  /**
   * Entity Relationships routes
   */
  app.get("/api/scout-bot/profiles/:id/relationships", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const includeTargeted = req.query.includeTargeted === 'true';
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const relationships = await getEntityRelationships(id, includeTargeted);
      res.json(relationships);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching entity relationships");
      res.status(500).json({ error: "Failed to fetch entity relationships" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/relationships", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create relationship
      const data = { ...req.body, source_profile_id: id };
      const validatedData = insertScoutBotEntityRelationshipSchema.parse(data);
      
      const relationship = await addEntityRelationship(validatedData);
      res.status(201).json(relationship);
    } catch (error: any) {
      log.error({ err: error }, "Error adding entity relationship");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add entity relationship" });
    }
  });
  
  app.delete("/api/scout-bot/relationships/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteEntityRelationship(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Entity relationship not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting entity relationship");
      res.status(500).json({ error: "Failed to delete entity relationship" });
    }
  });

  /**
   * Flags routes
   */
  app.get("/api/scout-bot/profiles/:id/flags", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const flags = await getFlags(id);
      res.json(flags);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching flags");
      res.status(500).json({ error: "Failed to fetch flags" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/flags", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create flag
      const data = { ...req.body, profile_id: id };
      const validatedData = insertScoutBotFlagSchema.parse(data);
      
      const flag = await createFlag(validatedData);
      res.status(201).json(flag);
    } catch (error: any) {
      log.error({ err: error }, "Error adding flag");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add flag" });
    }
  });
  
  app.patch("/api/scout-bot/flags/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate update data
      const updateSchema = insertScoutBotFlagSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedFlag = await updateFlag(id, validatedData);
      
      if (updatedFlag) {
        res.json(updatedFlag);
      } else {
        res.status(404).json({ error: "Flag not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error updating flag");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update flag" });
    }
  });
  
  app.delete("/api/scout-bot/flags/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteFlag(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Flag not found" });
      }
    } catch (error: any) {
      log.error({ err: error }, "Error deleting flag");
      res.status(500).json({ error: "Failed to delete flag" });
    }
  });
}