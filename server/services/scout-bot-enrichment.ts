import { OpenAI } from 'openai';
import { tecFilingTypes } from '@shared/schema-ethics';
import { createLogger } from "../logger";
const log = createLogger("scout-bot-enrichment");


// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define types for the enrichment
interface EnrichmentResult {
  inferredRole: string;
  summary: string;
  redFlags: string[];
  suggestedFlags: string[];
  enrichmentSuccessful: boolean;
  enrichmentFailedReason?: string;
}

interface FilingData {
  id: string;
  type: string;
  filingDate: string;
  filerName: string;
  filingContent: any; // Raw TEC filing data structure
  relatedEntities?: string[];
  amount?: number;
}

/**
 * Enriches a TEC filing with AI-powered analysis
 * @param filing The parsed TEC filing record
 * @returns Enriched profile with AI analysis
 */
export async function enrichFiling(filing: FilingData): Promise<EnrichmentResult> {
  try {
    // Format the filing data for better GPT-4 processing
    const filingFormatted = JSON.stringify(filing, null, 2);
    
    // Create a prompt for the AI
    const prompt = `
You are analyzing a Texas Ethics Commission filing. Please provide insights on this filing:

${filingFormatted}

Based on this filing, please provide:
1. What role or influence type can you infer about the filer? (e.g., consultant, lobbyist, PAC leader, dark money operator)
2. A brief summary of what this filing reveals (2-3 sentences)
3. Any red flags or suspicious patterns you noticed (list format)
4. Suggested flags to apply (choose from: multi_role_overlap, dark_money_route, potential_undisclosed_relationship, excessive_amounts, unusual_timing)

Respond in JSON format with these keys:
{
  "inferredRole": "",
  "summary": "",
  "redFlags": [],
  "suggestedFlags": []
}
`;

    // Make the API call
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert in campaign finance, lobbying, and political ethics regulations, specifically focused on Texas." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    // Parse the AI response
    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI API");
    }

    const parsedResponse = JSON.parse(responseContent);
    
    return {
      inferredRole: parsedResponse.inferredRole,
      summary: parsedResponse.summary,
      redFlags: parsedResponse.redFlags,
      suggestedFlags: parsedResponse.suggestedFlags,
      enrichmentSuccessful: true
    };
  } catch (error: any) {
    log.error({ err: error }, "Filing enrichment failed");
    return {
      inferredRole: "",
      summary: "",
      redFlags: [],
      suggestedFlags: [],
      enrichmentSuccessful: false,
      enrichmentFailedReason: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Batch processes multiple filings for enrichment
 * @param filings Array of TEC filing records
 * @returns Array of enriched filing results
 */
export async function batchEnrichFilings(filings: FilingData[]): Promise<EnrichmentResult[]> {
  // Process filings in batches to avoid rate limiting
  const batchSize = 5;
  const results: EnrichmentResult[] = [];
  
  for (let i = 0; i < filings.length; i += batchSize) {
    const batch = filings.slice(i, i + batchSize);
    const batchPromises = batch.map(filing => enrichFiling(filing));
    
    // Process batch concurrently
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to respect rate limits if needed
    if (i + batchSize < filings.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Categorizes a filing by type and applies appropriate enrichment strategies
 * @param filingType The type of filing from TEC
 * @param filingData The raw filing data
 * @returns Categorized and enriched filing data
 */
export async function categorizeAndEnrichFiling(filingType: string, filingData: any): Promise<any> {
  // Map the filing type to a category
  let category: string;
  
  switch(filingType) {
    case tecFilingTypes.lobbyistRegistration:
    case tecFilingTypes.lobbyistUpdate:
      category = 'lobbyist';
      break;
    case tecFilingTypes.campaignFinance:
    case tecFilingTypes.candidateReport:
      category = 'campaign_finance';
      break;
    case tecFilingTypes.pacReport:
      category = 'pac';
      break;
    default:
      category = 'other';
  }
  
  // Format filing data for enrichment
  const formattedFiling: FilingData = {
    id: filingData.id || `tec-${Date.now()}`,
    type: filingType,
    filingDate: filingData.filingDate || new Date().toISOString(),
    filerName: filingData.filerName || filingData.name || 'Unknown',
    filingContent: filingData,
    relatedEntities: filingData.relatedEntities || [],
    amount: filingData.amount
  };
  
  // Enrich with AI
  const enrichment = await enrichFiling(formattedFiling);
  
  // Return the combined result
  return {
    category,
    filing: formattedFiling,
    enrichment
  };
}