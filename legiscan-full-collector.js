const axios = require('axios');
const fs = require('fs');

// Your working LegiScan API key
const LEGISCAN_API_KEY = 'd533b82a244ad44caa7d7399391908d9';
const BASE_URL = 'https://api.legiscan.com/';

console.log('🚀 FULL TEXAS LEGISLATIVE DATA COLLECTION - Getting ALL 11,156+ Bills!');

async function collectAllTexasLegislativeData() {
  const startTime = new Date();
  const allData = {
    collectedAt: startTime.toISOString(),
    source: 'legiscan-api-full-collection',
    sessionInfo: {},
    bills: [],
    amendments: [],
    votes: [],
    committees: [],
    sponsors: [],
    subjects: [],
    statistics: {
      totalBillsFound: 0,
      billsProcessed: 0,
      amendmentsCollected: 0,
      votesCollected: 0,
      authorsCollected: 0
    }
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
    allData.sessionInfo = {
      sessionId: currentSession.session_id,
      sessionName: currentSession.session_name || `Session ${currentSession.session_id}`,
      yearStart: currentSession.year_start,
      yearEnd: currentSession.year_end,
      state: 'TX'
    };
    
    console.log(`📋 Session: ${allData.sessionInfo.sessionName}`);
    console.log(`🗓️ Year: ${allData.sessionInfo.yearStart}-${allData.sessionInfo.yearEnd}`);
    
    // Step 2: Get ALL bills in the session
    console.log('📜 Step 2: Getting master list of ALL Texas bills...');
    const billsResponse = await axios.get(BASE_URL, {
      params: {
        key: LEGISCAN_API_KEY,
        op: 'getMasterList',
        id: currentSession.session_id
      },
      timeout: 60000
    });
    
    const billsList = billsResponse.data.masterlist;
    const totalBills = Object.keys(billsList).length;
    allData.statistics.totalBillsFound = totalBills;
    
    console.log(`📥 DISCOVERED ${totalBills} TOTAL BILLS IN TEXAS LEGISLATURE!`);
    console.log(`🎯 Processing ALL bills for comprehensive data collection...`);
    
    // Process ALL bills (in batches to avoid overwhelming the API)
    const billKeys = Object.keys(billsList);
    const batchSize = 50; // Process 50 bills at a time
    let processedCount = 0;
    
    for (let i = 0; i < billKeys.length; i += batchSize) {
      const batch = billKeys.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(billKeys.length/batchSize)} (Bills ${i + 1}-${Math.min(i + batchSize, billKeys.length)})`);
      
      for (const billKey of batch) {
        try {
          const billInfo = billsList[billKey];
          
          if (!billInfo.bill_number) {
            continue; // Skip entries without bill numbers
          }
          
          const billTitle = billInfo.title || billInfo.bill_number || 'Untitled Bill';
          console.log(`📋 ${processedCount + 1}/${totalBills}: ${billInfo.bill_number || 'Unknown'} - ${billTitle.substring(0, 60)}...`);
          
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
          
          // Structure comprehensive bill data
          const comprehensiveBill = {
            billId: billDetail.bill_id,
            billNumber: billDetail.bill_number,
            billType: billDetail.bill_type,
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
            stateLink: billDetail.state_link,
            createdAt: billDetail.created,
            updatedAt: billDetail.updated,
            collectedAt: new Date().toISOString(),
            sessionId: currentSession.session_id
          };
          
          allData.bills.push(comprehensiveBill);
          processedCount++;
          
          // Collect amendments
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
                url: amendment.url,
                collectedAt: new Date().toISOString()
              });
              allData.statistics.amendmentsCollected++;
            });
          }
          
          // Collect votes
          if (billDetail.votes && billDetail.votes.length > 0) {
            billDetail.votes.forEach(vote => {
              allData.votes.push({
                billId: billDetail.bill_id,
                billNumber: billDetail.bill_number,
                voteId: vote.roll_call_id,
                date: vote.date,
                chamber: vote.chamber,
                motion: vote.desc,
                yea: vote.yea,
                nay: vote.nay,
                absent: vote.absent,
                total: vote.total,
                passed: vote.passed,
                url: vote.url,
                collectedAt: new Date().toISOString()
              });
              allData.statistics.votesCollected++;
            });
          }
          
          // Collect authors/sponsors
          if (billDetail.authors) {
            billDetail.authors.forEach(author => {
              allData.sponsors.push({
                billId: billDetail.bill_id,
                billNumber: billDetail.bill_number,
                personId: author.people_id,
                name: author.name,
                role: 'Author',
                party: author.party,
                chamber: author.chamber,
                collectedAt: new Date().toISOString()
              });
              allData.statistics.authorsCollected++;
            });
          }
          
          // Progress indicator
          if (processedCount % 10 === 0) {
            const percentComplete = ((processedCount / totalBills) * 100).toFixed(1);
            console.log(`📈 Progress: ${processedCount}/${totalBills} bills (${percentComplete}%) - ${allData.statistics.amendmentsCollected} amendments, ${allData.statistics.votesCollected} votes`);
          }
          
          // API rate limiting - small delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (billError) {
          console.log(`⚠️ Error processing bill ${billKey}: ${billError.message}`);
        }
      }
      
      // Longer pause between batches
      if (i + batchSize < billKeys.length) {
        console.log('⏳ Pausing 5 seconds between batches to respect API limits...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Update final statistics
    allData.statistics.billsProcessed = allData.bills.length;
    
    // Save comprehensive data
    const filename = `texas-complete-legislative-data-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
    
    console.log('\n🎉 COMPLETE TEXAS LEGISLATIVE DATA COLLECTION FINISHED!');
    console.log('===============================================================');
    console.log(`📊 FINAL STATISTICS:`);
    console.log(`   📋 Bills Processed: ${allData.statistics.billsProcessed}/${allData.statistics.totalBillsFound}`);
    console.log(`   🔄 Amendments: ${allData.statistics.amendmentsCollected}`);
    console.log(`   🗳️ Voting Records: ${allData.statistics.votesCollected}`);
    console.log(`   👥 Authors/Sponsors: ${allData.statistics.authorsCollected}`);
    console.log(`   🏛️ Session: ${currentSession.session_name}`);
    console.log(`   ⏱️ Collection Time: ${duration} minutes`);
    console.log(`📁 Data saved to: ${filename}`);
    console.log('\n🚀 Ready to upload comprehensive Texas legislative data to Act Up!');
    
    return allData;
    
  } catch (error) {
    console.log(`💥 Error in full collection: ${error.message}`);
    if (error.response) {
      console.log('API Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

collectAllTexasLegislativeData().catch(console.error);