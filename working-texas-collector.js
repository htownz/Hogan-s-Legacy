const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

console.log('🚀 Collecting authentic Texas legislators from known active districts...');

async function collectLegislators() {
  const legislators = [];
  const BASE_URL = 'https://capitol.texas.gov';

  // Known active House districts (sampling from different regions)
  const activeHouseDistricts = [15, 21, 35, 46, 51, 62, 73, 84, 95, 108, 126, 134, 142, 148];
  
  console.log('📊 Collecting from known active House districts...');
  for (const district of activeHouseDistricts) {
    try {
      const url = `${BASE_URL}/Members/en/District/${district}`;
      console.log(`Checking House District ${district}...`);
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const name = $('h1').first().text().trim();
      const party = extractParty($);
      const email = extractEmail($);
      
      if (name && name.length > 2 && !name.includes('Error')) {
        legislators.push({
          chamber: 'House',
          name: name,
          district: `District ${district}`,
          party: party,
          email: email,
          collectedAt: new Date().toISOString(),
          source: 'capitol.texas.gov'
        });
        console.log(`✅ House District ${district}: ${name} (${party})`);
      } else {
        console.log(`⚠️ House District ${district}: Page exists but no valid data`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Respectful delay
    } catch (error) {
      console.log(`❌ House District ${district}: ${error.response?.status || 'Connection error'}`);
    }
  }

  // Known active Senate districts
  const activeSenateDistricts = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
  
  console.log('📊 Collecting from Senate districts...');
  for (const district of activeSenateDistricts) {
    try {
      const url = `${BASE_URL}/Members/en/senate/District/${district}`;
      console.log(`Checking Senate District ${district}...`);
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const name = $('h1').first().text().trim();
      const party = extractParty($);
      const email = extractEmail($);
      
      if (name && name.length > 2 && !name.includes('Error')) {
        legislators.push({
          chamber: 'Senate',
          name: name,
          district: `District ${district}`,
          party: party,
          email: email,
          collectedAt: new Date().toISOString(),
          source: 'capitol.texas.gov'
        });
        console.log(`✅ Senate District ${district}: ${name} (${party})`);
      } else {
        console.log(`⚠️ Senate District ${district}: Page exists but no valid data`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Respectful delay
    } catch (error) {
      console.log(`❌ Senate District ${district}: ${error.response?.status || 'Connection error'}`);
    }
  }

  // Save authentic data
  const data = {
    collectedAt: new Date().toISOString(),
    source: 'capitol.texas.gov',
    totalCount: legislators.length,
    legislators: legislators
  };
  
  fs.writeFileSync('authentic-texas-legislators.json', JSON.stringify(data, null, 2));
  console.log(`🎉 Successfully collected ${legislators.length} authentic Texas legislators!`);
  console.log(`📁 Data saved to: authentic-texas-legislators.json`);
  
  if (legislators.length > 0) {
    console.log(`\n📊 Sample of collected data:`);
    console.log(`First legislator: ${legislators[0].name} - ${legislators[0].chamber} ${legislators[0].district}`);
  }
  
  return data;
}

function extractParty($) {
  const partyText = $('body').text();
  if (partyText.includes('Republican') || partyText.includes('(R)')) return 'Republican';
  if (partyText.includes('Democrat') || partyText.includes('(D)')) return 'Democrat';
  return 'Unknown';
}

function extractEmail($) {
  const emailLink = $('a[href^="mailto:"]').first();
  return emailLink.length ? emailLink.attr('href').replace('mailto:', '') : '';
}

collectLegislators().catch(console.error);