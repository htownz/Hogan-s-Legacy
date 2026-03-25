/**
 * Texas Data Routes
 * 
 * API endpoints for authentic current Texas legislative data
 */

import express from 'express';
import { texasDataActivator } from './services/texas-data-activator';
import { texasLegislatureAPI } from './services/texas-legislature-api';
import { openStatesAPI } from './services/openstates-api';
import { tloCrawler } from './services/tlo-crawler';

const router = express.Router();

// Get current Texas legislative data
router.get('/api/texas/current-data', async (req, res) => {
  try {
    console.log('🏛️ Fetching current Texas legislative data...');
    const data = await texasDataActivator.getCurrentTexasData();
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      source: 'Texas Legislature via LegiScan API'
    });
  } catch (error: any) {
    console.error('❌ Error fetching Texas data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current Texas legislative data',
      details: error.message
    });
  }
});

// Get current Texas bills
router.get('/api/texas/bills', async (req, res) => {
  try {
    console.log('📋 Fetching current Texas bills...');
    const bills = await texasDataActivator.loadCurrentBills();
    
    res.json({
      success: true,
      data: bills,
      count: bills ? Object.keys(bills).length : 0,
      source: 'Texas Legislature via LegiScan API'
    });
  } catch (error: any) {
    console.error('❌ Error fetching Texas bills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas bills',
      details: error.message
    });
  }
});

// Get current Texas legislators
router.get('/api/texas/legislators', async (req, res) => {
  try {
    console.log('👥 Fetching current Texas legislators...');
    const legislators = await texasDataActivator.loadCurrentLegislators();
    
    res.json({
      success: true,
      data: legislators,
      count: legislators ? legislators.length : 0,
      source: 'Texas Legislature via LegiScan API'
    });
  } catch (error: any) {
    console.error('❌ Error fetching Texas legislators:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas legislators',
      details: error.message
    });
  }
});

// Get comprehensive Texas data from official API
router.get('/api/texas/official-data', async (req, res) => {
  try {
    console.log('🏛️ Fetching comprehensive Texas legislative data from official API...');
    const data = await texasLegislatureAPI.getComprehensiveData();
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      source: 'Texas Legislature Official API'
    });
  } catch (error: any) {
    console.error('❌ Error fetching official Texas data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas legislative data',
      details: error.message
    });
  }
});

// Get current Texas legislators from official API
router.get('/api/texas/legislators-official', async (req, res) => {
  try {
    console.log('👥 Fetching current Texas legislators from official API...');
    const legislators = await texasLegislatureAPI.getCurrentLegislators();
    
    res.json({
      success: true,
      data: legislators,
      count: legislators.length,
      source: 'Texas Legislature Official API'
    });
  } catch (error: any) {
    console.error('❌ Error fetching official legislators:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas legislators',
      details: error.message
    });
  }
});

// Get current Texas bills from official API
router.get('/api/texas/bills-official', async (req, res) => {
  try {
    console.log('📋 Fetching current Texas bills from official API...');
    const bills = await texasLegislatureAPI.getCurrentBills();
    
    res.json({
      success: true,
      data: bills,
      count: bills.length,
      source: 'Texas Legislature Official API'
    });
  } catch (error: any) {
    console.error('❌ Error fetching official bills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas bills',
      details: error.message
    });
  }
});

// Get specific bill details
router.get('/api/texas/bill/:billNumber', async (req, res) => {
  try {
    const { billNumber } = req.params;
    console.log(`📄 Fetching details for bill ${billNumber}...`);
    const bill = await texasLegislatureAPI.getBillDetails(billNumber);
    
    if (bill) {
      res.json({
        success: true,
        data: bill,
        source: 'Texas Legislature Official API'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }
  } catch (error: any) {
    console.error(`❌ Error fetching bill ${req.params.billNumber}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bill details',
      details: error.message
    });
  }
});

// Get authentic Texas data from OpenStates API
router.get('/api/texas/openstates-data', async (req, res) => {
  try {
    if (!openStatesAPI.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'OpenStates API key not configured',
        message: 'Please provide OPENSTATES_API_KEY environment variable'
      });
    }

    console.log('🏛️ Fetching comprehensive Texas data from OpenStates...');
    const data = await openStatesAPI.getComprehensiveTexasData();
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      source: 'OpenStates API - Official Texas Legislature'
    });
  } catch (error: any) {
    console.error('❌ Error fetching OpenStates data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas data from OpenStates',
      details: error.message
    });
  }
});

// Get Texas legislators from OpenStates
router.get('/api/texas/legislators-openstates', async (req, res) => {
  try {
    if (!openStatesAPI.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'OpenStates API key not configured',
        message: 'Please provide OPENSTATES_API_KEY environment variable'
      });
    }

    console.log('👥 Fetching Texas legislators from OpenStates...');
    const legislators = await openStatesAPI.getTexasLegislators();
    
    res.json({
      success: true,
      data: legislators,
      count: legislators.length,
      source: 'OpenStates API - Official Texas Legislature'
    });
  } catch (error: any) {
    console.error('❌ Error fetching OpenStates legislators:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas legislators',
      details: error.message
    });
  }
});

// Get Texas bills from OpenStates
router.get('/api/texas/bills-openstates', async (req, res) => {
  try {
    if (!openStatesAPI.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'OpenStates API key not configured',
        message: 'Please provide OPENSTATES_API_KEY environment variable'
      });
    }

    console.log('📋 Fetching Texas bills from OpenStates...');
    const bills = await openStatesAPI.getTexasBills(100);
    
    res.json({
      success: true,
      data: bills,
      count: bills.length,
      source: 'OpenStates API - Official Texas Legislature'
    });
  } catch (error: any) {
    console.error('❌ Error fetching OpenStates bills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas bills',
      details: error.message
    });
  }
});

// Get authentic Texas data from TLO (Texas Legislature Online)
router.get('/api/texas/tlo-data', async (req, res) => {
  try {
    console.log('🏛️ Crawling comprehensive Texas data from TLO...');
    const data = await tloCrawler.getComprehensiveData();
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      source: 'Texas Legislature Online - Official State Government'
    });
  } catch (error: any) {
    console.error('❌ Error crawling TLO data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to crawl Texas data from TLO',
      details: error.message
    });
  }
});

// Get Texas legislators from TLO
router.get('/api/texas/legislators-tlo', async (req, res) => {
  try {
    console.log('👥 Crawling Texas legislators from TLO...');
    const legislators = await tloCrawler.getCurrentLegislators();
    
    res.json({
      success: true,
      data: legislators,
      count: legislators.length,
      source: 'Texas Legislature Online - Official State Government'
    });
  } catch (error: any) {
    console.error('❌ Error crawling TLO legislators:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to crawl Texas legislators from TLO',
      details: error.message
    });
  }
});

// Initialize Texas data on server start
router.post('/api/texas/initialize', async (req, res) => {
  try {
    console.log('🔄 Initializing Texas legislative data...');
    const result = await texasDataActivator.initialize();
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Texas data initialized successfully' : 'Failed to initialize Texas data'
    });
  } catch (error: any) {
    console.error('❌ Error initializing Texas data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Texas data',
      details: error.message
    });
  }
});

export function registerTexasDataRoutes(app: express.Application) {
  app.use(router);
  console.log('🏛️ Texas legislative data routes registered');
}