// @ts-nocheck
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { committeeMeetings, committees, liveStreamSegments, liveStreamQuotes } from '@shared/schema';
import { committeeMeetingTaggedSegments } from '@shared/schema-committee-videos';
import { eq, desc, and, sql, or, like, isNull } from 'drizzle-orm';
import { createLogger } from "../logger";
const log = createLogger("historical-committee-video-scraper");


// Initialize OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sources for historical committee videos
const HISTORICAL_VIDEO_SOURCES = {
  // House committee broadcasts for 89th legislative session
  house89Regular: "https://house.texas.gov/videos/committees/89/R",
  house89Special: "https://house.texas.gov/videos/committees/89/S1",
  
  // Senate committee archives for 89th legislative session
  senate89Regular: "https://senate.texas.gov/committees.php",
};

// Interface for committee data
interface CommitteeInfo {
  name: string;
  chamber: 'house' | 'senate';
  id?: number; // Database ID (if known)
}

// Interface for historical meeting data
interface HistoricalMeeting {
  committee: CommitteeInfo;
  date: Date;
  title: string;
  description?: string;
  videoUrl: string;
  transcriptUrl?: string;
  location?: string;
  billsDiscussed?: string[];
  sessionType: 'regular' | 'special';
  legislativeSession: string; // e.g., "89R" for 89th Regular Session
}

/**
 * Initialize historical committee video scraper
 */
export async function initHistoricalCommitteeVideoScraper(): Promise<void> {
  log.info("Initializing historical committee video scraper...");
  
  // Ensure database is properly set up
  await ensureCommitteesExist();
  
  log.info("Historical committee video scraper initialized");
}

/**
 * Ensure all Texas committees exist in database
 */
async function ensureCommitteesExist(): Promise<void> {
  // Fetch all existing committees
  const existingCommittees = await db.query.committees.findMany();
  
  // House committees that should exist (partial list - would be expanded)
  const houseCommittees = [
    "Agriculture & Livestock",
    "Appropriations",
    "Business & Industry",
    "Calendars",
    "Corrections",
    "County Affairs",
    "Criminal Jurisprudence",
    "Culture, Recreation & Tourism",
    "Defense & Veterans' Affairs",
    "Elections",
    "Energy Resources",
    "Environmental Regulation",
    "General Investigating",
    "Higher Education",
    "Homeland Security & Public Safety",
    "House Administration",
    "Human Services",
    "Insurance",
    "International Relations & Economic Development",
    "Judiciary & Civil Jurisprudence",
    "Juvenile Justice & Family Issues",
    "Land & Resource Management",
    "Licensing & Administrative Procedures",
    "Local & Consent Calendars",
    "Natural Resources",
    "Pensions, Investments & Financial Services",
    "Public Education",
    "Public Health",
    "Redistricting",
    "Resolutions Calendars",
    "State Affairs",
    "Transportation",
    "Urban Affairs",
    "Ways & Means"
  ];
  
  // Senate committees that should exist (partial list - would be expanded)
  const senateCommittees = [
    "Administration",
    "Border Security",
    "Business & Commerce",
    "Criminal Justice",
    "Education",
    "Finance",
    "Health & Human Services",
    "Higher Education",
    "Jurisprudence",
    "Local Government",
    "Natural Resources & Economic Development",
    "Nominations",
    "State Affairs",
    "Transportation",
    "Water & Rural Affairs",
  ];
  
  // Create any missing committees
  for (const name of houseCommittees) {
    if (!existingCommittees.some(c => c.name.toLowerCase() === name.toLowerCase() && c.chamber === 'house')) {
      await db.insert(committees).values({
        name,
        chamber: 'house',
        description: `Texas House ${name} Committee`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      log.info(`Created House committee: ${name}`);
    }
  }
  
  for (const name of senateCommittees) {
    if (!existingCommittees.some(c => c.name.toLowerCase() === name.toLowerCase() && c.chamber === 'senate')) {
      await db.insert(committees).values({
        name,
        chamber: 'senate',
        description: `Texas Senate ${name} Committee`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      log.info(`Created Senate committee: ${name}`);
    }
  }
}

/**
 * Scrape historical committee videos from the Texas House for the 89th regular session
 */
export async function scrapeHouse89RegularSessionVideos(): Promise<void> {
  try {
    log.info("Scraping Texas House 89th Regular Session committee videos...");
    
    // Fetch the committee broadcasts page
    const response = await axios.get(HISTORICAL_VIDEO_SOURCES.house89Regular);
    const $ = cheerio.load(response.data);
    
    // Extract committee broadcasts using Vue component structure
    // The broadcasts are rendered by a Vue.js component: <committees-broadcasts>
    // We'll need to find the data being passed to this component
    
    // For the House website, the data is likely in a JavaScript variable on the page
    // or passed as props to the Vue component
    const vueComponent = $('committees-broadcasts');
    
    // Since we're dealing with a dynamic Vue component, we might need to use a headless browser approach
    // However, for now, we'll implement a parser for the static HTML structure that's rendered
    
    // Find committee sections (this will depend on the actual rendered HTML structure)
    const committeeSections = $('.committee-section').toArray();
    for (const section of committeeSections) {
      const committeeName = $(section).find('.committee-name').text().trim();
      
      // Find all meeting links for this committee
      const meetingLinks = $(section).find('.meeting-link').toArray();
      for (const link of meetingLinks) {
        const meetingTitle = $(link).text().trim();
        const videoUrl = $(link).attr('href') || '';
        
        // Parse date from the meeting title or nearby elements
        const dateText = $(link).closest('.meeting-item').find('.meeting-date').text().trim();
        const meetingDate = parseDate(dateText);
        
        // Skip if we couldn't parse a valid date or don't have a video URL
        if (!meetingDate || !videoUrl) continue;
        
        // Get committee ID from database
        const committee = await findOrCreateCommittee({
          name: committeeName,
          chamber: 'house'
        });
        
        // Prepare historical meeting data
        const meeting: HistoricalMeeting = {
          committee,
          date: meetingDate,
          title: meetingTitle,
          videoUrl,
          sessionType: 'regular',
          legislativeSession: '89R',
          location: 'Texas State Capitol',
        };
        
        // Store the meeting in database
        await saveHistoricalMeeting(meeting);
      }
    }
    
    log.info("Completed scraping Texas House 89th Regular Session committee videos");
  } catch (error: any) {
    log.error({ err: error }, "Error scraping House 89th Regular Session videos");
  }
}

/**
 * Scrape historical committee videos from the Texas Senate for the 89th regular session
 */
export async function scrapeSenate89RegularSessionVideos(): Promise<void> {
  try {
    log.info("Scraping Texas Senate 89th Regular Session committee videos...");
    
    // Fetch the committee page
    const response = await axios.get(HISTORICAL_VIDEO_SOURCES.senate89Regular);
    const $ = cheerio.load(response.data);
    
    // Extract committee links
    const committeeLinks: { name: string, url: string }[] = [];
    
    // Find committee links (this will depend on the actual HTML structure)
    const links = $('.committee-link').toArray();
    for (const link of links) {
      const name = $(link).text().trim();
      const url = $(link).attr('href') || '';
      
      if (name && url) {
        committeeLinks.push({ name, url });
      }
    }
    
    // Process each committee page to find meeting videos
    for (const committee of committeeLinks) {
      await scrapeSenateCommitteePage(committee.name, committee.url);
    }
    
    log.info("Completed scraping Texas Senate 89th Regular Session committee videos");
  } catch (error: any) {
    log.error({ err: error }, "Error scraping Senate 89th Regular Session videos");
  }
}

/**
 * Scrape a specific Senate committee page for meeting videos
 */
async function scrapeSenateCommitteePage(committeeName: string, committeeUrl: string): Promise<void> {
  try {
    // Fetch the committee page
    const response = await axios.get(committeeUrl);
    const $ = cheerio.load(response.data);
    
    // Get committee ID from database
    const committee = await findOrCreateCommittee({
      name: committeeName,
      chamber: 'senate'
    });
    
    // Find meeting video links (this will depend on the actual HTML structure)
    const videoLinks = $('.video-archive-link').toArray();
    for (const link of videoLinks) {
      const meetingTitle = $(link).text().trim();
      const videoUrl = $(link).attr('href') || '';
      
      // Parse date from the meeting title or nearby elements
      const dateText = $(link).closest('.meeting-item').find('.meeting-date').text().trim();
      const meetingDate = parseDate(dateText);
      
      // Skip if we couldn't parse a valid date or don't have a video URL
      if (!meetingDate || !videoUrl) continue;
      
      // Prepare historical meeting data
      const meeting: HistoricalMeeting = {
        committee,
        date: meetingDate,
        title: meetingTitle,
        videoUrl,
        sessionType: 'regular',
        legislativeSession: '89R',
        location: 'Texas State Capitol',
      };
      
      // Store the meeting in database
      await saveHistoricalMeeting(meeting);
    }
  } catch (error: any) {
    log.error({ err: error }, `Error scraping Senate committee page for ${committeeName}`);
  }
}

/**
 * Find or create a committee in the database
 */
async function findOrCreateCommittee(committeeInfo: CommitteeInfo): Promise<CommitteeInfo> {
  // Try to find the committee by name
  const existingCommittee = await db.query.committees.findFirst({
    where: and(
      like(committees.name, `%${committeeInfo.name}%`),
      eq(committees.chamber, committeeInfo.chamber)
    )
  });
  
  if (existingCommittee) {
    return {
      ...committeeInfo,
      id: existingCommittee.id
    };
  }
  
  // Create a new committee if it doesn't exist
  const [newCommittee] = await db.insert(committees)
    .values({
      name: committeeInfo.name,
      chamber: committeeInfo.chamber,
      description: `Texas ${committeeInfo.chamber === 'house' ? 'House' : 'Senate'} ${committeeInfo.name} Committee`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: committees.id });
  
  return {
    ...committeeInfo,
    id: newCommittee.id
  };
}

/**
 * Save a historical meeting to the database
 */
async function saveHistoricalMeeting(meeting: HistoricalMeeting): Promise<void> {
  try {
    // Check if the meeting already exists (by committee, date, and video URL)
    const existingMeeting = await db.query.committeeMeetings.findFirst({
      where: and(
        eq(committeeMeetings.committeeId, meeting.committee.id!),
        eq(committeeMeetings.date, meeting.date),
        eq(committeeMeetings.videoUrl, meeting.videoUrl)
      )
    });
    
    if (existingMeeting) {
      log.info(`Meeting already exists: ${meeting.committee.name} - ${meeting.date.toISOString()}`);
      return;
    }
    
    // Insert the new meeting
    await db.insert(committeeMeetings)
      .values({
        committeeId: meeting.committee.id!,
        date: meeting.date,
        location: meeting.location || 'Texas State Capitol',
        agenda: meeting.description || meeting.title,
        billsDiscussed: meeting.billsDiscussed || [],
        status: 'completed', // Historical meetings are already completed
        videoUrl: meeting.videoUrl,
        transcriptUrl: meeting.transcriptUrl,
        processingStatus: 'pending', // Set to pending for AI processing
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    
    log.info(`Saved historical meeting: ${meeting.committee.name} - ${meeting.date.toISOString()}`);
  } catch (error: any) {
    log.error({ err: error }, "Error saving historical meeting");
  }
}

/**
 * Schedule AI analysis for pending historical meetings
 */
export async function scheduleHistoricalMeetingAnalysis(limit: number = 5): Promise<void> {
  try {
    // Find meetings with pending processing status
    const pendingMeetings = await db.query.committeeMeetings.findMany({
      where: and(
        eq(committeeMeetings.processingStatus, 'pending'),
        isNull(committeeMeetings.summarySummary)
      ),
      limit,
      with: {
        committee: true
      }
    });
    
    log.info(`Found ${pendingMeetings.length} pending historical meetings for analysis`);
    
    // Update meetings to processing status
    for (const meeting of pendingMeetings) {
      await db.update(committeeMeetings)
        .set({
          processingStatus: 'processing',
          lastUpdated: new Date()
        })
        .where(eq(committeeMeetings.id, meeting.id));
      
      // TODO: Schedule the actual analysis with video transcription and OpenAI processing
      // This would call the existing committee video analyzer or enhanced analyzer
      log.info(`Scheduled analysis for meeting: ${meeting.committee.name} - ${meeting.date.toISOString()}`);
    }
  } catch (error: any) {
    log.error({ err: error }, "Error scheduling historical meeting analysis");
  }
}

/**
 * Helper function to parse a date string
 */
function parseDate(dateStr: string): Date | null {
  try {
    // Try standard date parsing first
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // If that fails, try various date formats common in Texas Legislature websites
    
    // Format: "January 15, 2025"
    const monthDayYearMatch = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/);
    if (monthDayYearMatch) {
      const [_, month, day, year] = monthDayYearMatch;
      const monthIdx = new Date(`${month} 1, 2000`).getMonth();
      return new Date(parseInt(year), monthIdx, parseInt(day));
    }
    
    // Format: "01/15/2025"
    const numericDateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (numericDateMatch) {
      const [_, month, day, year] = numericDateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    return null;
  } catch (error: any) {
    log.error({ err: error }, "Error parsing date");
    return null;
  }
}

/**
 * Export default object with all functions
 */
export default {
  initHistoricalCommitteeVideoScraper,
  scrapeHouse89RegularSessionVideos,
  scrapeSenate89RegularSessionVideos,
  scheduleHistoricalMeetingAnalysis
};