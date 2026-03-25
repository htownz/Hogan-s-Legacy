/**
 * Texas Ethics Commission (TEC) Data Scraper
 * 
 * This module extracts campaign finance and lobbying data from the
 * Texas Ethics Commission website by:
 * - Scraping HTML from public disclosure pages
 * - Parsing CSV reports
 * - Processing downloaded campaign finance reports
 * 
 * Data includes contributions, expenditures, lobbyists, PACs,
 * and consultant relationships.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../server/utils/logger');

// TEC website URLs
const TEC_BASE_URL = 'https://www.ethics.state.tx.us';
const CAMPAIGN_FINANCE_URL = `${TEC_BASE_URL}/search/cf`;
const LOBBYIST_SEARCH_URL = `${TEC_BASE_URL}/search/lobby`;
const PAC_SEARCH_URL = `${TEC_BASE_URL}/search/pacCOH`;

// Download directories
const DOWNLOAD_DIR = path.join(__dirname, '../data/tec_downloads');
const REPORTS_DIR = path.join(DOWNLOAD_DIR, 'reports');
const CSV_DIR = path.join(DOWNLOAD_DIR, 'csv');

/**
 * Ensures download directories exist
 */
async function setupDirectories() {
  try {
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    await fs.mkdir(CSV_DIR, { recursive: true });
    logger.info('TEC download directories created');
  } catch (error) {
    logger.error(`Error creating directories: ${error.message}`);
    throw error;
  }
}

/**
 * Searches for campaign finance reports by filer name
 * @param {string} name Name of the filer to search
 * @returns {Promise<Object[]>} Array of report metadata objects
 */
async function searchCampaignReports(name) {
  try {
    // First, search for the filer
    const searchResponse = await axios.post(CAMPAIGN_FINANCE_URL, {
      searchType: 'filerName',
      filerName: name,
      reportType: 'ALL'
    });

    const $ = cheerio.load(searchResponse.data);
    const results = [];

    // Extract filer IDs and names
    $('table.searchResults tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const columns = $(row).find('td');
      if (columns.length >= 3) {
        const filerId = $(columns[0]).text().trim();
        const filerName = $(columns[1]).text().trim();
        const filerType = $(columns[2]).text().trim();
        
        results.push({
          filerId,
          filerName,
          filerType,
          reportsUrl: `${CAMPAIGN_FINANCE_URL}/COH?filerID=${filerId}`
        });
      }
    });

    // For each filer, fetch their reports
    const allReports = [];
    for (const filer of results) {
      const reports = await fetchFilerReports(filer);
      allReports.push(...reports);
    }

    return allReports;
  } catch (error) {
    logger.error(`Error searching campaign reports: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches reports for a specific filer
 * @param {Object} filer Filer metadata
 * @returns {Promise<Object[]>} Array of report metadata
 */
async function fetchFilerReports(filer) {
  try {
    const response = await axios.get(filer.reportsUrl);
    const $ = cheerio.load(response.data);
    const reports = [];

    $('table.reportResults tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const columns = $(row).find('td');
      if (columns.length >= 5) {
        const reportType = $(columns[0]).text().trim();
        const period = $(columns[1]).text().trim();
        const received = $(columns[2]).text().trim();
        const reportId = $(columns[3]).find('a').attr('href')?.split('=').pop() || '';
        const correctionStatus = $(columns[4]).text().trim();
        
        reports.push({
          filerId: filer.filerId,
          filerName: filer.filerName,
          filerType: filer.filerType,
          reportType,
          period,
          received,
          reportId,
          correctionStatus,
          downloadUrl: reportId ? `${TEC_BASE_URL}/search/cf/CFReport.php?reportID=${reportId}` : null
        });
      }
    });

    return reports;
  } catch (error) {
    logger.error(`Error fetching filer reports: ${error.message}`);
    throw error;
  }
}

/**
 * Downloads a specific campaign finance report
 * @param {Object} report Report metadata
 * @returns {Promise<string>} Path to the downloaded file
 */
async function downloadReport(report) {
  if (!report.downloadUrl) {
    throw new Error('No download URL provided for report');
  }

  const filename = `${report.filerId}_${report.reportId}_${report.reportType.replace(/\s+/g, '_')}.html`;
  const filepath = path.join(REPORTS_DIR, filename);

  try {
    const response = await axios.get(report.downloadUrl, { responseType: 'text' });
    await fs.writeFile(filepath, response.data);
    logger.info(`Downloaded report to ${filepath}`);
    return filepath;
  } catch (error) {
    logger.error(`Error downloading report: ${error.message}`);
    throw error;
  }
}

/**
 * Extracts contribution data from a downloaded report
 * @param {string} filepath Path to the downloaded report file
 * @returns {Promise<Object[]>} Array of contribution records
 */
async function extractContributionsFromReport(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    const $ = cheerio.load(content);
    const contributions = [];

    // Locate the contributions section
    $('h3:contains("Schedule A: Political Contributions")').nextUntil('h3').find('tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const columns = $(row).find('td');
      if (columns.length >= 6) {
        const date = $(columns[0]).text().trim();
        const contributorName = $(columns[1]).text().trim();
        const contributorAddress = $(columns[2]).text().trim();
        const contributorCity = $(columns[3]).text().trim();
        const contributorState = $(columns[4]).text().trim();
        const contributorZip = $(columns[5]).text().trim();
        const amount = $(columns[6]).text().trim().replace(/[$,]/g, '');
        
        contributions.push({
          date,
          contributorName,
          contributorAddress,
          contributorCity,
          contributorState,
          contributorZip,
          amount: parseFloat(amount) || 0
        });
      }
    });

    return contributions;
  } catch (error) {
    logger.error(`Error extracting contributions: ${error.message}`);
    throw error;
  }
}

/**
 * Searches for lobbyist registrations by name
 * @param {string} name Name of the lobbyist to search
 * @returns {Promise<Object[]>} Array of lobbyist metadata
 */
async function searchLobbyists(name) {
  try {
    const response = await axios.post(LOBBYIST_SEARCH_URL, {
      searchType: 'lobbyistName',
      lobbyistName: name,
      year: 'ALL'
    });

    const $ = cheerio.load(response.data);
    const lobbyists = [];

    $('table.searchResults tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const columns = $(row).find('td');
      if (columns.length >= 4) {
        const lobbyistId = $(columns[0]).text().trim();
        const lobbyistName = $(columns[1]).text().trim();
        const registrationYear = $(columns[2]).text().trim();
        const city = $(columns[3]).text().trim();
        
        lobbyists.push({
          lobbyistId,
          lobbyistName,
          registrationYear,
          city,
          detailsUrl: `${TEC_BASE_URL}/search/lobby/LobbyistProf.php?lobID=${lobbyistId}&year=${registrationYear}`
        });
      }
    });

    // Fetch details for each lobbyist
    for (let i = 0; i < lobbyists.length; i++) {
      try {
        const details = await fetchLobbyistDetails(lobbyists[i]);
        lobbyists[i] = { ...lobbyists[i], ...details };
      } catch (error) {
        logger.error(`Error fetching details for lobbyist ${lobbyists[i].lobbyistId}: ${error.message}`);
        // Continue with next lobbyist
      }
    }

    return lobbyists;
  } catch (error) {
    logger.error(`Error searching lobbyists: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches detailed information for a lobbyist
 * @param {Object} lobbyist Lobbyist metadata
 * @returns {Promise<Object>} Detailed lobbyist information
 */
async function fetchLobbyistDetails(lobbyist) {
  try {
    const response = await axios.get(lobbyist.detailsUrl);
    const $ = cheerio.load(response.data);
    
    // Extract profile information
    const address = $('td:contains("Address:")').next().text().trim();
    const phone = $('td:contains("Phone:")').next().text().trim();
    const clients = [];
    
    // Extract client information
    $('h3:contains("Clients")').nextUntil('h3').find('tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const columns = $(row).find('td');
      if (columns.length >= 3) {
        const clientName = $(columns[0]).text().trim();
        const amount = $(columns[1]).text().trim();
        const subject = $(columns[2]).text().trim();
        
        clients.push({
          clientName,
          amount,
          subject
        });
      }
    });

    // Extract employer information
    const employer = $('td:contains("Employer:")').next().text().trim();
    
    return {
      address,
      phone,
      employer,
      clients
    };
  } catch (error) {
    logger.error(`Error fetching lobbyist details: ${error.message}`);
    throw error;
  }
}

/**
 * Searches for Political Action Committees (PACs)
 * @param {string} name Name of the PAC to search
 * @returns {Promise<Object[]>} Array of PAC metadata
 */
async function searchPACs(name) {
  try {
    const response = await axios.post(PAC_SEARCH_URL, {
      searchType: 'pacName',
      pacName: name
    });

    const $ = cheerio.load(response.data);
    const pacs = [];

    $('table.searchResults tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const columns = $(row).find('td');
      if (columns.length >= 3) {
        const pacId = $(columns[0]).text().trim();
        const pacName = $(columns[1]).text().trim();
        const pacType = $(columns[2]).text().trim();
        
        pacs.push({
          pacId,
          pacName,
          pacType,
          detailsUrl: `${TEC_BASE_URL}/search/pacCOH/PACProfile.php?pacID=${pacId}`
        });
      }
    });

    // Fetch details for each PAC
    for (let i = 0; i < pacs.length; i++) {
      try {
        const details = await fetchPACDetails(pacs[i]);
        pacs[i] = { ...pacs[i], ...details };
      } catch (error) {
        logger.error(`Error fetching details for PAC ${pacs[i].pacId}: ${error.message}`);
        // Continue with next PAC
      }
    }

    return pacs;
  } catch (error) {
    logger.error(`Error searching PACs: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches detailed information for a PAC
 * @param {Object} pac PAC metadata
 * @returns {Promise<Object>} Detailed PAC information
 */
async function fetchPACDetails(pac) {
  try {
    const response = await axios.get(pac.detailsUrl);
    const $ = cheerio.load(response.data);
    
    const address = $('td:contains("Address:")').next().text().trim();
    const treasurer = $('td:contains("Treasurer:")').next().text().trim();
    const phone = $('td:contains("Phone:")').next().text().trim();
    const purpose = $('td:contains("Purpose:")').next().text().trim();
    
    return {
      address,
      treasurer,
      phone,
      purpose,
      reportsUrl: `${TEC_BASE_URL}/search/cf/COH?filerID=${pac.pacId}`
    };
  } catch (error) {
    logger.error(`Error fetching PAC details: ${error.message}`);
    throw error;
  }
}

/**
 * Categorizes an entity based on TEC data attributes
 * @param {Object} entity The entity to categorize
 * @param {string} entityType The type of entity ('contribution', 'lobbyist', 'pac')
 * @returns {string[]} Array of category tags
 */
function categorizeEntity(entity, entityType) {
  const categories = [];
  
  if (entityType === 'contribution') {
    // Categorize based on contribution amount
    if (entity.amount >= 50000) {
      categories.push('mega_donor');
    } else if (entity.amount >= 10000) {
      categories.push('major_donor');
    } else if (entity.amount >= 1000) {
      categories.push('significant_donor');
    }
    
    // Check if entity appears to be a corporate donor
    const corporateTerms = ['inc', 'corp', 'llc', 'lp', 'company', 'group', 'associates'];
    const contributorNameLower = entity.contributorName.toLowerCase();
    
    for (const term of corporateTerms) {
      if (contributorNameLower.includes(term)) {
        categories.push('corporate_donor');
        break;
      }
    }
    
  } else if (entityType === 'lobbyist') {
    categories.push('lobbyist');
    
    if (entity.clients && entity.clients.length > 5) {
      categories.push('high_volume_lobbyist');
    }
    
    if (entity.employer) {
      const employerLower = entity.employer.toLowerCase();
      if (employerLower.includes('firm') || employerLower.includes('partner') || employerLower.includes('llp')) {
        categories.push('law_firm_lobbyist');
      }
      
      if (employerLower.includes('consult')) {
        categories.push('consultant');
      }
    }
    
  } else if (entityType === 'pac') {
    categories.push('pac');
    
    if (entity.pacType === 'GPAC') {
      categories.push('general_pac');
    } else if (entity.pacType === 'SPAC') {
      categories.push('specific_pac');
    }
    
    if (entity.purpose) {
      const purposeLower = entity.purpose.toLowerCase();
      
      if (purposeLower.includes('industry') || purposeLower.includes('business')) {
        categories.push('industry_pac');
      }
      
      if (purposeLower.includes('education')) {
        categories.push('education_pac');
      }
      
      if (purposeLower.includes('health')) {
        categories.push('healthcare_pac');
      }
    }
  }
  
  return categories;
}

/**
 * Normalizes contribution data from TEC to Scout Bot format
 * @param {Object[]} contributions Array of contribution records
 * @param {Object} reportInfo Report metadata 
 * @returns {Object[]} Normalized contribution records for Scout Bot
 */
function normalizeContributionData(contributions, reportInfo) {
  return contributions.map(contribution => {
    const categories = categorizeEntity(contribution, 'contribution');
    
    return {
      name: contribution.contributorName,
      type: 'donor',
      categories,
      details: {
        address: contribution.contributorAddress,
        city: contribution.contributorCity,
        state: contribution.contributorState,
        zip: contribution.contributorZip,
        amount: contribution.amount,
        date: contribution.date,
        recipient: {
          filerName: reportInfo.filerName,
          filerId: reportInfo.filerId,
          filerType: reportInfo.filerType,
          reportType: reportInfo.reportType,
          reportId: reportInfo.reportId,
          reportPeriod: reportInfo.period
        }
      },
      flags: determineFlags(contribution, 'contribution'),
      source: {
        type: 'tec',
        id: `contrib_${reportInfo.reportId}_${contribution.contributorName.replace(/\s+/g, '_')}`,
        url: reportInfo.downloadUrl
      }
    };
  });
}

/**
 * Normalizes lobbyist data from TEC to Scout Bot format
 * @param {Object[]} lobbyists Array of lobbyist records
 * @returns {Object[]} Normalized lobbyist records for Scout Bot
 */
function normalizeLobbyistData(lobbyists) {
  return lobbyists.map(lobbyist => {
    const categories = categorizeEntity(lobbyist, 'lobbyist');
    
    return {
      name: lobbyist.lobbyistName,
      type: 'lobbyist',
      categories,
      details: {
        lobbyistId: lobbyist.lobbyistId,
        registrationYear: lobbyist.registrationYear,
        city: lobbyist.city,
        address: lobbyist.address,
        phone: lobbyist.phone,
        employer: lobbyist.employer,
        clients: lobbyist.clients || []
      },
      flags: determineFlags(lobbyist, 'lobbyist'),
      source: {
        type: 'tec',
        id: `lobby_${lobbyist.lobbyistId}_${lobbyist.registrationYear}`,
        url: lobbyist.detailsUrl
      }
    };
  });
}

/**
 * Normalizes PAC data from TEC to Scout Bot format
 * @param {Object[]} pacs Array of PAC records
 * @returns {Object[]} Normalized PAC records for Scout Bot
 */
function normalizePACData(pacs) {
  return pacs.map(pac => {
    const categories = categorizeEntity(pac, 'pac');
    
    return {
      name: pac.pacName,
      type: 'pac',
      categories,
      details: {
        pacId: pac.pacId,
        pacType: pac.pacType,
        address: pac.address,
        treasurer: pac.treasurer,
        phone: pac.phone,
        purpose: pac.purpose
      },
      flags: determineFlags(pac, 'pac'),
      source: {
        type: 'tec',
        id: `pac_${pac.pacId}`,
        url: pac.detailsUrl
      }
    };
  });
}

/**
 * Determines flags for entities based on TEC data attributes
 * @param {Object} entity The entity to evaluate
 * @param {string} entityType The type of entity
 * @returns {Object[]} Array of flag objects
 */
function determineFlags(entity, entityType) {
  const flags = [];
  
  if (entityType === 'contribution') {
    // Flag large contributions
    if (entity.amount >= 50000) {
      flags.push({
        type: 'very_large_donation',
        severity: 'high',
        description: `Very large donation of $${entity.amount.toLocaleString()}`
      });
    } else if (entity.amount >= 10000) {
      flags.push({
        type: 'large_donation',
        severity: 'medium',
        description: `Large donation of $${entity.amount.toLocaleString()}`
      });
    }
    
    // Check for out-of-state contributions
    if (entity.contributorState && entity.contributorState !== 'TX') {
      flags.push({
        type: 'out_of_state_donor',
        severity: 'low',
        description: `Out-of-state donation from ${entity.contributorState}`
      });
    }
    
  } else if (entityType === 'lobbyist') {
    // Flag lobbyists with many clients
    if (entity.clients && entity.clients.length > 10) {
      flags.push({
        type: 'multi_client_lobbyist',
        severity: 'medium',
        description: `Lobbyist represents ${entity.clients.length} different clients`
      });
    }
    
    // Flag lobbyists with high-value contracts
    const highValueClient = entity.clients?.find(client => {
      const amount = client.amount;
      return amount.includes('$50,000') || amount.includes('$100,000');
    });
    
    if (highValueClient) {
      flags.push({
        type: 'high_value_lobbying',
        severity: 'medium',
        description: `High-value lobbying contract with ${highValueClient.clientName}`
      });
    }
    
  } else if (entityType === 'pac') {
    // Flag special-purpose PACs
    if (entity.pacType === 'SPAC') {
      flags.push({
        type: 'specific_purpose_pac',
        severity: 'low',
        description: 'Specific-purpose political action committee'
      });
    }
    
    // Flag PACs with certain keywords in purpose
    const sensitiveTerms = ['ballot', 'initiative', 'proposition', 'referendum', 'campaign'];
    
    if (entity.purpose) {
      const purposeLower = entity.purpose.toLowerCase();
      
      for (const term of sensitiveTerms) {
        if (purposeLower.includes(term)) {
          flags.push({
            type: 'electoral_influence_pac',
            severity: 'medium',
            description: `PAC focused on direct electoral influence (${term})`
          });
          break;
        }
      }
    }
  }
  
  return flags;
}

/**
 * Cross-references TEC data with FEC data
 * @param {Object[]} tecEntities Normalized entities from TEC
 * @param {Object[]} fecEntities Normalized entities from FEC
 * @returns {Object[]} Entities with cross-reference flags
 */
function crossReferenceWithFEC(tecEntities, fecEntities) {
  // This is a placeholder for future implementation
  // Will identify donors, committees, and lobbyists that appear in both state and federal records
  return tecEntities.map(tecEntity => {
    const matchingFecEntities = fecEntities.filter(fecEntity => {
      // Simple name matching - a more sophisticated algorithm would be used in production
      return fecEntity.name.toLowerCase().includes(tecEntity.name.toLowerCase()) ||
             tecEntity.name.toLowerCase().includes(fecEntity.name.toLowerCase());
    });
    
    if (matchingFecEntities.length > 0) {
      // Add cross-reference flag
      tecEntity.flags.push({
        type: 'state_federal_crossover',
        severity: 'high',
        description: `Entity appears in both state (TEC) and federal (FEC) records`,
        references: matchingFecEntities.map(e => ({ id: e.source.id, name: e.name, type: e.type }))
      });
    }
    
    return tecEntity;
  });
}

module.exports = {
  setupDirectories,
  searchCampaignReports,
  downloadReport,
  extractContributionsFromReport,
  searchLobbyists,
  searchPACs,
  normalizeContributionData,
  normalizeLobbyistData,
  normalizePACData,
  crossReferenceWithFEC
};