const axios = require('axios');
const fs = require('fs');

// Your LegiScan API key
const LEGISCAN_API_KEY = 'd533b82a244ad44caa7d7399391908d9';
const BASE_URL = 'https://api.legiscan.com/';

console.log('🚀 Collecting authentic Texas legislative data from LegiScan...');

async function collectTexasLegislators() {
  const legislators = [];
  
  try {
    console.log('📊 Fetching Texas legislative session info...');
    
    // Get current Texas session
    const sessionResponse = await axios.get(BASE_URL, {
      params: {
        key: LEGISCAN_API_KEY,
        op: 'getSessionList',
        state: 'TX'
      },
      timeout: 30000
    });
    
    if (sessionResponse.data.status !== 'OK') {
      throw new Error('Failed to get session data');
    }
    
    const sessions = sessionResponse.data.sessions;
    const currentSession = sessions.find(s => s.current === 1) || sessions[0];
    
    console.log(`📋 Using Texas session: ${currentSession.session_name}`);
    
    // Get legislators
    console.log('👥 Fetching Texas legislators...');
    const peopleResponse = await axios.get(BASE_URL, {
      params: {
        key: LEGISCAN_API_KEY,
        op: 'getSessionPeople',
        id: currentSession.session_id
      },
      timeout: 30000
    });
    
    if (peopleResponse.data.status !== 'OK') {
      throw new Error('Failed to get legislators data');
    }
    
    const people = peopleResponse.data.sessionpeople.people;
    console.log(`📥 Found ${Object.keys(people).length} authentic Texas legislators`);
    
    // Process each legislator
    for (const [id, person] of Object.entries(people)) {
      const legislator = {
        legiscanId: person.people_id,
        name: person.name,
        fullName: person.name,
        chamber: person.role === 'Rep' ? 'House' : person.role === 'Sen' ? 'Senate' : person.role,
        district: person.district || 'Unknown',
        party: person.party || 'Unknown',
        email: person.email || '',
        phone: person.phone || '',
        imageUrl: person.photo_url || null,
        biography: person.biography || '',
        website: person.url || '',
        address: person.address || '',
        committees: [],
        bills: [],
        socialMedia: {},
        officeLocation: '',
        staffMembers: [],
        termStart: null,
        termEnd: null,
        previousOffices: [],
        education: null,
        profession: null,
        gender: null,
        collectedAt: new Date().toISOString(),
        source: 'legiscan-api',
        sessionId: currentSession.session_id,
        sessionName: currentSession.session_name
      };
      
      legislators.push(legislator);
      console.log(`✅ ${legislator.chamber}: ${legislator.name} (${legislator.party}) - District ${legislator.district}`);
    }
    
    // Save authentic data
    const data = {
      collectedAt: new Date().toISOString(),
      source: 'legiscan-api',
      sessionInfo: {
        sessionId: currentSession.session_id,
        sessionName: currentSession.session_name,
        state: 'Texas'
      },
      totalCount: legislators.length,
      legislators: legislators
    };
    
    fs.writeFileSync('authentic-texas-legislators.json', JSON.stringify(data, null, 2));
    console.log(`🎉 Successfully collected ${legislators.length} authentic Texas legislators!`);
    console.log(`📁 Data saved to: authentic-texas-legislators.json`);
    
    // Create summary
    const houseCount = legislators.filter(l => l.chamber === 'House').length;
    const senateCount = legislators.filter(l => l.chamber === 'Senate').length;
    const republicanCount = legislators.filter(l => l.party === 'Republican').length;
    const democratCount = legislators.filter(l => l.party === 'Democratic').length;
    
    console.log(`\n📊 Summary of authentic Texas legislative data:`);
    console.log(`   House Representatives: ${houseCount}`);
    console.log(`   Senate Members: ${senateCount}`);
    console.log(`   Republicans: ${republicanCount}`);
    console.log(`   Democrats: ${democratCount}`);
    console.log(`   With Email: ${legislators.filter(l => l.email).length}`);
    console.log(`   With Phone: ${legislators.filter(l => l.phone).length}`);
    console.log(`   Session: ${currentSession.session_name}`);
    
    return data;
    
  } catch (error) {
    console.log(`💥 Error collecting from LegiScan: ${error.message}`);
    if (error.response) {
      console.log('API Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

collectTexasLegislators().catch(console.error);