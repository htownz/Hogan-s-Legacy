const axios = require('axios');
const fs = require('fs');

// OpenStates API configuration
const API_KEY = 'c236a534-4767-4568-8773-ac5c58ed99a2';
const BASE_URL = 'https://v3.openstates.org';

console.log('🚀 Collecting authentic Texas legislative data from OpenStates...');

async function collectTexasLegislators() {
  const legislators = [];
  
  try {
    console.log('📊 Fetching Texas legislators from OpenStates API...');
    
    const response = await axios.get(`${BASE_URL}/people`, {
      headers: {
        'X-API-KEY': API_KEY,
        'Accept': 'application/json'
      },
      params: {
        jurisdiction: 'tx',  // Texas
        per_page: 100
      },
      timeout: 30000
    });
    
    console.log(`📥 Received ${response.data.results.length} legislators from OpenStates`);
    
    for (const person of response.data.results) {
      const legislator = {
        name: person.name,
        fullName: person.name,
        chamber: person.current_role?.org_classification || 'Unknown',
        district: person.current_role?.district || 'Unknown',
        party: person.party?.[0]?.name || 'Unknown',
        email: person.email || '',
        phone: person.extras?.office_phone || '',
        imageUrl: person.image || null,
        biography: person.biography || '',
        website: person.extras?.website || '',
        address: person.extras?.address || '',
        committees: [],
        bills: [],
        socialMedia: {},
        officeLocation: person.extras?.office || '',
        staffMembers: [],
        termStart: person.current_role?.start_date || null,
        termEnd: person.current_role?.end_date || null,
        previousOffices: [],
        education: null,
        profession: null,
        gender: null,
        collectedAt: new Date().toISOString(),
        source: 'openstates-api'
      };
      
      legislators.push(legislator);
      console.log(`✅ ${legislator.chamber}: ${legislator.name} (${legislator.party}) - ${legislator.district}`);
    }
    
    // Save authentic data
    const data = {
      collectedAt: new Date().toISOString(),
      source: 'openstates-api',
      totalCount: legislators.length,
      legislators: legislators
    };
    
    fs.writeFileSync('authentic-texas-legislators-openstates.json', JSON.stringify(data, null, 2));
    console.log(`🎉 Successfully collected ${legislators.length} authentic Texas legislators!`);
    console.log(`📁 Data saved to: authentic-texas-legislators-openstates.json`);
    
    // Create summary
    const houseCount = legislators.filter(l => l.chamber.toLowerCase().includes('house') || l.chamber === 'lower').length;
    const senateCount = legislators.filter(l => l.chamber.toLowerCase().includes('senate') || l.chamber === 'upper').length;
    const republicanCount = legislators.filter(l => l.party === 'Republican').length;
    const democratCount = legislators.filter(l => l.party === 'Democratic').length;
    
    console.log(`\n📊 Summary of authentic Texas legislative data:`);
    console.log(`   House Representatives: ${houseCount}`);
    console.log(`   Senate Members: ${senateCount}`);
    console.log(`   Republicans: ${republicanCount}`);
    console.log(`   Democrats: ${democratCount}`);
    console.log(`   With Email: ${legislators.filter(l => l.email).length}`);
    console.log(`   With Phone: ${legislators.filter(l => l.phone).length}`);
    
    return data;
    
  } catch (error) {
    console.log(`💥 Error collecting from OpenStates: ${error.message}`);
    if (error.response) {
      console.log('API Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

collectTexasLegislators().catch(console.error);