/**
 * OpenStates API Service
 * 
 * Connects to OpenStates.org API for authentic Texas legislative data
 * including bills, legislators, votes, and committee information.
 * 
 * API Documentation: https://docs.openstates.org/
 */

import axios from 'axios';
import { createLogger } from "../logger";
const log = createLogger("openstates-api");


export class OpenStatesAPI {
  private baseUrl = 'https://v3.openstates.org';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENSTATES_API_KEY || '';
  }

  /**
   * Get current Texas legislators
   */
  async getTexasLegislators() {
    try {
      log.info('👥 Fetching current Texas legislators from OpenStates...');
      
      const response = await axios.get(
        `${this.baseUrl}/people`,
        {
          params: {
            jurisdiction: 'tx',
            per_page: 50
          },
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      const legislators = this.normalizeLegislators(response.data.results);
      log.info(`✅ Retrieved ${legislators.length} Texas legislators from OpenStates`);
      return legislators;

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching Texas legislators from OpenStates');
      log.error('❌ Full error details:', error.response?.data || error.response || error);
      if (error.response?.status === 401) {
        throw new Error('OpenStates API key is invalid or missing');
      }
      return [];
    }
  }

  /**
   * Get current Texas bills
   */
  async getTexasBills(limit = 100) {
    try {
      log.info('📋 Fetching current Texas bills from OpenStates...');
      
      const response = await axios.get(
        `${this.baseUrl}/bills`,
        {
          params: {
            jurisdiction: 'tx',
            session: '20252026',  // Current Texas legislative session
            per_page: limit,
            include: 'abstracts,other_titles,other_identifiers,actions,sources,sponsors,votes'
          },
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      const bills = this.normalizeBills(response.data.results);
      log.info(`✅ Retrieved ${bills.length} Texas bills from OpenStates`);
      return bills;

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching Texas bills from OpenStates');
      if (error.response?.status === 401) {
        throw new Error('OpenStates API key is invalid or missing');
      }
      return [];
    }
  }

  /**
   * Get votes for a specific bill
   */
  async getBillVotes(billId: string) {
    try {
      log.info(`🗳️ Fetching votes for bill ${billId}...`);
      
      const response = await axios.get(
        `${this.baseUrl}/bills/${billId}/votes`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      return this.normalizeVotes(response.data.results);

    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching votes for bill ${billId}`);
      return [];
    }
  }

  /**
   * Get detailed information about a specific legislator
   */
  async getLegislatorDetails(personId: string) {
    try {
      log.info(`👤 Fetching details for legislator ${personId}...`);
      
      const response = await axios.get(
        `${this.baseUrl}/people/${personId}`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      return this.normalizeLegislatorDetails(response.data);

    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching legislator ${personId}`);
      return null;
    }
  }

  /**
   * Normalize legislator data for Act Up platform
   */
  private normalizeLegislators(data: any[]) {
    if (!Array.isArray(data)) return [];

    return data.map((person: any) => ({
      id: person.id,
      name: person.name,
      firstName: person.given_name,
      lastName: person.family_name,
      party: person.party?.[0]?.name || 'Unknown',
      district: person.current_role?.district || 'Unknown',
      chamber: person.current_role?.org_classification === 'upper' ? 'Senate' : 'House',
      email: person.email,
      phone: person.capitol_voice,
      office: person.capitol_address,
      website: person.links?.[0]?.url,
      photoUrl: person.image,
      committees: person.committee_memberships || [],
      isActive: person.current_role !== null,
      source: 'OpenStates API - Official Texas Legislature Data'
    }));
  }

  /**
   * Normalize bill data for Act Up platform
   */
  private normalizeBills(data: any[]) {
    if (!Array.isArray(data)) return [];

    return data.map((bill: any) => ({
      id: bill.id,
      number: bill.identifier,
      title: bill.title,
      description: bill.abstracts?.[0]?.abstract || bill.title,
      chamber: bill.from_organization?.classification === 'upper' ? 'Senate' : 'House',
      author: bill.sponsorships?.[0]?.name || 'Unknown',
      sponsors: bill.sponsorships?.map((s: any) => s.name) || [],
      status: this.getLatestAction(bill.actions),
      lastAction: this.getLatestActionText(bill.actions),
      lastActionDate: this.getLatestActionDate(bill.actions),
      url: bill.sources?.[0]?.url,
      subjects: bill.subject || [],
      session: bill.session,
      actions: bill.actions || [],
      votes: bill.votes || [],
      source: 'OpenStates API - Official Texas Legislature Data'
    }));
  }

  /**
   * Normalize vote data
   */
  private normalizeVotes(data: any[]) {
    if (!Array.isArray(data)) return [];

    return data.map((vote: any) => ({
      id: vote.id,
      chamber: vote.organization?.classification === 'upper' ? 'Senate' : 'House',
      date: vote.start_date,
      motion: vote.motion_text,
      result: vote.result,
      yesCount: vote.counts?.find((c: any) => c.option === 'yes')?.value || 0,
      noCount: vote.counts?.find((c: any) => c.option === 'no')?.value || 0,
      absentCount: vote.counts?.find((c: any) => c.option === 'absent')?.value || 0,
      votes: vote.votes || [],
      source: 'OpenStates API - Official Texas Legislature Data'
    }));
  }

  /**
   * Get latest action from bill actions
   */
  private getLatestAction(actions: any[]) {
    if (!Array.isArray(actions) || actions.length === 0) return 'Unknown';
    const latest = actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return latest.description || 'Unknown';
  }

  /**
   * Get latest action text
   */
  private getLatestActionText(actions: any[]) {
    if (!Array.isArray(actions) || actions.length === 0) return 'No recent action';
    const latest = actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return latest.description || 'No recent action';
  }

  /**
   * Get latest action date
   */
  private getLatestActionDate(actions: any[]) {
    if (!Array.isArray(actions) || actions.length === 0) return null;
    const latest = actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return latest.date;
  }

  /**
   * Normalize legislator details
   */
  private normalizeLegislatorDetails(data: any) {
    return {
      ...data,
      committees: data.committee_memberships || [],
      votes: data.vote_events || [],
      sponsorships: data.sponsorships || [],
      source: 'OpenStates API - Official Texas Legislature Data'
    };
  }

  /**
   * Get comprehensive Texas legislative data
   */
  async getComprehensiveTexasData() {
    log.info('🏛️ Fetching comprehensive Texas legislative data from OpenStates...');
    
    const [legislators, bills] = await Promise.all([
      this.getTexasLegislators(),
      this.getTexasBills(200)
    ]);

    return {
      legislators,
      bills,
      lastUpdated: new Date().toISOString(),
      source: 'OpenStates API - Official Texas Legislature Data',
      dataIntegrity: 'Authentic government source via OpenStates.org'
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const openStatesAPI = new OpenStatesAPI();