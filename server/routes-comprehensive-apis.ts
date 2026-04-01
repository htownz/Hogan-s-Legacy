// @ts-nocheck
/**
 * Comprehensive API Integration Routes
 * 
 * Connects all government data APIs for complete legislative transparency
 */

import express from 'express';
import { fecAPI } from './services/fec-api';
import { openStatesAPI } from './services/openstates-api';
import { legiscanService } from './services/legiscan-service';
import { createLogger } from "./logger";
const log = createLogger("routes-comprehensive-apis");


const router = express.Router();

/**
 * Get comprehensive Texas campaign finance data from FEC
 */
router.get('/api/texas/campaign-finance', async (req, res) => {
  try {
    log.info('💰 Fetching comprehensive Texas campaign finance data...');
    
    if (!fecAPI.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'FEC API key not configured'
      });
    }

    const [candidates, committees] = await Promise.all([
      fecAPI.getTexasCandidateFinances(),
      fecAPI.getTexasCommitteeFinances()
    ]);

    res.json({
      success: true,
      data: {
        candidates,
        committees,
        totalCandidates: candidates.length,
        totalCommittees: committees.length
      },
      source: 'Federal Election Commission - Official Campaign Finance Data',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching campaign finance data');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign finance data',
      details: error.message
    });
  }
});

/**
 * Get candidate contributions by name
 */
router.get('/api/texas/candidate-contributions/:candidateName', async (req, res) => {
  try {
    const { candidateName } = req.params;
    log.info(`💰 Fetching contributions for candidate: ${candidateName}...`);
    
    // First get candidate data to find FEC ID
    const candidates = await fecAPI.getTexasCandidateFinances(candidateName);
    
    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found in FEC database'
      });
    }

    const candidate = candidates[0];
    const contributions = await fecAPI.getCandidateContributions(candidate.fecId);

    res.json({
      success: true,
      data: {
        candidate,
        contributions,
        totalContributions: contributions.length
      },
      source: 'Federal Election Commission - Official Contribution Records',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching candidate contributions');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate contributions',
      details: error.message
    });
  }
});

/**
 * Get comprehensive legislative data from all sources
 */
router.get('/api/texas/comprehensive-data', async (req, res) => {
  try {
    log.info('🏛️ Fetching comprehensive Texas legislative data from all APIs...');
    
    const [
      openStatesData,
      legiscanSessions,
      fecCandidates
    ] = await Promise.all([
      openStatesAPI.getComprehensiveTexasData(),
      legiscanService.getTexasSessions(),
      fecAPI.isConfigured() ? fecAPI.getTexasCandidateFinances() : []
    ]);

    res.json({
      success: true,
      data: {
        legislators: openStatesData.legislators,
        bills: openStatesData.bills,
        sessions: legiscanSessions,
        campaignFinance: fecCandidates,
        statistics: {
          totalLegislators: openStatesData.legislators.length,
          totalBills: openStatesData.bills.length,
          totalSessions: legiscanSessions.length,
          totalCandidatesWithFinanceData: fecCandidates.length
        }
      },
      sources: {
        legislators: 'OpenStates API - Official Texas Legislature Data',
        bills: 'OpenStates API - Official Texas Legislature Data',
        sessions: 'LegiScan API - Comprehensive Legislative Sessions',
        campaignFinance: 'Federal Election Commission - Official Campaign Finance Data'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching comprehensive data');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comprehensive legislative data',
      details: error.message
    });
  }
});

/**
 * Get API connection status for all services
 */
router.get('/api/status/all-apis', async (req, res) => {
  try {
    log.info('🔍 Checking status of all government data APIs...');
    
    const apiStatus = {
      openStates: {
        configured: openStatesAPI.isConfigured(),
        status: 'unknown'
      },
      legiscan: {
        configured: legiscanService.isConfigured(),
        status: 'unknown'
      },
      fec: {
        configured: fecAPI.isConfigured(),
        status: 'unknown'
      }
    };

    // Test OpenStates
    try {
      await openStatesAPI.getTexasLegislators();
      apiStatus.openStates.status = 'operational';
    } catch (error: any) {
      apiStatus.openStates.status = 'error';
    }

    // Test LegiScan
    try {
      await legiscanService.getTexasSessions();
      apiStatus.legiscan.status = 'operational';
    } catch (error: any) {
      apiStatus.legiscan.status = 'error';
    }

    // Test FEC
    if (fecAPI.isConfigured()) {
      try {
        await fecAPI.getTexasCandidateFinances();
        apiStatus.fec.status = 'operational';
      } catch (error: any) {
        apiStatus.fec.status = 'error';
      }
    }

    res.json({
      success: true,
      apis: apiStatus,
      summary: {
        totalAPIs: 3,
        operational: Object.values(apiStatus).filter(api => api.status === 'operational').length,
        configured: Object.values(apiStatus).filter(api => api.configured).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error checking API status');
    res.status(500).json({
      success: false,
      error: 'Failed to check API status',
      details: error.message
    });
  }
});

export default router;