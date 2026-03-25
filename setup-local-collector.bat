@echo off
echo =====================================
echo   Act Up Local Data Collector Setup
echo =====================================
echo.

REM Create project directory
echo 📁 Creating project directory...
mkdir act-up-collector 2>nul
cd act-up-collector

echo 📝 Creating package.json...
(
echo {
echo   "name": "act-up-local-collector",
echo   "version": "1.0.0",
echo   "description": "Local data collector for Act Up platform",
echo   "scripts": {
echo     "collect": "node texas-legislators-local-collector.js",
echo     "upload": "node upload-data-to-platform.js",
echo     "start": "npm run collect && npm run upload"
echo   },
echo   "dependencies": {
echo     "axios": "^1.6.0",
echo     "cheerio": "^1.0.0-rc.12",
echo     "fs-extra": "^11.1.1"
echo   }
echo }
) > package.json

echo 🔧 Installing dependencies...
npm install

echo 📥 Creating data collector script...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/axios/axios/main/package.json' -OutFile 'temp.json' 2>$null"
del temp.json 2>nul

REM Create the main collector script
(
echo /**
echo  * Texas Legislators Local Data Collector
echo  * Collects authentic data from capitol.texas.gov
echo  */
echo.
echo const axios = require('axios'^);
echo const cheerio = require('cheerio'^);
echo const fs = require('fs'^);
echo const path = require('path'^);
echo.
echo // Configuration
echo const BASE_URL = 'https://capitol.texas.gov';
echo const OUTPUT_DIR = './collected-data';
echo const DELAY_MS = 1000;
echo.
echo // Ensure output directory exists
echo if (^^!fs.existsSync(OUTPUT_DIR^)^) {
echo   fs.mkdirSync(OUTPUT_DIR, { recursive: true }^);
echo }
echo.
echo const log = (message^) =^> {
echo   const timestamp = new Date(^).toISOString(^);
echo   console.log(`[${timestamp}] ${message}`^);
echo   const logFile = path.join(OUTPUT_DIR, 'collection.log'^);
echo   fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`^);
echo };
echo.
echo const delay = (ms^) =^> new Promise(resolve =^> setTimeout(resolve, ms^)^);
echo.
echo async function collectTexasLegislators(^) {
echo   log('🚀 Starting Texas legislators data collection..'^);
echo   const allLegislators = [];
echo.
echo   try {
echo     // Collect House Representatives (Districts 1-150^)
echo     log('🏛️ Collecting Texas House Representatives..'^);
echo     for (let district = 1; district ^<= 150; district++^) {
echo       try {
echo         const url = `${BASE_URL}/Members/en/District/${district}`;
echo         log(`Fetching House District ${district}...`^);
echo         
echo         const response = await axios.get(url, {
echo           headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64^) AppleWebKit/537.36' },
echo           timeout: 10000
echo         }^);
echo         
echo         const $ = cheerio.load(response.data^);
echo         const name = $('h1'^).first(^).text(^).trim(^);
echo         
echo         if (name ^&^& name.length ^> 2^) {
echo           const legislator = {
echo             chamber: 'House',
echo             name: name,
echo             district: `District ${district}`,
echo             party: extractParty($^),
echo             email: extractEmail($^),
echo             phone: extractPhone($^),
echo             collectedAt: new Date(^).toISOString(^)
echo           };
echo           
echo           allLegislators.push(legislator^);
echo           log(`✅ House District ${district}: ${name}`^);
echo         } else {
echo           log(`⚠️ No data for House District ${district}`^);
echo         }
echo         
echo         await delay(DELAY_MS^);
echo       } catch (error^) {
echo         log(`❌ Error with House District ${district}: ${error.message}`^);
echo       }
echo     }
echo.
echo     // Collect Senate Members (Districts 1-31^)
echo     log('🏛️ Collecting Texas Senate Members..'^);
echo     for (let district = 1; district ^<= 31; district++^) {
echo       try {
echo         const url = `${BASE_URL}/Members/en/senate/District/${district}`;
echo         log(`Fetching Senate District ${district}...`^);
echo         
echo         const response = await axios.get(url, {
echo           headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64^) AppleWebKit/537.36' },
echo           timeout: 10000
echo         }^);
echo         
echo         const $ = cheerio.load(response.data^);
echo         const name = $('h1'^).first(^).text(^).trim(^);
echo         
echo         if (name ^&^& name.length ^> 2^) {
echo           const legislator = {
echo             chamber: 'Senate',
echo             name: name,
echo             district: `District ${district}`,
echo             party: extractParty($^),
echo             email: extractEmail($^),
echo             phone: extractPhone($^),
echo             collectedAt: new Date(^).toISOString(^)
echo           };
echo           
echo           allLegislators.push(legislator^);
echo           log(`✅ Senate District ${district}: ${name}`^);
echo         } else {
echo           log(`⚠️ No data for Senate District ${district}`^);
echo         }
echo         
echo         await delay(DELAY_MS^);
echo       } catch (error^) {
echo         log(`❌ Error with Senate District ${district}: ${error.message}`^);
echo       }
echo     }
echo.
echo     // Save collected data
echo     const outputFile = path.join(OUTPUT_DIR, 'texas-legislators.json'^);
echo     const dataToSave = {
echo       collectedAt: new Date(^).toISOString(^),
echo       source: 'capitol.texas.gov',
echo       totalCount: allLegislators.length,
echo       legislators: allLegislators
echo     };
echo     
echo     fs.writeFileSync(outputFile, JSON.stringify(dataToSave, null, 2^)^);
echo     log(`🎉 Collection complete^^! Saved ${allLegislators.length} legislators to ${outputFile}`^);
echo     
echo     return allLegislators;
echo   } catch (error^) {
echo     log(`💥 Collection failed: ${error.message}`^);
echo     throw error;
echo   }
echo }
echo.
echo function extractParty($^) {
echo   const partyText = $('.member-party, .party, [class*="party"]'^).text(^).trim(^);
echo   if (partyText.includes('Republican'^) ^|^| partyText.includes('(R^)'^)^) return 'Republican';
echo   if (partyText.includes('Democrat'^) ^|^| partyText.includes('(D^)'^)^) return 'Democrat';
echo   return 'Unknown';
echo }
echo.
echo function extractEmail($^) {
echo   const emailLink = $('a[href^="mailto:"]'^).first(^);
echo   return emailLink.length ? emailLink.attr('href'^).replace('mailto:', ''^ ) : '';
echo }
echo.
echo function extractPhone($^) {
echo   const phoneText = $('.phone, .contact-phone, [class*="phone"]'^).text(^).trim(^);
echo   const phoneMatch = phoneText.match(/(\\(?\\d{3}\\)?[-.\s]?\\d{3}[-.\s]?\\d{4}^)/^);
echo   return phoneMatch ? phoneMatch[1] : '';
echo }
echo.
echo if (require.main === module^) {
echo   collectTexasLegislators(^)
echo     .then((^) =^> {
echo       log('🎉 Local data collection completed successfully^^!'^);
echo       log('Next: Run npm run upload to send data to your platform'^);
echo     }^)
echo     .catch(error =^> {
echo       log(`💥 Collection failed: ${error.message}`^);
echo       process.exit(1^);
echo     }^);
echo }
echo.
echo module.exports = { collectTexasLegislators };
) > texas-legislators-local-collector.js

echo 📤 Creating upload script...
(
echo /**
echo  * Upload Collected Data to Act Up Platform
echo  */
echo.
echo const axios = require('axios'^);
echo const fs = require('fs'^);
echo const path = require('path'^);
echo.
echo // UPDATE THIS WITH YOUR REPLIT URL
echo const PLATFORM_URL = 'https://your-replit-url.replit.app';
echo const DATA_DIR = './collected-data';
echo.
echo const log = (message^) =^> {
echo   console.log(`[${new Date(^).toISOString(^)}] ${message}`^);
echo };
echo.
echo async function uploadData(^) {
echo   try {
echo     const dataFile = path.join(DATA_DIR, 'texas-legislators.json'^);
echo     
echo     if (^^!fs.existsSync(dataFile^)^) {
echo       log('❌ No data file found. Run npm run collect first.'^);
echo       return;
echo     }
echo     
echo     log('📤 Reading collected data..'^);
echo     const rawData = fs.readFileSync(dataFile, 'utf8'^);
echo     const data = JSON.parse(rawData^);
echo     
echo     log(`📊 Found ${data.totalCount} legislators to upload`^);
echo     
echo     if (PLATFORM_URL === 'https://your-replit-url.replit.app'^) {
echo       log('⚠️ Please update PLATFORM_URL in upload-data-to-platform.js with your actual Replit URL'^);
echo       log('💡 Find your URL by clicking "Open in new tab" in Replit'^);
echo       return;
echo     }
echo     
echo     log('🚀 Uploading to Act Up platform..'^);
echo     const response = await axios.post(`${PLATFORM_URL}/api/data-import/legislators`, data, {
echo       headers: { 'Content-Type': 'application/json' },
echo       timeout: 30000
echo     }^);
echo     
echo     log('✅ Upload successful^^!'^);
echo     log(`📈 Response: ${JSON.stringify(response.data, null, 2^)}`^);
echo     
echo   } catch (error^) {
echo     log(`💥 Upload failed: ${error.message}`^);
echo     if (error.response^) {
echo       log(`Server response: ${JSON.stringify(error.response.data, null, 2^)}`^);
echo     }
echo   }
echo }
echo.
echo if (require.main === module^) {
echo   uploadData(^);
echo }
) > upload-data-to-platform.js

echo.
echo ✅ Setup complete! Your Act Up data collector is ready.
echo.
echo 🚀 To collect Texas legislative data:
echo    npm run collect
echo.
echo 📤 To upload data to your platform:
echo    npm run upload
echo.
echo 💡 Note: Update the PLATFORM_URL in upload-data-to-platform.js with your Replit URL
echo.
echo Press any key to exit...
pause >nul