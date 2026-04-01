import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAdmin } from '../middleware/auth-middleware';
import { avatarService } from '../services/avatar-service';
import { StorageRequest } from '../types/request-types';
import { createLogger } from "../logger";
const log = createLogger("avatar-routes");


/**
 * Register avatar-related API routes
 */
export function registerAvatarRoutes(app: express.Application): void {
  const router = Router();

  /**
   * Generate or regenerate a cartoon avatar for a specific official
   * (Admin only)
   */
  router.post('/api/officials/:id/avatar', isAdmin, async (req: StorageRequest, res) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number()
      });
      
      const { id } = idSchema.parse(req.params);
      
      // Get the official from the database
      if (!req.storage || !req.storage.officials) {
        return res.status(500).json({ error: 'Storage not available' });
      }
      const official = await req.storage.officials.getOfficialById(id);
      
      if (!official) {
        return res.status(404).json({ error: 'Official not found' });
      }
      
      // Generate the avatar
      const avatarUrl = await avatarService.generateCartoonAvatar(official);
      
      if (!avatarUrl) {
        return res.status(500).json({ error: 'Failed to generate avatar' });
      }
      
      return res.status(200).json({ 
        success: true, 
        avatarUrl 
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error generating avatar');
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Generate avatars for all officials who don't have one yet
   * (Admin only)
   */
  router.post('/api/officials/avatars/generate-missing', isAdmin, async (req: StorageRequest, res) => {
    try {
      // This is a long-running operation, so we'll run it in the background
      // and return immediately
      res.status(202).json({ 
        message: 'Avatar generation started. This may take several minutes.',
        status: 'processing'
      });
      
      // Continue processing in the background
      avatarService.generateMissingAvatars()
        .then(count => {
          log.info(`Generated ${count} avatars successfully`);
        })
        .catch(error => {
          log.error({ err: error }, 'Error generating missing avatars');
        });
    } catch (error: any) {
      log.error({ err: error }, 'Error starting avatar generation');
      // Client won't see this since we already responded
    }
  });

  /**
   * Regenerate avatars for officials by filter criteria (party, type, etc.)
   * (Admin only)
   */
  router.post('/api/officials/avatars/regenerate-by-filter', isAdmin, async (req: StorageRequest, res) => {
    try {
      // Validate request body
      const filterSchema = z.object({
        party: z.string().optional(),
        officialType: z.string().optional(),
        officialStatus: z.string().optional()
      });
      
      const filter = filterSchema.parse(req.body);
      
      // Ensure at least one filter is provided
      if (!filter.party && !filter.officialType && !filter.officialStatus) {
        return res.status(400).json({ 
          error: 'At least one filter criterion must be provided'
        });
      }
      
      // This is a long-running operation, so we'll run it in the background
      // and return immediately
      res.status(202).json({
        message: 'Avatar regeneration started. This may take several minutes.',
        status: 'processing',
        filter
      });
      
      // Continue processing in the background
      avatarService.regenerateAvatarsByFilter(filter)
        .then(count => {
          log.info(`Regenerated ${count} avatars successfully`);
        })
        .catch(error => {
          log.error({ err: error }, 'Error regenerating avatars');
        });
    } catch (error: any) {
      log.error({ err: error }, 'Error starting avatar regeneration');
      // Client won't see this since we already responded
    }
  });
  
  app.use(router);
}