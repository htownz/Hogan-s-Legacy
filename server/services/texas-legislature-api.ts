/**
 * Texas Legislature Direct API Service
 * 
 * Connects directly to the Texas Legislature's official APIs for authentic
 * real-time legislative data including bills, legislators, and voting records.
 * 
 * API Documentation: https://www.capitol.state.tx.us/
 */

import axios from 'axios';

export class TexasLegislatureAPI {
  private baseUrl = 'https://capitol.state.tx.us';
  private currentSession = '89R'; // 89th Legislature, Regular Session (2025)

  /**
   * Get current Texas legislators from official Texas Legislature Online
   */
  async getCurrentLegislators() {
    try {
      console.log('👥 Fetching current Texas legislators from Texas Legislature Online...');
      
      // Get legislators using the public search interface
      const response = await axios.get(
        `${this.baseUrl}/Search/api/members/${this.currentSession}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ActUp-Platform/1.0'
          },
          timeout: 15000
        }
      );

      const legislators = this.normalizeLegislators(response.data, 'All');
      console.log(`✅ Retrieved ${legislators.length} current Texas legislators`);
      return legislators;

    } catch (error: any) {
      console.error('❌ Error fetching Texas legislators:', error.message);
      
      // Try alternative endpoint for member listings
      try {
        console.log('🔄 Trying alternative member endpoint...');
        const altResponse = await axios.get(
          `${this.baseUrl}/Members/api/members`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'ActUp-Platform/1.0'
            },
            timeout: 15000
          }
        );
        
        const legislators = this.normalizeLegislators(altResponse.data, 'All');
        console.log(`✅ Retrieved ${legislators.length} Texas legislators from alternative endpoint`);
        return legislators;
        
      } catch (altError: any) {
        console.error('❌ Alternative endpoint also failed:', altError.message);
        return [];
      }
    }
  }

  /**
   * Get current Texas bills
   */
  async getCurrentBills() {
    try {
      console.log('📋 Fetching current Texas bills from official API...');
      
      const response = await axios.get(
        `${this.baseUrl}/BillLookup/api/bill/list/${this.currentSession}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ActUp-Platform/1.0'
          },
          timeout: 15000
        }
      );

      const bills = this.normalizeBills(response.data);
      console.log(`✅ Retrieved ${bills.length} current Texas bills`);
      return bills;

    } catch (error: any) {
      console.error('❌ Error fetching Texas bills:', error.message);
      return [];
    }
  }

  /**
   * Get specific bill details
   */
  async getBillDetails(billNumber: string) {
    try {
      console.log(`📄 Fetching details for bill ${billNumber}...`);
      
      const response = await axios.get(
        `${this.baseUrl}/BillLookup/api/bill/${this.currentSession}/${billNumber}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ActUp-Platform/1.0'
          },
          timeout: 10000
        }
      );

      return this.normalizeBillDetails(response.data);

    } catch (error: any) {
      console.error(`❌ Error fetching bill ${billNumber}:`, error.message);
      return null;
    }
  }

  /**
   * Get legislator voting records
   */
  async getLegislatorVotes(memberId: string) {
    try {
      console.log(`🗳️ Fetching voting record for legislator ${memberId}...`);
      
      const response = await axios.get(
        `${this.baseUrl}/BillLookup/api/member/${this.currentSession}/${memberId}/votes`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ActUp-Platform/1.0'
          },
          timeout: 10000
        }
      );

      return this.normalizeVotingRecord(response.data);

    } catch (error: any) {
      console.error(`❌ Error fetching votes for ${memberId}:`, error.message);
      return [];
    }
  }

  /**
   * Normalize legislator data for Act Up platform
   */
  private normalizeLegislators(data: any[], chamber: string) {
    if (!Array.isArray(data)) return [];

    return data.map((member: any) => ({
      id: member.MemberId || member.Id,
      name: member.Name || `${member.FirstName} ${member.LastName}`,
      firstName: member.FirstName,
      lastName: member.LastName,
      party: member.Party,
      district: member.District,
      chamber: chamber,
      email: member.Email,
      phone: member.Phone,
      office: member.Office,
      website: member.Website,
      photoUrl: member.PhotoUrl,
      committees: member.Committees || [],
      isActive: true,
      source: 'Texas Legislature Official API'
    }));
  }

  /**
   * Normalize bill data for Act Up platform
   */
  private normalizeBills(data: any[]) {
    if (!Array.isArray(data)) return [];

    return data.map((bill: any) => ({
      id: bill.BillId || bill.Id,
      number: bill.BillNumber || bill.Number,
      title: bill.Title || bill.Caption,
      description: bill.Description || bill.Summary,
      chamber: bill.Chamber,
      author: bill.Author,
      sponsor: bill.Sponsor,
      status: bill.Status,
      lastAction: bill.LastAction,
      lastActionDate: bill.LastActionDate,
      effectiveDate: bill.EffectiveDate,
      url: bill.Url,
      fullText: bill.FullText,
      subjects: bill.Subjects || [],
      committee: bill.Committee,
      session: this.currentSession,
      source: 'Texas Legislature Official API'
    }));
  }

  /**
   * Normalize bill details
   */
  private normalizeBillDetails(data: any) {
    return {
      ...data,
      history: data.History || [],
      amendments: data.Amendments || [],
      votes: data.Votes || [],
      analysis: data.Analysis,
      fiscalNote: data.FiscalNote,
      source: 'Texas Legislature Official API'
    };
  }

  /**
   * Normalize voting record
   */
  private normalizeVotingRecord(data: any) {
    if (!Array.isArray(data)) return [];

    return data.map((vote: any) => ({
      billNumber: vote.BillNumber,
      voteDate: vote.VoteDate,
      vote: vote.Vote, // Yes, No, Absent, Present
      chamber: vote.Chamber,
      voteType: vote.VoteType,
      source: 'Texas Legislature Official API'
    }));
  }

  /**
   * Get comprehensive Texas legislative data
   */
  async getComprehensiveData() {
    console.log('🏛️ Fetching comprehensive Texas legislative data...');
    
    const [legislators, bills] = await Promise.all([
      this.getCurrentLegislators(),
      this.getCurrentBills()
    ]);

    return {
      session: this.currentSession,
      legislators,
      bills,
      lastUpdated: new Date().toISOString(),
      source: 'Texas Legislature Official API',
      dataIntegrity: 'Authentic government source'
    };
  }
}

export const texasLegislatureAPI = new TexasLegislatureAPI();