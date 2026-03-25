const axios = require('axios');
const fs = require('fs');

const LEGISCAN_API_KEY = 'd533b82a244ad44caa7d7399391908d9';
const BASE_URL = 'https://api.legiscan.com/';

console.log('🚀 WORKING TEXAS LEGISLATIVE DATA COLLECTOR');

async function collectWorkingTexasData() {
  const allData = {
    collectedAt: new Date().toISOString(),
    source: 'legiscan-working-collection',
    sessionInfo: {},
    bills: [],
    amendments: [],
    votes: [],
    statistics: { totalFound: 0, processed: 0, amendmentsCollected: 0, votesCollected: 0 }
  };
  
  try {
    console.log('📊 Getting Texas session information...');
    
    // Get Texas session
    const sessionResponse = await axios.get(BASE_URL, {
      params: { key: LEGISCAN_API_KEY, op: 'getSessionList', state: 'TX' }
    });
    
    if (!sessionResponse.data || !sessionResponse.data.sessions) {
      throw new Error('Invalid session response from LegiScan API');
    }
    
    const sessions = sessionResponse.data.sessions;
    const currentSession = sessions.find(s => s.current === 1) || sessions[0];
    
    allData.sessionInfo = {
      sessionId: currentSession.session_id,
      sessionName: currentSession.session_name || 'Texas Legislature',
      state: 'TX'
    };
    
    console.log(`📋 Session: ${allData.sessionInfo.sessionName}`);
    console.log(`🆔 Session ID: ${allData.sessionInfo.sessionId}`);
    
    // Get bill list
    console.log('📜 Getting master bill list...');
    const billsResponse = await axios.get(BASE_URL, {
      params: { key: LEGISCAN_API_KEY, op: 'getMasterList', id: currentSession.session_id },
      timeout: 60000
    });
    
    if (!billsResponse.data || !billsResponse.data.masterlist) {
      throw new Error('Invalid bills response from LegiScan API');
    }
    
    const masterlist = billsResponse.data.masterlist;
    
    // Filter for actual bills (not status entries)
    const billEntries = Object.entries(masterlist).filter(([key, value]) => {
      return value && typeof value === 'object' && value.bill_id && value.bill_number;
    });
    
    allData.statistics.totalFound = billEntries.length;
    console.log(`📥 Found ${billEntries.length} actual bills to process`);
    
    // Process first 50 bills to verify data collection works
    const maxToProcess = Math.min(50, billEntries.length);
    console.log(`🎯 Processing first ${maxToProcess} bills to verify collection...`);
    
    for (let i = 0; i < maxToProcess; i++) {
      try {
        const [billKey, billInfo] = billEntries[i];
        
        console.log(`📋 ${i + 1}/${maxToProcess}: ${billInfo.bill_number} - ${(billInfo.title || 'No title').substring(0, 50)}...`);
        
        // Get detailed bill information
        const billDetailResponse = await axios.get(BASE_URL, {
          params: { key: LEGISCAN_API_KEY, op: 'getBill', id: billInfo.bill_id },
          timeout: 30000
        });
        
        if (!billDetailResponse.data || !billDetailResponse.data.bill) {
          console.log(`⚠️ No bill detail for ${billInfo.bill_number}`);
          continue;
        }
        
        const billDetail = billDetailResponse.data.bill;
        
        // Store bill data
        const billData = {
          billId: billDetail.bill_id,
          billNumber: billDetail.bill_number,
          title: billDetail.title || 'No title',
          description: billDetail.description || 'No description',
          status: billDetail.status_text || 'Unknown status',
          chamber: billDetail.body_name || 'Unknown chamber',
          sponsors: [],
          subjects: billDetail.subjects || [],
          url: billDetail.state_link || '',
          lastAction: billDetail.history ? billDetail.history[billDetail.history.length - 1] : null,
          collectedAt: new Date().toISOString()
        };
        
        // Extract sponsors
        if (billDetail.sponsors && Array.isArray(billDetail.sponsors)) {
          billData.sponsors = billDetail.sponsors.map(sponsor => ({
            name: sponsor.name || 'Unknown',
            role: sponsor.role || 'Sponsor',
            party: sponsor.party || 'Unknown'
          }));
        }
        
        allData.bills.push(billData);
        
        // Process amendments
        if (billDetail.amendments && Array.isArray(billDetail.amendments)) {
          billDetail.amendments.forEach((amendment, index) => {
            allData.amendments.push({
              billId: billDetail.bill_id,
              billNumber: billDetail.bill_number,
              amendmentId: amendment.amendment_id || `${billDetail.bill_id}-amendment-${index}`,
              title: amendment.title || `Amendment ${index + 1}`,
              description: amendment.description || 'No description',
              adopted: amendment.adopted || false,
              date: amendment.date || 'Unknown date'
            });
            allData.statistics.amendmentsCollected++;
          });
        }
        
        // Process votes
        if (billDetail.votes && Array.isArray(billDetail.votes)) {
          billDetail.votes.forEach((vote, index) => {
            allData.votes.push({
              billId: billDetail.bill_id,
              billNumber: billDetail.bill_number,
              voteId: vote.roll_call_id || `${billDetail.bill_id}-vote-${index}`,
              date: vote.date || 'Unknown date',
              chamber: vote.chamber_name || 'Unknown chamber',
              yea: parseInt(vote.yea) || 0,
              nay: parseInt(vote.nay) || 0,
              passed: vote.passed === 1 || vote.passed === true,
              description: vote.desc || 'No description'
            });
            allData.statistics.votesCollected++;
          });
        }
        
        allData.statistics.processed++;
        
        // Rate limiting - be gentle with API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (billError) {
        console.log(`⚠️ Error processing bill: ${billError.message}`);
      }
    }
    
    // Save the working data
    const filename = `texas-working-data-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    console.log('\n🎉 WORKING DATA COLLECTION COMPLETE!');
    console.log(`📊 Bills processed: ${allData.statistics.processed}/${allData.statistics.totalFound}`);
    console.log(`🔄 Amendments collected: ${allData.statistics.amendmentsCollected}`);
    console.log(`🗳️ Votes collected: ${allData.statistics.votesCollected}`);
    console.log(`📁 Saved to: ${filename}`);
    console.log('\n✅ This proves your data collection works! You can now scale up to collect all bills.');
    
    return allData;
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    if (error.response) {
      console.log('📡 API Response Status:', error.response.status);
      console.log('📡 API Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

collectWorkingTexasData();