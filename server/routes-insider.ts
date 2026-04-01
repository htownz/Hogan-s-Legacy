// @ts-nocheck
import { Request, Response, Express } from 'express';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { insiderStorage } from './storage-insider';
import { 
  insertInsiderUpdateSchema, 
  insertInsiderVerificationSchema,
  insertInsiderReactionSchema,
  insertInsiderSourceSchema,
  insertInsiderVerifierSchema
} from '../shared/schema-insider';
import { superUserStorage } from './storage-super-user';
import { createLogger } from "./logger";
const log = createLogger("routes-insider");


/**
 * Register insider updates API routes
 */
export function registerInsiderRoutes(app: Express): void {
  // ---- UPDATES ----
  /**
   * Get insider updates
   */
  app.get('/api/insider/updates', async (req: Request, res: Response) => {
    try {
      const { 
        userId, 
        billId, 
        committeeId, 
        updateType,
        verificationStatus,
        tag,
        limit,
        offset,
        includeExpired,
        sortBy
      } = req.query;
      
      // Parse query parameters
      const options: any = {
        userId: userId ? Number(userId) : undefined,
        billId: billId as string,
        committeeId: committeeId ? Number(committeeId) : undefined,
        updateType: updateType as string | string[],
        verificationStatus: verificationStatus as string | string[],
        tag: tag as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        includeExpired: includeExpired === 'true',
        sortBy: sortBy as 'newest' | 'importance' | 'verification'
      };
      
      // Handle array parameters
      if (updateType && typeof updateType === 'string' && updateType.includes(',')) {
        options.updateType = updateType.split(',');
      }
      
      if (verificationStatus && typeof verificationStatus === 'string' && verificationStatus.includes(',')) {
        options.verificationStatus = verificationStatus.split(',');
      }
      
      const updates = await insiderStorage.getUpdates(options);
      res.json(updates);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider updates');
      res.status(500).json({ error: 'Failed to retrieve insider updates' });
    }
  });
  
  /**
   * Get a specific insider update by ID
   */
  app.get('/api/insider/updates/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeDetails } = req.query;
      
      const update = await insiderStorage.getUpdateById(
        Number(id), 
        includeDetails === 'true'
      );
      
      if (!update) {
        return res.status(404).json({ error: 'Insider update not found' });
      }
      
      res.json(update);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider update');
      res.status(500).json({ error: 'Failed to retrieve insider update' });
    }
  });
  
  /**
   * Create a new insider update
   */
  app.post('/api/insider/updates', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { tags, ...updateData } = req.body;
      
      // Validate the request body
      const validatedData = insertInsiderUpdateSchema.safeParse(updateData);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid insider update data', 
          details: validatedData.error.errors 
        });
      }
      
      // Set the user ID from the authenticated user
      const data = {
        ...validatedData.data,
        userId: req.user.id
      };
      
      // Check if user is a super user or verified source for verification handling
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      // Updates from verified sources have better initial status
      if (isSuperUser || isVerifier) {
        data.verificationStatus = 'verified';
        data.verifiedBy = req.user.id;
      }
      
      // Create the update with optional tags
      const update = await insiderStorage.createUpdate(data, tags);
      res.status(201).json(update);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating insider update');
      res.status(500).json({ error: 'Failed to create insider update' });
    }
  });
  
  /**
   * Update an insider update
   */
  app.patch('/api/insider/updates/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { tags, ...updateData } = req.body;
      
      // Check if update exists and user has permission to edit it
      const existingUpdate = await insiderStorage.getUpdateById(Number(id));
      
      if (!existingUpdate) {
        return res.status(404).json({ error: 'Insider update not found' });
      }
      
      // Check if user is a verifier or super user for moderation privileges
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      // Only the creator or verifiers/super users can edit
      if (existingUpdate.userId !== req.user.id && !isSuperUser && !isVerifier) {
        return res.status(403).json({ 
          error: 'You do not have permission to edit this insider update' 
        });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertInsiderUpdateSchema.partial().safeParse(updateData);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid insider update data', 
          details: validatedData.error.errors 
        });
      }
      
      // Only verifiers can update verification fields
      if (!isVerifier && !isSuperUser) {
        delete validatedData.data.verificationStatus;
        delete validatedData.data.verifiedBy;
        delete validatedData.data.verificationNotes;
      }
      
      const updatedUpdate = await insiderStorage.updateUpdate(
        Number(id), 
        validatedData.data,
        tags
      );
      
      res.json(updatedUpdate);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating insider update');
      res.status(500).json({ error: 'Failed to update insider update' });
    }
  });
  
  /**
   * Delete an insider update
   */
  app.delete('/api/insider/updates/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if update exists and user has permission to delete it
      const existingUpdate = await insiderStorage.getUpdateById(Number(id));
      
      if (!existingUpdate) {
        return res.status(404).json({ error: 'Insider update not found' });
      }
      
      // Check if user is a verifier or super user for moderation privileges
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      // Only the creator or verifiers/super users can delete
      if (existingUpdate.userId !== req.user.id && !isSuperUser && !isVerifier) {
        return res.status(403).json({ 
          error: 'You do not have permission to delete this insider update' 
        });
      }
      
      await insiderStorage.deleteUpdate(Number(id));
      res.json({ message: 'Insider update deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting insider update');
      res.status(500).json({ error: 'Failed to delete insider update' });
    }
  });
  
  /**
   * Verify an insider update
   */
  app.post('/api/insider/updates/:id/verify', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      // Check if update exists
      const existingUpdate = await insiderStorage.getUpdateById(Number(id));
      
      if (!existingUpdate) {
        return res.status(404).json({ error: 'Insider update not found' });
      }
      
      // Check if user is a verifier or super user
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      if (!isSuperUser && !isVerifier) {
        return res.status(403).json({ 
          error: 'Only verifiers or super users can verify insider updates' 
        });
      }
      
      // Validate status
      if (!['verified', 'disputed', 'unverified', 'confirmed_by_multiple'].includes(status)) {
        return res.status(400).json({ error: 'Invalid verification status' });
      }
      
      const updatedUpdate = await insiderStorage.verifyUpdate(
        Number(id),
        req.user.id,
        status as 'verified' | 'disputed' | 'unverified' | 'confirmed_by_multiple',
        notes
      );
      
      res.json(updatedUpdate);
    } catch (error: any) {
      log.error({ err: error }, 'Error verifying insider update');
      res.status(500).json({ error: 'Failed to verify insider update' });
    }
  });
  
  // ---- VERIFICATIONS ----
  /**
   * Get verifications for an update
   */
  app.get('/api/insider/updates/:id/verifications', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const verifications = await insiderStorage.getVerificationsForUpdate(Number(id));
      res.json(verifications);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting verifications');
      res.status(500).json({ error: 'Failed to retrieve verifications' });
    }
  });
  
  /**
   * Create a verification for an update
   */
  app.post('/api/insider/verifications', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertInsiderVerificationSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid verification data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check if update exists
      const update = await insiderStorage.getUpdateById(validatedData.data.updateId);
      
      if (!update) {
        return res.status(404).json({ error: 'Insider update not found' });
      }
      
      // Check if user is a verifier
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      if (!isVerifier) {
        return res.status(403).json({ 
          error: 'You must be a registered verifier to verify updates' 
        });
      }
      
      // Set the user ID
      const data = {
        ...validatedData.data,
        userId: req.user.id
      };
      
      const verification = await insiderStorage.createVerification(data);
      res.status(201).json(verification);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating verification');
      res.status(500).json({ error: 'Failed to create verification' });
    }
  });
  
  /**
   * Delete a verification
   */
  app.delete('/api/insider/verifications/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if verification exists and belongs to the user
      const verifications = await insiderStorage.getVerificationsForUpdate(Number(id));
      const verification = verifications.find(v => v.userId === req.user.id);
      
      if (!verification) {
        return res.status(404).json({ error: 'Verification not found or does not belong to you' });
      }
      
      await insiderStorage.deleteVerification(Number(id));
      res.json({ message: 'Verification deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting verification');
      res.status(500).json({ error: 'Failed to delete verification' });
    }
  });
  
  // ---- REACTIONS ----
  /**
   * Get reactions for an update
   */
  app.get('/api/insider/updates/:id/reactions', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const reactions = await insiderStorage.getReactionsForUpdate(Number(id));
      res.json(reactions);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting reactions');
      res.status(500).json({ error: 'Failed to retrieve reactions' });
    }
  });
  
  /**
   * Create a reaction for an update
   */
  app.post('/api/insider/reactions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertInsiderReactionSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid reaction data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check if update exists
      const update = await insiderStorage.getUpdateById(validatedData.data.updateId);
      
      if (!update) {
        return res.status(404).json({ error: 'Insider update not found' });
      }
      
      // Set the user ID
      const data = {
        ...validatedData.data,
        userId: req.user.id
      };
      
      const reaction = await insiderStorage.createReaction(data);
      res.status(201).json(reaction);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating reaction');
      res.status(500).json({ error: 'Failed to create reaction' });
    }
  });
  
  /**
   * Delete a reaction
   */
  app.delete('/api/insider/reactions/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get reactions to check ownership
      const reactions = await insiderStorage.getReactionsForUpdate(Number(id));
      const reaction = reactions.find(r => r.userId === req.user.id);
      
      if (!reaction) {
        return res.status(404).json({ error: 'Reaction not found or does not belong to you' });
      }
      
      await insiderStorage.deleteReaction(Number(id));
      res.json({ message: 'Reaction deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting reaction');
      res.status(500).json({ error: 'Failed to delete reaction' });
    }
  });
  
  // ---- SOURCES ----
  /**
   * Get insider sources
   */
  app.get('/api/insider/sources', async (req: Request, res: Response) => {
    try {
      const { userId, sourceType, verificationStatus } = req.query;
      
      const options: any = {
        userId: userId ? Number(userId) : undefined,
        sourceType: sourceType as string,
        verificationStatus: verificationStatus as string
      };
      
      const sources = await insiderStorage.getSources(options);
      
      // For privacy, filter some fields for non-owners
      if ((req as CustomRequest).user) {
        const currentUserId = (req as CustomRequest).user.id;
        
        // Check if super user or verifier for full access
        const isSuperUser = await superUserStorage.isUserSuperUser(currentUserId);
        const isVerifier = await insiderStorage.isUserVerifier(currentUserId);
        
        if (!isSuperUser && !isVerifier) {
          // Regular users only see public info about other users' sources
          const filteredSources = sources.map(source => {
            if (source.userId !== currentUserId) {
              // Remove private fields
              return {
                id: source.id,
                userId: source.userId,
                sourceType: source.sourceType,
                organization: source.organization,
                verificationStatus: source.verificationStatus,
                isActive: source.isActive
              };
            }
            return source;
          });
          
          return res.json(filteredSources);
        }
      }
      
      res.json(sources);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider sources');
      res.status(500).json({ error: 'Failed to retrieve insider sources' });
    }
  });
  
  /**
   * Get a specific insider source by ID
   */
  app.get('/api/insider/sources/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const source = await insiderStorage.getSourceById(Number(id));
      
      if (!source) {
        return res.status(404).json({ error: 'Insider source not found' });
      }
      
      // For privacy, check if user should see all details
      if ((req as CustomRequest).user) {
        const currentUserId = (req as CustomRequest).user.id;
        
        // Check if owner, super user, or verifier for full access
        const isSuperUser = await superUserStorage.isUserSuperUser(currentUserId);
        const isVerifier = await insiderStorage.isUserVerifier(currentUserId);
        
        if (source.userId !== currentUserId && !isSuperUser && !isVerifier) {
          // Remove private fields
          return res.json({
            id: source.id,
            userId: source.userId,
            sourceType: source.sourceType,
            organization: source.organization,
            verificationStatus: source.verificationStatus,
            isActive: source.isActive
          });
        }
      } else {
        // Non-authenticated users get even more limited info
        return res.json({
          id: source.id,
          sourceType: source.sourceType,
          organization: source.organization,
          verificationStatus: source.verificationStatus
        });
      }
      
      res.json(source);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider source');
      res.status(500).json({ error: 'Failed to retrieve insider source' });
    }
  });
  
  /**
   * Create a new insider source
   */
  app.post('/api/insider/sources', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertInsiderSourceSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid insider source data', 
          details: validatedData.error.errors 
        });
      }
      
      // Set the user ID
      const data = {
        ...validatedData.data,
        userId: req.user.id
      };
      
      // Check if user is a super user for auto-verification
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      
      if (isSuperUser) {
        data.verificationStatus = 'verified';
        data.verifiedBy = req.user.id;
      }
      
      const source = await insiderStorage.createSource(data);
      res.status(201).json(source);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating insider source');
      res.status(500).json({ error: 'Failed to create insider source' });
    }
  });
  
  /**
   * Update an insider source
   */
  app.patch('/api/insider/sources/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if source exists and user has permission to edit it
      const existingSource = await insiderStorage.getSourceById(Number(id));
      
      if (!existingSource) {
        return res.status(404).json({ error: 'Insider source not found' });
      }
      
      // Only the user who created the source or verifiers/super users can edit
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      if (existingSource.userId !== req.user.id && !isSuperUser && !isVerifier) {
        return res.status(403).json({ 
          error: 'You do not have permission to edit this insider source' 
        });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertInsiderSourceSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid insider source data', 
          details: validatedData.error.errors 
        });
      }
      
      // Only verifiers can update verification fields
      if (!isVerifier && !isSuperUser) {
        delete validatedData.data.verificationStatus;
        delete validatedData.data.verifiedBy;
      }
      
      const updatedSource = await insiderStorage.updateSource(
        Number(id), 
        validatedData.data
      );
      
      res.json(updatedSource);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating insider source');
      res.status(500).json({ error: 'Failed to update insider source' });
    }
  });
  
  /**
   * Delete an insider source
   */
  app.delete('/api/insider/sources/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if source exists and user has permission to delete it
      const existingSource = await insiderStorage.getSourceById(Number(id));
      
      if (!existingSource) {
        return res.status(404).json({ error: 'Insider source not found' });
      }
      
      // Only the user who created the source or verifiers/super users can delete
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      if (existingSource.userId !== req.user.id && !isSuperUser && !isVerifier) {
        return res.status(403).json({ 
          error: 'You do not have permission to delete this insider source' 
        });
      }
      
      await insiderStorage.deleteSource(Number(id));
      res.json({ message: 'Insider source deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting insider source');
      res.status(500).json({ error: 'Failed to delete insider source' });
    }
  });
  
  /**
   * Verify an insider source
   */
  app.post('/api/insider/sources/:id/verify', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      // Check if source exists
      const existingSource = await insiderStorage.getSourceById(Number(id));
      
      if (!existingSource) {
        return res.status(404).json({ error: 'Insider source not found' });
      }
      
      // Check if user is a verifier or super user
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      const isVerifier = await insiderStorage.isUserVerifier(req.user.id);
      
      if (!isSuperUser && !isVerifier) {
        return res.status(403).json({ 
          error: 'Only verifiers or super users can verify insider sources' 
        });
      }
      
      // Validate status
      if (!['pending', 'verified', 'disputed', 'unverified', 'confirmed_by_multiple'].includes(status)) {
        return res.status(400).json({ error: 'Invalid verification status' });
      }
      
      const updatedSource = await insiderStorage.verifySource(
        Number(id),
        req.user.id,
        status,
        notes
      );
      
      res.json(updatedSource);
    } catch (error: any) {
      log.error({ err: error }, 'Error verifying insider source');
      res.status(500).json({ error: 'Failed to verify insider source' });
    }
  });
  
  // ---- VERIFIERS ----
  /**
   * Get verifiers
   */
  app.get('/api/insider/verifiers', async (req: Request, res: Response) => {
    try {
      const { userId, level, expertise } = req.query;
      
      const options: any = {
        userId: userId ? Number(userId) : undefined,
        level: level ? Number(level) : undefined,
        expertise: expertise as string
      };
      
      const verifiers = await insiderStorage.getVerifiers(options);
      res.json(verifiers);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting verifiers');
      res.status(500).json({ error: 'Failed to retrieve verifiers' });
    }
  });
  
  /**
   * Apply to become a verifier
   */
  app.post('/api/insider/verifiers', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertInsiderVerifierSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid verifier data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check if user is a super user for auto-approval
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      
      // Set the user ID and approval if super user
      const data = {
        ...validatedData.data,
        userId: req.user.id,
        approvedBy: isSuperUser ? req.user.id : undefined
      };
      
      const verifier = await insiderStorage.createVerifier(data);
      
      if (isSuperUser) {
        res.status(201).json(verifier);
      } else {
        res.status(201).json({
          ...verifier,
          message: 'Your verifier application has been submitted for review.'
        });
      }
    } catch (error: any) {
      log.error({ err: error }, 'Error creating verifier');
      res.status(500).json({ error: 'Failed to create verifier' });
    }
  });
  
  /**
   * Update a verifier
   */
  app.patch('/api/insider/verifiers/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get verifiers to check ownership
      const verifiers = await insiderStorage.getVerifiers({ userId: req.user.id });
      const verifier = verifiers.find(v => v.id === Number(id));
      
      // Check if super user for admin privileges
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      
      if (!verifier && !isSuperUser) {
        return res.status(404).json({ 
          error: 'Verifier not found or you do not have permission to edit' 
        });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertInsiderVerifierSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid verifier data', 
          details: validatedData.error.errors 
        });
      }
      
      // Only super users can update certain fields
      if (!isSuperUser) {
        delete validatedData.data.verifierLevel;
        delete validatedData.data.approvedBy;
      }
      
      const updatedVerifier = await insiderStorage.updateVerifier(
        Number(id), 
        validatedData.data
      );
      
      res.json(updatedVerifier);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating verifier');
      res.status(500).json({ error: 'Failed to update verifier' });
    }
  });
  
  /**
   * Approve a verifier (super users only)
   */
  app.post('/api/insider/verifiers/:id/approve', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { level } = req.body;
      
      // Check if super user
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      
      if (!isSuperUser) {
        return res.status(403).json({ 
          error: 'Only super users can approve verifiers' 
        });
      }
      
      // Validate level
      if (level && (level < 1 || level > 4)) {
        return res.status(400).json({ error: 'Invalid verifier level (must be 1-4)' });
      }
      
      const updatedVerifier = await insiderStorage.updateVerifier(
        Number(id), 
        {
          approvedBy: req.user.id,
          verifierLevel: level || 1
        }
      );
      
      res.json(updatedVerifier);
    } catch (error: any) {
      log.error({ err: error }, 'Error approving verifier');
      res.status(500).json({ error: 'Failed to approve verifier' });
    }
  });
  
  /**
   * Delete a verifier
   */
  app.delete('/api/insider/verifiers/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get verifiers to check ownership
      const verifiers = await insiderStorage.getVerifiers({ userId: req.user.id });
      const verifier = verifiers.find(v => v.id === Number(id));
      
      // Check if super user for admin privileges
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      
      if (!verifier && !isSuperUser) {
        return res.status(404).json({ 
          error: 'Verifier not found or you do not have permission to delete' 
        });
      }
      
      await insiderStorage.deleteVerifier(Number(id));
      res.json({ message: 'Verifier deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting verifier');
      res.status(500).json({ error: 'Failed to delete verifier' });
    }
  });
  
  // ---- TAGS ----
  /**
   * Get popular tags
   */
  app.get('/api/insider/tags/popular', async (_req: Request, res: Response) => {
    try {
      const tags = await insiderStorage.getPopularTags();
      res.json(tags);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting popular tags');
      res.status(500).json({ error: 'Failed to retrieve popular tags' });
    }
  });
  
  // ---- STATISTICS ----
  /**
   * Get insider dashboard statistics
   */
  app.get('/api/insider/stats', async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      
      const stats = await insiderStorage.getInsiderStats(
        userId ? Number(userId) : undefined
      );
      
      res.json(stats);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting insider stats');
      res.status(500).json({ error: 'Failed to retrieve insider statistics' });
    }
  });
  
  /**
   * Get insider statistics for a specific bill
   */
  app.get('/api/insider/stats/bill/:billId', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      const stats = await insiderStorage.getBillInsiderStats(billId);
      res.json(stats);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting bill insider stats');
      res.status(500).json({ error: 'Failed to retrieve bill insider statistics' });
    }
  });
}