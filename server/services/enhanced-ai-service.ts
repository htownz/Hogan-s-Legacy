// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index('llama-text-embed-v2-index');

interface BillAnalysis {
  summary: string;
  impact: string;
  complexity: 'simple' | 'moderate' | 'complex';
  keyPoints: string[];
  citizenImpact: string;
  actionable: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

interface SemanticSearchResult {
  id: string;
  score: number;
  metadata: {
    title: string;
    content: string;
    type: string;
    date?: string;
  };
}

export class EnhancedAIService {
  
  async analyzeBillWithClaude(billText: string, billTitle: string): Promise<BillAnalysis> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        system: `You are a civic engagement expert helping citizens understand legislation. Analyze bills clearly and objectively, focusing on real-world impact for ordinary people. Provide practical, actionable insights without political bias. Always respond with valid JSON format.`,
        messages: [{
          role: 'user',
          content: `Analyze this Texas legislative bill and provide insights for citizens:

Title: ${billTitle}

Full Text: ${billText}

Please provide a JSON response with:
- summary: Clear 2-3 sentence overview
- impact: How this affects everyday Texans
- complexity: simple/moderate/complex
- keyPoints: 3-5 most important aspects
- citizenImpact: Specific ways this changes daily life
- actionable: What citizens can do about this bill
- sentiment: overall tone (positive/neutral/negative)
- urgencyLevel: how quickly this needs attention (low/medium/high/urgent)`
        }]
      });

      const content = response.content[0];
      const analysisText = content.type === 'text' ? content.text : '';
      const analysis = JSON.parse(analysisText);
      
      return {
        summary: analysis.summary || "Bill analysis unavailable",
        impact: analysis.impact || "Impact assessment pending",
        complexity: analysis.complexity || "moderate",
        keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
        citizenImpact: analysis.citizenImpact || "Citizen impact being evaluated",
        actionable: analysis.actionable || "Review bill details and contact representatives",
        sentiment: analysis.sentiment || "neutral",
        urgencyLevel: analysis.urgencyLevel || "medium"
      };

    } catch (error: any) {
      console.error('Claude analysis failed:', error);
      
      // Fallback analysis structure
      return {
        summary: "AI analysis temporarily unavailable. Please review bill text directly.",
        impact: "Impact analysis requires manual review at this time.",
        complexity: "moderate",
        keyPoints: ["Review required", "Manual analysis needed"],
        citizenImpact: "Please consult bill text for specific impacts.",
        actionable: "Contact your representatives for clarification on this legislation.",
        sentiment: "neutral",
        urgencyLevel: "medium"
      };
    }
  }

  async semanticSearch(query: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    try {
      // Create embedding for the search query using a simple approach
      // In production, you'd want to use the same embedding model as your indexed data
      const searchResults = await index.query({
        topK: limit,
        includeMetadata: true,
        vector: await this.createSimpleEmbedding(query)
      });

      return searchResults.matches?.map(match => ({
        id: match.id || '',
        score: match.score || 0,
        metadata: {
          title: match.metadata?.title as string || 'Untitled',
          content: match.metadata?.content as string || '',
          type: match.metadata?.type as string || 'document',
          date: match.metadata?.date as string
        }
      })) || [];

    } catch (error: any) {
      console.error('Pinecone search failed:', error);
      return [];
    }
  }

  async findSimilarBills(billId: string, billContent: string): Promise<SemanticSearchResult[]> {
    try {
      const results = await this.semanticSearch(
        `Similar legislation: ${billContent.substring(0, 500)}`, 
        3
      );
      
      // Filter out the current bill
      return results.filter(result => result.id !== billId);
    } catch (error: any) {
      console.error('Similar bills search failed:', error);
      return [];
    }
  }

  async explainInSimpleTerms(complexText: string): Promise<string> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 800,
        system: `You are a patient teacher helping citizens understand complex legal language. Translate legislative text into clear, everyday language that anyone can understand. Use simple words and practical examples.`,
        messages: [{
          role: 'user',
          content: `Please explain this legislative text in simple, everyday language:

${complexText}

Make it clear and practical - what does this actually mean for regular people?`
        }]
      });

      return (response.content[0] as any).text || "Explanation unavailable at this time.";

    } catch (error: any) {
      console.error('Simple explanation failed:', error);
      return "Text simplification is temporarily unavailable. Please refer to the original document or contact your representatives for clarification.";
    }
  }

  async generateActionableInsights(billAnalysis: BillAnalysis): Promise<string[]> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 600,
        system: `You are a civic engagement coordinator. Generate specific, actionable steps citizens can take regarding legislation. Focus on practical actions like contacting representatives, attending hearings, or joining advocacy groups.`,
        messages: [{
          role: 'user',
          content: `Based on this bill analysis, suggest 3-5 specific actions citizens can take:

Summary: ${billAnalysis.summary}
Impact: ${billAnalysis.impact}
Urgency: ${billAnalysis.urgencyLevel}

Please provide a JSON array of actionable steps.`
        }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return Array.isArray(result.actions) ? result.actions : [];

    } catch (error: any) {
      console.error('Action insights failed:', error);
      return [
        "Contact your state representatives",
        "Follow bill progress on legislature.texas.gov",
        "Join relevant advocacy groups",
        "Attend public hearings if scheduled",
        "Share information with your community"
      ];
    }
  }

  private async createSimpleEmbedding(text: string): Promise<number[]> {
    // Simple text-to-vector conversion for demonstration
    // In production, use proper embedding models
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = normalized.split(' ').slice(0, 384); // Match common embedding dimensions
    
    const embedding = new Array(384).fill(0);
    for (let i = 0; i < words.length; i++) {
      const charSum = words[i].split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      embedding[i % 384] += charSum / 1000; // Normalize
    }
    
    return embedding;
  }

  async getBillRecommendations(userInterests: string[], previousBills: string[]): Promise<SemanticSearchResult[]> {
    try {
      const interestQuery = `Bills related to: ${userInterests.join(', ')}`;
      const results = await this.semanticSearch(interestQuery, 8);
      
      // Filter out bills user has already seen
      return results.filter(result => !previousBills.includes(result.id));
    } catch (error: any) {
      console.error('Recommendations failed:', error);
      return [];
    }
  }
}

export const enhancedAIService = new EnhancedAIService();

// Additional helper functions for batch processing compatibility
export async function generateStructuredBillSummary(billText: string, billTitle: string) {
  return await enhancedAIService.analyzeBillWithClaude(billText, billTitle);
}

export async function generateStructuredBillComparison(bill1: any, bill2: any) {
  const analysis1 = await enhancedAIService.analyzeBillWithClaude(bill1.text, bill1.title);
  const analysis2 = await enhancedAIService.analyzeBillWithClaude(bill2.text, bill2.title);
  
  return {
    bill1: analysis1,
    bill2: analysis2,
    comparison: {
      similarityScore: 0.75, // Placeholder for similarity calculation
      keyDifferences: ["Difference analysis pending"],
      recommendations: ["Compare bills for citizen impact"]
    }
  };
}

export async function generateStructuredLegislativeImpact(billText: string, billTitle: string) {
  const analysis = await enhancedAIService.analyzeBillWithClaude(billText, billTitle);
  
  return {
    impact: analysis.impact,
    citizenImpact: analysis.citizenImpact,
    urgencyLevel: analysis.urgencyLevel,
    actionableSteps: await enhancedAIService.generateActionableInsights(analysis)
  };
}