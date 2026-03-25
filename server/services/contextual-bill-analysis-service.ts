// @ts-nocheck
import OpenAI from 'openai';
import axios from 'axios';
import { legiscanService } from './legiscan-service';
import { addDocumentsToVectorStore, querySimilarDocuments, generateRAGResponse } from './vector-database-service';
import { analyzeImage } from './multimodal-analysis-service';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Local cache directory
const CACHE_DIR = path.join(process.cwd(), 'data', 'bill-context-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Define interfaces for different types of contextual data
interface WitnessTestimony {
  witnessName: string;
  affiliation: string;
  position: 'support' | 'oppose' | 'neutral' | 'informational';
  date: string;
  billId: number;
  billNumber: string;
  committeeName: string;
  summary: string;
  keyPoints: string[];
  fullText?: string;
  videoUrl?: string;
  imageUrls?: string[];
}

interface OfficialStatement {
  officialName: string;
  position: string;
  party: string;
  date: string;
  source: string;
  sourceUrl: string;
  statement: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  topics: string[];
  relatedBills?: { billId: number; billNumber: string }[];
}

interface CampaignFinanceConnection {
  legislatorName: string;
  position: string;
  donorName: string;
  donorType: 'individual' | 'pac' | 'corporation' | 'organization';
  amount: number;
  date: string;
  source: string;
  industry?: string;
  relatedInterests?: string[];
}

interface NarrativeContext {
  billId: number;
  billNumber: string;
  dominantFrames: string[];
  opposingFrames: string[];
  mediaPortrayal: {
    source: string;
    perspective: string;
    audienceReach: number;
    influence: 'high' | 'medium' | 'low';
  }[];
  historicalParallels: {
    previousBill: string;
    year: number;
    outcome: string;
    relevance: string;
  }[];
  publicOpinion: {
    supportPercent: number;
    opposePercent: number;
    neutralPercent: number;
    demographicBreakdown?: any;
    source: string;
    date: string;
  };
}

/**
 * Fetches and analyzes witness testimony related to a specific bill
 * @param billId The LegiScan bill ID
 * @param sessionId Optional session ID to limit the search
 */
export async function getWitnessTestimonyForBill(billId: number, sessionId?: number): Promise<WitnessTestimony[]> {
  try {
    // In a real implementation, this would query a database of witness testimony
    // For now, we'll return a mock implementation with a note
    
    // Get bill details to include in the response
    const billDetails = await legiscanService.getBill(billId);
    
    return [
      {
        witnessName: "Note: This is placeholder data. Integrate with TLO witness data or committee meeting minutes for real data.",
        affiliation: "Data needs to be collected from Texas Legislature Online or committee records",
        position: "informational",
        date: new Date().toISOString().split('T')[0],
        billId: billId,
        billNumber: billDetails.bill_number || `Bill ID ${billId}`,
        committeeName: "Data Collection Required",
        summary: "To implement this feature completely, we need to collect witness testimony data from the Texas Legislature.",
        keyPoints: [
          "Real implementation requires scraping or API access to committee witness records",
          "Video testimony may require manual transcription or audio processing",
          "Consider partnering with Texas Legislature Online for direct data access"
        ]
      }
    ];
  } catch (error: any) {
    console.error('Error fetching witness testimony:', error);
    throw error;
  }
}

/**
 * Searches for statements from elected officials about a specific bill or topic
 * @param query Search term (bill number, topic, etc.)
 * @param limit Maximum number of results to return
 */
export async function getOfficialStatementsAboutTopic(query: string, limit: number = 10): Promise<OfficialStatement[]> {
  try {
    // In a real implementation, this would search news sources, press releases, and social media
    // For now, we'll return a mock implementation with a note
    
    return [
      {
        officialName: "Note: This is placeholder data. Integration with news APIs and social media APIs needed.",
        position: "Implementation Required",
        party: "N/A",
        date: new Date().toISOString().split('T')[0],
        source: "Development Note",
        sourceUrl: "",
        statement: "To implement this feature completely, we need to integrate with news APIs (like NewsAPI.org, GDELT, or Google News API) and social media APIs (Twitter API v2, Facebook Graph API).",
        sentiment: "neutral",
        topics: ["implementation", "data collection"],
        relatedBills: []
      }
    ];
  } catch (error: any) {
    console.error('Error fetching official statements:', error);
    throw error;
  }
}

/**
 * Retrieves campaign finance connections for legislators associated with a bill
 * @param billId The LegiScan bill ID
 */
export async function getCampaignFinanceConnections(billId: number): Promise<CampaignFinanceConnection[]> {
  try {
    // Get bill details to identify the sponsors
    const billDetails = await legiscanService.getBill(billId);
    
    // In a real implementation, this would query campaign finance databases (FEC, state ethics commissions)
    // For now, we'll return a mock implementation with a note
    
    return [
      {
        legislatorName: "Note: This is placeholder data. Integration with Texas Ethics Commission and FEC APIs needed.",
        position: "Implementation Required",
        donorName: "Data Collection Required",
        donorType: "organization",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        source: "Development Note",
        industry: "To implement this feature completely, we need to integrate with Texas Ethics Commission data and possibly FEC data for federal contributions."
      }
    ];
  } catch (error: any) {
    console.error('Error fetching campaign finance connections:', error);
    throw error;
  }
}

/**
 * Analyzes the narrative context around a bill
 * @param billId The LegiScan bill ID
 */
export async function analyzeNarrativeContext(billId: number): Promise<NarrativeContext> {
  try {
    // Get bill details
    const billDetails = await legiscanService.getBill(billId);
    
    // In a real implementation, this would analyze news coverage, social media, and historical context
    // For now, we'll return a mock implementation with a note
    
    return {
      billId: billId,
      billNumber: billDetails.bill_number || `Bill ID ${billId}`,
      dominantFrames: [
        "Note: This is placeholder data. Integration with news analysis and social media monitoring needed."
      ],
      opposingFrames: [
        "To implement this feature completely, we need to perform media content analysis across multiple sources."
      ],
      mediaPortrayal: [
        {
          source: "Implementation Required",
          perspective: "Implementation Note",
          audienceReach: 0,
          influence: "medium"
        }
      ],
      historicalParallels: [
        {
          previousBill: "Historical bill database required",
          year: 0,
          outcome: "N/A",
          relevance: "To implement this feature completely, we need a database of historical legislation and outcomes."
        }
      ],
      publicOpinion: {
        supportPercent: 0,
        opposePercent: 0,
        neutralPercent: 0,
        source: "Integration with polling data required",
        date: new Date().toISOString().split('T')[0]
      }
    };
  } catch (error: any) {
    console.error('Error analyzing narrative context:', error);
    throw error;
  }
}

/**
 * Performs comprehensive contextual analysis of a bill with AI-enhanced insights
 * @param billId The LegiScan bill ID
 * @param includeWitnessTestimony Whether to include witness testimony in the analysis
 * @param includeOfficialStatements Whether to include official statements in the analysis
 * @param includeCampaignFinance Whether to include campaign finance connections in the analysis
 * @param includeNarrativeContext Whether to include narrative context in the analysis
 */
export async function performComprehensiveBillAnalysis(
  billId: number,
  includeWitnessTestimony: boolean = true,
  includeOfficialStatements: boolean = true,
  includeCampaignFinance: boolean = true,
  includeNarrativeContext: boolean = true
): Promise<any> {
  try {
    // Get bill details
    const billDetails = await legiscanService.getBill(billId);
    
    // Initialize results object
    const results: any = {
      billId: billId,
      billNumber: billDetails.bill_number,
      title: billDetails.title,
      description: billDetails.description,
      state: billDetails.state,
      session: billDetails.session,
      status: billDetails.status,
      statusDate: billDetails.status_date,
      textVersions: billDetails.texts,
      sponsors: billDetails.sponsors,
      committees: billDetails.committee ? [billDetails.committee] : [],
      analysisDate: new Date().toISOString()
    };
    
    // Gather requested context data in parallel
    const contextPromises: Promise<any>[] = [];
    
    if (includeWitnessTestimony) {
      contextPromises.push(
        getWitnessTestimonyForBill(billId)
          .then(testimony => ({ witnessTestimony: testimony }))
          .catch(error => ({ witnessTestimonyError: error.message }))
      );
    }
    
    if (includeOfficialStatements) {
      const searchQuery = `${billDetails.bill_number} ${billDetails.title.split(' ').slice(0, 5).join(' ')}`;
      contextPromises.push(
        getOfficialStatementsAboutTopic(searchQuery)
          .then(statements => ({ officialStatements: statements }))
          .catch(error => ({ officialStatementsError: error.message }))
      );
    }
    
    if (includeCampaignFinance) {
      contextPromises.push(
        getCampaignFinanceConnections(billId)
          .then(connections => ({ campaignFinanceConnections: connections }))
          .catch(error => ({ campaignFinanceError: error.message }))
      );
    }
    
    if (includeNarrativeContext) {
      contextPromises.push(
        analyzeNarrativeContext(billId)
          .then(narrative => ({ narrativeContext: narrative }))
          .catch(error => ({ narrativeContextError: error.message }))
      );
    }
    
    // Wait for all context data to be gathered
    const contextResults = await Promise.all(contextPromises);
    
    // Merge all context data into results
    contextResults.forEach(context => {
      Object.assign(results, context);
    });
    
    // Generate AI analysis based on the gathered data
    results.aiAnalysis = await generateAIAnalysis(results);
    
    return results;
  } catch (error: any) {
    console.error('Error performing comprehensive bill analysis:', error);
    throw error;
  }
}

/**
 * Generates AI analysis based on bill data and context
 * @param billData Comprehensive bill data including context
 */
async function generateAIAnalysis(billData: any): Promise<any> {
  try {
    // Prepare a summary of the bill data for the AI to analyze
    const billSummary = {
      billNumber: billData.billNumber,
      title: billData.title,
      description: billData.description,
      sponsors: billData.sponsors?.map((s: any) => `${s.name} (${s.party || 'Unknown'})`)?.join(', ') || 'Unknown',
      status: billData.status,
      witnessCount: billData.witnessTestimony?.length || 0,
      officialsCount: billData.officialStatements?.length || 0,
      narrativeFrames: billData.narrativeContext?.dominantFrames || []
    };
    
    // Call OpenAI to generate analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert legislative analyst with deep knowledge of Texas politics, lobbying, and policy. 
          Analyze the provided bill information and contextual data to provide insights about:
          1. The bill's potential impact and significance
          2. Key stakeholders and their interests
          3. Political dynamics surrounding the bill
          4. Any notable narrative patterns or framing
          5. Financial influences that may be relevant
          6. Historical context and precedents
          
          Be factual, nuanced, and non-partisan in your analysis. Cite specific data points from the provided information.
          Structure your response in sections with clear headings.`
        },
        {
          role: 'user',
          content: `Please analyze this legislative bill and its context:\n${JSON.stringify(billSummary, null, 2)}`
        }
      ],
      functions: [
        {
          name: 'provideBillAnalysis',
          description: 'Provide comprehensive analysis of a legislative bill based on contextual data',
          parameters: {
            type: 'object',
            properties: {
              keyInsights: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Top 3-5 most important insights about this bill and its context'
              },
              stakeholderAnalysis: {
                type: 'string',
                description: 'Analysis of key stakeholders and their interests in this legislation'
              },
              politicalDynamics: {
                type: 'string',
                description: 'Analysis of the political dynamics surrounding this bill'
              },
              narrativeAnalysis: {
                type: 'string',
                description: 'Analysis of how this bill is being framed in media and public discourse'
              },
              financialInfluences: {
                type: 'string',
                description: 'Analysis of potential financial influences on this legislation'
              },
              historicalContext: {
                type: 'string',
                description: 'Relevant historical context for understanding this legislation'
              },
              confidenceLevel: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'The confidence level in this analysis based on available data'
              }
            },
            required: ['keyInsights', 'stakeholderAnalysis', 'confidenceLevel']
          }
        }
      ],
      function_call: { name: 'provideBillAnalysis' }
    });
    
    // Parse function call response
    if (response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      return JSON.parse(functionCall.arguments);
    } else {
      // Fallback to getting the text response
      return {
        keyInsights: ['Analysis could not be generated in structured format'],
        analysis: response.choices[0].message.content,
        confidenceLevel: 'low'
      };
    }
  } catch (error: any) {
    console.error('Error generating AI analysis:', error);
    return {
      keyInsights: ['Error generating analysis'],
      analysis: 'An error occurred while generating the AI analysis',
      confidenceLevel: 'low',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyzes images in the context of a specific bill
 * @param billId The LegiScan bill ID
 * @param imageData Base64-encoded image data or URL to image
 */
export async function analyzeBillContextualImage(billId: number, imageData: string): Promise<any> {
  try {
    // Get bill details
    const billDetails = await legiscanService.getBill(billId);
    
    // Prepare context for image analysis
    const context = {
      billNumber: billDetails.bill_number,
      billTitle: billDetails.title,
      description: billDetails.description,
      state: billDetails.state,
      session: billDetails.session?.session_name,
      sponsors: billDetails.sponsors?.map((s: any) => s.name)?.join(', '),
      statusDate: billDetails.status_date,
      lastAction: billDetails.status || "Unknown"
    };
    
    // Analyze the image with bill context
    const analysisResult = await analyzeImage(imageData, context, 'detailed');
    
    // Enhance analysis with bill-specific insights
    if (analysisResult.success) {
      // Call OpenAI to generate bill-specific insights about the image
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert legislative analyst specializing in visual content related to legislation.
            Analyze the image analysis results in the context of the specific bill information provided.
            Focus on connections between the visual content and the bill's subject matter, sponsors, or political context.`
          },
          {
            role: 'user',
            content: `Image analysis: ${JSON.stringify(analysisResult.data)}\n\nBill context: ${JSON.stringify(context)}`
          }
        ],
        functions: [
          {
            name: 'provideBillImageAnalysis',
            description: 'Provide analysis of how an image relates to a specific bill',
            parameters: {
              type: 'object',
              properties: {
                relevance: {
                  type: 'string',
                  enum: ['high', 'medium', 'low', 'none'],
                  description: 'How relevant is this image to the bill'
                },
                billSpecificInsights: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Insights about how this image relates to the specific bill'
                },
                potentialUse: {
                  type: 'string',
                  description: 'How this image might be used in relation to the bill (advocacy, opposition, educational, etc.)'
                },
                narrativeAlignment: {
                  type: 'string',
                  description: 'How this image aligns with or counters dominant narratives about the bill'
                },
                confidenceLevel: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'The confidence level in this analysis'
                }
              },
              required: ['relevance', 'billSpecificInsights', 'confidenceLevel']
            }
          }
        ],
        function_call: { name: 'provideBillImageAnalysis' }
      });
      
      // Parse function call response
      if (response.choices[0].message.function_call) {
        const functionCall = response.choices[0].message.function_call;
        const billSpecificAnalysis = JSON.parse(functionCall.arguments);
        
        // Combine original analysis with bill-specific insights
        return {
          success: true,
          data: {
            ...analysisResult.data,
            billAnalysis: billSpecificAnalysis
          },
          model: analysisResult.model
        };
      }
    }
    
    return analysisResult;
  } catch (error: any) {
    console.error('Error analyzing image in bill context:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model: 'error'
    };
  }
}

/**
 * Index a bill in the vector database for contextual analysis
 * @param billId LegiScan bill ID
 */
export async function indexBillForContextualAnalysis(billId: number): Promise<boolean> {
  try {
    // Get bill details from LegiScan
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      console.error(`Bill ID ${billId} not found in LegiScan`);
      return false;
    }

    // Prepare document text from bill details
    const billText = [
      `Bill Number: ${billDetails.bill_number}`,
      `Title: ${billDetails.title || 'No title'}`,
      `Description: ${billDetails.description || 'No description'}`,
      `State: ${billDetails.state || 'Unknown state'}`,
      `Status: ${billDetails.status || 'Unknown status'} (as of ${billDetails.status_date || 'unknown date'})`,
    ].join('\n\n');

    // Prepare metadata
    const metadata = {
      billId: billId,
      billNumber: billDetails.bill_number,
      state: billDetails.state,
      status: billDetails.status,
      statusDate: billDetails.status_date,
      documentType: 'bill'
    };

    // Add to vector database
    const result = await addDocumentsToVectorStore([
      {
        id: `bill-${billId}`,
        text: billText,
        metadata
      }
    ]);

    return result;
  } catch (error: any) {
    console.error(`Error indexing bill ${billId}:`, error);
    return false;
  }
}

/**
 * Find bills related to a given bill based on content similarity
 * @param billId LegiScan bill ID
 * @param limit Maximum number of related bills to return
 */
export async function findRelatedBills(billId: number, limit: number = 5): Promise<any[]> {
  try {
    // Get bill details from LegiScan
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      console.error(`Bill ID ${billId} not found in LegiScan`);
      return [];
    }

    // Create query from bill title and description
    const query = `${billDetails.title} ${billDetails.description || ''}`;

    // Find similar documents, filtering to only include bills
    const similarDocs = await querySimilarDocuments(
      query, 
      limit + 1, // Get one extra to filter out the source bill
      { documentType: 'bill' }
    );

    // Remove the source bill from results if present
    const relatedBills = similarDocs.filter((doc: any) => 
      doc.metadata?.billId !== billId && doc.metadata?.billNumber !== billDetails.bill_number
    ).slice(0, limit);

    return relatedBills;
  } catch (error: any) {
    console.error(`Error finding related bills for ${billId}:`, error);
    return [];
  }
}

/**
 * Enhance bill analysis with RAG-based contextual information
 * @param billId LegiScan bill ID
 * @param query Specific question to answer about the bill
 */
export async function generateEnhancedBillAnalysis(billId: number, query: string): Promise<any> {
  try {
    // Get bill details from LegiScan
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      console.error(`Bill ID ${billId} not found in LegiScan`);
      return {
        success: false,
        error: `Bill ID ${billId} not found`
      };
    }

    // Ensure the bill is indexed
    await indexBillForContextualAnalysis(billId);

    // Construct a detailed query with bill information
    const enhancedQuery = `
      Bill Number: ${billDetails.bill_number}
      Title: ${billDetails.title || 'No title'}
      State: ${billDetails.state || 'Unknown state'}
      
      Question: ${query}
    `;

    // Generate RAG response
    const ragResponse = await generateRAGResponse(enhancedQuery);

    return {
      success: true,
      billId,
      billNumber: billDetails.bill_number,
      query,
      analysis: ragResponse
    };
  } catch (error: any) {
    console.error(`Error generating enhanced analysis for bill ${billId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}