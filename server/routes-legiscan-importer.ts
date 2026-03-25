import express from 'express';
import multer from 'multer';
import { legiScanDataImporter } from './services/legiscan-data-importer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept JSON files
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
});

/**
 * Upload and import LegiScan JSON files
 */
router.post('/api/legiscan/upload', upload.array('files'), async (req, res) => {
  try {
    console.log('📁 Processing LegiScan file upload...');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files as Express.Multer.File[];
    const uploadResults = [];

    // Process each uploaded file
    for (const file of files) {
      try {
        const filePath = await legiScanDataImporter.processUploadedFile(file);
        uploadResults.push({
          filename: file.originalname,
          size: file.size,
          path: filePath,
          success: true
        });
      } catch (error: any) {
        uploadResults.push({
          filename: file.originalname,
          size: file.size,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ Uploaded ${uploadResults.filter(r => r.success).length} files successfully`);

    res.json({
      success: true,
      message: `Uploaded ${uploadResults.filter(r => r.success).length} files`,
      files: uploadResults
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Import LegiScan data from uploaded files
 */
router.post('/api/legiscan/import', async (req, res) => {
  try {
    console.log('🚀 Starting LegiScan data import...');
    
    const results = await legiScanDataImporter.importLegiScanData();
    
    console.log(`✅ Import completed: ${results.billsImported} bills, ${results.legislatorsImported} legislators`);
    
    res.json({
      success: results.success,
      message: `Successfully imported ${results.billsImported} bills and ${results.legislatorsImported} legislators`,
      data: {
        billsImported: results.billsImported,
        legislatorsImported: results.legislatorsImported,
        errors: results.errors,
        bills: results.data.bills,
        legislators: results.data.legislators
      }
    });

  } catch (error: any) {
    console.error('❌ Import error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get import statistics
 */
router.get('/api/legiscan/stats', async (req, res) => {
  try {
    const stats = await legiScanDataImporter.getImportStats();
    
    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;