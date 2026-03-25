/**
 * FEC Data Fetcher
 * 
 * This module connects to the Federal Election Commission (FEC) API
 * to retrieve campaign finance data including:
 * - Individual donors
 * - Committees
 * - Candidates
 * - PACs
 * 
 * It provides a flexible interface to search by various parameters
 * and returns data in a normalized format for the Scout Bot system.
 */

const axios = require('axios');
const { logger } = require('../server/utils/logger');

// FEC API configuration
const FEC_API_BASE_URL = 'https://api.open.fec.gov/v1';
const DEFAULT_PAGE_SIZE = 100;

/**
 * Fetches donor information from the FEC API
 * @param {Object} params Query parameters
 * @param {string} params.name Individual's name to search for
 * @param {string} params.contributor_state State (2-letter code)
 * @param {string} params.contributor_city City
 * @param {string} params.contributor_employer Employer name
 * @param {string} params.contributor_occupation Occupation
 * @param {number} params.min_amount Minimum contribution amount
 * @param {number} params.max_amount Maximum contribution amount
 * @param {string} params.committee_id Committee ID
 * @param {string} params.two_year_transaction_period Two-year period for transactions (e.g., 2020)
 * @param {number} params.page Page number for pagination
 * @param {number} params.per_page Number of results per page
 * @returns {Promise<Object>} Donation records and metadata
 */
async function fetchDonorsByName(params = {}, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('FEC API key is required. Use the FEC_API_KEY environment variable.');
    }

    const response = await axios.get(`${FEC_API_BASE_URL}/schedules/schedule_a/`, {
      params: {
        api_key: apiKey,
        sort: '-contribution_receipt_amount',
        per_page: params.per_page || DEFAULT_PAGE_SIZE,
        page: params.page || 1,
        ...params
      }
    });

    return {
      results: response.data.results,
      pagination: {
        count: response.data.pagination.count,
        pages: response.data.pagination.pages,
        per_page: response.data.pagination.per_page,
        page: response.data.pagination.page
      }
    };
  } catch (error) {
    logger.error(`FEC API Error: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches committee information from the FEC API
 * @param {Object} params Query parameters
 * @param {string} params.name Committee name
 * @param {string} params.state State (2-letter code)
 * @param {string} params.committee_type Committee type
 * @param {string} params.committee_id Committee ID
 * @param {number} params.page Page number for pagination
 * @param {number} params.per_page Number of results per page
 * @returns {Promise<Object>} Committee records and metadata
 */
async function fetchCommittees(params = {}, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('FEC API key is required. Use the FEC_API_KEY environment variable.');
    }

    const response = await axios.get(`${FEC_API_BASE_URL}/committees/`, {
      params: {
        api_key: apiKey,
        sort: '-receipts',
        per_page: params.per_page || DEFAULT_PAGE_SIZE,
        page: params.page || 1,
        ...params
      }
    });

    return {
      results: response.data.results,
      pagination: {
        count: response.data.pagination.count,
        pages: response.data.pagination.pages,
        per_page: response.data.pagination.per_page,
        page: response.data.pagination.page
      }
    };
  } catch (error) {
    logger.error(`FEC API Error: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches candidates information from the FEC API
 * @param {Object} params Query parameters
 * @param {string} params.name Candidate name
 * @param {string} params.state State (2-letter code)
 * @param {string} params.office Office (H=House, S=Senate, P=President)
 * @param {string} params.party Party affiliation
 * @param {string} params.candidate_id Candidate ID
 * @param {number} params.page Page number for pagination
 * @param {number} params.per_page Number of results per page
 * @returns {Promise<Object>} Candidate records and metadata
 */
async function fetchCandidates(params = {}, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('FEC API key is required. Use the FEC_API_KEY environment variable.');
    }

    const response = await axios.get(`${FEC_API_BASE_URL}/candidates/`, {
      params: {
        api_key: apiKey,
        sort: '-last_file_date',
        per_page: params.per_page || DEFAULT_PAGE_SIZE,
        page: params.page || 1,
        ...params
      }
    });

    return {
      results: response.data.results,
      pagination: {
        count: response.data.pagination.count,
        pages: response.data.pagination.pages,
        per_page: response.data.pagination.per_page,
        page: response.data.pagination.page
      }
    };
  } catch (error) {
    logger.error(`FEC API Error: ${error.message}`);
    throw error;
  }
}

/**
 * Categorizes political entities based on their attributes
 * @param {Object} entity The entity to categorize (donor, committee, candidate)
 * @param {string} entityType The type of entity ('donor', 'committee', 'candidate')
 * @returns {string[]} Array of category tags
 */
function categorizeEntity(entity, entityType) {
  const categories = [];

  if (entityType === 'donor') {
    // Categorize donors
    if (entity.contributor_employer?.toLowerCase().includes('lobby')) {
      categories.push('lobbyist');
    }
    
    if (entity.contributor_occupation?.toLowerCase().includes('consult')) {
      categories.push('consultant');
    }
    
    if (entity.contribution_receipt_amount >= 10000) {
      categories.push('major_donor');
    }
    
    // Check for political patterns in employment or occupation
    const politicalTerms = ['political', 'campaign', 'pac', 'party', 'committee'];
    const text = `${entity.contributor_employer || ''} ${entity.contributor_occupation || ''}`.toLowerCase();
    
    for (const term of politicalTerms) {
      if (text.includes(term)) {
        categories.push('political_professional');
        break;
      }
    }
  } else if (entityType === 'committee') {
    // Categorize committees
    if (entity.committee_type === 'P') {
      categories.push('presidential');
    }
    
    if (entity.committee_type === 'H' || entity.committee_type === 'S') {
      categories.push('congressional');
    }
    
    if (entity.committee_type === 'O') {
      categories.push('super_pac');
    }
    
    if (entity.committee_type === 'N' || entity.committee_type === 'Q') {
      categories.push('pac');
    }
    
    if (entity.committee_type === 'V') {
      categories.push('leadership_pac');
    }
    
    if (entity.party_full) {
      categories.push(entity.party_full.toLowerCase().replace(/\s+/g, '_'));
    }
  } else if (entityType === 'candidate') {
    // Categorize candidates
    if (entity.office === 'P') {
      categories.push('presidential_candidate');
    }
    
    if (entity.office === 'S') {
      categories.push('senate_candidate');
    }
    
    if (entity.office === 'H') {
      categories.push('house_candidate');
    }
    
    if (entity.incumbent_challenge === 'I') {
      categories.push('incumbent');
    }
    
    if (entity.party) {
      categories.push(entity.party.toLowerCase());
    }
  }

  return categories;
}

/**
 * Normalizes the data from FEC API to Scout Bot format for donors
 * @param {Object[]} donorRecords Array of donor records from the FEC API
 * @returns {Object[]} Normalized donor records for Scout Bot
 */
function normalizeDonorData(donorRecords) {
  return donorRecords.map(record => {
    const categories = categorizeEntity(record, 'donor');
    
    return {
      name: record.contributor_name,
      type: 'donor',
      categories,
      details: {
        employer: record.contributor_employer,
        occupation: record.contributor_occupation,
        location: `${record.contributor_city || ''}, ${record.contributor_state || ''}`,
        amount: record.contribution_receipt_amount,
        date: record.contribution_receipt_date,
        recipient: {
          committee_id: record.committee_id,
          committee_name: record.committee.name,
          candidate_name: record.committee.candidate_name
        }
      },
      flags: determineFlags(record, 'donor'),
      source: {
        type: 'fec',
        id: record.sub_id,
        url: `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(record.contributor_name)}`
      }
    };
  });
}

/**
 * Normalizes the data from FEC API to Scout Bot format for committees
 * @param {Object[]} committeeRecords Array of committee records from the FEC API
 * @returns {Object[]} Normalized committee records for Scout Bot
 */
function normalizeCommitteeData(committeeRecords) {
  return committeeRecords.map(record => {
    const categories = categorizeEntity(record, 'committee');
    
    return {
      name: record.name,
      type: 'committee',
      categories,
      details: {
        committee_id: record.committee_id,
        committee_type: record.committee_type,
        committee_type_full: record.committee_type_full,
        filing_frequency: record.filing_frequency,
        first_file_date: record.first_file_date,
        last_file_date: record.last_file_date,
        treasurer_name: record.treasurer_name,
        party: record.party_full,
        organization_type: record.organization_type,
        candidate_ids: record.candidate_ids
      },
      flags: determineFlags(record, 'committee'),
      source: {
        type: 'fec',
        id: record.committee_id,
        url: `https://www.fec.gov/data/committee/${record.committee_id}/`
      }
    };
  });
}

/**
 * Normalizes the data from FEC API to Scout Bot format for candidates
 * @param {Object[]} candidateRecords Array of candidate records from the FEC API
 * @returns {Object[]} Normalized candidate records for Scout Bot
 */
function normalizeCandidateData(candidateRecords) {
  return candidateRecords.map(record => {
    const categories = categorizeEntity(record, 'candidate');
    
    return {
      name: record.name,
      type: 'candidate',
      categories,
      details: {
        candidate_id: record.candidate_id,
        office: record.office,
        office_full: record.office_full,
        party: record.party,
        party_full: record.party_full,
        state: record.state,
        district: record.district,
        incumbent_challenge: record.incumbent_challenge,
        incumbent_challenge_full: record.incumbent_challenge_full,
        first_file_date: record.first_file_date,
        last_file_date: record.last_file_date,
        election_years: record.election_years,
        active_through: record.active_through
      },
      flags: determineFlags(record, 'candidate'),
      source: {
        type: 'fec',
        id: record.candidate_id,
        url: `https://www.fec.gov/data/candidate/${record.candidate_id}/`
      }
    };
  });
}

/**
 * Determines flags for entities based on their attributes
 * @param {Object} entity The entity to evaluate
 * @param {string} entityType The type of entity
 * @returns {Object[]} Array of flag objects
 */
function determineFlags(entity, entityType) {
  const flags = [];
  
  if (entityType === 'donor') {
    if (entity.contribution_receipt_amount >= 100000) {
      flags.push({
        type: 'high_value_donor',
        severity: 'high',
        description: `Large donation of $${entity.contribution_receipt_amount.toLocaleString()}`
      });
    } else if (entity.contribution_receipt_amount >= 10000) {
      flags.push({
        type: 'significant_donor',
        severity: 'medium',
        description: `Significant donation of $${entity.contribution_receipt_amount.toLocaleString()}`
      });
    }
    
    // Check for lobbyist donors
    if (entity.contributor_employer?.toLowerCase().includes('lobby') || 
        entity.contributor_occupation?.toLowerCase().includes('lobby')) {
      flags.push({
        type: 'lobbyist_donor',
        severity: 'medium',
        description: 'Donor identified as lobbyist'
      });
    }
  } else if (entityType === 'committee') {
    if (entity.committee_type === 'O') {
      flags.push({
        type: 'super_pac',
        severity: 'medium',
        description: 'Super PAC with unlimited spending ability'
      });
    }
    
    // Check for leadership PACs
    if (entity.committee_type === 'V') {
      flags.push({
        type: 'leadership_pac',
        severity: 'medium',
        description: 'Leadership PAC connected to elected official'
      });
    }
  } else if (entityType === 'candidate') {
    // Flag for candidates with multiple committees
    if (entity.principal_committees && entity.principal_committees.length > 1) {
      flags.push({
        type: 'multiple_committees',
        severity: 'low',
        description: `Candidate has ${entity.principal_committees.length} registered committees`
      });
    }
  }
  
  return flags;
}

/**
 * Cross-references FEC data with Texas Ethics Commission data
 * @param {Object[]} fecEntities Normalized entities from FEC
 * @param {Object[]} tecEntities Normalized entities from TEC
 * @returns {Object[]} Entities with cross-reference flags
 */
function crossReferenceWithTEC(fecEntities, tecEntities) {
  // This is a placeholder for future implementation
  // Will identify donors, committees, and candidates that appear in both federal and state records
  return fecEntities.map(fecEntity => {
    const matchingTecEntities = tecEntities.filter(tecEntity => {
      // Simple name matching - a more sophisticated algorithm would be used in production
      return tecEntity.name.toLowerCase().includes(fecEntity.name.toLowerCase()) ||
             fecEntity.name.toLowerCase().includes(tecEntity.name.toLowerCase());
    });
    
    if (matchingTecEntities.length > 0) {
      // Add cross-reference flag
      fecEntity.flags.push({
        type: 'federal_state_crossover',
        severity: 'high',
        description: `Entity appears in both federal (FEC) and state (TEC) records`,
        references: matchingTecEntities.map(e => ({ id: e.source.id, name: e.name, type: e.type }))
      });
    }
    
    return fecEntity;
  });
}

module.exports = {
  fetchDonorsByName,
  fetchCommittees,
  fetchCandidates,
  normalizeDonorData,
  normalizeCommitteeData,
  normalizeCandidateData,
  categorizeEntity,
  crossReferenceWithTEC
};