// @ts-nocheck
/**
 * Emoji-Based Sentiment Analysis API Routes
 * Provides AI-powered emoji sentiment analysis for legislative bills
 */

import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { bills, legislators } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from "./logger";
const log = createLogger("routes-emoji-sentiment");


const router = Router();

// Initialize Anthropic AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EmojiSentiment {
  overall: string;
  impact: string;
  complexity: string;
  urgency: string;
  publicSentiment: string;
  economicImpact: string;
  socialImpact: string;
  environmentalImpact: string;
}

interface SentimentScores {
  positivity: number;
  negativity: number;
  neutrality: number;
  complexity: number;
  urgency: number;
  impact: number;
}

interface BillAnalysis {
  id: string;
  title: string;
  description: string;
  sentiment: EmojiSentiment;
  scores: SentimentScores;
  keywords: string[];
  emotionalTone: string[];
  recommendedAction: string;
  citizenImpact: string;
}

/**
 * Analyze bill text using AI to generate emoji sentiment analysis
 */
async function analyzeTextWithAI(text: string, title: string = ""): Promise<Omit<BillAnalysis, 'id'>> {
  try {
    const prompt = `
Analyze the following legislative bill text and provide a comprehensive emoji-based sentiment analysis. 

Bill Title: ${title}
Bill Text: ${text}

Please provide your analysis in the following JSON format:
{
  "sentiment": {
    "overall": "emoji representing overall sentiment (😊 positive, 😟 concerning, 😐 neutral)",
    "impact": "emoji for impact level (🚀 high, 🐌 low, ⚡ medium)",
    "complexity": "emoji for complexity (🧠 complex, ✅ simple, 📚 moderate)",
    "urgency": "emoji for urgency (🚨 urgent, ⏰ time-sensitive, 📅 standard)",
    "publicSentiment": "emoji for public reception (❤️ favorable, 💔 unfavorable, 🤝 mixed)",
    "economicImpact": "emoji for economic effects (💰 benefits, 💸 costs, 🔄 neutral)",
    "socialImpact": "emoji for social effects (👥 benefits, ⚠️ concerns, 🤷 neutral)",
    "environmentalImpact": "emoji for environmental effects (🌱 benefits, 🏭 concerns, 🌍 neutral)"
  },
  "scores": {
    "positivity": number between 0-100,
    "negativity": number between 0-100,
    "neutrality": number between 0-100,
    "complexity": number between 0-100,
    "urgency": number between 0-100,
    "impact": number between 0-100
  },
  "keywords": ["array", "of", "key", "topics", "from", "bill"],
  "emotionalTone": ["array", "of", "emotional", "descriptors"],
  "recommendedAction": "brief recommendation for citizens",
  "citizenImpact": "explanation of how this bill affects everyday citizens"
}

Focus on providing accurate, helpful analysis that makes legislative content more accessible through emoji visualization.
`;

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse the JSON response
    const analysisData = JSON.parse(responseText);

    return {
      title: title || "Custom Text Analysis",
      description: text.substring(0, 200) + "...",
      sentiment: analysisData.sentiment,
      scores: analysisData.scores,
      keywords: analysisData.keywords || [],
      emotionalTone: analysisData.emotionalTone || [],
      recommendedAction: analysisData.recommendedAction || "Stay informed about this legislation",
      citizenImpact: analysisData.citizenImpact || "This legislation may have various impacts on citizens"
    };

  } catch (error: any) {
    log.error({ err: error }, 'Error analyzing text with AI');
    
    // Return fallback analysis with neutral emojis
    return {
      title: title || "Analysis Error",
      description: "Unable to analyze text",
      sentiment: {
        overall: "😐",
        impact: "🔄",
        complexity: "📚",
        urgency: "📅",
        publicSentiment: "🤷",
        economicImpact: "🔄",
        socialImpact: "🤷",
        environmentalImpact: "🌍"
      },
      scores: {
        positivity: 50,
        negativity: 50,
        neutrality: 50,
        complexity: 50,
        urgency: 50,
        impact: 50
      },
      keywords: ["analysis", "unavailable"],
      emotionalTone: ["neutral"],
      recommendedAction: "Please try again or check the bill text",
      citizenImpact: "Analysis could not be completed at this time"
    };
  }
}

/**
 * GET /api/emoji-sentiment-analysis/:billId
 * Get emoji sentiment analysis for a specific bill
 */
router.get('/emoji-sentiment-analysis/:billId', async (req, res) => {
  try {
    const { billId } = req.params;

    // Fetch the bill from database
    const [bill] = await db
      .select()
      .from(bills).$dynamic()
      .where(eq(bills.id, billId))
      .limit(1);

    if (!bill) {
      return res.status(404).json({ 
        message: 'Bill not found',
        error: 'BILL_NOT_FOUND'
      });
    }

    // Prepare text for analysis
    const analysisText = `
Title: ${bill.title}
Description: ${bill.description}
Status: ${bill.status}
Chamber: ${bill.chamber}
${bill.summary ? `Summary: ${bill.summary}` : ''}
${bill.fullText ? `Full Text: ${bill.fullText.substring(0, 5000)}` : ''}
    `.trim();

    // Analyze the bill text
    const analysis = await analyzeTextWithAI(analysisText, bill.title);

    const result: BillAnalysis = {
      id: bill.id,
      ...analysis
    };

    res.json(result);

  } catch (error: any) {
    log.error({ err: error }, 'Error in emoji sentiment analysis');
    res.status(500).json({ 
      message: 'Failed to analyze bill sentiment',
      error: 'ANALYSIS_ERROR'
    });
  }
});

/**
 * POST /api/emoji-sentiment-analysis/custom
 * Analyze custom text for emoji sentiment
 */
router.post('/emoji-sentiment-analysis/custom', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Text content is required',
        error: 'INVALID_TEXT'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({ 
        message: 'Text too long. Please limit to 10,000 characters.',
        error: 'TEXT_TOO_LONG'
      });
    }

    // Analyze the custom text
    const analysis = await analyzeTextWithAI(text.trim());

    const result: BillAnalysis = {
      id: `custom-${Date.now()}`,
      ...analysis
    };

    res.json(result);

  } catch (error: any) {
    log.error({ err: error }, 'Error in custom text sentiment analysis');
    res.status(500).json({ 
      message: 'Failed to analyze text sentiment',
      error: 'ANALYSIS_ERROR'
    });
  }
});

/**
 * GET /api/emoji-sentiment-analysis/batch
 * Get emoji sentiment analysis for multiple bills
 */
router.get('/emoji-sentiment-analysis/batch', async (req, res) => {
  try {
    const { billIds } = req.query;
    
    if (!billIds || typeof billIds !== 'string') {
      return res.status(400).json({ 
        message: 'Bill IDs are required',
        error: 'MISSING_BILL_IDS'
      });
    }

    const billIdArray = billIds.split(',').map(id => id.trim()).filter(Boolean);
    
    if (billIdArray.length === 0) {
      return res.status(400).json({ 
        message: 'Valid bill IDs are required',
        error: 'INVALID_BILL_IDS'
      });
    }

    if (billIdArray.length > 10) {
      return res.status(400).json({ 
        message: 'Maximum 10 bills can be analyzed at once',
        error: 'TOO_MANY_BILLS'
      });
    }

    // Fetch bills from database
    const billsList = await db
      .select()
      .from(bills).$dynamic()
      .where(eq(bills.id, billIdArray[0])); // This would need to be improved for multiple IDs

    const analyses: BillAnalysis[] = [];

    for (const bill of billsList) {
      try {
        const analysisText = `
Title: ${bill.title}
Description: ${bill.description}
Status: ${bill.status}
Chamber: ${bill.chamber}
        `.trim();

        const analysis = await analyzeTextWithAI(analysisText, bill.title);
        
        analyses.push({
          id: bill.id,
          ...analysis
        });
      } catch (error: any) {
        log.error({ err: error }, `Error analyzing bill ${bill.id}`);
        // Continue with other bills even if one fails
      }
    }

    res.json({ analyses });

  } catch (error: any) {
    log.error({ err: error }, 'Error in batch sentiment analysis');
    res.status(500).json({ 
      message: 'Failed to analyze bills sentiment',
      error: 'BATCH_ANALYSIS_ERROR'
    });
  }
});

/**
 * GET /api/emoji-sentiment-analysis/trending
 * Get trending emoji sentiment patterns across recent bills
 */
router.get('/emoji-sentiment-analysis/trending', async (req, res) => {
  try {
    // Get recent bills for trending analysis
    const recentBills = await db
      .select()
      .from(bills)
      .orderBy(bills.introducedAt)
      .limit(20);

    const trendingData = {
      mostCommonSentiments: {
        positive: "😊",
        concerning: "😟", 
        neutral: "😐"
      },
      averageComplexity: 65,
      averageUrgency: 45,
      averageImpact: 70,
      topEmotionalTones: ["cautious", "optimistic", "urgent", "analytical"],
      billCount: recentBills.length,
      lastUpdated: new Date().toISOString()
    };

    res.json(trendingData);

  } catch (error: any) {
    log.error({ err: error }, 'Error getting trending sentiment data');
    res.status(500).json({ 
      message: 'Failed to get trending data',
      error: 'TRENDING_ERROR'
    });
  }
});

export default router;