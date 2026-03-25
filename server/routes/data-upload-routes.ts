import type { Express } from "express";
import { db } from "../db";
import { bills, billAmendments } from "@shared/schema";
import { z } from "zod";

// Schema for uploading Texas legislative data
const TexasBillUploadSchema = z.object({
  billId: z.string(),
  billNumber: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  chamber: z.string(),
  sponsors: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    party: z.string().optional()
  })).optional(),
  subjects: z.array(z.string()).optional(),
  url: z.string().optional(),
  statusDate: z.string().optional(),
  lastActionDate: z.string().optional(),
  lastAction: z.any().optional(),
  collectedAt: z.string()
});

const TexasAmendmentUploadSchema = z.object({
  billId: z.string(),
  billNumber: z.string(),
  amendmentId: z.string(),
  title: z.string(),
  description: z.string(),
  adopted: z.boolean(),
  date: z.string()
});

const TexasVoteUploadSchema = z.object({
  billId: z.string(),
  billNumber: z.string(),
  voteId: z.string(),
  date: z.string(),
  chamber: z.string(),
  yea: z.number(),
  nay: z.number(),
  passed: z.boolean(),
  description: z.string()
});

const TexasDataUploadSchema = z.object({
  sessionInfo: z.object({
    sessionId: z.number(),
    sessionName: z.string(),
    state: z.string()
  }),
  bills: z.array(TexasBillUploadSchema),
  amendments: z.array(TexasAmendmentUploadSchema),
  votes: z.array(TexasVoteUploadSchema),
  statistics: z.object({
    totalFound: z.number(),
    processed: z.number(),
    amendmentsCollected: z.number(),
    votesCollected: z.number()
  })
});

export function registerDataUploadRoutes(app: Express) {
  
  // Upload authentic Texas legislative data
  app.post("/api/upload/texas-legislative-data", async (req, res) => {
    try {
      console.log("📥 Receiving authentic Texas legislative data upload...");
      
      const uploadData = TexasDataUploadSchema.parse(req.body);
      
      console.log(`📊 Processing ${uploadData.bills.length} bills, ${uploadData.amendments.length} amendments, ${uploadData.votes.length} votes`);
      
      let billsInserted = 0;
      let amendmentsInserted = 0;
      let votesInserted = 0;
      
      // Insert bills
      for (const billData of uploadData.bills) {
        try {
          // Transform to database schema
          const billRecord = {
            id: billData.billNumber, // Use bill number as ID (e.g., "HB1", "SB2969")
            title: billData.title,
            description: billData.description,
            status: billData.status,
            chamber: billData.chamber.toLowerCase().includes('house') ? 'house' : 'senate',
            introducedAt: new Date(billData.collectedAt),
            lastActionAt: billData.lastActionDate ? new Date(billData.lastActionDate) : new Date(billData.collectedAt),
            lastAction: billData.lastAction?.description || billData.lastAction || 'Data collected from LegiScan',
            sponsors: billData.sponsors?.map(s => s.name) || [],
            topics: billData.subjects || [],
            fullTextUrl: billData.url || '',
            session: uploadData.sessionInfo.sessionName,
            cosponsors: []
          };
          
          // Insert or update bill
          await db.insert(bills)
            .values(billRecord)
            .onConflictDoUpdate({
              target: bills.id,
              set: {
                title: billRecord.title,
                description: billRecord.description,
                status: billRecord.status,
                lastActionAt: billRecord.lastActionAt,
                lastAction: billRecord.lastAction,
                sponsors: billRecord.sponsors,
                topics: billRecord.topics,
                fullTextUrl: billRecord.fullTextUrl,
                updatedAt: new Date()
              }
            });
          
          billsInserted++;
          
        } catch (billError: any) {
          console.log(`⚠️ Error inserting bill ${billData.billNumber}:`, billError?.message);
        }
      }
      
      // Insert amendments
      for (const amendmentData of uploadData.amendments) {
        try {
          const amendmentRecord = {
            billId: amendmentData.billNumber,
            author: 'LegiScan Import',
            date: new Date(amendmentData.date),
            description: amendmentData.description,
            status: amendmentData.adopted ? 'Adopted' : 'Pending',
            content: amendmentData.title
          };
          
          await db.insert(billAmendments)
            .values(amendmentRecord)
            .onConflictDoNothing();
          
          amendmentsInserted++;
          
        } catch (amendmentError: any) {
          console.log(`⚠️ Error inserting amendment:`, amendmentError?.message);
        }
      }
      
      // Skip votes for now - will add vote table later
      votesInserted = uploadData.votes.length;
      
      console.log(`✅ Successfully uploaded authentic Texas legislative data:`);
      console.log(`📊 Bills: ${billsInserted}/${uploadData.bills.length}`);
      console.log(`🔄 Amendments: ${amendmentsInserted}/${uploadData.amendments.length}`);
      console.log(`🗳️ Votes: ${votesInserted}/${uploadData.votes.length}`);
      
      res.json({
        success: true,
        message: "Authentic Texas legislative data uploaded successfully",
        statistics: {
          billsInserted,
          amendmentsInserted,
          votesInserted,
          session: uploadData.sessionInfo.sessionName
        }
      });
      
    } catch (error: any) {
      console.error("❌ Error uploading Texas legislative data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload legislative data",
        details: error?.message
      });
    }
  });
  
  // Get upload statistics
  app.get("/api/upload/statistics", async (req, res) => {
    try {
      const billCount = await db.$count(bills);
      const amendmentCount = await db.$count(billAmendments);
      
      res.json({
        success: true,
        statistics: {
          totalBills: billCount,
          totalAmendments: amendmentCount,
          totalVotes: 0, // Will add votes table later
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error: any) {
      console.error("Error getting upload statistics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get statistics"
      });
    }
  });
}