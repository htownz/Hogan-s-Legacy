import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { powerInfluencersStorage } from './storage-power-influencers';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import {
  insertPowerInfluencerSchema,
  insertConsultantSchema,
  insertMegaInfluencerSchema,
  insertConsultantClientSchema,
  insertConsultantCampaignSchema,
  insertBillTopicInfluenceSchema,
  insertBillInfluenceRecordSchema,
  insertInfluencerConnectionSchema,
  insertInfluencerDonationSchema,
  insertInfluenceHeatmapDataSchema
} from '../shared/schema-power-influencers';
import { createLogger } from "./logger";
const log = createLogger("routes-power-influencers");


/**
 * Register Power Influencers API routes
 * 
 * These routes handle the Texas Ethics Transparency Engine functionality
 * for tracking consultant and mega influencer profiles, their connections,
 * donations, and influence on legislation.
 */
export function registerPowerInfluencersRoutes(app: Express): void {
  
  // =========================================================================
  // POWER INFLUENCER BASE ROUTES
  // =========================================================================
  
  /**
   * Get all power influencers
   */
  app.get('/api/power-influencers', async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      let influencers;
      
      if (type === 'consultant' || type === 'mega_influencer') {
        influencers = await powerInfluencersStorage.getPowerInfluencersByType(type);
      } else {
        influencers = await powerInfluencersStorage.getAllPowerInfluencers();
      }
      
      res.status(200).json(influencers);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching power influencers');
      res.status(500).json({ message: 'Error fetching power influencers' });
    }
  });
  
  /**
   * Search power influencers
   */
  app.get('/api/power-influencers/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ message: 'Search query must be at least 2 characters' });
      }
      
      const results = await powerInfluencersStorage.searchPowerInfluencers(query);
      res.status(200).json(results);
    } catch (error: any) {
      log.error({ err: error }, 'Error searching power influencers');
      res.status(500).json({ message: 'Error searching power influencers' });
    }
  });
  
  /**
   * Get power influencer by ID
   */
  app.get('/api/power-influencers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const influencer = await powerInfluencersStorage.getPowerInfluencerById(id);
      if (!influencer) {
        return res.status(404).json({ message: 'Power influencer not found' });
      }
      
      res.status(200).json(influencer);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching power influencer ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching power influencer' });
    }
  });
  
  /**
   * Create power influencer (admin only)
   */
  app.post('/api/power-influencers', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin (implement your admin check logic)
      // This is a placeholder - implement proper admin authentication
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const data = insertPowerInfluencerSchema.parse(req.body);
      const newInfluencer = await powerInfluencersStorage.createPowerInfluencer(data);
      
      res.status(201).json(newInfluencer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, 'Error creating power influencer');
        res.status(500).json({ message: 'Error creating power influencer' });
      }
    }
  });
  
  /**
   * Update power influencer (admin only)
   */
  app.patch('/api/power-influencers/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      // Validate partial data
      const data = insertPowerInfluencerSchema.partial().parse(req.body);
      
      const updatedInfluencer = await powerInfluencersStorage.updatePowerInfluencer(id, data);
      if (!updatedInfluencer) {
        return res.status(404).json({ message: 'Power influencer not found' });
      }
      
      res.status(200).json(updatedInfluencer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, `Error updating power influencer ${req.params.id}`);
        res.status(500).json({ message: 'Error updating power influencer' });
      }
    }
  });
  
  /**
   * Delete power influencer (admin only)
   */
  app.delete('/api/power-influencers/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const success = await powerInfluencersStorage.deletePowerInfluencer(id);
      if (!success) {
        return res.status(404).json({ message: 'Power influencer not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      log.error({ err: error }, `Error deleting power influencer ${req.params.id}`);
      res.status(500).json({ message: 'Error deleting power influencer' });
    }
  });
  
  // =========================================================================
  // INFLUENCER CARD ROUTES
  // =========================================================================
  
  /**
   * Get full influencer card data by ID (all related data)
   */
  app.get('/api/power-influencers/:id/card', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      try {
        const cardData = await powerInfluencersStorage.getInfluencerCardData(id);
        res.status(200).json(cardData);
      } catch (error: any) {
        return res.status(404).json({ message: 'Power influencer not found' });
      }
    } catch (error: any) {
      log.error({ err: error }, `Error fetching influencer card data ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching influencer card data' });
    }
  });
  
  // =========================================================================
  // CONSULTANT ROUTES
  // =========================================================================
  
  /**
   * Get all consultants
   */
  app.get('/api/consultants', async (req: Request, res: Response) => {
    try {
      const consultants = await powerInfluencersStorage.getAllConsultants();
      res.status(200).json(consultants);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching consultants');
      res.status(500).json({ message: 'Error fetching consultants' });
    }
  });
  
  /**
   * Get consultant by ID
   */
  app.get('/api/consultants/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const consultant = await powerInfluencersStorage.getConsultantById(id);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      res.status(200).json(consultant);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching consultant ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching consultant' });
    }
  });
  
  /**
   * Create consultant (admin only)
   */
  app.post('/api/consultants', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const data = insertConsultantSchema.parse(req.body);
      
      // Verify that the influencer exists and is of type 'consultant'
      const influencer = await powerInfluencersStorage.getPowerInfluencerById(data.influencerId);
      if (!influencer) {
        return res.status(404).json({ message: 'Influencer not found' });
      }
      
      if (influencer.type !== 'consultant') {
        return res.status(400).json({ message: 'Influencer must be of type "consultant"' });
      }
      
      const newConsultant = await powerInfluencersStorage.createConsultant(data);
      res.status(201).json(newConsultant);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, 'Error creating consultant');
        res.status(500).json({ message: 'Error creating consultant' });
      }
    }
  });
  
  /**
   * Update consultant (admin only)
   */
  app.patch('/api/consultants/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      // Validate partial data
      const data = insertConsultantSchema.partial().parse(req.body);
      
      const updatedConsultant = await powerInfluencersStorage.updateConsultant(id, data);
      if (!updatedConsultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      res.status(200).json(updatedConsultant);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, `Error updating consultant ${req.params.id}`);
        res.status(500).json({ message: 'Error updating consultant' });
      }
    }
  });
  
  /**
   * Get consultant clients
   */
  app.get('/api/consultants/:id/clients', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const consultant = await powerInfluencersStorage.getConsultantById(id);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      const clients = await powerInfluencersStorage.getConsultantClientsByConsultantId(id);
      res.status(200).json(clients);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching consultant clients ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching consultant clients' });
    }
  });
  
  /**
   * Add consultant client (admin only)
   */
  app.post('/api/consultants/:id/clients', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const consultantId = parseInt(req.params.id);
      if (isNaN(consultantId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const consultant = await powerInfluencersStorage.getConsultantById(consultantId);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      const data = insertConsultantClientSchema.parse({
        ...req.body,
        consultantId
      });
      
      const newClient = await powerInfluencersStorage.createConsultantClient(data);
      res.status(201).json(newClient);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, `Error adding consultant client ${req.params.id}`);
        res.status(500).json({ message: 'Error adding consultant client' });
      }
    }
  });
  
  /**
   * Get consultant campaigns
   */
  app.get('/api/consultants/:id/campaigns', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const consultant = await powerInfluencersStorage.getConsultantById(id);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      const campaigns = await powerInfluencersStorage.getConsultantCampaignsByConsultantId(id);
      res.status(200).json(campaigns);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching consultant campaigns ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching consultant campaigns' });
    }
  });
  
  /**
   * Add consultant campaign (admin only)
   */
  app.post('/api/consultants/:id/campaigns', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const consultantId = parseInt(req.params.id);
      if (isNaN(consultantId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const consultant = await powerInfluencersStorage.getConsultantById(consultantId);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      const data = insertConsultantCampaignSchema.parse({
        ...req.body,
        consultantId
      });
      
      const newCampaign = await powerInfluencersStorage.createConsultantCampaign(data);
      res.status(201).json(newCampaign);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, `Error adding consultant campaign ${req.params.id}`);
        res.status(500).json({ message: 'Error adding consultant campaign' });
      }
    }
  });
  
  // =========================================================================
  // MEGA INFLUENCER ROUTES
  // =========================================================================
  
  /**
   * Get all mega influencers
   */
  app.get('/api/mega-influencers', async (req: Request, res: Response) => {
    try {
      const megaInfluencers = await powerInfluencersStorage.getAllMegaInfluencers();
      res.status(200).json(megaInfluencers);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching mega influencers');
      res.status(500).json({ message: 'Error fetching mega influencers' });
    }
  });
  
  /**
   * Get mega influencer by ID
   */
  app.get('/api/mega-influencers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const megaInfluencer = await powerInfluencersStorage.getMegaInfluencerById(id);
      if (!megaInfluencer) {
        return res.status(404).json({ message: 'Mega influencer not found' });
      }
      
      res.status(200).json(megaInfluencer);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching mega influencer ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching mega influencer' });
    }
  });
  
  /**
   * Create mega influencer (admin only)
   */
  app.post('/api/mega-influencers', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const data = insertMegaInfluencerSchema.parse(req.body);
      
      // Verify that the influencer exists and is of type 'mega_influencer'
      const influencer = await powerInfluencersStorage.getPowerInfluencerById(data.influencerId);
      if (!influencer) {
        return res.status(404).json({ message: 'Influencer not found' });
      }
      
      if (influencer.type !== 'mega_influencer') {
        return res.status(400).json({ message: 'Influencer must be of type "mega_influencer"' });
      }
      
      const newMegaInfluencer = await powerInfluencersStorage.createMegaInfluencer(data);
      res.status(201).json(newMegaInfluencer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, 'Error creating mega influencer');
        res.status(500).json({ message: 'Error creating mega influencer' });
      }
    }
  });
  
  /**
   * Update mega influencer (admin only)
   */
  app.patch('/api/mega-influencers/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      // Validate partial data
      const data = insertMegaInfluencerSchema.partial().parse(req.body);
      
      const updatedMegaInfluencer = await powerInfluencersStorage.updateMegaInfluencer(id, data);
      if (!updatedMegaInfluencer) {
        return res.status(404).json({ message: 'Mega influencer not found' });
      }
      
      res.status(200).json(updatedMegaInfluencer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, `Error updating mega influencer ${req.params.id}`);
        res.status(500).json({ message: 'Error updating mega influencer' });
      }
    }
  });
  
  // =========================================================================
  // BILL INFLUENCE ROUTES
  // =========================================================================
  
  /**
   * Get bill influence by bill ID
   */
  app.get('/api/bills/:billId/influence', async (req: Request, res: Response) => {
    try {
      const billId = req.params.billId;
      
      const records = await powerInfluencersStorage.getBillInfluenceRecordsByBillId(billId);
      
      // Get full influencer data for each record
      const influencerRecords = await Promise.all(
        records.map(async (record) => {
          const influencer = await powerInfluencersStorage.getPowerInfluencerById(record.influencerId);
          return {
            record,
            influencer
          };
        })
      );
      
      res.status(200).json(influencerRecords);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching bill influence for ${req.params.billId}`);
      res.status(500).json({ message: 'Error fetching bill influence data' });
    }
  });
  
  /**
   * Get topic influence data
   */
  app.get('/api/bill-topics/:topic/influence', async (req: Request, res: Response) => {
    try {
      const topic = req.params.topic;
      
      const topicInfluence = await powerInfluencersStorage.getBillTopicInfluenceByTopic(topic);
      
      // Get full influencer data for each influence record
      const influencerRecords = await Promise.all(
        topicInfluence.map(async (record) => {
          const influencer = await powerInfluencersStorage.getPowerInfluencerById(record.influencerId);
          return {
            record,
            influencer
          };
        })
      );
      
      res.status(200).json(influencerRecords);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching topic influence for ${req.params.topic}`);
      res.status(500).json({ message: 'Error fetching topic influence data' });
    }
  });
  
  /**
   * Get bill influence records for an influencer
   */
  app.get('/api/power-influencers/:id/bill-influence', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const records = await powerInfluencersStorage.getBillInfluenceRecordsByInfluencerId(id);
      res.status(200).json(records);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching bill influence records for influencer ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching bill influence records' });
    }
  });
  
  /**
   * Add bill influence record (admin only)
   */
  app.post('/api/bill-influence-records', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const data = insertBillInfluenceRecordSchema.parse(req.body);
      const newRecord = await powerInfluencersStorage.createBillInfluenceRecord(data);
      res.status(201).json(newRecord);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, 'Error creating bill influence record');
        res.status(500).json({ message: 'Error creating bill influence record' });
      }
    }
  });
  
  // =========================================================================
  // DONATION ROUTES
  // =========================================================================
  
  /**
   * Get donations by influencer ID
   */
  app.get('/api/power-influencers/:id/donations', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const donations = await powerInfluencersStorage.getInfluencerDonationsByInfluencerId(id);
      res.status(200).json(donations);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching donations for influencer ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching influencer donations' });
    }
  });
  
  /**
   * Add donation record (admin only)
   */
  app.post('/api/influencer-donations', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const data = insertInfluencerDonationSchema.parse(req.body);
      const newDonation = await powerInfluencersStorage.createInfluencerDonation(data);
      res.status(201).json(newDonation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, 'Error creating influencer donation');
        res.status(500).json({ message: 'Error creating influencer donation' });
      }
    }
  });
  
  // =========================================================================
  // CONNECTION ROUTES
  // =========================================================================
  
  /**
   * Get connections by influencer ID
   */
  app.get('/api/power-influencers/:id/connections', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const connections = await powerInfluencersStorage.getInfluencerConnectionsByInfluencerId(id);
      res.status(200).json(connections);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching connections for influencer ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching influencer connections' });
    }
  });
  
  /**
   * Add connection record (admin only)
   */
  app.post('/api/influencer-connections', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const data = insertInfluencerConnectionSchema.parse(req.body);
      const newConnection = await powerInfluencersStorage.createInfluencerConnection(data);
      res.status(201).json(newConnection);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        log.error({ err: error }, 'Error creating influencer connection');
        res.status(500).json({ message: 'Error creating influencer connection' });
      }
    }
  });
  
  // =========================================================================
  // NETWORK VISUALIZATION ROUTES
  // =========================================================================
  
  /**
   * Get influence network visualization data
   */
  app.get('/api/power-influencers/:id/network', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      // Optional depth parameter
      const depth = req.query.depth ? parseInt(req.query.depth as string) : 1;
      if (isNaN(depth) || depth < 1 || depth > 3) {
        return res.status(400).json({ message: 'Depth must be between 1 and 3' });
      }
      
      const network = await powerInfluencersStorage.getInfluencerNetworkByInfluencerId(id, depth);
      res.status(200).json(network);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching network for influencer ${req.params.id}`);
      res.status(500).json({ message: 'Error fetching influencer network' });
    }
  });
  
  // =========================================================================
  // ANALYTICS & INSIGHTS ROUTES
  // =========================================================================
  
  /**
   * Get top influencers by donation amount
   */
  app.get('/api/power-influencers/top-by-donations', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: 'Limit must be between 1 and 100' });
      }
      
      const topInfluencers = await powerInfluencersStorage.getTopInfluencersByDonationAmount(limit);
      res.status(200).json(topInfluencers);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching top influencers by donation');
      res.status(500).json({ message: 'Error fetching top influencers' });
    }
  });
  
  /**
   * Get most influential consultants by success rate
   */
  app.get('/api/consultants/top-by-success', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: 'Limit must be between 1 and 100' });
      }
      
      const topConsultants = await powerInfluencersStorage.getMostInfluentialConsultantsBySuccessRate(limit);
      res.status(200).json(topConsultants);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching top consultants by success rate');
      res.status(500).json({ message: 'Error fetching top consultants' });
    }
  });
  
  /**
   * Get influencers by legislator
   */
  app.get('/api/legislators/:legislatorId/influencers', async (req: Request, res: Response) => {
    try {
      const legislatorId = parseInt(req.params.legislatorId);
      if (isNaN(legislatorId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const influencers = await powerInfluencersStorage.getInfluencersByLegislatorId(legislatorId);
      res.status(200).json(influencers);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching influencers for legislator ${req.params.legislatorId}`);
      res.status(500).json({ message: 'Error fetching influencers for legislator' });
    }
  });
}