import { type Express } from "express";
import { storage } from "../storage-social";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { CustomRequest } from "../types";
import { insertUserInvitationSchema } from "@shared/schema";
import { createLogger } from "../logger";
const log = createLogger("invitation-routes");


export function registerInvitationRoutes(app: Express) {
  // Create a new invitation
  app.post("/api/invitations", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Validate request body
      const invitationData = insertUserInvitationSchema.parse({
        ...req.body,
        inviterId: req.session.userId,
        invitationCode: uuidv4().substring(0, 8).toUpperCase(), // Generate a unique code
        status: "pending", // Default status
        createdAt: new Date()
      });
      
      const invitation = await storage.createUserInvitation(invitationData);
      
      // Update the user's network impact stats
      await storage.incrementUserInvitationCount(req.session.userId);
      
      res.status(201).json(invitation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        log.error({ err: error }, "Create invitation error");
        res.status(500).json({ message: "Error creating invitation" });
      }
    }
  });
  
  // Get all invitations created by the current user
  app.get("/api/users/me/invitations", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const invitations = await storage.getUserInvitationsByInviterId(req.session.userId);
      res.status(200).json(invitations);
    } catch (error: any) {
      log.error({ err: error }, "Get invitations error");
      res.status(500).json({ message: "Error retrieving invitations" });
    }
  });
  
  // Verify and accept an invitation
  app.post("/api/invitations/accept", async (req, res) => {
    try {
      const { invitationCode, email } = req.body;
      
      if (!invitationCode || !email) {
        return res.status(400).json({ message: "Invitation code and email are required" });
      }
      
      // Find the invitation
      const invitation = await storage.getUserInvitationByCode(invitationCode);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation code" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ message: "Email does not match invitation" });
      }
      
      // Mark the invitation as accepted
      await storage.updateUserInvitation(invitation.id, {
        status: "accepted",
        acceptedAt: new Date()
      });
      
      // Return the invitation data to be used during registration
      res.status(200).json({
        invitation,
        message: "Invitation accepted. You can now register for an account."
      });
    } catch (error: any) {
      log.error({ err: error }, "Accept invitation error");
      res.status(500).json({ message: "Error accepting invitation" });
    }
  });
  
  // Register with an invitation
  app.post("/api/invitations/:invitationCode/register", async (req, res) => {
    try {
      const { invitationCode } = req.params;
      
      // Find the invitation
      const invitation = await storage.getUserInvitationByCode(invitationCode);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation code" });
      }
      
      if (invitation.status !== "accepted") {
        return res.status(400).json({ message: "Invitation has not been accepted or has already been used" });
      }
      
      // Create the user account with the invitation data
      // This is just for reference - actual user registration happens in auth route
      // and we associate the invitation there
      
      // Update the invitation status
      await storage.updateUserInvitation(invitation.id, {
        status: "used",
        registeredAt: new Date()
      });
      
      // Add inviter as a connection
      const inviterId = invitation.inviterId;
      const newUserId = req.session.userId; // This will be set after registration
      
      if (inviterId && newUserId) {
        await storage.createUserConnection({
          userId: newUserId,
          connectedUserId: inviterId,
          connectionType: "invited_by",
          createdAt: new Date()
        });
        
        await storage.createUserConnection({
          userId: inviterId,
          connectedUserId: newUserId,
          connectionType: "invited",
          createdAt: new Date()
        });
        
        // Update network impact stats for the inviter
        await storage.incrementUserActiveCount(inviterId);
      }
      
      res.status(200).json({ message: "Registration complete" });
    } catch (error: any) {
      log.error({ err: error }, "Register with invitation error");
      res.status(500).json({ message: "Error registering with invitation" });
    }
  });
  
  // Get invitation by code (for verification)
  app.get("/api/invitations/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      const invitation = await storage.getUserInvitationByCode(code);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation code" });
      }
      
      res.status(200).json(invitation);
    } catch (error: any) {
      log.error({ err: error }, "Get invitation error");
      res.status(500).json({ message: "Error retrieving invitation" });
    }
  });
  
  // Resend an invitation
  app.post("/api/invitations/:id/resend", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const invitationId = parseInt(req.params.id);
      
      // Check if the invitation belongs to the user
      const invitation = await storage.getUserInvitationById(invitationId);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.inviterId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to resend this invitation" });
      }
      
      // Generate a new code and update the invitation
      const newCode = uuidv4().substring(0, 8).toUpperCase();
      
      const updatedInvitation = await storage.updateUserInvitation(invitationId, {
        invitationCode: newCode,
        createdAt: new Date(),
        status: "pending"
      });
      
      // In a real implementation, we would also send an email here
      
      res.status(200).json(updatedInvitation);
    } catch (error: any) {
      log.error({ err: error }, "Resend invitation error");
      res.status(500).json({ message: "Error resending invitation" });
    }
  });
  
  // Cancel an invitation
  app.delete("/api/invitations/:id", async (req: CustomRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const invitationId = parseInt(req.params.id);
      
      // Check if the invitation belongs to the user
      const invitation = await storage.getUserInvitationById(invitationId);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.inviterId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to cancel this invitation" });
      }
      
      await storage.deleteUserInvitation(invitationId);
      
      // Decrement the user's invitation count if the invitation was still pending
      if (invitation.status === "pending") {
        await storage.decrementUserInvitationCount(req.session.userId);
      }
      
      res.status(200).json({ message: "Invitation cancelled successfully" });
    } catch (error: any) {
      log.error({ err: error }, "Cancel invitation error");
      res.status(500).json({ message: "Error cancelling invitation" });
    }
  });
}