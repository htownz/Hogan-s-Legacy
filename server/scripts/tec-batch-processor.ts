// @ts-nocheck
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { batchEnrichFilings, categorizeAndEnrichFiling } from '../services/scout-bot-enrichment';
import { db } from '../db';
import { 
  lobbyists, 
  campaignFinance, 
  ethicsViolations, 
  politicalEntities
} from '@shared/schema';
import { 
  campaignFinanceEntityTypeEnum,
  campaignFinanceSourceEnum 
} from '@shared/schema-campaign-finance';
import { eq } from 'drizzle-orm';
import { createLogger } from "../logger";
const log = createLogger("tec-batch-processor");


// Configure paths - use fileURLToPath for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIRECTORY = path.join(__dirname, '../../data/tec-filings');
const OUTPUT_DIRECTORY = path.join(__dirname, '../../data/enriched-filings');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIRECTORY, { recursive: true });
    await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true });
  } catch (error: any) {
    log.error({ err: error }, 'Error creating directories');
  }
}

// Load TEC filings from a JSON file
async function loadFilingsFromFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    log.error({ err: error }, `Error loading filings from ${filePath}`);
    return [];
  }
}

// Save enriched filings to a JSON file
async function saveEnrichedFilings(filings: any[], outputFilePath: string) {
  try {
    await fs.writeFile(
      outputFilePath,
      JSON.stringify(filings, null, 2),
      'utf-8'
    );
    log.info(`Enriched filings saved to ${outputFilePath}`);
  } catch (error: any) {
    log.error({ err: error }, `Error saving enriched filings to ${outputFilePath}`);
  }
}

// Store enriched filing data in the database
async function storeEnrichedFiling(enrichedFiling: any) {
  try {
    const { category, filing, enrichment } = enrichedFiling;
    
    // First, ensure the entity exists in political_entities table
    let entityId: string | undefined;
    
    // Check if entity already exists
    const existingEntities = await db
      .select()
      .from(politicalEntities).$dynamic()
      .where(eq(politicalEntities.name, filing.filerName));
    
    if (existingEntities.length > 0) {
      entityId = existingEntities[0].id;
    } else {
      // Create a new entity
      const entityType = mapCategoryToEntityType(category);
      const [newEntity] = await db.insert(politicalEntities).values({
        name: filing.filerName,
        entity_type: entityType,
        source_system: "tec" as any, // Typecast to satisfy the enum constraint
        source_identifier: filing.id,
        description: enrichment.summary,
        metadata: enrichment,
        created_at: new Date(),
        updated_at: new Date()
      }).returning();
      
      entityId = newEntity.id;
    }
    
    // Store based on category
    switch (category) {
      case 'lobbyist':
        await storeLobbyistData(entityId, filing, enrichment);
        break;
      case 'campaign_finance':
      case 'pac':
        await storeCampaignFinanceData(entityId, filing, enrichment);
        break;
      default:
        log.info(`No specific storage handler for category: ${category}`);
    }
    
    // If there are red flags, store as ethics violations
    if (enrichment.redFlags && enrichment.redFlags.length > 0) {
      await storeEthicsViolations(entityId, filing, enrichment);
    }
    
    return entityId;
  } catch (error: any) {
    log.error({ err: error }, 'Error storing enriched filing');
    return undefined;
  }
}

// Map category to entity type
function mapCategoryToEntityType(category: string): any {
  switch (category) {
    case 'lobbyist':
      return "lobbyist";
    case 'campaign_finance':
      return "candidate";
    case 'pac':
      return "pac";
    default:
      return "individual";
  }
}

// Store lobbyist specific data
async function storeLobbyistData(entityId: string, filing: any, enrichment: any) {
  try {
    // Check if lobbyist already exists
    const existingLobbyists = await db
      .select()
      .from(lobbyists).$dynamic()
      .where(eq(lobbyists.name, filing.filerName));
    
    if (existingLobbyists.length === 0) {
      // Create new lobbyist record
      await db.insert(lobbyists).values({
        name: filing.filerName,
        firm: filing.filingContent?.firm || null,
        clients: filing.filingContent?.clients || null,
        registrationDate: filing.filingDate ? new Date(filing.filingDate) : new Date(),
        contactInfo: filing.filingContent?.contactInfo || null,
        areasOfFocus: filing.filingContent?.areasOfFocus || null,
        imageUrl: null,
        biography: enrichment.summary || null,
        filingIds: [filing.id],
        active: true
      });
    } else {
      // Update existing lobbyist
      const existingLobbyist = existingLobbyists[0];
      const updatedFilingIds = Array.isArray(existingLobbyist.filingIds) 
        ? [...existingLobbyist.filingIds, filing.id]
        : [filing.id];
      
      await db.update(lobbyists)
        .set({
          firm: filing.filingContent?.firm || existingLobbyist.firm,
          clients: filing.filingContent?.clients || existingLobbyist.clients,
          filingIds: updatedFilingIds,
          updated_at: new Date()
        })
        .where(eq(lobbyists.id, existingLobbyist.id));
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error storing lobbyist data');
  }
}

// Store campaign finance data
async function storeCampaignFinanceData(entityId: string, filing: any, enrichment: any) {
  try {
    await db.insert(campaignFinance).values({
      repId: null, // This would be set if we had a matching rep ID
      entityId: entityId,
      donorName: filing.filingContent?.donorName || null,
      amount: filing.amount || 0,
      date: filing.filingDate ? new Date(filing.filingDate) : new Date(),
      purpose: filing.filingContent?.purpose || null,
      filingId: filing.id,
      filingUrl: filing.filingContent?.filingUrl || null,
      metadata: {
        enrichment: enrichment,
        rawFiling: filing
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error storing campaign finance data');
  }
}

// Store ethics violations based on red flags
async function storeEthicsViolations(entityId: string, filing: any, enrichment: any) {
  try {
    for (const redFlag of enrichment.redFlags) {
      await db.insert(ethicsViolations).values({
        repId: null, // This would be set if we had a matching rep ID
        entityId: entityId, 
        violationType: 'ai_detected_flag',
        violationDate: filing.filingDate ? new Date(filing.filingDate) : new Date(),
        description: redFlag,
        source: 'AI Analysis',
        sourceUrl: filing.filingContent?.filingUrl || null,
        status: 'flagged',
        metadata: {
          filing_id: filing.id,
          enrichment_id: enrichment.id || null,
          suggested_flags: enrichment.suggestedFlags || []
        }
      });
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error storing ethics violations');
  }
}

// Process a batch of files
async function processBatchOfFiles(fileNames: string[]) {
  for (const fileName of fileNames) {
    try {
      const filePath = path.join(DATA_DIRECTORY, fileName);
      const filings = await loadFilingsFromFile(filePath);
      
      if (!Array.isArray(filings) || filings.length === 0) {
        log.info(`No filings found in ${fileName} or invalid format`);
        continue;
      }
      
      log.info(`Processing ${filings.length} filings from ${fileName}...`);
      
      // Process each filing individually for categorization before batch AI
      const categorizedFilings = [];
      for (const filing of filings) {
        const filingType = filing.type || 'unknown';
        categorizedFilings.push({
          id: filing.id || `tec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: filingType,
          filingDate: filing.filingDate || new Date().toISOString(),
          filerName: filing.filerName || filing.name || 'Unknown',
          filingContent: filing,
          relatedEntities: filing.relatedEntities || [],
          amount: filing.amount
        });
      }
      
      // Batch enrich the categorized filings
      const enrichedResults = await batchEnrichFilings(categorizedFilings);
      
      // Combine original filings with enrichment results
      const combinedResults = categorizedFilings.map((filing, index) => {
        const enrichment = enrichedResults[index];
        const category = determineCategoryFromFiling(filing);
        
        return {
          category,
          filing,
          enrichment
        };
      });
      
      // Save enriched results to file
      const outputFileName = `enriched-${fileName}`;
      const outputPath = path.join(OUTPUT_DIRECTORY, outputFileName);
      await saveEnrichedFilings(combinedResults, outputPath);
      
      // Store in database
      for (const enrichedFiling of combinedResults) {
        if (enrichedFiling.enrichment.enrichmentSuccessful) {
          await storeEnrichedFiling(enrichedFiling);
        } else {
          log.info(`Skipping storage for failed enrichment: ${enrichedFiling.filing.id}`);
        }
      }
      
      log.info(`Completed processing ${fileName}`);
    } catch (error: any) {
      log.error({ err: error }, `Error processing ${fileName}`);
    }
  }
}

// Determine category based on filing properties
function determineCategoryFromFiling(filing: any): string {
  const type = filing.type?.toLowerCase() || '';
  
  if (type.includes('lobby') || type.includes('lobbyist')) {
    return 'lobbyist';
  } else if (type.includes('pac') || type.includes('committee')) {
    return 'pac';
  } else if (type.includes('campaign') || type.includes('candidate')) {
    return 'campaign_finance';
  } else {
    return 'other';
  }
}

// Main function
async function main() {
  try {
    log.info('Starting TEC filing batch processor...');
    
    // Ensure required directories exist
    await ensureDirectories();
    
    // Get list of files to process
    const files = await fs.readdir(DATA_DIRECTORY);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      log.info('No JSON files found to process');
      return;
    }
    
    log.info(`Found ${jsonFiles.length} JSON files to process`);
    
    // Process files in batches
    await processBatchOfFiles(jsonFiles);
    
    log.info('Batch processing complete');
  } catch (error: any) {
    log.error({ err: error }, 'Error in batch processor');
  }
}

// For ES modules, we can't use require.main === module check
// Instead we'll directly export the functions and call main() when needed

export { 
  main as processTecFilings,
  loadFilingsFromFile,
  batchEnrichFilings,
  storeEnrichedFiling
};