// @ts-nocheck
import axios from 'axios';
import { storage } from '../storage';
import { createLogger } from "../logger";
const log = createLogger("openstates-legislators-api");


interface OpenStatesLegislator {
  id: string;
  name: string;
  given_name: string;
  family_name: string;
  party: string;
  chamber: 'upper' | 'lower';
  district: string;
  email?: string;
  offices?: Array<{
    name: string;
    fax?: string;
    voice?: string;
    email?: string;
    address?: string;
  }>;
  links?: Array<{
    url: string;
    note?: string;
  }>;
  sources?: Array<{
    url: string;
    note?: string;
  }>;
  image?: string;
  biography?: string;
  current_role?: {
    title?: string;
    org_classification?: string;
    district?: string;
    start_date?: string;
    end_date?: string;
  };
  other_identifiers?: Array<{
    identifier: string;
    scheme: string;
  }>;
  extras?: Record<string, any>;
}

interface OpenStatesLegislatorResponse {
  results: OpenStatesLegislator[];
  pagination: {
    page: number;
    max_page: number;
    per_page: number;
    total_items: number;
  };
}

export class OpenStatesLegislatorsAPI {
  private apiKey: string;
  private baseUrl = 'https://v3.openstates.org';
  
  constructor() {
    this.apiKey = process.env.OPENSTATES_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENSTATES_API_KEY environment variable is required');
    }
    log.info('🏛️ OpenStates Legislators API initialized');
  }

  /**
   * Fetch all current Texas legislators from OpenStates API
   */
  async fetchAllTexasLegislators(): Promise<OpenStatesLegislator[]> {
    try {
      log.info('🚀 Fetching all Texas legislators from OpenStates API...');
      
      const allLegislators: OpenStatesLegislator[] = [];
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        log.info(`📖 Fetching page ${page} of Texas legislators...`);
        
        const response = await axios.get<OpenStatesLegislatorResponse>(
          `${this.baseUrl}/people`, 
          {
            headers: {
              'X-API-KEY': this.apiKey,
              'Accept': 'application/json'
            },
            params: {
              jurisdiction: 'tx', // Texas
              page: page,
              per_page: 100, // Maximum per page
              current_role: true // Only current legislators
            },
            timeout: 30000
          }
        );
        
        const legislators = response.data.results;
        allLegislators.push(...legislators);
        
        log.info(`✅ Fetched ${legislators.length} legislators from page ${page}`);
        
        // Check if there are more pages
        hasMorePages = page < response.data.pagination.max_page;
        page++;
        
        // Add delay between API calls to be respectful
        if (hasMorePages) {
          await this.delay(500);
        }
      }
      
      log.info(`🎉 Successfully fetched ${allLegislators.length} total Texas legislators`);
      return allLegislators;
      
    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching Texas legislators from OpenStates');
      throw new Error(`Failed to fetch Texas legislators: ${error.message}`);
    }
  }

  /**
   * Fetch detailed information for a specific legislator
   */
  async fetchLegislatorDetails(legislatorId: string): Promise<OpenStatesLegislator | null> {
    try {
      log.info(`👤 Fetching detailed info for legislator ${legislatorId}...`);
      
      const response = await axios.get<OpenStatesLegislator>(
        `${this.baseUrl}/people/${legislatorId}`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );
      
      return response.data;
      
    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching legislator ${legislatorId}`);
      return null;
    }
  }

  /**
   * Convert OpenStates chamber to readable format
   */
  private convertChamber(chamber: 'upper' | 'lower'): 'House' | 'Senate' {
    return chamber === 'upper' ? 'Senate' : 'House';
  }

  /**
   * Extract primary email from offices array
   */
  private extractPrimaryEmail(legislator: OpenStatesLegislator): string | null {
    // Check main email field first
    if (legislator.email) {
      return legislator.email;
    }
    
    // Check offices for email
    if (legislator.offices && legislator.offices.length > 0) {
      for (const office of legislator.offices) {
        if (office.email) {
          return office.email;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract primary phone from offices array
   */
  private extractPrimaryPhone(legislator: OpenStatesLegislator): string | null {
    if (legislator.offices && legislator.offices.length > 0) {
      for (const office of legislator.offices) {
        if (office.voice) {
          return office.voice;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract office address
   */
  private extractOfficeAddress(legislator: OpenStatesLegislator): string | null {
    if (legislator.offices && legislator.offices.length > 0) {
      const capitolOffice = legislator.offices.find(office => 
        office.name?.toLowerCase().includes('capitol') || 
        office.name?.toLowerCase().includes('district')
      );
      
      if (capitolOffice?.address) {
        return capitolOffice.address;
      }
      
      // Return first office with address
      for (const office of legislator.offices) {
        if (office.address) {
          return office.address;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract website URL
   */
  private extractWebsiteUrl(legislator: OpenStatesLegislator): string | null {
    if (legislator.links && legislator.links.length > 0) {
      const websiteLink = legislator.links.find(link => 
        link.note?.toLowerCase().includes('website') ||
        link.note?.toLowerCase().includes('official') ||
        !link.note
      );
      
      return websiteLink?.url || legislator.links[0].url;
    }
    
    return null;
  }

  /**
   * Store legislators in the database
   */
  async storeLegislatorsInDatabase(legislators: OpenStatesLegislator[]): Promise<void> {
    try {
      log.info(`💾 Storing ${legislators.length} Texas legislators in database...`);
      
      let storedCount = 0;
      let errorCount = 0;
      
      for (const legislator of legislators) {
        try {
          const chamber = this.convertChamber(legislator.chamber);
          const email = this.extractPrimaryEmail(legislator);
          const phone = this.extractPrimaryPhone(legislator);
          const office = this.extractOfficeAddress(legislator);
          const website = this.extractWebsiteUrl(legislator);
          
          // Create legislator record
          await storage.createLegislator({
            id: parseInt(legislator.id) || 0,
            name: legislator.name,
            fullName: legislator.name,
            firstName: legislator.given_name || '',
            lastName: legislator.family_name || '',
            party: legislator.party || 'Unknown',
            chamber,
            district: legislator.district || '0',
            email: email || null,
            phone: phone || null,
            office: office || null,
            website: website || null,
            imageUrl: legislator.image || null,
            bio: legislator.biography || null,
            title: legislator.current_role?.title || null,
            firstElected: null,
            lastUpdated: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          storedCount++;
          
          if (storedCount % 10 === 0) {
            log.info(`📋 Stored ${storedCount}/${legislators.length} legislators...`);
          }
          
        } catch (error: any) {
          log.error({ err: error.message }, `❌ Error storing legislator ${legislator.name}`);
          errorCount++;
        }
      }
      
      log.info(`✅ Successfully stored ${storedCount} legislators (${errorCount} errors)`);
      
    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error storing legislators in database');
      throw error;
    }
  }

  /**
   * Perform comprehensive Texas legislators data collection
   */
  async performLegislatorsDataCollection(): Promise<{
    success: boolean;
    legislatorsCollected: number;
    houseMembers: number;
    senateMembers: number;
    legislators: any[];
    errors?: string[];
  }> {
    try {
      log.info('🚀 Starting comprehensive Texas legislators data collection via OpenStates API...');
      
      // Fetch all legislators
      const legislators = await this.fetchAllTexasLegislators();
      
      if (legislators.length === 0) {
        throw new Error('No legislators found from OpenStates API');
      }
      
      // Store in database
      await this.storeLegislatorsInDatabase(legislators);
      
      // Count by chamber
      const houseMembers = legislators.filter(l => l.chamber === 'lower').length;
      const senateMembers = legislators.filter(l => l.chamber === 'upper').length;
      
      const result = {
        success: true,
        legislatorsCollected: legislators.length,
        houseMembers,
        senateMembers,
        legislators: legislators.map(l => ({
          id: l.id,
          name: l.name,
          party: l.party,
          chamber: this.convertChamber(l.chamber),
          district: l.district,
          email: this.extractPrimaryEmail(l),
          phone: this.extractPrimaryPhone(l),
          website: this.extractWebsiteUrl(l)
        }))
      };
      
      log.info(`🎉 Texas legislators data collection completed!`);
      log.info(`📊 Collected: ${result.legislatorsCollected} total (${result.houseMembers} House, ${result.senateMembers} Senate)`);
      
      return result;
      
    } catch (error: any) {
      log.error({ err: error.message }, '❌ Texas legislators data collection failed');
      return {
        success: false,
        legislatorsCollected: 0,
        houseMembers: 0,
        senateMembers: 0,
        legislators: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Add delay between API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const openStatesLegislatorsAPI = new OpenStatesLegislatorsAPI();