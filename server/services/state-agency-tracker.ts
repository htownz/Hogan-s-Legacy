/**
 * Texas State Agency Tracker Service
 * 
 * This service is responsible for tracking legislative-related information from Texas state agency websites.
 * It monitors agency websites for bill analyses, recommendations, and regulatory updates related to legislation.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { bills, stateAgencies, agencyBillReports } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import nodeCron from 'node-cron';
import { createHash } from 'crypto';

// List of Texas state agencies to monitor 
// (focusing on those most likely to publish bill analyses and legislative reports)
const STATE_AGENCIES = [
  {
    id: 'tdi',
    name: 'Texas Department of Insurance',
    url: 'https://www.tdi.texas.gov',
    legislativePaths: [
      '/about/commissioner/lege/',
      '/about/commissioner/legislative-reports/',
      '/news/'
    ]
  },
  {
    id: 'tceq',
    name: 'Texas Commission on Environmental Quality',
    url: 'https://www.tceq.texas.gov',
    legislativePaths: [
      '/news/',
      '/response/',
      '/rules/legislative_changes.html'
    ]
  },
  {
    id: 'hhsc',
    name: 'Texas Health and Human Services Commission',
    url: 'https://www.hhs.texas.gov',
    legislativePaths: [
      '/laws-regulations/',
      '/reports-presentations/legislative/'
    ]
  },
  {
    id: 'tea',
    name: 'Texas Education Agency',
    url: 'https://tea.texas.gov',
    legislativePaths: [
      '/about-tea/government-relations-and-legal/government-relations/',
      '/laws-and-rules/',
      '/reports-and-data/'
    ]
  },
  {
    id: 'txdot',
    name: 'Texas Department of Transportation',
    url: 'https://www.txdot.gov',
    legislativePaths: [
      '/inside-txdot/government/legislative-affairs/',
      '/inside-txdot/division/government-affairs/'
    ]
  },
  {
    id: 'rrc',
    name: 'Railroad Commission of Texas',
    url: 'https://www.rrc.texas.gov',
    legislativePaths: [
      '/news/',
      '/about-us/legislated-reports.html',
      '/legal/rules/proposed-rules/'
    ]
  },
  {
    id: 'twdb',
    name: 'Texas Water Development Board',
    url: 'https://www.twdb.texas.gov',
    legislativePaths: [
      '/legislative/',
      '/news/',
      '/waterplanning/'
    ]
  },
  {
    id: 'tpwd',
    name: 'Texas Parks and Wildlife Department',
    url: 'https://tpwd.texas.gov',
    legislativePaths: [
      '/publications/',
      '/site/commission/',
      '/newsmedia/'
    ]
  }
];

// Cache of last seen content to detect changes
type ContentCache = Record<string, string>;
const contentHashCache: ContentCache = {};

// Interface for agency reports and bill analyses
interface AgencyReport {
  agencyId: string;
  title: string;
  url: string;
  publishDate: Date;
  billIds: string[];
  summary: string;
  contentHash: string;
}

/**
 * Scan all configured state agencies for legislative updates
 */
export async function scanStateAgencyWebsites(): Promise<void> {
  console.log("Starting scan of Texas state agency websites...");
  
  // Track total new findings for logging
  let totalNewFindings = 0;
  
  for (const agency of STATE_AGENCIES) {
    console.log(`Scanning ${agency.name} website for legislative updates...`);
    
    for (const path of agency.legislativePaths) {
      try {
        const url = `${agency.url}${path}`;
        console.log(`Checking ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 30000 // 30 second timeout
        });
        
        const $ = cheerio.load(response.data);
        const contentSelector = detectContentSelector($);
        const reports = extractReportsFromPage($, agency.id, url, contentSelector);
        
        // Process each report
        for (const report of reports) {
          const isNew = await processAgencyReport(report);
          if (isNew) totalNewFindings++;
        }
        
        // Small delay to prevent overwhelming agency websites
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`Error scanning ${agency.name} at path ${path}:`, error);
      }
    }
  }
  
  console.log(`State agency scan complete. Found ${totalNewFindings} new legislative updates.`);
}

/**
 * Intelligently detect the main content selector based on page structure
 */
function detectContentSelector($: cheerio.CheerioAPI): string {
  // Common content selectors in government websites
  const potentialSelectors = [
    'main', '#content', '.content', '#main-content', '.main-content',
    'article', '.article', '#mainContent', '.mainContent', 
    '.news-item', '.news-listing', '.publications', '.reports'
  ];
  
  // Find the selector with the most content
  let bestSelector = 'body';
  let maxLength = 0;
  
  for (const selector of potentialSelectors) {
    const content = $(selector);
    if (content.length && content.text().length > maxLength) {
      maxLength = content.text().length;
      bestSelector = selector;
    }
  }
  
  return bestSelector;
}

/**
 * Extract legislative reports from an agency webpage
 */
function extractReportsFromPage(
  $: cheerio.CheerioAPI, 
  agencyId: string, 
  baseUrl: string,
  contentSelector: string
): AgencyReport[] {
  const reports: AgencyReport[] = [];
  
  // Look for content blocks that may contain reports
  $(`${contentSelector} a`).each((_, element) => {
    const linkElement = $(element);
    const linkText = linkElement.text().trim();
    const linkHref = linkElement.attr('href');
    
    // Skip empty or non-legislative links
    if (!linkText || !linkHref) return;
    
    // Check if this link is likely a legislative report
    const isLegislative = isLegislativeContent(linkText);
    if (!isLegislative) return;
    
    // Extract bill IDs mentioned in the link
    const billIds = extractBillIds(linkText);
    
    // Get surrounding paragraph or heading text as summary
    const summaryElement = linkElement.closest('p, li, div, article, section');
    const summary = summaryElement.length 
      ? summaryElement.text().trim() 
      : linkText;
    
    // Create absolute URL
    const url = linkHref.startsWith('http') 
      ? linkHref 
      : new URL(linkHref, baseUrl).toString();
    
    // Create content hash to detect changes
    const contentHash = createHash('md5')
      .update(`${linkText}${url}${summary}`)
      .digest('hex');
    
    reports.push({
      agencyId,
      title: linkText,
      url,
      publishDate: new Date(), // We'll refine this when we visit the actual page
      billIds,
      summary,
      contentHash
    });
  });
  
  return reports;
}

/**
 * Check if content is likely related to legislation
 */
function isLegislativeContent(text: string): boolean {
  const legislativeKeywords = [
    'bill', 'bills', 'legislation', 'legislative', 'statute', 'regulation',
    'house bill', 'senate bill', 'HB', 'SB', 'report', 'analysis',
    'fiscal note', 'fiscal impact', 'enrolled', 'passed', 'amendment',
    'hearing', 'testimony', 'committee', 'law', 'rule', 'rules',
    'proposed rule', 'final rule', 'public comment', 'policy', 'session'
  ];
  
  const lowerText = text.toLowerCase();
  return legislativeKeywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * Extract bill IDs from text
 */
function extractBillIds(text: string): string[] {
  const billIds: string[] = [];
  
  // Match patterns like HB 123, SB456, House Bill 789, Senate Bill 1011
  const billPatterns = [
    /\b(HB|SB)\s*(\d+)\b/gi,                   // HB 123 or SB 456
    /\b(House Bill|Senate Bill)\s*(\d+)\b/gi,  // House Bill 789 or Senate Bill 1011
  ];
  
  for (const pattern of billPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const chamber = match[1].toLowerCase().includes('house') ? 'HB' : 'SB';
      const number = match[2].padStart(4, '0');
      billIds.push(`TX-${chamber}${number}`);
    }
  }
  
  return billIds;
}

/**
 * Process and store an agency report
 * @returns true if this is a new or updated report
 */
async function processAgencyReport(report: AgencyReport): Promise<boolean> {
  // Check if we've seen this exact content before
  const cacheKey = `${report.agencyId}_${report.url}`;
  if (contentHashCache[cacheKey] === report.contentHash) {
    return false; // No changes
  }
  
  // Store new hash in cache
  contentHashCache[cacheKey] = report.contentHash;
  
  try {
    // Check if this report exists in our database
    const existingReport = await db.query.agencyBillReports.findFirst({
      where: and(
        eq(agencyBillReports.agencyId, report.agencyId),
        eq(agencyBillReports.url, report.url)
      )
    });
    
    if (existingReport) {
      // Update existing report if content hash is different
      if (existingReport.contentHash !== report.contentHash) {
        await db.update(agencyBillReports)
          .set({
            title: report.title,
            summary: report.summary,
            billIds: report.billIds,
            contentHash: report.contentHash,
            lastUpdated: new Date()
          })
          .where(eq(agencyBillReports.id, existingReport.id));
        
        console.log(`Updated agency report: ${report.title}`);
        return true;
      }
      return false;
    }
    
    // This is a new report, try to get more detailed info
    let detailedReport = await enrichReportDetails(report);
    
    // Create new report in database
    await db.insert(agencyBillReports).values({
      agencyId: detailedReport.agencyId,
      title: detailedReport.title,
      url: detailedReport.url,
      publishDate: detailedReport.publishDate,
      billIds: detailedReport.billIds,
      summary: detailedReport.summary,
      contentHash: detailedReport.contentHash,
      createdAt: new Date(),
      lastUpdated: new Date()
    });
    
    console.log(`New agency report found: ${detailedReport.title}`);
    
    // Create association with bills if bill IDs were found
    if (detailedReport.billIds.length > 0) {
      for (const billId of detailedReport.billIds) {
        const bill = await db.query.bills.findFirst({
          where: eq(bills.id, billId)
        });
        
        if (bill) {
          console.log(`Linking agency report to bill ${billId}`);
          // The association will be done through the agencyBillReports table itself
          // which already has billIds as an array field
        }
      }
    }
    
    return true;
  } catch (error: any) {
    console.error(`Error processing agency report ${report.title}:`, error);
    return false;
  }
}

/**
 * Enrich report with additional details by visiting the report page
 */
async function enrichReportDetails(report: AgencyReport): Promise<AgencyReport> {
  try {
    // Visit the report URL to extract more details
    const response = await axios.get(report.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000 // 30 second timeout
    });
    
    const $ = cheerio.load(response.data);
    
    // Try to extract a better publish date
    const publishDate = extractPublishDate($) || report.publishDate;
    
    // Look for additional bill references in the full content
    const fullText = $('body').text();
    const additionalBillIds = extractBillIds(fullText);
    
    // Combine bill IDs and remove duplicates using a different approach to avoid Set iteration issues
    const billIdsMap: {[key: string]: boolean} = {};
    report.billIds.forEach(id => billIdsMap[id] = true);
    additionalBillIds.forEach(id => billIdsMap[id] = true);
    const combinedBillIds = Object.keys(billIdsMap);
    
    // Try to extract a better summary
    const contentSelector = detectContentSelector($);
    const mainContent = $(contentSelector).text().trim();
    
    // If we have significant main content, use the first few sentences as summary
    let betterSummary = report.summary;
    if (mainContent.length > report.summary.length * 2) {
      // Extract first 500 characters or first few sentences
      const firstPartOfContent = mainContent.substring(0, 500);
      const sentences = firstPartOfContent.split(/[.!?]+/);
      if (sentences.length > 1) {
        betterSummary = sentences.slice(0, 3).join('. ') + '.';
      } else {
        betterSummary = firstPartOfContent;
      }
    }
    
    return {
      ...report,
      publishDate,
      billIds: combinedBillIds,
      summary: betterSummary
    };
  } catch (error: any) {
    console.warn(`Could not enrich report details for ${report.url}:`, error);
    return report;
  }
}

/**
 * Extract publication date from page
 */
function extractPublishDate($: cheerio.CheerioAPI): Date | null {
  // Common date selectors on government pages
  const dateSelectors = [
    'time', '.date', '.published', '.post-date', 
    '.publication-date', '[itemprop="datePublished"]',
    '.meta-date', '.entry-date', '.release-date',
    '.news-date', '.report-date'
  ];
  
  for (const selector of dateSelectors) {
    const dateElement = $(selector);
    if (dateElement.length) {
      // Try to get date from datetime attribute first
      const dateAttr = dateElement.attr('datetime');
      if (dateAttr) {
        const parsedDate = new Date(dateAttr);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // Try to parse the text content
      const dateText = dateElement.text().trim();
      if (dateText) {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
  }
  
  // Try to find date patterns in the entire page
  const pageText = $('body').text();
  const datePatterns = [
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/g,
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/g,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g
  ];
  
  for (const pattern of datePatterns) {
    const match = pattern.exec(pageText);
    if (match) {
      const dateText = match[0];
      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }
  
  return null;
}

/**
 * Initialize scheduled scans of state agency websites
 */
export function initStateAgencyTracker(): void {
  console.log('State agency website scans temporarily disabled to fix server issues');
  
  // Initial scan disabled
  // setTimeout(() => {
  //   scanStateAgencyWebsites().catch(error => {
  //     console.error("Error in initial state agency scan:", error);
  //   });
  // }, 10000); // Delay initial scan to allow server to fully start
  
  // Schedule regular scans (daily) - disabled
  // nodeCron.schedule('0 4 * * *', async () => {
  //   console.log('Running scheduled scan of state agency websites...');
  //   try {
  //     await scanStateAgencyWebsites();
  //     console.log('Completed scheduled scan of state agency websites');
  //   } catch (error: any) {
  //     console.error('Error in scheduled state agency scan:', error);
  //   }
  // });
  
  console.log('State agency tracker initialization skipped');
}

export default {
  scanStateAgencyWebsites,
  initStateAgencyTracker
};