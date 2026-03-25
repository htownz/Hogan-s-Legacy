const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'https://v3.openstates.org';

console.log('🏛️ COMPREHENSIVE TEXAS LEGISLATOR & COMMITTEE DATA COLLECTOR');
console.log('📊 Collecting authentic data from OpenStates API...');

async function collectTexasLegislativeData() {
  const allData = {
    collectedAt: new Date().toISOString(),
    source: 'openstates-comprehensive-collection',
    jurisdiction: 'Texas',
    legislators: [],
    committees: [],
    bills: [],
    events: [],
    statistics: { 
      legislatorsCollected: 0, 
      committeesCollected: 0, 
      billsCollected: 0,
      eventsCollected: 0
    }
  };
  
  try {
    console.log('🗝️ Using OpenStates API key from environment...');
    const API_KEY = process.env.OPENSTATES_API_KEY;
    
    if (!API_KEY) {
      console.log('❌ OpenStates API key not found!');
      console.log('🔧 Please set OPENSTATES_API_KEY environment variable');
      console.log('💡 Get your key from: https://openstates.org/account/profile/');
      return;
    }
    
    const headers = {
      'X-API-KEY': API_KEY,
      'Accept': 'application/json'
    };
    
    console.log('🏛️ Step 1: Collecting Texas Legislators...');
    
    // Collect all Texas legislators
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`📋 Fetching legislators page ${page}...`);
        
        const response = await axios.get(`${BASE_URL}/people`, {
          headers,
          params: {
            jurisdiction: 'texas',
            org_classification: 'legislature',
            page: page,
            per_page: 100,
            include: 'other_names,other_identifiers,links,sources,offices'
          },
          timeout: 30000
        });
        
        const data = response.data;
        
        if (data.results && data.results.length > 0) {
          data.results.forEach(legislator => {
            allData.legislators.push({
              id: legislator.id,
              name: legislator.name,
              party: legislator.party,
              chamber: legislator.current_role?.org_classification === 'upper' ? 'Senate' : 'House',
              district: legislator.current_role?.district,
              title: legislator.current_role?.title,
              email: legislator.email,
              image: legislator.image,
              gender: legislator.gender,
              birthDate: legislator.birth_date,
              offices: legislator.offices || [],
              links: legislator.links || [],
              otherNames: legislator.other_names || [],
              collectedAt: new Date().toISOString()
            });
            allData.statistics.legislatorsCollected++;
          });
          
          console.log(`✅ Collected ${data.results.length} legislators from page ${page}`);
          console.log(`📊 Total legislators: ${allData.statistics.legislatorsCollected}`);
          
          // Check if there are more pages
          if (data.pagination && page < data.pagination.max_page) {
            page++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
      } catch (pageError) {
        console.log(`⚠️ Error fetching page ${page}:`, pageError.message);
        hasMore = false;
      }
    }
    
    console.log('\n🏛️ Step 2: Collecting Texas Committees...');
    
    // Collect committees
    try {
      const committeesResponse = await axios.get(`${BASE_URL}/committees`, {
        headers,
        params: {
          jurisdiction: 'texas',
          per_page: 100
        },
        timeout: 30000
      });
      
      if (committeesResponse.data.results) {
        committeesResponse.data.results.forEach(committee => {
          allData.committees.push({
            id: committee.id,
            name: committee.name,
            classification: committee.classification,
            chamber: committee.chamber,
            parent: committee.parent,
            jurisdiction: committee.jurisdiction,
            collectedAt: new Date().toISOString()
          });
          allData.statistics.committeesCollected++;
        });
        
        console.log(`✅ Collected ${allData.statistics.committeesCollected} committees`);
      }
      
    } catch (committeeError) {
      console.log('⚠️ Error collecting committees:', committeeError.message);
    }
    
    console.log('\n📋 Step 3: Collecting Recent Texas Bills (Sample)...');
    
    // Collect recent bills for enhanced data
    try {
      const billsResponse = await axios.get(`${BASE_URL}/bills`, {
        headers,
        params: {
          jurisdiction: 'texas',
          per_page: 100,
          include: 'sponsorships,actions,votes'
        },
        timeout: 30000
      });
      
      if (billsResponse.data.results) {
        billsResponse.data.results.forEach(bill => {
          allData.bills.push({
            id: bill.id,
            identifier: bill.identifier,
            title: bill.title,
            classification: bill.classification,
            subject: bill.subject,
            session: bill.session,
            latestActionDate: bill.latest_action_date,
            latestActionDescription: bill.latest_action_description,
            sponsorships: bill.sponsorships || [],
            actions: bill.actions || [],
            votes: bill.votes || [],
            collectedAt: new Date().toISOString()
          });
          allData.statistics.billsCollected++;
        });
        
        console.log(`✅ Collected ${allData.statistics.billsCollected} bills`);
      }
      
    } catch (billError) {
      console.log('⚠️ Error collecting bills:', billError.message);
    }
    
    console.log('\n📅 Step 4: Collecting Texas Legislative Events...');
    
    // Collect events
    try {
      const eventsResponse = await axios.get(`${BASE_URL}/events`, {
        headers,
        params: {
          jurisdiction: 'texas',
          per_page: 100
        },
        timeout: 30000
      });
      
      if (eventsResponse.data.results) {
        eventsResponse.data.results.forEach(event => {
          allData.events.push({
            id: event.id,
            name: event.name,
            description: event.description,
            startDate: event.start_date,
            endDate: event.end_date,
            location: event.location,
            status: event.status,
            classification: event.classification,
            collectedAt: new Date().toISOString()
          });
          allData.statistics.eventsCollected++;
        });
        
        console.log(`✅ Collected ${allData.statistics.eventsCollected} events`);
      }
      
    } catch (eventError) {
      console.log('⚠️ Error collecting events:', eventError.message);
    }
    
    // Save comprehensive data
    const filename = `texas-openstates-comprehensive-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    console.log('\n🎉 COMPREHENSIVE TEXAS LEGISLATIVE DATA COLLECTION COMPLETE!');
    console.log(`👥 Legislators: ${allData.statistics.legislatorsCollected}`);
    console.log(`🏛️ Committees: ${allData.statistics.committeesCollected}`);
    console.log(`📋 Bills: ${allData.statistics.billsCollected}`);
    console.log(`📅 Events: ${allData.statistics.eventsCollected}`);
    console.log(`📁 Saved to: ${filename}`);
    
    console.log('\n✅ This authentic OpenStates data will enhance your Scout bots and AI analysis!');
    console.log('🤖 Legislators data for voting pattern analysis');
    console.log('🏛️ Committee data for legislative process intelligence');
    console.log('📋 Bills data for cross-reference with LegiScan collection');
    console.log('📅 Events data for legislative calendar features');
    
    return allData;
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    if (error.response) {
      console.log('📡 API Response Status:', error.response.status);
      if (error.response.status === 403) {
        console.log('🔑 API Key issue - check your OpenStates API key');
      }
    }
  }
}

collectTexasLegislativeData();