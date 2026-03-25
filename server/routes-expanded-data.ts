// @ts-nocheck
/**
 * Expanded Data Collection Routes
 * API endpoints for collecting comprehensive Texas government data
 * Committees, hearings, voting records, historical sessions, and ethics data
 */

import { Router } from 'express';
import { expandedDataCollector } from './services/expanded-data-collector';
import { storage } from './storage';

const router = Router();

/**
 * POST /api/expanded-data/collect/committees
 * Collect comprehensive committee data from both chambers
 */
router.post('/collect/committees', async (req, res) => {
  try {
    console.log('🚀 Starting committee data collection...');
    
    const committees = await expandedDataCollector.collectCommitteeData();
    
    res.json({
      success: true,
      data: {
        committees,
        totalCollected: committees.length,
        houseCommittees: committees.filter(c => c.chamber === 'House').length,
        senateCommittees: committees.filter(c => c.chamber === 'Senate').length
      },
      timestamp: new Date().toISOString(),
      message: `Successfully collected ${committees.length} committees with comprehensive data`
    });
  } catch (error: any) {
    console.error('❌ Committee collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to collect committee data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/expanded-data/collect/hearings/:committeeId
 * Collect hearing data for a specific committee
 */
router.post('/collect/hearings/:committeeId', async (req, res) => {
  try {
    const { committeeId } = req.params;
    
    console.log(`🚀 Starting hearing collection for committee: ${committeeId}`);
    
    const hearings = await expandedDataCollector.collectCommitteeHearings(committeeId);
    
    res.json({
      success: true,
      data: {
        committeeId,
        hearings,
        totalCollected: hearings.length,
        hearingsWithTranscripts: hearings.filter(h => h.transcript).length,
        hearingsWithVideo: hearings.filter(h => h.videoUrl).length
      },
      timestamp: new Date().toISOString(),
      message: `Successfully collected ${hearings.length} hearings for committee ${committeeId}`
    });
  } catch (error: any) {
    console.error('❌ Hearing collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to collect hearing data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/expanded-data/collect/voting-records
 * Collect comprehensive voting records
 */
router.post('/collect/voting-records', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    console.log('🚀 Starting voting records collection...');
    
    const votingRecords = await expandedDataCollector.collectVotingRecords(sessionId);
    
    res.json({
      success: true,
      data: {
        votingRecords: votingRecords.slice(0, 100), // Limit response size
        totalCollected: votingRecords.length,
        houseVotes: votingRecords.filter(v => v.chamber === 'House').length,
        senateVotes: votingRecords.filter(v => v.chamber === 'Senate').length,
        sessionId: sessionId || 'current'
      },
      timestamp: new Date().toISOString(),
      message: `Successfully collected ${votingRecords.length} voting records`
    });
  } catch (error: any) {
    console.error('❌ Voting records collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to collect voting records',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/expanded-data/collect/historical-sessions
 * Collect historical legislative session data
 */
router.post('/collect/historical-sessions', async (req, res) => {
  try {
    console.log('🚀 Starting historical session collection...');
    
    const sessions = await expandedDataCollector.collectHistoricalSessions();
    
    res.json({
      success: true,
      data: {
        sessions,
        totalCollected: sessions.length,
        regularSessions: sessions.filter(s => s.type === 'Regular').length,
        specialSessions: sessions.filter(s => s.type === 'Special').length,
        yearRange: sessions.length > 0 ? {
          earliest: Math.min(...sessions.map(s => s.year)),
          latest: Math.max(...sessions.map(s => s.year))
        } : null
      },
      timestamp: new Date().toISOString(),
      message: `Successfully collected ${sessions.length} historical sessions`
    });
  } catch (error: any) {
    console.error('❌ Historical sessions collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to collect historical session data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/expanded-data/collect/ethics-data
 * Collect Texas Ethics Commission data
 */
router.post('/collect/ethics-data', async (req, res) => {
  try {
    console.log('🚀 Starting ethics data collection...');
    
    await expandedDataCollector.collectEthicsData();
    
    res.json({
      success: true,
      data: {
        message: 'Ethics data collection completed',
        dataTypes: [
          'Personal Financial Statements',
          'Lobby Registrations',
          'Campaign Finance Reports'
        ]
      },
      timestamp: new Date().toISOString(),
      message: 'Successfully collected Texas Ethics Commission data'
    });
  } catch (error: any) {
    console.error('❌ Ethics data collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to collect ethics data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/expanded-data/collect/comprehensive
 * Run complete data expansion across all sources
 */
router.post('/collect/comprehensive', async (req, res) => {
  try {
    console.log('🚀 Starting comprehensive data expansion...');
    
    // Start the collection process
    expandedDataCollector.runComprehensiveDataExpansion()
      .then(() => {
        console.log('✅ Comprehensive data expansion completed successfully');
      })
      .catch((error) => {
        console.error('❌ Comprehensive data expansion failed:', error);
      });
    
    // Return immediate response since this is a long-running process
    res.json({
      success: true,
      data: {
        status: 'Collection started',
        estimatedDuration: '15-30 minutes',
        dataTypes: [
          'Committee Data',
          'Hearing Records',
          'Voting Records',
          'Historical Sessions',
          'Ethics Commission Data'
        ]
      },
      timestamp: new Date().toISOString(),
      message: 'Comprehensive data expansion started successfully'
    });
  } catch (error: any) {
    console.error('❌ Comprehensive collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start comprehensive data collection',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/expanded-data/status
 * Get current status of expanded data collection
 */
router.get('/status', async (req, res) => {
  try {
    // Get collection statistics from storage
    const stats = {
      committees: 0,
      hearings: 0,
      votingRecords: 0,
      historicalSessions: 0,
      ethicsRecords: 0
    };
    
    // Try to get actual counts (would implement with proper storage methods)
    try {
      stats.committees = await storage.getCommitteeCount?.() || 0;
      stats.hearings = await storage.getHearingCount?.() || 0;
      stats.votingRecords = await storage.getVotingRecordCount?.() || 0;
      stats.historicalSessions = await storage.getHistoricalSessionCount?.() || 0;
      stats.ethicsRecords = await storage.getEthicsRecordCount?.() || 0;
    } catch (error: any) {
      console.log('ℹ️ Storage methods not yet implemented, using placeholder counts');
    }
    
    res.json({
      success: true,
      data: {
        collectionStatus: 'Active',
        dataCollected: stats,
        totalRecords: Object.values(stats).reduce((sum, count) => sum + count, 0),
        dataSources: [
          'Texas House of Representatives',
          'Texas Senate',
          'Texas Legislature Online',
          'Texas Ethics Commission',
          'Texas Secretary of State'
        ],
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      message: 'Data collection status retrieved successfully'
    });
  } catch (error: any) {
    console.error('❌ Status retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve collection status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/expanded-data/committees
 * Get collected committee data
 */
router.get('/committees', async (req, res) => {
  try {
    const { chamber, limit = 50 } = req.query;
    
    // Get committees from storage
    let committees = await storage.getAllCommittees?.() || [];
    
    if (chamber) {
      committees = committees.filter((c: any) => 
        c.chamber.toLowerCase() === chamber.toString().toLowerCase()
      );
    }
    
    // Limit results
    committees = committees.slice(0, parseInt(limit.toString()));
    
    res.json({
      success: true,
      data: {
        committees,
        totalFound: committees.length,
        filters: { chamber, limit }
      },
      timestamp: new Date().toISOString(),
      message: 'Committee data retrieved successfully'
    });
  } catch (error: any) {
    console.error('❌ Committee retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve committee data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/expanded-data/hearings/:committeeId
 * Get hearings for a specific committee
 */
router.get('/hearings/:committeeId', async (req, res) => {
  try {
    const { committeeId } = req.params;
    const { limit = 20 } = req.query;
    
    // Get hearings from storage
    let hearings = await storage.getCommitteeHearings?.(committeeId) || [];
    
    // Limit results
    hearings = hearings.slice(0, parseInt(limit.toString()));
    
    res.json({
      success: true,
      data: {
        committeeId,
        hearings,
        totalFound: hearings.length,
        upcomingHearings: hearings.filter((h: any) => 
          new Date(h.date) > new Date()
        ).length
      },
      timestamp: new Date().toISOString(),
      message: 'Hearing data retrieved successfully'
    });
  } catch (error: any) {
    console.error('❌ Hearing retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve hearing data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/expanded-data/voting-records/:billId
 * Get voting records for a specific bill
 */
router.get('/voting-records/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    // Get voting records from storage
    const votingRecords = await storage.getBillVotingRecords?.(billId) || [];
    
    // Analyze voting patterns
    const analysis = {
      totalVotes: votingRecords.length,
      yesVotes: votingRecords.filter((v: any) => v.vote === 'Yes').length,
      noVotes: votingRecords.filter((v: any) => v.vote === 'No').length,
      presentVotes: votingRecords.filter((v: any) => v.vote === 'Present').length,
      absentVotes: votingRecords.filter((v: any) => v.vote === 'Absent').length,
      chambers: {
        house: votingRecords.filter((v: any) => v.chamber === 'House').length,
        senate: votingRecords.filter((v: any) => v.chamber === 'Senate').length
      }
    };
    
    res.json({
      success: true,
      data: {
        billId,
        votingRecords,
        analysis
      },
      timestamp: new Date().toISOString(),
      message: 'Voting records retrieved successfully'
    });
  } catch (error: any) {
    console.error('❌ Voting records retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve voting records',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/expanded-data/historical-sessions
 * Get historical legislative sessions
 */
router.get('/historical-sessions', async (req, res) => {
  try {
    const { type, startYear, endYear } = req.query;
    
    // Get historical sessions from storage
    let sessions = await storage.getAllHistoricalSessions?.() || [];
    
    // Apply filters
    if (type) {
      sessions = sessions.filter((s: any) => 
        s.type.toLowerCase() === type.toString().toLowerCase()
      );
    }
    
    if (startYear) {
      sessions = sessions.filter((s: any) => s.year >= parseInt(startYear.toString()));
    }
    
    if (endYear) {
      sessions = sessions.filter((s: any) => s.year <= parseInt(endYear.toString()));
    }
    
    // Sort by year descending
    sessions.sort((a: any, b: any) => b.year - a.year);
    
    res.json({
      success: true,
      data: {
        sessions,
        totalFound: sessions.length,
        filters: { type, startYear, endYear }
      },
      timestamp: new Date().toISOString(),
      message: 'Historical sessions retrieved successfully'
    });
  } catch (error: any) {
    console.error('❌ Historical sessions retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve historical sessions',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;