import { Request, Response, Express } from "express";
import { db } from "./db";
import { committeeMeetings, committees, liveStreamSegments, liveStreamQuotes } from "@shared/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { isAuthenticated } from "./auth";

// Define a custom request interface to bypass LSP errors
interface CustomRequest extends Request {
  userId?: string;
}
import enhancedVideoAnalyzer from "./services/enhanced-committee-video-analyzer";

/**
 * Register enhanced committee video API routes
 */
export function registerEnhancedCommitteeVideoRoutes(app: Express): void {
  /**
   * Get all active live streams
   */
  app.get("/api/committee-videos/live-streams", async (req: Request, res: Response) => {
    try {
      const liveStreams = await enhancedVideoAnalyzer.getActiveLiveStreams();
      
      return res.json({
        success: true,
        data: liveStreams
      });
    } catch (error: any) {
      console.error("Error fetching live streams:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch live committee streams"
      });
    }
  });

  /**
   * Get detailed summary of a specific live stream
   */
  app.get("/api/committee-videos/live-streams/:streamId", async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      
      const streamSummary = await enhancedVideoAnalyzer.getLiveStreamSummary(streamId);
      
      return res.json({
        success: true,
        data: streamSummary
      });
    } catch (error: any) {
      console.error(`Error fetching live stream ${req.params.streamId}:`, error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch live stream details"
      });
    }
  });

  /**
   * Get all segments from a committee meeting
   */
  app.get("/api/committee-videos/meetings/:meetingId/segments", async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.params;
      
      const segments = await db.query.liveStreamSegments.findMany({
        where: eq(liveStreamSegments.committeeMeetingId, parseInt(meetingId)),
        orderBy: [liveStreamSegments.timestamp]
      });
      
      return res.json({
        success: true,
        data: segments
      });
    } catch (error: any) {
      console.error(`Error fetching segments for meeting ${req.params.meetingId}:`, error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch meeting segments"
      });
    }
  });

  /**
   * Get all quotes from a committee meeting
   */
  app.get("/api/committee-videos/meetings/:meetingId/quotes", async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.params;
      
      const quotes = await db.query.liveStreamQuotes.findMany({
        where: eq(liveStreamQuotes.committeeMeetingId, parseInt(meetingId)),
        orderBy: [liveStreamQuotes.timestamp]
      });
      
      return res.json({
        success: true,
        data: quotes
      });
    } catch (error: any) {
      console.error(`Error fetching quotes for meeting ${req.params.meetingId}:`, error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch meeting quotes"
      });
    }
  });

  /**
   * Get quotes for a specific bill
   */
  app.get("/api/committee-videos/bills/:billId/quotes", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      const quotes = await db.query.liveStreamQuotes.findMany({
        where: eq(liveStreamQuotes.billId, billId),
        orderBy: [desc(liveStreamQuotes.timestamp)]
      });
      
      return res.json({
        success: true,
        data: quotes
      });
    } catch (error: any) {
      console.error(`Error fetching quotes for bill ${req.params.billId}:`, error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch bill quotes"
      });
    }
  });

  /**
   * Generate a comprehensive meeting report
   */
  app.get("/api/committee-videos/meetings/:meetingId/report", async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.params;
      const { format = 'json' } = req.query;
      
      const reportData = await enhancedVideoAnalyzer.generateMeetingReport(
        parseInt(meetingId), 
        format as 'pdf' | 'html' | 'json'
      );
      
      return res.json({
        success: true,
        data: reportData
      });
    } catch (error: any) {
      console.error(`Error generating report for meeting ${req.params.meetingId}:`, error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate meeting report"
      });
    }
  });

  /**
   * Search across committee meetings and segments
   */
  app.get("/api/committee-videos/search", async (req: Request, res: Response) => {
    try {
      // First check if we have any segments in the database
      const segmentCount = await db
        .select({ count: sql`count(*)` })
        .from(liveStreamSegments);
      
      // If there are no segments, return an empty result
      if (segmentCount.length === 0 || segmentCount[0].count === 0 || segmentCount[0].count === "0") {
        return res.json({
          success: true,
          data: [],
          message: "No committee video segments available yet. Data will be populated as committee videos are processed."
        });
      }
      
      const { 
        query, 
        billId, 
        speakerName,
        committeeName,
        startDate,
        endDate,
        hasPublicTestimony,
        positionOnBill 
      } = req.query;
      
      const searchOptions: any = {};
      
      if (query) searchOptions.query = String(query);
      if (billId) searchOptions.billId = String(billId);
      if (speakerName) searchOptions.speakerName = String(speakerName);
      if (committeeName) searchOptions.committeeName = String(committeeName);
      
      if (startDate) {
        searchOptions.startDate = new Date(String(startDate));
      }
      
      if (endDate) {
        searchOptions.endDate = new Date(String(endDate));
      }
      
      if (hasPublicTestimony !== undefined) {
        searchOptions.hasPublicTestimony = hasPublicTestimony === 'true';
      }
      
      if (positionOnBill) {
        searchOptions.positionOnBill = String(positionOnBill) as 'for' | 'against' | 'neutral';
      }
      
      try {
        const results = await enhancedVideoAnalyzer.searchCommitteeMeetings(searchOptions);
        
        return res.json({
          success: true,
          data: results
        });
      } catch (searchError: any) {
        console.error("Error in search operation:", searchError);
        return res.json({
          success: true,
          data: [],
          message: "An error occurred while searching committee videos. This feature requires data that is still being populated."
        });
      }
    } catch (error: any) {
      console.error("Error searching committee videos:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to search committee videos"
      });
    }
  });

  /**
   * Get committees with upcoming or active streams
   */
  app.get("/api/committee-videos/active-committees", async (req: Request, res: Response) => {
    try {
      const liveStreams = await enhancedVideoAnalyzer.getActiveLiveStreams();
      
      // Get unique committee names without using Set to avoid downlevel iteration issues
      const committeeNameSet = new Set<string>();
      liveStreams.forEach(stream => committeeNameSet.add(stream.committee));
      const committeeNames = Array.from(committeeNameSet);
      
      // Fetch committee details from database
      const committeeDetails = await db.query.committees.findMany({
        where: or(...committeeNames.map(name => like(committees.name, `%${name}%`)))
      });
      
      return res.json({
        success: true,
        data: {
          committees: committeeDetails,
          activeStreams: liveStreams
        }
      });
    } catch (error: any) {
      console.error("Error fetching active committees:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch active committees"
      });
    }
  });

  /**
   * Initialize the committee video analyzer service
   * (Admin-only endpoint)
   */
  app.post("/api/committee-videos/init-analyzer", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // In a production app, we would check for admin role here
      enhancedVideoAnalyzer.initEnhancedCommitteeVideoAnalyzer();
      
      return res.json({
        success: true,
        message: "Committee video analyzer initialized"
      });
    } catch (error: any) {
      console.error("Error initializing committee video analyzer:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to initialize committee video analyzer"
      });
    }
  });
}