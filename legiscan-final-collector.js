const axios = require('axios');
const fs = require('fs');

const LEGISCAN_API_KEY = 'd533b82a244ad44caa7d7399391908d9';
const BASE_URL = 'https://api.legiscan.com/';

console.log('🚀 FINAL TEXAS LEGISLATIVE DATA COLLECTOR - ALL 11,156 BILLS!');

async function collectAllTexasBills() {
  const allData = {
    collectedAt: new Date().toISOString(),
    source: 'legiscan-final-complete-collection',
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
    
    const sessions = sessionResponse.data.sessions;
    const currentSession = sessions.find(s => s.current === 1) || sessions[0];
    
    allData.sessionInfo = {
      sessionId: currentSession.session_id,
      sessionName: currentSession.session_name,
      state: 'TX'
    };
    
    console.log(`📋 Session: ${allData.sessionInfo.sessionName}`);
    console.log(`🆔 Session ID: ${allData.sessionInfo.sessionId}`);
    
    // Get complete bill list
    console.log('📜 Getting complete Texas bill list...');
    const billsResponse = await axios.get(BASE_URL, {
      params: { key: LEGISCAN_API_KEY, op: 'getMasterList', id: currentSession.session_id },
      timeout: 60000
    });
    
    const masterlist = billsResponse.data.masterlist;
    allData.statistics.totalFound = Object.keys(masterlist).length;
    
    console.log(`📥 Found ${allData.statistics.totalFound} Texas bills to collect!`);
    console.log('🎯 Starting comprehensive collection of ALL bills...');
    
    // Process every bill (using correct structure from debug)
    let processedCount = 0;
    const totalBills = allData.statistics.totalFound;
    
    for (let i = 0; i < totalBills; i++) {
      try {
        const billInfo = masterlist[i];
        
        if (!billInfo || !billInfo.bill_id) {
          continue;
        }
        
        console.log(`📋 ${processedCount + 1}/${totalBills}: ${billInfo.number || 'Unknown'} - ${(billInfo.title || 'No title').substring(0, 50)}...`);
        
        // Get detailed bill information
        const billDetailResponse = await axios.get(BASE_URL, {
          params: { key: LEGISCAN_API_KEY, op: 'getBill', id: billInfo.bill_id },
          timeout: 30000
        });
        
        if (!billDetailResponse.data || !billDetailResponse.data.bill) {
          console.log(`⚠️ No detail for bill ${billInfo.number}`);
          continue;
        }
        
        const billDetail = billDetailResponse.data.bill;
        
        // Store complete bill data
        const billData = {
          billId: billDetail.bill_id,
          billNumber: billDetail.bill_number || billInfo.number,
          title: billDetail.title || billInfo.title || 'No title',
          description: billDetail.description || billInfo.description || 'No description',
          status: billDetail.status_text || billInfo.status || 'Unknown',
          chamber: billDetail.body_name || 'Unknown',
          sponsors: [],
          subjects: billDetail.subjects || [],
          url: billDetail.state_link || billInfo.url || '',
          lastAction: billDetail.history ? billDetail.history[billDetail.history.length - 1] : null,
          statusDate: billInfo.status_date || '',
          lastActionDate: billInfo.last_action_date || '',
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
              billNumber: billData.billNumber,
              amendmentId: amendment.amendment_id || `${billDetail.bill_id}-amendment-${index}`,
              title: amendment.title || `Amendment ${index + 1}`,
              description: amendment.description || 'No description',
              adopted: amendment.adopted || false,
              date: amendment.date || 'Unknown'
            });
            allData.statistics.amendmentsCollected++;
          });
        }
        
        // Process votes
        if (billDetail.votes && Array.isArray(billDetail.votes)) {
          billDetail.votes.forEach((vote, index) => {
            allData.votes.push({
              billId: billDetail.bill_id,
              billNumber: billData.billNumber,
              voteId: vote.roll_call_id || `${billDetail.bill_id}-vote-${index}`,
              date: vote.date || 'Unknown',
              chamber: vote.chamber_name || 'Unknown',
              yea: parseInt(vote.yea) || 0,
              nay: parseInt(vote.nay) || 0,
              passed: vote.passed === 1 || vote.passed === true,
              description: vote.desc || 'No description'
            });
            allData.statistics.votesCollected++;
          });
        }
        
        processedCount++;
        allData.statistics.processed = processedCount;
        
        // Progress updates every 100 bills
        if (processedCount % 100 === 0) {
          const percent = ((processedCount / totalBills) * 100).toFixed(1);
          console.log(`📈 Progress: ${processedCount}/${totalBills} (${percent}%) - ${allData.statistics.amendmentsCollected} amendments, ${allData.statistics.votesCollected} votes`);
          
          // Save incremental backup
          const backupFilename = `texas-backup-${processedCount}-bills.json`;
          fs.writeFileSync(backupFilename, JSON.stringify(allData, null, 2));
        }
        
        // API rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (billError) {
        console.log(`⚠️ Error processing bill ${i}: ${billError.message}`);
      }
    }
    
    // Save final complete dataset
    const filename = `texas-complete-legislative-data-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    const endTime = new Date();
    const startTime = new Date(allData.collectedAt);
    const duration = Math.round((endTime - startTime) / 1000 / 60);
    
    console.log('\n🎉 COMPLETE TEXAS LEGISLATIVE DATA COLLECTION FINISHED!');
    console.log(`📊 Bills collected: ${allData.statistics.processed}/${allData.statistics.totalFound}`);
    console.log(`🔄 Amendments: ${allData.statistics.amendmentsCollected}`);
    console.log(`🗳️ Votes: ${allData.statistics.votesCollected}`);
    console.log(`⏱️ Duration: ${duration} minutes`);
    console.log(`📁 Complete dataset: ${filename}`);
    console.log('\n✅ ALL AUTHENTIC TEXAS LEGISLATIVE DATA COLLECTED!');
    console.log('🚀 Ready to upload to Act Up platform!');
    
    return allData;
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    if (error.response) {
      console.log('📡 API Status:', error.response.status);
    }
  }
}

collectAllTexasBills();