import { Express, Request, Response } from 'express';
import { documentStorage } from './storage-documents';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { z } from 'zod';
import { insertDocumentSchema, insertDocumentShareSchema, insertDocumentCommentSchema, insertDocumentCollectionSchema } from '../shared/schema-documents';
import multer from 'multer';
import { s3Service } from './aws/s3Service';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB max file size
  },
});

/**
 * Register document API routes
 */
export function registerDocumentRoutes(app: Express): void {
  /**
   * Upload a document
   */
  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: CustomRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        title,
        description = '',
        category = '',
        isPublic = false,
        allowComments = true,
        tags = [],
      } = req.body;

      // Validate request
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Generate a unique file key
      const fileExtension = path.extname(file.originalname);
      const fileKey = `documents/${req.session.userId}/${uuidv4()}${fileExtension}`;
      
      // Upload file to S3
      await s3Service.uploadFile(
        fileKey,
        file.buffer,
        file.mimetype
      );

      // Create document record
      const document = await documentStorage.createDocument({
        ownerId: req.session.userId,
        title,
        description,
        fileKey,
        fileType: file.mimetype,
        fileName: file.originalname,
        fileSize: file.size,
        isPublic: isPublic === 'true',
        allowComments: allowComments === 'true',
        category,
        tags: tags ? JSON.parse(tags) : undefined,
      });

      res.status(201).json(document);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  /**
   * Get user's documents
   */
  app.get('/api/documents', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documents = await documentStorage.getDocumentsByOwnerId(req.session.userId);
      res.json(documents);
    } catch (error: any) {
      console.error('Error getting documents:', error);
      res.status(500).json({ error: 'Failed to get documents' });
    }
  });

  /**
   * Get public documents
   */
  app.get('/api/documents/public', async (req: Request, res: Response) => {
    try {
      const documents = await documentStorage.getPublicDocuments();
      res.json(documents);
    } catch (error: any) {
      console.error('Error getting public documents:', error);
      res.status(500).json({ error: 'Failed to get public documents' });
    }
  });

  /**
   * Search documents
   */
  app.get('/api/documents/search', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const documents = await documentStorage.searchDocuments(req.session.userId, query);
      res.json(documents);
    } catch (error: any) {
      console.error('Error searching documents:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  });

  /**
   * Get a document by ID
   */
  app.get('/api/documents/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check access permissions
      if (document.ownerId !== req.session.userId && !document.isPublic) {
        // Check if the document is shared with the user
        const sharedDocuments = await documentStorage.getDocumentsSharedWithUser(req.session.userId);
        const isShared = sharedDocuments.some(d => d.id === documentId);
        
        if (!isShared) {
          return res.status(403).json({ error: 'You do not have access to this document' });
        }
      }

      res.json(document);
    } catch (error: any) {
      console.error('Error getting document:', error);
      res.status(500).json({ error: 'Failed to get document' });
    }
  });

  /**
   * Update a document
   */
  app.patch('/api/documents/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Validate request body
      const updateSchema = insertDocumentSchema.partial().omit({ 
        ownerId: true, 
        fileKey: true, 
        fileUrl: true,
        fileType: true,
        fileName: true,
        fileSize: true,
      });
      
      const validatedData = updateSchema.parse(req.body);

      // Check if the document exists and belongs to the user
      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (document.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to update this document' });
      }

      // Update the document
      const updatedDocument = await documentStorage.updateDocument(documentId, validatedData);
      res.json(updatedDocument);
    } catch (error: any) {
      console.error('Error updating document:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid document data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update document' });
    }
  });

  /**
   * Delete a document
   */
  app.delete('/api/documents/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Check if the document exists and belongs to the user
      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (document.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to delete this document' });
      }

      // Delete the document
      const success = await documentStorage.deleteDocument(documentId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete document' });
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  /**
   * Generate a download URL for a document
   */
  app.get('/api/documents/:id/download', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Check if the document exists
      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check access permissions
      if (document.ownerId !== req.session.userId && !document.isPublic) {
        // Check if the document is shared with the user
        const sharedDocuments = await documentStorage.getDocumentsSharedWithUser(req.session.userId);
        const isShared = sharedDocuments.some(d => d.id === documentId);
        
        if (!isShared) {
          return res.status(403).json({ error: 'You do not have access to this document' });
        }
      }

      // Increment download count
      await documentStorage.incrementDownloadCount(documentId);

      // Generate a pre-signed download URL
      const downloadUrl = await s3Service.getDownloadUrl(document.fileKey, document.fileName);
      
      res.json({ downloadUrl });
    } catch (error: any) {
      console.error('Error generating download URL:', error);
      res.status(500).json({ error: 'Failed to generate download URL' });
    }
  });

  /**
   * Share a document with a user
   */
  app.post('/api/documents/:id/share/user', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Validate request body
      const { userId, permission = 'view' } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Check if the document exists and belongs to the user
      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (document.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to share this document' });
      }

      // Share the document
      const share = await documentStorage.shareDocumentWithUser({
        documentId,
        sharedById: req.session.userId,
        sharedWithId: userId,
        accessPermission: permission,
      });

      res.status(201).json(share);
    } catch (error: any) {
      console.error('Error sharing document with user:', error);
      res.status(500).json({ error: 'Failed to share document with user' });
    }
  });

  /**
   * Create a public share link for a document
   */
  app.post('/api/documents/:id/share/link', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Validate request body
      const { permission = 'view', expiresInHours } = req.body;

      // Check if the document exists and belongs to the user
      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (document.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to share this document' });
      }

      // Calculate expiration date if provided
      let expiresAt: Date | undefined;
      if (expiresInHours) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(expiresInHours));
      }

      // Create a public share link
      const accessLink = await documentStorage.createPublicShareLink(
        documentId,
        req.session.userId,
        permission,
        expiresAt
      );

      res.status(201).json({ 
        accessLink,
        url: `${req.protocol}://${req.get('host')}/shared-document/${accessLink}`
      });
    } catch (error: any) {
      console.error('Error creating public share link:', error);
      res.status(500).json({ error: 'Failed to create public share link' });
    }
  });

  /**
   * Get document by share link
   */
  app.get('/api/documents/share/:link', async (req: Request, res: Response) => {
    try {
      const accessLink = req.params.link;

      // Get the document
      const result = await documentStorage.getDocumentByShareLink(accessLink);
      if (!result) {
        return res.status(404).json({ error: 'Shared document not found or link has expired' });
      }

      res.json({
        document: result.document,
        permission: result.permission
      });
    } catch (error: any) {
      console.error('Error getting shared document:', error);
      res.status(500).json({ error: 'Failed to get shared document' });
    }
  });

  /**
   * Get document shares
   */
  app.get('/api/documents/:id/shares', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Check if the document exists and belongs to the user
      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (document.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to view shares for this document' });
      }

      // Get shares
      const shares = await documentStorage.getDocumentShares(documentId);
      res.json(shares);
    } catch (error: any) {
      console.error('Error getting document shares:', error);
      res.status(500).json({ error: 'Failed to get document shares' });
    }
  });

  /**
   * Delete a document share
   */
  app.delete('/api/documents/shares/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const shareId = parseInt(req.params.id);
      if (isNaN(shareId)) {
        return res.status(400).json({ error: 'Invalid share ID' });
      }

      // Delete the share
      const success = await documentStorage.deleteDocumentShare(shareId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete share' });
      }
    } catch (error: any) {
      console.error('Error deleting document share:', error);
      res.status(500).json({ error: 'Failed to delete document share' });
    }
  });

  /**
   * Add a comment to a document
   */
  app.post('/api/documents/:id/comments', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Validate request body
      const { content, parentId } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      // Check if the document exists
      const document = await documentStorage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check if comments are allowed
      if (!document.allowComments) {
        return res.status(403).json({ error: 'Comments are not allowed on this document' });
      }

      // Check access permissions
      if (document.ownerId !== req.session.userId && !document.isPublic) {
        // Check if the document is shared with the user
        const sharedDocuments = await documentStorage.getDocumentsSharedWithUser(req.session.userId);
        const isShared = sharedDocuments.some(d => d.id === documentId);
        
        if (!isShared) {
          return res.status(403).json({ error: 'You do not have access to this document' });
        }
      }

      // Add the comment
      const comment = await documentStorage.addDocumentComment({
        documentId,
        userId: req.session.userId,
        content,
        parentId: parentId ? parseInt(parentId) : undefined,
      });

      res.status(201).json(comment);
    } catch (error: any) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  /**
   * Get document comments
   */
  app.get('/api/documents/:id/comments', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Get comments
      const comments = await documentStorage.getDocumentComments(documentId);
      res.json(comments);
    } catch (error: any) {
      console.error('Error getting document comments:', error);
      res.status(500).json({ error: 'Failed to get document comments' });
    }
  });

  /**
   * Get comment replies
   */
  app.get('/api/documents/comments/:id/replies', async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment ID' });
      }

      // Get replies
      const replies = await documentStorage.getCommentReplies(commentId);
      res.json(replies);
    } catch (error: any) {
      console.error('Error getting comment replies:', error);
      res.status(500).json({ error: 'Failed to get comment replies' });
    }
  });

  /**
   * Update a comment
   */
  app.patch('/api/documents/comments/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment ID' });
      }

      // Validate request body
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      // Update the comment
      const updatedComment = await documentStorage.updateDocumentComment(commentId, content);
      if (!updatedComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json(updatedComment);
    } catch (error: any) {
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Failed to update comment' });
    }
  });

  /**
   * Delete a comment
   */
  app.delete('/api/documents/comments/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment ID' });
      }

      // Delete the comment
      const success = await documentStorage.deleteDocumentComment(commentId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ error: 'Comment not found' });
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  /**
   * Create a document collection
   */
  app.post('/api/collections', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertDocumentCollectionSchema.parse({
        ...req.body,
        ownerId: req.session.userId,
      });

      // Create the collection
      const collection = await documentStorage.createCollection(validatedData);
      res.status(201).json(collection);
    } catch (error: any) {
      console.error('Error creating collection:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid collection data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create collection' });
    }
  });

  /**
   * Get user's collections
   */
  app.get('/api/collections', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const collections = await documentStorage.getCollectionsByOwnerId(req.session.userId);
      res.json(collections);
    } catch (error: any) {
      console.error('Error getting collections:', error);
      res.status(500).json({ error: 'Failed to get collections' });
    }
  });

  /**
   * Get public collections
   */
  app.get('/api/collections/public', async (req: Request, res: Response) => {
    try {
      const collections = await documentStorage.getPublicCollections();
      res.json(collections);
    } catch (error: any) {
      console.error('Error getting public collections:', error);
      res.status(500).json({ error: 'Failed to get public collections' });
    }
  });

  /**
   * Get a collection by ID
   */
  app.get('/api/collections/:id', async (req: Request, res: Response) => {
    try {
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) {
        return res.status(400).json({ error: 'Invalid collection ID' });
      }

      const collection = await documentStorage.getCollectionById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      res.json(collection);
    } catch (error: any) {
      console.error('Error getting collection:', error);
      res.status(500).json({ error: 'Failed to get collection' });
    }
  });

  /**
   * Update a collection
   */
  app.patch('/api/collections/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) {
        return res.status(400).json({ error: 'Invalid collection ID' });
      }

      // Check if the collection exists and belongs to the user
      const collection = await documentStorage.getCollectionById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (collection.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to update this collection' });
      }

      // Validate and update the collection
      const updateSchema = insertDocumentCollectionSchema.partial().omit({ ownerId: true });
      const validatedData = updateSchema.parse(req.body);

      const updatedCollection = await documentStorage.updateCollection(collectionId, validatedData);
      res.json(updatedCollection);
    } catch (error: any) {
      console.error('Error updating collection:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid collection data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update collection' });
    }
  });

  /**
   * Delete a collection
   */
  app.delete('/api/collections/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) {
        return res.status(400).json({ error: 'Invalid collection ID' });
      }

      // Check if the collection exists and belongs to the user
      const collection = await documentStorage.getCollectionById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (collection.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to delete this collection' });
      }

      // Delete the collection
      const success = await documentStorage.deleteCollection(collectionId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete collection' });
      }
    } catch (error: any) {
      console.error('Error deleting collection:', error);
      res.status(500).json({ error: 'Failed to delete collection' });
    }
  });

  /**
   * Add a document to a collection
   */
  app.post('/api/collections/:id/documents', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) {
        return res.status(400).json({ error: 'Invalid collection ID' });
      }

      // Validate request body
      const { documentId, displayOrder = 0 } = req.body;
      if (!documentId) {
        return res.status(400).json({ error: 'Document ID is required' });
      }

      // Check if the collection exists and belongs to the user
      const collection = await documentStorage.getCollectionById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (collection.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to modify this collection' });
      }

      // Add the document to the collection
      const collectionItem = await documentStorage.addDocumentToCollection({
        collectionId,
        documentId,
        displayOrder,
      });

      res.status(201).json(collectionItem);
    } catch (error: any) {
      console.error('Error adding document to collection:', error);
      res.status(500).json({ error: 'Failed to add document to collection' });
    }
  });

  /**
   * Get documents in a collection
   */
  app.get('/api/collections/:id/documents', async (req: Request, res: Response) => {
    try {
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) {
        return res.status(400).json({ error: 'Invalid collection ID' });
      }

      // Get documents in the collection
      const documents = await documentStorage.getDocumentsInCollection(collectionId);
      res.json(documents);
    } catch (error: any) {
      console.error('Error getting documents in collection:', error);
      res.status(500).json({ error: 'Failed to get documents in collection' });
    }
  });

  /**
   * Remove a document from a collection
   */
  app.delete('/api/collections/:collectionId/documents/:documentId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const collectionId = parseInt(req.params.collectionId);
      const documentId = parseInt(req.params.documentId);
      if (isNaN(collectionId) || isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid collection or document ID' });
      }

      // Check if the collection exists and belongs to the user
      const collection = await documentStorage.getCollectionById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (collection.ownerId !== req.session.userId) {
        return res.status(403).json({ error: 'You are not authorized to modify this collection' });
      }

      // Remove the document from the collection
      const success = await documentStorage.removeDocumentFromCollection(collectionId, documentId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ error: 'Document not found in collection' });
      }
    } catch (error: any) {
      console.error('Error removing document from collection:', error);
      res.status(500).json({ error: 'Failed to remove document from collection' });
    }
  });
}