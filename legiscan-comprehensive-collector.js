const axios = require('axios');
const fs = require('fs');

// Your working LegiScan API key
const LEGISCAN_API_KEY = 'd533b82a244ad44caa7d7399391908d9';
const BASE_URL = 'https://api.legiscan.com/';

console.log('🚀 Collecting comprehensive Texas legislative data from LegiScan...');

async function collectComprehensiveTexasData() {
  const allData = {
    collectedAt: new Date().toISOString(),
    source: 'legiscan-api-comprehensive',
    sessionInfo: {},
    bills: [],
    amendments: [],
    committees: [],
    hearings: [],
    documents: [],
    votes: []
  };
  
  try {
    console.log('📊 Step 1: Getting Texas session information...');
    
    // Get current Texas session
    const sessionResponse = await axios.get(BASE_URL, {
      params: {
        key: LEGISCAN_API_KEY,
        op: 'getSessionList',
        state: 'TX'
      },
      timeout: 30000
    });
    
    const sessions = sessionResponse.data.sessions;
    const currentSession = sessions.find(s => s.current === 1) || sessions[0];
    allData.sessionInfo = currentSession;
    
    console.log(`📋 Using session: ${currentSession.session_name}`);
    
    // Step 2: Get all bills in the session
    console.log('📜 Step 2: Collecting all Texas bills...');
    const billsResponse = await axios.get(BASE_URL, {
      params: {
        key: LEGISCAN_API_KEY,
        op: 'getMasterList',
        id: currentSession.session_id
      },
      timeout: 60000
    });
    
    const billsList = billsResponse.data.masterlist;
    console.log(`📥 Found ${Object.keys(billsList).length} bills in Texas legislature`);
    
    // Process first 20 bills to avoid API limits
    const billKeys = Object.keys(billsList).slice(0, 20);
    
    for (const billKey of billKeys) {
      try {
        const billInfo = billsList[billKey];
        console.log(`📋 Processing: ${billInfo.bill_number} - ${billInfo.title?.substring(0, 50)}...`);
        
        // Get detailed bill information
        const billDetailResponse = await axios.get(BASE_URL, {
          params: {
            key: LEGISCAN_API_KEY,
            op: 'getBill',
            id: billInfo.bill_id
          },
          timeout: 30000
        });
        
        const billDetail = billDetailResponse.data.bill;
        
        // Structure the bill data
        const structuredBill = {
          billId: billDetail.bill_id,
          billNumber: billDetail.bill_number,
          title: billDetail.title,
          description: billDetail.description,
          status: billDetail.status,
          statusDate: billDetail.status_date,
          chamber: billDetail.body,
          authors: billDetail.authors || [],
          sponsors: billDetail.sponsors || [],
          subjects: billDetail.subjects || [],
          history: billDetail.history || [],
          texts: billDetail.texts || [],
          amendments: billDetail.amendments || [],
          votes: billDetail.votes || [],
          committee: billDetail.committee || null,
          url: billDetail.url,
          createdAt: billDetail.created,
          updatedAt: billDetail.updated,
          collectedAt: new Date().toISOString()
        };
        
        allData.bills.push(structuredBill);
        
        // Collect amendments for this bill
        if (billDetail.amendments && billDetail.amendments.length > 0) {
          billDetail.amendments.forEach(amendment => {
            allData.amendments.push({
              billId: billDetail.bill_id,
              billNumber: billDetail.bill_number,
              amendmentId: amendment.amendment_id,
              title: amendment.title,
              description: amendment.description,
              adopted: amendment.adopted,
              date: amendment.date,
              collectedAt: new Date().toISOString()
            });
          });
        }
        
        // Collect votes for this bill
        if (billDetail.votes && billDetail.votes.length > 0) {
          billDetail.votes.forEach(vote => {
            allData.votes.push({
              billId: billDetail.bill_id,
              billNumber: billDetail.bill_number,
              voteId: vote.roll_call_id,
              date: vote.date,
              chamber: vote.chamber,
              yea: vote.yea,
              nay: vote.nay,
              absent: vote.absent,
              total: vote.total,
              passed: vote.passed,
              description: vote.desc,
              collectedAt: new Date().toISOString()
            });
          });
        }
        
        // Small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (billError) {
        console.log(`⚠️ Error processing bill ${billKey}: ${billError.message}`);
      }
    }
    
    // Save comprehensive data
    fs.writeFileSync('texas-comprehensive-legislative-data.json', JSON.stringify(allData, null, 2));
    
    console.log('\n🎉 Comprehensive Texas legislative data collection complete!');
    console.log(`📊 Summary:`);
    console.log(`   Bills: ${allData.bills.length}`);
    console.log(`   Amendments: ${allData.amendments.length}`);
    console.log(`   Votes: ${allData.votes.length}`);
    console.log(`   Session: ${currentSession.session_name}`);
    console.log(`📁 Data saved to: texas-comprehensive-legislative-data.json`);
    
    return allData;
    
  } catch (error) {
    console.log(`💥 Error in comprehensive collection: ${error.message}`);
    if (error.response) {
      console.log('API Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

collectComprehensiveTexasData().catch(console.error);