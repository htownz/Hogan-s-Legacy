/**
 * Upload Collected Data to Act Up Platform
 * Run this script to upload your locally collected data to your Replit platform
 * 
 * Usage: node upload-data-to-platform.js
 */

const axios = require('axios');
const fs = require('fs');

// Your Act Up platform URL (update this with your actual Replit URL)
const PLATFORM_URL = 'https://c4552618-38e3-458b-ab8e-c45824be4558-00-19bqt8iaw3k1b.riker.replit.dev:5000';

async function uploadLegislatorsData() {
  try {
    console.log('📤 Reading authentic Texas legislators data...');
    
    if (!fs.existsSync('authentic-texas-legislators.json')) {
      console.log('❌ File authentic-texas-legislators.json not found!');
      console.log('💡 Make sure you run legiscan-collector.js first to collect the data');
      return;
    }

    const data = JSON.parse(fs.readFileSync('authentic-texas-legislators.json', 'utf8'));
    
    console.log(`🚀 Uploading ${data.totalCount} authentic Texas legislators to Act Up platform...`);
    console.log(`📊 Source: ${data.source}`);
    console.log(`⏰ Collected: ${data.collectedAt}`);
    
    const response = await axios.post(`${PLATFORM_URL}/api/data-import/legislators`, {
      legislators: data.legislators,
      source: data.source,
      collectedAt: data.collectedAt,
      sessionInfo: data.sessionInfo
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    if (response.data.success) {
      console.log('🎉 Upload successful!');
      console.log(`✅ Imported: ${response.data.imported} legislators`);
      console.log(`⏭️ Skipped: ${response.data.skipped} entries`);
      console.log(`📊 Total processed: ${response.data.total}`);
      console.log(`🏛️ Platform now has authentic Texas legislative data!`);
    } else {
      console.log('❌ Upload failed:', response.data.message);
    }
    
  } catch (error) {
    console.log('💥 Upload error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your Act Up platform is running');
      console.log('💡 Check the PLATFORM_URL in this script');
    }
    
    if (error.response) {
      console.log('📄 Server response:', error.response.status, error.response.data);
    }
  }
}

async function testPlatformConnection() {
  try {
    console.log('🔗 Testing connection to Act Up platform...');
    const response = await axios.get(`${PLATFORM_URL}/api/health`, { timeout: 10000 });
    console.log('✅ Platform is accessible!');
    return true;
  } catch (error) {
    console.log('❌ Cannot connect to platform');
    console.log('💡 Update PLATFORM_URL with your actual Replit URL');
    return false;
  }
}

async function main() {
  console.log('🚀 Act Up Data Upload Tool');
  console.log('============================');
  
  const connected = await testPlatformConnection();
  if (connected) {
    await uploadLegislatorsData();
  }
}

main().catch(console.error);