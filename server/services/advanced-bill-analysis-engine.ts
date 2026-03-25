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

interface AdvancedBillAnalysis {
  // Core Analysis
  summary: string;
  executiveSummary: string;
  detailedImpact: {
    economic: {
      score: number;
      description: string;
      affectedSectors: string[];
      fiscalImpact: string;
    };
    social: {
      score: number;
      description: string;
      affectedGroups: string[];
      equityImpact: string;
    };
    environmental: {
      score: number;
      description: string;
      environmentalFactors: string[];
    };
    legal: {
      score: number;
      description: string;
      constitutionalConcerns: string[];
      precedentImpact: string;
    };
  };
  
  // Complexity & Accessibility
  complexity: 'simple' | 'moderate' | 'complex' | 'highly-complex';
  readabilityScore: number;
  plainLanguageSummary: string;
  keyTermsGlossary: { term: string; definition: string }[];
  
  // Strategic Analysis
  keyStakeholders: string[];
  lobbyingInterests: string[];
  potentialOpposition: string[];
  politicalLandscape: string;
  
  // Implementation Analysis
  implementationChallenges: string[];
  timelineEstimate: string;
  requiredResources: string[];
  successProbability: number;
  
  // Citizen Engagement
  actionableSteps: string[];
  contactRecommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  citizenImpactScore: number;
  
  // Comparative Analysis
  similarBills: string[];
  historicalPrecedents: string[];
  crossStateComparisons: string[];
  
  // AI Confidence Metrics
  analysisConfidence: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'limited';
  lastUpdated: string;
}

interface EntityExtractionResult {
  people: {
    name: string;
    role: string;
    organization?: string;
    influence: 'high' | 'medium' | 'low';
    stance?: 'support' | 'oppose' | 'neutral';
  }[];
  organizations: {
    name: string;
    type: string;
    influence: 'high' | 'medium' | 'low';
    stance?: 'support' | 'oppose' | 'neutral';
  }[];
  locations: {
    name: string;
    type: 'district' | 'city' | 'county' | 'region';
    impactLevel: 'high' | 'medium' | 'low';
  }[];
  financialData: {
    amount: number;
    type: 'funding' | 'cost' | 'savings' | 'revenue';
    source: string;
    confidence: number;
  }[];
  dates: {
    date: string;
    event: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
  }[];
  legalReferences: {
    citation: string;
    type: 'statute' | 'regulation' | 'case_law' | 'constitutional';
    relevance: 'direct' | 'indirect' | 'contextual';
  }[];
}

interface SemanticMatch {
  billId: string;
  title: string;
  similarityScore: number;
  matchType: 'content' | 'topic' | 'impact' | 'stakeholder';
  keyOverlaps: string[];
  differenceHighlights: string[];
}

export class AdvancedBillAnalysisEngine {
  
  async performComprehensiveAnalysis(billText: string, billTitle: string, billNumber?: string): Promise<AdvancedBillAnalysis> {
    try {
      // Enhanced multi-step analysis with Claude
      const [basicAnalysis, stakeholderAnalysis, implementationAnalysis] = await Promise.all([
        this.performBasicAnalysis(billText, billTitle),
        this.analyzeStakeholders(billText, billTitle),
        this.analyzeImplementation(billText, billTitle)
      ]);

      // Combine all analyses
      const comprehensiveAnalysis: AdvancedBillAnalysis = {
        ...basicAnalysis,
        ...stakeholderAnalysis,
        ...implementationAnalysis,
        analysisConfidence: this.calculateConfidenceScore(billText),
        dataQuality: this.assessDataQuality(billText),
        lastUpdated: new Date().toISOString(),
      };

      // Find similar bills using enhanced semantic search
      if (billNumber) {
        comprehensiveAnalysis.similarBills = await this.findSimilarBills(billText, billTitle);
      }

      return comprehensiveAnalysis;
    } catch (error: any) {
      console.error('Comprehensive analysis failed:', error);
      throw new Error('Failed to perform comprehensive bill analysis');
    }
  }

  private async performBasicAnalysis(billText: string, billTitle: string): Promise<Partial<AdvancedBillAnalysis>> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2500,
      system: `You are an expert legislative analyst with deep knowledge of Texas government, policy impact, and civic engagement. Analyze bills with precision, objectivity, and focus on real-world implications for citizens. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Perform a comprehensive analysis of this Texas bill:

Title: ${billTitle}
Text: ${billText}

Provide analysis in this exact JSON format:
{
  "summary": "Brief overview of the bill's purpose and scope",
  "executiveSummary": "Detailed 2-3 paragraph executive summary for stakeholders",
  "detailedImpact": {
    "economic": {
      "score": 1-10,
      "description": "Economic impact analysis",
      "affectedSectors": ["sector1", "sector2"],
      "fiscalImpact": "Government budget impact"
    },
    "social": {
      "score": 1-10,
      "description": "Social impact analysis",
      "affectedGroups": ["group1", "group2"],
      "equityImpact": "Impact on different communities"
    },
    "environmental": {
      "score": 1-10,
      "description": "Environmental impact analysis",
      "environmentalFactors": ["factor1", "factor2"]
    },
    "legal": {
      "score": 1-10,
      "description": "Legal and constitutional analysis",
      "constitutionalConcerns": ["concern1", "concern2"],
      "precedentImpact": "How this sets legal precedent"
    }
  },
  "complexity": "simple|moderate|complex|highly-complex",
  "readabilityScore": 1-100,
  "plainLanguageSummary": "Simple explanation for general public",
  "keyTermsGlossary": [
    {"term": "term1", "definition": "definition1"},
    {"term": "term2", "definition": "definition2"}
  ],
  "citizenImpactScore": 1-10,
  "urgencyLevel": "low|medium|high|critical"
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
    throw new Error('Invalid response format from Claude');
  }

  private async analyzeStakeholders(billText: string, billTitle: string): Promise<Partial<AdvancedBillAnalysis>> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: `You are a political strategist expert in Texas politics, lobbying networks, and stakeholder analysis. Identify key players, interests, and political dynamics. Respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Analyze the stakeholder landscape for this Texas bill:

Title: ${billTitle}
Text: ${billText}

Provide stakeholder analysis in this JSON format:
{
  "keyStakeholders": ["stakeholder1", "stakeholder2"],
  "lobbyingInterests": ["interest1", "interest2"],
  "potentialOpposition": ["opposition1", "opposition2"],
  "politicalLandscape": "Analysis of political dynamics and voting likelihood",
  "actionableSteps": ["action1", "action2"],
  "contactRecommendations": ["contact1", "contact2"]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
    throw new Error('Invalid stakeholder analysis response');
  }

  private async analyzeImplementation(billText: string, billTitle: string): Promise<Partial<AdvancedBillAnalysis>> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      system: `You are a policy implementation expert with experience in Texas state government operations. Analyze practical implementation challenges and requirements. Respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Analyze implementation aspects of this Texas bill:

Title: ${billTitle}
Text: ${billText}

Provide implementation analysis in this JSON format:
{
  "implementationChallenges": ["challenge1", "challenge2"],
  "timelineEstimate": "Realistic timeline for implementation",
  "requiredResources": ["resource1", "resource2"],
  "successProbability": 1-100,
  "historicalPrecedents": ["precedent1", "precedent2"],
  "crossStateComparisons": ["comparison1", "comparison2"]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
    throw new Error('Invalid implementation analysis response');
  }

  async extractEntitiesAndRelationships(text: string): Promise<EntityExtractionResult> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: `You are an expert in named entity recognition and relationship extraction for legislative documents. Extract people, organizations, locations, financial data, dates, and legal references with high precision. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Extract entities and relationships from this legislative text:

${text}

Provide extraction results in this exact JSON format:
{
  "people": [
    {
      "name": "Person Name",
      "role": "their role/title",
      "organization": "associated org (optional)",
      "influence": "high|medium|low",
      "stance": "support|oppose|neutral (optional)"
    }
  ],
  "organizations": [
    {
      "name": "Organization Name",
      "type": "government|private|nonprofit|etc",
      "influence": "high|medium|low",
      "stance": "support|oppose|neutral (optional)"
    }
  ],
  "locations": [
    {
      "name": "Location Name",
      "type": "district|city|county|region",
      "impactLevel": "high|medium|low"
    }
  ],
  "financialData": [
    {
      "amount": 1000000,
      "type": "funding|cost|savings|revenue",
      "source": "funding source",
      "confidence": 1-100
    }
  ],
  "dates": [
    {
      "date": "YYYY-MM-DD or description",
      "event": "event description",
      "importance": "critical|high|medium|low"
    }
  ],
  "legalReferences": [
    {
      "citation": "legal citation",
      "type": "statute|regulation|case_law|constitutional",
      "relevance": "direct|indirect|contextual"
    }
  ]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
    throw new Error('Invalid entity extraction response');
  }

  async findSimilarBills(billText: string, billTitle: string): Promise<string[]> {
    try {
      // Create embedding for the current bill
      const embedding = await this.createEmbedding(billText + ' ' + billTitle);
      
      // Search for similar bills in Pinecone
      const searchResults = await index.query({
        vector: embedding,
        topK: 10,
        includeMetadata: true,
        filter: {
          type: { $eq: 'bill' }
        }
      });

      return searchResults.matches
        ?.filter(match => match.score && match.score > 0.8)
        .slice(0, 5)
        .map(match => match.metadata?.title as string)
        .filter(Boolean) || [];
    } catch (error: any) {
      console.error('Error finding similar bills:', error);
      return [];
    }
  }

  async performSemanticMatch(query: string, options: {
    topK?: number;
    minScore?: number;
    type?: string;
  } = {}): Promise<SemanticMatch[]> {
    try {
      const { topK = 20, minScore = 0.75, type } = options;
      
      const embedding = await this.createEmbedding(query);
      
      const searchResults = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter: type ? { type: { $eq: type } } : undefined
      });

      const matches: SemanticMatch[] = [];
      
      for (const match of searchResults.matches || []) {
        if (match.score && match.score >= minScore && match.metadata) {
          // Analyze the match with Claude for better insights
          const matchAnalysis = await this.analyzeSemanticMatch(
            query, 
            match.metadata.content as string,
            match.metadata.title as string
          );
          
          matches.push({
            billId: match.id,
            title: match.metadata.title as string,
            similarityScore: match.score,
            ...matchAnalysis
          });
        }
      }

      return matches.sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (error: any) {
      console.error('Semantic matching failed:', error);
      return [];
    }
  }

  private async analyzeSemanticMatch(query: string, matchContent: string, matchTitle: string): Promise<{
    matchType: 'content' | 'topic' | 'impact' | 'stakeholder';
    keyOverlaps: string[];
    differenceHighlights: string[];
  }> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 800,
      system: `Analyze the semantic relationship between a search query and a matched document. Identify overlap types and key differences. Respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Compare these texts and identify their relationship:

Query: ${query}
Match Title: ${matchTitle}
Match Content: ${matchContent.substring(0, 1000)}...

Provide analysis in this JSON format:
{
  "matchType": "content|topic|impact|stakeholder",
  "keyOverlaps": ["overlap1", "overlap2", "overlap3"],
  "differenceHighlights": ["difference1", "difference2"]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
    
    // Fallback if parsing fails
    return {
      matchType: 'content',
      keyOverlaps: ['Content similarity detected'],
      differenceHighlights: ['Specific differences require detailed analysis']
    };
  }

  private async createEmbedding(text: string): Promise<number[]> {
    // This would integrate with your embedding service
    // For now, return a placeholder - you'd integrate with OpenAI embeddings or similar
    throw new Error('Embedding service integration required');
  }

  private calculateConfidenceScore(billText: string): number {
    // Calculate confidence based on text length, completeness, etc.
    const textLength = billText.length;
    const hasStructure = billText.includes('SECTION') || billText.includes('Article');
    const hasNumbers = /\d/.test(billText);
    
    let score = 50; // base score
    
    if (textLength > 1000) score += 20;
    if (textLength > 5000) score += 15;
    if (hasStructure) score += 10;
    if (hasNumbers) score += 5;
    
    return Math.min(score, 95); // cap at 95%
  }

  private assessDataQuality(billText: string): 'excellent' | 'good' | 'fair' | 'limited' {
    const length = billText.length;
    const hasMetadata = billText.includes('Bill Number') || billText.includes('Author');
    const isComplete = billText.includes('SECTION') && billText.includes('effective');
    
    if (length > 5000 && hasMetadata && isComplete) return 'excellent';
    if (length > 2000 && (hasMetadata || isComplete)) return 'good';
    if (length > 500) return 'fair';
    return 'limited';
  }
}

export const advancedBillAnalysisEngine = new AdvancedBillAnalysisEngine();