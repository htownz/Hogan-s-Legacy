import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { createLogger } from "../logger";
const log = createLogger("advanced-bill-analysis-service");


// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const index = pinecone.index('llama-text-embed-v2-index');

interface BillImpactAnalysis {
  overallScore: number;
  economicImpact: {
    score: number;
    description: string;
    affectedSectors: string[];
  };
  socialImpact: {
    score: number;
    description: string;
    affectedGroups: string[];
  };
  environmentalImpact: {
    score: number;
    description: string;
  };
  implementationComplexity: {
    score: number;
    timeline: string;
    challenges: string[];
  };
  stakeholderAnalysis: {
    supporters: string[];
    opponents: string[];
    neutralGroups: string[];
  };
}

interface LegislativeTrendAnalysis {
  trendScore: number;
  momentum: 'increasing' | 'decreasing' | 'stable';
  relatedBills: Array<{
    title: string;
    status: string;
    similarity: number;
  }>;
  publicSentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  mediaAttention: {
    score: number;
    recentMentions: number;
  };
}

export class AdvancedBillAnalysisService {
  
  async analyzeBillImpact(billText: string, billTitle: string): Promise<BillImpactAnalysis> {
    try {
      const prompt = `
        Analyze this bill for comprehensive impact assessment:
        
        Title: ${billTitle}
        Text: ${billText}
        
        Provide a detailed analysis in JSON format with:
        1. Overall impact score (0-100)
        2. Economic impact (score, description, affected sectors)
        3. Social impact (score, description, affected groups)
        4. Environmental impact (score, description)
        5. Implementation complexity (score, timeline, challenges)
        6. Stakeholder analysis (supporters, opponents, neutral groups)
        
        Score each category from 0-100 where:
        - 0-30: Low impact/complexity
        - 31-60: Moderate impact/complexity
        - 61-100: High impact/complexity
        
        Respond only with valid JSON.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Clean the response text and attempt to parse JSON
        let jsonText = content.text.trim();
        
        // Remove any markdown code blocks if present
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\s*/, '').replace(/\s*```$/, '');
        }
        
        return JSON.parse(jsonText);
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      log.error({ err: error }, 'Error analyzing bill impact');
      throw new Error('Failed to analyze bill impact');
    }
  }

  async analyzeLegislativeTrends(billText: string, billTitle: string): Promise<LegislativeTrendAnalysis> {
    try {
      // First, find similar bills using vector search
      const similarBills = await this.findSimilarBills(billText, 5);
      
      const prompt = `
        Analyze legislative trends for this bill:
        
        Title: ${billTitle}
        Text: ${billText}
        
        Similar bills found: ${JSON.stringify(similarBills)}
        
        Provide trend analysis in JSON format with:
        1. Trend score (0-100) - how trending this topic is
        2. Momentum (increasing/decreasing/stable)
        3. Related bills with status and similarity scores
        4. Public sentiment (positive/negative/neutral percentages)
        5. Media attention score and recent mentions count
        
        Base your analysis on:
        - Legislative patterns and historical context
        - Current political climate
        - Public interest indicators
        - Similar legislation outcomes
        
        Respond only with valid JSON.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      log.error({ err: error }, 'Error analyzing legislative trends');
      throw new Error('Failed to analyze legislative trends');
    }
  }

  async generateBillSummaryCard(billText: string, billTitle: string): Promise<{
    shortSummary: string;
    keyPoints: string[];
    citizenAction: string[];
    shareableQuote: string;
    hashtags: string[];
  }> {
    try {
      const prompt = `
        Create a shareable summary card for this bill:
        
        Title: ${billTitle}
        Text: ${billText}
        
        Generate in JSON format:
        1. Short summary (2-3 sentences, under 200 characters)
        2. Key points (3-5 bullet points)
        3. Citizen action items (3-4 actionable steps)
        4. Shareable quote (compelling 1-sentence summary)
        5. Relevant hashtags (3-5 hashtags)
        
        Make it engaging, informative, and social media friendly.
        Focus on how this affects everyday citizens.
        
        Respond only with valid JSON.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      log.error({ err: error }, 'Error generating summary card');
      throw new Error('Failed to generate summary card');
    }
  }

  async findSimilarBills(billText: string, limit: number = 5): Promise<Array<{
    id: string;
    title: string;
    score: number;
    status?: string;
  }>> {
    try {
      // Create embedding for the bill text
      const embedding = await this.createEmbedding(billText);
      
      // Search for similar bills
      const searchResults = await index.query({
        vector: embedding,
        topK: limit,
        includeMetadata: true
      });

      return searchResults.matches?.map(match => ({
        id: match.id,
        title: match.metadata?.title as string || 'Unknown Bill',
        score: match.score || 0,
        status: match.metadata?.status as string
      })) || [];
    } catch (error: any) {
      log.error({ err: error }, 'Error finding similar bills');
      return [];
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      // For demo purposes, return a mock embedding
      // In production, you'd use a proper embedding service
      return Array.from({ length: 1536 }, () => Math.random() - 0.5);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating embedding');
      throw new Error('Failed to create embedding');
    }
  }

  async analyzeBillComplexity(billText: string): Promise<{
    complexityScore: number;
    readabilityScore: number;
    legalJargonLevel: number;
    estimatedReadingTime: number;
    simplificationSuggestions: string[];
  }> {
    try {
      const prompt = `
        Analyze the complexity and readability of this bill:
        
        Text: ${billText}
        
        Provide analysis in JSON format with:
        1. Complexity score (0-100, where 100 is most complex)
        2. Readability score (0-100, where 100 is most readable)
        3. Legal jargon level (0-100, where 100 is heavy jargon)
        4. Estimated reading time in minutes
        5. Simplification suggestions (3-5 specific recommendations)
        
        Consider:
        - Sentence length and structure
        - Technical terminology usage
        - Legal language complexity
        - Overall accessibility to general public
        
        Respond only with valid JSON.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      log.error({ err: error }, 'Error analyzing bill complexity');
      throw new Error('Failed to analyze bill complexity');
    }
  }
}

export const advancedBillAnalysisService = new AdvancedBillAnalysisService();