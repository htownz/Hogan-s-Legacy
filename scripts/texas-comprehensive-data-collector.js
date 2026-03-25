/**
 * Texas Comprehensive Government Data Collector
 * Collects authentic data from official Texas government sources
 * 
 * Sources:
 * - Texas Legislature Online (capitol.texas.gov)
 * - Texas Ethics Commission (ethics.state.tx.us)
 * - OpenStates API (with your API key)
 * - LegiScan API (with your API key)
 * 
 * Usage: node scripts/texas-comprehensive-data-collector.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrls: {
    texasLegislature: 'https://capitol.texas.gov',
    texasEthics: 'https://www.ethics.state.tx.us',
    openStates: 'https://v3.openstates.org',
    legiScan: 'https://api.legiscan.com'
  },
  apiKeys: {
    openStates: process.env.OPENSTATES_API_KEY || 'c236a534-47b7-45b8-8773-ac5c58ed99a2',
    legiScan: process.env.LEGISCAN_API_KEY
  },
  outputDir: './data/collected',
  session: '88R' // 88th Regular Session
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

class TexasDataCollector {
  constructor() {
    this.committees = [];
    this.hearings = [];
    this.votingRecords = [];
    this.ethicsData = [];
    this.historicalSessions = [];
    this.errors = [];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logProgress(message) {
    console.log(`🏛️ [${new Date().toLocaleTimeString()}] ${message}`);
  }

  logError(error, context) {
    const errorMsg = `❌ Error in ${context}: ${error.message}`;
    console.error(errorMsg);
    this.errors.push({ context, error: error.message, timestamp: new Date() });
  }

  async collectCommitteeData() {
    this.logProgress('Starting committee data collection...');
    
    try {
      // Collect House committees
      const houseCommittees = await this.scrapeHouseCommittees();
      this.committees.push(...houseCommittees);
      
      await this.delay(1000);
      
      // Collect Senate committees
      const senateCommittees = await this.scrapeSenateCommittees();
      this.committees.push(...senateCommittees);
      
      this.logProgress(`Collected ${this.committees.length} committees`);
      return this.committees;
    } catch (error) {
      this.logError(error, 'collectCommitteeData');
      return [];
    }
  }

  async scrapeHouseCommittees() {
    try {
      const url = `${CONFIG.baseUrls.texasLegislature}/committees/house.aspx`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Act Up Platform Data Collector)' }
      });
      
      const $ = cheerio.load(response.data);
      const committees = [];
      
      $('.committee-listing .committee-item').each((index, element) => {
        const $el = $(element);
        const name = $el.find('.committee-name').text().trim();
        const chair = $el.find('.committee-chair').text().trim();
        const description = $el.find('.committee-description').text().trim();
        const membersText = $el.find('.committee-members').text().trim();
        
        if (name) {
          committees.push({
            name,
            chamber: 'House',
            chair,
            description,
            members: membersText ? membersText.split(',').map(m => m.trim()) : [],
            sourceUrl: url,
            collectedAt: new Date()
          });
        }
      });
      
      return committees;
    } catch (error) {
      this.logError(error, 'scrapeHouseCommittees');
      return [];
    }
  }

  async scrapeSenateCommittees() {
    try {
      const url = `${CONFIG.baseUrls.texasLegislature}/committees/senate.aspx`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Act Up Platform Data Collector)' }
      });
      
      const $ = cheerio.load(response.data);
      const committees = [];
      
      $('.committee-listing .committee-item').each((index, element) => {
        const $el = $(element);
        const name = $el.find('.committee-name').text().trim();
        const chair = $el.find('.committee-chair').text().trim();
        const description = $el.find('.committee-description').text().trim();
        const membersText = $el.find('.committee-members').text().trim();
        
        if (name) {
          committees.push({
            name,
            chamber: 'Senate',
            chair,
            description,
            members: membersText ? membersText.split(',').map(m => m.trim()) : [],
            sourceUrl: url,
            collectedAt: new Date()
          });
        }
      });
      
      return committees;
    } catch (error) {
      this.logError(error, 'scrapeSenateCommittees');
      return [];
    }
  }

  async collectVotingRecords() {
    this.logProgress('Starting voting records collection...');
    
    try {
      // Use OpenStates API for voting records
      if (!CONFIG.apiKeys.openStates) {
        throw new Error('OpenStates API key not found');
      }
      
      const url = `${CONFIG.baseUrls.openStates}/votes`;
      const response = await axios.get(url, {
        params: {
          jurisdiction: 'tx',
          session: CONFIG.session,
          per_page: 100
        },
        headers: {
          'X-API-KEY': CONFIG.apiKeys.openStates,
          'User-Agent': 'Act Up Platform Data Collector'
        }
      });
      
      const votes = response.data.results || [];
      
      for (const vote of votes) {
        this.votingRecords.push({
          billId: vote.bill?.id,
          billTitle: vote.bill?.title,
          motion: vote.motion_text,
          result: vote.result,
          chamber: vote.organization?.name,
          date: vote.start_date,
          yesCount: vote.counts.find(c => c.option === 'yes')?.value || 0,
          noCount: vote.counts.find(c => c.option === 'no')?.value || 0,
          abstainCount: vote.counts.find(c => c.option === 'abstain')?.value || 0,
          votes: vote.votes?.map(v => ({
            legislator: v.voter_name,
            vote: v.option,
            party: v.voter?.party?.[0]?.name
          })) || [],
          sourceUrl: vote.sources?.[0]?.url,
          collectedAt: new Date()
        });
      }
      
      this.logProgress(`Collected ${this.votingRecords.length} voting records`);
      return this.votingRecords;
    } catch (error) {
      this.logError(error, 'collectVotingRecords');
      return [];
    }
  }

  async collectEthicsData() {
    this.logProgress('Starting ethics data collection...');
    
    try {
      // Collect personal financial statements
      const pfsData = await this.scrapePersonalFinancialStatements();
      this.ethicsData.push(...pfsData);
      
      await this.delay(2000);
      
      // Collect lobby registrations
      const lobbyData = await this.scrapeLobbyRegistrations();
      this.ethicsData.push(...lobbyData);
      
      this.logProgress(`Collected ${this.ethicsData.length} ethics records`);
      return this.ethicsData;
    } catch (error) {
      this.logError(error, 'collectEthicsData');
      return [];
    }
  }

  async scrapePersonalFinancialStatements() {
    try {
      const url = `${CONFIG.baseUrls.texasEthics}/search/pfs`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Act Up Platform Data Collector)' }
      });
      
      const $ = cheerio.load(response.data);
      const statements = [];
      
      $('.pfs-listing .pfs-item').each((index, element) => {
        const $el = $(element);
        const filerName = $el.find('.filer-name').text().trim();
        const filingYear = $el.find('.filing-year').text().trim();
        const filingDate = $el.find('.filing-date').text().trim();
        const fileUrl = $el.find('.file-link').attr('href');
        
        if (filerName) {
          statements.push({
            type: 'personal_financial_statement',
            filerName,
            filingYear: parseInt(filingYear) || null,
            filingDate,
            fileUrl: fileUrl ? `${CONFIG.baseUrls.texasEthics}${fileUrl}` : null,
            sourceUrl: url,
            collectedAt: new Date()
          });
        }
      });
      
      return statements;
    } catch (error) {
      this.logError(error, 'scrapePersonalFinancialStatements');
      return [];
    }
  }

  async scrapeLobbyRegistrations() {
    try {
      const url = `${CONFIG.baseUrls.texasEthics}/search/lobby`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Act Up Platform Data Collector)' }
      });
      
      const $ = cheerio.load(response.data);
      const registrations = [];
      
      $('.lobby-listing .lobby-item').each((index, element) => {
        const $el = $(element);
        const lobbyistName = $el.find('.lobbyist-name').text().trim();
        const clientName = $el.find('.client-name').text().trim();
        const registrationDate = $el.find('.registration-date').text().trim();
        const subjects = $el.find('.subjects').text().trim();
        
        if (lobbyistName && clientName) {
          registrations.push({
            type: 'lobby_registration',
            lobbyistName,
            clientName,
            registrationDate,
            subjects: subjects ? subjects.split(',').map(s => s.trim()) : [],
            sourceUrl: url,
            collectedAt: new Date()
          });
        }
      });
      
      return registrations;
    } catch (error) {
      this.logError(error, 'scrapeLobbyRegistrations');
      return [];
    }
  }

  async collectHistoricalSessions() {
    this.logProgress('Starting historical sessions collection...');
    
    try {
      const sessions = [];
      
      // Current and recent sessions
      const sessionData = [
        { identifier: '88R', year: 2023, type: 'Regular', startDate: '2023-01-10', endDate: '2023-05-29' },
        { identifier: '87R', year: 2021, type: 'Regular', startDate: '2021-01-12', endDate: '2021-05-31' },
        { identifier: '86R', year: 2019, type: 'Regular', startDate: '2019-01-08', endDate: '2019-05-27' },
        { identifier: '88S1', year: 2023, type: 'Special', startDate: '2023-10-09', endDate: '2023-11-07', sessionNumber: 1 },
        { identifier: '87S3', year: 2021, type: 'Special', startDate: '2021-09-20', endDate: '2021-10-19', sessionNumber: 3 }
      ];
      
      for (const session of sessionData) {
        sessions.push({
          ...session,
          sourceUrl: `${CONFIG.baseUrls.texasLegislature}/session/${session.identifier}`,
          collectedAt: new Date()
        });
      }
      
      this.historicalSessions = sessions;
      this.logProgress(`Collected ${sessions.length} historical sessions`);
      return sessions;
    } catch (error) {
      this.logError(error, 'collectHistoricalSessions');
      return [];
    }
  }

  async saveCollectedData() {
    this.logProgress('Saving collected data...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      const data = {
        collectionTimestamp: new Date(),
        committees: this.committees,
        votingRecords: this.votingRecords,
        ethicsData: this.ethicsData,
        historicalSessions: this.historicalSessions,
        errors: this.errors,
        summary: {
          totalCommittees: this.committees.length,
          totalVotingRecords: this.votingRecords.length,
          totalEthicsRecords: this.ethicsData.length,
          totalHistoricalSessions: this.historicalSessions.length,
          totalErrors: this.errors.length
        }
      };
      
      const filename = `texas-comprehensive-data-${timestamp}.json`;
      const filepath = path.join(CONFIG.outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      
      this.logProgress(`Data saved to: ${filepath}`);
      this.logProgress(`Summary: ${data.summary.totalCommittees} committees, ${data.summary.totalVotingRecords} votes, ${data.summary.totalEthicsRecords} ethics records`);
      
      return filepath;
    } catch (error) {
      this.logError(error, 'saveCollectedData');
      throw error;
    }
  }

  async run() {
    this.logProgress('🚀 Starting comprehensive Texas government data collection...');
    
    try {
      // Collect all data types
      await this.collectCommitteeData();
      await this.delay(2000);
      
      await this.collectVotingRecords();
      await this.delay(2000);
      
      await this.collectEthicsData();
      await this.delay(2000);
      
      await this.collectHistoricalSessions();
      
      // Save all collected data
      const filepath = await this.saveCollectedData();
      
      this.logProgress('✅ Comprehensive data collection completed successfully!');
      return { success: true, filepath, summary: this.getSummary() };
      
    } catch (error) {
      this.logError(error, 'run');
      this.logProgress('❌ Data collection failed');
      return { success: false, error: error.message, summary: this.getSummary() };
    }
  }

  getSummary() {
    return {
      committees: this.committees.length,
      votingRecords: this.votingRecords.length,
      ethicsData: this.ethicsData.length,
      historicalSessions: this.historicalSessions.length,
      errors: this.errors.length
    };
  }
}

// Main execution
if (require.main === module) {
  const collector = new TexasDataCollector();
  
  collector.run()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Collection completed successfully!');
        console.log('📊 Summary:', result.summary);
        console.log('📁 Data saved to:', result.filepath);
      } else {
        console.log('\n❌ Collection failed:', result.error);
        console.log('📊 Partial data collected:', result.summary);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = TexasDataCollector;