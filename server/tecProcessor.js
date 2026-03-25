/**
 * Texas Ethics Commission (TEC) Report Processor
 * 
 * This module processes TEC data files (CSV) to extract, analyze, and store
 * information about political entities, financial transactions, relationships,
 * and ethics violations.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process TEC report files
 * @param {string} filePath Path to the TEC CSV file
 * @param {Object} options Processing options
 * @param {string} options.fileType Type of the file being processed
 * @param {string} options.fileUploadId ID of the file upload record
 * @param {Function} options.createModerationItem Function to create moderation items
 * @returns {Object} Processing results
 */
async function processTECReports(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const results = {
      reportType: null,
      processedData: [],
      entities: new Map(),
      relationships: [],
      moderationQueue: [],
      recordsTotal: 0,
      recordsProcessed: 0,
      entitiesFound: 0,
      transactionsFound: 0,
      relationshipsFound: 0,
      moderationQueueItems: 0
    };

    // Force the report type if provided in options
    if (options.fileType && options.fileType !== 'generic') {
      results.reportType = options.fileType;
    }

    // Read and parse the CSV file
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));

    const records = [];

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
        results.recordsTotal++;
      }
    });

    parser.on('error', function(err) {
      reject(new Error(`Error parsing CSV file: ${err.message}`));
    });

    parser.on('end', async function() {
      try {
        if (records.length === 0) {
          reject(new Error('The file does not contain any valid records'));
          return;
        }

        // Identify the report type based on the first record if not forced
        if (!results.reportType) {
          results.reportType = identifyReportType(records[0]);
        }
        
        // Process records based on report type
        results.processedData = await processRecordsByType(records, results.reportType);
        results.recordsProcessed = results.processedData.length;
        
        // Extract entities
        results.processedData.forEach(record => {
          if (record.filer_name) {
            const type = determineEntityType(record.filer_name);
            addEntity(results.entities, record.filer_name, type, record);
          }
          
          if (record.contributor_name) {
            const type = determineEntityType(record.contributor_name);
            addEntity(results.entities, record.contributor_name, type, record);
          }
          
          if (record.payee_name) {
            const type = determineEntityType(record.payee_name);
            addEntity(results.entities, record.payee_name, type, record);
          }
          
          if (record.lobbyist_name) {
            addEntity(results.entities, record.lobbyist_name, 'lobbyist', record);
          }
          
          if (record.client_name) {
            const type = determineEntityType(record.client_name);
            addEntity(results.entities, record.client_name, type, record);
          }
          
          if (record.firm_name) {
            addEntity(results.entities, record.firm_name, 'consulting_firm', record);
          }
        });
        
        results.entitiesFound = results.entities.size;
        
        // Extract relationships between entities
        results.relationships = extractRelationships(results.processedData);
        results.relationshipsFound = results.relationships.length;
        results.transactionsFound = results.processedData.length;
        
        // Generate moderation queue for significant entities
        const moderationEntries = await generateModerationEntries(results.processedData);
        results.moderationQueue = moderationEntries;
        
        // If createModerationItem function is provided, create moderation items
        if (options.createModerationItem && typeof options.createModerationItem === 'function') {
          for (const entry of moderationEntries) {
            try {
              await options.createModerationItem({
                name: entry.name,
                type: entry.type,
                significanceScore: entry.significanceScore,
                transactionCount: entry.transactionCount,
                financialTotal: entry.financialTotal,
                connectionCount: entry.connectionCount,
                relatedEntities: entry.relatedEntities,
                sampleData: entry.sampleRecords,
                aiSummary: entry.aiSummary,
                flags: entry.flags
              });
              results.moderationQueueItems++;
            } catch (error) {
              console.error(`Error creating moderation item for ${entry.name}:`, error);
            }
          }
        } else {
          results.moderationQueueItems = moderationEntries.length;
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Identify the type of TEC report based on headers
 * @param {Object} firstRecord First record in the CSV file
 * @returns {string} Report type
 */
function identifyReportType(firstRecord) {
  const headers = Object.keys(firstRecord).map(h => h.toLowerCase());
  
  if (headers.includes('expenditure_amount') || headers.includes('expenditure_purpose')) {
    return 'campaign_expenditures';
  } else if (headers.includes('contribution_amount') || headers.includes('contributor_name')) {
    return 'campaign_contributions';
  } else if (headers.includes('lobbyist_name') || headers.includes('client_name')) {
    return 'lobbyist_registrations';
  } else if (headers.includes('firm_name') || headers.includes('registration_date')) {
    return 'firm_registrations';
  } else if (headers.includes('violation_type') || headers.includes('penalty_amount')) {
    return 'ethics_violations';
  } else if (headers.includes('original_report_id') || headers.includes('correction_date')) {
    return 'corrected_filings';
  } else {
    return 'generic';
  }
}

/**
 * Process records based on identified report type
 * @param {Array} records Records from the CSV file
 * @param {string} reportType Identified report type
 * @returns {Array} Processed data
 */
async function processRecordsByType(records, reportType) {
  switch (reportType) {
    case 'campaign_expenditures':
      return processCampaignExpenditures(records);
    case 'campaign_contributions':
      return processCampaignContributions(records);
    case 'lobbyist_registrations':
      return processLobbyistRegistrations(records);
    case 'firm_registrations':
      return processFirmRegistrations(records);
    case 'ethics_violations':
      return processEthicsViolations(records);
    case 'corrected_filings':
      return processCorrectedFilings(records);
    case 'generic':
    default:
      return processGenericRecords(records);
  }
}

/**
 * Process campaign expenditure records
 * @param {Array} records Campaign expenditure records
 * @returns {Array} Processed expenditure data
 */
function processCampaignExpenditures(records) {
  return records.map(record => {
    // Normalize field names
    let normalizedRecord = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalizedRecord[normalizedKey] = record[key];
    });
    
    // Extract and parse amount
    const amount = normalizedRecord.expenditure_amount || normalizedRecord.amount || '0';
    const parsedAmount = amount.replace(/[$,]/g, '');
    
    return {
      ...normalizedRecord,
      id: uuidv4(),
      transaction_type: 'expenditure',
      amount: parsedAmount,
      filer_name: normalizedRecord.filer_name || normalizedRecord.committee_name,
      payee_name: normalizedRecord.payee_name || normalizedRecord.recipient_name,
      date: normalizedRecord.expenditure_date || normalizedRecord.date || new Date().toISOString(),
      purpose: normalizedRecord.expenditure_purpose || normalizedRecord.purpose || 'Unknown',
      normalized_amount: parseFloat(parsedAmount) || 0
    };
  });
}

/**
 * Process campaign contribution records
 * @param {Array} records Campaign contribution records
 * @returns {Array} Processed contribution data
 */
function processCampaignContributions(records) {
  return records.map(record => {
    // Normalize field names
    let normalizedRecord = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalizedRecord[normalizedKey] = record[key];
    });
    
    // Extract and parse amount
    const amount = normalizedRecord.contribution_amount || normalizedRecord.amount || '0';
    const parsedAmount = amount.replace(/[$,]/g, '');
    
    return {
      ...normalizedRecord,
      id: uuidv4(),
      transaction_type: 'contribution',
      amount: parsedAmount,
      filer_name: normalizedRecord.filer_name || normalizedRecord.committee_name || normalizedRecord.recipient_name,
      contributor_name: normalizedRecord.contributor_name || normalizedRecord.donor_name,
      date: normalizedRecord.contribution_date || normalizedRecord.date || new Date().toISOString(),
      contributor_type: determineEntityType(normalizedRecord.contributor_name || normalizedRecord.donor_name),
      normalized_amount: parseFloat(parsedAmount) || 0
    };
  });
}

/**
 * Process lobbyist registration records
 * @param {Array} records Lobbyist registration records
 * @returns {Array} Processed lobbyist data
 */
function processLobbyistRegistrations(records) {
  return records.map(record => {
    // Normalize field names
    let normalizedRecord = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalizedRecord[normalizedKey] = record[key];
    });
    
    return {
      ...normalizedRecord,
      id: uuidv4(),
      entity_type: 'lobbyist',
      relationship_type: 'client',
      lobbyist_name: normalizedRecord.lobbyist_name || normalizedRecord.registrant_name,
      client_name: normalizedRecord.client_name || normalizedRecord.represented_entity,
      registration_date: normalizedRecord.registration_date || normalizedRecord.effective_date || new Date().toISOString(),
      subject_matter: normalizedRecord.subject_matter || normalizedRecord.issue_area || 'Not specified'
    };
  });
}

/**
 * Process firm registration records
 * @param {Array} records Firm registration records
 * @returns {Array} Processed firm data
 */
function processFirmRegistrations(records) {
  return records.map(record => {
    // Normalize field names
    let normalizedRecord = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalizedRecord[normalizedKey] = record[key];
    });
    
    return {
      ...normalizedRecord,
      id: uuidv4(),
      entity_type: 'consulting_firm',
      firm_name: normalizedRecord.firm_name || normalizedRecord.organization_name || normalizedRecord.registrant_name,
      registration_date: normalizedRecord.registration_date || normalizedRecord.filing_date || new Date().toISOString(),
      firm_type: normalizedRecord.firm_type || normalizedRecord.organization_type || 'consulting'
    };
  });
}

/**
 * Process ethics violation records
 * @param {Array} records Ethics violation records
 * @returns {Array} Processed violation data
 */
function processEthicsViolations(records) {
  return records.map(record => {
    // Normalize field names
    let normalizedRecord = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalizedRecord[normalizedKey] = record[key];
    });
    
    // Extract and parse penalty amount
    const amount = normalizedRecord.penalty_amount || normalizedRecord.fine_amount || '0';
    const parsedAmount = amount.replace(/[$,]/g, '');
    
    return {
      ...normalizedRecord,
      id: uuidv4(),
      entity_name: normalizedRecord.respondent_name || normalizedRecord.violator_name || normalizedRecord.filer_name,
      violation_type: normalizedRecord.violation_type || normalizedRecord.offense_type || 'Ethics Violation',
      penalty_amount: parsedAmount,
      violation_date: normalizedRecord.violation_date || normalizedRecord.offense_date || new Date().toISOString(),
      resolution_date: normalizedRecord.resolution_date || normalizedRecord.settlement_date,
      normalized_penalty: parseFloat(parsedAmount) || 0
    };
  });
}

/**
 * Process corrected filing records
 * @param {Array} records Corrected filing records
 * @returns {Array} Processed corrected filing data
 */
function processCorrectedFilings(records) {
  return records.map(record => {
    // Normalize field names
    let normalizedRecord = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalizedRecord[normalizedKey] = record[key];
    });
    
    return {
      ...normalizedRecord,
      id: uuidv4(),
      filer_name: normalizedRecord.filer_name || normalizedRecord.committee_name,
      original_report_id: normalizedRecord.original_report_id || normalizedRecord.original_filing_id,
      correction_date: normalizedRecord.correction_date || normalizedRecord.filing_date || new Date().toISOString(),
      correction_reason: normalizedRecord.correction_reason || normalizedRecord.explanation || 'Correction to previous filing'
    };
  });
}

/**
 * Process generic records when type cannot be determined
 * @param {Array} records Generic records
 * @returns {Array} Processed generic data
 */
function processGenericRecords(records) {
  return records.map(record => {
    // Normalize field names
    let normalizedRecord = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalizedRecord[normalizedKey] = record[key];
    });
    
    return {
      ...normalizedRecord,
      id: uuidv4(),
      processed_date: new Date().toISOString()
    };
  });
}

/**
 * Determine entity type based on name and patterns
 * @param {string} name Entity name
 * @returns {string} Entity type
 */
function determineEntityType(name) {
  if (!name) return 'unknown';
  
  const nameLower = name.toLowerCase();
  
  // Check for PACs and committees
  if (
    nameLower.includes(' pac') || 
    nameLower.includes('political action committee') || 
    nameLower.includes('committee for') ||
    nameLower.includes('texans for')
  ) {
    return 'pac';
  }
  
  // Check for super PACs
  if (nameLower.includes('super pac') || nameLower.includes('leadership pac')) {
    return 'super_pac';
  }
  
  // Check for party committees
  if (
    nameLower.includes('democratic') && nameLower.includes('committee') ||
    nameLower.includes('republican') && nameLower.includes('committee') ||
    nameLower.includes('state party')
  ) {
    return 'party_committee';
  }
  
  // Check for organizations
  if (
    nameLower.includes('inc.') || 
    nameLower.includes('corporation') || 
    nameLower.includes('llc') || 
    nameLower.includes('ltd') ||
    nameLower.includes('association') ||
    nameLower.includes('union') ||
    nameLower.includes('federation')
  ) {
    return 'organization';
  }
  
  // Check for consulting firms
  if (
    nameLower.includes('consulting') || 
    nameLower.includes('consultants') || 
    nameLower.includes('strategies') ||
    nameLower.includes('advisors') ||
    nameLower.includes('group') && (nameLower.includes('media') || nameLower.includes('political'))
  ) {
    return 'consulting_firm';
  }
  
  // Check for candidates
  if (
    nameLower.includes('campaign') || 
    nameLower.includes(' for ') && 
    (
      nameLower.includes('senate') || 
      nameLower.includes('congress') || 
      nameLower.includes('governor') || 
      nameLower.includes('mayor')
    )
  ) {
    return 'candidate';
  }
  
  // Default to individual if nothing else matches
  return 'individual';
}

/**
 * Generate moderation queue entries for significant entities
 * @param {Array} processedData Processed records
 * @returns {Array} Moderation queue entries
 */
async function generateModerationEntries(processedData) {
  // Group entities by name and calculate significance
  const entityMap = new Map();
  
  processedData.forEach(record => {
    const nameFields = ['filer_name', 'contributor_name', 'payee_name', 'lobbyist_name', 'client_name', 'firm_name', 'entity_name', 'respondent_name'];
    
    nameFields.forEach(field => {
      if (record[field]) {
        const name = record[field];
        const entityType = determineEntityType(name);
        
        if (!entityMap.has(name)) {
          entityMap.set(name, {
            name,
            type: entityType,
            records: [],
            totalTransactions: 0,
            totalAmount: 0,
            relatedEntities: new Set(),
            significanceScore: 0
          });
        }
        
        const entity = entityMap.get(name);
        entity.records.push(record);
        
        // Update transaction counts and amounts
        if (record.normalized_amount) {
          entity.totalTransactions++;
          entity.totalAmount += record.normalized_amount;
        }
        
        // Track related entities
        nameFields.forEach(relatedField => {
          if (relatedField !== field && record[relatedField]) {
            entity.relatedEntities.add(record[relatedField]);
          }
        });
      }
    });
  });
  
  // Calculate significance scores
  entityMap.forEach(entity => {
    entity.significanceScore = calculateSignificanceScore(entity);
  });
  
  // Sort by significance score and take top entities for moderation
  const sortedEntities = Array.from(entityMap.values())
    .sort((a, b) => b.significanceScore - a.significanceScore)
    .slice(0, 100); // Limit to top 100 most significant entities
  
  // Format moderation queue entries
  return sortedEntities.map(entity => {
    // Try to enrich entity with AI-based information (if available)
    // This could be expanded to use OpenAI for enhanced entity analysis
    const enrichedEntity = enrichEntityWithAI(entity);
    
    return {
      id: uuidv4(),
      name: entity.name,
      type: entity.type,
      significanceScore: entity.significanceScore,
      transactionCount: entity.totalTransactions,
      financialTotal: entity.totalAmount,
      connectionCount: entity.relatedEntities.size,
      relatedEntities: Array.from(entity.relatedEntities).slice(0, 10), // Limit to top 10 related entities
      sampleRecords: entity.records.slice(0, 5), // Include a few sample records
      aiSummary: enrichedEntity.aiSummary,
      flags: enrichedEntity.flags,
      createdAt: new Date().toISOString(),
      status: 'pending_review'
    };
  });
}

/**
 * Add entity to the entities map
 * @param {Map} entities Map of entities
 * @param {string} name Entity name
 * @param {string} type Entity type
 * @param {Object} record Associated record
 */
function addEntity(entities, name, type, record) {
  if (!name) return;
  
  if (!entities.has(name)) {
    entities.set(name, {
      id: uuidv4(),
      name,
      type,
      records: [],
      relationships: [],
      transactionTotal: 0,
      transactionCount: 0
    });
  }
  
  const entity = entities.get(name);
  entity.records.push(record);
  
  // Update transaction metrics if applicable
  if (record.normalized_amount) {
    entity.transactionTotal += record.normalized_amount;
    entity.transactionCount++;
  }
}

/**
 * Determine relationship type based on record context
 * @param {string} recordType Type of record
 * @param {string} name Entity name
 * @param {string} type Entity type
 * @returns {string} Relationship type
 */
function determineRelationshipType(recordType, name, type) {
  switch (recordType) {
    case 'campaign_contributions':
      return 'donor';
    case 'campaign_expenditures':
      return 'recipient';
    case 'lobbyist_registrations':
      return 'client';
    case 'firm_registrations':
      return 'employer';
    default:
      return 'affiliated';
  }
}

/**
 * Calculate significance score for entity prioritization
 * @param {Object} entity Entity object
 * @returns {number} Significance score
 */
function calculateSignificanceScore(entity) {
  // Base score starts at 1
  let score = 1;
  
  // Financial impact factor (0-100)
  const financialFactor = Math.min(100, entity.totalAmount / 1000);
  
  // Transaction volume factor (0-50)
  const volumeFactor = Math.min(50, entity.totalTransactions * 2);
  
  // Network centrality factor (0-50)
  const networkFactor = Math.min(50, entity.relatedEntities.size * 5);
  
  // Entity type importance multiplier
  let typeMultiplier = 1.0;
  switch (entity.type) {
    case 'pac':
    case 'super_pac':
      typeMultiplier = 2.0;
      break;
    case 'candidate':
      typeMultiplier = 1.8;
      break;
    case 'consulting_firm':
      typeMultiplier = 1.5;
      break;
    case 'organization':
      typeMultiplier = 1.3;
      break;
    case 'lobbyist':
      typeMultiplier = 1.7;
      break;
    default:
      typeMultiplier = 1.0;
  }
  
  // Combine factors and apply type multiplier
  score = (financialFactor + volumeFactor + networkFactor) * typeMultiplier;
  
  return Math.round(score);
}

/**
 * Extract relationships between entities
 * @param {Array} processedData Processed records
 * @returns {Array} Relationship data
 */
function extractRelationships(processedData) {
  const relationships = [];
  
  processedData.forEach(record => {
    // Identify potential relationship pairs in the record
    const potentialRelationships = [];
    
    if (record.filer_name && record.contributor_name) {
      potentialRelationships.push({
        source: record.contributor_name,
        target: record.filer_name,
        type: 'donor',
        record
      });
    }
    
    if (record.filer_name && record.payee_name) {
      potentialRelationships.push({
        source: record.filer_name,
        target: record.payee_name,
        type: 'recipient',
        record
      });
    }
    
    if (record.lobbyist_name && record.client_name) {
      potentialRelationships.push({
        source: record.lobbyist_name,
        target: record.client_name,
        type: 'client',
        record
      });
    }
    
    if (record.firm_name && record.lobbyist_name) {
      potentialRelationships.push({
        source: record.lobbyist_name,
        target: record.firm_name,
        type: 'employer',
        record
      });
    }
    
    // Add the identified relationships
    potentialRelationships.forEach(rel => {
      if (rel.source && rel.target && rel.source !== rel.target) {
        relationships.push({
          id: uuidv4(),
          source_name: rel.source,
          source_type: determineEntityType(rel.source),
          target_name: rel.target,
          target_type: determineEntityType(rel.target),
          relationship_type: rel.type,
          date: record.date || record.expenditure_date || record.contribution_date || 
                record.registration_date || record.filing_date || new Date().toISOString(),
          amount: record.normalized_amount || record.amount || 0,
          details: {
            transaction_id: record.id,
            purpose: record.purpose || record.expenditure_purpose,
            subject_matter: record.subject_matter
          }
        });
      }
    });
  });
  
  return relationships;
}

/**
 * Enrich entity data using AI for better context and understanding
 * @param {Object} entity Entity to enrich
 * @returns {Object} Enriched entity data
 */
async function enrichEntityWithAI(entity) {
  // This is a placeholder for future AI enrichment functionality
  // In a production environment, this would use OpenAI or similar to generate insights
  
  // Generate a basic summary based on available data
  let summary = `${entity.name} is a ${entity.type} with ${entity.totalTransactions} transactions`;
  if (entity.totalAmount > 0) {
    summary += ` totaling $${entity.totalAmount.toLocaleString()}`;
  }
  summary += ` and connections to ${entity.relatedEntities.size} other entities.`;
  
  // Detect potential flags based on patterns
  const flags = [];
  
  // Flag large transactions
  if (entity.totalAmount > 100000) {
    flags.push({
      type: 'large_transaction_volume',
      severity: 'medium',
      description: `High transaction volume: $${entity.totalAmount.toLocaleString()}`
    });
  }
  
  // Flag entities with many connections
  if (entity.relatedEntities.size > 20) {
    flags.push({
      type: 'high_connectivity',
      severity: 'medium',
      description: `Connected to ${entity.relatedEntities.size} other entities`
    });
  }
  
  // Flag PACs with high transaction volumes
  if (entity.type === 'pac' && entity.totalAmount > 50000) {
    flags.push({
      type: 'high_volume_pac',
      severity: 'medium',
      description: 'PAC with significant financial activity'
    });
  }
  
  return {
    ...entity,
    aiSummary: summary,
    flags
  };
}

export { processTECReports };