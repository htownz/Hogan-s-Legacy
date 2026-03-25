// @ts-nocheck
import express from 'express';
import { enrichFiling, batchEnrichFilings, categorizeAndEnrichFiling } from './services/scout-bot-enrichment';
import { processTecFilings, storeEnrichedFiling } from './scripts/tec-batch-processor';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { z } from 'zod';

// Define upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './data/tec-filings'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.json');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only JSON files are allowed'));
    }
  }
});

// Schema for single filing enrichment request
const filingSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  filingDate: z.string().optional(),
  filerName: z.string(),
  filingContent: z.any(),
  relatedEntities: z.array(z.string()).optional(),
  amount: z.number().optional(),
});

// Setup enhanced Scout Bot routes with authentic Texas legislator intelligence
export default function setupScoutBotAiRoutes(app: express.Express) {
  
  // Enhanced Scout Bot: Legislator Intelligence Analysis
  app.post('/api/scout-bot/analyze-legislator', async (req, res) => {
    try {
      const { legislatorName, targetIssue, constituencyFocus } = req.body;
      
      if (!legislatorName || !targetIssue) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'legislatorName and targetIssue are required'
        });
      }
      
      console.log(`🤖 Scout Bot analyzing legislator: ${legislatorName} for issue: ${targetIssue}`);
      
      // Get authentic legislator data from your OpenStates collection
      const { db } = await import('./db');
      const { legislators } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.name, legislatorName));
      
      if (!legislator) {
        return res.status(404).json({
          error: 'Legislator not found',
          message: `No authentic data found for ${legislatorName} in Texas legislature`
        });
      }
      
      // Analyze with authentic data
      const analysis = await analyzelegislatorForOutreach(legislator, targetIssue, constituencyFocus);
      
      res.json({
        success: true,
        legislator: {
          name: legislator.name,
          party: legislator.party,
          chamber: legislator.chamber,
          district: legislator.district,
          email: legislator.email
        },
        analysis,
        source: 'Authentic OpenStates Data'
      });
      
    } catch (error: any) {
      console.error('Error in Scout Bot legislator analysis:', error);
      res.status(500).json({
        error: 'Failed to analyze legislator',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced Scout Bot: Bill Targeting Intelligence
  app.post('/api/scout-bot/target-bill-sponsors', async (req, res) => {
    try {
      const { billKeywords, advocacyPosition, urgencyLevel } = req.body;
      
      if (!billKeywords || !advocacyPosition) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'billKeywords and advocacyPosition are required'
        });
      }
      
      console.log(`🎯 Scout Bot targeting bills with keywords: ${billKeywords}`);
      
      // Find relevant bills from your authentic LegiScan collection
      const { db } = await import('./db');
      const { bills } = await import('@shared/schema');
      const { like, or } = await import('drizzle-orm');
      
      const allBills = await db.select().from(bills).$dynamic().where(
        or(
          like(bills.title, `%${billKeywords}%`),
          like(bills.description, `%${billKeywords}%`)
        )
      );
      
      const relevantBills = allBills.filter(bill => 
        bill.title?.toLowerCase().includes(billKeywords.toLowerCase()) ||
        bill.description?.toLowerCase().includes(billKeywords.toLowerCase())
      );
      
      // Analyze targeting strategy
      const targetingStrategy = await generateBillTargetingStrategy(relevantBills, advocacyPosition, urgencyLevel);
      
      res.json({
        success: true,
        billsFound: relevantBills.length,
        targetingStrategy,
        relevantBills: relevantBills.slice(0, 10).map(bill => ({
          id: bill.id,
          title: bill.title,
          sponsor: bill.sponsor,
          chamber: bill.chamber,
          status: bill.status
        })),
        source: 'Authentic LegiScan Bill Collection'
      });
      
    } catch (error: any) {
      console.error('Error in Scout Bot bill targeting:', error);
      res.status(500).json({
        error: 'Failed to analyze bill targeting',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced Scout Bot: District Impact Analysis
  app.post('/api/scout-bot/district-impact', async (req, res) => {
    try {
      const { district, chamber, issueArea } = req.body;
      
      if (!district || !chamber || !issueArea) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'district, chamber, and issueArea are required'
        });
      }
      
      console.log(`📊 Scout Bot analyzing District ${district} ${chamber} impact for ${issueArea}`);
      
      // Get district legislators from authentic data
      const { storage } = await import('./storage');
      const districtLegislators = await storage.getLegislatorsByDistrict(district, chamber);
      
      // Analyze district impact
      const impactAnalysis = await analyzeDistrictImpact(district, chamber, issueArea, districtLegislators);
      
      res.json({
        success: true,
        district: `${chamber} District ${district}`,
        impactAnalysis,
        legislators: districtLegislators.map(leg => ({
          name: leg.name,
          party: leg.party,
          email: leg.email
        })),
        source: 'Authentic Texas Legislator Data'
      });
      
    } catch (error: any) {
      console.error('Error in Scout Bot district analysis:', error);
      res.status(500).json({
        error: 'Failed to analyze district impact',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced Scout Bot: Personalized Advocacy Strategy
  app.post('/api/scout-bot/generate-strategy', async (req, res) => {
    try {
      const { userDistrict, issueArea, advocacyGoal, experienceLevel } = req.body;
      
      if (!userDistrict || !issueArea || !advocacyGoal) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'userDistrict, issueArea, and advocacyGoal are required'
        });
      }
      
      console.log(`💡 Scout Bot generating personalized advocacy strategy for District ${userDistrict}`);
      
      // Get user's district legislators from authentic data
      const { storage } = await import('./storage');
      const userLegislators = await storage.getLegislatorsByDistrict(userDistrict);
      
      // Generate personalized strategy using authentic legislator intelligence
      const strategy = await generatePersonalizedAdvocacyStrategy(
        userDistrict, 
        issueArea, 
        advocacyGoal, 
        userLegislators, 
        experienceLevel || 'beginner'
      );
      
      res.json({
        success: true,
        strategy,
        yourLegislators: userLegislators.map(leg => ({
          name: leg.name,
          party: leg.party,
          chamber: leg.chamber,
          email: leg.email,
          district: leg.district
        })),
        source: 'Authentic Texas Legislator Intelligence'
      });
      
    } catch (error: any) {
      console.error('Error generating advocacy strategy:', error);
      res.status(500).json({
        error: 'Failed to generate advocacy strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to enrich a single filing
  app.post('/api/scout-bot/enrich', async (req, res) => {
    try {
      // Validate request body
      const validationResult = filingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid filing data',
          details: validationResult.error.format()
        });
      }
      
      const filing = validationResult.data;
      
      // Process with AI
      const enrichedFiling = await enrichFiling(filing);
      
      // Return result
      return res.json({
        success: true,
        enrichedFiling
      });
    } catch (error: any) {
      console.error('Error enriching filing:', error);
      return res.status(500).json({
        error: 'Failed to enrich filing',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to categorize and enrich a filing
  app.post('/api/scout-bot/categorize-and-enrich', async (req, res) => {
    try {
      const { filingType, filingData } = req.body;
      
      if (!filingType || !filingData) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'Both filingType and filingData are required'
        });
      }
      
      // Process with AI
      const result = await categorizeAndEnrichFiling(filingType, filingData);
      
      // Store in database
      if (result.enrichment.enrichmentSuccessful) {
        const entityId = await storeEnrichedFiling(result);
        result.entityId = entityId;
      }
      
      // Return result
      return res.json({
        success: true,
        result
      });
    } catch (error: any) {
      console.error('Error categorizing and enriching filing:', error);
      return res.status(500).json({
        error: 'Failed to categorize and enrich filing',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to batch enrich multiple filings
  app.post('/api/scout-bot/batch-enrich', async (req, res) => {
    try {
      const { filings } = req.body;
      
      if (!Array.isArray(filings) || filings.length === 0) {
        return res.status(400).json({
          error: 'Invalid filings data',
          details: 'Expected an array of filings'
        });
      }
      
      // Process with AI
      const enrichedFilings = await batchEnrichFilings(filings);
      
      // Return result
      return res.json({
        success: true,
        count: enrichedFilings.length,
        enrichedFilings
      });
    } catch (error: any) {
      console.error('Error batch enriching filings:', error);
      return res.status(500).json({
        error: 'Failed to batch enrich filings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to upload TEC filing JSON files for processing
  app.post('/api/scout-bot/upload-filings', upload.array('files'), async (req, res) => {
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return res.status(400).json({
          error: 'No files uploaded',
          details: 'Please upload JSON files containing TEC filings'
        });
      }
      
      const fileDetails = Array.isArray(req.files) ? req.files.map(file => ({
        originalName: file.originalname,
        savedAs: file.filename,
        size: file.size
      })) : [];
      
      // Trigger background processing
      // This is done asynchronously, so we don't wait for it to complete
      processTecFilings().catch(err => console.error('Error processing TEC filings:', err));
      
      return res.json({
        success: true,
        message: 'Files uploaded successfully and processing started',
        files: fileDetails
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      return res.status(500).json({
        error: 'Failed to upload files',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to get status of AI enrichment processing
  app.get('/api/scout-bot/processing-status', async (req, res) => {
    try {
      // Check data directories - use import.meta.url for ES modules
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dataDir = path.join(__dirname, '../data/tec-filings');
      const outputDir = path.join(__dirname, '../data/enriched-filings');
      
      let inputFiles: string[] = [];
      let outputFiles: string[] = [];
      
      try {
        const inputFilesRaw = await fs.readdir(dataDir);
        inputFiles = inputFilesRaw.filter(f => f.endsWith('.json'));
      } catch (err: any) {
        console.log('Input directory does not exist or cannot be read');
      }
      
      try {
        const outputFilesRaw = await fs.readdir(outputDir);
        outputFiles = outputFilesRaw.filter(f => f.endsWith('.json'));
      } catch (err: any) {
        console.log('Output directory does not exist or cannot be read');
      }
      
      return res.json({
        inputFileCount: inputFiles.length,
        outputFileCount: outputFiles.length,
        inputFiles,
        outputFiles,
        processingActive: global.scoutBotProcessingActive || false
      });
    } catch (error: any) {
      console.error('Error getting processing status:', error);
      return res.status(500).json({
        error: 'Failed to get processing status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  console.log('Scout Bot AI routes registered');
}