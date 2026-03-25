const axios = require('axios');
const fs = require('fs');

const LEGISCAN_API_KEY = 'd533b82a244ad44caa7d7399391908d9';
const BASE_URL = 'https://api.legiscan.com/';

console.log('🔍 DEBUG TEXAS LEGISLATIVE DATA STRUCTURE');

async function debugTexasDataStructure() {
  try {
    console.log('📊 Getting Texas session information...');
    
    // Get Texas session
    const sessionResponse = await axios.get(BASE_URL, {
      params: { key: LEGISCAN_API_KEY, op: 'getSessionList', state: 'TX' }
    });
    
    const sessions = sessionResponse.data.sessions;
    const currentSession = sessions.find(s => s.current === 1) || sessions[0];
    
    console.log(`📋 Session: ${currentSession.session_name}`);
    console.log(`🆔 Session ID: ${currentSession.session_id}`);
    
    // Get bill list and examine structure
    console.log('📜 Getting master bill list...');
    const billsResponse = await axios.get(BASE_URL, {
      params: { key: LEGISCAN_API_KEY, op: 'getMasterList', id: currentSession.session_id },
      timeout: 60000
    });
    
    const masterlist = billsResponse.data.masterlist;
    
    console.log('\n🔍 DEBUGGING MASTERLIST STRUCTURE:');
    console.log(`📊 Total entries in masterlist: ${Object.keys(masterlist).length}`);
    
    // Show first 10 entries to understand structure
    const entries = Object.entries(masterlist).slice(0, 10);
    console.log('\n📋 First 10 entries:');
    
    entries.forEach(([key, value], index) => {
      console.log(`\n${index + 1}. Key: ${key}`);
      console.log(`   Type: ${typeof value}`);
      if (typeof value === 'object' && value !== null) {
        console.log(`   Keys: ${Object.keys(value).join(', ')}`);
        if (value.bill_number) {
          console.log(`   📋 Bill: ${value.bill_number}`);
        }
        if (value.title) {
          console.log(`   📝 Title: ${value.title.substring(0, 50)}...`);
        }
      } else {
        console.log(`   Value: ${value}`);
      }
    });
    
    // Save full structure for analysis
    fs.writeFileSync('texas-masterlist-debug.json', JSON.stringify(masterlist, null, 2));
    console.log('\n💾 Full masterlist saved to: texas-masterlist-debug.json');
    
    // Try to collect one actual bill
    console.log('\n🎯 Attempting to collect one real bill...');
    
    // Find first actual bill entry
    let testBillInfo = null;
    for (const [key, value] of Object.entries(masterlist)) {
      if (value && typeof value === 'object' && value.bill_id) {
        testBillInfo = value;
        console.log(`✅ Found test bill: ${value.bill_number || 'Unknown'} (ID: ${value.bill_id})`);
        break;
      }
    }
    
    if (testBillInfo) {
      console.log('📥 Getting detailed bill information...');
      
      const billDetailResponse = await axios.get(BASE_URL, {
        params: { key: LEGISCAN_API_KEY, op: 'getBill', id: testBillInfo.bill_id },
        timeout: 30000
      });
      
      const billDetail = billDetailResponse.data.bill;
      
      console.log('\n🎉 SUCCESS! Sample bill data:');
      console.log(`📋 Bill Number: ${billDetail.bill_number}`);
      console.log(`📝 Title: ${(billDetail.title || 'No title').substring(0, 100)}...`);
      console.log(`🏛️ Chamber: ${billDetail.body_name || 'Unknown'}`);
      console.log(`📊 Status: ${billDetail.status_text || 'Unknown'}`);
      
      // Save sample bill for analysis
      fs.writeFileSync('texas-sample-bill-debug.json', JSON.stringify(billDetail, null, 2));
      console.log('💾 Sample bill saved to: texas-sample-bill-debug.json');
      
      console.log('\n✅ SUCCESS! Your LegiScan API can collect authentic Texas legislative data!');
      console.log('🚀 Ready to build full collector with correct data structure.');
      
    } else {
      console.log('❌ No bill entries found in expected format');
    }
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    if (error.response) {
      console.log('📡 API Response Status:', error.response.status);
      console.log('📡 API Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugTexasDataStructure();