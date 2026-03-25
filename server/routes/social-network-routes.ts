/**
 * Social Network and Viral Spread Mechanics Routes
 * 
 * This file contains the API routes for:
 * - User invitations
 * - User connections
 * - Network activity tracking
 * - Share tracking and analytics
 */

import { type Express } from "express";
import { storage } from "../storage-social";
import { superUserStorage } from "../storage-super-user";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { CustomRequest } from "../types";
import { insertUserInvitationSchema, insertUserConnectionSchema, insertConnectionActivitySchema, insertNetworkShareSchema } from "@shared/schema";
import { isAuthenticated } from "../auth";
import crypto from "crypto";

export function registerSocialNetworkRoutes(app: Express) {
  // ---- INVITATIONS ----
  
  // Create a new invitation
  app.post("/api/invitations", isAuthenticated, async (req: CustomRequest, res) => {
    try {
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
        console.error("Create invitation error:", error);
        res.status(500).json({ message: "Error creating invitation" });
      }
    }
  });
  
  // Get all invitations created by the current user
  app.get("/api/users/me/invitations", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const invitations = await storage.getUserInvitationsByInviterId(req.session.userId);
      res.status(200).json(invitations);
    } catch (error: any) {
      console.error("Get invitations error:", error);
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
      console.error("Accept invitation error:", error);
      res.status(500).json({ message: "Error accepting invitation" });
    }
  });
  
  // Register with an invitation
  app.post("/api/invitations/:invitationCode/register", isAuthenticated, async (req: CustomRequest, res) => {
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
      
      // Update the invitation status
      await storage.updateUserInvitation(invitation.id, {
        status: "used",
        registeredAt: new Date()
      });
      
      // Add inviter as a connection
      const inviterId = invitation.inviterId;
      const newUserId = req.session.userId;
      
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
      console.error("Register with invitation error:", error);
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
      console.error("Get invitation error:", error);
      res.status(500).json({ message: "Error retrieving invitation" });
    }
  });
  
  // Resend an invitation
  app.post("/api/invitations/:id/resend", isAuthenticated, async (req: CustomRequest, res) => {
    try {
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
      console.error("Resend invitation error:", error);
      res.status(500).json({ message: "Error resending invitation" });
    }
  });
  
  // Cancel an invitation
  app.delete("/api/invitations/:id", isAuthenticated, async (req: CustomRequest, res) => {
    try {
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
      console.error("Cancel invitation error:", error);
      res.status(500).json({ message: "Error cancelling invitation" });
    }
  });
  
  // ---- USER CONNECTIONS ----
  
  // Get user's connections
  app.get("/api/users/me/connections", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const connections = await storage.getUserConnectionsByUserId(req.session.userId);
      
      // Get details for each connected user
      const connectionDetailsPromises = connections.map(async (connection) => {
        const user = await storage.getUser(connection.connectedUserId);
        return {
          ...connection,
          connectedUser: user ? {
            id: user.id,
            username: user.username,
            name: user.name,
            profileImageUrl: user.profileImageUrl
          } : null
        };
      });
      
      const connectionDetails = await Promise.all(connectionDetailsPromises);
      
      res.status(200).json(connectionDetails);
    } catch (error: any) {
      console.error("Get connections error:", error);
      res.status(500).json({ message: "Error retrieving connections" });
    }
  });
  
  // Create a connection with another user
  app.post("/api/connections", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const { connectedUserId, connectionType } = req.body;
      
      // Validate request
      if (!connectedUserId || !connectionType) {
        return res.status(400).json({ message: "Connected user ID and connection type are required" });
      }
      
      // Check if the connected user exists
      const connectedUser = await storage.getUser(connectedUserId);
      
      if (!connectedUser) {
        return res.status(404).json({ message: "Connected user not found" });
      }
      
      // Check if the connection already exists
      const existingConnections = await storage.getUserConnectionsByUserId(req.session.userId);
      const existingConnection = existingConnections.find(conn => conn.connectedUserId === connectedUserId);
      
      if (existingConnection) {
        return res.status(400).json({ message: "Connection already exists" });
      }
      
      // Create the connection
      const connection = await storage.createUserConnection({
        userId: req.session.userId,
        connectedUserId,
        connectionType,
        createdAt: new Date()
      });
      
      // Update network impact
      await storage.updateUserNetworkImpactReach(req.session.userId);
      
      res.status(201).json(connection);
    } catch (error: any) {
      console.error("Create connection error:", error);
      res.status(500).json({ message: "Error creating connection" });
    }
  });
  
  // Remove a connection
  app.delete("/api/connections/:id", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      
      // Check if the connection exists and belongs to the user
      const connection = await storage.getUserConnectionById(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to remove this connection" });
      }
      
      await storage.deleteUserConnection(connectionId);
      
      // Update network impact
      await storage.updateUserNetworkImpactReach(req.session.userId);
      
      res.status(200).json({ message: "Connection removed successfully" });
    } catch (error: any) {
      console.error("Remove connection error:", error);
      res.status(500).json({ message: "Error removing connection" });
    }
  });
  
  // ---- NETWORK ACTIVITY ----
  
  // Record a connection activity
  app.post("/api/connection-activities", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const activityData = insertConnectionActivitySchema.parse({
        ...req.body,
        userId: req.session.userId,
        createdAt: new Date()
      });
      
      const activity = await storage.createConnectionActivity(activityData);
      
      // Update the connection strength
      await storage.updateUserConnectionStrength(
        req.session.userId,
        activityData.connectedUserId,
        1 // Increment by 1
      );
      
      // If the activity is actionable, increment actions inspired
      if (activityData.activityType.includes("action")) {
        await storage.incrementUserActionsInspired(req.session.userId);
      }
      
      res.status(201).json(activity);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Create activity error:", error);
        res.status(500).json({ message: "Error creating activity" });
      }
    }
  });
  
  // Get all activities for a user
  app.get("/api/users/me/activities", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const activities = await storage.getConnectionActivitiesByUserId(req.session.userId);
      
      // Get details for each connected user
      const activityDetailsPromises = activities.map(async (activity) => {
        const connectedUser = await storage.getUser(activity.connectedUserId);
        return {
          ...activity,
          connectedUser: connectedUser ? {
            id: connectedUser.id,
            username: connectedUser.username,
            name: connectedUser.name,
            profileImageUrl: connectedUser.profileImageUrl
          } : null
        };
      });
      
      const activityDetails = await Promise.all(activityDetailsPromises);
      
      res.status(200).json(activityDetails);
    } catch (error: any) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Error retrieving activities" });
    }
  });
  
  // ---- NETWORK SHARES ----
  
  // Create a share
  app.post("/api/shares", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const shareData = insertNetworkShareSchema.parse({
        ...req.body,
        userId: req.session.userId,
        createdAt: new Date()
      });
      
      const share = await storage.createNetworkShare(shareData);
      
      res.status(201).json(share);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Create share error:", error);
        res.status(500).json({ message: "Error creating share" });
      }
    }
  });
  
  // Get all shares for a user
  app.get("/api/users/me/shares", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const shares = await storage.getNetworkSharesByUserId(req.session.userId);
      res.status(200).json(shares);
    } catch (error: any) {
      console.error("Get shares error:", error);
      res.status(500).json({ message: "Error retrieving shares" });
    }
  });
  
  // Track a share click
  app.post("/api/shares/:id/click", async (req, res) => {
    try {
      const shareId = parseInt(req.params.id);
      
      // Validate share ID
      const share = await storage.getNetworkSharesByUserId(shareId);
      
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }
      
      // Create a share click event
      const { referrer, userAgent } = req.body;
      
      // Hash the IP address for privacy
      const ipHash = crypto
        .createHash('sha256')
        .update(req.ip || '')
        .digest('hex');
        
      await storage.createShareClickEvent({
        shareId,
        ipHash,
        userAgent: userAgent || req.headers['user-agent'] || '',
        referrer: referrer || req.headers.referer || '',
        clickedAt: new Date(),
        conversionType: 'view'
      });
      
      res.status(200).json({ message: "Click tracked successfully" });
    } catch (error: any) {
      console.error("Track share click error:", error);
      res.status(500).json({ message: "Error tracking share click" });
    }
  });
  
  // Record a share conversion
  app.post("/api/shares/:id/conversion", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      const shareId = parseInt(req.params.id);
      
      // Validate share ID
      const share = await storage.getNetworkSharesByUserId(shareId);
      
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }
      
      // Update the share's conversion count
      await storage.incrementNetworkShareConversions(shareId);
      
      // Create a share click event with conversion
      const { conversionType } = req.body;
      
      // Hash the IP address for privacy
      const ipHash = crypto
        .createHash('sha256')
        .update(req.ip || '')
        .digest('hex');
        
      await storage.createShareClickEvent({
        shareId,
        ipHash,
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers.referer || '',
        clickedAt: new Date(),
        conversionType: conversionType || 'signup',
        newUserId: req.session.userId
      });
      
      res.status(200).json({ message: "Conversion recorded successfully" });
    } catch (error: any) {
      console.error("Record share conversion error:", error);
      res.status(500).json({ message: "Error recording share conversion" });
    }
  });
  
  // ---- NETWORK IMPACT ----
  
  // Get user's network impact
  app.get("/api/users/me/network-impact", isAuthenticated, async (req: CustomRequest, res) => {
    try {
      let impact = await storage.getUserNetworkImpactByUserId(req.session.userId);
      
      // If no impact record exists, create one
      if (!impact) {
        impact = await superUserStorage.createUserNetworkImpact({
          userId: req.session.userId,
          usersInvited: 0,
          activeUsers: 0,
          actionsInspired: 0,
          totalReach: 0,
          r0Value: 0
        });
      }
      
      // Update the reach (this is a potentially expensive operation, 
      // so it should probably be done asynchronously in production)
      await storage.updateUserNetworkImpactReach(req.session.userId);
      
      // Get the updated impact
      impact = await storage.getUserNetworkImpactByUserId(req.session.userId);
      
      res.status(200).json(impact);
    } catch (error: any) {
      console.error("Get network impact error:", error);
      res.status(500).json({ message: "Error retrieving network impact" });
    }
  });
}