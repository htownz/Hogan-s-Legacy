import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { bills, userBillTracking } from '@shared/schema';
import { billHistory } from '@shared/schema-additions';
import { eq, and, desc, lt, gte } from 'drizzle-orm';
import { createLogger } from "../logger";
const log = createLogger("bill-utils");


// Base URL for Texas Legislature Online
const TLO_BASE_URL = 'https://capitol.texas.gov';
const CURRENT_SESSION = '89R'; // 89th Regular Session

export interface TXLegislatureBill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  introducedAt: Date;
  lastActionAt: Date;
  lastAction: string;
  sponsors: string[];
  cosponsors: string[];
  topics: string[];
  fullTextUrl: string | null;
  committee: string;
  authors: string;
}

/**
 * Scrape bills from Texas Legislature Online
 * @param startBill Starting bill number (default: 1)
 * @param endBill Ending bill number (default: 50)
 * @param chamber Chamber ('HB' for House or 'SB' for Senate)
 * @returns Array of scraped bills
 */
export async function scrapeTXLegislatureBills(
  startBill: number = 1,
  endBill: number = 50,
  chamber: 'HB' | 'SB' = 'HB'
): Promise<TXLegislatureBill[]> {
  const bills: TXLegislatureBill[] = [];
  
  log.info(`Starting to scrape ${chamber} bills ${startBill}-${endBill} from Texas Legislature Online`);
  
  for (let billNum = startBill; billNum <= endBill; billNum++) {
    try {
      const billId = `TX-${chamber}${billNum.toString().padStart(4, '0')}`;
      log.info(`Fetching data for bill: ${billId}`);
      
      // Build the URL
      const url = `${TLO_BASE_URL}/BillLookup/History.aspx?LegSess=${CURRENT_SESSION}&Bill=${chamber}${billNum}`;
      
      // Fetch the bill page
      const response = await axios.get(url);
      
      if (response.status !== 200) {
        log.error(`Failed to fetch bill ${billId}, status: ${response.status}`);
        continue;
      }
      
      const $ = cheerio.load(response.data);
      
      // Basic info
      const title = $('div.billTitleCaption h2').text().trim() || `${chamber} ${billNum}`;
      const description = $('div.billTitleCaption p.caption').text().trim() || '';
      
      // Author info
      const authors: string[] = [];
      $('div.authors ul li').each((_, elem) => {
        const author = $(elem).text().trim();
        if (author) authors.push(author);
      });
      
      // Sponsor info
      const sponsors: string[] = [];
      $('div.sponsors ul li').each((_, elem) => {
        const sponsor = $(elem).text().trim();
        if (sponsor) sponsors.push(sponsor);
      });
      
      // Committee info
      const committee = $('div.stagesTable .label:contains("Committee:")').next().text().trim();
      
      // Last action info
      const lastActionDateText = $('div.stagesTable .label:contains("Last Action:")').nextAll('.date').text().trim();
      const lastActionText = $('div.stagesTable .label:contains("Last Action:")').next().text().trim();
      
      // Parse dates
      const introducedDate = new Date();
      let lastActionDate = new Date();
      
      if (lastActionDateText) {
        const dateParts = lastActionDateText.split('/');
        if (dateParts.length === 3) {
          lastActionDate = new Date(
            parseInt(dateParts[2]), // year
            parseInt(dateParts[0]) - 1, // month (0-based)
            parseInt(dateParts[1]) // day
          );
        }
      }
      
      // Determine status
      let status = 'introduced';
      if (lastActionText.toLowerCase().includes('committee')) {
        status = 'in_committee';
      } else if (lastActionText.toLowerCase().includes('passed') && lastActionText.toLowerCase().includes('house')) {
        status = 'passed_house';
      } else if (lastActionText.toLowerCase().includes('passed') && lastActionText.toLowerCase().includes('senate')) {
        status = 'passed_senate';
      } else if (lastActionText.toLowerCase().includes('sent to governor')) {
        status = 'sent_to_governor';
      } else if (lastActionText.toLowerCase().includes('signed')) {
        status = 'signed';
      } else if (lastActionText.toLowerCase().includes('vetoed')) {
        status = 'vetoed';
      }
      
      // Extract bill history
      const historyEvents: { date: Date; chamber: string; description: string }[] = [];
      $('table.historyTable tr:not(:first-child)').each((_, row) => {
        const cols = $(row).find('td');
        
        if (cols.length >= 3) {
          const dateText = $(cols[0]).text().trim();
          const chamberText = $(cols[1]).text().trim();
          const descriptionText = $(cols[2]).text().trim();
          
          if (dateText && chamberText && descriptionText) {
            // Parse the date (format: MM/DD/YYYY)
            const dateParts = dateText.split('/');
            if (dateParts.length === 3) {
              const date = new Date(
                parseInt(dateParts[2]), // year
                parseInt(dateParts[0]) - 1, // month (0-based)
                parseInt(dateParts[1]) // day
              );
              
              historyEvents.push({
                date,
                chamber: chamberText,
                description: descriptionText
              });
            }
          }
        }
      });
      
      // Extract topics (this is a placeholder, actual implementation would be more complicated)
      const topics = ['Legislation'];
      if (description.toLowerCase().includes('education')) topics.push('Education');
      if (description.toLowerCase().includes('health')) topics.push('Healthcare');
      if (description.toLowerCase().includes('tax')) topics.push('Taxation');
      if (description.toLowerCase().includes('budget')) topics.push('Budget');
      if (description.toLowerCase().includes('environment')) topics.push('Environment');
      
      // Full text URL
      const fullTextUrl = $('a:contains("Text")').attr('href');
      
      // Create bill object
      const bill: TXLegislatureBill = {
        id: billId,
        title,
        description,
        status,
        chamber: chamber === 'HB' ? 'house' : 'senate',
        introducedAt: introducedDate,
        lastActionAt: lastActionDate,
        lastAction: lastActionText,
        sponsors: sponsors,
        cosponsors: [],
        topics,
        fullTextUrl: fullTextUrl ? `${TLO_BASE_URL}${fullTextUrl}` : null,
        committee,
        authors: authors.join(', '),
      };
      
      // Add to results array
      bills.push(bill);
      
      // Save history events to database if bill exists
      await storeBillHistory(billId, historyEvents);
      
      // Small delay to prevent overwhelming the target site
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      log.error({ err: error }, `Error scraping bill ${chamber}${billNum}`);
    }
  }
  
  log.info(`Successfully scraped ${bills.length} ${chamber} bills`);
  return bills;
}

/**
 * Store bill history events in the database
 */
export async function storeBillHistory(
  billId: string,
  historyEvents: { date: Date; chamber: string; description: string }[]
): Promise<void> {
  if (historyEvents.length === 0) {
    log.info(`No history events to store for bill ${billId}`);
    return;
  }
  
  try {
    // Check if bill exists
    const existingBill = await db.select({ id: bills.id }).from(bills).$dynamic().where(eq(bills.id, billId));
    
    if (existingBill.length === 0) {
      log.info(`Bill ${billId} not found in database, skipping history storage`);
      return;
    }
    
    // Get existing history for this bill
    const existingHistory = await db.select({
      date: billHistory.date,
      chamber: billHistory.chamber,
      description: billHistory.description,
    })
    .from(billHistory).$dynamic()
    .where(eq(billHistory.billId, billId));
    
    // Create a set of existing events for quick comparison
    const existingEventSet = new Set(
      existingHistory.map(event => 
        `${event.date.toISOString()}-${event.chamber}-${event.description}`
      )
    );
    
    // Prepare new events that don't already exist
    const newEvents = historyEvents.filter(event => {
      const eventKey = `${event.date.toISOString()}-${event.chamber}-${event.description}`;
      return !existingEventSet.has(eventKey);
    });
    
    if (newEvents.length === 0) {
      log.info(`No new history events for bill ${billId}`);
      return;
    }
    
    // Insert new events
    await db.insert(billHistory).values(
      newEvents.map(event => ({
        billId,
        date: event.date,
        chamber: event.chamber,
        description: event.description,
        createdAt: new Date(),
      }))
    );
    
    log.info(`Stored ${newEvents.length} history events for bill ${billId}`);
  } catch (error: any) {
    log.error({ err: error }, `Error storing history for bill ${billId}`);
  }
}

/**
 * Get bills being tracked by a user
 */
export async function getTrackedBills(userId: number) {
  return db.select({
    id: bills.id,
    title: bills.title,
    description: bills.description,
    status: bills.status,
    chamber: bills.chamber,
    lastActionAt: bills.lastActionAt,
    lastAction: bills.lastAction,
    introducedAt: bills.introducedAt,
    topics: bills.topics,
    sentimentScore: bills.sentimentScore,
    communitySupportPct: bills.communitySupportPct,
  })
  .from(bills)
  .innerJoin(
    userBillTracking,
    and(
      eq(userBillTracking.billId, bills.id),
      eq(userBillTracking.userId, userId)
    )
  )
  .orderBy(desc(bills.lastActionAt));
}

/**
 * Get the history events for a bill
 */
export async function getBillHistory(billId: string) {
  return db.select()
    .from(billHistory).$dynamic()
    .where(eq(billHistory.billId, billId))
    .orderBy(desc(billHistory.date));
}