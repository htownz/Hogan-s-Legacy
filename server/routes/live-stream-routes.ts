import { Router } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { db } from "../db";
import { CustomRequest } from "../types";
import { eq, desc } from "drizzle-orm";
import { committees, committeeMeetings } from "@shared/schema";
import liveCommitteeStream from "../services/live-committee-stream";

const router = Router();

// Get active committees with live streams
router.get("/live-committees", isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const activeCommittees = await liveCommitteeStream.getActiveCommitteesWithLiveStreams();
    return res.json(activeCommittees);
  } catch (error: any) {
    console.error("Error fetching active committees:", error);
    return res.status(500).json({ error: "Failed to fetch active committees" });
  }
});

// Manually trigger a scan for live committee meetings
router.post("/scan-live-meetings", isAuthenticated, async (req: CustomRequest, res) => {
  try {
    // For now, allow any authenticated user to trigger a scan
    // In a production environment, this should be restricted to admin users
    
    await liveCommitteeStream.scanForLiveCommitteeMeetings();
    return res.json({ success: true, message: "Scan initiated" });
  } catch (error: any) {
    console.error("Error initiating scan:", error);
    return res.status(500).json({ error: "Failed to initiate scan" });
  }
});

// Get live stream segments for a committee meeting
router.get("/committee-meetings/:id/live-segments", isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    // Allow limit to be specified as a query parameter
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const segments = await liveCommitteeStream.getLiveStreamSegments(meetingId, limit);
    return res.json(segments);
  } catch (error: any) {
    console.error("Error fetching live segments:", error);
    return res.status(500).json({ error: "Failed to fetch live segments" });
  }
});

// Get live stream quotes for a committee meeting
router.get("/committee-meetings/:id/live-quotes", isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }
    
    // Allow limit to be specified as a query parameter
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const quotes = await liveCommitteeStream.getLiveStreamQuotes(meetingId, limit);
    return res.json(quotes);
  } catch (error: any) {
    console.error("Error fetching live quotes:", error);
    return res.status(500).json({ error: "Failed to fetch live quotes" });
  }
});

export default router;