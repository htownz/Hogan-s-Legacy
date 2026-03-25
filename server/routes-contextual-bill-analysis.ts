// @ts-nocheck
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  performComprehensiveBillAnalysis,
  analyzeBillContextualImage,
  getWitnessTestimonyForBill,
  getOfficialStatementsAboutTopic,
  getCampaignFinanceConnections,
  analyzeNarrativeContext,
  indexBillForContextualAnalysis,
  findRelatedBills,
  generateEnhancedBillAnalysis
} from './services/contextual-bill-analysis-service';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'bill-analysis');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Perform comprehensive bill analysis
router.get('/bill/:billId/analysis', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    // Parse optional parameters
    const includeWitnessTestimony = req.query.includeWitnessTestimony !== 'false';
    const includeOfficialStatements = req.query.includeOfficialStatements !== 'false';
    const includeCampaignFinance = req.query.includeCampaignFinance !== 'false';
    const includeNarrativeContext = req.query.includeNarrativeContext !== 'false';
    
    const analysis = await performComprehensiveBillAnalysis(
      billId, 
      includeWitnessTestimony,
      includeOfficialStatements,
      includeCampaignFinance,
      includeNarrativeContext
    );
    
    return res.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Error in bill analysis endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Get witness testimony for a bill
router.get('/bill/:billId/testimony', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string, 10) : undefined;
    
    const testimony = await getWitnessTestimonyForBill(billId, sessionId);
    
    return res.json({ success: true, data: testimony });
  } catch (error: any) {
    console.error('Error in witness testimony endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Get official statements about a topic
router.get('/statements', async (req, res) => {
  try {
    const query = req.query.query as string;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    const statements = await getOfficialStatementsAboutTopic(query, limit);
    
    return res.json({ success: true, data: statements });
  } catch (error: any) {
    console.error('Error in official statements endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Get campaign finance connections for a bill
router.get('/bill/:billId/finance', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    const connections = await getCampaignFinanceConnections(billId);
    
    return res.json({ success: true, data: connections });
  } catch (error: any) {
    console.error('Error in campaign finance endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Get narrative context for a bill
router.get('/bill/:billId/narrative', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    const narrative = await analyzeNarrativeContext(billId);
    
    return res.json({ success: true, data: narrative });
  } catch (error: any) {
    console.error('Error in narrative context endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Analyze an image in the context of a bill
router.post('/bill/:billId/image-analysis', upload.single('image'), async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    // Read the uploaded file
    const filePath = req.file.path;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Analyze the image in the context of the bill
    const result = await analyzeBillContextualImage(billId, base64Image);
    
    // Clean up - delete the temporary file
    fs.unlinkSync(filePath);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error in image analysis endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Analyze an image URL in the context of a bill
router.post('/bill/:billId/image-url-analysis', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'No image URL provided' });
    }
    
    // Analyze the image URL in the context of the bill
    const result = await analyzeBillContextualImage(billId, imageUrl);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error in image URL analysis endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Index a bill in the vector database
router.post('/bill/:billId/index', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    // Index the bill for contextual analysis
    const result = await indexBillForContextualAnalysis(billId);
    
    return res.json({
      success: result,
      message: result ? 'Bill successfully indexed' : 'Failed to index bill'
    });
  } catch (error: any) {
    console.error('Error in bill indexing endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Find bills related to a specific bill
router.get('/bill/:billId/related', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    
    // Find related bills
    const relatedBills = await findRelatedBills(billId, limit);
    
    return res.json({
      success: true,
      data: relatedBills
    });
  } catch (error: any) {
    console.error('Error in related bills endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Generate enhanced bill analysis with RAG
router.post('/bill/:billId/enhanced-analysis', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ success: false, error: 'Invalid bill ID' });
    }
    
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    // Generate enhanced analysis
    const analysis = await generateEnhancedBillAnalysis(billId, query);
    
    return res.json(analysis);
  } catch (error: any) {
    console.error('Error in enhanced analysis endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

export default router;