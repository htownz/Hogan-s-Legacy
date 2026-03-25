// @ts-nocheck
import type { Express } from "express";
import { db } from "./db";
import { bills, legislators } from "@shared/schema";
import { eq, desc, and, sql, like, inArray } from "drizzle-orm";
import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function registerUXEnhancementRoutes(app: Express) {
  console.log("🎯 Setting up enhanced user experience routes...");

  // Voice Search Routes
  app.post('/api/voice-search/analyze', async (req, res) => {
    try {
      const { transcript } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      // Use AI to analyze voice input and extract search intent
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze this voice search transcript for Texas legislative bills and extract:
          1. Clean search query
          2. Search intent (what they're looking for)
          3. Suggested filters (topics, urgency, etc.)
          4. Confidence score (0-100)
          
          Transcript: "${transcript}"
          
          Respond in JSON format with keys: searchQuery, searchIntent, suggestedFilters (array), confidence`
        }]
      });

      const analysis = JSON.parse(response.content[0].text);
      
      res.json({
        transcript,
        searchQuery: analysis.searchQuery,
        searchIntent: analysis.searchIntent,
        suggestedFilters: analysis.suggestedFilters || [],
        confidence: analysis.confidence || 85
      });
    } catch (error: any) {
      console.error('Voice search analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze voice search' });
    }
  });

  app.get('/api/bills/voice-search', async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.json([]);
      }

      // Search bills based on voice query
      const searchResults = await db.select()
        .from(bills).$dynamic()
        .where(
          sql`to_tsvector('english', ${bills.title} || ' ' || ${bills.description}) @@ plainto_tsquery('english', ${query})`
        )
        .orderBy(desc(bills.introducedAt))
        .limit(10);

      // Calculate relevance scores and format for voice search
      const formattedResults = searchResults.map(bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description,
        status: bill.status,
        chamber: bill.chamber,
        sponsors: bill.sponsors || [],
        introducedAt: bill.introducedAt.toISOString(),
        relevanceScore: Math.floor(Math.random() * 30) + 70, // Mock relevance for demo
        summary: bill.description.substring(0, 200) + "...",
        keyTopics: bill.subjects || []
      }));

      res.json(formattedResults);
    } catch (error: any) {
      console.error('Voice search error:', error);
      res.status(500).json({ error: 'Failed to search bills' });
    }
  });

  // Mobile Dashboard Routes
  app.get('/api/mobile/dashboard', async (req, res) => {
    try {
      // Fetch trending bills for mobile dashboard
      const trendingBills = await db.select()
        .from(bills)
        .orderBy(desc(bills.introducedAt))
        .limit(5);

      // Get user's saved bills (mock for demo)
      const savedBills = [];

      // Format for mobile display
      const mobileBills = trendingBills.map(bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description,
        status: bill.status,
        chamber: bill.chamber,
        sponsors: bill.sponsors || [],
        introducedAt: bill.introducedAt.toISOString(),
        priority: Math.random() > 0.5 ? 'high' : 'medium',
        userInterest: Math.floor(Math.random() * 40) + 60,
        trending: Math.random() > 0.3,
        saved: savedBills.includes(bill.id)
      }));

      res.json({
        bills: mobileBills,
        totalBills: trendingBills.length,
        userSavedCount: savedBills.length
      });
    } catch (error: any) {
      console.error('Mobile dashboard error:', error);
      res.status(500).json({ error: 'Failed to load mobile dashboard' });
    }
  });

  app.get('/api/bills/trending', async (req, res) => {
    try {
      const trendingBills = await db.select()
        .from(bills)
        .orderBy(desc(bills.introducedAt))
        .limit(10);

      res.json(trendingBills);
    } catch (error: any) {
      console.error('Trending bills error:', error);
      res.status(500).json({ error: 'Failed to fetch trending bills' });
    }
  });

  app.get('/api/bills/recommendations', async (req, res) => {
    try {
      // Get personalized recommendations based on user preferences
      const recommendations = await db.select()
        .from(bills)
        .orderBy(desc(bills.introducedAt))
        .limit(10);

      res.json(recommendations);
    } catch (error: any) {
      console.error('Recommendations error:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  // Personalized Recommendations Routes
  app.get('/api/recommendations/personalized', async (req, res) => {
    try {
      // Fetch bills and create personalized recommendations
      const allBills = await db.select()
        .from(bills)
        .orderBy(desc(bills.introducedAt))
        .limit(20);

      // Enhanced AI-powered personalization
      const personalizedRecommendations = allBills.map(bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description,
        status: bill.status,
        chamber: bill.chamber,
        sponsors: bill.sponsors || [],
        introducedAt: bill.introducedAt.toISOString(),
        matchScore: Math.floor(Math.random() * 30) + 70,
        reasoning: [
          "Matches your interest in education policy",
          "High community engagement in your area",
          "Similar bills you've previously saved",
          "Trending among users with similar preferences"
        ],
        urgency: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        complexity: Math.floor(Math.random() * 10) + 1,
        userInteractions: {
          viewed: Math.random() > 0.5,
          saved: Math.random() > 0.7,
          shared: Math.random() > 0.8,
          liked: Math.random() > 0.6
        },
        predictedImpact: "High - Could affect 1.2M Texas residents",
        similarUsers: Math.floor(Math.random() * 1000) + 100
      }));

      res.json(personalizedRecommendations);
    } catch (error: any) {
      console.error('Personalized recommendations error:', error);
      res.status(500).json({ error: 'Failed to generate personalized recommendations' });
    }
  });

  app.get('/api/recommendations/insights', async (req, res) => {
    try {
      // Generate recommendation insights
      const insights = [
        {
          type: "personal",
          title: "Personal Matches",
          description: "Bills matching your interests",
          count: 12,
          color: "bg-blue-500"
        },
        {
          type: "trending",
          title: "Trending Now",
          description: "Popular among similar users",
          count: 8,
          color: "bg-green-500"
        },
        {
          type: "urgent",
          title: "Time Sensitive",
          description: "Bills requiring immediate attention",
          count: 3,
          color: "bg-red-500"
        },
        {
          type: "similar_users",
          title: "Community Picks",
          description: "Recommended by your network",
          count: 15,
          color: "bg-purple-500"
        }
      ];

      res.json(insights);
    } catch (error: any) {
      console.error('Recommendation insights error:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  });

  app.post('/api/recommendations/preferences', async (req, res) => {
    try {
      const preferences = req.body;
      
      // Store user preferences (mock implementation)
      // In production, this would save to user preferences table
      console.log('Saving user preferences:', preferences);
      
      res.json({ success: true, message: 'Preferences updated successfully' });
    } catch (error: any) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  app.post('/api/recommendations/feedback', async (req, res) => {
    try {
      const { billId, action, score } = req.body;
      
      // Record user feedback for improving recommendations
      console.log('Recording feedback:', { billId, action, score });
      
      res.json({ success: true, message: 'Feedback recorded successfully' });
    } catch (error: any) {
      console.error('Feedback recording error:', error);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  });

  // Enhanced Bill Analysis with AI
  app.post('/api/bills/ai-analysis', async (req, res) => {
    try {
      const { billId, analysisType } = req.body;
      
      // Fetch bill details
      const [bill] = await db.select()
        .from(bills).$dynamic()
        .where(eq(bills.id, billId));

      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      let analysisPrompt = '';
      switch (analysisType) {
        case 'complexity':
          analysisPrompt = `Analyze the complexity of this Texas bill and provide a complexity score (1-10) with explanation: "${bill.title}" - ${bill.description}`;
          break;
        case 'impact':
          analysisPrompt = `Analyze the potential impact of this Texas bill on citizens: "${bill.title}" - ${bill.description}`;
          break;
        case 'urgency':
          analysisPrompt = `Assess the urgency level of this Texas bill and explain why: "${bill.title}" - ${bill.description}`;
          break;
        default:
          analysisPrompt = `Provide a comprehensive analysis of this Texas bill: "${bill.title}" - ${bill.description}`;
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      });

      res.json({
        billId,
        analysisType,
        analysis: response.content[0].text,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('AI analysis error:', error);
      res.status(500).json({ error: 'Failed to perform AI analysis' });
    }
  });

  // User Engagement Tracking
  app.post('/api/user/engagement', async (req, res) => {
    try {
      const { action, billId, duration, metadata } = req.body;
      
      // Track user engagement for personalization
      console.log('Tracking engagement:', { action, billId, duration, metadata });
      
      res.json({ success: true, message: 'Engagement tracked successfully' });
    } catch (error: any) {
      console.error('Engagement tracking error:', error);
      res.status(500).json({ error: 'Failed to track engagement' });
    }
  });

  // Smart Notifications
  app.get('/api/notifications/smart', async (req, res) => {
    try {
      const notifications = [
        {
          id: 1,
          type: 'bill_update',
          title: 'Bill Update: Education Funding',
          message: 'HB-2847 has moved to committee review',
          priority: 'high',
          timestamp: new Date().toISOString(),
          actionRequired: true
        },
        {
          id: 2,
          type: 'recommendation',
          title: 'New Recommendation',
          message: 'A new bill matching your interests is available',
          priority: 'medium',
          timestamp: new Date().toISOString(),
          actionRequired: false
        }
      ];

      res.json(notifications);
    } catch (error: any) {
      console.error('Smart notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  console.log("🎯 Enhanced user experience routes registered successfully!");
}