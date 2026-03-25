// @ts-nocheck
import { OpenAI } from "openai";
import axios from "axios";
import * as cheerio from "cheerio";
import { db } from "../db";
import { committeeMeetings, committees, bills, liveStreamSegments, liveStreamQuotes } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// List of Texas Legislature live stream sources
const LIVE_STREAM_SOURCES = {
  houseMain: "https://house.texas.gov/video-audio/",
  houseChamber: "https://house.texas.gov/video-audio/chamber/",
  houseCommittees: "https://house.texas.gov/video-audio/committee-broadcasts/",
  senateMain: "https://senate.texas.gov/av-live.php",
  senateChamber: "https://senate.texas.gov/av-live.php",
  senateCommittees: "https://senate.texas.gov/av-archive.php"
};

// Types for live stream data
interface LiveStreamData {
  url: string;
  committee: string;
  title: string;
  description: string;
  isLive: boolean;
  lastUpdated: Date;
  lastProcessed?: Date;
  currentSegment?: string;
  currentBills?: string[];
  transcriptBuffer: string[];
}

// Cache of active streams
const activeStreams: Record<string, LiveStreamData> = {};

/**
 * Scrape the Texas House and Senate websites for live committee meetings
 */
export async function scanForLiveCommitteeMeetings(): Promise<void> {
  try {
    console.log("Scanning for live committee meetings...");
    
    // Scan House committee broadcasts
    const houseCommittees = await axios.get(LIVE_STREAM_SOURCES.houseCommittees);
    const houseData = cheerio.load(houseCommittees.data);
    const houseStreams = extractHouseCommitteeBroadcasts(houseData);
    
    // Scan Senate committee broadcasts
    const senateCommittees = await axios.get(LIVE_STREAM_SOURCES.senateCommittees);
    const senateData = cheerio.load(senateCommittees.data);
    const senateStreams = extractSenateCommitteeBroadcasts(senateData);
    
    // Combine and update our cache
    const allStreams = [...houseStreams, ...senateStreams];
    updateActiveStreams(allStreams);
    
    // Process streams that are currently live
    for (const [streamId, streamData] of Object.entries(activeStreams)) {
      if (streamData.isLive && (!streamData.lastProcessed || 
          Date.now() - streamData.lastProcessed.getTime() > 5 * 60 * 1000)) {
        await processLiveStream(streamId, streamData);
      }
    }
    
    console.log(`Found ${Object.keys(activeStreams).length} active streams (${Object.values(activeStreams).filter(s => s.isLive).length} live)`);
  } catch (error: any) {
    console.error("Error scanning for live committee meetings:", error);
  }
}

/**
 * Extract House committee broadcasts from the scraped page
 */
function extractHouseCommitteeBroadcasts(data: cheerio.CheerioAPI): LiveStreamData[] {
  const streams: LiveStreamData[] = [];
  
  // Implementation will depend on the actual structure of the House website
  // This is a stub that would need to be customized based on the actual HTML structure
  data('.committee-broadcast').each((_, elem) => {
    const title = data(elem).find('.broadcast-title').text().trim();
    const committee = data(elem).find('.committee-name').text().trim();
    const url = data(elem).find('.video-link').attr('href') || '';
    const description = data(elem).find('.description').text().trim();
    const isLive = data(elem).hasClass('is-live');
    
    streams.push({
      url,
      committee,
      title,
      description,
      isLive,
      lastUpdated: new Date(),
      transcriptBuffer: []
    });
  });
  
  return streams;
}

/**
 * Extract Senate committee broadcasts from the scraped page
 */
function extractSenateCommitteeBroadcasts(data: cheerio.CheerioAPI): LiveStreamData[] {
  const streams: LiveStreamData[] = [];
  
  // Implementation will depend on the actual structure of the Senate website
  // This is a stub that would need to be customized based on the actual HTML structure
  data('.meeting-broadcast').each((_, elem) => {
    const title = data(elem).find('.broadcast-title').text().trim();
    const committee = data(elem).find('.committee-name').text().trim();
    const url = data(elem).find('.video-link').attr('href') || '';
    const description = data(elem).find('.description').text().trim();
    const isLive = data(elem).hasClass('live-now');
    
    streams.push({
      url,
      committee,
      title,
      description,
      isLive,
      lastUpdated: new Date(),
      transcriptBuffer: []
    });
  });
  
  return streams;
}

/**
 * Update our cache of active streams
 */
function updateActiveStreams(newStreams: LiveStreamData[]): void {
  // Create a unique ID for each stream based on committee name and URL
  for (const stream of newStreams) {
    const streamId = createStreamId(stream.committee, stream.url);
    
    if (activeStreams[streamId]) {
      // Update existing stream data
      activeStreams[streamId] = {
        ...activeStreams[streamId],
        title: stream.title,
        description: stream.description,
        isLive: stream.isLive,
        lastUpdated: new Date()
      };
    } else {
      // Add new stream
      activeStreams[streamId] = stream;
    }
  }
  
  // Remove streams that are no longer active (haven't been updated in over 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  for (const [streamId, streamData] of Object.entries(activeStreams)) {
    if (streamData.lastUpdated < thirtyMinutesAgo) {
      delete activeStreams[streamId];
    }
  }
}

/**
 * Create a unique ID for a stream
 */
function createStreamId(committee: string, url: string): string {
  // Remove special characters and spaces, convert to lowercase
  const cleanCommittee = committee.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  // Hash or extract unique parts of the URL
  const urlHash = url.split('/').pop() || '';
  return `${cleanCommittee}_${urlHash}`;
}

/**
 * Process a live stream to extract transcript segments and identify bills
 */
async function processLiveStream(streamId: string, streamData: LiveStreamData): Promise<void> {
  try {
    console.log(`Processing live stream: ${streamData.committee}`);
    
    // In a real implementation, we would extract a transcript from the live stream
    // For this demo, we'll simulate by generating content
    const transcript = await simulateTranscriptExtraction(streamData);
    
    // Add to transcript buffer (keep a rolling window of the last 10 segments)
    streamData.transcriptBuffer.push(transcript);
    if (streamData.transcriptBuffer.length > 10) {
      streamData.transcriptBuffer.shift();
    }
    
    // Every 5 minutes (or other suitable interval), analyze the transcript
    if (!streamData.lastProcessed || 
        Date.now() - streamData.lastProcessed.getTime() > 5 * 60 * 1000) {
      // Analyze transcript to identify key segments, bills mentioned, etc.
      await analyzeTranscript(streamId, streamData);
      
      // Update last processed time
      streamData.lastProcessed = new Date();
    }
  } catch (error: any) {
    console.error(`Error processing live stream ${streamId}:`, error);
  }
}

/**
 * Simulate extracting a transcript from a live stream
 * In a real implementation, this would use a speech-to-text service
 */
async function simulateTranscriptExtraction(streamData: LiveStreamData): Promise<string> {
  // In a real implementation, this would capture audio from the stream and transcribe it
  // For now, we'll return a placeholder with a timestamp
  return `[${new Date().toISOString()}] Committee discussion on ${streamData.committee}`;
}

/**
 * Analyze the transcript to identify key segments, bills mentioned, quotes, etc.
 */
async function analyzeTranscript(streamId: string, streamData: LiveStreamData): Promise<void> {
  try {
    // Get the full transcript context from our buffer
    const fullTranscript = streamData.transcriptBuffer.join('\n');
    
    if (!fullTranscript.trim()) {
      console.log(`No transcript available for ${streamData.committee}`);
      return;
    }
    
    // Find the committee in our database
    const committee = await db.query.committees.findFirst({
      where: eq(committees.name, streamData.committee),
    });
    
    if (!committee) {
      console.log(`Committee not found in database: ${streamData.committee}`);
      return;
    }
    
    // Check if we already have a meeting entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingMeeting = await db.query.committeeMeetings.findFirst({
      where: and(
        eq(committeeMeetings.committeeId, committee.id),
        eq(committeeMeetings.date, today)
      ),
    });
    
    // Create or get the meeting ID
    let meetingId: number;
    
    if (existingMeeting) {
      meetingId = existingMeeting.id;
    } else {
      // Create a new meeting entry
      const result = await db.insert(committeeMeetings).values({
        committeeId: committee.id,
        date: today,
        location: "Live Stream",
        agenda: streamData.description,
        videoUrl: streamData.url,
        processingStatus: "in_progress",
        lastUpdated: new Date()
      });
      
      // Get the ID of the inserted meeting
      const newMeeting = await db.query.committeeMeetings.findFirst({
        where: and(
          eq(committeeMeetings.committeeId, committee.id),
          eq(committeeMeetings.date, today)
        ),
        orderBy: [desc(committeeMeetings.id)]
      });
      
      if (!newMeeting) {
        throw new Error("Failed to create meeting record");
      }
      
      meetingId = newMeeting.id;
    }
    
    // Use OpenAI to analyze the transcript
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert legislative analyst specializing in Texas state politics. 
                  Your job is to analyze live transcripts from committee meetings and identify:
                  1. The current topic or segment being discussed
                  2. Any specific bills being mentioned (in format HB123 or SB123)
                  3. Notable quotes from speakers, including who they are if identifiable
                  4. Key points or decisions being made
                  5. The primary speaker and their role (elected_official, witness, resource_witness)
                  6. Key words and topics mentioned in the segment
                  7. The emotional sentiment of the discussion (as a score from -100 to 100)`
        },
        {
          role: "user",
          content: `Analyze this transcript segment from a Texas legislative committee meeting and extract:
                  
                  Committee: ${streamData.committee}
                  Title: ${streamData.title}
                  
                  TRANSCRIPT:
                  ${fullTranscript}
                  
                  Format your response as a JSON object with these fields:
                  {
                    "currentSegment": "Brief description of what's currently being discussed",
                    "billsDiscussed": ["HB123", "SB456"], // Any bills mentioned in the format HB123 or SB123
                    "primarySpeaker": {
                      "name": "Full name of the main person speaking",
                      "role": "elected_official" // Must be one of: elected_official, witness, resource_witness
                    },
                    "keyWords": ["keyword1", "keyword2", "keyword3"], // 3-5 key topics or words
                    "timeRange": {
                      "startTime": "00:00:00", // Estimated start time in HH:MM:SS format
                      "endTime": "00:05:30" // Estimated end time in HH:MM:SS format
                    },
                    "sentimentScore": 42, // Number from -100 (very negative) to 100 (very positive)
                    "keyQuotes": [
                      {
                        "speaker": "Name and role if known",
                        "quote": "The exact quote",
                        "timestamp": "Estimated timestamp if available",
                        "billReference": "HB123" // If the quote references a specific bill
                      }
                    ],
                    "summary": "A brief 1-2 sentence summary of this discussion segment"
                  }`
        }
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    // Parse the analysis
    const analysisContent = response.choices[0].message.content;
    if (!analysisContent) {
      console.error("No content in OpenAI response");
      return;
    }
    
    const analysis = JSON.parse(analysisContent);
    
    // Update the stream data with current information
    streamData.currentSegment = analysis.currentSegment;
    streamData.currentBills = analysis.billsDiscussed;
    
    // Save segment to database with the correctly typed fields
    await db.insert(liveStreamSegments).values({
      committeeMeetingId: meetingId,
      committeeId: committee.id,
      description: analysis.currentSegment,
      timestamp: new Date(),
      billIds: analysis.billsDiscussed?.join(',') || '',
      billsDiscussed: analysis.billsDiscussed?.join(', ') || '',
      speakerName: analysis.primarySpeaker?.name || '',
      speakerRole: analysis.primarySpeaker?.role || '',
      keyWords: analysis.keyWords || [],
      startTimestamp: analysis.timeRange?.startTime || '',
      endTimestamp: analysis.timeRange?.endTime || '',
      summary: analysis.summary || '',
      sentimentScore: analysis.sentimentScore || 0
    });
    
    // Save quotes to database
    if (analysis.keyQuotes && analysis.keyQuotes.length > 0) {
      for (const quote of analysis.keyQuotes) {
        await db.insert(liveStreamQuotes).values({
          committeeMeetingId: meetingId,
          speaker: quote.speaker,
          quote: quote.quote,
          timestamp: new Date(),
          billId: quote.billReference || null
        });
      }
    }
    
    console.log(`Successfully analyzed transcript for ${streamData.committee}`);
  } catch (error: any) {
    console.error("Error analyzing transcript:", error);
  }
}

/**
 * Get the latest live stream segments for a meeting
 */
export async function getLiveStreamSegments(meetingId: number, limit: number = 10): Promise<typeof liveStreamSegments.$inferSelect[]> {
  return await db.query.liveStreamSegments.findMany({
    where: eq(liveStreamSegments.committeeMeetingId, meetingId),
    orderBy: [desc(liveStreamSegments.timestamp)],
    limit
  });
}

/**
 * Get the latest quotes for a meeting
 */
export async function getLiveStreamQuotes(meetingId: number, limit: number = 20): Promise<typeof liveStreamQuotes.$inferSelect[]> {
  return await db.query.liveStreamQuotes.findMany({
    where: eq(liveStreamQuotes.committeeMeetingId, meetingId),
    orderBy: [desc(liveStreamQuotes.timestamp)],
    limit
  });
}

/**
 * Get active committees with live streams
 */
export async function getActiveCommitteesWithLiveStreams(): Promise<{
  id: number;
  name: string;
  isLive: boolean;
  lastUpdated: Date;
}[]> {
  // Get all committees
  const allCommittees = await db.query.committees.findMany();
  
  // Map them to our active streams data
  return allCommittees.map(committee => {
    // Find a matching active stream
    const matchingStream = Object.values(activeStreams).find(
      stream => stream.committee.toLowerCase() === committee.name.toLowerCase()
    );
    
    return {
      id: committee.id,
      name: committee.name,
      isLive: matchingStream?.isLive || false,
      lastUpdated: matchingStream?.lastUpdated || new Date(0)
    };
  }).filter(c => c.isLive); // Only include committees with live streams
}

/**
 * Initialize the scheduled scanning for live committee meetings
 */
export function initLiveCommitteeMeetingScanner(): void {
  console.log("Setting up scheduled live committee meeting scans...");
  
  // Initial scan
  scanForLiveCommitteeMeetings().catch(error => {
    console.error("Error in initial live committee scan:", error);
  });
  
  // Set up recurring scans every 15 minutes
  setInterval(() => {
    console.log("Running scheduled scan for live committee meetings...");
    scanForLiveCommitteeMeetings()
      .then(() => console.log("Completed scheduled scan for live committee meetings"))
      .catch(error => console.error("Error in scheduled live committee scan:", error));
  }, 15 * 60 * 1000); // 15 minutes in milliseconds
  
  console.log("Live committee scan schedule established");
}

export default {
  scanForLiveCommitteeMeetings,
  getLiveStreamSegments,
  getLiveStreamQuotes,
  getActiveCommitteesWithLiveStreams,
  initLiveCommitteeMeetingScanner
};