import express from 'express';
import { advancedScoutBot } from './services/advanced-scout-bot.js';
import { createLogger } from "./logger";
const log = createLogger("routes-scout-bot-enhanced");


const router = express.Router();

// Advanced Entity Extraction
router.post('/api/scout-bot/extract-entities', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required for entity extraction' });
    }

    const entities = await advancedScoutBot.extractEntitiesFromText(text);
    
    res.json({
      success: true,
      entities,
      extractionMetadata: {
        textLength: text.length,
        entitiesFound: entities.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    log.error({ err: error }, 'Entity extraction error');
    res.status(500).json({ 
      error: 'Entity extraction failed',
      details: 'Please ensure you have proper API keys configured'
    });
  }
});

// Advanced Research Engine
router.post('/api/scout-bot/research', async (req, res) => {
  try {
    const { topic, scope, timeframe, focus, depth } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Research topic is required' });
    }

    const query = {
      topic,
      scope: scope || 'state',
      timeframe,
      focus,
      depth: depth || 'detailed'
    };

    const researchResult = await advancedScoutBot.conductAdvancedResearch(query);
    
    res.json({
      success: true,
      result: researchResult,
      researchMetadata: {
        queryProcessed: query,
        timestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    });

  } catch (error: any) {
    log.error({ err: error }, 'Advanced research error');
    res.status(500).json({ 
      error: 'Research analysis failed',
      details: 'Please ensure you have proper API keys configured'
    });
  }
});

// Network Analysis
router.post('/api/scout-bot/analyze-network', async (req, res) => {
  try {
    const { entityName } = req.body;
    
    if (!entityName) {
      return res.status(400).json({ error: 'Entity name is required for network analysis' });
    }

    const networkConnections = await advancedScoutBot.analyzeInfluenceNetwork(entityName);
    
    res.json({
      success: true,
      entity: entityName,
      connections: networkConnections,
      networkMetrics: {
        totalConnections: networkConnections.length,
        strongConnections: networkConnections.filter(c => c.strength > 0.7).length,
        directConnections: networkConnections.filter(c => c.directness === 'direct').length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    log.error({ err: error }, 'Network analysis error');
    res.status(500).json({ 
      error: 'Network analysis failed',
      details: 'Please ensure you have proper API keys configured'
    });
  }
});

// Ethics Scanner
router.post('/api/scout-bot/scan-ethics', async (req, res) => {
  try {
    const { entityProfile } = req.body;
    
    if (!entityProfile) {
      return res.status(400).json({ error: 'Entity profile is required for ethics scanning' });
    }

    const ethicsFlags = await advancedScoutBot.scanForEthicsIssues(entityProfile);
    
    res.json({
      success: true,
      entity: entityProfile.name,
      flags: ethicsFlags,
      ethicsMetrics: {
        totalFlags: ethicsFlags.length,
        highSeverityFlags: ethicsFlags.filter(f => f.severity === 'high').length,
        averageConfidence: ethicsFlags.length > 0 
          ? ethicsFlags.reduce((sum, f) => sum + f.confidenceScore, 0) / ethicsFlags.length 
          : 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    log.error({ err: error }, 'Ethics scanning error');
    res.status(500).json({ 
      error: 'Ethics scanning failed',
      details: 'Please ensure you have proper API keys configured'
    });
  }
});

// Demo Research Queries
router.get('/api/scout-bot/demo-queries', (req, res) => {
  res.json({
    success: true,
    demoQueries: [
      {
        id: 'texas-energy-policy',
        topic: 'Texas renewable energy legislation and stakeholders',
        scope: 'state',
        focus: 'policy',
        depth: 'comprehensive',
        description: 'Analyze renewable energy policy networks in Texas'
      },
      {
        id: 'campaign-finance-patterns',
        topic: 'Large campaign contributions to Texas legislators',
        scope: 'state',
        focus: 'financial',
        depth: 'detailed',
        description: 'Investigate major campaign finance patterns'
      },
      {
        id: 'healthcare-lobbying',
        topic: 'Healthcare industry lobbying activities',
        scope: 'state',
        focus: 'political',
        depth: 'comprehensive',
        description: 'Map healthcare lobbying influence networks'
      },
      {
        id: 'education-funding',
        topic: 'Public education funding and oversight',
        scope: 'local',
        focus: 'policy',
        depth: 'detailed',
        description: 'Analyze education funding transparency'
      }
    ]
  });
});

// Sample Entity Profiles for Testing
router.get('/api/scout-bot/sample-entities', (req, res) => {
  res.json({
    success: true,
    sampleEntities: [
      {
        name: 'Sample Texas Legislator',
        type: 'person',
        primaryRole: 'State Representative',
        district: 'District 45',
        politicalAffiliation: 'Republican',
        financialConnections: [
          {
            entity: 'Energy PAC',
            relationship: 'recipient',
            amount: 25000,
            timeframe: '2023',
            source: 'TEC filings'
          }
        ],
        legislativeActivity: {
          billsSponsored: ['HB 1234 - Energy Reform'],
          committeeMemberships: ['Energy Resources Committee'],
          votingRecord: []
        }
      }
    ]
  });
});

export default router;