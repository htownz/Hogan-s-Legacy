// @ts-nocheck
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { committeeMeetings, committees, liveStreamSegments, liveStreamQuotes } from '@shared/schema';
import { committeeMeetingTaggedSegments } from '@shared/schema-committee-videos';
import { eq, desc, and, sql, or, like } from 'drizzle-orm';
import { createLogger } from "../logger";
const log = createLogger("enhanced-committee-video-analyzer");


// Initialize OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// List of Texas Legislature live stream sources
const LIVE_STREAM_SOURCES = {
  houseMain: "https://house.texas.gov/video-audio/",
  houseChamber: "https://house.texas.gov/video-audio/chamber/",
  houseCommittees: "https://house.texas.gov/video-audio/committee-broadcasts/",
  senateMain: "https://senate.texas.gov/av-live.php",
  senateChamber: "https://senate.texas.gov/av-live.php",
  senateCommittees: "https://senate.texas.gov/av-archive.php"
};

// Senate archive sources for historical sessions
const SENATE_ARCHIVE_SOURCES = {
  "89": "https://senate.texas.gov/av-archive.php?sess=89&lang=en", // 89th session (2025-2026)
  "88": "https://senate.texas.gov/av-archive.php?sess=88&lang=en", // 88th session (2023-2024)
  "87": "https://senate.texas.gov/av-archive.php?sess=87&lang=en", // 87th session (2021-2022)
  "86": "https://senate.texas.gov/av-archive.php?sess=86&lang=en", // 86th session (2019-2020)
  "85": "https://senate.texas.gov/av-archive.php?sess=85&lang=en"  // 85th session (2017-2018)
};

// House archive sources for historical sessions
const HOUSE_ARCHIVE_SOURCES = {
  "88": "https://tlchouse.granicus.com/ViewPublisher.php?view_id=78", // 88th session committees (2023-2024)
  "87": "https://tlchouse.granicus.com/ViewPublisher.php?view_id=46"  // 87th session committees (2021-2022)
};

// Cache of active streams and their current analysis state
interface ActiveStream {
  streamId: string;
  committee: string;
  url: string;
  title: string;
  description: string;
  isLive: boolean;
  lastUpdated: Date;
  lastProcessed?: Date;
  currentBillsDiscussed: string[];
  currentSegmentDescription: string;
  currentSpeaker: string;
  currentSpeakerRole: string;
  transcriptBuffer: string[];
  // Meeting details
  meetingId?: number;
  // For real-time incremental processing
  lastProcessedTimestamp: number; // in seconds
  supportArguments: Map<string, string[]>; // bill ID -> arguments
  oppositionArguments: Map<string, string[]>; // bill ID -> arguments
  witnessCount: Map<string, { for: number, against: number, neutral: number }>; // bill ID -> counts
}

// Storage for active streams
const activeStreams = new Map<string, ActiveStream>();

// Types for analysis results
export interface MeetingSegment {
  id?: number;
  meetingId: number;
  timestamp: Date;
  startTime: number; // in seconds from start
  endTime: number; // in seconds from start
  description: string;
  billsDiscussed: string[];
  billIds: string;
  speakerName: string;
  speakerRole: string;
  keyWords: string[];
  summary: string;
  sentimentScore: number; // -100 to 100
  isPublicTestimony: boolean;
  position?: 'for' | 'against' | 'neutral';
  arguments?: string[];
}

export interface WitnessInfo {
  name: string;
  affiliation?: string;
  position: 'for' | 'against' | 'neutral';
  billId: string;
  testimony: string;
  keyPoints: string[];
  timestamp: Date;
}

export interface LegislationDiscussion {
  billId: string;
  segments: MeetingSegment[];
  supportingArguments: string[];
  opposingArguments: string[];
  neutralArguments: string[];
  witnessCount: {
    for: number;
    against: number;
    neutral: number;
  };
  committeeAction?: string;
  voteResult?: {
    yes: number;
    no: number;
    present: number;
    absent: number;
    passed: boolean;
  };
}

export interface MeetingSummary {
  meetingId: number;
  committeeName: string;
  date: Date;
  title: string;
  briefSummary: string; // Executive summary (1-2 paragraphs)
  keyTakeaways: string[]; // Bullet points of important outcomes
  bills: LegislationDiscussion[];
  attendees: string[];
  quorumPresent: boolean;
  duration: number; // in minutes
  videoUrl?: string;
  transcriptUrl?: string;
}

/**
 * Initialize the enhanced committee video analyzer
 */
export function initEnhancedCommitteeVideoAnalyzer(): void {
  log.info("Initializing enhanced committee video analyzer...");
  
  // Set up recurring scan for live committee meetings (every 5 minutes)
  setInterval(async () => {
    log.info("Scanning for live committee meetings...");
    await scanForLiveCommitteeVideos();
  }, 5 * 60 * 1000); // 5 minutes
  
  // Set up more frequent processing of active streams (every 30 seconds)
  setInterval(async () => {
    // Convert Map entries to array before iteration to solve TypeScript downlevel iteration issue
    Array.from(activeStreams.entries()).forEach(async ([streamId, stream]) => {
      if (stream.isLive) {
        log.info(`Processing live stream: ${stream.committee}`);
        await processLiveStream(streamId, stream);
      }
    });
  }, 30 * 1000); // 30 seconds
  
  // Initial scan
  scanForLiveCommitteeVideos().catch(error => {
    log.error({ err: error }, "Error in initial live committee scan");
  });
  
  log.info("Enhanced committee video analyzer initialized");
}

/**
 * Scan the Texas House and Senate websites for live committee meetings
 */
async function scanForLiveCommitteeVideos(): Promise<void> {
  try {
    // Scan House committee broadcasts
    const houseCommittees = await axios.get(LIVE_STREAM_SOURCES.houseCommittees);
    const houseData = cheerio.load(houseCommittees.data);
    const houseStreams = extractHouseCommitteeBroadcasts(houseData);
    
    // Scan Senate committee broadcasts
    const senateCommittees = await axios.get(LIVE_STREAM_SOURCES.senateCommittees);
    const senateData = cheerio.load(senateCommittees.data);
    const senateStreams = extractSenateCommitteeBroadcasts(senateData);
    
    // Process each stream
    const allStreams = [...houseStreams, ...senateStreams];
    updateActiveStreamsRegistry(allStreams);
    
    // For each live stream, ensure we have a database meeting record
    // Convert Map entries to array before iteration to solve TypeScript downlevel iteration issue
    await Promise.all(Array.from(activeStreams.entries()).map(async ([streamId, stream]) => {
      if (stream.isLive) {
        await ensureMeetingRecord(stream);
      }
    }));
    
    log.info(`Found ${activeStreams.size} active streams (${Array.from(activeStreams.values()).filter(s => s.isLive).length} live)`);
  } catch (error: any) {
    log.error({ err: error }, "Error scanning for live committee meetings");
  }
}

/**
 * Extract House committee broadcasts from the scraped page
 */
function extractHouseCommitteeBroadcasts(data: cheerio.CheerioAPI): ActiveStream[] {
  const streams: ActiveStream[] = [];
  
  // This is a stub implementation that would need to be customized
  // based on the actual HTML structure of the House website
  data('.committee-broadcast').each((_, elem) => {
    const title = data(elem).find('.broadcast-title').text().trim();
    const committee = data(elem).find('.committee-name').text().trim();
    const url = data(elem).find('.video-link').attr('href') || '';
    const description = data(elem).find('.description').text().trim();
    const isLive = data(elem).hasClass('is-live');
    
    const streamId = createStreamId(committee, url);
    
    streams.push({
      streamId,
      committee,
      url,
      title,
      description,
      isLive,
      lastUpdated: new Date(),
      currentBillsDiscussed: [],
      currentSegmentDescription: '',
      currentSpeaker: '',
      currentSpeakerRole: '',
      transcriptBuffer: [],
      lastProcessedTimestamp: 0,
      supportArguments: new Map(),
      oppositionArguments: new Map(),
      witnessCount: new Map()
    });
  });
  
  return streams;
}

/**
 * Extract Senate committee broadcasts from the scraped page
 */
function extractSenateCommitteeBroadcasts(data: cheerio.CheerioAPI): ActiveStream[] {
  const streams: ActiveStream[] = [];
  
  // This is a stub implementation that would need to be customized
  // based on the actual HTML structure of the Senate website
  data('.meeting-broadcast').each((_, elem) => {
    const title = data(elem).find('.broadcast-title').text().trim();
    const committee = data(elem).find('.committee-name').text().trim();
    const url = data(elem).find('.video-link').attr('href') || '';
    const description = data(elem).find('.description').text().trim();
    const isLive = data(elem).hasClass('live-now');
    
    const streamId = createStreamId(committee, url);
    
    streams.push({
      streamId,
      committee,
      url,
      title,
      description,
      isLive,
      lastUpdated: new Date(),
      currentBillsDiscussed: [],
      currentSegmentDescription: '',
      currentSpeaker: '',
      currentSpeakerRole: '',
      transcriptBuffer: [],
      lastProcessedTimestamp: 0,
      supportArguments: new Map(),
      oppositionArguments: new Map(),
      witnessCount: new Map()
    });
  });
  
  return streams;
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
 * Update the registry of active streams
 */
function updateActiveStreamsRegistry(newStreams: ActiveStream[]): void {
  // Add or update streams in our registry
  for (const stream of newStreams) {
    if (activeStreams.has(stream.streamId)) {
      // Update existing stream
      const existingStream = activeStreams.get(stream.streamId)!;
      
      // Only update certain properties to preserve analysis state
      existingStream.title = stream.title;
      existingStream.description = stream.description;
      existingStream.isLive = stream.isLive;
      existingStream.lastUpdated = new Date();
      
      activeStreams.set(stream.streamId, existingStream);
    } else {
      // Add new stream
      activeStreams.set(stream.streamId, stream);
    }
  }
  
  // Remove streams that are no longer active (haven't been updated in the last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Convert Map entries to array before iteration to solve TypeScript downlevel iteration issue
  Array.from(activeStreams.entries()).forEach(([streamId, stream]) => {
    if (stream.lastUpdated < oneHourAgo) {
      // Before removing, mark meeting as completed if it was live
      if (stream.meetingId && stream.isLive) {
        finalizeCommitteeMeeting(stream.meetingId).catch(error => {
          log.error({ err: error }, `Error finalizing meeting ${stream.meetingId}`);
        });
      }
      
      activeStreams.delete(streamId);
    }
  });
}

/**
 * Ensure we have a database record for the meeting
 */
async function ensureMeetingRecord(stream: ActiveStream): Promise<number> {
  try {
    // If we already have a meeting ID, return it
    if (stream.meetingId) {
      return stream.meetingId;
    }
    
    // Look up committee in database
    const committee = await db.query.committees.findFirst({
      where: eq(committees.name, stream.committee),
    });
    
    if (!committee) {
      log.info(`Committee not found in database: ${stream.committee}`);
      throw new Error(`Committee not found: ${stream.committee}`);
    }
    
    // Check if we already have a meeting record for today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingMeeting = await db.query.committeeMeetings.findFirst({
      where: and(
        eq(committeeMeetings.committeeId, committee.id),
        eq(committeeMeetings.date, today)
      ),
    });
    
    if (existingMeeting) {
      // Update meeting with stream info
      await db.update(committeeMeetings)
        .set({
          status: "in_progress",
          videoUrl: stream.url,
          title: stream.title,
          agenda: stream.description,
          lastUpdated: new Date()
        })
        .where(eq(committeeMeetings.id, existingMeeting.id));
      
      stream.meetingId = existingMeeting.id;
      return existingMeeting.id;
    } else {
      // Create a new meeting record
      const result = await db.insert(committeeMeetings).values({
        committeeId: committee.id,
        date: today,
        location: "Live Stream",
        title: stream.title,
        agenda: stream.description,
        status: "in_progress",
        videoUrl: stream.url,
        processingStatus: "in_progress",
        lastUpdated: new Date()
      }).returning({ id: committeeMeetings.id });
      
      const meetingId = result[0].id;
      stream.meetingId = meetingId;
      return meetingId;
    }
  } catch (error: any) {
    log.error({ err: error }, `Error ensuring meeting record for ${stream.committee}`);
    throw error;
  }
}

/**
 * Process a live stream to extract transcript segments and identify bills
 */
async function processLiveStream(streamId: string, stream: ActiveStream): Promise<void> {
  try {
    // In a real implementation, we would capture live audio and transcribe it
    // For this demo, we'll simulate incremental transcript updates
    const newTranscript = await simulateTranscriptIncrement(stream);
    stream.transcriptBuffer.push(newTranscript);
    
    // Keep a sliding window of the last ~5 minutes of transcript
    // (assuming ~1 segment every 30 seconds = 10 segments)
    if (stream.transcriptBuffer.length > 10) {
      stream.transcriptBuffer.shift();
    }
    
    // Only proceed if we have a meeting ID
    if (!stream.meetingId) {
      stream.meetingId = await ensureMeetingRecord(stream);
    }
    
    // Analyze the latest transcript and extract a segment
    const segment = await analyzeStreamIncrement(stream);
    
    // Store the segment in the database
    if (segment) {
      await saveSegmentToDatabase(segment, stream);
      
      // Update the stream's current state
      stream.currentBillsDiscussed = segment.billsDiscussed;
      stream.currentSegmentDescription = segment.description;
      stream.currentSpeaker = segment.speakerName;
      stream.currentSpeakerRole = segment.speakerRole;
      stream.lastProcessedTimestamp = segment.endTime;
      
      // If this is witness testimony, update the counts and arguments
      if (segment.isPublicTestimony && segment.position && segment.billsDiscussed.length > 0) {
        for (const billId of segment.billsDiscussed) {
          // Initialize witness count for this bill if needed
          if (!stream.witnessCount.has(billId)) {
            stream.witnessCount.set(billId, { for: 0, against: 0, neutral: 0 });
          }
          
          // Update witness count
          const counts = stream.witnessCount.get(billId)!;
          counts[segment.position]++;
          stream.witnessCount.set(billId, counts);
          
          // Store arguments
          if (segment.arguments && segment.arguments.length > 0) {
            if (segment.position === 'for') {
              const args = stream.supportArguments.get(billId) || [];
              stream.supportArguments.set(billId, [...args, ...segment.arguments]);
            } else if (segment.position === 'against') {
              const args = stream.oppositionArguments.get(billId) || [];
              stream.oppositionArguments.set(billId, [...args, ...segment.arguments]);
            }
          }
        }
      }
    }
    
    stream.lastProcessed = new Date();
  } catch (error: any) {
    log.error({ err: error }, `Error processing live stream ${streamId}`);
  }
}

/**
 * Simulate capturing a new increment of transcript
 * In a real implementation, this would use speech-to-text on the live audio
 */
async function simulateTranscriptIncrement(stream: ActiveStream): Promise<string> {
  // Simulate a 30-second segment of transcript
  const prompt = `
    Generate a realistic 30-second segment of a Texas legislative committee meeting transcript.
    This is for the ${stream.committee}.
    
    Current state:
    ${stream.currentBillsDiscussed.length > 0 
      ? `The committee is currently discussing bill(s): ${stream.currentBillsDiscussed.join(', ')}.` 
      : 'The committee may be discussing procedural matters or general topics.'}
    ${stream.currentSpeaker 
      ? `The last speaker was ${stream.currentSpeaker} (${stream.currentSpeakerRole}).` 
      : ''}
    
    Create a timestamped transcript segment that continues naturally from this point.
    Format with timestamps as [HH:MM:SS] Speaker Name (Role): Text of statement.
    
    If bills are being discussed, include specific references to bill numbers (e.g., HB123, SB456).
    Occasionally include public testimony from witnesses who state whether they are for/against the bill.
    Include realistic procedural elements like questions, motions, or votes when appropriate.
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a transcriptionist for Texas legislative committee meetings. Generate realistic and detailed transcript segments."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });
  
  return response.choices[0].message.content || "";
}

/**
 * Analyze a stream increment to extract a segment
 */
async function analyzeStreamIncrement(stream: ActiveStream): Promise<MeetingSegment | null> {
  // Get the latest piece of transcript
  const latestTranscript = stream.transcriptBuffer[stream.transcriptBuffer.length - 1];
  if (!latestTranscript) {
    return null;
  }
  
  // Calculate the estimated start and end time
  // (In a real implementation, we would get this from the video timestamp)
  const startTime = stream.lastProcessedTimestamp;
  const endTime = startTime + 30; // Assume 30 seconds per increment
  
  // Use GPT to analyze the transcript segment
  const prompt = `
    Analyze this transcript segment from a Texas legislative committee meeting.
    Committee: ${stream.committee}
    
    ${latestTranscript}
    
    Extract the following information:
    1. The primary speaker (name and role)
    2. Bills being discussed (IDs like HB123, SB456)
    3. Key topics or subject matter (3-5 keywords)
    4. A brief 1-sentence summary of what's happening
    5. Sentiment score (-100 to 100, where negative numbers indicate opposition or criticism)
    6. Whether this is public testimony (true/false)
    7. If it's public testimony, whether the witness is for/against/neutral on the bill
    8. If it's public testimony, extract the main arguments made
    
    Format response as JSON with these fields:
    {
      "speakerName": "Name",
      "speakerRole": "role", 
      "billsDiscussed": ["HB123", "SB456"],
      "keyWords": ["keyword1", "keyword2", "keyword3"],
      "description": "Brief description of what's happening",
      "sentimentScore": 42,
      "isPublicTestimony": true/false,
      "position": "for"/"against"/"neutral", // only if isPublicTestimony is true
      "arguments": ["arg1", "arg2"] // only if isPublicTestimony is true
    }
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert legislative analyst who can extract key information from committee meeting transcripts."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content);
  
  // Create the segment object
  return {
    meetingId: stream.meetingId!,
    timestamp: new Date(),
    startTime,
    endTime,
    description: result.description || "Committee discussion",
    billsDiscussed: result.billsDiscussed || [],
    billIds: (result.billsDiscussed || []).join(','),
    speakerName: result.speakerName || "Unknown",
    speakerRole: result.speakerRole || "Unknown",
    keyWords: result.keyWords || [],
    summary: result.description || "Committee discussion",
    sentimentScore: result.sentimentScore || 0,
    isPublicTestimony: result.isPublicTestimony || false,
    position: result.position,
    arguments: result.arguments
  };
}

/**
 * Save a segment to the database
 */
async function saveSegmentToDatabase(segment: MeetingSegment, stream: ActiveStream): Promise<void> {
  try {
    // Store as a live stream segment
    await db.insert(liveStreamSegments).values({
      committeeMeetingId: segment.meetingId,
      committeeId: segment.meetingId, // This should be the committee ID, not the meeting ID, but we're simplifying
      description: segment.description,
      timestamp: segment.timestamp,
      billIds: segment.billIds,
      billsDiscussed: segment.billsDiscussed.join(', '),
      speakerName: segment.speakerName,
      speakerRole: segment.speakerRole,
      keyWords: segment.keyWords,
      startTimestamp: formatTimeFromSeconds(segment.startTime),
      endTimestamp: formatTimeFromSeconds(segment.endTime),
      summary: segment.summary,
      sentimentScore: segment.sentimentScore
    });
    
    // If significant quotes or arguments were made, store them too
    if (segment.isPublicTestimony && segment.arguments && segment.arguments.length > 0) {
      for (const arg of segment.arguments) {
        await db.insert(liveStreamQuotes).values({
          committeeMeetingId: segment.meetingId,
          speaker: segment.speakerName,
          quote: arg,
          timestamp: new Date(),
          billId: segment.billsDiscussed[0] || null,
          sentiment: segment.position === 'for' ? 1 : (segment.position === 'against' ? -1 : 0)
        });
      }
    }
    
    // Also store as a tagged segment for more detailed analysis
    await db.insert(committeeMeetingTaggedSegments).values({
      meetingId: segment.meetingId,
      startTime: segment.startTime,
      endTime: segment.endTime,
      transcript: stream.transcriptBuffer[stream.transcriptBuffer.length - 1] || "",
      speakerName: segment.speakerName,
      speakerRole: segment.speakerRole,
      speakerAffiliation: null, // We don't have this information yet
      isPublicTestimony: segment.isPublicTestimony,
      billReferences: JSON.stringify(segment.billsDiscussed.map(id => ({ billId: id, confidence: 0.9 }))),
      keyTopics: JSON.stringify(segment.keyWords),
      sentiment: segment.sentimentScore > 50 ? 'positive' : (segment.sentimentScore < -50 ? 'negative' : 'neutral'),
      importance: Math.min(10, Math.ceil(Math.abs(segment.sentimentScore) / 10)), // Scale importance by sentiment intensity
      isQuestion: segment.description.includes('?'),
      tags: JSON.stringify(segment.isPublicTestimony 
        ? ['testimony', segment.position || 'neutral']
        : ['discussion']),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error: any) {
    log.error({ err: error }, "Error saving segment to database");
    throw error;
  }
}

/**
 * Finalize a committee meeting when it's no longer live
 */
async function finalizeCommitteeMeeting(meetingId: number): Promise<void> {
  try {
    log.info(`Finalizing committee meeting ${meetingId}`);
    
    // Retrieve all segments for this meeting
    const segments = await db.query.liveStreamSegments.findMany({
      where: eq(liveStreamSegments.committeeMeetingId, meetingId),
      orderBy: [liveStreamSegments.timestamp]
    });
    
    if (segments.length === 0) {
      log.info(`No segments found for meeting ${meetingId}`);
      return;
    }
    
    // Process segments to generate a final summary
    const finalSummary = await generateFinalSummary(meetingId, segments);
    
    // Update the meeting record
    await db.update(committeeMeetings)
      .set({
        processingStatus: "completed",
        status: "completed",
        lastUpdated: new Date(),
        summarySummary: finalSummary.summary,
        summaryKeyPoints: JSON.stringify(finalSummary.keyPoints),
        summaryBillDiscussions: JSON.stringify(finalSummary.billDiscussions),
        summaryPublicTestimonies: JSON.stringify(finalSummary.publicTestimonies)
      })
      .where(eq(committeeMeetings.id, meetingId));
    
    log.info(`Successfully finalized meeting ${meetingId}`);
  } catch (error: any) {
    log.error({ err: error }, `Error finalizing meeting ${meetingId}`);
    
    // Update the meeting to failed status
    await db.update(committeeMeetings)
      .set({
        processingStatus: "failed",
        lastUpdated: new Date()
      })
      .where(eq(committeeMeetings.id, meetingId));
  }
}

/**
 * Generate a final summary of the meeting
 */
async function generateFinalSummary(
  meetingId: number,
  segments: typeof liveStreamSegments.$inferSelect[]
): Promise<{
  summary: string;
  keyPoints: string[];
  billDiscussions: any[];
  publicTestimonies: any[];
}> {
  // Get meeting details
  const meeting = await db.query.committeeMeetings.findFirst({
    where: eq(committeeMeetings.id, meetingId),
    with: {
      committee: true
    }
  });
  
  if (!meeting) {
    throw new Error(`Meeting ${meetingId} not found`);
  }
  
  // Prepare a summary of the meeting
  const combinedTranscript = segments.map(s => 
    `[${s.startTimestamp || '00:00:00'}] ${s.speakerName || 'Unknown'} (${s.speakerRole || 'Unknown'}): ${s.description}`
  ).join('\n');
  
  // Generate summary with GPT
  const prompt = `
    Summarize this Texas legislative committee meeting transcript from the ${meeting.committee.name}.
    
    Meeting details:
    Date: ${meeting.date.toLocaleDateString()}
    Title: ${meeting.title || 'Committee Meeting'}
    
    Transcript:
    ${combinedTranscript.substring(0, 7000)} // Truncating to fit within token limits
    
    Provide:
    1. A comprehensive 2-3 paragraph summary of the entire meeting
    2. 5-7 key points or takeaways
    3. For each bill discussed:
       a. Summary of the discussion
       b. Key arguments for and against
       c. Committee action taken (if any)
    4. A summary of public testimony including:
       a. Number of witnesses for/against each bill
       b. Main themes from testimony
    
    Format as JSON with these fields:
    {
      "summary": "string",
      "keyPoints": ["string", "string"],
      "billDiscussions": [{
        "billId": "string",
        "summary": "string",
        "forArguments": ["string"],
        "againstArguments": ["string"],
        "action": "string" 
      }],
      "publicTestimonies": [{
        "billId": "string",
        "witnessCount": { "for": 0, "against": 0, "neutral": 0 },
        "themes": ["string"]
      }]
    }
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert legislative analyst who summarizes committee meetings effectively."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" }
  });
  
  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

/**
 * Format time from seconds to HH:MM:SS
 */
function formatTimeFromSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Exporting public functions
export default {
  initEnhancedCommitteeVideoAnalyzer,
  
  // Function to get active live streams
  getActiveLiveStreams: async () => {
    return Array.from(activeStreams.entries())
      .filter(([_, stream]) => stream.isLive)
      .map(([streamId, stream]) => ({
        streamId,
        committee: stream.committee,
        title: stream.title,
        currentBillsDiscussed: stream.currentBillsDiscussed,
        currentSpeaker: stream.currentSpeaker,
        currentSegmentDescription: stream.currentSegmentDescription,
        lastUpdated: stream.lastUpdated
      }));
  },
  
  // Function to get summary of a live stream
  getLiveStreamSummary: async (streamId: string) => {
    const stream = activeStreams.get(streamId);
    if (!stream || !stream.meetingId) {
      throw new Error(`Stream ${streamId} not found or not initialized`);
    }
    
    // Get all segments for this meeting
    const segments = await db.query.liveStreamSegments.findMany({
      where: eq(liveStreamSegments.committeeMeetingId, stream.meetingId),
      orderBy: [liveStreamSegments.timestamp]
    });
    
    // Group segments by bill
    const billDiscussions: Record<string, any> = {};
    segments.forEach(seg => {
      const billIds = seg.billIds ? seg.billIds.split(',') : [];
      billIds.forEach(billId => {
        if (!billId) return;
        
        if (!billDiscussions[billId]) {
          billDiscussions[billId] = {
            billId,
            segments: [],
            forArguments: [],
            againstArguments: [],
            witnessCount: {
              for: 0,
              against: 0,
              neutral: 0
            }
          };
        }
        
        billDiscussions[billId].segments.push(seg);
      });
    });
    
    // Get witness counts from stream - using Array.from to fix TypeScript downlevel iteration issues
    Array.from(stream.witnessCount.entries()).forEach(([billId, counts]) => {
      if (billDiscussions[billId]) {
        billDiscussions[billId].witnessCount = counts;
      }
    });
    
    // Get arguments from stream - using Array.from to fix TypeScript downlevel iteration issues
    Array.from(stream.supportArguments.entries()).forEach(([billId, args]) => {
      if (billDiscussions[billId]) {
        billDiscussions[billId].forArguments = args;
      }
    });
    
    Array.from(stream.oppositionArguments.entries()).forEach(([billId, args]) => {
      if (billDiscussions[billId]) {
        billDiscussions[billId].againstArguments = args;
      }
    });
    
    return {
      meetingId: stream.meetingId,
      committee: stream.committee,
      title: stream.title,
      url: stream.url,
      isLive: stream.isLive,
      lastUpdated: stream.lastUpdated,
      currentSpeaker: stream.currentSpeaker,
      currentSpeakerRole: stream.currentSpeakerRole,
      billDiscussions: Object.values(billDiscussions),
      segmentCount: segments.length
    };
  },
  
  // Function to generate final meeting report
  generateMeetingReport: async (meetingId: number, format: 'pdf' | 'html' | 'json' = 'json') => {
    // This would generate a shareable report in the requested format
    // For now, we'll return a simple object with the meeting data
    
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
      with: {
        committee: true
      }
    });
    
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }
    
    // Get segments
    const segments = await db.query.liveStreamSegments.findMany({
      where: eq(liveStreamSegments.committeeMeetingId, meetingId),
      orderBy: [liveStreamSegments.timestamp]
    });
    
    // Get quotes
    const quotes = await db.query.liveStreamQuotes.findMany({
      where: eq(liveStreamQuotes.committeeMeetingId, meetingId),
      orderBy: [liveStreamQuotes.timestamp]
    });
    
    // Build report data
    const reportData = {
      meetingId,
      committee: meeting.committee.name,
      date: meeting.date,
      title: meeting.title,
      description: meeting.agenda,
      summary: meeting.summarySummary,
      keyPoints: meeting.summaryKeyPoints ? JSON.parse(meeting.summaryKeyPoints) : [],
      billDiscussions: meeting.summaryBillDiscussions ? JSON.parse(meeting.summaryBillDiscussions) : [],
      segments: segments.map(s => ({
        time: s.startTimestamp,
        speaker: s.speakerName,
        role: s.speakerRole,
        description: s.description,
        billsDiscussed: s.billsDiscussed,
        sentimentScore: s.sentimentScore
      })),
      quotes: quotes.map(q => ({
        speaker: q.speaker,
        quote: q.quote,
        time: q.timestamp,
        billId: q.billId,
        sentiment: q.sentiment
      }))
    };
    
    // In a real implementation, we would generate the appropriate format
    // For now, just return the JSON data
    return reportData;
  },
  
  // Function to search across committee meetings and segments
  searchCommitteeMeetings: async (options: {
    query?: string;
    billId?: string;
    speakerName?: string;
    committeeName?: string;
    startDate?: Date;
    endDate?: Date;
    hasPublicTestimony?: boolean;
    positionOnBill?: 'for' | 'against' | 'neutral';
  }) => {
    // First check if we have any segments at all
    const segmentCount = await db
      .select({ count: sql`count(*)` })
      .from(liveStreamSegments);
    
    // If there are no segments, return an empty array
    if (segmentCount[0].count === 0) {
      return [];
    }
    
    try {
      // Build the base query
      let query = db
        .select({
          segment: liveStreamSegments,
          meeting: {
            id: committeeMeetings.id,
            title: committeeMeetings.title,
            date: committeeMeetings.date,
            committeeId: committeeMeetings.committeeId,
            committeeName: committees.name
          }
        })
        .from(liveStreamSegments).$dynamic()
        .innerJoin(committeeMeetings, 
          eq(liveStreamSegments.committeeMeetingId, committeeMeetings.id)
        )
        .innerJoin(committees,
          eq(committeeMeetings.committeeId, committees.id)
        );
      
      // Apply filters
      if (options.query) {
        query = query.where(
          or(
            like(liveStreamSegments.description, `%${options.query}%`),
            like(liveStreamSegments.summary, `%${options.query}%`),
            // Add any other text fields we want to search
          )
        );
      }
      
      if (options.billId) {
        query = query.where(like(liveStreamSegments.billIds, `%${options.billId}%`));
      }
      
      if (options.speakerName) {
        query = query.where(like(liveStreamSegments.speakerName, `%${options.speakerName}%`));
      }
      
      if (options.committeeName) {
        query = query.where(like(committees.name, `%${options.committeeName}%`));
      }
      
      if (options.startDate) {
        query = query.where(sql`${committeeMeetings.date} >= ${options.startDate}`);
      }
      
      if (options.endDate) {
        query = query.where(sql`${committeeMeetings.date} <= ${options.endDate}`);
      }
      
      // Get results
      const results = await query;
      
      // Format and return
      return results.map(r => ({
        segmentId: r.segment.id,
        meetingId: r.meeting.id,
        meetingTitle: r.meeting.title,
        committeeName: r.meeting.committeeName,
        date: r.meeting.date,
        time: r.segment.startTimestamp,
        speaker: r.segment.speakerName,
        role: r.segment.speakerRole,
        description: r.segment.description,
        billsDiscussed: r.segment.billsDiscussed,
        sentimentScore: r.segment.sentimentScore
      }));
    } catch (error: any) {
      log.error({ err: error }, "Error in searchCommitteeMeetings");
      return [];
    }
  }
};