/**
 * Federal Election Commission (FEC) API Service
 * 
 * Provides authentic campaign finance data for Texas legislators
 * and political candidates from the official FEC database.
 * 
 * API Documentation: https://api.open.fec.gov/developers/
 */

import axios from 'axios';
import { createLogger } from "../logger";
const log = createLogger("fec-api");


export class FECAPIService {
  private baseUrl = 'https://api.open.fec.gov/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FEC_API_KEY || '';
  }

  /**
   * Get campaign finance data for Texas candidates
   */
  async getTexasCandidateFinances(candidateName?: string) {
    try {
      log.info('💰 Fetching authentic Texas campaign finance data from FEC...');
      
      const response = await axios.get(
        `${this.baseUrl}/candidates/`,
        {
          params: {
            api_key: this.apiKey,
            state: 'TX',
            per_page: 100,
            candidate_status: 'C',
            ...(candidateName && { name: candidateName })
          },
          timeout: 15000
        }
      );

      log.info(`✅ Retrieved ${response.data.results.length} Texas candidates with FEC data`);
      return this.normalizeCandidateData(response.data.results);

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching FEC data');
      if (error.response?.status === 403) {
        throw new Error('FEC API key is invalid or missing');
      }
      return [];
    }
  }

  /**
   * Get committee financial data for Texas
   */
  async getTexasCommitteeFinances() {
    try {
      log.info('🏛️ Fetching Texas committee finance data from FEC...');
      
      const response = await axios.get(
        `${this.baseUrl}/committees/`,
        {
          params: {
            api_key: this.apiKey,
            state: 'TX',
            per_page: 50,
            committee_type: ['H', 'S', 'P']
          },
          timeout: 15000
        }
      );

      log.info(`✅ Retrieved ${response.data.results.length} Texas committees with FEC data`);
      return this.normalizeCommitteeData(response.data.results);

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching committee data');
      return [];
    }
  }

  /**
   * Get individual contributions for a candidate
   */
  async getCandidateContributions(candidateId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/schedules/schedule_a/`,
        {
          params: {
            api_key: this.apiKey,
            candidate_id: candidateId,
            per_page: 100,
            sort: '-contribution_receipt_date'
          },
          timeout: 15000
        }
      );

      return this.normalizeContributionData(response.data.results);
    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching contributions for ${candidateId}`);
      return [];
    }
  }

  /**
   * Normalize candidate data for Act Up platform
   */
  private normalizeCandidateData(data: any[]) {
    return data.map((candidate: any) => ({
      fecId: candidate.candidate_id,
      name: candidate.name,
      party: candidate.party,
      office: candidate.office,
      district: candidate.district,
      state: candidate.state,
      incumbentChallenger: candidate.incumbent_challenger_open_seat,
      totalRaised: candidate.total_receipts || 0,
      totalSpent: candidate.total_disbursements || 0,
      cashOnHand: candidate.cash_on_hand_end_period || 0,
      lastUpdated: candidate.load_date,
      cycles: candidate.cycles || [],
      source: 'Federal Election Commission - Official Campaign Finance Data'
    }));
  }

  /**
   * Normalize committee data
   */
  private normalizeCommitteeData(data: any[]) {
    return data.map((committee: any) => ({
      fecId: committee.committee_id,
      name: committee.name,
      committeeType: committee.committee_type,
      designation: committee.designation,
      party: committee.party,
      state: committee.state,
      totalRaised: committee.total_receipts || 0,
      totalSpent: committee.total_disbursements || 0,
      cashOnHand: committee.cash_on_hand_end_period || 0,
      lastUpdated: committee.load_date,
      source: 'Federal Election Commission - Official Committee Finance Data'
    }));
  }

  /**
   * Normalize contribution data
   */
  private normalizeContributionData(data: any[]) {
    return data.map((contribution: any) => ({
      contributorName: contribution.contributor_name,
      contributorEmployer: contribution.contributor_employer,
      contributorOccupation: contribution.contributor_occupation,
      amount: contribution.contribution_receipt_amount,
      date: contribution.contribution_receipt_date,
      city: contribution.contributor_city,
      state: contribution.contributor_state,
      zipCode: contribution.contributor_zip,
      source: 'Federal Election Commission - Official Contribution Records'
    }));
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const fecAPI = new FECAPIService();