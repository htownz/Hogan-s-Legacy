// @ts-nocheck
/**
 * Texas Capitol Website Tracker Service
 * 
 * This service monitors the Texas Legislature's official website (https://capitol.texas.gov/)
 * for live updates on:
 * - Bill status changes
 * - Committee meetings
 * - Floor actions
 * - Calendars
 * - Notices
 * - Amendments and fiscal notes
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import nodeCron from 'node-cron';
import { db } from '../db';
import { eq, desc, and, gt } from 'drizzle-orm';
import {
  capitolUpdates,
  bills,
  committeeSchedules,
  capitolNotices,
} from '@shared/schema';

import {
  insertCapitolUpdateSchema,
  insertCapitolNoticeSchema,
  insertCommitteeScheduleSchema
} from '@shared/schema-capitol';

// Cache of the last check time for different sections
interface LastCheckTimes {
  mainPage: Date;
  billActions: Date;
  committeeSchedule: Date;
  notices: Date;
  amendments: Date;
}

const lastCheckTimes: LastCheckTimes = {
  mainPage: new Date(0),
  billActions: new Date(0),
  committeeSchedule: new Date(0),
  notices: new Date(0),
  amendments: new Date(0)
};

// Content hash cache to avoid duplicate updates
type ContentCache = Record<string, string>;
const contentHashCache: ContentCache = {};

/**
 * Check the main page for important updates
 */
async function checkMainPage(): Promise<void> {
  try {
    console.log('Checking Texas Capitol main page for updates...');
    const response = await axios.get('https://capitol.texas.gov/');
    const $ = cheerio.load(response.data);
    
    // Extract news and updates from the main page
    const updates: any[] = [];
    
    // Look for "What's New" section
    $('.whatsNew, .newsItem').each((i: number, el: any) => {
      const title = $(el).find('h3, h4, .title').text().trim();
      const content = $(el).text().trim();
      const date = extractDateFromText(content) || new Date();
      const links = $(el).find('a').map((i: number, link: any) => $(link).attr('href')).get();
      
      // Only include updates from after our last check
      if (date > lastCheckTimes.mainPage) {
        updates.push({
          title,
          content,
          date,
          links,
          source: 'main_page'
        });
      }
    });
    
    // Process and store updates
    for (const update of updates) {
      await storeCapitolUpdate(update);
    }
    
    lastCheckTimes.mainPage = new Date();
  } catch (error: any) {
    console.error('Error checking Texas Capitol main page:', error);
  }
}

/**
 * Check for bill status updates
 */
async function checkBillActions(): Promise<void> {
  try {
    console.log('Checking for Texas Capitol bill actions...');
    
    // Get list of bills we're tracking
    const trackedBills = await db.query.bills.findMany({
      orderBy: [desc(bills.updatedAt)],
      limit: 50 // Limit to 50 most recently updated bills
    });
    
    for (const bill of trackedBills) {
      const billUrl = `https://capitol.texas.gov/BillLookup/History.aspx?LegSess=87R&Bill=${bill.id.replace('TX-', '')}`;
      const response = await axios.get(billUrl);
      const $ = cheerio.load(response.data);
      
      // Extract actions table
      const actions: any[] = [];
      $('.historyTable tr').each((i: number, row: any) => {
        if (i === 0) return; // Skip header
        
        const columns = $(row).find('td');
        if (columns.length >= 3) {
          const date = $(columns[0]).text().trim();
          const chamber = $(columns[1]).text().trim();
          const action = $(columns[2]).text().trim();
          
          if (date && action) {
            const actionDate = parseTexasDate(date);
            
            // Only include actions from after our last check
            if (actionDate && actionDate > lastCheckTimes.billActions) {
              actions.push({
                title: `${bill.id}: ${action}`,
                content: `${chamber}: ${action}`,
                date: actionDate,
                links: [billUrl],
                source: 'bill_action',
                billId: bill.id
              });
            }
          }
        }
      });
      
      // Process and store updates
      for (const action of actions) {
        await storeCapitolUpdate(action);
      }
      
      // Pause between requests to avoid overloading the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    lastCheckTimes.billActions = new Date();
  } catch (error: any) {
    console.error('Error checking Texas Capitol bill actions:', error);
  }
}

/**
 * Check for committee meeting updates
 */
async function checkCommitteeSchedule(): Promise<void> {
  try {
    console.log('Checking for Texas Capitol committee schedule updates...');
    
    // Check both House and Senate committee schedules
    const chamberUrls = [
      'https://capitol.texas.gov/Committees/MeetingsHouse.aspx',
      'https://capitol.texas.gov/Committees/MeetingsSenate.aspx'
    ];
    
    for (const url of chamberUrls) {
      const chamber = url.includes('House') ? 'House' : 'Senate';
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      // Extract committee meetings
      const meetings: any[] = [];
      $('.meetingTable tr').each((i, row) => {
        if (i === 0) return; // Skip header
        
        const columns = $(row).find('td');
        if (columns.length >= 4) {
          const committee = $(columns[0]).text().trim();
          const time = $(columns[1]).text().trim();
          const date = $(columns[2]).text().trim();
          const location = $(columns[3]).text().trim();
          
          if (committee && date) {
            const meetingDate = parseTexasDate(date);
            
            // Only include meetings from after our last check
            if (meetingDate && meetingDate > lastCheckTimes.committeeSchedule) {
              // Try to find agenda link
              const agendaLink = $(row).find('a[href*="PDF"]').attr('href') || '';
              
              meetings.push({
                title: `${chamber} Committee Meeting: ${committee}`,
                content: `${committee} meeting on ${date} at ${time} in ${location}`,
                date: meetingDate,
                links: [url, agendaLink].filter(Boolean),
                source: 'committee_schedule',
                chamber,
                committee,
                location,
                time
              });
            }
          }
        }
      });
      
      // Process and store updates
      for (const meeting of meetings) {
        await storeCapitolUpdate(meeting);
        await storeCommitteeMeeting(meeting);
      }
    }
    
    lastCheckTimes.committeeSchedule = new Date();
  } catch (error: any) {
    console.error('Error checking Texas Capitol committee schedule:', error);
  }
}

/**
 * Check for notices and bulletins
 */
async function checkNotices(): Promise<void> {
  try {
    console.log('Checking for Texas Capitol notices...');
    
    const response = await axios.get('https://capitol.texas.gov/MnuNotices.aspx');
    const $ = cheerio.load(response.data);
    
    // Extract notices
    const notices: any[] = [];
    $('.noticeContent, .bulletinContent').each((i, el) => {
      const title = $(el).find('h3, h4, .title').text().trim() || 'Capitol Notice';
      const content = $(el).text().trim();
      const date = extractDateFromText(content) || new Date();
      const links = $(el).find('a').map((i, link) => $(link).attr('href')).get();
      
      // Only include notices from after our last check
      if (date > lastCheckTimes.notices) {
        notices.push({
          title,
          content,
          date,
          links,
          source: 'notices'
        });
      }
    });
    
    // Process and store updates
    for (const notice of notices) {
      await storeCapitolUpdate(notice);
      await storeCapitolNotice(notice);
    }
    
    lastCheckTimes.notices = new Date();
  } catch (error: any) {
    console.error('Error checking Texas Capitol notices:', error);
  }
}

/**
 * Check for amendments and fiscal notes
 */
async function checkAmendments(): Promise<void> {
  try {
    console.log('Checking for Texas Capitol amendments and fiscal notes...');
    
    // Get list of bills we're tracking
    const trackedBills = await db.query.bills.findMany({
      orderBy: [desc(bills.updatedAt)],
      limit: 20 // Limit to 20 most recently updated bills
    });
    
    for (const bill of trackedBills) {
      const billUrl = `https://capitol.texas.gov/BillLookup/Text.aspx?LegSess=87R&Bill=${bill.id.replace('TX-', '')}`;
      const response = await axios.get(billUrl);
      const $ = cheerio.load(response.data);
      
      // Extract amendments and fiscal notes
      const documents: any[] = [];
      $('.billversion a, a[href*="PDF"]').each((i, link) => {
        const href = $(link).attr('href');
        const text = $(link).text().trim();
        
        if (href && (text.includes('Amendment') || text.includes('Fiscal Note'))) {
          const docType = text.includes('Amendment') ? 'amendment' : 'fiscal_note';
          const contentHash = `${bill.id}-${href}`;
          
          // Only include new documents
          if (!contentHashCache[contentHash]) {
            contentHashCache[contentHash] = href;
            
            documents.push({
              title: `${bill.id}: New ${docType.replace('_', ' ')} available`,
              content: `A new ${docType.replace('_', ' ')} is available for ${bill.id}: ${text}`,
              date: new Date(),
              links: [href],
              source: docType,
              billId: bill.id
            });
          }
        }
      });
      
      // Process and store updates
      for (const document of documents) {
        await storeCapitolUpdate(document);
      }
      
      // Pause between requests to avoid overloading the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    lastCheckTimes.amendments = new Date();
  } catch (error: any) {
    console.error('Error checking Texas Capitol amendments and fiscal notes:', error);
  }
}

/**
 * Run a full scan of the Texas Capitol website
 */
export async function scanTexasCapitolWebsite(): Promise<void> {
  try {
    console.log('Starting full scan of Texas Capitol website...');
    
    await checkMainPage();
    await checkBillActions();
    await checkCommitteeSchedule();
    await checkNotices();
    await checkAmendments();
    
    console.log('Completed scan of Texas Capitol website');
  } catch (error: any) {
    console.error('Error in Texas Capitol website scan:', error);
  }
}

/**
 * Store a Capitol update in the database
 */
async function storeCapitolUpdate(update: any): Promise<void> {
  try {
    // Create a content hash to avoid duplicates
    const contentHash = createContentHash(update.title, update.content);
    
    // Check if we already have this update
    const existingUpdate = await db.query.capitolUpdates.findFirst({
      where: eq(capitolUpdates.contentHash, contentHash)
    });
    
    if (existingUpdate) {
      return; // Skip duplicates
    }
    
    // Prepare update data
    const updateData = {
      title: update.title,
      content: update.content,
      source: update.source,
      publishDate: update.date,
      links: Array.isArray(update.links) ? update.links : [],
      billId: update.billId || null,
      chamber: update.chamber || null,
      committee: update.committee || null,
      contentHash
    };
    
    // Validate with schema
    const validatedData = insertCapitolUpdateSchema.parse(updateData);
    
    // Store in database
    await db.insert(capitolUpdates).values(validatedData);
    
    console.log(`Stored new Capitol update: ${update.title}`);
  } catch (error: any) {
    console.error('Error storing Capitol update:', error);
  }
}

/**
 * Store a committee meeting in the database
 */
async function storeCommitteeMeeting(meeting: any): Promise<void> {
  try {
    // Extract date and time information
    const meetingDate = meeting.date;
    
    // Check if we already have this meeting
    const existingMeeting = await db.query.committeeSchedules.findFirst({
      where: and(
        eq(committeeSchedules.committee, meeting.committee),
        eq(committeeSchedules.chamber, meeting.chamber),
        eq(committeeSchedules.scheduledDate, meetingDate)
      )
    });
    
    if (existingMeeting) {
      return; // Skip duplicates
    }
    
    // Prepare meeting data
    const meetingData = {
      committee: meeting.committee,
      chamber: meeting.chamber,
      scheduledDate: meetingDate,
      location: meeting.location,
      scheduledTime: meeting.time,
      agendaUrl: Array.isArray(meeting.links) && meeting.links.length > 1 ? meeting.links[1] : null,
      videoUrl: null, // To be populated later if available
      status: 'scheduled'
    };
    
    // Validate with schema
    const validatedData = insertCommitteeScheduleSchema.parse(meetingData);
    
    // Store in database
    await db.insert(committeeSchedules).values(validatedData);
    
    console.log(`Stored new committee meeting: ${meeting.chamber} ${meeting.committee}`);
  } catch (error: any) {
    console.error('Error storing committee meeting:', error);
  }
}

/**
 * Store a Capitol notice in the database
 */
async function storeCapitolNotice(notice: any): Promise<void> {
  try {
    // Create a content hash to avoid duplicates
    const contentHash = createContentHash(notice.title, notice.content);
    
    // Check if we already have this notice
    const existingNotice = await db.query.capitolNotices.findFirst({
      where: eq(capitolNotices.contentHash, contentHash)
    });
    
    if (existingNotice) {
      return; // Skip duplicates
    }
    
    // Prepare notice data
    const noticeData = {
      title: notice.title,
      content: notice.content,
      publishDate: notice.date,
      links: Array.isArray(notice.links) ? notice.links : [],
      contentHash,
      category: detectNoticeCategory(notice.title, notice.content)
    };
    
    // Validate with schema
    const validatedData = insertCapitolNoticeSchema.parse(noticeData);
    
    // Store in database
    await db.insert(capitolNotices).values(validatedData);
    
    console.log(`Stored new Capitol notice: ${notice.title}`);
  } catch (error: any) {
    console.error('Error storing Capitol notice:', error);
  }
}

/**
 * Create a hash from content to avoid duplicates
 */
function createContentHash(title: string, content: string): string {
  return `${title.slice(0, 50)}:${content.slice(0, 100)}`.replace(/\\s+/g, ' ').trim();
}

/**
 * Extract a date from text content
 */
function extractDateFromText(text: string): Date | null {
  // Look for common date patterns
  const datePatterns = [
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/g,
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/g,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g
  ];
  
  for (const pattern of datePatterns) {
    const match = pattern.exec(text);
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
 * Parse Texas format date (MM/DD/YYYY)
 */
function parseTexasDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Handle various Texas date formats
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\w+)\s+(\d{1,2}),\s+(\d{4})/, // Month DD, YYYY
    /(\d{1,2})\s+(\w+)\s+(\d{4})/ // DD Month YYYY
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      try {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch (e: any) {
        // Continue to next pattern
      }
    }
  }
  
  return null;
}

/**
 * Detect the category of a notice based on content
 */
function detectNoticeCategory(title: string, content: string): string {
  const combinedText = `${title} ${content}`.toLowerCase();
  
  if (/calendar|schedule|agenda/i.test(combinedText)) {
    return 'calendar';
  } else if (/hearing|testimony|witness/i.test(combinedText)) {
    return 'hearing';
  } else if (/amendment|amend/i.test(combinedText)) {
    return 'amendment';
  } else if (/fiscal note|impact|budget/i.test(combinedText)) {
    return 'fiscal';
  } else if (/vote|voting|roll call/i.test(combinedText)) {
    return 'vote';
  } else if (/emergency|urgent|immediate/i.test(combinedText)) {
    return 'emergency';
  } else {
    return 'general';
  }
}

/**
 * Initialize scheduled scans of Texas Capitol website
 */
export function initTexasCapitolTracker(): void {
  console.log('Setting up scheduled Texas Capitol website scans...');
  
  // Initial scan
  setTimeout(() => {
    scanTexasCapitolWebsite().catch(error => {
      console.error("Error in initial Texas Capitol scan:", error);
    });
  }, 15000); // Delay initial scan to allow server to fully start
  
  // Schedule regular scans (every 30 minutes)
  nodeCron.schedule('*/30 * * * *', async () => {
    console.log('Running scheduled scan of Texas Capitol website...');
    try {
      await scanTexasCapitolWebsite();
      console.log('Completed scheduled scan of Texas Capitol website');
    } catch (error: any) {
      console.error('Error in scheduled Texas Capitol scan:', error);
    }
  });
  
  console.log('Texas Capitol tracker initialized');
}

export default {
  scanTexasCapitolWebsite,
  initTexasCapitolTracker
};