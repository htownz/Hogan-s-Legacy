import express from "express";
import { z } from "zod";
import { collaborativeStorage } from "./storage-collaborative";
import { 
  insertCollaborativeEditSessionSchema,
  insertSessionParticipantSchema,
  insertCollaborativeChangeSchema,
  insertDocumentVersionSchema, 
  insertDocumentCommentSchema
} from "@shared/schema-collaborative";
import { authenticateJWT } from "./middleware/auth";

const router = express.Router();

// Middleware to ensure user is authenticated
router.use(authenticateJWT);

// ==== Session Management Routes ====

// Create new collaborative session
router.post("/sessions", async (req, res) => {
  try {
    const validated = insertCollaborativeEditSessionSchema.parse({
      ...req.body,
      createdById: req.user?.id
    });
    
    const session = await collaborativeStorage.createSession(validated);
    res.status(201).json(session);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Failed to create session:", error);
      res.status(500).json({ error: "Failed to create collaborative session" });
    }
  }
});

// Get session by ID
router.get("/sessions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const session = await collaborativeStorage.getSessionById(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    res.json(session);
  } catch (error: any) {
    console.error("Failed to get session:", error);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
});

// Update session
router.patch("/sessions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    // Get the session to check ownership (optional)
    const session = await collaborativeStorage.getSessionById(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    // Validate the update data
    const updateData = req.body;
    const updated = await collaborativeStorage.updateSession(id, updateData);
    
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Failed to update session:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  }
});

// List all sessions with pagination
router.get("/sessions", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const sessions = await collaborativeStorage.listSessions(limit, offset);
    res.json(sessions);
  } catch (error: any) {
    console.error("Failed to list sessions:", error);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// List sessions for a specific bill
router.get("/sessions/bill/:billId", async (req, res) => {
  try {
    const billId = req.params.billId;
    const sessions = await collaborativeStorage.listSessionsByBillId(billId);
    res.json(sessions);
  } catch (error: any) {
    console.error("Failed to list sessions for bill:", error);
    res.status(500).json({ error: "Failed to list sessions for bill" });
  }
});

// ==== Participant Management Routes ====

// Join session as participant
router.post("/sessions/:id/participants", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    // Check if session exists
    const session = await collaborativeStorage.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    const validated = insertSessionParticipantSchema.parse({
      sessionId,
      userId: req.user?.id,
      ...req.body
    });
    
    const participant = await collaborativeStorage.addParticipant(validated);
    res.status(201).json(participant);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Failed to join session:", error);
      res.status(500).json({ error: "Failed to join session" });
    }
  }
});

// Leave session (mark participant as left)
router.delete("/sessions/:id/participants", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const success = await collaborativeStorage.removeParticipant(sessionId, req.user.id);
    if (!success) {
      return res.status(404).json({ error: "Participant not found" });
    }
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Failed to leave session:", error);
    res.status(500).json({ error: "Failed to leave session" });
  }
});

// Update participant status (cursor position, etc.)
router.patch("/sessions/:id/participants", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const { cursorPosition } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const success = await collaborativeStorage.updateParticipantStatus(
      sessionId, 
      req.user.id, 
      cursorPosition
    );
    
    if (!success) {
      return res.status(404).json({ error: "Participant not found" });
    }
    
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Failed to update participant status:", error);
    res.status(500).json({ error: "Failed to update participant status" });
  }
});

// List all participants in a session
router.get("/sessions/:id/participants", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const participants = await collaborativeStorage.listSessionParticipants(sessionId);
    res.json(participants);
  } catch (error: any) {
    console.error("Failed to list participants:", error);
    res.status(500).json({ error: "Failed to list participants" });
  }
});

// Get active participants in a session
router.get("/sessions/:id/participants/active", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const participants = await collaborativeStorage.getActiveParticipants(sessionId);
    res.json(participants);
  } catch (error: any) {
    console.error("Failed to get active participants:", error);
    res.status(500).json({ error: "Failed to get active participants" });
  }
});

// ==== Change Tracking Routes ====

// Record a change to the document
router.post("/sessions/:id/changes", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const validated = insertCollaborativeChangeSchema.parse({
      sessionId,
      userId: req.user?.id,
      ...req.body
    });
    
    const change = await collaborativeStorage.recordChange(validated);
    res.status(201).json(change);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Failed to record change:", error);
      res.status(500).json({ error: "Failed to record change" });
    }
  }
});

// Get change history for a session
router.get("/sessions/:id/changes", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const changes = await collaborativeStorage.getSessionChanges(sessionId, limit);
    res.json(changes);
  } catch (error: any) {
    console.error("Failed to get changes:", error);
    res.status(500).json({ error: "Failed to get changes" });
  }
});

// ==== Version Management Routes ====

// Create a new version
router.post("/sessions/:id/versions", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    // Get the current session to get the content
    const session = await collaborativeStorage.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    // Get the latest version to determine the next version number
    const latestVersion = await collaborativeStorage.getLatestVersion(sessionId);
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    
    const validated = insertDocumentVersionSchema.parse({
      sessionId,
      versionNumber: nextVersionNumber,
      content: session.documentContent,
      createdById: req.user?.id,
      changeDescription: req.body.changeDescription || "Version " + nextVersionNumber
    });
    
    const version = await collaborativeStorage.createVersion(validated);
    res.status(201).json(version);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Failed to create version:", error);
      res.status(500).json({ error: "Failed to create version" });
    }
  }
});

// Get a specific version
router.get("/sessions/:id/versions/:versionNumber", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const versionNumber = parseInt(req.params.versionNumber);
    
    if (isNaN(sessionId) || isNaN(versionNumber)) {
      return res.status(400).json({ error: "Invalid session ID or version number" });
    }
    
    const version = await collaborativeStorage.getVersionByNumber(sessionId, versionNumber);
    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }
    
    res.json(version);
  } catch (error: any) {
    console.error("Failed to get version:", error);
    res.status(500).json({ error: "Failed to get version" });
  }
});

// Get the latest version
router.get("/sessions/:id/versions/latest", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const version = await collaborativeStorage.getLatestVersion(sessionId);
    if (!version) {
      return res.status(404).json({ error: "No versions found" });
    }
    
    res.json(version);
  } catch (error: any) {
    console.error("Failed to get latest version:", error);
    res.status(500).json({ error: "Failed to get latest version" });
  }
});

// List all versions for a session
router.get("/sessions/:id/versions", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const versions = await collaborativeStorage.listVersions(sessionId);
    res.json(versions);
  } catch (error: any) {
    console.error("Failed to list versions:", error);
    res.status(500).json({ error: "Failed to list versions" });
  }
});

// ==== Comment Management Routes ====

// Add a comment
router.post("/sessions/:id/comments", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const validated = insertDocumentCommentSchema.parse({
      sessionId,
      userId: req.user?.id,
      ...req.body
    });
    
    const comment = await collaborativeStorage.addComment(validated);
    res.status(201).json(comment);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Failed to add comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  }
});

// Update a comment
router.patch("/comments/:id", async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }
    
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    const comment = await collaborativeStorage.updateComment(commentId, content);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    res.json(comment);
  } catch (error: any) {
    console.error("Failed to update comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Resolve a comment
router.post("/comments/:id/resolve", async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const comment = await collaborativeStorage.resolveComment(commentId, req.user.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    res.json(comment);
  } catch (error: any) {
    console.error("Failed to resolve comment:", error);
    res.status(500).json({ error: "Failed to resolve comment" });
  }
});

// Get all comments for a session
router.get("/sessions/:id/comments", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const comments = await collaborativeStorage.getComments(sessionId);
    res.json(comments);
  } catch (error: any) {
    console.error("Failed to get comments:", error);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

export default router;