import { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In ESM, we implement the name processor service directly in this file instead of importing
// the CommonJS module to avoid compatibility issues

// Create a wrapper for the nameProcessor functions
const nameProcessor = {
  processName: (data: any) => {
    // Implement the function using the file-based approach
    return processName(data);
  },
  getPendingProfiles: () => {
    // Get pending profiles
    return getPendingProfiles();
  },
  updateProfileStatus: (id: string, status: string) => {
    // Update profile status
    return updateProfileStatus(id, status);
  },
  deleteProfile: (id: string) => {
    // Delete profile
    return deleteProfile(id);
  }
};

// Data directory paths
const DATA_DIR = path.join(__dirname, '../data');
const PENDING_FILE = path.join(DATA_DIR, 'pending_profiles.json');

// Ensure data directory exists
function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load the pending profiles queue from file
function loadQueue() {
  ensureDataDirExists();
  
  if (!fs.existsSync(PENDING_FILE)) {
    // Initialize with empty array if file doesn't exist
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

// Save the pending profiles queue to file
function saveQueue(queue: any[]) {
  ensureDataDirExists();
  
  try {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(queue, null, 2));
  } catch (error: any) {
    console.error('Error saving pending profiles:', error);
  }
}

// Check if a name and firm combination already exists in the queue
function isDuplicate(name: string, firm: string | null, queue: any[]) {
  return queue.some(entry =>
    entry.name.toLowerCase() === name.toLowerCase() &&
    (!firm || entry.firm?.toLowerCase() === firm.toLowerCase())
  );
}

// Process a new name submission, checking for duplicates
function processName({ name, firm, source = 'manual' }: { name: string, firm?: string, source?: string }) {
  if (!name || typeof name !== 'string') {
    return { error: 'Invalid name input' };
  }

  const queue = loadQueue();
  if (isDuplicate(name, firm || null, queue)) {
    return { message: 'Duplicate found. Skipping.', status: 'skipped' };
  }

  const newEntry = {
    id: crypto.randomUUID(),
    name,
    firm: firm || null,
    status: 'pending',
    source: source,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  queue.push(newEntry);
  saveQueue(queue);

  return { message: 'Name queued for processing', entry: newEntry, status: 'queued' };
}

// Get all pending profiles
function getPendingProfiles() {
  return loadQueue();
}

// Update the status of a pending profile
function updateProfileStatus(id: string, status: string) {
  if (!id || !status) {
    return { error: 'Invalid inputs' };
  }
  
  const queue = loadQueue();
  const index = queue.findIndex((entry: any) => entry.id === id);
  
  if (index === -1) {
    return { error: 'Profile not found' };
  }
  
  queue[index].status = status;
  queue[index].updated_at = new Date().toISOString();
  
  saveQueue(queue);
  
  return { message: 'Profile status updated', entry: queue[index] };
}

// Delete a profile from the pending queue
function deleteProfile(id: string) {
  if (!id) {
    return { error: 'Invalid profile ID' };
  }
  
  const queue = loadQueue();
  const filteredQueue = queue.filter((entry: any) => entry.id !== id);
  
  if (filteredQueue.length === queue.length) {
    return { error: 'Profile not found' };
  }
  
  saveQueue(filteredQueue);
  
  return { message: 'Profile deleted from queue' };
}

// Schema for name submission
const nameSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  firm: z.string().optional()
});

// Schema for status update
const statusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"])
});

/**
 * Register name processor routes
 */
export function registerNameProcessorRoutes(app: Express) {
  /**
   * Submit a new name for processing
   */
  app.post("/api/scout-bot/names", async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = nameSubmissionSchema.parse(req.body);
      
      // Process name
      const result = nameProcessor.processName(validatedData);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error processing name:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to process name" });
    }
  });
  
  /**
   * Get all pending profiles
   */
  app.get("/api/scout-bot/pending-profiles", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const profiles = nameProcessor.getPendingProfiles();
      res.json(profiles);
    } catch (error: any) {
      console.error("Error fetching pending profiles:", error);
      res.status(500).json({ error: "Failed to fetch pending profiles" });
    }
  });
  
  /**
   * Update a pending profile status
   */
  app.patch("/api/scout-bot/pending-profiles/:id/status", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = statusUpdateSchema.parse(req.body);
      
      const result = nameProcessor.updateProfileStatus(id, status);
      
      if (result.error) {
        return res.status(404).json({ error: result.error });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error updating profile status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update profile status" });
    }
  });
  
  /**
   * Delete a pending profile
   */
  app.delete("/api/scout-bot/pending-profiles/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = nameProcessor.deleteProfile(id);
      
      if (result.error) {
        return res.status(404).json({ error: result.error });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });
}