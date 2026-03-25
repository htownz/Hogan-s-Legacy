import { Express, Request, Response } from 'express';
import { FeedStorage } from './storage-feed';
import { 
  insertFeedPostSchema, 
  insertFeedCommentSchema, 
  insertFeedReactionSchema,
  insertUserInterestSchema,
  insertFeedInteractionSchema
} from '../shared/schema-feed';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { z } from 'zod';

const feedStorage = new FeedStorage();

/**
 * Register feed API routes
 */
export function registerFeedRoutes(app: Express): void {
  /**
   * Get main feed
   */
  app.get('/api/feed', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const feed = await feedStorage.getMainFeed(limit, offset);
      
      res.status(200).json(feed);
    } catch (error: any) {
      console.error('[GET /api/feed]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get user's personalized feed
   */
  app.get('/api/feed/personalized', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const feed = await feedStorage.getUserFeed(userId, limit, offset);
      
      res.status(200).json(feed);
    } catch (error: any) {
      console.error('[GET /api/feed/personalized]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get feed posts by type
   */
  app.get('/api/feed/type/:type', async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const feed = await feedStorage.getPostsByType(type, limit, offset);
      
      res.status(200).json(feed);
    } catch (error: any) {
      console.error(`[GET /api/feed/type/${req.params.type}]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get featured posts
   */
  app.get('/api/feed/featured', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const posts = await feedStorage.getFeaturedPosts(limit);
      
      res.status(200).json(posts);
    } catch (error: any) {
      console.error('[GET /api/feed/featured]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Search feed posts
   */
  app.get('/api/feed/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const results = await feedStorage.searchPosts(query, limit, offset);
      
      res.status(200).json(results);
    } catch (error: any) {
      console.error('[GET /api/feed/search]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get posts by tags
   */
  app.get('/api/feed/tags', async (req: Request, res: Response) => {
    try {
      const tags = (req.query.tags as string).split(',');
      
      if (!tags || tags.length === 0) {
        return res.status(400).json({ error: 'At least one tag is required' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const posts = await feedStorage.getPostsByTags(tags, limit, offset);
      
      res.status(200).json(posts);
    } catch (error: any) {
      console.error('[GET /api/feed/tags]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get a single post by ID
   */
  app.get('/api/feed/posts/:id', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      
      const post = await feedStorage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.status(200).json(post);
    } catch (error: any) {
      console.error(`[GET /api/feed/posts/${req.params.id}]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Create a new post
   */
  app.post('/api/feed/posts', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const validatedData = insertFeedPostSchema.parse({
        ...req.body,
        authorId: userId
      });
      
      const post = await feedStorage.createPost(validatedData);
      
      res.status(201).json(post);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error('[POST /api/feed/posts]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Update a post
   */
  app.patch('/api/feed/posts/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const postId = parseInt(req.params.id);
      
      const post = await feedStorage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.authorId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this post' });
      }
      
      const validatedData = insertFeedPostSchema.partial().parse(req.body);
      
      const updatedPost = await feedStorage.updatePost(postId, validatedData);
      
      res.status(200).json(updatedPost);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error(`[PATCH /api/feed/posts/${req.params.id}]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Delete a post
   */
  app.delete('/api/feed/posts/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const postId = parseInt(req.params.id);
      
      const post = await feedStorage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.authorId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this post' });
      }
      
      await feedStorage.deletePost(postId);
      
      res.status(204).send();
    } catch (error: any) {
      console.error(`[DELETE /api/feed/posts/${req.params.id}]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get comments for a post
   */
  app.get('/api/feed/posts/:id/comments', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const comments = await feedStorage.getPostComments(postId, limit, offset);
      
      res.status(200).json(comments);
    } catch (error: any) {
      console.error(`[GET /api/feed/posts/${req.params.id}/comments]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Add a comment to a post
   */
  app.post('/api/feed/posts/:id/comments', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const postId = parseInt(req.params.id);
      
      // Check if post exists
      const post = await feedStorage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      const validatedData = insertFeedCommentSchema.parse({
        ...req.body,
        postId,
        userId
      });
      
      const comment = await feedStorage.createComment(validatedData);
      
      res.status(201).json(comment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error(`[POST /api/feed/posts/${req.params.id}/comments]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get replies to a comment
   */
  app.get('/api/feed/comments/:id/replies', async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const replies = await feedStorage.getCommentReplies(commentId, limit, offset);
      
      res.status(200).json(replies);
    } catch (error: any) {
      console.error(`[GET /api/feed/comments/${req.params.id}/replies]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Update a comment
   */
  app.patch('/api/feed/comments/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const commentId = parseInt(req.params.id);
      
      // Get the comment to check ownership
      const comment = await feedStorage.updateComment(commentId, {});
      
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this comment' });
      }
      
      const validatedData = insertFeedCommentSchema.partial().parse(req.body);
      
      const updatedComment = await feedStorage.updateComment(commentId, validatedData);
      
      res.status(200).json(updatedComment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error(`[PATCH /api/feed/comments/${req.params.id}]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Delete a comment
   */
  app.delete('/api/feed/comments/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const commentId = parseInt(req.params.id);
      
      // Get the comment to check ownership
      const comment = await feedStorage.updateComment(commentId, {});
      
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this comment' });
      }
      
      await feedStorage.deleteComment(commentId);
      
      res.status(204).send();
    } catch (error: any) {
      console.error(`[DELETE /api/feed/comments/${req.params.id}]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get reactions for a post
   */
  app.get('/api/feed/posts/:id/reactions', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      
      const reactions = await feedStorage.getPostReactions(postId);
      
      res.status(200).json(reactions);
    } catch (error: any) {
      console.error(`[GET /api/feed/posts/${req.params.id}/reactions]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get user's reaction to a post
   */
  app.get('/api/feed/posts/:id/reactions/me', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const postId = parseInt(req.params.id);
      
      const reaction = await feedStorage.getUserReaction(userId, postId);
      
      res.status(200).json(reaction || { type: null });
    } catch (error: any) {
      console.error(`[GET /api/feed/posts/${req.params.id}/reactions/me]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * React to a post
   */
  app.post('/api/feed/posts/:id/reactions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const postId = parseInt(req.params.id);
      
      const validatedData = insertFeedReactionSchema.parse({
        ...req.body,
        postId,
        userId
      });
      
      const reaction = await feedStorage.createReaction(validatedData);
      
      res.status(201).json(reaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error(`[POST /api/feed/posts/${req.params.id}/reactions]`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get user interests
   */
  app.get('/api/feed/interests', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const interests = await feedStorage.getUserInterests(userId);
      
      res.status(200).json(interests || { topics: [], representatives: [], locations: [], committees: [] });
    } catch (error: any) {
      console.error('[GET /api/feed/interests]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Update user interests
   */
  app.post('/api/feed/interests', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const validatedData = insertUserInterestSchema.parse({
        ...req.body,
        userId
      });
      
      const interests = await feedStorage.createOrUpdateUserInterests(validatedData);
      
      res.status(200).json(interests);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error('[POST /api/feed/interests]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Record a feed interaction
   */
  app.post('/api/feed/interactions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const validatedData = insertFeedInteractionSchema.parse({
        ...req.body,
        userId
      });
      
      const interaction = await feedStorage.recordFeedInteraction(validatedData);
      
      res.status(201).json(interaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error('[POST /api/feed/interactions]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}