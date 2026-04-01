// @ts-nocheck
import { Request, Response, Express } from 'express';
import { z } from 'zod';
import { db } from './db';
import { committeeMeetings } from '@shared/schema';
import { committeeMeetingTaggedSegments } from '@shared/schema-committee-videos';
import { eq, desc, and } from 'drizzle-orm';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { analyzeCommitteeVideo } from './services/committee-video-analyzer';
import { createLogger } from "./logger";
const log = createLogger("routes-committee-videos");


// Validation schema for committee video analysis request
const videoAnalysisSchema = z.object({
  includeTranscript: z.boolean().default(true),
  includeSentimentAnalysis: z.boolean().default(true),
  tagBillReferences: z.boolean().default(true),
  segmentByTopic: z.boolean().default(true),
  segmentBySpeaker: z.boolean().default(true),
});

/**
 * Register committee video API routes
 */
export function registerCommitteeVideoRoutes(app: Express): void {
  // Get committee meetings list
  app.get('/api/committee-meetings', async (req: Request, res: Response) => {
    try {
      const { committee, status, date } = req.query;
      
      // Build query with filters
      let query = db.select().from(committeeMeetings).$dynamic();
      
      if (committee) {
        query = query.where(eq(committeeMeetings.committeeId, parseInt(committee as string)));
      }
      
      if (status) {
        query = query.where(eq(committeeMeetings.processingStatus, status as string));
      }
      
      if (date) {
        const dateObj = new Date(date as string);
        if (!isNaN(dateObj.getTime())) {
          // Only compare the date part, not the time
          const startOfDay = new Date(dateObj);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(dateObj);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query.where(
            and(
              db.sql`${committeeMeetings.date} >= ${startOfDay}`,
              db.sql`${committeeMeetings.date} <= ${endOfDay}`
            )
          );
        }
      }
      
      // Order by date descending (most recent first)
      query = query.orderBy(desc(committeeMeetings.date));
      
      const meetings = await query;
      
      res.json(meetings);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching committee meetings");
      res.status(500).json({ message: "Error fetching committee meetings" });
    }
  });

  // Get single committee meeting
  app.get('/api/committee-meetings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const meeting = await db.query.committeeMeetings.findFirst({
        where: eq(committeeMeetings.id, parseInt(id)),
        with: {
          committee: true
        }
      });
      
      if (!meeting) {
        return res.status(404).json({ message: "Committee meeting not found" });
      }
      
      res.json(meeting);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching committee meeting");
      res.status(500).json({ message: "Error fetching committee meeting" });
    }
  });

  // Get tagged segments for a committee meeting
  app.get('/api/committee-meetings/:id/segments', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { billId, speakerName, tag } = req.query;
      
      // Start building the query
      let query = db
        .select()
        .from(committeeMeetingTaggedSegments).$dynamic()
        .where(eq(committeeMeetingTaggedSegments.meetingId, parseInt(id)))
        .orderBy(committeeMeetingTaggedSegments.startTime);
      
      const segments = await query;
      
      // Apply filters on the JavaScript side for complex JSON filtering
      // This could be done more efficiently in a full production implementation
      let filteredSegments = segments;
      
      if (billId) {
        filteredSegments = filteredSegments.filter(segment => {
          const billRefs = JSON.parse(segment.billReferences as string || '[]');
          return billRefs.some((ref: any) => ref.billId === billId);
        });
      }
      
      if (speakerName) {
        filteredSegments = filteredSegments.filter(segment => {
          return segment.speakerName && segment.speakerName.toLowerCase().includes((speakerName as string).toLowerCase());
        });
      }
      
      if (tag) {
        filteredSegments = filteredSegments.filter(segment => {
          const tags = JSON.parse(segment.tags as string || '[]');
          return tags.includes(tag);
        });
      }
      
      res.json(filteredSegments);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching meeting segments");
      res.status(500).json({ message: "Error fetching meeting segments" });
    }
  });

  // Analyze committee meeting video
  app.post('/api/committee-meetings/:id/analyze', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const meetingId = parseInt(req.params.id);
      
      if (isNaN(meetingId)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      const meeting = await db.query.committeeMeetings.findFirst({
        where: eq(committeeMeetings.id, meetingId),
        with: {
          committee: true
        }
      });
      
      if (!meeting) {
        return res.status(404).json({ message: "Committee meeting not found" });
      }
      
      if (!meeting.videoUrl) {
        return res.status(400).json({ message: "No video URL available for this meeting" });
      }
      
      // Validate request options
      const validationResult = videoAnalysisSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid analysis options", 
          errors: validationResult.error.errors 
        });
      }
      
      const options = validationResult.data;
      
      // Update status to processing
      await db.update(committeeMeetings)
        .set({ 
          processingStatus: "processing",
          lastUpdated: new Date()
        })
        .where(eq(committeeMeetings.id, meetingId));
      
      // Start the analysis process asynchronously
      // In a production app, this would be handled by a queue or a background job
      const analysisPromise = analyzeCommitteeVideo(meetingId, options)
        .then(async (result) => {
          // Update the meeting with the analysis data
          await db.update(committeeMeetings)
            .set({
              processingStatus: "completed",
              lastUpdated: new Date(),
              summarySummary: result.summary,
              summaryKeyPoints: JSON.stringify(result.keyFindings),
              summaryBillDiscussions: JSON.stringify(result.billDiscussions),
              summaryStatus: "completed",
              summaryLastUpdated: new Date()
            })
            .where(eq(committeeMeetings.id, meetingId));
            
          log.info(`Successfully analyzed video for meeting ${meetingId}`);
        })
        .catch(async (error) => {
          log.error({ err: error }, `Error analyzing video for meeting ${meetingId}`);
          
          // Update status to failed
          await db.update(committeeMeetings)
            .set({ 
              processingStatus: "failed",
              lastUpdated: new Date(),
              summaryStatus: "failed",
              summaryLastUpdated: new Date()
            })
            .where(eq(committeeMeetings.id, meetingId));
        });
      
      // Return immediate response to the client
      return res.status(202).json({ 
        message: "Video analysis started",
        meetingId,
        status: "processing"
      });
    } catch (error: any) {
      log.error({ err: error }, "Error initiating video analysis");
      return res.status(500).json({ 
        message: "Failed to initiate video analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get tagged segments statistics for a meeting
  app.get('/api/committee-meetings/:id/segments/stats', async (req: Request, res: Response) => {
    try {
      const meetingId = parseInt(req.params.id);
      
      if (isNaN(meetingId)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      // Get all segments for the meeting
      const segments = await db
        .select()
        .from(committeeMeetingTaggedSegments).$dynamic()
        .where(eq(committeeMeetingTaggedSegments.meetingId, meetingId));
      
      if (segments.length === 0) {
        return res.json({
          totalSegments: 0,
          totalDuration: 0,
          speakerBreakdown: {},
          topicBreakdown: {},
          billReferencesCount: {},
          sentimentBreakdown: {},
          publicTestimonyPercentage: 0
        });
      }
      
      // Calculate total duration
      const totalDuration = segments.reduce((total, segment) => {
        return total + (segment.endTime - segment.startTime);
      }, 0);
      
      // Speaker breakdown
      const speakerMap: Record<string, number> = {};
      segments.forEach(segment => {
        const speaker = segment.speakerName || 'Unknown';
        speakerMap[speaker] = (speakerMap[speaker] || 0) + 1;
      });
      
      // Topic breakdown
      const topicMap: Record<string, number> = {};
      segments.forEach(segment => {
        const topics = JSON.parse(segment.keyTopics as string || '[]');
        topics.forEach((topic: string) => {
          topicMap[topic] = (topicMap[topic] || 0) + 1;
        });
      });
      
      // Bill references count
      const billMap: Record<string, number> = {};
      segments.forEach(segment => {
        const billRefs = JSON.parse(segment.billReferences as string || '[]');
        billRefs.forEach((ref: any) => {
          billMap[ref.billId] = (billMap[ref.billId] || 0) + 1;
        });
      });
      
      // Sentiment breakdown
      const sentimentMap: Record<string, number> = {};
      segments.forEach(segment => {
        sentimentMap[segment.sentiment] = (sentimentMap[segment.sentiment] || 0) + 1;
      });
      
      // Public testimony percentage
      const publicTestimonyCount = segments.filter(segment => segment.isPublicTestimony).length;
      const publicTestimonyPercentage = (publicTestimonyCount / segments.length) * 100;
      
      res.json({
        totalSegments: segments.length,
        totalDuration,
        durationFormatted: formatDuration(totalDuration),
        speakerBreakdown: speakerMap,
        topicBreakdown: topicMap,
        billReferencesCount: billMap,
        sentimentBreakdown: sentimentMap,
        publicTestimonyPercentage: Math.round(publicTestimonyPercentage)
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching segment statistics");
      res.status(500).json({ message: "Error fetching segment statistics" });
    }
  });

  // Search across all committee meeting segments
  app.get('/api/committee-meetings/segments/search', async (req: Request, res: Response) => {
    try {
      const { query, billId, committeeId, startDate, endDate } = req.query;
      
      if (!query && !billId) {
        return res.status(400).json({ message: "Either query or billId parameter is required" });
      }
      
      // Start building the query
      let dbQuery = db
        .select({
          segment: committeeMeetingTaggedSegments,
          meeting: {
            id: committeeMeetings.id,
            title: committeeMeetings.title,
            date: committeeMeetings.date,
            committeeId: committeeMeetings.committeeId
          }
        })
        .from(committeeMeetingTaggedSegments).$dynamic()
        .innerJoin(committeeMeetings, 
          eq(committeeMeetingTaggedSegments.meetingId, committeeMeetings.id)
        );
      
      // Apply committee filter if specified
      if (committeeId) {
        dbQuery = dbQuery.where(eq(committeeMeetings.committeeId, parseInt(committeeId as string)));
      }
      
      // Apply date range filter if specified
      if (startDate) {
        const startDateObj = new Date(startDate as string);
        if (!isNaN(startDateObj.getTime())) {
          dbQuery = dbQuery.where(db.sql`${committeeMeetings.date} >= ${startDateObj}`);
        }
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        if (!isNaN(endDateObj.getTime())) {
          dbQuery = dbQuery.where(db.sql`${committeeMeetings.date} <= ${endDateObj}`);
        }
      }
      
      // Execute the query
      const results = await dbQuery;
      
      // Filter results based on text search or bill ID
      // In a production app, this would be done using database full-text search
      let filteredResults = results;
      
      if (query) {
        const searchTerm = (query as string).toLowerCase();
        filteredResults = filteredResults.filter(result => {
          return result.segment.transcript && 
                 result.segment.transcript.toLowerCase().includes(searchTerm);
        });
      }
      
      if (billId) {
        filteredResults = filteredResults.filter(result => {
          const billRefs = JSON.parse(result.segment.billReferences as string || '[]');
          return billRefs.some((ref: any) => ref.billId === billId);
        });
      }
      
      // Format the response
      const formattedResults = filteredResults.map(result => ({
        segmentId: result.segment.id,
        meetingId: result.meeting.id,
        meetingTitle: result.meeting.title,
        meetingDate: result.meeting.date,
        committeeId: result.meeting.committeeId,
        startTime: result.segment.startTime,
        endTime: result.segment.endTime,
        transcript: result.segment.transcript,
        speakerName: result.segment.speakerName,
        speakerRole: result.segment.speakerRole,
        importance: result.segment.importance,
        billReferences: JSON.parse(result.segment.billReferences as string || '[]'),
        keyTopics: JSON.parse(result.segment.keyTopics as string || '[]'),
        tags: JSON.parse(result.segment.tags as string || '[]')
      }));
      
      res.json({
        count: formattedResults.length,
        results: formattedResults
      });
    } catch (error: any) {
      log.error({ err: error }, "Error searching committee meeting segments");
      res.status(500).json({ message: "Error searching committee meeting segments" });
    }
  });
}

/**
 * Format duration in seconds to a human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let formatted = '';
  if (hours > 0) {
    formatted += `${hours} hour${hours === 1 ? '' : 's'} `;
  }
  if (minutes > 0 || hours > 0) {
    formatted += `${minutes} minute${minutes === 1 ? '' : 's'} `;
  }
  formatted += `${secs} second${secs === 1 ? '' : 's'}`;
  
  return formatted;
}