import express from 'express';
import { advancedBillAnalysisEngine } from './services/advanced-bill-analysis-engine';
import { advancedScoutBot } from './services/advanced-scout-bot';
import { enhancedVectorSearch } from './services/enhanced-vector-search';

const router = express.Router();

// Advanced Bill Analysis Engine Routes
router.post('/api/ai-suite/bill-analysis/comprehensive', async (req, res) => {
  try {
    const { billText, billTitle, billNumber } = req.body;
    
    if (!billText || !billTitle) {
      return res.status(400).json({
        success: false,
        error: 'Bill text and title are required'
      });
    }

    const analysis = await advancedBillAnalysisEngine.performComprehensiveAnalysis(
      billText,
      billTitle,
      billNumber
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Comprehensive bill analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform comprehensive analysis'
    });
  }
});

router.post('/api/ai-suite/bill-analysis/entities', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for entity extraction'
      });
    }

    const entities = await advancedBillAnalysisEngine.extractEntitiesAndRelationships(text);

    res.json({
      success: true,
      data: entities
    });
  } catch (error: any) {
    console.error('Entity extraction failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract entities and relationships'
    });
  }
});

// Advanced Scout Bot Routes
router.post('/api/ai-suite/scout-bot/research', async (req, res) => {
  try {
    const { topic, scope, timeframe, focus, depth } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Research topic is required'
      });
    }

    const researchQuery = {
      topic,
      scope: scope || 'state',
      timeframe,
      focus,
      depth: depth || 'detailed'
    };

    const report = await advancedScoutBot.conductDeepResearch(researchQuery);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Deep research failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to conduct research'
    });
  }
});

router.post('/api/ai-suite/scout-bot/profile', async (req, res) => {
  try {
    const { entityName, context } = req.body;
    
    if (!entityName) {
      return res.status(400).json({
        success: false,
        error: 'Entity name is required'
      });
    }

    // const profile = await advancedScoutBot.extractAndProfileEntity(
    //   entityName,
    //   context || 'Texas politics'
    // );
    const profile = { message: "Advanced Scout Bot temporarily disabled" };

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Entity profiling failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to profile entity'
    });
  }
});

router.post('/api/ai-suite/scout-bot/network-map', async (req, res) => {
  try {
    const { entities } = req.body;
    
    if (!entities || !Array.isArray(entities)) {
      return res.status(400).json({
        success: false,
        error: 'Array of entity names is required'
      });
    }

    const networkMap = await advancedScoutBot.generateNetworkMap(entities);

    res.json({
      success: true,
      data: networkMap
    });
  } catch (error: any) {
    console.error('Network map generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate network map'
    });
  }
});

// Enhanced Vector Search Routes
router.post('/api/ai-suite/vector-search/advanced', async (req, res) => {
  try {
    const { query, type, filters, options } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchQuery = {
      query,
      type: type || 'semantic',
      filters: filters || {},
      options: options || {}
    };

    const results = await enhancedVectorSearch.performAdvancedSearch(searchQuery);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Advanced vector search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform advanced search'
    });
  }
});

router.post('/api/ai-suite/vector-search/hybrid', async (req, res) => {
  try {
    const { query, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await enhancedVectorSearch.performHybridSearch(query, filters);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Hybrid search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform hybrid search'
    });
  }
});

router.get('/api/ai-suite/vector-search/clusters', async (req, res) => {
  try {
    const { minSize } = req.query;
    
    const clusters = await enhancedVectorSearch.discoverSemanticClusters(
      undefined,
      minSize ? parseInt(minSize as string) : 3
    );

    res.json({
      success: true,
      data: clusters
    });
  } catch (error: any) {
    console.error('Semantic clustering failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover semantic clusters'
    });
  }
});

router.get('/api/ai-suite/vector-search/analytics', async (req, res) => {
  try {
    const analytics = await enhancedVectorSearch.getSearchAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Search analytics failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search analytics'
    });
  }
});

// Integrated AI Suite Demo Route
router.post('/api/ai-suite/integrated-analysis', async (req, res) => {
  try {
    const { billText, billTitle, researchTopic } = req.body;
    
    if (!billText || !billTitle) {
      return res.status(400).json({
        success: false,
        error: 'Bill text and title are required'
      });
    }

    // Run comprehensive analysis in parallel
    const [billAnalysis, entityProfiles, similarBills] = await Promise.all([
      // Advanced Bill Analysis
      advancedBillAnalysisEngine.performComprehensiveAnalysis(billText, billTitle),
      
      // Scout Bot Research
      researchTopic ? advancedScoutBot.conductDeepResearch({
        topic: researchTopic,
        scope: 'state',
        depth: 'detailed'
      }) : Promise.resolve(null),
      
      // Vector Search for Similar Bills
      enhancedVectorSearch.performAdvancedSearch({
        query: `${billTitle} ${billText.substring(0, 500)}`,
        type: 'semantic',
        options: { topK: 5, rerank: true }
      })
    ]);

    const integratedResults = {
      billAnalysis,
      researchReport: entityProfiles,
      similarBills,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: integratedResults
    });
  } catch (error: any) {
    console.error('Integrated analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform integrated AI analysis'
    });
  }
});

// AI Suite Status and Health Check
router.get('/api/ai-suite/status', async (req, res) => {
  try {
    const status = {
      billAnalysisEngine: 'operational',
      scoutBot: 'operational',
      vectorSearch: 'operational',
      lastUpdated: new Date().toISOString()
    };

    // Check each service
    try {
      await enhancedVectorSearch.getSearchAnalytics();
    } catch (error: any) {
      status.vectorSearch = 'degraded';
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check AI suite status'
    });
  }
});

export default router;