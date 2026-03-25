// @ts-nocheck
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from '../db';
import { eq, desc } from 'drizzle-orm';
import { committeeMeetings } from '@shared/schema';
import { committeeMeetingTaggedSegments } from '@shared/schema-committee-videos';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Setup temp directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = path.join(__dirname, "../../temp");

// Make sure the temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Types
export interface VideoSegment {
  startTime: number; // in seconds
  endTime: number; // in seconds
  transcript: string;
  speakerName?: string;
  speakerRole?: string;
  speakerAffiliation?: string;
  isPublicTestimony: boolean;
  billReferences: {
    billId: string;
    confidence: number; // 0-1 
  }[];
  keyTopics: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  importance: number; // 1-10
  isQuestion: boolean;
  tags: string[];
}

export interface ProcessedVideoResult {
  meetingId: number;
  videoUrl: string;
  committeeName: string;
  meetingDate: string;
  segments: VideoSegment[];
  summary: string;
  keyFindings: string[];
  billDiscussions: {
    billId: string;
    segments: number[]; // indices of segments that discuss this bill
    summary: string;
  }[];
  recommendations: string[];
  procedureNotes: string[];
}

/**
 * Analyzes a committee meeting video by processing its transcript
 * and generating intelligent timestamped segments
 */
export async function analyzeCommitteeVideo(
  meetingId: number,
  options: {
    includeTranscript?: boolean;
    includeSentimentAnalysis?: boolean;
    tagBillReferences?: boolean;
    segmentByTopic?: boolean;
    segmentBySpeaker?: boolean;
  } = {}
): Promise<ProcessedVideoResult> {
  try {
    // Set default options
    const settings = {
      includeTranscript: true,
      includeSentimentAnalysis: true,
      tagBillReferences: true,
      segmentByTopic: true,
      segmentBySpeaker: true,
      ...options
    };

    // Get meeting details
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
      with: {
        committee: true
      }
    });

    if (!meeting) {
      throw new Error(`Meeting with ID ${meetingId} not found`);
    }

    if (!meeting.videoUrl) {
      throw new Error(`Meeting with ID ${meetingId} has no video URL`);
    }

    // For this implementation, we'll simulate having an existing transcript
    // In a production app, we would use the OpenAI Whisper API to transcribe the video
    // after extracting the audio
    const transcript = await simulateTranscript(meeting);
    
    // Process the transcript to identify segments
    const segments = await processTranscriptIntoSegments(transcript, settings);
    
    // Analyze each segment for bill references, sentiment, etc.
    const analyzedSegments = await analyzeSegments(segments, meeting.committee.name, settings);
    
    // Generate summary and key findings
    const summary = await generateMeetingSummary(analyzedSegments, meeting);
    
    // Group segments by bill references
    const billDiscussions = groupSegmentsByBill(analyzedSegments);
    
    // Store the segments in the database
    await storeSegments(meetingId, analyzedSegments);
    
    return {
      meetingId,
      videoUrl: meeting.videoUrl,
      committeeName: meeting.committee.name,
      meetingDate: meeting.date.toISOString(),
      segments: analyzedSegments,
      summary: summary.summary,
      keyFindings: summary.keyPoints,
      billDiscussions: billDiscussions.map(bd => ({
        billId: bd.billId,
        segments: bd.segmentIndices,
        summary: bd.summary
      })),
      recommendations: summary.recommendations,
      procedureNotes: summary.procedureNotes
    };
  } catch (error: any) {
    console.error("Error analyzing committee video:", error);
    throw error;
  }
}

/**
 * Generate a simulated transcript for development purposes
 */
async function simulateTranscript(meeting: any): Promise<string> {
  // In a real implementation, we would use OpenAI's Whisper API to transcribe the video
  // after extracting the audio
  
  // For development, we'll generate a simulated transcript using GPT
  const prompt = `
    Generate a realistic and detailed transcript for a ${meeting.committee.name} committee meeting 
    on ${meeting.date.toLocaleDateString()}. The meeting is about ${meeting.title || 'various legislative matters'}.
    ${meeting.agenda ? `The agenda includes: ${meeting.agenda}` : ''}
    
    Include:
    - A chairperson opening the meeting
    - Roll call
    - At least 3 bills being discussed (invent realistic bill IDs like HB123, SB45, etc.)
    - Public testimony from at least 2 citizens
    - Questions from committee members
    - Procedural motions
    - A vote on at least one bill
    - Meeting adjournment
    
    Format the transcript with timestamps, speaker names, and their roles.
    Example format:
    [00:00:15] Chair Johnson: Good morning, everyone. I call this meeting of the [Committee Name] to order.
    
    Generate about 5000 words of transcript content.
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    messages: [
      {
        role: "system",
        content: "You are an expert transcriptionist for legislative committee meetings. Generate realistic, detailed, and accurate transcripts that capture the nuances of legislative proceedings."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });
  
  return response.choices[0].message.content || "";
}

/**
 * Process a transcript into logical segments
 */
async function processTranscriptIntoSegments(
  transcript: string,
  options: {
    segmentByTopic: boolean;
    segmentBySpeaker: boolean;
  }
): Promise<VideoSegment[]> {
  // This is a placeholder for what would be a more sophisticated algorithm
  // In a real implementation, we would use NLP to segment the transcript
  
  // Simple regex-based segmentation for development purposes
  const timestampRegex = /\[(\d{2}):(\d{2}):(\d{2})\] (.*?):(.*?)(?=\[\d{2}:\d{2}:\d{2}\]|$)/gs;
  const segments: VideoSegment[] = [];
  
  let match;
  while ((match = timestampRegex.exec(transcript)) !== null) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const startTime = hours * 3600 + minutes * 60 + seconds;
    
    const speakerInfo = match[4].trim();
    const text = match[5].trim();
    
    // Try to extract role from speaker info (e.g., "Chair Johnson", "Rep. Smith")
    let speakerName = speakerInfo;
    let speakerRole = undefined;
    let speakerAffiliation = undefined;
    
    if (speakerInfo.includes("Chair")) {
      speakerRole = "Chair";
      speakerName = speakerInfo.replace("Chair", "").trim();
    } else if (speakerInfo.includes("Rep.")) {
      speakerRole = "Representative";
      speakerName = speakerInfo.replace("Rep.", "").trim();
    } else if (speakerInfo.includes("Sen.")) {
      speakerRole = "Senator";
      speakerName = speakerInfo.replace("Sen.", "").trim();
    } else if (speakerInfo.includes("Public Testimony") || speakerInfo.includes("Witness")) {
      speakerRole = "Public Witness";
      
      // Try to extract affiliation
      const affilMatch = /representing (.*)/i.exec(speakerInfo);
      if (affilMatch) {
        speakerAffiliation = affilMatch[1].trim();
        speakerName = speakerInfo.replace(/representing .*/i, "").trim();
      } else {
        speakerName = speakerInfo;
      }
    }
    
    // Basic segment with minimal info
    const segment: VideoSegment = {
      startTime,
      endTime: startTime + 60, // Estimate 1 minute per segment for development
      transcript: text,
      speakerName,
      speakerRole,
      speakerAffiliation,
      isPublicTestimony: speakerRole === "Public Witness",
      billReferences: [],
      keyTopics: [],
      sentiment: 'neutral',
      importance: 5,
      isQuestion: text.trim().endsWith("?"),
      tags: []
    };
    
    segments.push(segment);
  }
  
  // If no segments were found with regex, create a single segment with the entire transcript
  if (segments.length === 0) {
    segments.push({
      startTime: 0,
      endTime: 3600, // Assume 1 hour
      transcript,
      isPublicTestimony: false,
      billReferences: [],
      keyTopics: [],
      sentiment: 'neutral',
      importance: 5,
      isQuestion: false,
      tags: []
    });
  }
  
  return segments;
}

/**
 * Analyze transcript segments to extract bill references, sentiment, etc.
 */
async function analyzeSegments(
  segments: VideoSegment[],
  committeeName: string,
  options: {
    includeSentimentAnalysis: boolean;
    tagBillReferences: boolean;
  }
): Promise<VideoSegment[]> {
  const analyzedSegments = [...segments];
  
  // Process segments in batches to avoid making too many API calls
  const batchSize = 5;
  for (let i = 0; i < analyzedSegments.length; i += batchSize) {
    const batch = analyzedSegments.slice(i, i + batchSize);
    
    // Process batch with GPT
    const batchPrompt = `
      Analyze the following segments from a ${committeeName} committee meeting transcript.
      For each segment, identify:
      
      1. Bill references (bill IDs like HB123, SB45, etc.)
      2. Key topics discussed (up to 3 per segment)
      ${options.includeSentimentAnalysis ? '3. Sentiment (positive, negative, neutral, or mixed)' : ''}
      4. Importance level (1-10, where 10 is most important)
      5. Tags (e.g., "procedural", "testimony", "question", "vote", "debate", etc.)
      
      Format your response as a JSON array with one object per segment.
      
      Segments to analyze:
      ${batch.map((segment, index) => `
        Segment ${i + index + 1}:
        Speaker: ${segment.speakerName || 'Unknown'} ${segment.speakerRole ? `(${segment.speakerRole})` : ''}
        Transcript: ${segment.transcript}
      `).join('\n')}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are an expert legislative analyst who can extract key information from committee meeting transcripts. Respond only with the requested JSON format."
        },
        {
          role: "user",
          content: batchPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const results = JSON.parse(content);
    
    // Update the segments with the analysis results
    if (Array.isArray(results.segments)) {
      results.segments.forEach((result: any, index: number) => {
        const segmentIndex = i + index;
        if (segmentIndex < analyzedSegments.length) {
          // Update the segment with analysis results
          if (result.billReferences) {
            analyzedSegments[segmentIndex].billReferences = result.billReferences.map((ref: string) => ({
              billId: ref,
              confidence: 0.9 // Default confidence
            }));
          }
          
          if (result.keyTopics) {
            analyzedSegments[segmentIndex].keyTopics = result.keyTopics;
          }
          
          if (options.includeSentimentAnalysis && result.sentiment) {
            analyzedSegments[segmentIndex].sentiment = result.sentiment;
          }
          
          if (result.importance) {
            analyzedSegments[segmentIndex].importance = result.importance;
          }
          
          if (result.tags) {
            analyzedSegments[segmentIndex].tags = result.tags;
          }
        }
      });
    }
  }
  
  return analyzedSegments;
}

/**
 * Generate a summary of the meeting based on the analyzed segments
 */
async function generateMeetingSummary(
  segments: VideoSegment[],
  meeting: any
): Promise<{
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  procedureNotes: string[];
}> {
  // Generate a meeting summary using GPT
  const summaryPrompt = `
    Generate a comprehensive summary of the following ${meeting.committee.name} committee meeting 
    held on ${meeting.date.toLocaleDateString()}.
    
    Title: ${meeting.title || 'Committee Meeting'}
    
    Based on the following transcript segments:
    ${segments.slice(0, 15).map((segment, index) => `
      [${formatTime(segment.startTime)}] ${segment.speakerName || 'Unknown'} ${segment.speakerRole ? `(${segment.speakerRole})` : ''}:
      "${segment.transcript.substring(0, 200)}${segment.transcript.length > 200 ? '...' : ''}"
      
      Bill References: ${segment.billReferences.map(ref => ref.billId).join(', ') || 'None'}
      Key Topics: ${segment.keyTopics.join(', ') || 'None'}
      Importance: ${segment.importance}/10
    `).join('\n')}
    ${segments.length > 15 ? `\n...and ${segments.length - 15} more segments` : ''}
    
    Please provide:
    1. A concise yet comprehensive summary (300-500 words)
    2. 5-10 key points from the meeting
    3. 3-5 recommended actions or follow-ups
    4. 2-3 notes on procedural matters or parliamentary process observed
    
    Format your response as a JSON object with these four sections.
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    messages: [
      {
        role: "system",
        content: "You are an expert legislative analyst who can summarize committee meetings effectively. Respond only with the requested JSON format."
      },
      {
        role: "user",
        content: summaryPrompt
      }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" }
  });
  
  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content);
  
  return {
    summary: result.summary || "No summary available",
    keyPoints: result.keyPoints || [],
    recommendations: result.recommendations || [],
    procedureNotes: result.procedureNotes || []
  };
}

/**
 * Group segments by bill reference and generate a summary for each bill
 */
function groupSegmentsByBill(segments: VideoSegment[]): {
  billId: string;
  segmentIndices: number[];
  summary: string;
}[] {
  // Group segments by bill reference
  const billMap: Record<string, number[]> = {};
  
  segments.forEach((segment, index) => {
    segment.billReferences.forEach(ref => {
      if (!billMap[ref.billId]) {
        billMap[ref.billId] = [];
      }
      billMap[ref.billId].push(index);
    });
  });
  
  // Convert to array
  return Object.entries(billMap).map(([billId, segmentIndices]) => {
    // In a real implementation, we would generate a summary for each bill
    // using GPT, but for development we'll use a placeholder
    const summary = `Discussion about ${billId} covered ${segmentIndices.length} segments.`;
    
    return {
      billId,
      segmentIndices,
      summary
    };
  });
}

/**
 * Store analyzed segments in the database
 */
async function storeSegments(meetingId: number, segments: VideoSegment[]): Promise<void> {
  try {
    // Clear existing segments for this meeting
    // In a production app, you might want to retain historical analyses
    
    // Store each segment
    for (const segment of segments) {
      await db.insert(committeeMeetingTaggedSegments).values({
        meetingId,
        startTime: segment.startTime,
        endTime: segment.endTime,
        transcript: segment.transcript,
        speakerName: segment.speakerName || null,
        speakerRole: segment.speakerRole || null,
        speakerAffiliation: segment.speakerAffiliation || null,
        isPublicTestimony: segment.isPublicTestimony,
        billReferences: JSON.stringify(segment.billReferences),
        keyTopics: JSON.stringify(segment.keyTopics),
        sentiment: segment.sentiment,
        importance: segment.importance,
        isQuestion: segment.isQuestion,
        tags: JSON.stringify(segment.tags),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error: any) {
    console.error("Error storing segments:", error);
    throw error;
  }
}

/**
 * Format seconds as HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}