// @ts-nocheck
/**
 * Comprehensive Data Analyzer
 * Advanced analysis and citation engine for all legislative data
 * Analyzes bill language, amendments, campaign donations, and provides complete citations
 */

import { storage } from '../storage';
import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from "../logger";
const log = createLogger("comprehensive-data-analyzer");


interface BillAnalysis {
  billId: string;
  languageAnalysis: {
    keyProvisions: string[];
    legalTerms: string[];
    impactedLaws: string[];
    stakeholders: string[];
    fiscalImpact: string;
    complexity: 'Low' | 'Medium' | 'High';
  };
  amendments: {
    id: string;
    author: string;
    changes: string[];
    impact: string;
    status: string;
    dateProposed: string;
  }[];
  campaignConnections: {
    sponsorDonations: any[];
    industryConnections: string[];
    potentialConflicts: string[];
  };
  citations: {
    source: string;
    url: string;
    dateAccessed: string;
    relevantSections: string[];
  }[];
}

interface LegislatorAnalysis {
  legislatorId: number;
  votingPatterns: {
    partyAlignment: number;
    independentVotes: number;
    keyIssues: string[];
  };
  campaignFinance: {
    topDonors: any[];
    industryBreakdown: any[];
    totalRaised: number;
    expenditures: any[];
  };
  billSponsorship: {
    totalBills: number;
    passageRate: number;
    keyTopics: string[];
    bipartisanEfforts: number;
  };
  citations: {
    source: string;
    url: string;
    dateAccessed: string;
    dataPoints: string[];
  }[];
}

export class ComprehensiveDataAnalyzer {
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      log.warn('⚠️ ANTHROPIC_API_KEY not found - AI analysis will be limited');
      return;
    }
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Comprehensive Bill Analysis with Full Citations
   */
  async analyzeBillComprehensively(billId: string): Promise<BillAnalysis> {
    const bill = await storage.getBill(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    log.info(`🔍 Starting comprehensive analysis for bill: ${bill.title}`);

    // Analyze bill language with AI
    const languageAnalysis = await this.analyzeBillLanguage(bill);
    
    // Get amendments data
    const amendments = await this.getAmendments(billId);
    
    // Analyze campaign connections
    const campaignConnections = await this.analyzeCampaignConnections(bill);
    
    // Compile citations
    const citations = this.compileCitations(bill, amendments, campaignConnections);

    return {
      billId,
      languageAnalysis,
      amendments,
      campaignConnections,
      citations
    };
  }

  /**
   * AI-Powered Bill Language Analysis
   */
  private async analyzeBillLanguage(bill: any) {
    if (!this.anthropic) {
      return this.getBasicLanguageAnalysis(bill);
    }

    try {
      const prompt = `Analyze this Texas legislative bill comprehensively:

Title: ${bill.title}
Description: ${bill.description || 'No description available'}
Full Text: ${bill.fullText || bill.summary || 'Limited text available'}

Provide analysis in JSON format:
{
  "keyProvisions": ["list of main provisions"],
  "legalTerms": ["important legal terms used"],
  "impactedLaws": ["existing laws this would modify"],
  "stakeholders": ["groups affected by this bill"],
  "fiscalImpact": "description of financial impact",
  "complexity": "Low|Medium|High"
}`;

      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      const response = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const analysis = JSON.parse(content.text);
        log.info(`✅ AI analysis completed for bill: ${bill.title}`);
        return analysis;
      }
    } catch (error: any) {
      log.warn({ detail: error }, `⚠️ AI analysis failed for bill ${bill.id}`);
      return this.getBasicLanguageAnalysis(bill);
    }

    return this.getBasicLanguageAnalysis(bill);
  }

  /**
   * Basic Language Analysis (fallback)
   */
  private getBasicLanguageAnalysis(bill: any) {
    const text = bill.fullText || bill.summary || bill.description || '';
    const words = text.toLowerCase().split(/\s+/);
    
    return {
      keyProvisions: this.extractKeyProvisions(text),
      legalTerms: this.extractLegalTerms(words),
      impactedLaws: this.extractImpactedLaws(text),
      stakeholders: this.extractStakeholders(text),
      fiscalImpact: this.extractFiscalImpact(text),
      complexity: this.assessComplexity(text)
    };
  }

  /**
   * Extract Key Provisions from Bill Text
   */
  private extractKeyProvisions(text: string): string[] {
    const provisions: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      sentence = sentence.trim();
      if (sentence.length > 50 && (
        sentence.includes('shall') ||
        sentence.includes('may') ||
        sentence.includes('require') ||
        sentence.includes('establish') ||
        sentence.includes('prohibit')
      )) {
        provisions.push(sentence.substring(0, 150) + (sentence.length > 150 ? '...' : ''));
      }
    });

    return provisions.slice(0, 5); // Top 5 provisions
  }

  /**
   * Extract Legal Terms
   */
  private extractLegalTerms(words: string[]): string[] {
    const legalTerms = [
      'statute', 'code', 'regulation', 'ordinance', 'jurisdiction',
      'amendment', 'subsection', 'chapter', 'article', 'section',
      'liability', 'compliance', 'violation', 'enforcement', 'penalty',
      'appropriation', 'allocation', 'funding', 'budget', 'revenue'
    ];

    return legalTerms.filter(term => words.includes(term));
  }

  /**
   * Extract Impacted Laws
   */
  private extractImpactedLaws(text: string): string[] {
    const lawReferences: string[] = [];
    
    // Look for Texas Code references
    const codeMatches = text.match(/Texas\s+(\w+)\s+Code/gi);
    if (codeMatches) {
      lawReferences.push(...codeMatches);
    }

    // Look for section references
    const sectionMatches = text.match(/Section\s+\d+\.\d+/gi);
    if (sectionMatches) {
      lawReferences.push(...sectionMatches.slice(0, 3));
    }

    return [...new Set(lawReferences)]; // Remove duplicates
  }

  /**
   * Extract Stakeholders
   */
  private extractStakeholders(text: string): string[] {
    const stakeholderTerms = [
      'taxpayer', 'citizen', 'resident', 'business', 'corporation',
      'school', 'student', 'teacher', 'parent', 'family',
      'government', 'agency', 'department', 'commission',
      'healthcare', 'patient', 'doctor', 'hospital',
      'environment', 'public', 'community', 'industry'
    ];

    const lowerText = text.toLowerCase();
    return stakeholderTerms.filter(term => lowerText.includes(term));
  }

  /**
   * Extract Fiscal Impact
   */
  private extractFiscalImpact(text: string): string {
    const fiscalKeywords = ['cost', 'budget', 'fund', 'appropriat', 'dollar', 'million', 'billion'];
    const lowerText = text.toLowerCase();
    
    if (fiscalKeywords.some(keyword => lowerText.includes(keyword))) {
      // Look for dollar amounts
      const dollarMatch = text.match(/\$[\d,]+(\.\d{2})?/);
      if (dollarMatch) {
        return `Potential fiscal impact identified: ${dollarMatch[0]}`;
      }
      return 'Fiscal impact indicated in bill text';
    }
    
    return 'No clear fiscal impact identified';
  }

  /**
   * Assess Complexity
   */
  private assessComplexity(text: string): 'Low' | 'Medium' | 'High' {
    const complexityIndicators = {
      high: ['amend', 'modify', 'complex', 'comprehensive', 'multi'],
      medium: ['establish', 'create', 'require', 'authorize'],
      low: ['simple', 'basic', 'clarify', 'update']
    };

    const lowerText = text.toLowerCase();
    
    if (complexityIndicators.high.some(term => lowerText.includes(term))) {
      return 'High';
    } else if (complexityIndicators.medium.some(term => lowerText.includes(term))) {
      return 'Medium';
    }
    
    return 'Low';
  }

  /**
   * Get Amendments for Bill
   */
  private async getAmendments(billId: string) {
    try {
      // Try to get amendments from database
      const amendments = await storage.getBillAmendments?.(billId);
      if (amendments && amendments.length > 0) {
        return amendments.map((amend: any) => ({
          id: amend.id,
          author: amend.author || 'Unknown',
          changes: amend.changes || ['Amendment details not available'],
          impact: amend.impact || 'Impact analysis pending',
          status: amend.status || 'Proposed',
          dateProposed: amend.dateProposed || new Date().toISOString().split('T')[0]
        }));
      }
    } catch (error: any) {
      log.info(`ℹ️ No amendments found for bill ${billId}`);
    }

    return []; // No amendments found
  }

  /**
   * Analyze Campaign Finance Connections
   */
  private async analyzeCampaignConnections(bill: any) {
    const connections = {
      sponsorDonations: [],
      industryConnections: [],
      potentialConflicts: []
    };

    try {
      // Get sponsor information
      if (bill.sponsors) {
        const sponsors = bill.sponsors.split(',').map((s: string) => s.trim());
        
        for (const sponsorName of sponsors) {
          // Try to find legislator by name
          const legislator = await storage.getLegislatorByName?.(sponsorName);
          if (legislator) {
            // Get campaign finance data
            const donations = await storage.getCampaignDonations?.(legislator.id);
            if (donations && donations.length > 0) {
              connections.sponsorDonations.push({
                legislator: sponsorName,
                topDonors: donations.slice(0, 5),
                totalAmount: donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
              });
            }
          }
        }

        // Analyze industry connections based on bill subject
        if (bill.subjects && bill.subjects.length > 0) {
          connections.industryConnections = this.identifyIndustryConnections(bill.subjects);
        }

        // Look for potential conflicts
        connections.potentialConflicts = this.identifyPotentialConflicts(
          connections.sponsorDonations, 
          bill.subjects || []
        );
      }
    } catch (error: any) {
      log.info(`ℹ️ Campaign finance analysis limited for bill ${bill.id}`);
    }

    return connections;
  }

  /**
   * Identify Industry Connections
   */
  private identifyIndustryConnections(subjects: string[]): string[] {
    const industryMap: Record<string, string[]> = {
      'Healthcare': ['health', 'medical', 'hospital', 'insurance'],
      'Energy': ['energy', 'oil', 'gas', 'renewable', 'electric'],
      'Education': ['education', 'school', 'university', 'student'],
      'Transportation': ['transportation', 'highway', 'road', 'transit'],
      'Finance': ['banking', 'finance', 'credit', 'loan', 'tax'],
      'Technology': ['technology', 'internet', 'data', 'digital'],
      'Agriculture': ['agriculture', 'farm', 'rural', 'crop'],
      'Real Estate': ['property', 'housing', 'development', 'zoning']
    };

    const connections: string[] = [];
    const subjectText = subjects.join(' ').toLowerCase();

    Object.entries(industryMap).forEach(([industry, keywords]) => {
      if (keywords.some(keyword => subjectText.includes(keyword))) {
        connections.push(industry);
      }
    });

    return connections;
  }

  /**
   * Identify Potential Conflicts of Interest
   */
  private identifyPotentialConflicts(sponsorDonations: any[], subjects: string[]): string[] {
    const conflicts: string[] = [];
    
    sponsorDonations.forEach(sponsor => {
      sponsor.topDonors?.forEach((donor: any) => {
        const donorName = donor.contributor_name?.toLowerCase() || '';
        const subjectText = subjects.join(' ').toLowerCase();
        
        // Simple conflict detection based on industry keywords
        if (subjectText.includes('energy') && donorName.includes('oil')) {
          conflicts.push(`Energy industry donation from ${donor.contributor_name} to bill sponsor`);
        }
        if (subjectText.includes('health') && donorName.includes('pharma')) {
          conflicts.push(`Healthcare industry donation from ${donor.contributor_name} to bill sponsor`);
        }
        // Add more conflict detection rules as needed
      });
    });

    return conflicts;
  }

  /**
   * Compile Complete Citations
   */
  private compileCitations(bill: any, amendments: any[], campaignConnections: any) {
    const citations = [];
    const currentDate = new Date().toISOString().split('T')[0];

    // Bill source citation
    citations.push({
      source: 'Texas Legislature Online',
      url: bill.url || `https://capitol.texas.gov/BillLookup/History.aspx?LegSess=88R&Bill=${bill.billNumber || bill.id}`,
      dateAccessed: currentDate,
      relevantSections: ['Bill Text', 'Legislative History', 'Status Information']
    });

    // OpenStates citation if available
    if (bill.openStatesId) {
      citations.push({
        source: 'OpenStates API',
        url: `https://openstates.org/tx/bills/${bill.openStatesId}/`,
        dateAccessed: currentDate,
        relevantSections: ['Bill Details', 'Sponsor Information', 'Legislative Actions']
      });
    }

    // LegiScan citation if available
    if (bill.legiscanId) {
      citations.push({
        source: 'LegiScan Legislative Database',
        url: `https://legiscan.com/TX/bill/${bill.legiscanId}`,
        dateAccessed: currentDate,
        relevantSections: ['Bill Text', 'Amendments', 'Voting Records']
      });
    }

    // Campaign finance citations
    if (campaignConnections.sponsorDonations.length > 0) {
      citations.push({
        source: 'Federal Election Commission (FEC)',
        url: 'https://www.fec.gov/data/',
        dateAccessed: currentDate,
        relevantSections: ['Campaign Contributions', 'Donor Information', 'Financial Disclosures']
      });
    }

    return citations;
  }

  /**
   * Comprehensive Legislator Analysis
   */
  async analyzeLegislatorComprehensively(legislatorId: number): Promise<LegislatorAnalysis> {
    const legislator = await storage.getLegislator(legislatorId);
    if (!legislator) {
      throw new Error(`Legislator ${legislatorId} not found`);
    }

    log.info(`🔍 Starting comprehensive analysis for legislator: ${legislator.name}`);

    // Analyze voting patterns
    const votingPatterns = await this.analyzeVotingPatterns(legislatorId);
    
    // Analyze campaign finance
    const campaignFinance = await this.analyzeCampaignFinance(legislatorId);
    
    // Analyze bill sponsorship
    const billSponsorship = await this.analyzeBillSponsorship(legislatorId);
    
    // Compile citations
    const citations = this.compileLegislatorCitations(legislator, campaignFinance);

    return {
      legislatorId,
      votingPatterns,
      campaignFinance,
      billSponsorship,
      citations
    };
  }

  /**
   * Analyze Voting Patterns
   */
  private async analyzeVotingPatterns(legislatorId: number) {
    try {
      const votes = await storage.getLegislatorVotes?.(legislatorId);
      if (!votes || votes.length === 0) {
        return {
          partyAlignment: 0,
          independentVotes: 0,
          keyIssues: []
        };
      }

      // Calculate party alignment and independent votes
      const partyVotes = votes.filter((vote: any) => vote.partyLine === true).length;
      const independentVotes = votes.length - partyVotes;
      const partyAlignment = Math.round((partyVotes / votes.length) * 100);

      // Extract key issues from vote subjects
      const keyIssues = this.extractKeyIssuesFromVotes(votes);

      return {
        partyAlignment,
        independentVotes,
        keyIssues
      };
    } catch (error: any) {
      log.info(`ℹ️ Voting pattern analysis limited for legislator ${legislatorId}`);
      return {
        partyAlignment: 0,
        independentVotes: 0,
        keyIssues: []
      };
    }
  }

  /**
   * Extract Key Issues from Votes
   */
  private extractKeyIssuesFromVotes(votes: any[]): string[] {
    const issueKeywords = ['healthcare', 'education', 'transportation', 'energy', 'budget', 'tax', 'environment'];
    const issueCounts: Record<string, number> = {};

    votes.forEach(vote => {
      const billText = (vote.billTitle || '').toLowerCase();
      issueKeywords.forEach(keyword => {
        if (billText.includes(keyword)) {
          issueCounts[keyword] = (issueCounts[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  /**
   * Analyze Campaign Finance
   */
  private async analyzeCampaignFinance(legislatorId: number) {
    try {
      const donations = await storage.getCampaignDonations?.(legislatorId);
      if (!donations || donations.length === 0) {
        return {
          topDonors: [],
          industryBreakdown: [],
          totalRaised: 0,
          expenditures: []
        };
      }

      // Calculate total raised
      const totalRaised = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

      // Get top donors
      const donorTotals: Record<string, number> = {};
      donations.forEach((donation: any) => {
        const donor = donation.contributor_name || 'Unknown';
        donorTotals[donor] = (donorTotals[donor] || 0) + (donation.amount || 0);
      });

      const topDonors = Object.entries(donorTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, amount]) => ({ name, amount }));

      // Industry breakdown
      const industryBreakdown = this.categorizeContributionsByIndustry(donations);

      return {
        topDonors,
        industryBreakdown,
        totalRaised,
        expenditures: [] // Would need additional data source for expenditures
      };
    } catch (error: any) {
      log.info(`ℹ️ Campaign finance analysis limited for legislator ${legislatorId}`);
      return {
        topDonors: [],
        industryBreakdown: [],
        totalRaised: 0,
        expenditures: []
      };
    }
  }

  /**
   * Categorize Contributions by Industry
   */
  private categorizeContributionsByIndustry(donations: any[]) {
    const industryKeywords: Record<string, string[]> = {
      'Energy': ['oil', 'gas', 'energy', 'petroleum', 'electric'],
      'Healthcare': ['health', 'medical', 'pharma', 'hospital'],
      'Finance': ['bank', 'credit', 'financial', 'investment'],
      'Technology': ['tech', 'software', 'digital', 'internet'],
      'Real Estate': ['real estate', 'property', 'development'],
      'Legal': ['law', 'legal', 'attorney'],
      'Other': []
    };

    const industryTotals: Record<string, number> = {};

    donations.forEach(donation => {
      const contributorName = (donation.contributor_name || '').toLowerCase();
      const contributorEmployer = (donation.contributor_employer || '').toLowerCase();
      const searchText = `${contributorName} ${contributorEmployer}`;

      let categorized = false;
      Object.entries(industryKeywords).forEach(([industry, keywords]) => {
        if (industry !== 'Other' && keywords.some(keyword => searchText.includes(keyword))) {
          industryTotals[industry] = (industryTotals[industry] || 0) + (donation.amount || 0);
          categorized = true;
        }
      });

      if (!categorized) {
        industryTotals['Other'] = (industryTotals['Other'] || 0) + (donation.amount || 0);
      }
    });

    return Object.entries(industryTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([industry, amount]) => ({ industry, amount }));
  }

  /**
   * Analyze Bill Sponsorship
   */
  private async analyzeBillSponsorship(legislatorId: number) {
    try {
      const sponsoredBills = await storage.getBillsFromLegislator?.(legislatorId);
      if (!sponsoredBills || sponsoredBills.length === 0) {
        return {
          totalBills: 0,
          passageRate: 0,
          keyTopics: [],
          bipartisanEfforts: 0
        };
      }

      // Calculate passage rate
      const passedBills = sponsoredBills.filter((bill: any) => 
        bill.status === 'Passed' || bill.status === 'Enrolled'
      ).length;
      const passageRate = Math.round((passedBills / sponsoredBills.length) * 100);

      // Extract key topics
      const keyTopics = this.extractKeyTopicsFromBills(sponsoredBills);

      // Count bipartisan efforts (simplified - would need cosponsor data)
      const bipartisanEfforts = sponsoredBills.filter((bill: any) => 
        bill.cosponsors && bill.cosponsors.length > 0
      ).length;

      return {
        totalBills: sponsoredBills.length,
        passageRate,
        keyTopics,
        bipartisanEfforts
      };
    } catch (error: any) {
      log.info(`ℹ️ Bill sponsorship analysis limited for legislator ${legislatorId}`);
      return {
        totalBills: 0,
        passageRate: 0,
        keyTopics: [],
        bipartisanEfforts: 0
      };
    }
  }

  /**
   * Extract Key Topics from Bills
   */
  private extractKeyTopicsFromBills(bills: any[]): string[] {
    const topicCounts: Record<string, number> = {};

    bills.forEach(bill => {
      if (bill.subjects && Array.isArray(bill.subjects)) {
        bill.subjects.forEach((subject: string) => {
          topicCounts[subject] = (topicCounts[subject] || 0) + 1;
        });
      }
    });

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Compile Legislator Citations
   */
  private compileLegislatorCitations(legislator: any, campaignFinance: any) {
    const citations = [];
    const currentDate = new Date().toISOString().split('T')[0];

    // Legislator profile citation
    citations.push({
      source: 'Texas Legislature Online',
      url: `https://house.texas.gov/members/member-page/?district=${legislator.district}`,
      dateAccessed: currentDate,
      dataPoints: ['Contact Information', 'Committee Assignments', 'Biographical Information']
    });

    // OpenStates citation
    citations.push({
      source: 'OpenStates API',
      url: 'https://openstates.org/tx/legislators/',
      dateAccessed: currentDate,
      dataPoints: ['Legislative History', 'Sponsored Bills', 'Voting Records']
    });

    // Campaign finance citation
    if (campaignFinance.totalRaised > 0) {
      citations.push({
        source: 'Federal Election Commission (FEC)',
        url: 'https://www.fec.gov/data/',
        dateAccessed: currentDate,
        dataPoints: ['Campaign Contributions', 'Financial Disclosures', 'Donor Information']
      });
    }

    return citations;
  }
}

export const comprehensiveAnalyzer = new ComprehensiveDataAnalyzer();