// @ts-nocheck
import { Request, Response, Express } from 'express';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { discussionStorage } from './storage-discussions';
import { 
  insertDiscussionForumSchema, 
  insertDiscussionThreadSchema,
  insertDiscussionPostSchema,
  insertDiscussionReactionSchema,
  insertDiscussionModeratorSchema,
  insertDiscussionReportSchema
} from '../shared/schema-discussions';
import { actionCircleStorage } from './storage-action-circle';
import { superUserStorage } from './storage-super-user';

/**
 * Register discussion API routes
 */
export function registerDiscussionRoutes(app: Express): void {
  // ---- FORUMS ----
  /**
   * Get available discussion forums
   */
  app.get('/api/discussions/forums', async (req: Request, res: Response) => {
    try {
      const { 
        userId, 
        circleId, 
        billId, 
        category,
        limit,
        offset
      } = req.query;
      
      // Parse query parameters
      const options: any = {
        userId: userId ? Number(userId) : undefined,
        circleId: circleId ? Number(circleId) : undefined,
        billId: billId as string | undefined,
        category: category as string | undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        includePrivate: false
      };
      
      // If user is authenticated, include their private forums too
      if ((req as CustomRequest).user) {
        options.includePrivate = true;
        if (!options.userId) {
          options.userId = (req as CustomRequest).user.id;
        }
      }
      
      const forums = await discussionStorage.getForums(options);
      res.json(forums);
    } catch (error: any) {
      console.error('Error getting forums:', error);
      res.status(500).json({ error: 'Failed to retrieve forums' });
    }
  });
  
  /**
   * Get forum by ID
   */
  app.get('/api/discussions/forums/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const forum = await discussionStorage.getForumById(Number(id));
      
      if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Check if user can access this forum (private forums)
      if (forum.visibility === 'private') {
        if (!(req as CustomRequest).user || 
            (req as CustomRequest).user.id !== forum.createdBy) {
          return res.status(403).json({ error: 'You do not have permission to view this forum' });
        }
      }
      
      // Check circle visibility permissions
      if (forum.visibility === 'circle' && forum.circleId) {
        if (!(req as CustomRequest).user) {
          return res.status(403).json({ error: 'You must be logged in to view circle forums' });
        }
        
        // Check if user is a member of this circle
        const currentUserId = (req as CustomRequest).user.id;
        const circleMember = await actionCircleStorage.getCircleMember(
          forum.circleId, 
          currentUserId
        );
        
        if (!circleMember) {
          return res.status(403).json({ error: 'You must be a member of this circle to view its forums' });
        }
      }
      
      res.json(forum);
    } catch (error: any) {
      console.error('Error getting forum:', error);
      res.status(500).json({ error: 'Failed to retrieve forum' });
    }
  });
  
  /**
   * Create a new forum
   */
  app.post('/api/discussions/forums', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertDiscussionForumSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid forum data', 
          details: validatedData.error.errors 
        });
      }
      
      // Set the user ID from the authenticated user
      const data = {
        ...validatedData.data,
        createdBy: req.user.id
      };
      
      // Check circle permissions if this is a circle forum
      if (data.visibility === 'circle' && data.circleId) {
        const circleMember = await actionCircleStorage.getCircleMember(
          data.circleId, 
          req.user.id
        );
        
        if (!circleMember || !['coordinator', 'leader'].includes(circleMember.role)) {
          return res.status(403).json({ 
            error: 'You must be a coordinator or leader of this circle to create forums for it' 
          });
        }
      }
      
      const forum = await discussionStorage.createForum(data);
      res.status(201).json(forum);
    } catch (error: any) {
      console.error('Error creating forum:', error);
      res.status(500).json({ error: 'Failed to create forum' });
    }
  });
  
  /**
   * Update a forum
   */
  app.patch('/api/discussions/forums/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if forum exists and user has permission to edit it
      const existingForum = await discussionStorage.getForumById(Number(id));
      
      if (!existingForum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Only the creator can edit the forum, unless the user is a moderator
      const isCreator = existingForum.createdBy === req.user.id;
      const isModerator = await discussionStorage.isUserModerator(req.user.id, Number(id));
      
      if (!isCreator && !isModerator) {
        return res.status(403).json({ error: 'You do not have permission to edit this forum' });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertDiscussionForumSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid forum data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check circle permissions if changing to a circle forum
      if (validatedData.data.visibility === 'circle' && validatedData.data.circleId) {
        const circleMember = await actionCircleStorage.getCircleMember(
          validatedData.data.circleId, 
          req.user.id
        );
        
        if (!circleMember || !['coordinator', 'leader'].includes(circleMember.role)) {
          return res.status(403).json({ 
            error: 'You must be a coordinator or leader of this circle to create forums for it' 
          });
        }
      }
      
      const updatedForum = await discussionStorage.updateForum(
        Number(id), 
        validatedData.data
      );
      
      res.json(updatedForum);
    } catch (error: any) {
      console.error('Error updating forum:', error);
      res.status(500).json({ error: 'Failed to update forum' });
    }
  });
  
  /**
   * Delete a forum (soft delete)
   */
  app.delete('/api/discussions/forums/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if forum exists and user has permission to delete it
      const existingForum = await discussionStorage.getForumById(Number(id));
      
      if (!existingForum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Only the creator can delete the forum, unless the user is a moderator
      const isCreator = existingForum.createdBy === req.user.id;
      const isModerator = await discussionStorage.isUserModerator(req.user.id, Number(id));
      
      if (!isCreator && !isModerator) {
        return res.status(403).json({ error: 'You do not have permission to delete this forum' });
      }
      
      await discussionStorage.deleteForum(Number(id));
      res.json({ message: 'Forum deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting forum:', error);
      res.status(500).json({ error: 'Failed to delete forum' });
    }
  });
  
  // ---- THREADS ----
  /**
   * Get threads for a forum
   */
  app.get('/api/discussions/forums/:forumId/threads', async (req: Request, res: Response) => {
    try {
      const { forumId } = req.params;
      const { 
        pinned,
        includeModerated,
        modStatus,
        limit,
        offset
      } = req.query;
      
      // Check if forum exists and user has permission to view it
      const forum = await discussionStorage.getForumById(Number(forumId));
      
      if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Check visibility permissions
      if (forum.visibility === 'private') {
        if (!(req as CustomRequest).user || 
            (req as CustomRequest).user.id !== forum.createdBy) {
          return res.status(403).json({ error: 'You do not have permission to view this forum' });
        }
      }
      
      if (forum.visibility === 'circle' && forum.circleId) {
        if (!(req as CustomRequest).user) {
          return res.status(403).json({ error: 'You must be logged in to view circle forums' });
        }
        
        // Check if user is a member of this circle
        const currentUserId = (req as CustomRequest).user.id;
        const circleMember = await actionCircleStorage.getCircleMember(
          forum.circleId, 
          currentUserId
        );
        
        if (!circleMember) {
          return res.status(403).json({ error: 'You must be a member of this circle to view its forums' });
        }
      }
      
      // Determine if user is a moderator (to show moderated content)
      const isModerator = (req as CustomRequest).user ? 
        await discussionStorage.isUserModerator((req as CustomRequest).user.id, Number(forumId)) : 
        false;
      
      // Parse query parameters
      const options: any = {
        forumId: Number(forumId),
        onlyPinned: pinned === 'true',
        includeModerated: isModerator && includeModerated === 'true',
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };
      
      // Parse moderation status filter (moderators only)
      if (isModerator && modStatus) {
        options.modStatus = (modStatus as string).split(',');
      }
      
      const threads = await discussionStorage.getThreads(options);
      res.json(threads);
    } catch (error: any) {
      console.error('Error getting threads:', error);
      res.status(500).json({ error: 'Failed to retrieve threads' });
    }
  });
  
  /**
   * Get thread by ID
   */
  app.get('/api/discussions/threads/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const thread = await discussionStorage.getThreadById(Number(id));
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Get forum to check visibility permissions
      const forum = await discussionStorage.getForumById(thread.forumId);
      
      if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Check if user can access this forum
      if (forum.visibility === 'private') {
        if (!(req as CustomRequest).user || 
            (req as CustomRequest).user.id !== forum.createdBy) {
          return res.status(403).json({ error: 'You do not have permission to view this thread' });
        }
      }
      
      if (forum.visibility === 'circle' && forum.circleId) {
        if (!(req as CustomRequest).user) {
          return res.status(403).json({ error: 'You must be logged in to view circle threads' });
        }
        
        // Check if user is a member of this circle
        const currentUserId = (req as CustomRequest).user.id;
        const circleMember = await actionCircleStorage.getCircleMember(
          forum.circleId, 
          currentUserId
        );
        
        if (!circleMember) {
          return res.status(403).json({ 
            error: 'You must be a member of this circle to view its threads' 
          });
        }
      }
      
      // Check if thread is pending moderation
      if (thread.moderationStatus !== 'approved') {
        // Only creator or moderator can see non-approved threads
        const isModerator = (req as CustomRequest).user ? 
          await discussionStorage.isUserModerator((req as CustomRequest).user.id, thread.forumId) : 
          false;
        const isCreator = (req as CustomRequest).user && 
          (req as CustomRequest).user.id === thread.userId;
        
        if (!isModerator && !isCreator) {
          return res.status(403).json({ 
            error: 'This thread is pending moderation and not yet visible' 
          });
        }
      }
      
      res.json(thread);
    } catch (error: any) {
      console.error('Error getting thread:', error);
      res.status(500).json({ error: 'Failed to retrieve thread' });
    }
  });
  
  /**
   * Create a new thread
   */
  app.post('/api/discussions/forums/:forumId/threads', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { forumId } = req.params;
      
      // Check if forum exists and user has permission to post in it
      const forum = await discussionStorage.getForumById(Number(forumId));
      
      if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Check visibility permissions
      if (forum.visibility === 'private' && forum.createdBy !== req.user.id) {
        return res.status(403).json({ 
          error: 'You do not have permission to post in this private forum' 
        });
      }
      
      if (forum.visibility === 'circle' && forum.circleId) {
        // Check if user is a member of this circle
        const circleMember = await actionCircleStorage.getCircleMember(
          forum.circleId, 
          req.user.id
        );
        
        if (!circleMember) {
          return res.status(403).json({ 
            error: 'You must be a member of this circle to post in its forums' 
          });
        }
      }
      
      // Validate the request body
      const validatedData = insertDiscussionThreadSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid thread data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check if user is a super user for moderation bypass
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      
      // Set the user ID and forum ID
      const data = {
        ...validatedData.data,
        userId: req.user.id,
        forumId: Number(forumId),
        // Super users' posts are auto-approved, others may need moderation
        moderationStatus: isSuperUser ? 'approved' : forum.category === 'announcement' ? 'pending' : 'approved'
      };
      
      const thread = await discussionStorage.createThread(data);
      res.status(201).json(thread);
    } catch (error: any) {
      console.error('Error creating thread:', error);
      res.status(500).json({ error: 'Failed to create thread' });
    }
  });
  
  /**
   * Update a thread
   */
  app.patch('/api/discussions/threads/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if thread exists and user has permission to edit it
      const thread = await discussionStorage.getThreadById(Number(id));
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Only the thread creator can edit it, unless the user is a moderator
      const isCreator = thread.userId === req.user.id;
      const isModerator = await discussionStorage.isUserModerator(req.user.id, thread.forumId);
      
      if (!isCreator && !isModerator) {
        return res.status(403).json({ error: 'You do not have permission to edit this thread' });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertDiscussionThreadSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid thread data', 
          details: validatedData.error.errors 
        });
      }
      
      // Only moderators can update moderation fields
      if (!isModerator) {
        delete validatedData.data.moderationStatus;
        delete validatedData.data.moderatedBy;
        delete validatedData.data.moderationNotes;
        delete validatedData.data.isPinned;
        delete validatedData.data.isLocked;
      }
      
      const updatedThread = await discussionStorage.updateThread(
        Number(id), 
        validatedData.data
      );
      
      res.json(updatedThread);
    } catch (error: any) {
      console.error('Error updating thread:', error);
      res.status(500).json({ error: 'Failed to update thread' });
    }
  });
  
  /**
   * Delete a thread (soft delete)
   */
  app.delete('/api/discussions/threads/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if thread exists and user has permission to delete it
      const thread = await discussionStorage.getThreadById(Number(id));
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Only the thread creator can delete it, unless the user is a moderator
      const isCreator = thread.userId === req.user.id;
      const isModerator = await discussionStorage.isUserModerator(req.user.id, thread.forumId);
      
      if (!isCreator && !isModerator) {
        return res.status(403).json({ error: 'You do not have permission to delete this thread' });
      }
      
      await discussionStorage.deleteThread(Number(id));
      res.json({ message: 'Thread deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting thread:', error);
      res.status(500).json({ error: 'Failed to delete thread' });
    }
  });
  
  /**
   * Moderate a thread
   */
  app.post('/api/discussions/threads/:id/moderate', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      // Check if thread exists
      const thread = await discussionStorage.getThreadById(Number(id));
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Verify user is a moderator
      const isModerator = await discussionStorage.isUserModerator(req.user.id, thread.forumId);
      
      if (!isModerator) {
        return res.status(403).json({ error: 'You do not have permission to moderate this thread' });
      }
      
      // Validate status
      if (!['approved', 'rejected', 'flagged'].includes(status)) {
        return res.status(400).json({ error: 'Invalid moderation status' });
      }
      
      const updatedThread = await discussionStorage.moderateThread(
        Number(id),
        status as 'approved' | 'rejected' | 'flagged',
        req.user.id,
        notes
      );
      
      res.json(updatedThread);
    } catch (error: any) {
      console.error('Error moderating thread:', error);
      res.status(500).json({ error: 'Failed to moderate thread' });
    }
  });
  
  // ---- POSTS (REPLIES) ----
  /**
   * Get posts for a thread
   */
  app.get('/api/discussions/threads/:threadId/posts', async (req: Request, res: Response) => {
    try {
      const { threadId } = req.params;
      const { 
        includeModerated,
        modStatus,
        limit,
        offset
      } = req.query;
      
      // Check if thread exists
      const thread = await discussionStorage.getThreadById(Number(threadId));
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Get forum to check visibility permissions
      const forum = await discussionStorage.getForumById(thread.forumId);
      
      if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Check if user can access this forum
      if (forum.visibility === 'private') {
        if (!(req as CustomRequest).user || 
            (req as CustomRequest).user.id !== forum.createdBy) {
          return res.status(403).json({ error: 'You do not have permission to view this thread' });
        }
      }
      
      if (forum.visibility === 'circle' && forum.circleId) {
        if (!(req as CustomRequest).user) {
          return res.status(403).json({ error: 'You must be logged in to view circle threads' });
        }
        
        // Check if user is a member of this circle
        const currentUserId = (req as CustomRequest).user.id;
        const circleMember = await actionCircleStorage.getCircleMember(
          forum.circleId, 
          currentUserId
        );
        
        if (!circleMember) {
          return res.status(403).json({ 
            error: 'You must be a member of this circle to view its threads' 
          });
        }
      }
      
      // Determine if user is a moderator (to show moderated content)
      const isModerator = (req as CustomRequest).user ? 
        await discussionStorage.isUserModerator((req as CustomRequest).user.id, thread.forumId) : 
        false;
      
      // Parse query parameters
      const options: any = {
        threadId: Number(threadId),
        includeModerated: isModerator && includeModerated === 'true',
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };
      
      // Parse moderation status filter (moderators only)
      if (isModerator && modStatus) {
        options.modStatus = (modStatus as string).split(',');
      }
      
      const posts = await discussionStorage.getPosts(options);
      res.json(posts);
    } catch (error: any) {
      console.error('Error getting posts:', error);
      res.status(500).json({ error: 'Failed to retrieve posts' });
    }
  });
  
  /**
   * Create a new post (reply)
   */
  app.post('/api/discussions/threads/:threadId/posts', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { threadId } = req.params;
      
      // Check if thread exists and is not locked
      const thread = await discussionStorage.getThreadById(Number(threadId));
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      if (thread.isLocked) {
        return res.status(403).json({ error: 'This thread is locked and cannot receive new replies' });
      }
      
      // Get forum to check visibility and posting permissions
      const forum = await discussionStorage.getForumById(thread.forumId);
      
      if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Check if user can post in this forum
      if (forum.visibility === 'private' && forum.createdBy !== req.user.id) {
        return res.status(403).json({ 
          error: 'You do not have permission to post in this private forum' 
        });
      }
      
      if (forum.visibility === 'circle' && forum.circleId) {
        // Check if user is a member of this circle
        const circleMember = await actionCircleStorage.getCircleMember(
          forum.circleId, 
          req.user.id
        );
        
        if (!circleMember) {
          return res.status(403).json({ 
            error: 'You must be a member of this circle to post in its forums' 
          });
        }
      }
      
      // Validate the request body
      const validatedData = insertDiscussionPostSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid post data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check if referenced reply exists if replyToId is provided
      if (validatedData.data.replyToId) {
        const referencedPost = await discussionStorage.getPostById(validatedData.data.replyToId);
        
        if (!referencedPost || referencedPost.threadId !== Number(threadId)) {
          return res.status(400).json({ error: 'Referenced reply does not exist in this thread' });
        }
      }
      
      // Check if user is a super user for moderation bypass
      const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
      
      // Set the user ID and thread ID
      const data = {
        ...validatedData.data,
        userId: req.user.id,
        threadId: Number(threadId),
        // Super users' posts are auto-approved, others may need moderation
        moderationStatus: isSuperUser ? 'approved' : 'approved' // Default all replies to approved for better UX
      };
      
      const post = await discussionStorage.createPost(data);
      res.status(201).json(post);
    } catch (error: any) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });
  
  /**
   * Update a post
   */
  app.patch('/api/discussions/posts/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if post exists and user has permission to edit it
      const post = await discussionStorage.getPostById(Number(id));
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Get thread and forum info for permission checks
      const thread = await discussionStorage.getThreadById(post.threadId);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Only the post creator can edit it, unless the user is a moderator
      const isCreator = post.userId === req.user.id;
      const isModerator = await discussionStorage.isUserModerator(req.user.id, thread.forumId);
      
      if (!isCreator && !isModerator) {
        return res.status(403).json({ error: 'You do not have permission to edit this post' });
      }
      
      // Validate the request body (partial validation)
      const validatedData = insertDiscussionPostSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid post data', 
          details: validatedData.error.errors 
        });
      }
      
      // Only moderators can update moderation fields
      if (!isModerator) {
        delete validatedData.data.moderationStatus;
        delete validatedData.data.moderatedBy;
        delete validatedData.data.moderationNotes;
      }
      
      const updatedPost = await discussionStorage.updatePost(
        Number(id), 
        validatedData.data
      );
      
      res.json(updatedPost);
    } catch (error: any) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });
  
  /**
   * Delete a post (soft delete)
   */
  app.delete('/api/discussions/posts/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if post exists and user has permission to delete it
      const post = await discussionStorage.getPostById(Number(id));
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Get thread and forum info for permission checks
      const thread = await discussionStorage.getThreadById(post.threadId);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Only the post creator can delete it, unless the user is a moderator
      const isCreator = post.userId === req.user.id;
      const isModerator = await discussionStorage.isUserModerator(req.user.id, thread.forumId);
      
      if (!isCreator && !isModerator) {
        return res.status(403).json({ error: 'You do not have permission to delete this post' });
      }
      
      await discussionStorage.deletePost(Number(id));
      res.json({ message: 'Post deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });
  
  /**
   * Moderate a post
   */
  app.post('/api/discussions/posts/:id/moderate', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      // Check if post exists
      const post = await discussionStorage.getPostById(Number(id));
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Get thread for forum ID
      const thread = await discussionStorage.getThreadById(post.threadId);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Verify user is a moderator
      const isModerator = await discussionStorage.isUserModerator(req.user.id, thread.forumId);
      
      if (!isModerator) {
        return res.status(403).json({ error: 'You do not have permission to moderate this post' });
      }
      
      // Validate status
      if (!['approved', 'rejected', 'flagged'].includes(status)) {
        return res.status(400).json({ error: 'Invalid moderation status' });
      }
      
      const updatedPost = await discussionStorage.moderatePost(
        Number(id),
        status as 'approved' | 'rejected' | 'flagged',
        req.user.id,
        notes
      );
      
      res.json(updatedPost);
    } catch (error: any) {
      console.error('Error moderating post:', error);
      res.status(500).json({ error: 'Failed to moderate post' });
    }
  });
  
  // ---- REACTIONS ----
  /**
   * Get reactions
   */
  app.get('/api/discussions/reactions', async (req: Request, res: Response) => {
    try {
      const { threadId, postId, userId } = req.query;
      
      const options: any = {
        threadId: threadId ? Number(threadId) : undefined,
        postId: postId ? Number(postId) : undefined,
        userId: userId ? Number(userId) : undefined,
      };
      
      const reactions = await discussionStorage.getReactions(options);
      res.json(reactions);
    } catch (error: any) {
      console.error('Error getting reactions:', error);
      res.status(500).json({ error: 'Failed to retrieve reactions' });
    }
  });
  
  /**
   * Create a reaction
   */
  app.post('/api/discussions/reactions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertDiscussionReactionSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid reaction data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check if the thread or post exists
      if (validatedData.data.threadId) {
        const thread = await discussionStorage.getThreadById(validatedData.data.threadId);
        
        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }
        
        // Check forum visibility
        const forum = await discussionStorage.getForumById(thread.forumId);
        
        if (forum.visibility !== 'public') {
          // Check permissions for non-public forums
          if (forum.visibility === 'private' && forum.createdBy !== req.user.id) {
            return res.status(403).json({ 
              error: 'You do not have permission to react to content in this private forum' 
            });
          }
          
          if (forum.visibility === 'circle' && forum.circleId) {
            const circleMember = await actionCircleStorage.getCircleMember(
              forum.circleId, 
              req.user.id
            );
            
            if (!circleMember) {
              return res.status(403).json({ 
                error: 'You must be a member of this circle to react to its content' 
              });
            }
          }
        }
      } else if (validatedData.data.postId) {
        const post = await discussionStorage.getPostById(validatedData.data.postId);
        
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }
        
        // Get thread and forum info for permission checks
        const thread = await discussionStorage.getThreadById(post.threadId);
        
        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }
        
        // Check forum visibility
        const forum = await discussionStorage.getForumById(thread.forumId);
        
        if (forum.visibility !== 'public') {
          // Check permissions for non-public forums
          if (forum.visibility === 'private' && forum.createdBy !== req.user.id) {
            return res.status(403).json({ 
              error: 'You do not have permission to react to content in this private forum' 
            });
          }
          
          if (forum.visibility === 'circle' && forum.circleId) {
            const circleMember = await actionCircleStorage.getCircleMember(
              forum.circleId, 
              req.user.id
            );
            
            if (!circleMember) {
              return res.status(403).json({ 
                error: 'You must be a member of this circle to react to its content' 
              });
            }
          }
        }
      } else {
        return res.status(400).json({ error: 'Either threadId or postId must be provided' });
      }
      
      // Set the user ID
      const data = {
        ...validatedData.data,
        userId: req.user.id
      };
      
      const reaction = await discussionStorage.createReaction(data);
      res.status(201).json(reaction);
    } catch (error: any) {
      console.error('Error creating reaction:', error);
      res.status(500).json({ error: 'Failed to create reaction' });
    }
  });
  
  /**
   * Delete a reaction
   */
  app.delete('/api/discussions/reactions/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if reaction exists and belongs to the user
      const reactions = await discussionStorage.getReactions({
        userId: req.user.id
      });
      
      const reaction = reactions.find(r => r.id === Number(id));
      
      if (!reaction) {
        return res.status(404).json({ error: 'Reaction not found or does not belong to you' });
      }
      
      await discussionStorage.deleteReaction(Number(id));
      res.json({ message: 'Reaction deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting reaction:', error);
      res.status(500).json({ error: 'Failed to delete reaction' });
    }
  });
  
  // ---- MODERATORS ----
  /**
   * Get moderators
   */
  app.get('/api/discussions/moderators', async (req: Request, res: Response) => {
    try {
      const { forumId, userId, isSuperModerator } = req.query;
      
      const options: any = {
        forumId: forumId ? Number(forumId) : undefined,
        userId: userId ? Number(userId) : undefined,
        isSuperModerator: isSuperModerator === 'true' ? true : 
                         isSuperModerator === 'false' ? false : 
                         undefined
      };
      
      const moderators = await discussionStorage.getModerators(options);
      res.json(moderators);
    } catch (error: any) {
      console.error('Error getting moderators:', error);
      res.status(500).json({ error: 'Failed to retrieve moderators' });
    }
  });
  
  /**
   * Add a moderator
   */
  app.post('/api/discussions/moderators', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertDiscussionModeratorSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid moderator data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check permissions: Only existing moderators or forum creators can add new moderators
      if (validatedData.data.forumId) {
        const forum = await discussionStorage.getForumById(validatedData.data.forumId);
        
        if (!forum) {
          return res.status(404).json({ error: 'Forum not found' });
        }
        
        const isCreator = forum.createdBy === req.user.id;
        const isModerator = await discussionStorage.isUserModerator(req.user.id, validatedData.data.forumId);
        
        if (!isCreator && !isModerator) {
          return res.status(403).json({ 
            error: 'Only the forum creator or existing moderators can add new moderators' 
          });
        }
      } else {
        // For super moderators, must be a super user or admin
        const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
        
        if (!isSuperUser) {
          return res.status(403).json({ 
            error: 'Only super users can add super moderators' 
          });
        }
      }
      
      // Set the user who added this moderator
      const data = {
        ...validatedData.data,
        addedBy: req.user.id
      };
      
      const moderator = await discussionStorage.addModerator(data);
      res.status(201).json(moderator);
    } catch (error: any) {
      console.error('Error adding moderator:', error);
      res.status(500).json({ error: 'Failed to add moderator' });
    }
  });
  
  /**
   * Remove a moderator
   */
  app.delete('/api/discussions/moderators/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if moderator record exists
      const moderators = await discussionStorage.getModerators();
      const moderator = moderators.find(m => m.id === Number(id));
      
      if (!moderator) {
        return res.status(404).json({ error: 'Moderator record not found' });
      }
      
      // Check permissions: Only the person who added the moderator, the forum creator, or a super moderator can remove
      if (moderator.forumId) {
        const forum = await discussionStorage.getForumById(moderator.forumId);
        
        if (!forum) {
          return res.status(404).json({ error: 'Forum not found' });
        }
        
        const isCreator = forum.createdBy === req.user.id;
        const isAdder = moderator.addedBy === req.user.id;
        const isSuperModerator = await discussionStorage.isUserModerator(req.user.id, undefined);
        
        if (!isCreator && !isAdder && !isSuperModerator) {
          return res.status(403).json({ 
            error: 'You do not have permission to remove this moderator' 
          });
        }
      } else {
        // For super moderators, must be a super user or admin
        const isSuperUser = await superUserStorage.isUserSuperUser(req.user.id);
        
        if (!isSuperUser) {
          return res.status(403).json({ 
            error: 'Only super users can remove super moderators' 
          });
        }
      }
      
      await discussionStorage.removeModerator(Number(id));
      res.json({ message: 'Moderator removed successfully' });
    } catch (error: any) {
      console.error('Error removing moderator:', error);
      res.status(500).json({ error: 'Failed to remove moderator' });
    }
  });
  
  // ---- REPORTS ----
  /**
   * Get reports (moderators only)
   */
  app.get('/api/discussions/reports', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Verify user is a moderator
      const isModerator = await discussionStorage.isUserModerator(req.user.id);
      
      if (!isModerator) {
        return res.status(403).json({ error: 'Only moderators can view reports' });
      }
      
      const { threadId, postId, reportedBy, status, reviewedBy, limit, offset } = req.query;
      
      const options: any = {
        threadId: threadId ? Number(threadId) : undefined,
        postId: postId ? Number(postId) : undefined,
        reportedBy: reportedBy ? Number(reportedBy) : undefined,
        status: status as string,
        reviewedBy: reviewedBy ? Number(reviewedBy) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };
      
      const reports = await discussionStorage.getReports(options);
      res.json(reports);
    } catch (error: any) {
      console.error('Error getting reports:', error);
      res.status(500).json({ error: 'Failed to retrieve reports' });
    }
  });
  
  /**
   * Create a report
   */
  app.post('/api/discussions/reports', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertDiscussionReportSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: 'Invalid report data', 
          details: validatedData.error.errors 
        });
      }
      
      // Check if the thread or post exists
      if (validatedData.data.threadId) {
        const thread = await discussionStorage.getThreadById(validatedData.data.threadId);
        
        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }
      } else if (validatedData.data.postId) {
        const post = await discussionStorage.getPostById(validatedData.data.postId);
        
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }
      } else {
        return res.status(400).json({ error: 'Either threadId or postId must be provided' });
      }
      
      // Set the user ID
      const data = {
        ...validatedData.data,
        reportedBy: req.user.id
      };
      
      const report = await discussionStorage.createReport(data);
      res.status(201).json(report);
    } catch (error: any) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  });
  
  /**
   * Update report status (moderators only)
   */
  app.patch('/api/discussions/reports/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;
      
      // Verify user is a moderator
      const isModerator = await discussionStorage.isUserModerator(req.user.id);
      
      if (!isModerator) {
        return res.status(403).json({ error: 'Only moderators can update reports' });
      }
      
      // Validate status
      if (!['pending', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid report status' });
      }
      
      const updatedReport = await discussionStorage.updateReportStatus(
        Number(id),
        status,
        req.user.id,
        resolution
      );
      
      res.json(updatedReport);
    } catch (error: any) {
      console.error('Error updating report status:', error);
      res.status(500).json({ error: 'Failed to update report status' });
    }
  });
  
  // ---- STATISTICS ----
  /**
   * Get forum statistics
   */
  app.get('/api/discussions/forums/:id/stats', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const forum = await discussionStorage.getForumById(Number(id));
      
      if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
      }
      
      // Check visibility permissions
      if (forum.visibility === 'private') {
        if (!(req as CustomRequest).user || 
            (req as CustomRequest).user.id !== forum.createdBy) {
          return res.status(403).json({ error: 'You do not have permission to view this forum' });
        }
      }
      
      if (forum.visibility === 'circle' && forum.circleId) {
        if (!(req as CustomRequest).user) {
          return res.status(403).json({ error: 'You must be logged in to view circle forums' });
        }
        
        // Check if user is a member of this circle
        const currentUserId = (req as CustomRequest).user.id;
        const circleMember = await actionCircleStorage.getCircleMember(
          forum.circleId, 
          currentUserId
        );
        
        if (!circleMember) {
          return res.status(403).json({ error: 'You must be a member of this circle to view its forums' });
        }
      }
      
      const stats = await discussionStorage.getForumStats(Number(id));
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting forum stats:', error);
      res.status(500).json({ error: 'Failed to retrieve forum statistics' });
    }
  });
  
  /**
   * Get user activity statistics
   */
  app.get('/api/discussions/users/:userId/stats', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // For privacy reasons, users can only see their own stats unless they're a moderator
      if ((req as CustomRequest).user) {
        const currentUserId = (req as CustomRequest).user.id;
        
        if (Number(userId) !== currentUserId) {
          const isModerator = await discussionStorage.isUserModerator(currentUserId);
          
          if (!isModerator) {
            return res.status(403).json({ error: 'You can only view your own user statistics' });
          }
        }
      } else {
        return res.status(403).json({ error: 'You must be logged in to view user statistics' });
      }
      
      const stats = await discussionStorage.getUserActivityStats(Number(userId));
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting user activity stats:', error);
      res.status(500).json({ error: 'Failed to retrieve user activity statistics' });
    }
  });
}