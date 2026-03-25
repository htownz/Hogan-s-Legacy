import { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { getScoutBotProfileById } from "./storage-scout-bot";
import {
  addNetworkConnection,
  analyzeEntityRelationshipsForNetworks,
  createInfluenceNetwork,
  createInfluencePattern,
  deleteInfluenceNetwork,
  deleteInfluencePattern,
  deleteNetworkConnection,
  deleteTemporalInfluenceRecord,
  generateTemporalInfluenceData,
  getInfluenceNetwork,
  getInfluenceNetworks,
  getInfluencePattern,
  getInfluencePatterns,
  getInfluencePatternsInvolvingProfile,
  getNetworkConnections,
  getNetworkMembers,
  getProfileNetworks,
  getTemporalInfluence,
  removeNetworkMember,
  updateInfluenceNetwork,
  updateInfluencePattern,
  updateNetworkConnection,
  updateNetworkMember
} from "./storage-scout-bot-network";
import {
  insertScoutBotNetworkConnectionSchema,
  insertScoutBotInfluenceNetworkSchema,
  insertScoutBotNetworkMemberSchema,
  insertScoutBotInfluencePatternSchema,
  insertScoutBotTemporalInfluenceSchema
} from "../shared/schema-scout-bot-network";

/**
 * Register Scout Bot Network Analysis API routes
 */
export function registerScoutBotNetworkRoutes(app: Express) {
  /**
   * Network Connections
   */
  app.get("/api/scout-bot/profiles/:id/network-connections", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeIncoming } = req.query;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const connections = await getNetworkConnections(
        id, 
        includeIncoming === "true" || includeIncoming === "1"
      );
      
      res.json(connections);
    } catch (error: any) {
      console.error("Error fetching network connections:", error);
      res.status(500).json({ error: "Failed to fetch network connections" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/network-connections", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Validate and create connection
      const data = { ...req.body, source_profile_id: id };
      const validatedData = insertScoutBotNetworkConnectionSchema.parse(data);
      
      const connection = await addNetworkConnection(validatedData);
      res.status(201).json(connection);
    } catch (error: any) {
      console.error("Error adding network connection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add network connection" });
    }
  });
  
  app.patch("/api/scout-bot/network-connections/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate update data
      const updateSchema = insertScoutBotNetworkConnectionSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedConnection = await updateNetworkConnection(id, validatedData);
      
      if (!updatedConnection) {
        return res.status(404).json({ error: "Network connection not found" });
      }
      
      res.json(updatedConnection);
    } catch (error: any) {
      console.error("Error updating network connection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update network connection" });
    }
  });
  
  app.delete("/api/scout-bot/network-connections/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteNetworkConnection(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Network connection not found" });
      }
    } catch (error: any) {
      console.error("Error deleting network connection:", error);
      res.status(500).json({ error: "Failed to delete network connection" });
    }
  });
  
  /**
   * Influence Networks
   */
  app.get("/api/scout-bot/influence-networks", async (req: Request, res: Response) => {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        networkType,
        minEntityCount,
        verified
      } = req.query;
      
      const networks = await getInfluenceNetworks({
        limit: Number(limit),
        offset: Number(offset),
        networkType: networkType as string,
        minEntityCount: minEntityCount ? Number(minEntityCount) : undefined,
        verified: verified !== undefined ? Number(verified) : undefined
      });
      
      res.json(networks);
    } catch (error: any) {
      console.error("Error fetching influence networks:", error);
      res.status(500).json({ error: "Failed to fetch influence networks" });
    }
  });
  
  app.get("/api/scout-bot/influence-networks/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const network = await getInfluenceNetwork(id);
      
      if (!network) {
        return res.status(404).json({ error: "Influence network not found" });
      }
      
      // Get network members
      const members = await getNetworkMembers(id);
      
      res.json({ network, members });
    } catch (error: any) {
      console.error("Error fetching influence network:", error);
      res.status(500).json({ error: "Failed to fetch influence network" });
    }
  });
  
  app.post("/api/scout-bot/influence-networks", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate and create network
      const validatedData = insertScoutBotInfluenceNetworkSchema.parse(req.body);
      
      const network = await createInfluenceNetwork(validatedData);
      res.status(201).json(network);
    } catch (error: any) {
      console.error("Error creating influence network:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create influence network" });
    }
  });
  
  app.patch("/api/scout-bot/influence-networks/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate update data
      const updateSchema = insertScoutBotInfluenceNetworkSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedNetwork = await updateInfluenceNetwork(id, validatedData);
      
      if (!updatedNetwork) {
        return res.status(404).json({ error: "Influence network not found" });
      }
      
      res.json(updatedNetwork);
    } catch (error: any) {
      console.error("Error updating influence network:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update influence network" });
    }
  });
  
  app.delete("/api/scout-bot/influence-networks/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteInfluenceNetwork(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Influence network not found" });
      }
    } catch (error: any) {
      console.error("Error deleting influence network:", error);
      res.status(500).json({ error: "Failed to delete influence network" });
    }
  });
  
  /**
   * Profile Network Memberships
   */
  app.get("/api/scout-bot/profiles/:id/networks", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const networks = await getProfileNetworks(id);
      res.json(networks);
    } catch (error: any) {
      console.error("Error fetching profile networks:", error);
      res.status(500).json({ error: "Failed to fetch profile networks" });
    }
  });
  
  app.post("/api/scout-bot/influence-networks/:networkId/members", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { networkId } = req.params;
      
      // Check if network exists
      const existingNetwork = await getInfluenceNetwork(networkId);
      if (!existingNetwork) {
        return res.status(404).json({ error: "Influence network not found" });
      }
      
      // Validate and add member
      const data = { ...req.body, network_id: networkId };
      const validatedData = insertScoutBotNetworkMemberSchema.parse(data);
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(validatedData.profile_id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const member = await updateNetworkMember(networkId, validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error adding network member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add network member" });
    }
  });
  
  app.delete("/api/scout-bot/influence-networks/:networkId/members/:memberId", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { memberId } = req.params;
      const result = await removeNetworkMember(memberId);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Network member not found" });
      }
    } catch (error: any) {
      console.error("Error removing network member:", error);
      res.status(500).json({ error: "Failed to remove network member" });
    }
  });
  
  /**
   * Influence Patterns
   */
  app.get("/api/scout-bot/influence-patterns", async (req: Request, res: Response) => {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        patternType,
        minSeverity,
        minConfidence,
        verified,
        profileId
      } = req.query;
      
      const patterns = await getInfluencePatterns({
        limit: Number(limit),
        offset: Number(offset),
        patternType: patternType as string,
        minSeverity: minSeverity ? Number(minSeverity) : undefined,
        minConfidence: minConfidence ? Number(minConfidence) : undefined,
        verified: verified !== undefined ? Number(verified) : undefined,
        profileId: profileId as string
      });
      
      res.json(patterns);
    } catch (error: any) {
      console.error("Error fetching influence patterns:", error);
      res.status(500).json({ error: "Failed to fetch influence patterns" });
    }
  });
  
  app.get("/api/scout-bot/profiles/:id/influence-patterns", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const patterns = await getInfluencePatternsInvolvingProfile(id);
      res.json(patterns);
    } catch (error: any) {
      console.error("Error fetching profile influence patterns:", error);
      res.status(500).json({ error: "Failed to fetch profile influence patterns" });
    }
  });
  
  app.get("/api/scout-bot/influence-patterns/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pattern = await getInfluencePattern(id);
      
      if (!pattern) {
        return res.status(404).json({ error: "Influence pattern not found" });
      }
      
      res.json(pattern);
    } catch (error: any) {
      console.error("Error fetching influence pattern:", error);
      res.status(500).json({ error: "Failed to fetch influence pattern" });
    }
  });
  
  app.post("/api/scout-bot/influence-patterns", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate and create pattern
      const validatedData = insertScoutBotInfluencePatternSchema.parse(req.body);
      
      const pattern = await createInfluencePattern(validatedData);
      res.status(201).json(pattern);
    } catch (error: any) {
      console.error("Error creating influence pattern:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create influence pattern" });
    }
  });
  
  app.patch("/api/scout-bot/influence-patterns/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate update data
      const updateSchema = insertScoutBotInfluencePatternSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedPattern = await updateInfluencePattern(id, validatedData);
      
      if (!updatedPattern) {
        return res.status(404).json({ error: "Influence pattern not found" });
      }
      
      res.json(updatedPattern);
    } catch (error: any) {
      console.error("Error updating influence pattern:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update influence pattern" });
    }
  });
  
  app.delete("/api/scout-bot/influence-patterns/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteInfluencePattern(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Influence pattern not found" });
      }
    } catch (error: any) {
      console.error("Error deleting influence pattern:", error);
      res.status(500).json({ error: "Failed to delete influence pattern" });
    }
  });
  
  /**
   * Temporal Influence
   */
  app.get("/api/scout-bot/profiles/:id/temporal-influence", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startPeriod, endPeriod, limit = 8 } = req.query;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      const timelineData = await getTemporalInfluence(id, {
        startPeriod: startPeriod as string,
        endPeriod: endPeriod as string,
        limit: Number(limit)
      });
      
      res.json(timelineData);
    } catch (error: any) {
      console.error("Error fetching temporal influence:", error);
      res.status(500).json({ error: "Failed to fetch temporal influence data" });
    }
  });
  
  app.post("/api/scout-bot/profiles/:id/temporal-influence/:timePeriod", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id, timePeriod } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Generate temporal influence data
      const data = await generateTemporalInfluenceData(id, timePeriod);
      
      if (!data) {
        return res.status(500).json({ error: "Failed to generate temporal influence data" });
      }
      
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error generating temporal influence data:", error);
      res.status(500).json({ error: "Failed to generate temporal influence data" });
    }
  });
  
  app.delete("/api/scout-bot/temporal-influence/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await deleteTemporalInfluenceRecord(id);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Temporal influence record not found" });
      }
    } catch (error: any) {
      console.error("Error deleting temporal influence record:", error);
      res.status(500).json({ error: "Failed to delete temporal influence record" });
    }
  });
  
  /**
   * Network Analysis Actions
   */
  app.post("/api/scout-bot/profiles/:id/analyze-network", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if profile exists
      const existingProfile = await getScoutBotProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({ error: "Scout Bot profile not found" });
      }
      
      // Analyze entity relationships
      const analysisResults = await analyzeEntityRelationshipsForNetworks(id);
      
      res.json({
        success: true,
        profile_id: id,
        ...analysisResults,
        message: "Network analysis completed successfully"
      });
    } catch (error: any) {
      console.error("Error performing network analysis:", error);
      res.status(500).json({ error: "Failed to perform network analysis" });
    }
  });
}