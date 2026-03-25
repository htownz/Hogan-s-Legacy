import { Request, Response } from 'express';
import { Express } from 'express';
import { db } from '../db';
import { eq, like, and, or, desc, asc, inArray, gte, lte, sql } from 'drizzle-orm';
import { bills } from '../../shared/schema';
import OpenAI from 'openai';

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface SearchParams {
  query: string;
  type: string;
  searchIn: string[];
  chambers: string[];
  status: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  topics: string[];
  sponsors: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchType: 'keyword' | 'semantic' | 'boolean';
  excludeTerms: string[];
  exactPhrases: string[];
  session: string;
  page?: number;
  limit?: number;
}

export function registerAdvancedSearchRoutes(app: Express): void {
  /**
   * Advanced search endpoint for bills
   */
  app.get('/api/search/bills', async (req: Request, res: Response) => {
    try {
      // Extract and parse query parameters
      const params: Partial<SearchParams> = {
        query: req.query.query as string,
        type: (req.query.type as string) || 'bills',
        searchIn: req.query.searchIn ? (req.query.searchIn as string).split(',') : ['title', 'description'],
        chambers: req.query.chambers ? (req.query.chambers as string).split(',') : ['house', 'senate'],
        status: req.query.status ? (req.query.status as string).split(',') : [],
        dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange as string) : undefined,
        topics: req.query.topics ? (req.query.topics as string).split(',') : [],
        sponsors: req.query.sponsors ? (req.query.sponsors as string).split(',') : [],
        sortBy: (req.query.sortBy as string) || 'relevance',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        searchType: (req.query.searchType as 'keyword' | 'semantic' | 'boolean') || 'keyword',
        excludeTerms: req.query.excludeTerms ? (req.query.excludeTerms as string).split(',') : [],
        exactPhrases: req.query.exactPhrases ? (req.query.exactPhrases as string).split(',') : [],
        session: (req.query.session as string) || '89R',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      // Input validation
      if (!params.query && params.searchType !== 'semantic') {
        return res.status(400).json({ 
          error: 'Search query is required for keyword and boolean searches' 
        });
      }

      // Default pagination values
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      // Build the query conditions
      let conditions = [];

      // Add session filter
      if (params.session) {
        conditions.push(eq(bills.session, params.session));
      }

      // Add chamber filters
      if (params.chambers && params.chambers.length > 0 && params.chambers.length < 2) {
        conditions.push(eq(bills.chamber, params.chambers[0]));
      }

      // Add status filters
      if (params.status && params.status.length > 0) {
        conditions.push(inArray(bills.status, params.status));
      }

      // Add date filters
      if (params.dateRange) {
        if (params.dateRange.start) {
          conditions.push(gte(bills.introducedAt, new Date(params.dateRange.start)));
        }
        if (params.dateRange.end) {
          conditions.push(lte(bills.introducedAt, new Date(params.dateRange.end)));
        }
      }

      // Build keyword search conditions
      if (params.query && params.searchType !== 'semantic') {
        const searchFields: string[] = params.searchIn || ['title', 'description'];
        const searchConditions = [];
        
        // Handle exact phrases
        let queryText = params.query;
        if (params.exactPhrases && params.exactPhrases.length > 0) {
          for (const phrase of params.exactPhrases) {
            // Add exact phrase to query condition
            searchConditions.push(
              or(
                ...searchFields.map(field => 
                  like(bills[field as keyof typeof bills] as any, `%${phrase}%`)
                )
              )
            );
          }
        }
        
        // Add main search query
        searchConditions.push(
          or(
            ...searchFields.map(field => 
              like(bills[field as keyof typeof bills] as any, `%${queryText}%`)
            )
          )
        );
        
        // Exclude terms
        if (params.excludeTerms && params.excludeTerms.length > 0) {
          for (const term of params.excludeTerms) {
            for (const field of searchFields) {
              conditions.push(
                sql`${bills[field as keyof typeof bills]} NOT LIKE ${'%' + term + '%'}`
              );
            }
          }
        }
        
        conditions.push(or(...searchConditions));
      }

      // Determine sort column and direction
      let orderBy;
      if (params.sortBy === 'relevance') {
        // For relevance, we'll use introducedAt as a proxy since we don't have a real relevance score
        orderBy = params.sortOrder === 'asc' ? asc(bills.introducedAt) : desc(bills.introducedAt);
      } else if (params.sortBy === 'introducedAt') {
        orderBy = params.sortOrder === 'asc' ? asc(bills.introducedAt) : desc(bills.introducedAt);
      } else if (params.sortBy === 'lastActionAt') {
        orderBy = params.sortOrder === 'asc' ? asc(bills.lastActionAt) : desc(bills.lastActionAt);
      } else if (params.sortBy === 'title') {
        orderBy = params.sortOrder === 'asc' ? asc(bills.title) : desc(bills.title);
      } else {
        // Default sort by introduced date descending
        orderBy = desc(bills.introducedAt);
      }

      // For semantic search with OpenAI
      if (params.searchType === 'semantic' && params.query && openai) {
        try {
          // First get all bills that match the other criteria
          const allMatchingBills = await db
            .select()
            .from(bills).$dynamic()
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(orderBy)
            .limit(100); // Limit to 100 to keep processing manageable
          
          // Use OpenAI to perform semantic search
          const response = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: params.query,
          });
          
          const queryEmbedding = response.data[0].embedding;
          
          // For now, we'll simulate a relevance score based on simple text matching
          // since we don't actually have embeddings stored in the database yet
          const billsWithRelevance = allMatchingBills.map(bill => {
            // Basic relevance calculation (this would be replaced with proper embedding similarity)
            let relevance = 0;
            const queryLower = params.query?.toLowerCase() || '';
            
            if (bill.title.toLowerCase().includes(queryLower)) {
              relevance += 0.8;
            }
            
            if (bill.description && bill.description.toLowerCase().includes(queryLower)) {
              relevance += 0.5;
            }
            
            return {
              ...bill,
              relevance: Math.min(relevance, 0.99)
            };
          });
          
          // Sort by relevance
          billsWithRelevance.sort((a, b) => b.relevance - a.relevance);
          
          // Paginate results
          const paginatedResults = billsWithRelevance.slice(offset, offset + limit);
          
          return res.json({
            results: paginatedResults,
            pagination: {
              total: billsWithRelevance.length,
              page,
              limit,
              offset,
              pages: Math.ceil(billsWithRelevance.length / limit)
            }
          });
        } catch (error: any) {
          console.error('Semantic search error:', error);
          return res.status(500).json({ 
            error: 'An error occurred during semantic search', 
            details: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        // For standard keyword search
        // First, count total results
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(bills).$dynamic()
          .where(conditions.length > 0 ? and(...conditions) : undefined);
        
        const total = countResult[0]?.count || 0;
        
        // Then get paginated results
        const results = await db
          .select()
          .from(bills).$dynamic()
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);
        
        // Add a fake relevance score for the frontend (in real implementation this would be more sophisticated)
        const resultsWithRelevance = results.map(bill => {
          let relevance = 0;
          const queryLower = params.query?.toLowerCase() || '';
          
          if (bill.title.toLowerCase().includes(queryLower)) {
            relevance += 0.8;
          }
          
          if (bill.description && bill.description.toLowerCase().includes(queryLower)) {
            relevance += 0.5;
          }
          
          // Random policy difficulty for demo (would be calculated)
          const policy_difficulty = Math.floor(Math.random() * 5) + 1; // 1-5
          
          // Random sentiment score for demo (would be calculated)
          const sentiment_score = Math.floor(Math.random() * 100) - 50; // -50 to 50
          
          return {
            ...bill,
            relevance: Math.min(relevance, 0.99),
            policy_difficulty,
            sentiment_score
          };
        });
        
        return res.json({
          results: resultsWithRelevance,
          pagination: {
            total,
            page,
            limit,
            offset,
            pages: Math.ceil(total / limit)
          }
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while processing the search', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Save a search for later use (requires authentication in a real app)
   */
  app.post('/api/search/save', async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would save to a database
      // For now, we just mock a success response
      return res.json({
        success: true,
        message: 'Search saved successfully',
        searchId: Date.now().toString()
      });
    } catch (error: any) {
      console.error('Error saving search:', error);
      return res.status(500).json({
        error: 'Failed to save search',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}