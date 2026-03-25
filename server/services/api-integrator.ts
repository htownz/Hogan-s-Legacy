/**
 * API Integrator Service
 * 
 * This service combines data from multiple APIs to provide a more comprehensive 
 * view of legislative information.
 */

import { legiscanService } from './legiscan-service';
import { apiCache } from './enhanced-cache';
import axios from 'axios';

/**
 * Service for combining and enhancing data from multiple API sources
 */
class ApiIntegratorService {
  /**
   * Get enhanced bill data by combining LegiScan data with other sources
   */
  async getEnhancedBill(billId: number): Promise<any> {
    try {
      // First get the bill from LegiScan
      const bill = await legiscanService.getBill(billId);
      
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      // Create an enhanced bill object
      const enhancedBill = {
        ...bill,
        relatedBills: await this.findRelatedBills(bill),
        newsArticles: await this.findRelevantNews(bill),
        committees: await this.getCommitteeData(bill)
      };
      
      return enhancedBill;
    } catch (error: any) {
      console.error('Error getting enhanced bill data:', error);
      throw error;
    }
  }
  
  /**
   * Find bills related to the given bill based on topic and content
   */
  private async findRelatedBills(bill: any): Promise<any[]> {
    // Check if we have cached related bills
    const cacheKey = `related_bills_${bill.bill_id}`;
    const cachedRelatedBills = apiCache.get('legiscan', cacheKey, {});
    
    if (cachedRelatedBills) {
      return cachedRelatedBills;
    }
    
    try {
      // Use the bill title and description to find related bills
      const searchTerms = this.extractSearchTerms(bill.title, bill.description);
      
      if (searchTerms.length === 0) {
        return [];
      }
      
      // Search for bills containing these terms
      const relatedBills = [];
      
      for (const term of searchTerms.slice(0, 3)) { // Limit to first 3 terms
        const results = await legiscanService.searchBills(term);
        
        if (results && Object.values(results).length > 0) {
          // Filter out the original bill and add the rest
          const filtered = Object.values(results)
            .filter((result: any) => result.bill_id !== bill.bill_id)
            .slice(0, 5); // Take top 5 results
          
          relatedBills.push(...filtered);
        }
      }
      
      // Deduplicate by bill_id
      const uniqueBills = Array.from(
        new Map(relatedBills.map((b: any) => [b.bill_id, b])).values()
      );
      
      // Cache the results
      apiCache.set('legiscan', cacheKey, {}, uniqueBills.slice(0, 10));
      
      return uniqueBills.slice(0, 10); // Return top 10 unique related bills
    } catch (error: any) {
      console.error('Error finding related bills:', error);
      return [];
    }
  }
  
  /**
   * Extract relevant search terms from text
   */
  private extractSearchTerms(title: string, description: string): string[] {
    // Simple keyword extraction for now
    const combinedText = `${title} ${description}`;
    
    // Split text into words and filter out common words
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
      'of', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'this', 'that', 'these', 'those', 'it', 'its', 'bill', 'act', 'relating'
    ]);
    
    const words = combinedText.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)             // Split on whitespace
      .filter(word => 
        word.length > 3 && !commonWords.has(word)
      );
    
    // Count word frequency
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // Sort by frequency and return top terms
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5);
  }
  
  /**
   * Find news articles relevant to the bill
   */
  private async findRelevantNews(bill: any): Promise<any[]> {
    // This would typically connect to a news API
    // For now, we'll return a placeholder
    return [];
  }
  
  /**
   * Get detailed committee information for committees involved with the bill
   */
  private async getCommitteeData(bill: any): Promise<any[]> {
    // Extract committee information from the bill
    const committeeIds = new Set<number>();
    
    // Check sponsor committees
    if (bill.sponsors) {
      bill.sponsors.forEach((sponsor: any) => {
        if (sponsor.committee_id) {
          committeeIds.add(sponsor.committee_id);
        }
      });
    }
    
    // TODO: Implement actual committee data fetching
    // This would typically connect to the database or another API
    
    return Array.from(committeeIds).map(id => ({ committee_id: id }));
  }
  
  /**
   * Get enhanced legislator data
   */
  async getEnhancedLegislator(personId: number): Promise<any> {
    try {
      // Get the legislator from LegiScan
      const legislator = await legiscanService.getPerson(personId);
      
      if (!legislator) {
        throw new Error('Legislator not found');
      }
      
      // Enhance with additional data
      const enhancedLegislator = {
        ...legislator,
        sponsoredBills: await this.getLegislatorBills(personId),
        // Add other data sources here
      };
      
      return enhancedLegislator;
    } catch (error: any) {
      console.error('Error getting enhanced legislator data:', error);
      throw error;
    }
  }
  
  /**
   * Get bills sponsored by a legislator
   */
  private async getLegislatorBills(personId: number): Promise<any[]> {
    // This would connect to the database or another API 
    // to get bills sponsored by the legislator
    // For now, we'll return a placeholder
    return [];
  }
}

// Export a singleton instance
export const apiIntegrator = new ApiIntegratorService();