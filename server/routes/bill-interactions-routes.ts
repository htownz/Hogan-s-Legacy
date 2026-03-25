import { type Express } from "express";
import { storage } from "../storage-updated";
import { insertBillNoteSchema, insertBillHighlightSchema, insertBillShareSchema } from "@shared/schema";
import { z } from "zod";
import { CustomRequest } from "../types";

export function registerBillInteractionsRoutes(app: Express) {
  // ---- BILL NOTES ROUTES ----
  
  // Get all public notes for a bill
  app.get("/api/bills/:billId/notes", async (req, res) => {
    try {
      const billId = req.params.billId;
      const notes = await storage.getBillNotesByBillId(billId);
      res.status(200).json(notes);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving bill notes" });
    }
  });
  
  // Get all notes (public and private) for a bill created by the current user
  app.get("/api/users/me/bills/:billId/notes", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const billId = req.params.billId;
      const notes = await storage.getUserBillNotes(req.session.userId, billId);
      res.status(200).json(notes);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving user bill notes" });
    }
  });
  
  // Create a new note for a bill
  app.post("/api/bills/:billId/notes", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const billId = req.params.billId;
      
      // Validate request body
      const noteData = insertBillNoteSchema.parse({
        ...req.body,
        userId: req.session.userId,
        billId
      });
      
      const newNote = await storage.createBillNote(noteData);
      res.status(201).json(newNote);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating bill note" });
      }
    }
  });
  
  // Update a note for a bill
  app.put("/api/bills/notes/:noteId", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
      }
      
      // Validate request body
      const updateData = z.object({
        content: z.string().optional(),
        isPrivate: z.boolean().optional()
      }).parse(req.body);
      
      const updatedNote = await storage.updateBillNote(noteId, req.session.userId, updateData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found or does not belong to user" });
      }
      
      res.status(200).json(updatedNote);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating bill note" });
      }
    }
  });
  
  // Delete a note for a bill
  app.delete("/api/bills/notes/:noteId", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
      }
      
      await storage.deleteBillNote(noteId, req.session.userId);
      res.status(200).json({ message: "Note deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting bill note" });
    }
  });
  
  // ---- BILL HIGHLIGHTS ROUTES ----
  
  // Get all public highlights for a bill
  app.get("/api/bills/:billId/highlights", async (req, res) => {
    try {
      const billId = req.params.billId;
      const highlights = await storage.getBillHighlightsByBillId(billId);
      res.status(200).json(highlights);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving bill highlights" });
    }
  });
  
  // Get all highlights (public and private) for a bill created by the current user
  app.get("/api/users/me/bills/:billId/highlights", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const billId = req.params.billId;
      const highlights = await storage.getUserBillHighlights(req.session.userId, billId);
      res.status(200).json(highlights);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving user bill highlights" });
    }
  });
  
  // Create a new highlight for a bill
  app.post("/api/bills/:billId/highlights", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const billId = req.params.billId;
      
      // Validate request body
      const highlightData = insertBillHighlightSchema.parse({
        ...req.body,
        userId: req.session.userId,
        billId
      });
      
      const newHighlight = await storage.createBillHighlight(highlightData);
      res.status(201).json(newHighlight);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating bill highlight" });
      }
    }
  });
  
  // Update a highlight for a bill
  app.put("/api/bills/highlights/:highlightId", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const highlightId = parseInt(req.params.highlightId);
      if (isNaN(highlightId)) {
        return res.status(400).json({ message: "Invalid highlight ID" });
      }
      
      // Validate request body
      const updateData = z.object({
        comment: z.string().optional(),
        color: z.string().optional(),
        isPrivate: z.boolean().optional()
      }).parse(req.body);
      
      const updatedHighlight = await storage.updateBillHighlight(highlightId, req.session.userId, updateData);
      
      if (!updatedHighlight) {
        return res.status(404).json({ message: "Highlight not found or does not belong to user" });
      }
      
      res.status(200).json(updatedHighlight);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating bill highlight" });
      }
    }
  });
  
  // Delete a highlight for a bill
  app.delete("/api/bills/highlights/:highlightId", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const highlightId = parseInt(req.params.highlightId);
      if (isNaN(highlightId)) {
        return res.status(400).json({ message: "Invalid highlight ID" });
      }
      
      await storage.deleteBillHighlight(highlightId, req.session.userId);
      res.status(200).json({ message: "Highlight deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting bill highlight" });
    }
  });
  
  // ---- BILL SHARING ROUTES ----
  
  // Get all shares created by the current user
  app.get("/api/users/me/shares", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const shares = await storage.getBillSharesByUserId(req.session.userId);
      res.status(200).json(shares);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving user shares" });
    }
  });
  
  // Create a new share for a bill
  app.post("/api/bills/:billId/share", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const billId = req.params.billId;
      
      // Validate request body
      const shareData = insertBillShareSchema.parse({
        ...req.body,
        userId: req.session.userId,
        billId
      });
      
      const newShare = await storage.createBillShare(shareData);
      
      // Generate the share URL or code to return to the user
      const shareUrl = `/bills/${billId}/shared/${newShare.id}`;
      if (newShare.accessCode) {
        shareUrl + `?code=${newShare.accessCode}`;
      }
      
      res.status(201).json({
        ...newShare,
        shareUrl
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating bill share" });
      }
    }
  });
  
  // Record a click on a shared link
  app.post("/api/shares/:shareId/click", async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      if (isNaN(shareId)) {
        return res.status(400).json({ message: "Invalid share ID" });
      }
      
      try {
        const share = await storage.incrementBillShareClickCount(shareId);
        res.status(200).json({ message: "Click recorded" });
      } catch (error: any) {
        res.status(404).json({ message: "Share not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error recording share click" });
    }
  });
  
  // Delete a share
  app.delete("/api/shares/:shareId", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const shareId = parseInt(req.params.shareId);
      if (isNaN(shareId)) {
        return res.status(400).json({ message: "Invalid share ID" });
      }
      
      await storage.deleteBillShare(shareId, req.session.userId);
      res.status(200).json({ message: "Share deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting share" });
    }
  });
}