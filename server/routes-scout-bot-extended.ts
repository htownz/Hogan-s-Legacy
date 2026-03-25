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
      console.error("Error fetching extended scout bot profile:", error);
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
      console.error("Error checking crawl triggers:", error);
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
      console.error("Error updating transparency metrics:", error);
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
      console.error("Error fetching lobbyist reports:", error);
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
      console.error("Error adding lobbyist report:", error);
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
      console.error("Error deleting lobbyist report:", error);
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
      console.error("Error fetching campaign finances:", error);
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
      console.error("Error adding campaign finance:", error);
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
      console.error("Error deleting campaign finance:", error);
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
      console.error("Error fetching filing corrections:", error);
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
      console.error("Error adding filing correction:", error);
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
      console.error("Error deleting filing correction:", error);
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
      console.error("Error fetching firm registrations:", error);
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
      console.error("Error adding firm registration:", error);
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
      console.error("Error deleting firm registration:", error);
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
      console.error("Error fetching family appointments:", error);
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
      console.error("Error adding family appointment:", error);
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
      console.error("Error deleting family appointment:", error);
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
      console.error("Error fetching PAC leadership records:", error);
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
      console.error("Error adding PAC leadership record:", error);
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
      console.error("Error deleting PAC leadership record:", error);
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
      console.error("Error fetching legislative appearances:", error);
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
      console.error("Error adding legislative appearance:", error);
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
      console.error("Error deleting legislative appearance:", error);
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
      console.error("Error fetching entity relationships:", error);
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
      console.error("Error adding entity relationship:", error);
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
      console.error("Error deleting entity relationship:", error);
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
      console.error("Error fetching flags:", error);
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
      console.error("Error adding flag:", error);
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
      console.error("Error updating flag:", error);
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
      console.error("Error deleting flag:", error);
      res.status(500).json({ error: "Failed to delete flag" });
    }
  });
}