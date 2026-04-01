import axios from 'axios';
import { storage } from '../storage';
import { createLogger } from "../logger";
const log = createLogger("openstates-bills-api");


/**
 * OpenStates Bills API Service
 * Comprehensive bill tracking, voting records, and legislative actions
 * Using OpenStates v3 API for authentic Texas legislative data
 */

interface OpenStatesBill {
  id: string;
  title: string;
  identifier: string;
  subject: string[];
  classification: string[];
  from_organization: {
    name: string;
    classification: string;
  };
  abstracts: Array<{
    abstract: string;
    note?: string;
  }>;
  other_titles: Array<{
    title: string;
    note?: string;
  }>;
  other_identifiers: Array<{
    identifier: string;
    scheme: string;
    note?: string;
  }>;
  actions: Array<{
    description: string;
    date: string;
    organization: {
      name: string;
      classification: string;
    };
    classification: string[];
    order: number;
  }>;
  sponsorships: Array<{
    name: string;
    entity_type: string;
    person?: {
      name: string;
      id: string;
    };
    organization?: {
      name: string;
      classification: string;
    };
    classification: string;
    primary: boolean;
  }>;
  documents: Array<{
    note: string;
    url: string;
    media_type: string;
  }>;
  versions: Array<{
    note: string;
    url: string;
    media_type: string;
    date: string;
  }>;
  sources: Array<{
    url: string;
    note?: string;
  }>;
  created_at: string;
  updated_at: string;
  first_action_date: string;
  latest_action_date: string;
  latest_action_description: string;
}

interface OpenStatesVote {
  id: string;
  identifier: string;
  motion_text: string;
  motion_classification: string[];
  start_date: string;
  result: string;
  organization: {
    name: string;
    classification: string;
  };
  bill: {
    id: string;
    identifier: string;
    title: string;
  };
  votes: Array<{
    option: string;
    voter_name: string;
    voter: {
      id: string;
      name: string;
    };
  }>;
  counts: Array<{
    option: string;
    value: number;
  }>;
  sources: Array<{
    url: string;
    note?: string;
  }>;
  created_at: string;
  updated_at: string;
}

class OpenStatesBillsAPI {
  private apiKey: string;
  private baseUrl = 'https://v3.openstates.org';

  constructor() {
    this.apiKey = process.env.OPENSTATES_API_KEY || '';
    if (!this.apiKey) {
      log.warn('⚠️ OPENSTATES_API_KEY not found - bill tracking will be limited');
    }
  }

  /**
   * Fetch all Texas bills for current session
   */
  async fetchTexasBills(page = 1, perPage = 50): Promise<{
    bills: OpenStatesBill[];
    pagination: any;
  }> {
    try {
      log.info(`📋 Fetching Texas bills page ${page}...`);

      const response = await axios.get(`${this.baseUrl}/bills`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          jurisdiction: 'Texas',
          session: '2023', // Current session
          page: page,
          per_page: perPage,
          include: 'abstracts,other_titles,other_identifiers,actions,sponsorships,documents,versions,sources'
        }
      });

      return {
        bills: response.data.results || [],
        pagination: response.data.pagination || {}
      };

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching Texas bills');
      throw new Error(`Failed to fetch Texas bills: ${error.message}`);
    }
  }

  /**
   * Fetch specific bill details by ID
   */
  async fetchBillDetails(billId: string): Promise<OpenStatesBill | null> {
    try {
      log.info(`📋 Fetching bill details for ID: ${billId}`);

      const response = await axios.get(`${this.baseUrl}/bills/${billId}`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          include: 'abstracts,other_titles,other_identifiers,actions,sponsorships,documents,versions,sources'
        }
      });

      return response.data;

    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching bill ${billId}`);
      return null;
    }
  }

  /**
   * Search bills by keyword or subject
   */
  async searchBills(query: string, page = 1): Promise<{
    bills: OpenStatesBill[];
    pagination: any;
  }> {
    try {
      log.info(`🔍 Searching Texas bills for: "${query}"`);

      const response = await axios.get(`${this.baseUrl}/bills`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          jurisdiction: 'Texas',
          session: '2023',
          q: query,
          page: page,
          per_page: 20,
          include: 'abstracts,actions,sponsorships'
        }
      });

      return {
        bills: response.data.results || [],
        pagination: response.data.pagination || {}
      };

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error searching bills');
      throw new Error(`Failed to search bills: ${error.message}`);
    }
  }

  /**
   * Fetch voting records for a specific bill
   */
  async fetchBillVotes(billId: string): Promise<OpenStatesVote[]> {
    try {
      log.info(`🗳️ Fetching votes for bill: ${billId}`);

      const response = await axios.get(`${this.baseUrl}/votes`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          bill: billId,
          include: 'votes,counts,sources'
        }
      });

      return response.data.results || [];

    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching votes for bill ${billId}`);
      throw new Error(`Failed to fetch bill votes: ${error.message}`);
    }
  }

  /**
   * Fetch voting records for a specific legislator
   */
  async fetchLegislatorVotes(legislatorId: string, page = 1): Promise<{
    votes: OpenStatesVote[];
    pagination: any;
  }> {
    try {
      log.info(`🗳️ Fetching votes for legislator: ${legislatorId}`);

      const response = await axios.get(`${this.baseUrl}/votes`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          voter: legislatorId,
          page: page,
          per_page: 50,
          include: 'votes,counts,sources'
        }
      });

      return {
        votes: response.data.results || [],
        pagination: response.data.pagination || {}
      };

    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching legislator votes`);
      throw new Error(`Failed to fetch legislator votes: ${error.message}`);
    }
  }

  /**
   * Get bills by status (introduced, passed, failed, etc.)
   */
  async getBillsByStatus(status: string[], page = 1): Promise<{
    bills: OpenStatesBill[];
    pagination: any;
  }> {
    try {
      log.info(`📊 Fetching Texas bills by status: ${status.join(', ')}`);

      const response = await axios.get(`${this.baseUrl}/bills`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          jurisdiction: 'Texas',
          session: '2023',
          classification: status,
          page: page,
          per_page: 25,
          include: 'abstracts,actions,sponsorships'
        }
      });

      return {
        bills: response.data.results || [],
        pagination: response.data.pagination || {}
      };

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching bills by status');
      throw new Error(`Failed to fetch bills by status: ${error.message}`);
    }
  }

  /**
   * Comprehensive bill data collection for the platform
   */
  async performBillDataCollection(): Promise<{
    success: boolean;
    billsCollected: number;
    votesCollected: number;
    errors: string[];
    bills: any[];
  }> {
    const results = {
      success: true,
      billsCollected: 0,
      votesCollected: 0,
      errors: [] as string[],
      bills: [] as any[]
    };

    try {
      log.info('🚀 Starting comprehensive Texas bills data collection via OpenStates API...');

      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) { // Limit to first 10 pages for initial collection
        try {
          const billsData = await this.fetchTexasBills(page, 50);
          
          if (billsData.bills.length === 0) {
            hasMore = false;
            break;
          }

          log.info(`📋 Processing ${billsData.bills.length} bills from page ${page}...`);

          for (const bill of billsData.bills) {
            try {
              // Normalize bill data for storage
              const normalizedBill = this.normalizeBillData(bill);
              results.bills.push(normalizedBill);
              results.billsCollected++;

              // Fetch votes for this bill
              try {
                const votes = await this.fetchBillVotes(bill.id);
                results.votesCollected += votes.length;
                
                // Add votes to normalized bill data
                normalizedBill.votes = votes.map(vote => this.normalizeVoteData(vote));

              } catch (voteError: any) {
                log.warn(`⚠️ Could not fetch votes for bill ${bill.identifier}: ${voteError.message}`);
              }

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (billError: any) {
              log.error({ err: billError.message }, `❌ Error processing bill ${bill.identifier}`);
              results.errors.push(`Bill ${bill.identifier}: ${billError.message}`);
            }
          }

          page++;
          
          // Check if there are more pages
          if (!billsData.pagination?.next) {
            hasMore = false;
          }

        } catch (pageError: any) {
          log.error({ err: pageError.message }, `❌ Error fetching page ${page}`);
          results.errors.push(`Page ${page}: ${pageError.message}`);
          hasMore = false;
        }
      }

      log.info(`✅ Bill collection completed: ${results.billsCollected} bills, ${results.votesCollected} votes`);

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Texas bills data collection failed');
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Normalize bill data for Act Up platform
   */
  private normalizeBillData(bill: OpenStatesBill): any {
    return {
      id: bill.id,
      identifier: bill.identifier,
      title: bill.title,
      subject: bill.subject,
      classification: bill.classification,
      chamber: bill.from_organization?.name || 'Unknown',
      abstract: bill.abstracts?.[0]?.abstract || '',
      status: bill.latest_action_description || 'Unknown',
      statusDate: bill.latest_action_date || bill.updated_at,
      firstActionDate: bill.first_action_date,
      sponsors: bill.sponsorships?.map(sponsor => ({
        name: sponsor.name,
        type: sponsor.classification,
        primary: sponsor.primary,
        legislatorId: sponsor.person?.id || null
      })) || [],
      actions: bill.actions?.map(action => ({
        description: action.description,
        date: action.date,
        organization: action.organization?.name,
        classification: action.classification,
        order: action.order
      })) || [],
      documents: bill.documents?.map(doc => ({
        title: doc.note,
        url: doc.url,
        type: doc.media_type
      })) || [],
      versions: bill.versions?.map(version => ({
        title: version.note,
        url: version.url,
        date: version.date,
        type: version.media_type
      })) || [],
      sources: bill.sources || [],
      createdAt: bill.created_at,
      updatedAt: bill.updated_at,
      source: 'OpenStates API'
    };
  }

  /**
   * Normalize vote data for Act Up platform
   */
  private normalizeVoteData(vote: OpenStatesVote): any {
    return {
      id: vote.id,
      identifier: vote.identifier,
      motion: vote.motion_text,
      motionClassification: vote.motion_classification,
      date: vote.start_date,
      result: vote.result,
      chamber: vote.organization?.name || 'Unknown',
      billId: vote.bill?.id,
      billIdentifier: vote.bill?.identifier,
      votes: vote.votes?.map(v => ({
        option: v.option,
        voterName: v.voter_name,
        voterId: v.voter?.id
      })) || [],
      counts: vote.counts?.reduce((acc, count) => {
        acc[count.option] = count.value;
        return acc;
      }, {} as any) || {},
      sources: vote.sources || [],
      createdAt: vote.created_at,
      updatedAt: vote.updated_at,
      source: 'OpenStates API'
    };
  }
}

export const openStatesBillsAPI = new OpenStatesBillsAPI();

log.info('📋 OpenStates Bills API initialized');