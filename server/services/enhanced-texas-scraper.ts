import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Enhanced Texas Legislature Scraper
 * Zero-cost comprehensive legislative data collection
 * Built on proven TLO scraping success with authentic data
 */

interface CollectedBill {
  identifier: string;
  title: string;
  author: string;
  chamber: string;
  status: string;
  summary: string;
  fullText: string;
  url: string;
  fileDate: string;
}

interface CollectedLegislator {
  name: string;
  district: string;
  party: string;
  chamber: string;
  email: string;
  phone: string;
  office: string;
  imageUrl: string;
}

class EnhancedTexasScraper {
  private baseUrl = 'https://capitol.texas.gov';
  private delay = 1500; // Respectful delay between requests

  /**
   * Comprehensive data collection using proven TLO structure
   */
  async performEnhancedCollection(): Promise<{
    success: boolean;
    billsCollected: number;
    legislatorsCollected: number;
    errors: string[];
    data: {
      bills: CollectedBill[];
      legislators: CollectedLegislator[];
    };
  }> {
    const results = {
      success: true,
      billsCollected: 0,
      legislatorsCollected: 0,
      errors: [] as string[],
      data: {
        bills: [] as CollectedBill[],
        legislators: [] as CollectedLegislator[]
      }
    };

    try {
      console.log('🚀 Starting enhanced Texas legislative data collection...');

      // 1. Collect bills using proven TLO directory structure
      try {
        console.log('📋 Collecting bills from TLO directories...');
        const bills = await this.collectBillsFromTLO();
        results.data.bills = bills;
        results.billsCollected = bills.length;
        console.log(`✅ Successfully collected ${bills.length} bills`);
      } catch (error: any) {
        console.error('❌ Error collecting bills:', error.message);
        results.errors.push(`Bills: ${error.message}`);
      }

      // 2. Collect legislator information
      try {
        console.log('👥 Collecting legislator information...');
        const legislators = await this.collectLegislators();
        results.data.legislators = legislators;
        results.legislatorsCollected = legislators.length;
        console.log(`✅ Successfully collected ${legislators.length} legislators`);
      } catch (error: any) {
        console.error('❌ Error collecting legislators:', error.message);
        results.errors.push(`Legislators: ${error.message}`);
      }

      console.log(`🎉 Enhanced collection completed: ${results.billsCollected} bills, ${results.legislatorsCollected} legislators`);

    } catch (error: any) {
      console.error('❌ Enhanced collection failed:', error.message);
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Collect bills using TLO directory structure that we know works
   */
  private async collectBillsFromTLO(): Promise<CollectedBill[]> {
    const bills: CollectedBill[] = [];

    try {
      // Try multiple proven TLO paths for bill collection
      const billPaths = [
        '/tlodocs/88R/billtext/html/house_bills/',
        '/tlodocs/88R/billtext/html/senate_bills/',
        '/tlodocs/87R/billtext/html/house_bills/',
        '/tlodocs/87R/billtext/html/senate_bills/',
        '/BillLookup/',
        '/Reports/'
      ];

      for (const path of billPaths) {
        try {
          console.log(`📋 Checking TLO path: ${path}`);
          const pathBills = await this.scrapeBillsFromPath(path);
          bills.push(...pathBills);
          
          if (bills.length >= 25) { // Collect good sample for initial deployment
            break;
          }
          
          // Respectful delay between paths
          await new Promise(resolve => setTimeout(resolve, this.delay));
          
        } catch (error: any) {
          console.warn(`⚠️ Could not access path ${path}: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('❌ Error in TLO bill collection:', error.message);
      throw error;
    }

    return bills;
  }

  /**
   * Scrape bills from a specific TLO path
   */
  private async scrapeBillsFromPath(path: string): Promise<CollectedBill[]> {
    const bills: CollectedBill[] = [];
    
    try {
      const url = `${this.baseUrl}${path}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Look for bill file links in directory listings
      const billLinks: string[] = [];
      
      // Try various link patterns for bill files
      $('a').each((i, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && (
          href.match(/[HS][BR]\d+/i) ||
          text.match(/^[HS][BR]\d+/i) ||
          href.includes('.htm') ||
          href.includes('.html')
        )) {
          const fullUrl = href.startsWith('http') ? href : `${url}${href}`;
          billLinks.push(fullUrl);
        }
      });

      console.log(`📋 Found ${billLinks.length} potential bill links in ${path}`);

      // Process bill links (limit to first 10 per path)
      for (let i = 0; i < Math.min(billLinks.length, 10); i++) {
        try {
          const bill = await this.extractBillFromUrl(billLinks[i]);
          if (bill) {
            bills.push(bill);
          }
          
          // Respectful delay
          await new Promise(resolve => setTimeout(resolve, this.delay));
          
        } catch (error: any) {
          console.warn(`⚠️ Could not process bill ${billLinks[i]}: ${error.message}`);
        }
      }

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`📋 Path ${path} not found (404) - trying next path`);
      } else {
        console.warn(`⚠️ Error accessing ${path}: ${error.message}`);
      }
    }

    return bills;
  }

  /**
   * Extract bill information from URL
   */
  private async extractBillFromUrl(billUrl: string): Promise<CollectedBill | null> {
    try {
      const response = await axios.get(billUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract bill identifier from URL or content
      const urlMatch = billUrl.match(/([HS][BR]\d+)/i);
      let identifier = urlMatch ? urlMatch[1].toUpperCase() : '';
      
      // Try to get identifier from page content if not in URL
      if (!identifier) {
        const titleText = $('title').text() || $('h1').first().text() || '';
        const contentMatch = titleText.match(/([HS][BR]\d+)/i);
        identifier = contentMatch ? contentMatch[1].toUpperCase() : 'Unknown';
      }

      // Extract title
      let title = $('title').text().trim();
      if (title.includes('TLO')) {
        title = title.replace(/^TLO\s*-?\s*/i, '').trim();
      }
      if (!title || title === 'TLO') {
        title = $('h1, h2, .bill-title').first().text().trim() || 'Texas Legislative Document';
      }

      // Extract full text content
      const fullText = $('body').text().trim();
      
      // Extract author/sponsor
      const authorMatch = fullText.match(/(?:by|author|introduced by|sponsor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      const author = authorMatch ? authorMatch[1] : 'Unknown';

      // Determine chamber
      const chamber = identifier.startsWith('H') ? 'House' : 
                     identifier.startsWith('S') ? 'Senate' : 'Unknown';

      // Extract summary (first paragraph or meaningful content)
      const summary = this.extractSummary(fullText, title);

      const bill: CollectedBill = {
        identifier,
        title,
        author,
        chamber,
        status: 'Filed',
        summary,
        fullText: fullText.substring(0, 2000), // Limit for storage
        url: billUrl,
        fileDate: new Date().toISOString().split('T')[0]
      };

      return bill;

    } catch (error: any) {
      console.warn(`⚠️ Error extracting bill from ${billUrl}: ${error.message}`);
      return null;
    }
  }

  /**
   * Collect legislator information from available sources
   */
  private async collectLegislators(): Promise<CollectedLegislator[]> {
    const legislators: CollectedLegislator[] = [];

    try {
      // Try multiple paths for legislator information
      const legislatorPaths = [
        '/Members/',
        '/Members/Members.aspx',
        '/House/Members/',
        '/Senate/Members/'
      ];

      for (const path of legislatorPaths) {
        try {
          console.log(`👥 Checking legislator path: ${path}`);
          const pathLegislators = await this.scrapeLegislatorsFromPath(path);
          legislators.push(...pathLegislators);
          
          if (legislators.length >= 20) { // Good sample for initial deployment
            break;
          }
          
          // Respectful delay
          await new Promise(resolve => setTimeout(resolve, this.delay));
          
        } catch (error: any) {
          console.warn(`⚠️ Could not access legislator path ${path}: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('❌ Error collecting legislators:', error.message);
      throw error;
    }

    return legislators;
  }

  /**
   * Scrape legislators from specific path
   */
  private async scrapeLegislatorsFromPath(path: string): Promise<CollectedLegislator[]> {
    const legislators: CollectedLegislator[] = [];

    try {
      const url = `${this.baseUrl}${path}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Look for legislator information in various formats
      $('.member, .legislator, tr').each((i, element) => {
        const $elem = $(element);
        
        // Extract name
        const name = $elem.find('.name, .member-name, td:first-child').text().trim() ||
                    $elem.find('a').first().text().trim();
        
        if (name && name.length > 2 && !name.toLowerCase().includes('district')) {
          // Extract other details
          const district = $elem.find('.district, .member-district').text().trim() ||
                          this.extractFromText(name, /district\s*(\d+)/i);
          
          const party = $elem.find('.party, .member-party').text().trim() ||
                       this.extractFromText($elem.text(), /(republican|democratic|democrat|rep|dem)/i);
          
          const chamber = path.toLowerCase().includes('house') ? 'House' :
                         path.toLowerCase().includes('senate') ? 'Senate' : 'Unknown';

          const legislator: CollectedLegislator = {
            name: this.cleanName(name),
            district: district || 'Unknown',
            party: this.standardizeParty(party),
            chamber,
            email: '',
            phone: '',
            office: '',
            imageUrl: ''
          };

          legislators.push(legislator);
        }
      });

    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.warn(`⚠️ Error accessing ${path}: ${error.message}`);
      }
    }

    return legislators.slice(0, 10); // Limit per path
  }

  // Helper methods
  private extractSummary(text: string, title: string): string {
    // Extract meaningful summary from bill text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 2).join('. ').trim();
    return summary.length > 10 ? summary : title;
  }

  private extractFromText(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    return match ? match[1] : '';
  }

  private cleanName(name: string): string {
    return name.replace(/^\s*\d+\.\s*/, '').replace(/,.*$/, '').trim();
  }

  private standardizeParty(party: string): string {
    const p = party.toLowerCase();
    if (p.includes('rep') || p.includes('republican')) return 'Republican';
    if (p.includes('dem') || p.includes('democratic')) return 'Democratic';
    return party || 'Unknown';
  }
}

export const enhancedTexasScraper = new EnhancedTexasScraper();

console.log('🏛️ Enhanced Texas Legislature scraper initialized');