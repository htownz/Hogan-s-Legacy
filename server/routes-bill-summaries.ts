import { Request, Response, Express } from 'express';
import { openAIService } from './services/openai-service';
import { generatePersonalImpactAssessment, generateBillComparison, UserDemographics as OpenAIDemographics } from './services/openai-service-extended';
import { db } from './db';
import { billSummaries } from '@shared/schema-bill-summaries';
import { bills } from '@shared/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { isAuthenticated } from './auth';
import { z } from 'zod';
import { Session } from 'express-session';

// Extend Session type to include our custom properties
declare module 'express-session' {
  interface Session {
    userId?: number;
    viewedSummaries?: number[];
  }
}

// Define custom request type
interface CustomRequest extends Request {
  session: Session & { 
    userId?: number;
    viewedSummaries?: number[];
  };
}

// Use the UserDemographics interface from openai-service-extended.ts

/**
 * Routes for AI-powered bill summaries
 */
export function registerBillSummaryRoutes(app: Express): void {
  /**
   * Get a bill summary by bill ID
   */
  app.get('/api/bills/:billId/summary', async (req: Request, res: Response) => {
    const { billId } = req.params;
    
    try {
      // Check if we already have a summary
      const existingSummary = await db.query.billSummaries.findFirst({
        where: eq(billSummaries.billId, billId),
      });

      // If we have a completed summary, return it
      if (existingSummary && existingSummary.processingStatus === 'completed') {
        // Track view if not already viewed in this session
        if (!req.session.viewedSummaries?.includes(existingSummary.id)) {
          await openAIService.trackSummaryView(existingSummary.id);
          
          // Update session
          if (!req.session.viewedSummaries) {
            req.session.viewedSummaries = [];
          }
          req.session.viewedSummaries.push(existingSummary.id);
        }
        
        return res.json(existingSummary);
      }
      
      // If summary is processing, return status
      if (existingSummary && existingSummary.processingStatus === 'processing') {
        return res.json({
          billId,
          processingStatus: 'processing',
          message: 'Summary is being generated, please check back soon.'
        });
      }
      
      // If no summary or failed status, trigger generation and return status
      // First check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({ error: `Bill ${billId} not found` });
      }
      
      // Start the summary generation process asynchronously
      void openAIService.generateBillSummary(billId);
      
      // Return processing status
      return res.json({
        billId,
        processingStatus: 'processing',
        message: 'Summary generation has been initiated, please check back soon.'
      });
    } catch (error: any) {
      console.error(`Error fetching bill summary for ${billId}:`, error);
      return res.status(500).json({ error: 'Failed to fetch or generate bill summary' });
    }
  });

  /**
   * Generate or regenerate a bill summary (authenticated endpoint)
   */
  app.post('/api/bills/:billId/summary', isAuthenticated, async (req: CustomRequest, res: Response) => {
    const { billId } = req.params;
    const { force = false } = req.body;
    
    try {
      // Check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({ error: `Bill ${billId} not found` });
      }
      
      // If force is true, we should regenerate even if we already have a summary
      if (force) {
        // Delete existing summary if any
        await db.delete(billSummaries)
          .where(eq(billSummaries.billId, billId));
      }
      
      // Start the summary generation process asynchronously
      void openAIService.generateBillSummary(billId);
      
      return res.json({
        billId,
        processingStatus: 'processing',
        message: `Summary generation ${force ? 're' : ''}initiated, please check back soon.`
      });
    } catch (error: any) {
      console.error(`Error generating bill summary for ${billId}:`, error);
      return res.status(500).json({ error: 'Failed to generate bill summary' });
    }
  });
  
  /**
   * Get a downloadable PDF version of the bill summary
   */
  app.get('/api/bills/:billId/summary/pdf', async (req: Request, res: Response) => {
    const { billId } = req.params;
    
    try {
      // Get the summary
      const summary = await db.query.billSummaries.findFirst({
        where: eq(billSummaries.billId, billId),
      });
      
      if (!summary || summary.processingStatus !== 'completed') {
        return res.status(404).json({ error: 'Bill summary not available' });
      }
      
      // Get the bill information
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      // Generate the PDF if we don't already have one
      if (!summary.pdfGeneratedUrl) {
        // In a full implementation, this would generate a PDF and upload it to S3
        // For now, we'll just set a flag to indicate PDF has been requested
        
        await db.update(billSummaries)
          .set({ 
            hasShareableVersion: true,
            downloadCount: sql`download_count + 1`,
            lastExportedAt: new Date()
          })
          .where(eq(billSummaries.id, summary.id));
        
        // Since we don't have an actual PDF yet, we'll return the enhanced summary data
        // In a real implementation, this would generate and return the PDF
        const summaryData = {
          // Bill basic information
          billId: summary.billId,
          billTitle: bill?.title || 'Unknown bill title',
          billNumber: billId.replace('TX-', ''),
          billDescription: bill?.description || 'No description available',
          session: '89th Texas Legislative Session',
          chamber: bill?.chamber || 'Unknown',
          sponsors: bill?.sponsors || [],
          introducedDate: bill?.introducedAt ? new Date(bill.introducedAt).toLocaleDateString() : 'Unknown',
          lastAction: bill?.lastAction || 'No recorded actions',
          lastActionDate: bill?.lastActionAt ? new Date(bill.lastActionAt).toLocaleDateString() : 'Unknown',
          topics: bill?.topics || [],
          status: bill?.status || 'Unknown',
          
          // Executive summary and key points
          executiveSummary: summary.executiveSummary,
          keyPoints: summary.keyPoints,
          
          // Detailed analysis
          impactAnalysis: summary.impactAnalysis,
          legalImplications: summary.legalImplications,
          stakeholderAnalysis: summary.stakeholderAnalysis,
          
          // Enhanced fields (new in v1.3)
          implementationTimeline: summary.implementationTimeline || [],
          fiscalConsiderations: summary.fiscalConsiderations || 'No fiscal information available',
          citizenActionGuide: summary.citizenActionGuide || 'No action guide available',
          
          // History and timeline
          committeeActions: summary.committeeActions,
          keyDates: summary.keyDates,
          historyHighlights: summary.historyHighlights,
          
          // Meta information
          generatedAt: summary.generatedAt,
          version: summary.version,
          summaryBy: 'Act Up - AI-powered Texas Legislative Analysis',
          disclaimer: 'This summary is generated using AI technology and is intended for informational purposes only. Always refer to official legislative documents for the most accurate and up-to-date information.',
        };
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${billId}-summary.json"`);
        res.setHeader('Content-Type', 'application/json');
        
        return res.json(summaryData);
      }
      
      // If we already have a PDF URL, redirect to it
      // (This would be used in the actual implementation)
      return res.redirect(summary.pdfGeneratedUrl);
      
    } catch (error: any) {
      console.error(`Error generating PDF for bill ${billId}:`, error);
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });
  
  /**
   * Track a share of a bill summary
   */
  app.post('/api/bills/:billId/summary/share', async (req: Request, res: Response) => {
    const { billId } = req.params;
    const { platform } = req.body; // optional: platform where it was shared
    
    try {
      // Find the summary
      const summary = await db.query.billSummaries.findFirst({
        where: eq(billSummaries.billId, billId),
      });
      
      if (!summary) {
        return res.status(404).json({ error: 'Bill summary not found' });
      }
      
      // Update share count
      await db.update(billSummaries)
        .set({
          shareCount: sql`share_count + 1`
        })
        .where(eq(billSummaries.id, summary.id));
      
      // Log the share with platform info if available
      console.log(`Bill summary ${billId} shared${platform ? ` on ${platform}` : ''}`);
      
      return res.json({ success: true, message: 'Share tracked successfully' });
    } catch (error: any) {
      console.error(`Error tracking share for bill ${billId}:`, error);
      return res.status(500).json({ error: 'Failed to track share' });
    }
  });
  
  /**
   * Get all bill summaries with pagination and filtering
   */
  app.get('/api/bill-summaries', async (req: Request, res: Response) => {
    const { 
      page = '1', 
      limit = '20', 
      status, 
      orderBy = 'createdAt', 
      order = 'desc',
      filter
    } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    
    try {
      // Execute separate queries instead of chaining to avoid type issues with Drizzle
      // First build our raw SQL queries for more flexibility
      
      // Basic query
      let whereClause = '';
      const whereConditions = [];
      
      if (status) {
        whereConditions.push(`processing_status = '${status}'`);
      } else {
        // By default, only return completed summaries
        whereConditions.push(`processing_status = 'completed'`);
      }
      
      // Apply filters
      if (filter === 'popular') {
        // Filter for popular summaries (most viewed)
        whereConditions.push(`view_count > 0`);
      } else if (filter === 'featured') {
        // Filter for featured summaries
        whereConditions.push(`is_featured = true`);
      }
      
      if (whereConditions.length > 0) {
        whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      }
      
      // Build order by
      let orderByStatement = '';
      if (filter === 'popular') {
        // Popular summaries ordered by view count
        orderByStatement = `ORDER BY view_count DESC`;
      } else if (filter === 'recent') {
        // Recent summaries ordered by creation date
        orderByStatement = `ORDER BY created_at DESC`;
      } else if (orderBy === 'viewCount') {
        orderByStatement = `ORDER BY view_count ${order === 'desc' ? 'DESC' : 'ASC'}`;
      } else if (orderBy === 'shareCount') {
        orderByStatement = `ORDER BY share_count ${order === 'desc' ? 'DESC' : 'ASC'}`;
      } else if (orderBy === 'downloadCount') {
        orderByStatement = `ORDER BY download_count ${order === 'desc' ? 'DESC' : 'ASC'}`;
      } else {
        // Default to createdAt
        orderByStatement = `ORDER BY created_at ${order === 'desc' ? 'DESC' : 'ASC'}`;
      }
      
      // Construct and execute the query
      const query = `
        SELECT 
          bs.*, 
          b.title as bill_title, 
          b.chamber as bill_chamber,
          b.topics
        FROM 
          bill_summaries bs
        LEFT JOIN 
          bills b ON bs.bill_id = b.id
        ${whereClause}
        ${orderByStatement}
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      // Direct SQL query to join with bills table
      const results = await db.execute(sql.raw(query));
      
      // Process results to get a clean format
      // Handle the different result types that could come from db.execute
      const summaryList = Array.isArray(results) 
        ? results 
        : results.rows || [];
      
      const transformedSummaries = summaryList.map((summary: any) => ({
        id: summary.id,
        billId: summary.bill_id,
        billTitle: summary.bill_title,
        executiveSummary: summary.executive_summary,
        billStatus: summary.status,
        billChamber: summary.bill_chamber,
        viewCount: summary.view_count,
        shareCount: summary.share_count,
        createdAt: summary.created_at,
        updatedAt: summary.updated_at,
        topics: summary.topics
      }));
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as count
        FROM bill_summaries bs
        ${whereClause}
      `;
      
      const countResult = await db.execute(sql.raw(countQuery));
      const countResultArray = Array.isArray(countResult) ? countResult : (countResult.rows || []);
      const totalCount = countResultArray.length > 0 ? Number(countResultArray[0]?.count) : 0;
      
      return res.json({
        summaries: transformedSummaries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Error fetching bill summaries:', error);
      return res.status(500).json({ error: 'Failed to fetch bill summaries' });
    }
  });
  
  /**
   * Delete a bill summary (admin only for now)
   */
  app.delete('/api/bill-summaries/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      const deleteResult = await db.delete(billSummaries)
        .where(eq(billSummaries.id, parseInt(id, 10)))
        .returning({ id: billSummaries.id });
      
      if (deleteResult.length === 0) {
        return res.status(404).json({ error: 'Bill summary not found' });
      }
      
      return res.json({ message: 'Bill summary deleted successfully', id: deleteResult[0].id });
    } catch (error: any) {
      console.error(`Error deleting bill summary ${id}:`, error);
      return res.status(500).json({ error: 'Failed to delete bill summary' });
    }
  });

  /**
   * Get a personalized bill summary based on user demographics
   */
  app.post('/api/bills/:billId/summary/personalized', async (req: Request, res: Response) => {
    const { billId } = req.params;
    const userDemographics: OpenAIDemographics = req.body;
    
    try {
      // Check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({ error: `Bill ${billId} not found` });
      }

      // Check if we have a base summary
      const existingSummary = await db.query.billSummaries.findFirst({
        where: eq(billSummaries.billId, billId),
      });
      
      if (!existingSummary || existingSummary.processingStatus !== 'completed') {
        return res.status(404).json({ 
          error: 'Base bill summary not available yet',
          message: 'Please generate a standard summary before requesting a personalized version'
        });
      }

      // Generate a personalized impact assessment
      const personalizedImpact = await generatePersonalImpactAssessment(bill, userDemographics);
      
      if (!personalizedImpact) {
        return res.status(500).json({ error: 'Failed to generate personalized summary' });
      }

      // Create enhanced personalized version with both the base summary and personalized impact
      const personalizedSummary = {
        // Core summary information
        billId: existingSummary.billId,
        title: bill.title,
        executiveSummary: existingSummary.executiveSummary,
        keyPoints: existingSummary.keyPoints,
        
        // Personalized impact analysis
        personalImpact: personalizedImpact.personalImpact,
        familyImpact: personalizedImpact.familyImpact,
        communityImpact: personalizedImpact.communityImpact,
        relevanceScore: personalizedImpact.relevanceScore,
        impactSentiment: personalizedImpact.sentiment,
        impactAreas: personalizedImpact.impactAreas,
        
        // Standard analysis (from base summary)
        impactAnalysis: existingSummary.impactAnalysis,
        legalImplications: existingSummary.legalImplications,
        stakeholderAnalysis: existingSummary.stakeholderAnalysis,
        
        // Enhanced fields
        implementationTimeline: existingSummary.implementationTimeline,
        fiscalConsiderations: existingSummary.fiscalConsiderations,
        citizenActionGuide: existingSummary.citizenActionGuide,
        
        // Timeline information
        committeeActions: existingSummary.committeeActions,
        keyDates: existingSummary.keyDates,
        historyHighlights: existingSummary.historyHighlights,
        
        // Meta-information
        personalizationApplied: true,
        personalizationDate: new Date(),
        userDemographicsUsed: {
          location: userDemographics.location || 'Texas',
          interests: userDemographics.interests || [],
          concerns: userDemographics.concerns || [],
          // We don't include more sensitive demographic information in the response
        },
      };
      
      return res.json(personalizedSummary);
    } catch (error: any) {
      console.error(`Error generating personalized summary for bill ${billId}:`, error);
      return res.status(500).json({ error: 'Failed to generate personalized bill summary' });
    }
  });

  /**
   * Generate a comparative analysis of two bills
   */
  app.get('/api/bills/compare', async (req: Request, res: Response) => {
    const { billId1, billId2 } = req.query;
    
    if (!billId1 || !billId2) {
      return res.status(400).json({ error: 'Two bill IDs are required for comparison' });
    }
    
    try {
      // Check if both bills exist and have summaries
      const [summary1, summary2] = await Promise.all([
        db.query.billSummaries.findFirst({
          where: eq(billSummaries.billId, billId1 as string),
        }),
        db.query.billSummaries.findFirst({
          where: eq(billSummaries.billId, billId2 as string),
        })
      ]);
      
      if (!summary1 || summary1.processingStatus !== 'completed') {
        return res.status(404).json({ error: `Summary for bill ${billId1} not available` });
      }
      
      if (!summary2 || summary2.processingStatus !== 'completed') {
        return res.status(404).json({ error: `Summary for bill ${billId2} not available` });
      }
      
      // Get bill information
      const [bill1, bill2] = await Promise.all([
        db.query.bills.findFirst({
          where: eq(bills.id, billId1 as string),
        }),
        db.query.bills.findFirst({
          where: eq(bills.id, billId2 as string),
        })
      ]);
      
      if (!bill1 || !bill2) {
        return res.status(404).json({ error: 'One or both bills not found' });
      }
      
      // Generate comparison using OpenAI
      const comparison = await generateBillComparison(
        bill1, summary1, 
        bill2, summary2
      );
      
      return res.json(comparison);
    } catch (error: any) {
      console.error(`Error comparing bills ${billId1} and ${billId2}:`, error);
      return res.status(500).json({ error: 'Failed to generate bill comparison' });
    }
  });
}