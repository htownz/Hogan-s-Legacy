/**
 * Upload Authentic Texas Legislative Data to Act Up Platform
 * Run this script to upload your collected legislative data to your PostgreSQL database
 * 
 * Usage: node upload-texas-data-to-platform.js [filename]
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Your Act Up platform URL
const PLATFORM_URL = 'https://c4552618-38e3-458b-ab8e-c45824be4558-00-3aqz3h0k8jpnt.riker.replit.dev';

console.log('🚀 UPLOADING AUTHENTIC TEXAS LEGISLATIVE DATA TO ACT UP PLATFORM');

async function uploadTexasDataToPlatform() {
  try {
    // Find the most recent Texas data file
    const files = fs.readdirSync('.');
    const dataFiles = files.filter(f => 
      f.startsWith('texas-') && 
      (f.includes('working-data') || f.includes('complete-data') || f.includes('final-data')) && 
      f.endsWith('.json')
    );
    
    if (dataFiles.length === 0) {
      console.log('❌ No Texas legislative data files found!');
      console.log('Expected files like: texas-working-data-2025-05-25.json');
      return;
    }
    
    // Use the most recent file
    const latestFile = dataFiles.sort().reverse()[0];
    console.log(`📁 Using data file: ${latestFile}`);
    
    // Load the authentic legislative data
    const dataContent = fs.readFileSync(latestFile, 'utf8');
    const legislativeData = JSON.parse(dataContent);
    
    console.log('📊 Data Summary:');
    console.log(`📋 Bills: ${legislativeData.bills?.length || 0}`);
    console.log(`🔄 Amendments: ${legislativeData.amendments?.length || 0}`);
    console.log(`🗳️ Votes: ${legislativeData.votes?.length || 0}`);
    console.log(`🏛️ Session: ${legislativeData.sessionInfo?.sessionName || 'Unknown'}`);
    
    if (!legislativeData.bills || legislativeData.bills.length === 0) {
      console.log('⚠️ No bills found in data file. Please check your collection process.');
      return;
    }
    
    console.log('📤 Uploading authentic Texas legislative data to Act Up platform...');
    
    // Upload to your PostgreSQL database via the platform API
    const uploadResponse = await axios.post(
      `${PLATFORM_URL}/api/upload/texas-legislative-data`,
      legislativeData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minute timeout for large uploads
      }
    );
    
    if (uploadResponse.data.success) {
      console.log('\n🎉 UPLOAD SUCCESSFUL!');
      console.log('✅ Authentic Texas legislative data uploaded to PostgreSQL database');
      console.log(`📊 Bills uploaded: ${uploadResponse.data.statistics.billsInserted}`);
      console.log(`🔄 Amendments uploaded: ${uploadResponse.data.statistics.amendmentsInserted}`);
      console.log(`🗳️ Votes processed: ${uploadResponse.data.statistics.votesInserted}`);
      console.log(`🏛️ Session: ${uploadResponse.data.statistics.session}`);
      
      // Get upload statistics
      console.log('\n📈 Checking platform statistics...');
      const statsResponse = await axios.get(`${PLATFORM_URL}/api/upload/statistics`);
      
      if (statsResponse.data.success) {
        console.log('📊 Platform Database Statistics:');
        console.log(`📋 Total Bills: ${statsResponse.data.statistics.totalBills}`);
        console.log(`🔄 Total Amendments: ${statsResponse.data.statistics.totalAmendments}`);
        console.log(`🗳️ Total Votes: ${statsResponse.data.statistics.totalVotes}`);
        console.log(`🕒 Last Updated: ${statsResponse.data.statistics.lastUpdated}`);
      }
      
      console.log('\n🚀 Your Act Up platform now has authentic Texas legislative data!');
      console.log('Citizens can now search, track, and engage with real government information.');
      
    } else {
      console.log('❌ Upload failed:', uploadResponse.data.error);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to Act Up platform');
      console.log('🔧 Make sure your platform is running at:');
      console.log(`   ${PLATFORM_URL}`);
    } else if (error.response) {
      console.log('❌ Platform error:', error.response.status);
      console.log('📋 Details:', error.response.data);
    } else {
      console.log('💥 Upload error:', error.message);
    }
  }
}

async function testPlatformConnection() {
  try {
    console.log('🔍 Testing connection to Act Up platform...');
    const response = await axios.get(`${PLATFORM_URL}/api/upload/statistics`, { timeout: 10000 });
    console.log('✅ Platform connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Cannot connect to platform:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏛️ Act Up Platform - Authentic Texas Legislative Data Upload');
  console.log('='.repeat(60));
  
  // Test platform connection first
  const connected = await testPlatformConnection();
  if (!connected) {
    console.log('\n🔧 Platform connection failed. Please check:');
    console.log('1. Your Act Up platform is running');
    console.log('2. The platform URL is correct');
    console.log('3. Your internet connection');
    return;
  }
  
  // Upload the data
  await uploadTexasDataToPlatform();
}

// Run the upload
main().catch(error => {
  console.error('💥 Fatal error:', error);
});