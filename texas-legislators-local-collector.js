/**
 * Texas Legislators Local Data Collector
 * Run this script on your PC to collect authentic Texas legislator data
 * 
 * Usage: node texas-legislators-local-collector.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://capitol.texas.gov';
const HOUSE_URL = `${BASE_URL}/Members/en/District`;
const SENATE_URL = `${BASE_URL}/Members/en/senate/District`;
const OUTPUT_DIR = './collected-data';
const DELAY_MS = 1000; // 1 second delay between requests to be respectful

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Utility function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Log function
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Also save to log file
  const logFile = path.join(OUTPUT_DIR, 'collection.log');
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
};

// Scrape individual legislator details
async function scrapeLegislatorDetails(url, chamber) {
  try {
    log(`Fetching legislator details from: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    const legislator = {
      chamber,
      name: $('h1').first().text().trim(),
      district: extractDistrict(url),
      party: extractParty($),
      email: extractEmail($),
      phone: extractPhone($),
      address: extractAddress($),
      committees: extractCommittees($),
      imageUrl: extractImageUrl($, BASE_URL),
      biography: extractBiography($),
      collectedAt: new Date().toISOString()
    };
    
    return legislator;
  } catch (error) {
    log(`Error scraping legislator details from ${url}: ${error.message}`);
    return null;
  }
}

// Helper functions to extract specific data
function extractDistrict(url) {
  const match = url.match(/District\/(\d+)/);
  return match ? `District ${match[1]}` : 'Unknown';
}

function extractParty($) {
  // Look for party information in various common locations
  const partyText = $('.member-party, .party, [class*="party"]').text().trim();
  if (partyText.includes('Republican') || partyText.includes('(R)')) return 'Republican';
  if (partyText.includes('Democrat') || partyText.includes('(D)')) return 'Democrat';
  return 'Unknown';
}

function extractEmail($) {
  const emailLink = $('a[href^="mailto:"]').first();
  return emailLink.length ? emailLink.attr('href').replace('mailto:', '') : '';
}

function extractPhone($) {
  const phoneText = $('.phone, .contact-phone, [class*="phone"]').text().trim();
  const phoneMatch = phoneText.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  return phoneMatch ? phoneMatch[1] : '';
}

function extractAddress($) {
  const addressElements = $('.address, .contact-address, [class*="address"]');
  return addressElements.map((i, el) => $(el).text().trim()).get().join(', ');
}

function extractCommittees($) {
  const committees = [];
  $('.committee, [class*="committee"]').each((i, el) => {
    const committeeName = $(el).text().trim();
    if (committeeName && committeeName.length > 2) {
      committees.push(committeeName);
    }
  });
  return committees;
}

function extractImageUrl($, baseUrl) {
  const imgElement = $('img.member-photo, .profile-image img, [class*="photo"] img').first();
  if (imgElement.length) {
    const src = imgElement.attr('src');
    return src ? (src.startsWith('http') ? src : `${baseUrl}${src}`) : '';
  }
  return '';
}

function extractBiography($) {
  const bioElements = $('.biography, .bio, [class*="bio"]');
  return bioElements.map((i, el) => $(el).text().trim()).get().join(' ').substring(0, 500);
}

// Collect all Texas legislators
async function collectTexasLegislators() {
  log('Starting Texas legislators data collection...');
  
  const allLegislators = [];
  
  try {
    // Collect House Representatives (Districts 1-150)
    log('Collecting Texas House Representatives...');
    for (let district = 1; district <= 150; district++) {
      const url = `${HOUSE_URL}/${district}`;
      const legislator = await scrapeLegislatorDetails(url, 'House');
      
      if (legislator && legislator.name && legislator.name !== '') {
        allLegislators.push(legislator);
        log(`✓ Collected House District ${district}: ${legislator.name}`);
      } else {
        log(`⚠ No data found for House District ${district}`);
      }
      
      await delay(DELAY_MS); // Be respectful to the server
    }
    
    // Collect Senate Members (Districts 1-31)
    log('Collecting Texas Senate Members...');
    for (let district = 1; district <= 31; district++) {
      const url = `${SENATE_URL}/${district}`;
      const legislator = await scrapeLegislatorDetails(url, 'Senate');
      
      if (legislator && legislator.name && legislator.name !== '') {
        allLegislators.push(legislator);
        log(`✓ Collected Senate District ${district}: ${legislator.name}`);
      } else {
        log(`⚠ No data found for Senate District ${district}`);
      }
      
      await delay(DELAY_MS); // Be respectful to the server
    }
    
    // Save collected data
    const outputFile = path.join(OUTPUT_DIR, 'texas-legislators.json');
    fs.writeFileSync(outputFile, JSON.stringify({
      collectedAt: new Date().toISOString(),
      source: 'capitol.texas.gov',
      totalCount: allLegislators.length,
      legislators: allLegislators
    }, null, 2));
    
    log(`✅ Collection complete! Saved ${allLegislators.length} legislators to ${outputFile}`);
    
    // Create summary report
    const summaryFile = path.join(OUTPUT_DIR, 'collection-summary.txt');
    const summary = `
Texas Legislators Data Collection Summary
========================================
Collection Date: ${new Date().toISOString()}
Source: capitol.texas.gov
Total Legislators: ${allLegislators.length}

Breakdown:
- House Representatives: ${allLegislators.filter(l => l.chamber === 'House').length}
- Senate Members: ${allLegislators.filter(l => l.chamber === 'Senate').length}

Party Distribution:
- Republicans: ${allLegislators.filter(l => l.party === 'Republican').length}
- Democrats: ${allLegislators.filter(l => l.party === 'Democrat').length}
- Unknown: ${allLegislators.filter(l => l.party === 'Unknown').length}

Data Quality:
- With Email: ${allLegislators.filter(l => l.email).length}
- With Phone: ${allLegislators.filter(l => l.phone).length}
- With Photo: ${allLegislators.filter(l => l.imageUrl).length}
- With Committees: ${allLegislators.filter(l => l.committees.length > 0).length}
    `;
    
    fs.writeFileSync(summaryFile, summary);
    log(`📊 Summary report saved to ${summaryFile}`);
    
    return allLegislators;
    
  } catch (error) {
    log(`❌ Collection failed: ${error.message}`);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  collectTexasLegislators()
    .then(() => {
      log('🎉 Local data collection completed successfully!');
      log('Next steps:');
      log('1. Review the collected data in the ./collected-data/ folder');
      log('2. Upload the data to your Act Up platform using the upload script');
      log('3. Set up scheduled collection to run this daily');
    })
    .catch(error => {
      log(`💥 Collection failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { collectTexasLegislators };