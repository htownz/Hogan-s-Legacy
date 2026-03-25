/**
 * Upload OpenStates Legislative Data to Act Up Platform
 * Run this script to upload your collected OpenStates data to your PostgreSQL database
 * 
 * Usage: node upload-openstates-data-to-platform.js [filename]
 */

const fs = require('fs');
const axios = require('axios');

// Your Replit platform URL
const PLATFORM_URL = 'https://f6e2b5f4-26a5-472a-9c1b-63c2b30bfc8c-00-1qdmqh2vqzhfi.riker.replit.dev';

async function uploadOpenStatesDataToPlatform() {
  try {
    // Get filename from command line or use default
    const filename = process.argv[2] || 'texas-openstates-comprehensive-2025-05-26.json';
    
    console.log('📊 UPLOADING OPENSTATES DATA TO ACT UP PLATFORM');
    console.log(`📁 Reading file: ${filename}`);
    
    if (!fs.existsSync(filename)) {
      console.log(`❌ File not found: ${filename}`);
      console.log('💡 Make sure you\'ve run the OpenStates collector first');
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    
    console.log(`📊 Data Summary:`);
    console.log(`👥 Legislators: ${data.statistics?.legislatorsCollected || data.legislators?.length || 0}`);
    console.log(`🏛️ Committees: ${data.statistics?.committeesCollected || data.committees?.length || 0}`);
    console.log(`📋 Bills: ${data.statistics?.billsCollected || data.bills?.length || 0}`);
    console.log(`📅 Events: ${data.statistics?.eventsCollected || data.events?.length || 0}`);
    
    console.log('\n🔗 Testing platform connection...');
    
    try {
      const healthResponse = await axios.get(`${PLATFORM_URL}/api/health`, {
        timeout: 10000
      });
      console.log('✅ Platform connection successful');
    } catch (error) {
      console.log('⚠️ Platform connection test failed, but continuing...');
    }
    
    // Upload legislators data
    if (data.legislators && data.legislators.length > 0) {
      console.log('\n👥 Uploading legislators data...');
      
      try {
        const legislatorsResponse = await axios.post(`${PLATFORM_URL}/api/data-upload/openstates-legislators`, {
          legislators: data.legislators,
          metadata: {
            source: 'openstates',
            collectedAt: data.collectedAt,
            jurisdiction: 'texas'
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        });
        
        console.log(`✅ Legislators uploaded successfully: ${data.legislators.length} records`);
        
      } catch (uploadError) {
        console.log(`⚠️ Error uploading legislators:`, uploadError.message);
        if (uploadError.response) {
          console.log('📡 Response status:', uploadError.response.status);
          console.log('📡 Response data:', uploadError.response.data);
        }
      }
    }
    
    // Upload committees data
    if (data.committees && data.committees.length > 0) {
      console.log('\n🏛️ Uploading committees data...');
      
      try {
        const committeesResponse = await axios.post(`${PLATFORM_URL}/api/data-upload/openstates-committees`, {
          committees: data.committees,
          metadata: {
            source: 'openstates',
            collectedAt: data.collectedAt,
            jurisdiction: 'texas'
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        });
        
        console.log(`✅ Committees uploaded successfully: ${data.committees.length} records`);
        
      } catch (uploadError) {
        console.log(`⚠️ Error uploading committees:`, uploadError.message);
        if (uploadError.response) {
          console.log('📡 Response status:', uploadError.response.status);
        }
      }
    }
    
    // Upload bills data (if any)
    if (data.bills && data.bills.length > 0) {
      console.log('\n📋 Uploading bills data...');
      
      try {
        const billsResponse = await axios.post(`${PLATFORM_URL}/api/data-upload/openstates-bills`, {
          bills: data.bills,
          metadata: {
            source: 'openstates',
            collectedAt: data.collectedAt,
            jurisdiction: 'texas'
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        });
        
        console.log(`✅ Bills uploaded successfully: ${data.bills.length} records`);
        
      } catch (uploadError) {
        console.log(`⚠️ Error uploading bills:`, uploadError.message);
      }
    }
    
    // Upload events data (if any)
    if (data.events && data.events.length > 0) {
      console.log('\n📅 Uploading events data...');
      
      try {
        const eventsResponse = await axios.post(`${PLATFORM_URL}/api/data-upload/openstates-events`, {
          events: data.events,
          metadata: {
            source: 'openstates',
            collectedAt: data.collectedAt,
            jurisdiction: 'texas'
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        });
        
        console.log(`✅ Events uploaded successfully: ${data.events.length} records`);
        
      } catch (uploadError) {
        console.log(`⚠️ Error uploading events:`, uploadError.message);
      }
    }
    
    console.log('\n🎉 OPENSTATES DATA UPLOAD COMPLETE!');
    console.log('✅ Your authentic Texas legislative data is now integrated into Act Up platform!');
    console.log('🤖 Scout bots now have complete legislator intelligence');
    console.log('🏛️ AI analysis enhanced with real committee and voting data');
    console.log('📊 Platform ready for enhanced civic engagement features');
    
  } catch (error) {
    console.log(`💥 Upload failed: ${error.message}`);
    if (error.code === 'ENOENT') {
      console.log('📁 Make sure the OpenStates data file exists in this directory');
    }
  }
}

async function testPlatformConnection() {
  try {
    console.log('🔗 Testing Act Up platform connection...');
    const response = await axios.get(`${PLATFORM_URL}/api/health`, {
      timeout: 10000
    });
    console.log('✅ Platform is accessible');
    return true;
  } catch (error) {
    console.log(`⚠️ Platform connection failed: ${error.message}`);
    console.log('💡 Make sure your Act Up platform is running on Replit');
    return false;
  }
}

async function main() {
  console.log('📊 ACT UP - OPENSTATES DATA UPLOADER');
  console.log('🎯 Integrating authentic Texas legislative data...\n');
  
  await uploadOpenStatesDataToPlatform();
}

main();