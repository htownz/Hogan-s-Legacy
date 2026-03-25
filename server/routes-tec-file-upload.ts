// @ts-nocheck
import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { tecUploadStorage } from "./storage-tec-uploads";
import { processTECReports } from "./tecProcessorWrapper.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/tec-files');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    // Preserve original extension
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// File filter to only allow CSV files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only CSV files
  if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
});

// Router
export const router = Router();

// Schema for upload file options
const fileUploadOptionsSchema = z.object({
  fileType: z.enum([
    'campaign_contributions', 
    'campaign_expenditures', 
    'lobbyist_registrations', 
    'firm_registrations', 
    'ethics_violations', 
    'corrected_filings',
    'generic'
  ]),
  description: z.string().optional(),
  processImmediately: z.boolean().optional().default(true)
});

// Upload a new TEC file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Parse and validate options
    let options;
    try {
      options = fileUploadOptionsSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ error: 'Invalid file options', details: error });
    }
    
    // Calculate file hash for duplicate detection
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Create file upload record
    const fileUpload = await tecUploadStorage.createFileUpload({
      userId: req.user?.id,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      fileType: options.fileType,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash,
      status: options.processImmediately ? 'processing' : 'pending',
      processingStartedAt: options.processImmediately ? new Date() : undefined
    });
    
    // Process the file immediately if requested
    if (options.processImmediately) {
      // Start processing in background
      processTECFile(fileUpload.id, req.file.path).catch(error => {
        console.error(`Error processing TEC file ${fileUpload.id}:`, error);
      });
    }
    
    res.status(201).json({
      id: fileUpload.id,
      status: fileUpload.status,
      message: options.processImmediately ? 
        'File uploaded and processing started' : 
        'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading TEC file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all file uploads for the current user
router.get('/uploads', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const uploads = await tecUploadStorage.getFileUploadsByUserId(userId);
    res.json(uploads);
  } catch (error: any) {
    console.error('Error retrieving user uploads:', error);
    res.status(500).json({ error: 'Failed to retrieve uploads' });
  }
});

// Get file upload by ID
router.get('/uploads/:id', async (req, res) => {
  try {
    const fileUpload = await tecUploadStorage.getFileUploadById(req.params.id);
    
    if (!fileUpload) {
      return res.status(404).json({ error: 'File upload not found' });
    }
    
    // Check if user has access to this upload
    if (fileUpload.userId && fileUpload.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(fileUpload);
  } catch (error: any) {
    console.error('Error retrieving file upload:', error);
    res.status(500).json({ error: 'Failed to retrieve file upload' });
  }
});

// Start processing a pending file
router.post('/uploads/:id/process', async (req, res) => {
  try {
    const fileUpload = await tecUploadStorage.getFileUploadById(req.params.id);
    
    if (!fileUpload) {
      return res.status(404).json({ error: 'File upload not found' });
    }
    
    // Check if user has access to this upload
    if (fileUpload.userId && fileUpload.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (fileUpload.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Invalid status', 
        message: `Cannot process file in '${fileUpload.status}' status` 
      });
    }
    
    // Update status to processing
    const updatedUpload = await tecUploadStorage.updateFileUploadStatus(fileUpload.id, 'processing');
    
    // Get file path
    const filePath = path.join(__dirname, '../uploads/tec-files', fileUpload.storedFilename);
    
    // Start processing in background
    processTECFile(fileUpload.id, filePath).catch(error => {
      console.error(`Error processing TEC file ${fileUpload.id}:`, error);
    });
    
    res.json({
      id: updatedUpload.id,
      status: updatedUpload.status,
      message: 'Processing started'
    });
  } catch (error: any) {
    console.error('Error starting file processing:', error);
    res.status(500).json({ error: 'Failed to start processing' });
  }
});

// Get moderation queue items for a file upload
router.get('/uploads/:id/moderation', async (req, res) => {
  try {
    const fileUpload = await tecUploadStorage.getFileUploadById(req.params.id);
    
    if (!fileUpload) {
      return res.status(404).json({ error: 'File upload not found' });
    }
    
    // Check if user has access to this upload
    if (fileUpload.userId && fileUpload.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const moderationItems = await tecUploadStorage.getModerationQueueByFileUploadId(
      fileUpload.id, limit, offset
    );
    
    res.json(moderationItems);
  } catch (error: any) {
    console.error('Error retrieving moderation queue:', error);
    res.status(500).json({ error: 'Failed to retrieve moderation queue' });
  }
});

// Get all pending moderation items
router.get('/moderation/pending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const moderationItems = await tecUploadStorage.getPendingModerationItems(limit, offset);
    const count = await tecUploadStorage.countPendingModeration();
    
    res.json({
      items: moderationItems,
      total: count,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Error retrieving pending moderation:', error);
    res.status(500).json({ error: 'Failed to retrieve pending moderation items' });
  }
});

// Get a specific moderation queue item
router.get('/moderation/:id', async (req, res) => {
  try {
    const moderationItem = await tecUploadStorage.getModerationQueueItemById(req.params.id);
    
    if (!moderationItem) {
      return res.status(404).json({ error: 'Moderation item not found' });
    }
    
    res.json(moderationItem);
  } catch (error: any) {
    console.error('Error retrieving moderation item:', error);
    res.status(500).json({ error: 'Failed to retrieve moderation item' });
  }
});

// Approve a moderation queue item
router.post('/moderation/:id/approve', async (req, res) => {
  try {
    const moderationItem = await tecUploadStorage.getModerationQueueItemById(req.params.id);
    
    if (!moderationItem) {
      return res.status(404).json({ error: 'Moderation item not found' });
    }
    
    const reviewSchema = z.object({
      entityId: z.string().uuid(),
      notes: z.string().optional()
    });
    
    let reviewData;
    try {
      reviewData = reviewSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ error: 'Invalid request data', details: error });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const approvedItem = await tecUploadStorage.approveModerationQueueItem(
      moderationItem.id,
      userId,
      reviewData.entityId,
      reviewData.notes
    );
    
    res.json({
      ...approvedItem,
      message: 'Moderation item approved'
    });
  } catch (error: any) {
    console.error('Error approving moderation item:', error);
    res.status(500).json({ error: 'Failed to approve moderation item' });
  }
});

// Reject a moderation queue item
router.post('/moderation/:id/reject', async (req, res) => {
  try {
    const moderationItem = await tecUploadStorage.getModerationQueueItemById(req.params.id);
    
    if (!moderationItem) {
      return res.status(404).json({ error: 'Moderation item not found' });
    }
    
    const reviewSchema = z.object({
      notes: z.string().optional()
    });
    
    let reviewData;
    try {
      reviewData = reviewSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ error: 'Invalid request data', details: error });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const rejectedItem = await tecUploadStorage.rejectModerationQueueItem(
      moderationItem.id,
      userId,
      reviewData.notes
    );
    
    res.json({
      ...rejectedItem,
      message: 'Moderation item rejected'
    });
  } catch (error: any) {
    console.error('Error rejecting moderation item:', error);
    res.status(500).json({ error: 'Failed to reject moderation item' });
  }
});

// Function to process TEC file in the background
async function processTECFile(fileId: string, filePath: string): Promise<void> {
  try {
    // Get the file info
    const fileUpload = await tecUploadStorage.getFileUploadById(fileId);
    if (!fileUpload) {
      throw new Error(`File upload ${fileId} not found`);
    }
    
    // Process the file with tecProcessor
    const result = await processTECReports(filePath, {
      fileType: fileUpload.fileType as any,
      fileUploadId: fileUpload.id,
      createModerationItem: async (itemData: any) => {
        return await tecUploadStorage.createModerationQueueItem({
          fileUploadId: fileUpload.id,
          entityName: itemData.name,
          entityType: itemData.type,
          significanceScore: itemData.significanceScore || 0,
          transactionCount: itemData.transactionCount || 0,
          financialTotal: itemData.financialTotal || 0,
          connectionCount: itemData.connectionCount || 0,
          relatedEntities: itemData.relatedEntities || [],
          sampleData: itemData.sampleData || [],
          aiSummary: itemData.aiSummary,
          flags: itemData.flags || []
        });
      }
    });
    
    // Update file upload with processing results
    await tecUploadStorage.updateFileUploadProcessingStats(fileId, {
      recordsTotal: result.recordsTotal,
      recordsProcessed: result.recordsProcessed,
      entitiesFound: result.entitiesFound,
      transactionsFound: result.transactionsFound,
      relationshipsFound: result.relationshipsFound,
      moderationQueueItems: result.moderationQueueItems
    });
    
    // Mark as completed
    await tecUploadStorage.updateFileUploadStatus(fileId, 'completed');
    
    console.log(`TEC file ${fileId} processing completed successfully`);
  } catch (error: any) {
    console.error(`Error processing TEC file ${fileId}:`, error);
    // Mark as failed with error message
    await tecUploadStorage.updateFileUploadStatus(
      fileId, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}