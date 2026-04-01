import { Router } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { db } from "../db";
import { CustomRequest } from "../types";
import { eq, and, inArray } from "drizzle-orm";
import { committees, committeeMeetings, bills } from "@shared/schema";
import committeeVideoProcessor from "../services/committee-video-processor";
import { createLogger } from "../logger";
const log = createLogger("committee-video-routes");


const router = Router();

// Get committee meeting summary
router.get("/committee-meetings/:id/summary", isAuthenticated, async (req: CustomRequest, res) => {
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
    
    if (!meeting.summaryJson) {
      return res.status(404).json({ error: "No summary available for this meeting" });
    }
    
    // Parse the JSON summary
    try {
      const summary = JSON.parse(meeting.summaryJson);
      return res.json(summary);
    } catch (error: any) {
      log.error({ err: error }, "Error parsing meeting summary JSON");
      return res.status(500).json({ error: "Failed to parse meeting summary" });
    }
  } catch (error: any) {
    log.error({ err: error }, "Error fetching committee meeting summary");
    res.status(500).json({ error: "Failed to fetch committee meeting summary" });
  }
});

// Get processing status
router.get("/committee-meetings/:id/process-status", isAuthenticated, async (req: CustomRequest, res) => {
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
    
    // Return the processing status
    return res.json({
      status: meeting.processingStatus || "none",
      lastUpdated: meeting.lastUpdated?.toISOString() || new Date().toISOString()
    });
  } catch (error: any) {
    log.error({ err: error }, "Error fetching processing status");
    res.status(500).json({ error: "Failed to fetch processing status" });
  }
});

// Process committee meeting video
router.post("/committee-meetings/:id/process-video", isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
      with: {
        committee: true
      }
    });
    
    if (!meeting) {
      return res.status(404).json({ error: "Committee meeting not found" });
    }
    
    if (!meeting.videoUrl) {
      return res.status(400).json({ error: "No video URL available for this meeting" });
    }
    
    // Update status to pending
    await db.update(committeeMeetings)
      .set({ 
        processingStatus: "pending",
        lastUpdated: new Date()
      })
      .where(eq(committeeMeetings.id, meetingId));
    
    // Start processing in background
    committeeVideoProcessor.processVideo(meeting, meeting.committee)
      .then(() => {
        log.info(`Successfully processed video for meeting ${meetingId}`);
      })
      .catch((err) => {
        log.error({ err: err }, `Error processing video for meeting ${meetingId}`);
        // Update status to failed
        db.update(committeeMeetings)
          .set({ 
            processingStatus: "failed",
            lastUpdated: new Date()
          })
          .where(eq(committeeMeetings.id, meetingId))
          .then(() => {
            log.info(`Updated meeting ${meetingId} status to failed`);
          })
          .catch((updateErr) => {
            log.error({ err: updateErr }, `Failed to update meeting ${meetingId} status`);
          });
      });
    
    // Return success response immediately
    return res.json({ 
      success: true, 
      message: "Video processing started" 
    });
  } catch (error: any) {
    log.error({ err: error }, "Error starting video processing");
    res.status(500).json({ error: "Failed to start video processing" });
  }
});

// Get video segments for a meeting
router.get("/committee-meetings/:id/video-segments", isAuthenticated, async (req: CustomRequest, res) => {
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
    
    if (!meeting.summaryJson) {
      return res.status(404).json({ error: "No summary available for this meeting" });
    }
    
    // Parse the JSON summary and extract video segments
    try {
      const summary = JSON.parse(meeting.summaryJson);
      if (!summary.videoSegments) {
        return res.status(404).json({ error: "No video segments available for this meeting" });
      }
      return res.json(summary.videoSegments);
    } catch (error: any) {
      log.error({ err: error }, "Error parsing meeting summary JSON");
      return res.status(500).json({ error: "Failed to parse meeting summary" });
    }
  } catch (error: any) {
    log.error({ err: error }, "Error fetching video segments");
    res.status(500).json({ error: "Failed to fetch video segments" });
  }
});

// Get speaker segments for a bill discussion
router.get("/committee-meetings/:id/bill/:billId/speaker-segments", isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const billId = req.params.billId;
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    const meeting = await db.query.committeeMeetings.findFirst({
      where: eq(committeeMeetings.id, meetingId),
    });
    
    if (!meeting) {
      return res.status(404).json({ error: "Committee meeting not found" });
    }
    
    if (!meeting.summaryJson) {
      return res.status(404).json({ error: "No summary available for this meeting" });
    }
    
    // Parse the JSON summary and extract speaker segments for the specified bill
    try {
      const summary = JSON.parse(meeting.summaryJson);
      const billDiscussion = summary.billDiscussions?.find(
        (discussion: any) => discussion.billId.toLowerCase() === billId.toLowerCase()
      );
      
      if (!billDiscussion || !billDiscussion.speakerSegments) {
        return res.status(404).json({ error: "No speaker segments available for this bill" });
      }
      
      return res.json(billDiscussion.speakerSegments);
    } catch (error: any) {
      log.error({ err: error }, "Error parsing meeting summary JSON");
      return res.status(500).json({ error: "Failed to parse meeting summary" });
    }
  } catch (error: any) {
    log.error({ err: error }, "Error fetching speaker segments");
    res.status(500).json({ error: "Failed to fetch speaker segments" });
  }
});

// Get impact assessments for bills discussed in a meeting
router.get("/committee-meetings/:id/impact-assessments", isAuthenticated, async (req: CustomRequest, res) => {
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
    
    if (!meeting.summaryJson) {
      return res.status(404).json({ error: "No summary available for this meeting" });
    }
    
    // Parse the JSON summary and extract impact assessments for all bills
    try {
      const summary = JSON.parse(meeting.summaryJson);
      const impactAssessments = summary.billDiscussions?.reduce((acc: any, discussion: any) => {
        if (discussion.impactAssessment) {
          acc[discussion.billId] = discussion.impactAssessment;
        }
        return acc;
      }, {});
      
      if (!impactAssessments || Object.keys(impactAssessments).length === 0) {
        return res.status(404).json({ error: "No impact assessments available for this meeting" });
      }
      
      return res.json(impactAssessments);
    } catch (error: any) {
      log.error({ err: error }, "Error parsing meeting summary JSON");
      return res.status(500).json({ error: "Failed to parse meeting summary" });
    }
  } catch (error: any) {
    log.error({ err: error }, "Error fetching impact assessments");
    res.status(500).json({ error: "Failed to fetch impact assessments" });
  }
});

// Get sentiment analysis for public testimonies
router.get("/committee-meetings/:id/testimony-sentiment", isAuthenticated, async (req: CustomRequest, res) => {
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
    
    if (!meeting.summaryJson) {
      return res.status(404).json({ error: "No summary available for this meeting" });
    }
    
    // Parse the JSON summary and extract sentiment analysis for testimonies
    try {
      const summary = JSON.parse(meeting.summaryJson);
      if (!summary.publicTestimonies || summary.publicTestimonies.length === 0) {
        return res.status(404).json({ error: "No public testimonies available for this meeting" });
      }
      
      const sentimentAnalysis = summary.publicTestimonies.map((testimony: any) => ({
        speakerName: testimony.speakerName,
        organization: testimony.organization,
        position: testimony.position,
        sentimentScore: testimony.sentimentScore || 0,
        expertiseLevel: testimony.expertiseLevel || 'citizen'
      }));
      
      return res.json(sentimentAnalysis);
    } catch (error: any) {
      log.error({ err: error }, "Error parsing meeting summary JSON");
      return res.status(500).json({ error: "Failed to parse meeting summary" });
    }
  } catch (error: any) {
    log.error({ err: error }, "Error fetching testimony sentiment analysis");
    res.status(500).json({ error: "Failed to fetch testimony sentiment analysis" });
  }
});

export default router;