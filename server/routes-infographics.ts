import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { isAdmin } from "./middleware/auth-middleware";
import { CustomRequest } from "./types";
import { infographicsStorage } from "./storage-infographics";
import { storage } from "./storage";
import { infographicGeneratorService } from "./services/infographic-generator-service";
import { insertInfographicSchema, insertInfographicShareSchema } from "@shared/schema-infographics";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

/**
 * Register infographics API routes
 */
export function registerInfographicsRoutes(app: Express): void {
  /**
   * Get all templates
   */
  app.get('/api/infographics/templates', async (_req: Request, res: Response) => {
    try {
      const templates = await infographicsStorage.getAllTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error('Error fetching infographic templates:', error);
      res.status(500).json({ error: 'Failed to fetch infographic templates' });
    }
  });

  /**
   * Get templates by type
   */
  app.get('/api/infographics/templates/type/:type', async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const templates = await infographicsStorage.getTemplatesByType(type);
      res.json(templates);
    } catch (error: any) {
      console.error('Error fetching infographic templates by type:', error);
      res.status(500).json({ error: 'Failed to fetch infographic templates' });
    }
  });

  /**
   * Get template by ID
   */
  app.get('/api/infographics/templates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }

      const template = await infographicsStorage.getTemplateById(id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error: any) {
      console.error('Error fetching infographic template:', error);
      res.status(500).json({ error: 'Failed to fetch infographic template' });
    }
  });

  /**
   * Create a new template (admin only in the future)
   */
  app.post('/api/infographics/templates', isAuthenticated, isAdmin, async (req: CustomRequest, res: Response) => {
    try {
      const template = await infographicsStorage.createTemplate(req.body);
      res.status(201).json(template);
    } catch (error: any) {
      console.error('Error creating infographic template:', error);
      res.status(500).json({ error: 'Failed to create infographic template' });
    }
  });

  /**
   * Get user's infographics
   */
  app.get('/api/infographics', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const infographics = await infographicsStorage.getUserInfographics(userId);
      res.json(infographics);
    } catch (error: any) {
      console.error('Error fetching user infographics:', error);
      res.status(500).json({ error: 'Failed to fetch infographics' });
    }
  });

  /**
   * Get infographic by ID
   */
  app.get('/api/infographics/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid infographic ID' });
      }

      const infographic = await infographicsStorage.getInfographicById(id);
      if (!infographic) {
        return res.status(404).json({ error: 'Infographic not found' });
      }

      // Increment view count for public infographics
      if (infographic.isPublic) {
        await infographicsStorage.incrementViewCount(id);
      }

      res.json(infographic);
    } catch (error: any) {
      console.error('Error fetching infographic:', error);
      res.status(500).json({ error: 'Failed to fetch infographic' });
    }
  });

  /**
   * Get infographics for a bill
   */
  app.get('/api/infographics/bill/:billId', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const infographics = await infographicsStorage.getBillInfographics(billId);
      res.json(infographics);
    } catch (error: any) {
      console.error('Error fetching bill infographics:', error);
      res.status(500).json({ error: 'Failed to fetch bill infographics' });
    }
  });

  /**
   * Search infographics
   */
  app.get('/api/infographics/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const infographics = await infographicsStorage.searchInfographics(query);
      res.json(infographics);
    } catch (error: any) {
      console.error('Error searching infographics:', error);
      res.status(500).json({ error: 'Failed to search infographics' });
    }
  });

  /**
   * Create a new infographic
   */
  app.post('/api/infographics', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const data = { ...req.body, userId };

      // Validate request body
      const validatedData = insertInfographicSchema.parse(data);

      const infographic = await infographicsStorage.createInfographic(validatedData);
      res.status(201).json(infographic);
    } catch (error: any) {
      console.error('Error creating infographic:', error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: 'Failed to create infographic' });
    }
  });

  /**
   * Update an infographic
   */
  app.patch('/api/infographics/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid infographic ID' });
      }

      const userId = req.user!.id;
      const updatedInfographic = await infographicsStorage.updateInfographic(id, userId, req.body);
      
      if (!updatedInfographic) {
        return res.status(404).json({ error: 'Infographic not found or you do not have permission to update it' });
      }

      res.json(updatedInfographic);
    } catch (error: any) {
      console.error('Error updating infographic:', error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: 'Failed to update infographic' });
    }
  });

  /**
   * Delete an infographic
   */
  app.delete('/api/infographics/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid infographic ID' });
      }

      const userId = req.user!.id;
      await infographicsStorage.deleteInfographic(id, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting infographic:', error);
      res.status(500).json({ error: 'Failed to delete infographic' });
    }
  });

  /**
   * Get shares for an infographic
   */
  app.get('/api/infographics/:id/shares', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid infographic ID' });
      }

      const shares = await infographicsStorage.getInfographicShares(id);
      res.json(shares);
    } catch (error: any) {
      console.error('Error fetching infographic shares:', error);
      res.status(500).json({ error: 'Failed to fetch infographic shares' });
    }
  });

  /**
   * Share an infographic
   */
  app.post('/api/infographics/:id/share', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const infographicId = parseInt(req.params.id);
      if (isNaN(infographicId)) {
        return res.status(400).json({ error: 'Invalid infographic ID' });
      }

      const userId = req.user!.id;
      const data = { ...req.body, infographicId, userId };

      // Validate request body
      const validatedData = insertInfographicShareSchema.parse(data);

      const share = await infographicsStorage.createInfographicShare(validatedData);
      res.status(201).json(share);
    } catch (error: any) {
      console.error('Error sharing infographic:', error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: 'Failed to share infographic' });
    }
  });

  /**
   * Record a click on a shared infographic
   */
  app.post('/api/infographics/shares/:id/click', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid share ID' });
      }

      const updatedShare = await infographicsStorage.incrementShareClickCount(id);
      if (!updatedShare) {
        return res.status(404).json({ error: 'Share not found' });
      }

      res.json(updatedShare);
    } catch (error: any) {
      console.error('Error recording share click:', error);
      res.status(500).json({ error: 'Failed to record share click' });
    }
  });

  /**
   * Generate an infographic for a bill
   */
  app.post('/api/infographics/generate/bill/:billId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const { templateId, title, description, themeColor, isPublic } = req.body;
      
      // Get bill data
      const bill = await storage.getBillById(billId);
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      
      // Get template if specified
      let template = undefined;
      if (templateId) {
        template = await infographicsStorage.getTemplateById(parseInt(templateId));
      }
      
      // Generate SVG content
      const svgContent = infographicGeneratorService.generateBillInfographic({ bill }, template);
      
      // Create the infographic record
      const infographic = await infographicsStorage.createInfographic({
        userId: req.user!.id,
        title: title || `${bill.id}: ${bill.title}`,
        description: description || `Infographic for ${bill.id}: ${bill.title}`,
        svgContent,
        templateType: 'bill',
        themeColor: themeColor || '#FF6400',
        dataSource: { billId: bill.id },
        billId: bill.id,
        isPublic: isPublic !== undefined ? isPublic : true
      });
      
      res.status(201).json(infographic);
    } catch (error: any) {
      console.error('Error generating bill infographic:', error);
      res.status(500).json({ error: 'Failed to generate bill infographic' });
    }
  });

  /**
   * Generate a voting infographic
   */
  app.post('/api/infographics/generate/voting', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { templateId, title, description, themeColor, isPublic, votingData } = req.body;
      
      if (!votingData) {
        return res.status(400).json({ error: 'Voting data is required' });
      }
      
      // Get template if specified
      let template = undefined;
      if (templateId) {
        template = await infographicsStorage.getTemplateById(parseInt(templateId));
      }
      
      // Generate SVG content
      const svgContent = infographicGeneratorService.generateVotingInfographic(votingData, template);
      
      // Create the infographic record
      const infographic = await infographicsStorage.createInfographic({
        userId: req.user!.id,
        title: title || `Election: ${votingData.election.title}`,
        description: description || `Voting information for ${votingData.election.title}`,
        svgContent,
        templateType: 'voting',
        themeColor: themeColor || '#FF6400',
        dataSource: votingData,
        isPublic: isPublic !== undefined ? isPublic : true
      });
      
      res.status(201).json(infographic);
    } catch (error: any) {
      console.error('Error generating voting infographic:', error);
      res.status(500).json({ error: 'Failed to generate voting infographic' });
    }
  });

  /**
   * Generate a civic action infographic
   */
  app.post('/api/infographics/generate/civic-action', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { templateId, title, description, themeColor, isPublic, actionData } = req.body;
      
      if (!actionData) {
        return res.status(400).json({ error: 'Civic action data is required' });
      }
      
      // Get template if specified
      let template = undefined;
      if (templateId) {
        template = await infographicsStorage.getTemplateById(parseInt(templateId));
      }
      
      // Generate SVG content
      const svgContent = infographicGeneratorService.generateCivicActionInfographic(actionData, template);
      
      // Create the infographic record
      const infographic = await infographicsStorage.createInfographic({
        userId: req.user!.id,
        title: title || `${actionData.actionType}: ${actionData.title}`,
        description: description || actionData.description,
        svgContent,
        templateType: 'civic_action',
        themeColor: themeColor || '#FF6400',
        dataSource: actionData,
        isPublic: isPublic !== undefined ? isPublic : true
      });
      
      res.status(201).json(infographic);
    } catch (error: any) {
      console.error('Error generating civic action infographic:', error);
      res.status(500).json({ error: 'Failed to generate civic action infographic' });
    }
  });

  /**
   * Generate an impact infographic
   */
  app.post('/api/infographics/generate/impact', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { templateId, title, description, themeColor, isPublic, impactData } = req.body;
      
      if (!impactData) {
        return res.status(400).json({ error: 'Impact data is required' });
      }
      
      // Get template if specified
      let template = undefined;
      if (templateId) {
        template = await infographicsStorage.getTemplateById(parseInt(templateId));
      }
      
      // Generate SVG content
      const svgContent = infographicGeneratorService.generateImpactInfographic(impactData, template);
      
      // Create the infographic record
      const infographic = await infographicsStorage.createInfographic({
        userId: req.user!.id,
        title: title || impactData.title,
        description: description || impactData.description,
        svgContent,
        templateType: 'impact',
        themeColor: themeColor || '#FF6400',
        dataSource: impactData,
        isPublic: isPublic !== undefined ? isPublic : true
      });
      
      res.status(201).json(infographic);
    } catch (error: any) {
      console.error('Error generating impact infographic:', error);
      res.status(500).json({ error: 'Failed to generate impact infographic' });
    }
  });
}