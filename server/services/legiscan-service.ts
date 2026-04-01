/**
 * LegiScan API Service
 * 
 * This service provides methods to interact with the LegiScan API for legislative data.
 * It includes caching mechanisms to minimize API usage and stay within rate limits.
 * 
 * API Documentation: https://legiscan.com/gaits/documentation/legiscan
 */

import axios from 'axios';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { createLogger } from "../logger";
const log = createLogger("legiscan-service");


// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache directory for storing API responses
const CACHE_DIR = path.join(__dirname, '../../temp/legiscan-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Type definitions for LegiScan API responses
interface LegiScanResponse {
  status: string;
  [key: string]: any;
}

interface LegiScanBill {
  bill_id: number;
  change_hash: string;
  state: string;
  bill_number: string;
  bill_type: string;
  bill_type_id: string;
  body: string;
  body_id: number;
  current_body: string;
  current_body_id: number;
  title: string;
  description: string;
  sponsors: any[];
  progress: any[];
  history: any[];
  texts: any[];
  votes: any[];
  amendments: any[];
  supplements: any[];
  calendar: any[];
  status: number;
  status_date: string;
  status_desc: string;
  // ... and more fields
}

interface LegiScanMasterListItem {
  bill_id: number;
  number: string;
  change_hash: string;
  url: string;
  status_date: string;
  status: number;
  last_action_date: string;
  last_action: string;
  title: string;
  description: string;
}

interface LegiScanPerson {
  person_id: number;
  state_id: number;
  party_id: string;
  party: string;
  role_id: number;
  role: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  nickname: string;
  district: string;
  ftm_eid: number;
  votesmart_id: number;
  opensecrets_id: string;
  ballotpedia: string;
  committee_sponsor: number;
  committee_id: number;
}

class LegiScanService {
  private apiKey: string | undefined;
  private baseUrl: string = 'https://api.legiscan.com/';
  private state: string = 'TX'; // Default to Texas

  constructor() {
    this.apiKey = process.env.LEGISCAN_API_KEY;
    
    if (!this.apiKey) {
      log.warn('LEGISCAN_API_KEY environment variable not set. LegiScan API will not function properly.');
    }
  }

  /**
   * Make an API request to LegiScan with enhanced caching
   */
  private async makeRequest(operation: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('LegiScan API key not set');
    }
    
    try {
      // Import the enhanced cache service
      const { apiCache } = await import('./enhanced-cache');
      
      // Check if we have a cached response
      const cachedData = apiCache.get('legiscan', operation, params);
      if (cachedData) {
        log.info(`Using cached LegiScan data for ${operation}`);
        return cachedData;
      }
    } catch (error: any) {
      log.warn({ detail: error }, 'Enhanced cache not available, falling back to file cache');
      
      // Create a cache key based on the operation and parameters
      const paramString = JSON.stringify(params);
      const cacheKey = createHash('md5').update(`${operation}:${paramString}`).digest('hex');
      const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  
      // Check if we have a cached response in the filesystem
      if (fs.existsSync(cachePath)) {
        try {
          const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
          const cacheTime = new Date(cacheData.timestamp);
          const now = new Date();
          
          // Use cache if it's less than 24 hours old
          if ((now.getTime() - cacheTime.getTime()) < 24 * 60 * 60 * 1000) {
            log.info(`Using file-cached LegiScan data for ${operation}`);
            return cacheData.data;
          }
        } catch (error: any) {
          log.error({ err: error }, 'Error reading file cache');
          // Continue to fetch fresh data if cache reading fails
        }
      }
    }

    // Prepare request parameters
    const requestParams = {
      key: this.apiKey,
      op: operation,
      state: this.state,
      ...params
    };

    try {
      log.info(`Fetching LegiScan data for ${operation}`);
      const response = await axios.get(this.baseUrl, { params: requestParams });
      
      if (response.data.status === 'OK') {
        try {
          // Try to use the enhanced cache
          const { apiCache } = await import('./enhanced-cache');
          apiCache.set('legiscan', operation, params, response.data);
        } catch (cacheError: any) {
          // Fallback to filesystem cache
          log.warn({ detail: cacheError }, 'Error saving to enhanced cache, falling back to file cache');
          
          // Create cache key and path 
          const paramString = JSON.stringify(params);
          const cacheKey = createHash('md5').update(`${operation}:${paramString}`).digest('hex');
          const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
          
          // Save response to file cache
          fs.writeFileSync(cachePath, JSON.stringify({
            timestamp: new Date().toISOString(),
            data: response.data
          }));
        }
        
        return response.data;
      } else {
        throw new Error(`LegiScan API error: ${response.data.alert?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      log.error({ err: error }, 'LegiScan API request failed');
      throw error;
    }
  }

  /**
   * Get the master list of bills for a session
   */
  async getMasterList(sessionId: number | string): Promise<LegiScanMasterListItem[]> {
    const response = await this.makeRequest('getMasterList', { 
      id: sessionId 
    });
    
    return response.masterlist || [];
  }

  /**
   * Get the master list raw (hash values only) for a session
   */
  async getMasterListRaw(sessionId: number | string): Promise<any> {
    const response = await this.makeRequest('getMasterListRaw', { 
      id: sessionId 
    });
    
    return response.masterlist || {};
  }

  /**
   * Get details for a specific bill
   */
  async getBill(billId: number): Promise<LegiScanBill> {
    const response = await this.makeRequest('getBill', { 
      id: billId 
    });
    
    return response.bill || null;
  }

  /**
   * Get details for a specific person (legislator)
   */
  async getPerson(personId: number): Promise<LegiScanPerson> {
    const response = await this.makeRequest('getPerson', { 
      id: personId 
    });
    
    return response.person || null;
  }

  /**
   * Get the list of active sessions
   */
  async getSessionList(): Promise<any> {
    const response = await this.makeRequest('getSessionList');
    return response.sessions || [];
  }

  /**
   * Search for bills by query
   */
  async searchBills(query: string, year?: number): Promise<any> {
    const params: Record<string, any> = { query };
    if (year) {
      params.year = year;
    }
    
    const response = await this.makeRequest('getSearch', params);
    return response.searchresult || [];
  }

  /**
   * Get a roll call vote
   */
  async getRollCall(rollCallId: number): Promise<any> {
    const response = await this.makeRequest('getRollCall', { 
      id: rollCallId 
    });
    
    return response.roll_call || null;
  }

  /**
   * Import legislators from LegiScan to our database
   */
  async importLegislators(): Promise<number> {
    try {
      // First get the session list to find the current session
      const sessions = await this.getSessionList();
      
      if (!sessions || sessions.length === 0) {
        throw new Error('No sessions found');
      }
      
      // Find the most recent regular session
      const currentSession = sessions.find((s: any) => 
        s.state_id === 'TX' && s.special === 0
      ) || sessions[0];
      
      // Get the master list for the current session
      const masterList = await this.getMasterList(currentSession.session_id);
      
      // Collect unique sponsors
      const personIds = new Set<number>();
      const processedLegislators: LegiScanPerson[] = [];
      
      // For each bill, check its sponsors
      for (const bill of Object.values(masterList).slice(0, 20)) { // Limit to 20 bills for initial import
        try {
          const billDetails = await this.getBill(bill.bill_id);
          
          if (billDetails && billDetails.sponsors) {
            for (const sponsor of billDetails.sponsors) {
              if (sponsor.people_id && !personIds.has(sponsor.people_id)) {
                personIds.add(sponsor.people_id);
                
                // Get detailed info for this legislator
                const personDetails = await this.getPerson(sponsor.people_id);
                if (personDetails) {
                  processedLegislators.push(personDetails);
                }
              }
            }
          }
        } catch (err: any) {
          log.error({ err: err }, `Error processing bill ${bill.bill_id}`);
        }
      }
      
      log.info(`Found ${processedLegislators.length} legislators`);
      
      // TODO: Store legislators in database
      // This is where we would update our database with the legislator information
      
      return processedLegislators.length;
    } catch (error: any) {
      log.error({ err: error }, 'Error importing legislators');
      throw error;
    }
  }
}

// Export a singleton instance
export const legiscanService = new LegiScanService();