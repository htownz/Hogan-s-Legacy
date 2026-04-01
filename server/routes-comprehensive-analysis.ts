// @ts-nocheck
/**
 * Comprehensive Analysis Routes
 * API endpoints for analyzing and citing all legislative data
 * Bill language, amendments, campaign donations, with full citations
 */

import { Router } from 'express';
import { comprehensiveAnalyzer } from './services/comprehensive-data-analyzer';
import { storage } from './storage';
import { createLogger } from "./logger";
const log = createLogger("routes-comprehensive-analysis");


const router = Router();

/**
 * GET /api/analysis/bill/:id
 * Comprehensive bill analysis with full citations
 */
router.get('/bill/:id', async (req, res) => {
  try {
    const { id } = req.params;
    log.info(`🔍 Starting comprehensive bill analysis for ID: ${id}`);
    
    const analysis = await comprehensiveAnalyzer.analyzeBillComprehensively(id);
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
      message: 'Comprehensive bill analysis completed with full citations'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Bill analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze bill',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/legislator/:id
 * Comprehensive legislator analysis with campaign finance and citations
 */
router.get('/legislator/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid legislator ID',
        timestamp: new Date().toISOString()
      });
    }
    
    log.info(`🔍 Starting comprehensive legislator analysis for ID: ${legislatorId}`);
    
    const analysis = await comprehensiveAnalyzer.analyzeLegislatorComprehensively(legislatorId);
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
      message: 'Comprehensive legislator analysis completed with full citations'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Legislator analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze legislator',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/bill/:id/language
 * Deep dive into bill language analysis
 */
router.get('/bill/:id/language', async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await storage.getBill(id);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get detailed language analysis
    const analysis = await comprehensiveAnalyzer.analyzeBillComprehensively(id);
    
    res.json({
      success: true,
      data: {
        billId: id,
        title: bill.title,
        languageAnalysis: analysis.languageAnalysis,
        citations: analysis.citations.filter(c => 
          c.relevantSections.includes('Bill Text') || 
          c.relevantSections.includes('Legislative History')
        )
      },
      timestamp: new Date().toISOString(),
      message: 'Bill language analysis completed with source citations'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Bill language analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze bill language',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/bill/:id/amendments
 * Analyze bill amendments with tracking and citations
 */
router.get('/bill/:id/amendments', async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await storage.getBill(id);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = await comprehensiveAnalyzer.analyzeBillComprehensively(id);
    
    res.json({
      success: true,
      data: {
        billId: id,
        title: bill.title,
        amendments: analysis.amendments,
        amendmentCount: analysis.amendments.length,
        citations: analysis.citations.filter(c => 
          c.relevantSections.includes('Amendments')
        )
      },
      timestamp: new Date().toISOString(),
      message: 'Bill amendments analysis completed with full tracking'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Bill amendments analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze bill amendments',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/bill/:id/campaign-connections
 * Analyze campaign finance connections to bill sponsors
 */
router.get('/bill/:id/campaign-connections', async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await storage.getBill(id);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = await comprehensiveAnalyzer.analyzeBillComprehensively(id);
    
    res.json({
      success: true,
      data: {
        billId: id,
        title: bill.title,
        sponsors: bill.sponsors,
        campaignConnections: analysis.campaignConnections,
        citations: analysis.citations.filter(c => 
          c.relevantSections.includes('Campaign Contributions') ||
          c.relevantSections.includes('Financial Disclosures')
        )
      },
      timestamp: new Date().toISOString(),
      message: 'Campaign finance connections analysis completed with citations'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Campaign connections analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze campaign connections',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/legislator/:id/campaign-finance
 * Deep dive into legislator campaign finance with citations
 */
router.get('/legislator/:id/campaign-finance', async (req, res) => {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid legislator ID',
        timestamp: new Date().toISOString()
      });
    }

    const legislator = await storage.getLegislator(legislatorId);
    if (!legislator) {
      return res.status(404).json({
        success: false,
        error: 'Legislator not found',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = await comprehensiveAnalyzer.analyzeLegislatorComprehensively(legislatorId);
    
    res.json({
      success: true,
      data: {
        legislatorId,
        name: legislator.name,
        district: legislator.district,
        party: legislator.party,
        campaignFinance: analysis.campaignFinance,
        citations: analysis.citations.filter(c => 
          c.dataPoints.includes('Campaign Contributions') ||
          c.dataPoints.includes('Financial Disclosures')
        )
      },
      timestamp: new Date().toISOString(),
      message: 'Campaign finance analysis completed with full citations'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Legislator campaign finance analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze legislator campaign finance',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/legislator/:id/voting-patterns
 * Analyze legislator voting patterns with citations
 */
router.get('/legislator/:id/voting-patterns', async (req, res) => {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid legislator ID',
        timestamp: new Date().toISOString()
      });
    }

    const legislator = await storage.getLegislator(legislatorId);
    if (!legislator) {
      return res.status(404).json({
        success: false,
        error: 'Legislator not found',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = await comprehensiveAnalyzer.analyzeLegislatorComprehensively(legislatorId);
    
    res.json({
      success: true,
      data: {
        legislatorId,
        name: legislator.name,
        district: legislator.district,
        party: legislator.party,
        votingPatterns: analysis.votingPatterns,
        billSponsorship: analysis.billSponsorship,
        citations: analysis.citations.filter(c => 
          c.dataPoints.includes('Voting Records') ||
          c.dataPoints.includes('Sponsored Bills')
        )
      },
      timestamp: new Date().toISOString(),
      message: 'Voting patterns analysis completed with citations'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Voting patterns analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze voting patterns',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/citations/:type/:id
 * Get all citations for a specific bill or legislator
 */
router.get('/citations/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (!['bill', 'legislator'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis type. Must be "bill" or "legislator"',
        timestamp: new Date().toISOString()
      });
    }

    let citations = [];
    
    if (type === 'bill') {
      const analysis = await comprehensiveAnalyzer.analyzeBillComprehensively(id);
      citations = analysis.citations;
    } else {
      const legislatorId = parseInt(id);
      if (isNaN(legislatorId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid legislator ID',
          timestamp: new Date().toISOString()
        });
      }
      const analysis = await comprehensiveAnalyzer.analyzeLegislatorComprehensively(legislatorId);
      citations = analysis.citations;
    }
    
    res.json({
      success: true,
      data: {
        type,
        id,
        citations,
        citationCount: citations.length
      },
      timestamp: new Date().toISOString(),
      message: 'Citations retrieved successfully'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Citations retrieval error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve citations',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/analysis/batch
 * Batch analysis for multiple bills or legislators
 */
router.post('/batch', async (req, res) => {
  try {
    const { items, analysisType } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!['bill', 'legislator'].includes(analysisType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis type. Must be "bill" or "legislator"',
        timestamp: new Date().toISOString()
      });
    }

    log.info(`🔍 Starting batch analysis for ${items.length} ${analysisType}s`);
    
    const results = [];
    const errors = [];

    for (const item of items.slice(0, 10)) { // Limit to 10 items for performance
      try {
        let analysis;
        if (analysisType === 'bill') {
          analysis = await comprehensiveAnalyzer.analyzeBillComprehensively(item.id);
        } else {
          analysis = await comprehensiveAnalyzer.analyzeLegislatorComprehensively(parseInt(item.id));
        }
        results.push({
          id: item.id,
          analysis,
          success: true
        });
      } catch (error: any) {
        errors.push({
          id: item.id,
          error: error.message,
          success: false
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        results,
        errors,
        totalProcessed: results.length + errors.length,
        successCount: results.length,
        errorCount: errors.length
      },
      timestamp: new Date().toISOString(),
      message: `Batch analysis completed: ${results.length} successful, ${errors.length} errors`
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Batch analysis error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete batch analysis',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/summary
 * Get analysis summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    // Get counts from storage
    const billCount = await storage.getBillCount?.() || 0;
    const legislatorCount = await storage.getLegislatorCount?.() || 0;
    const donationCount = await storage.getCampaignDonationCount?.() || 0;
    
    res.json({
      success: true,
      data: {
        availableData: {
          bills: billCount,
          legislators: legislatorCount,
          campaignDonations: donationCount
        },
        analysisCapabilities: {
          billLanguageAnalysis: true,
          amendmentTracking: true,
          campaignFinanceAnalysis: true,
          votingPatternAnalysis: true,
          citationGeneration: true,
          batchProcessing: true
        },
        dataSources: [
          'Texas Legislature Online',
          'OpenStates API',
          'LegiScan Database',
          'Federal Election Commission (FEC)'
        ]
      },
      timestamp: new Date().toISOString(),
      message: 'Analysis capabilities summary retrieved'
    });
  } catch (error: any) {
    log.error({ err: error }, '❌ Analysis summary error');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve analysis summary',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;