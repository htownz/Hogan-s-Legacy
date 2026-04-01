// @ts-nocheck
import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from '../storage';
import { createLogger } from "../logger";
const log = createLogger("texas-legislature-scraper");


interface TexasLegislativeBill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsor: string;
  party?: string;
  introducedAt: Date;
  lastActionAt: Date;
  fullText?: string;
  summary?: string;
  committees?: string[];
  actions?: Array<{
    date: Date;
    action: string;
    chamber: string;
  }>;
}

export class TexasLegislatureScraper {
  private baseUrl = 'https://capitol.texas.gov';
  private searchUrl = 'https://capitol.texas.gov/Search/BillSearch.aspx';
  
  constructor() {
    log.info('🏛️ Texas Legislature Online scraper initialized');
  }

  /**
   * Scrape current Texas legislative session bills
   */
  async scrapeCurrentSessionBills(limit: number = 50): Promise<TexasLegislativeBill[]> {
    try {
      log.info(`🔍 Scraping Texas Legislature Online for ${limit} current bills...`);
      
      const bills: TexasLegislativeBill[] = [];
      
      // Scrape House bills
      const houseBills = await this.scrapeBillsByType('H', Math.ceil(limit / 2));
      bills.push(...houseBills);
      
      // Scrape Senate bills
      const senateBills = await this.scrapeBillsByType('S', Math.floor(limit / 2));
      bills.push(...senateBills);
      
      log.info(`✅ Successfully scraped ${bills.length} Texas bills from TLO`);
      return bills.slice(0, limit);
      
    } catch (error: any) {
      log.error({ err: error }, '❌ Error scraping Texas Legislature Online');
      throw new Error('Failed to scrape Texas legislative data');
    }
  }

  /**
   * Scrape bills by chamber type (House or Senate)
   */
  private async scrapeBillsByType(chamber: 'H' | 'S', limit: number): Promise<TexasLegislativeBill[]> {
    try {
      const chamberName = chamber === 'H' ? 'House' : 'Senate';
      log.info(`📜 Scraping ${chamberName} bills from TLO...`);
      
      // Get the current session number (89th Legislature, etc.)
      const sessionNumber = await this.getCurrentSessionNumber();
      
      const bills: TexasLegislativeBill[] = [];
      let billNumber = 1;
      
      while (bills.length < limit && billNumber <= 500) {
        try {
          const billId = `${chamber}B${String(billNumber).padStart(5, '0')}`;
          const bill = await this.scrapeBillDetails(billId, sessionNumber);
          
          if (bill) {
            bills.push(bill);
            log.info(`📋 Scraped bill: ${bill.id} - ${bill.title}`);
          }
          
          billNumber++;
          
          // Add delay to be respectful to the server
          await this.delay(200);
          
        } catch (error: any) {
          log.info(`⚠️ Skipping bill ${chamber}B${String(billNumber).padStart(5, '0')}: ${error}`);
          billNumber++;
        }
      }
      
      return bills;
      
    } catch (error: any) {
      log.error({ err: error }, `❌ Error scraping ${chamber} bills`);
      return [];
    }
  }

  /**
   * Get current Texas legislative session number
   */
  async getCurrentSessionNumber(): Promise<string> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Look for session information on the main page
      const sessionText = $('.session-info, .current-session, .legislature-session').text();
      const sessionMatch = sessionText.match(/(\d+)(th|st|nd|rd)\s+Legislature/);
      
      if (sessionMatch) {
        return sessionMatch[1];
      }
      
      // Default to 89th Legislature if not found
      return '89';
      
    } catch (error: any) {
      log.info('⚠️ Could not determine session number, using default (89th)');
      return '89';
    }
  }

  /**
   * Scrape detailed information for a specific bill
   */
  async scrapeBillDetails(billId: string, session: string): Promise<TexasLegislativeBill | null> {
    try {
      const billUrl = `${this.baseUrl}/BillLookup/History.aspx?LegSess=${session}R&Bill=${billId}`;
      
      const response = await axios.get(billUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Check if bill exists
      const errorMessage = $('.error, .not-found, .bill-not-found').text();
      if (errorMessage || response.data.includes('not found') || response.data.includes('does not exist')) {
        return null;
      }
      
      // Extract bill information
      const title = this.cleanText($('.bill-title, .caption, h2').first().text()) || 
                   this.cleanText($('span[id*="Caption"], span[id*="Title"]').text()) ||
                   `Texas ${billId.charAt(0) === 'H' ? 'House' : 'Senate'} Bill ${billId}`;
      
      const description = this.cleanText($('.bill-description, .bill-summary, .synopsis').first().text()) ||
                         this.cleanText($('span[id*="BillSummary"], span[id*="Synopsis"]').text()) ||
                         title;
      
      const status = this.extractBillStatus($);
      const sponsor = this.extractSponsor($);
      const actions = this.extractActions($);
      
      const introducedAt = actions.length > 0 ? actions[0].date : new Date();
      const lastActionAt = actions.length > 0 ? actions[actions.length - 1].date : new Date();
      
      return {
        id: billId,
        title,
        description,
        status,
        chamber: billId.charAt(0) === 'H' ? 'House' : 'Senate',
        sponsor,
        introducedAt,
        lastActionAt,
        actions
      };
      
    } catch (error: any) {
      log.info({ detail: error.message }, `⚠️ Could not scrape bill ${billId}`);
      return null;
    }
  }

  /**
   * Extract bill status from the page
   */
  private extractBillStatus($: cheerio.CheerioAPI): string {
    const statusSelectors = [
      '.bill-status',
      '.status',
      'span[id*="Status"]',
      'td:contains("Status")',
      '.current-status'
    ];
    
    for (const selector of statusSelectors) {
      const statusText = this.cleanText($(selector).text());
      if (statusText && statusText.length > 0) {
        return statusText;
      }
    }
    
    // Check for common status indicators in the page
    const pageText = $.html().toLowerCase();
    if (pageText.includes('signed by governor')) return 'Signed by Governor';
    if (pageText.includes('passed')) return 'Passed';
    if (pageText.includes('pending')) return 'Pending';
    if (pageText.includes('committee')) return 'In Committee';
    
    return 'Filed';
  }

  /**
   * Extract bill sponsor information
   */
  private extractSponsor($: cheerio.CheerioAPI): string {
    const sponsorSelectors = [
      '.sponsor',
      '.author',
      'span[id*="Author"]',
      'span[id*="Sponsor"]',
      'td:contains("Author")',
      'td:contains("Sponsor")'
    ];
    
    for (const selector of sponsorSelectors) {
      const sponsorText = this.cleanText($(selector).text());
      if (sponsorText && sponsorText.length > 0) {
        return sponsorText;
      }
    }
    
    return 'Unknown';
  }

  /**
   * Extract bill actions/history
   */
  private extractActions($: cheerio.CheerioAPI): Array<{ date: Date; action: string; chamber: string }> {
    const actions: Array<{ date: Date; action: string; chamber: string }> = [];
    
    // Look for action tables
    $('.action-table tr, .history-table tr, table[id*="History"] tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const dateText = this.cleanText(cells.eq(0).text());
        const actionText = this.cleanText(cells.eq(1).text());
        const chamberText = cells.length > 2 ? this.cleanText(cells.eq(2).text()) : '';
        
        const date = this.parseDate(dateText);
        if (date && actionText) {
          actions.push({
            date,
            action: actionText,
            chamber: chamberText || 'Unknown'
          });
        }
      }
    });
    
    return actions;
  }

  /**
   * Parse date string into Date object
   */
  private parseDate(dateStr: string): Date | null {
    try {
      const cleanDate = dateStr.replace(/\s+/g, ' ').trim();
      const date = new Date(cleanDate);
      
      if (isNaN(date.getTime())) {
        // Try different date formats
        const formats = [
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
          /(\d{4})-(\d{1,2})-(\d{1,2})/,
          /(\w+)\s+(\d{1,2}),?\s+(\d{4})/
        ];
        
        for (const format of formats) {
          const match = cleanDate.match(format);
          if (match) {
            return new Date(cleanDate);
          }
        }
        
        return null;
      }
      
      return date;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .replace(/^[:\-\s]+/, '')
      .replace(/[:\-\s]+$/, '');
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Store scraped bills in the database
   */
  async storeScrapedBills(bills: TexasLegislativeBill[]): Promise<void> {
    try {
      log.info(`💾 Storing ${bills.length} scraped Texas bills in database...`);
      
      for (const bill of bills) {
        try {
          await storage.createOrUpdateBill({
            id: bill.id,
            title: bill.title,
            description: bill.description,
            status: bill.status,
            chamber: bill.chamber,
            sponsor: bill.sponsor,
            party: bill.party || null,
            introducedAt: bill.introducedAt,
            lastActionAt: bill.lastActionAt,
            lastUpdated: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
        } catch (error: any) {
          log.error({ err: error }, `❌ Error storing bill ${bill.id}`);
        }
      }
      
      log.info(`✅ Successfully stored ${bills.length} Texas bills in database`);
      
    } catch (error: any) {
      log.error({ err: error }, '❌ Error storing scraped bills');
      throw error;
    }
  }

  /**
   * Perform one-time data collection from Texas Legislature Online
   */
  async performOneTimeDataCollection(limit: number = 100): Promise<TexasLegislativeBill[]> {
    try {
      log.info('🚀 Starting one-time Texas Legislature Online data collection...');
      
      const bills = await this.scrapeCurrentSessionBills(limit);
      
      if (bills.length > 0) {
        await this.storeScrapedBills(bills);
      }
      
      log.info(`🎉 One-time data collection completed! Collected ${bills.length} Texas bills.`);
      return bills;
      
    } catch (error: any) {
      log.error({ err: error }, '❌ One-time data collection failed');
      throw error;
    }
  }
}

export const texasLegislatureScraper = new TexasLegislatureScraper();