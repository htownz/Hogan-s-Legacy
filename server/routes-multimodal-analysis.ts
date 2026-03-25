// @ts-nocheck
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  analyzeImage, 
  analyzeChart, 
  analyzeTestimony, 
  extractTextFromImage
} from './services/multimodal-analysis-service';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'multimodal');
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
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/)) {
      return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Analyze an uploaded image
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Get additional context from the request body
    const context = req.body.context ? JSON.parse(req.body.context) : {};
    const analysisType = req.body.analysisType || 'general';
    
    // Read the uploaded file
    const filePath = req.file.path;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Analyze the image
    const result = await analyzeImage(base64Image, context, analysisType);
    
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

// Analyze an image from a URL
router.post('/analyze-image-url', async (req, res) => {
  try {
    const { imageUrl, context, analysisType } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'No image URL provided' });
    }
    
    // Analyze the image from URL
    const result = await analyzeImage(imageUrl, context || {}, analysisType || 'general');
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error in image URL analysis endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Analyze a chart/graph image
router.post('/analyze-chart', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Get additional context from the request body
    const context = req.body.context ? JSON.parse(req.body.context) : {};
    
    // Read the uploaded file
    const filePath = req.file.path;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Analyze the chart
    const result = await analyzeChart(base64Image, context);
    
    // Clean up - delete the temporary file
    fs.unlinkSync(filePath);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error in chart analysis endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Analyze testimony image
router.post('/analyze-testimony', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Get additional context from the request body
    const context = req.body.context ? JSON.parse(req.body.context) : {};
    
    // Read the uploaded file
    const filePath = req.file.path;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Analyze the testimony image
    const result = await analyzeTestimony(base64Image, context);
    
    // Clean up - delete the temporary file
    fs.unlinkSync(filePath);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error in testimony analysis endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Extract text from an image using OCR
router.post('/extract-text', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    // Read the uploaded file
    const filePath = req.file.path;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Extract text from the image
    const text = await extractTextFromImage(base64Image);
    
    // Clean up - delete the temporary file
    fs.unlinkSync(filePath);
    
    return res.json({ success: true, data: { text } });
  } catch (error: any) {
    console.error('Error in text extraction endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Extract text from an image URL
router.post('/extract-text-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'No image URL provided' });
    }
    
    // Extract text from the image URL
    const text = await extractTextFromImage(imageUrl);
    
    return res.json({ success: true, data: { text } });
  } catch (error: any) {
    console.error('Error in text extraction from URL endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// Additional feature - extract text from PDF or image
router.post('/extract-document-text', upload.single('document'), (req, res) => {
  return res.status(501).json({ success: false, error: 'This feature is not yet implemented' });
});

export default router;