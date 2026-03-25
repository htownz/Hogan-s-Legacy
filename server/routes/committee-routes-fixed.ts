import express from "express";
import { eq, desc, gt } from "drizzle-orm";
import { committees, committeeMeetings } from "@shared/schema";
import { db } from "../db";
import committeeVideoProcessor from "../services/committee-video-processor";
import { isAuthenticated } from "../auth";

const router = express.Router();

// Get all committees
router.get("/committees", async (req, res) => {
  try {
    const allCommittees = await db.query.committees.findMany({
      orderBy: committees.name,
    });
    res.json(allCommittees);
  } catch (error: any) {
    console.error("Error fetching committees:", error);
    res.status(500).json({ error: "Failed to fetch committees" });
  }
});

// Get committee by ID
router.get("/committees/:id", async (req, res) => {
  try {
    const committeeId = parseInt(req.params.id);
    
    if (isNaN(committeeId)) {
      return res.status(400).json({ error: "Invalid committee ID" });
    }
    
    const committee = await db.query.committees.findFirst({
      where: eq(committees.id, committeeId),
    });
    
    if (!committee) {
      return res.status(404).json({ error: "Committee not found" });
    }
    
    res.json(committee);
  } catch (error: any) {
    console.error("Error fetching committee:", error);
    res.status(500).json({ error: "Failed to fetch committee" });
  }
});

// Get meetings for a specific committee
router.get("/committees/:id/meetings", async (req, res) => {
  try {
    const committeeId = parseInt(req.params.id);
    
    if (isNaN(committeeId)) {
      return res.status(400).json({ error: "Invalid committee ID" });
    }
    
    const meetings = await db.query.committeeMeetings.findMany({
      where: eq(committeeMeetings.committeeId, committeeId),
      orderBy: desc(committeeMeetings.date),
    });
    
    res.json(meetings);
  } catch (error: any) {
    console.error("Error fetching committee meetings:", error);
    res.status(500).json({ error: "Failed to fetch committee meetings" });
  }
});

// Get all committee meetings
router.get("/committee-meetings", async (req, res) => {
  try {
    const allMeetings = await db.query.committeeMeetings.findMany({
      orderBy: desc(committeeMeetings.date),
    });
    res.json(allMeetings);
  } catch (error: any) {
    console.error("Error fetching committee meetings:", error);
    res.status(500).json({ error: "Failed to fetch committee meetings" });
  }
});

// Get all upcoming committee meetings
// This route must be defined BEFORE the /:id route to avoid conflicts
router.get("/committee-meetings/upcoming", async (req, res) => {
  try {
    const today = new Date();
    
    const upcomingMeetings = await db.query.committeeMeetings.findMany({
      where: gt(committeeMeetings.date, today),
      orderBy: committeeMeetings.date,
    });
    
    res.json(upcomingMeetings);
  } catch (error: any) {
    console.error("Error fetching upcoming committee meetings:", error);
    res.status(500).json({ error: "Failed to fetch upcoming committee meetings" });
  }
});

// Get committee meeting by ID
router.get("/committee-meetings/:id", async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
    });
    
    if (!meeting) {
      return res.status(404).json({ error: "Committee meeting not found" });
    }
    
    // Get associated committee
    const committee = await db.query.committees.findFirst({
      where: eq(committees.id, meeting.committeeId),
    });
    
    res.json({
      ...meeting,
      committee: committee,
    });
  } catch (error: any) {
    console.error("Error fetching committee meeting:", error);
    res.status(500).json({ error: "Failed to fetch committee meeting" });
  }
});

// Get meeting summary
router.get("/committee-meetings/:id/summary", async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
    });
    
    if (!meeting) {
      return res.status(404).json({ error: "Committee meeting not found" });
    }
    
    if (!meeting.summarySummary) {
      return res.status(404).json({ 
        error: "Meeting summary not found", 
        status: meeting.summaryStatus || "not_started"
      });
    }
    
    res.json({
      summary: meeting.summarySummary,
      keyPoints: meeting.summaryKeyPoints,
      billDiscussions: meeting.summaryBillDiscussions,
      publicTestimonies: meeting.summaryPublicTestimonies,
      status: meeting.summaryStatus,
      lastUpdated: meeting.summaryLastUpdated
    });
  } catch (error: any) {
    console.error("Error fetching meeting summary:", error);
    res.status(500).json({ error: "Failed to fetch meeting summary" });
  }
});

// Request video processing for a meeting
router.post("/committee-meetings/:id/process-video", isAuthenticated, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
    });
    
    if (!meeting) {
      return res.status(404).json({ error: "Committee meeting not found" });
    }
    
    if (!meeting.videoUrl) {
      return res.status(400).json({ error: "Meeting has no video URL" });
    }
    
    // Check if already processing or completed
    if (meeting.summaryStatus === "processing") {
      return res.status(409).json({ 
        error: "Video is already being processed",
        status: "processing"
      });
    }
    
    if (meeting.summaryStatus === "completed" && meeting.summarySummary) {
      return res.status(409).json({ 
        error: "Video has already been processed",
        status: "completed"
      });
    }
    
    // Queue the meeting for processing
    const success = await committeeVideoProcessor.queueMeetingForProcessing(meetingId);
    
    if (success) {
      res.status(202).json({ 
        message: "Video processing started", 
        status: "pending"
      });
    } else {
      res.status(500).json({ error: "Failed to start video processing" });
    }
  } catch (error: any) {
    console.error("Error starting video processing:", error);
    res.status(500).json({ error: "Failed to start video processing" });
  }
});

// Check video processing status
router.get("/committee-meetings/:id/process-status", async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
      columns: {
        id: true,
        summaryStatus: true,
        summaryLastUpdated: true
      }
    });
    
    if (!meeting) {
      return res.status(404).json({ error: "Committee meeting not found" });
    }
    
    res.json({
      status: meeting.summaryStatus || "not_started",
      lastUpdated: meeting.summaryLastUpdated
    });
  } catch (error: any) {
    console.error("Error checking processing status:", error);
    res.status(500).json({ error: "Failed to check processing status" });
  }
});

export const registerCommitteeRoutes = (app: express.Express) => {
  app.use('/api', router);
};

export default router;