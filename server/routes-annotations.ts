import { Request, Response, Express } from 'express';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { annotationStorage } from './storage-annotations';
import { 
  insertBillAnnotationSchema, 
  insertAnnotationReplySchema,
  insertAnnotationReactionSchema,
  insertAnnotationTagSchema
} from '../shared/schema-annotations';
import { actionCircleStorage } from './storage-action-circle';
import { createLogger } from "./logger";
const log = createLogger("routes-annotations");


/**
 * Register annotation API routes
 */
export function registerAnnotationRoutes(app: Express): void {
  /**
   * Get annotations for a bill
   */
  app.get('/api/annotations/bills/:billId', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { 
        userId, 
        circleId, 
        visibility,
        type,
        section,
        includeTags, 
        includeReplies, 
        includeReactions,
        limit,
        offset
      } = req.query;
      
      // Parse query parameters
      const options: any = {
        billId,
        userId: userId ? Number(userId) : undefined,
        circleId: circleId ? Number(circleId) : undefined,
        visibility: visibility as any,
        type: type as string,
        section: section as string,
        includeTags: includeTags === 'true',
        includeReplies: includeReplies === 'true',
        includeReactions: includeReactions === 'true',
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };
      
      // If user is authenticated, include their private annotations too
      if ((req as CustomRequest).user) {
        const currentUserId = (req as CustomRequest).user.id;
        
        // If no visibility filter is set yet, get both public and user's private annotations
        if (!options.visibility && !options.userId) {
          // Public annotations or private annotations that belong to this user
          const publicAnnotations = await annotationStorage.getAnnotations({
            ...options,
            visibility: 'public'
          });
          
          const privateAnnotations = await annotationStorage.getAnnotations({
            ...options,
            visibility: 'private',
            userId: currentUserId
          });
          
          // If this user is part of circles, get circle annotations too
          const userCircles = await actionCircleStorage.getUserCircles(currentUserId);
          const circleIds = userCircles.map(circle => circle.id);
          
          let circleAnnotations: any[] = [];
          if (circleIds.length > 0) {
            // Get annotations for all circles the user is a member of
            for (const circleId of circleIds) {
              const circleScopeAnnotations = await annotationStorage.getAnnotations({
                ...options,
                visibility: 'circle',
                circleId: circleId
              });
              circleAnnotations = [...circleAnnotations, ...circleScopeAnnotations];
            }
          }
          
          return res.json([...publicAnnotations, ...privateAnnotations, ...circleAnnotations]);
        }
      }
      
      // Standard case - just get the annotations based on the provided filters
      const annotations = await annotationStorage.getAnnotations(options);
      res.json(annotations);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting annotations');
      res.status(500).json({ error: 'Failed to retrieve annotations' });
    }
  });
  
  /**
   * Get a specific annotation by ID
   */
  app.get('/api/annotations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeTags, includeReplies, includeReactions } = req.query;
      
      const options = {
        includeTags: includeTags === 'true',
        includeReplies: includeReplies === 'true',
        includeReactions: includeReactions === 'true'
      };
      
      const annotation = await annotationStorage.getAnnotationById(Number(id), options);
      
      if (!annotation) {
        return res.status(404).json({ error: 'Annotation not found' });
      }
      
      // Check if user has permission to view this annotation
      // (private annotations can only be viewed by their creator)
      if (annotation.visibility === 'private') {
        if (!(req as CustomRequest).user || 
            (req as CustomRequest).user.id !== annotation.userId) {
          return res.status(403).json({ error: 'You do not have permission to view this annotation' });
        }
      }
      
      // Check circle visibility permissions
      if (annotation.visibility === 'circle' && annotation.circleId) {
        if (!(req as CustomRequest).user) {
          return res.status(403).json({ error: 'You must be logged in to view circle annotations' });
        }
        
        // Check if user is a member of this circle
        const currentUserId = (req as CustomRequest).user.id;
        const circleMember = await actionCircleStorage.getCircleMember(
          annotation.circleId, 
          currentUserId
        );
        
        if (!circleMember) {
          return res.status(403).json({ error: 'You must be a member of this circle to view its annotations' });
        }
      }
      
      res.json(annotation);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting annotation');
      res.status(500).json({ error: 'Failed to retrieve annotation' });
    }
  });
  
  /**
   * Create a new annotation
   */
  app.post('/api/annotations', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertBillAnnotationSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid annotation data', 
          details: validatedData.error.errors 
        });
      }
      
      // Set the user ID from the authenticated user
      const data = {
        ...validatedData.data,
        userId: req.user.id
      };
      
      // Check circle permissions if this is a circle annotation
      if (data.visibility === 'circle' && data.circleId) {
        const circleMember = await actionCircleStorage.getCircleMember(
          data.circleId, 
          req.user.id
        );
        
        if (!circleMember) {
          return res.status(403).json({ error: 'You must be a member of this circle to create annotations for it' });
        }
      }
      
      const annotation = await annotationStorage.createAnnotation(data);
      res.status(201).json(annotation);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating annotation');
      res.status(500).json({ error: 'Failed to create annotation' });
    }
  });
  
  /**
   * Update an annotation
   */
  app.patch('/api/annotations/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if annotation exists and user has permission to edit it
      const existingAnnotation = await annotationStorage.getAnnotationById(Number(id));
      
      if (!existingAnnotation) {
        return res.status(404).json({ error: 'Annotation not found' });
      }
      
      // Only the annotation creator can edit it
      if (existingAnnotation.userId !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to edit this annotation' });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertBillAnnotationSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid annotation data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check circle permissions if changing to a circle annotation
      if (validatedData.data.visibility === 'circle' && validatedData.data.circleId) {
        const circleMember = await actionCircleStorage.getCircleMember(
          validatedData.data.circleId, 
          req.user.id
        );
        
        if (!circleMember) {
          return res.status(403).json({ error: 'You must be a member of this circle to create annotations for it' });
        }
      }
      
      const updatedAnnotation = await annotationStorage.updateAnnotation(
        Number(id), 
        validatedData.data
      );
      
      res.json(updatedAnnotation);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating annotation');
      res.status(500).json({ error: 'Failed to update annotation' });
    }
  });
  
  /**
   * Delete an annotation
   */
  app.delete('/api/annotations/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if annotation exists and user has permission to delete it
      const existingAnnotation = await annotationStorage.getAnnotationById(Number(id));
      
      if (!existingAnnotation) {
        return res.status(404).json({ error: 'Annotation not found' });
      }
      
      // Only the annotation creator can delete it
      if (existingAnnotation.userId !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this annotation' });
      }
      
      await annotationStorage.deleteAnnotation(Number(id));
      res.json({ message: 'Annotation deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting annotation');
      res.status(500).json({ error: 'Failed to delete annotation' });
    }
  });
  
  /**
   * Get annotation statistics for a bill
   */
  app.get('/api/annotations/bills/:billId/statistics', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      const statistics = await annotationStorage.getAnnotationStatistics(billId);
      res.json(statistics);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting annotation statistics');
      res.status(500).json({ error: 'Failed to retrieve annotation statistics' });
    }
  });
  
  /**
   * Get top annotated sections for a bill
   */
  app.get('/api/annotations/bills/:billId/top-sections', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { limit } = req.query;
      
      const topSections = await annotationStorage.getTopAnnotatedSections(
        billId, 
        limit ? Number(limit) : undefined
      );
      
      res.json(topSections);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting top annotated sections');
      res.status(500).json({ error: 'Failed to retrieve top annotated sections' });
    }
  });
  
  /**
   * Get most discussed annotations for a bill
   */
  app.get('/api/annotations/bills/:billId/most-discussed', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { limit } = req.query;
      
      const mostDiscussed = await annotationStorage.getMostDiscussedAnnotations(
        billId, 
        limit ? Number(limit) : undefined
      );
      
      res.json(mostDiscussed);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting most discussed annotations');
      res.status(500).json({ error: 'Failed to retrieve most discussed annotations' });
    }
  });
  
  /**
   * Get replies for an annotation
   */
  app.get('/api/annotations/:id/replies', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const replies = await annotationStorage.getReplies(Number(id));
      res.json(replies);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting replies');
      res.status(500).json({ error: 'Failed to retrieve replies' });
    }
  });
  
  /**
   * Create a reply for an annotation
   */
  app.post('/api/annotations/:id/replies', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if annotation exists
      const annotation = await annotationStorage.getAnnotationById(Number(id));
      
      if (!annotation) {
        return res.status(404).json({ error: 'Annotation not found' });
      }
      
      // For circle annotations, check if user is a member of the circle
      if (annotation.visibility === 'circle' && annotation.circleId) {
        const circleMember = await actionCircleStorage.getCircleMember(
          annotation.circleId, 
          req.user.id
        );
        
        if (!circleMember) {
          return res.status(403).json({ 
            error: 'You must be a member of this circle to reply to its annotations' 
          });
        }
      }
      
      // For private annotations, only the creator can reply
      if (annotation.visibility === 'private' && annotation.userId !== req.user.id) {
        return res.status(403).json({ 
          error: 'You do not have permission to reply to this private annotation' 
        });
      }
      
      // Validate the request body
      const validatedData = insertAnnotationReplySchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid reply data', 
          details: validatedData.error.errors 
        });
      }
      
      // Set the user ID and annotation ID
      const data = {
        ...validatedData.data,
        userId: req.user.id,
        annotationId: Number(id)
      };
      
      const reply = await annotationStorage.createReply(data);
      res.status(201).json(reply);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating reply');
      res.status(500).json({ error: 'Failed to create reply' });
    }
  });
  
  /**
   * Update a reply
   */
  app.patch('/api/annotations/replies/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get existing replies to check ownership
      const replies = await annotationStorage.getReplies(Number(id));
      const reply = replies.find(r => r.id === Number(id));
      
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      
      // Only the reply creator can edit it
      if (reply.userId !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to edit this reply' });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertAnnotationReplySchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid reply data', 
          details: validatedData.error.errors 
        });
      }
      
      const updatedReply = await annotationStorage.updateReply(Number(id), validatedData.data);
      res.json(updatedReply);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating reply');
      res.status(500).json({ error: 'Failed to update reply' });
    }
  });
  
  /**
   * Delete a reply
   */
  app.delete('/api/annotations/replies/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get existing replies to check ownership
      const replies = await annotationStorage.getReplies(Number(id));
      const reply = replies.find(r => r.id === Number(id));
      
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      
      // Only the reply creator can delete it
      if (reply.userId !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this reply' });
      }
      
      await annotationStorage.deleteReply(Number(id));
      res.json({ message: 'Reply deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting reply');
      res.status(500).json({ error: 'Failed to delete reply' });
    }
  });
  
  /**
   * Get reactions for an annotation or reply
   */
  app.get('/api/annotations/reactions', async (req: Request, res: Response) => {
    try {
      const { annotationId, replyId, userId } = req.query;
      
      const options: any = {
        annotationId: annotationId ? Number(annotationId) : undefined,
        replyId: replyId ? Number(replyId) : undefined,
        userId: userId ? Number(userId) : undefined
      };
      
      const reactions = await annotationStorage.getReactions(options);
      res.json(reactions);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting reactions');
      res.status(500).json({ error: 'Failed to retrieve reactions' });
    }
  });
  
  /**
   * Create a reaction for an annotation or reply
   */
  app.post('/api/annotations/reactions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertAnnotationReactionSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid reaction data', 
          details: validatedData.error.errors 
        });
      }
      
      // Set the user ID
      const data = {
        ...validatedData.data,
        userId: req.user.id
      };
      
      // Check that either annotationId or replyId is provided, but not both
      if ((!data.annotationId && !data.replyId) || (data.annotationId && data.replyId)) {
        return res.status(400).json({ 
          error: 'Either annotationId or replyId must be provided, but not both' 
        });
      }
      
      // For annotation reactions, check visibility permissions
      if (data.annotationId) {
        const annotation = await annotationStorage.getAnnotationById(data.annotationId);
        
        if (!annotation) {
          return res.status(404).json({ error: 'Annotation not found' });
        }
        
        // For circle annotations, check if user is a member of the circle
        if (annotation.visibility === 'circle' && annotation.circleId) {
          const circleMember = await actionCircleStorage.getCircleMember(
            annotation.circleId, 
            req.user.id
          );
          
          if (!circleMember) {
            return res.status(403).json({ 
              error: 'You must be a member of this circle to react to its annotations' 
            });
          }
        }
        
        // For private annotations, only the creator can react
        if (annotation.visibility === 'private' && annotation.userId !== req.user.id) {
          return res.status(403).json({ 
            error: 'You do not have permission to react to this private annotation' 
          });
        }
      }
      
      const reaction = await annotationStorage.createReaction(data);
      res.status(201).json(reaction);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating reaction');
      res.status(500).json({ error: 'Failed to create reaction' });
    }
  });
  
  /**
   * Delete a reaction
   */
  app.delete('/api/annotations/reactions/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get existing reactions to check ownership
      const reactions = await annotationStorage.getReactions({});
      const reaction = reactions.find(r => r.id === Number(id));
      
      if (!reaction) {
        return res.status(404).json({ error: 'Reaction not found' });
      }
      
      // Only the reaction creator can delete it
      if (reaction.userId !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this reaction' });
      }
      
      await annotationStorage.deleteReaction(Number(id));
      res.json({ message: 'Reaction deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting reaction');
      res.status(500).json({ error: 'Failed to delete reaction' });
    }
  });
  
  /**
   * Get tags for an annotation
   */
  app.get('/api/annotations/:id/tags', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const tags = await annotationStorage.getTags(Number(id));
      res.json(tags);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting tags');
      res.status(500).json({ error: 'Failed to retrieve tags' });
    }
  });
  
  /**
   * Create a tag for an annotation
   */
  app.post('/api/annotations/:id/tags', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if annotation exists and user has permission to add tags
      const annotation = await annotationStorage.getAnnotationById(Number(id));
      
      if (!annotation) {
        return res.status(404).json({ error: 'Annotation not found' });
      }
      
      // For circle annotations, check if user is a member of the circle
      if (annotation.visibility === 'circle' && annotation.circleId) {
        const circleMember = await actionCircleStorage.getCircleMember(
          annotation.circleId, 
          req.user.id
        );
        
        if (!circleMember) {
          return res.status(403).json({ 
            error: 'You must be a member of this circle to add tags to its annotations' 
          });
        }
      }
      
      // For private or personal annotations, only the creator can add tags
      if (annotation.visibility === 'private' && annotation.userId !== req.user.id) {
        return res.status(403).json({ 
          error: 'You do not have permission to add tags to this private annotation' 
        });
      }
      
      // Validate the request body
      const validatedData = insertAnnotationTagSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid tag data', 
          details: validatedData.error.errors 
        });
      }
      
      // Set the annotation ID
      const data = {
        ...validatedData.data,
        annotationId: Number(id)
      };
      
      const tag = await annotationStorage.createTag(data);
      res.status(201).json(tag);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating tag');
      res.status(500).json({ error: 'Failed to create tag' });
    }
  });
  
  /**
   * Delete a tag
   */
  app.delete('/api/annotations/tags/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Tags don't have a direct user ID association, so we need to check
      // permission through the parent annotation
      const tags = await annotationStorage.getTags(Number(id));
      const tag = tags.find(t => t.id === Number(id));
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      // Get the annotation to check permissions
      const annotation = await annotationStorage.getAnnotationById(tag.annotationId);
      
      // Only the annotation creator can delete tags
      if (annotation.userId !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this tag' });
      }
      
      await annotationStorage.deleteTag(Number(id));
      res.json({ message: 'Tag deleted successfully' });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting tag');
      res.status(500).json({ error: 'Failed to delete tag' });
    }
  });
}