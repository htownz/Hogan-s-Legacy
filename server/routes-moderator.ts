// @ts-nocheck
/**
 * Scout Bot Moderator Routes
 * 
 * API endpoints for moderating and publishing character profiles
 */

import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import moderator services
import queueModeratorPath from './services/scout-bot/queueModerator.js';
import cardPublisherPath from './services/scout-bot/cardPublisher.js';

// Define paths to CommonJS modules
const queueModeratorJsPath = path.join(__dirname, 'services/scout-bot/queueModerator.js');
const cardPublisherJsPath = path.join(__dirname, 'services/scout-bot/cardPublisher.js');

// Data directory paths
const DATA_DIR = path.join(__dirname, '../data');
const PENDING_FILE = path.join(DATA_DIR, 'pending_profiles.json');
const APPROVED_FILE = path.join(DATA_DIR, 'approved_profiles.json');
const REJECTED_FILE = path.join(DATA_DIR, 'rejected_profiles.json');
const LIVE_PROFILES_FILE = path.join(DATA_DIR, 'live_profiles.json');

// Ensure data directory exists
function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load profiles functions
function getPendingProfiles() {
  ensureDataDirExists();
  
  if (!fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(PENDING_FILE, JSON.stringify([], null, 2));
    return [];
  }
  
  try {
    const raw = fs.readFileSync(PENDING_FILE);
    return JSON.parse(raw.toString());
  } catch (error: any) {
    console.error('Error loading pending profiles:', error);
    return [];
  }
}

function getApprovedProfiles() {
  ensureDataDirExists();
  
  if (!fs.existsSync(APPROVED_FILE)) {
    fs.writeFileSync(APPROVED_FILE, JSON.stringify([], null, 2));
    return [];
  }
  
  try {
    const raw = fs.readFileSync(APPROVED_FILE);
    return JSON.parse(raw.toString());
  } catch (error: any) {
    console.error('Error loading approved profiles:', error);
    return [];
  }
}

function getRejectedProfiles() {
  ensureDataDirExists();
  
  if (!fs.existsSync(REJECTED_FILE)) {
    fs.writeFileSync(REJECTED_FILE, JSON.stringify([], null, 2));
    return [];
  }
  
  try {
    const raw = fs.readFileSync(REJECTED_FILE);
    return JSON.parse(raw.toString());
  } catch (error: any) {
    console.error('Error loading rejected profiles:', error);
    return [];
  }
}

function getLiveProfiles() {
  ensureDataDirExists();
  
  if (!fs.existsSync(LIVE_PROFILES_FILE)) {
    fs.writeFileSync(LIVE_PROFILES_FILE, JSON.stringify([], null, 2));
    return [];
  }
  
  try {
    const raw = fs.readFileSync(LIVE_PROFILES_FILE);
    return JSON.parse(raw.toString());
  } catch (error: any) {
    console.error('Error loading live profiles:', error);
    return [];
  }
}

// Approve profile
function approveProfile(id: string) {
  if (!id) {
    return { error: "Profile ID is required" };
  }
  
  // Get profiles
  const pendingProfiles = getPendingProfiles();
  const approvedProfiles = getApprovedProfiles();
  
  // Find the profile in pending queue
  const profileIndex = pendingProfiles.findIndex((p: any) => p.id === id);
  
  if (profileIndex === -1) {
    return { error: "Profile not found in pending queue" };
  }
  
  // Add to approved profiles
  const profile = { ...pendingProfiles[profileIndex] };
  profile.status = 'approved';
  profile.updated_at = new Date().toISOString();
  approvedProfiles.push(profile);
  
  // Remove from pending queue
  pendingProfiles.splice(profileIndex, 1);
  
  // Save changes
  try {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pendingProfiles, null, 2));
    fs.writeFileSync(APPROVED_FILE, JSON.stringify(approvedProfiles, null, 2));
    return { success: true, profile };
  } catch (error: any) {
    console.error('Error saving profile changes:', error);
    return { error: "Error saving changes" };
  }
}

// Reject profile
function rejectProfile(id: string) {
  if (!id) {
    return { error: "Profile ID is required" };
  }
  
  // Get profiles
  const pendingProfiles = getPendingProfiles();
  const rejectedProfiles = getRejectedProfiles();
  
  // Find the profile in pending queue
  const profileIndex = pendingProfiles.findIndex((p: any) => p.id === id);
  
  if (profileIndex === -1) {
    return { error: "Profile not found in pending queue" };
  }
  
  // Add to rejected profiles
  const profile = { ...pendingProfiles[profileIndex] };
  profile.status = 'rejected';
  profile.updated_at = new Date().toISOString();
  rejectedProfiles.push(profile);
  
  // Remove from pending queue
  pendingProfiles.splice(profileIndex, 1);
  
  // Save changes
  try {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pendingProfiles, null, 2));
    fs.writeFileSync(REJECTED_FILE, JSON.stringify(rejectedProfiles, null, 2));
    return { success: true, profile };
  } catch (error: any) {
    console.error('Error saving profile changes:', error);
    return { error: "Error saving changes" };
  }
}

// Publish profile
function publishProfile(id: string) {
  if (!id) {
    return { error: "Profile ID is required" };
  }
  
  // Get profiles
  const approvedProfiles = getApprovedProfiles();
  const liveProfiles = getLiveProfiles();
  
  // Find the profile in approved queue
  const profileIndex = approvedProfiles.findIndex((p: any) => p.id === id);
  
  if (profileIndex === -1) {
    return { error: "Profile not found in approved queue" };
  }
  
  // Check if already published
  const existingPublished = liveProfiles.find((p: any) => p.id === id);
  if (existingPublished) {
    return { error: "Profile already published" };
  }
  
  // Enrich and add to live profiles
  const profile = {
    ...approvedProfiles[profileIndex],
    influence_topics: approvedProfiles[profileIndex].influence_topics || [],
    transparency_score: Math.floor(Math.random() * 100), // This would actually be calculated
    flag_count: 0,
    published_at: new Date().toISOString()
  };
  
  liveProfiles.push(profile);
  
  // Remove from approved queue
  approvedProfiles.splice(profileIndex, 1);
  
  // Save changes
  try {
    fs.writeFileSync(APPROVED_FILE, JSON.stringify(approvedProfiles, null, 2));
    fs.writeFileSync(LIVE_PROFILES_FILE, JSON.stringify(liveProfiles, null, 2));
    return { success: true, profile };
  } catch (error: any) {
    console.error('Error publishing profile:', error);
    return { error: "Error saving changes" };
  }
}

// Publish all approved profiles
function publishAllProfiles() {
  // Get profiles
  const approvedProfiles = getApprovedProfiles();
  const liveProfiles = getLiveProfiles();
  
  if (approvedProfiles.length === 0) {
    return { message: "No approved profiles to publish" };
  }
  
  // Get IDs of existing published profiles
  const publishedIds = liveProfiles.map((p: any) => p.id);
  
  // Filter out already published profiles
  const profilesToPublish = approvedProfiles.filter((p: any) => !publishedIds.includes(p.id));
  
  if (profilesToPublish.length === 0) {
    return { message: "All approved profiles already published" };
  }
  
  // Enrich and add to live profiles
  const enrichedProfiles = profilesToPublish.map((profile: any) => ({
    ...profile,
    influence_topics: profile.influence_topics || [],
    transparency_score: Math.floor(Math.random() * 100), // This would actually be calculated
    flag_count: 0,
    published_at: new Date().toISOString()
  }));
  
  const newLiveProfiles = [...liveProfiles, ...enrichedProfiles];
  
  // Remove from approved queue
  const newApprovedProfiles = approvedProfiles.filter((p: any) => 
    !profilesToPublish.map((tp: any) => tp.id).includes(p.id)
  );
  
  // Save changes
  try {
    fs.writeFileSync(APPROVED_FILE, JSON.stringify(newApprovedProfiles, null, 2));
    fs.writeFileSync(LIVE_PROFILES_FILE, JSON.stringify(newLiveProfiles, null, 2));
    
    return { 
      success: true, 
      message: `Published ${profilesToPublish.length} profiles`,
      published: profilesToPublish
    };
  } catch (error: any) {
    console.error('Error publishing profiles:', error);
    return { error: "Error saving changes" };
  }
}

// Schema for profile ID in request
const profileIdSchema = z.object({
  id: z.string().uuid()
});

/**
 * Register moderator routes
 */
export function registerModeratorRoutes(app: Express) {
  /**
   * Get moderation queue
   */
  app.get("/api/moderator/queue", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const pendingProfiles = getPendingProfiles();
      const approvedProfiles = getApprovedProfiles();
      const rejectedProfiles = getRejectedProfiles();
      const liveProfiles = getLiveProfiles();
      
      // Calculate counts
      const stats = {
        pending: pendingProfiles.length,
        approved: approvedProfiles.length,
        rejected: rejectedProfiles.length,
        published: liveProfiles.length
      };
      
      res.json({
        stats,
        pendingProfiles,
        approvedProfiles,
        rejectedProfiles
      });
    } catch (error: any) {
      console.error("Error fetching moderation queue:", error);
      res.status(500).json({ error: "Failed to fetch moderation queue" });
    }
  });
  
  /**
   * Approve a profile
   */
  app.post("/api/moderator/approve", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = profileIdSchema.parse(req.body);
      const result = approveProfile(id);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error approving profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to approve profile" });
    }
  });
  
  /**
   * Reject a profile
   */
  app.post("/api/moderator/reject", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = profileIdSchema.parse(req.body);
      const result = rejectProfile(id);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error rejecting profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to reject profile" });
    }
  });
  
  /**
   * Publish a profile
   */
  app.post("/api/moderator/publish", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if request is to publish all
      const publishAll = req.body.publishAll === true;
      
      let result;
      if (publishAll) {
        result = publishAllProfiles();
      } else {
        // Publish single profile
        const { id } = profileIdSchema.parse(req.body);
        result = publishProfile(id);
      }
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error publishing profile(s):", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to publish profile(s)" });
    }
  });
  
  /**
   * Get live profiles
   */
  app.get("/api/moderator/live-profiles", async (req: Request, res: Response) => {
    try {
      const liveProfiles = getLiveProfiles();
      res.json(liveProfiles);
    } catch (error: any) {
      console.error("Error fetching live profiles:", error);
      res.status(500).json({ error: "Failed to fetch live profiles" });
    }
  });
}