@echo off
echo =====================================
echo   Act Up - Quick Data Collector Setup
echo =====================================
echo.

REM Get your Replit URL from user
set /p REPLIT_URL="Enter your Replit URL (from 'Open in new tab'): "

REM Create project directory
echo 📁 Creating project directory...
cd Desktop 2>nul || cd %USERPROFILE%\Desktop 2>nul || cd %USERPROFILE%
mkdir act-up-collector 2>nul
cd act-up-collector

echo 📝 Creating package.json...
echo { > package.json
echo   "name": "act-up-local-collector", >> package.json
echo   "version": "1.0.0", >> package.json
echo   "scripts": { >> package.json
echo     "collect": "node texas-legislators.js", >> package.json
echo     "upload": "node upload-data.js", >> package.json
echo     "start": "npm run collect && npm run upload" >> package.json
echo   }, >> package.json
echo   "dependencies": { >> package.json
echo     "axios": "^1.6.0", >> package.json
echo     "cheerio": "^1.0.0-rc.12" >> package.json
echo   } >> package.json
echo } >> package.json

echo 🔧 Installing dependencies...
npm install

echo 📥 Creating Texas legislators collector...
(
echo const axios = require('axios'^);
echo const cheerio = require('cheerio'^);
echo const fs = require('fs'^);
echo.
echo console.log('🚀 Starting Texas legislators collection...'^);
echo.
echo async function collectLegislators(^) {
echo   const legislators = [];
echo   const BASE_URL = 'https://capitol.texas.gov';
echo.
echo   // Collect House Representatives
echo   console.log('📊 Collecting House Representatives...'^);
echo   for (let district = 1; district ^<= 150; district++^) {
echo     try {
echo       const url = `${BASE_URL}/Members/en/District/${district}`;
echo       console.log(`Fetching House District ${district}...`^);
echo       
echo       const response = await axios.get(url, {
echo         headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64^)' },
echo         timeout: 10000
echo       }^);
echo       
echo       const $ = cheerio.load(response.data^);
echo       const name = $('h1'^).first(^).text(^).trim(^);
echo       
echo       if (name ^&^& name.length ^> 2^) {
echo         legislators.push({
echo           chamber: 'House',
echo           name: name,
echo           district: `District ${district}`,
echo           party: 'Unknown',
echo           collectedAt: new Date(^).toISOString(^)
echo         }^);
echo         console.log(`✅ House District ${district}: ${name}`^);
echo       }
echo       
echo       await new Promise(resolve =^> setTimeout(resolve, 1000^)^);
echo     } catch (error^) {
echo       console.log(`⚠️ House District ${district}: Not available`^);
echo     }
echo   }
echo.
echo   // Collect Senate Members
echo   console.log('📊 Collecting Senate Members...'^);
echo   for (let district = 1; district ^<= 31; district++^) {
echo     try {
echo       const url = `${BASE_URL}/Members/en/senate/District/${district}`;
echo       console.log(`Fetching Senate District ${district}...`^);
echo       
echo       const response = await axios.get(url, {
echo         headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64^)' },
echo         timeout: 10000
echo       }^);
echo       
echo       const $ = cheerio.load(response.data^);
echo       const name = $('h1'^).first(^).text(^).trim(^);
echo       
echo       if (name ^&^& name.length ^> 2^) {
echo         legislators.push({
echo           chamber: 'Senate',
echo           name: name,
echo           district: `District ${district}`,
echo           party: 'Unknown',
echo           collectedAt: new Date(^).toISOString(^)
echo         }^);
echo         console.log(`✅ Senate District ${district}: ${name}`^);
echo       }
echo       
echo       await new Promise(resolve =^> setTimeout(resolve, 1000^)^);
echo     } catch (error^) {
echo       console.log(`⚠️ Senate District ${district}: Not available`^);
echo     }
echo   }
echo.
echo   // Save data
echo   const data = {
echo     collectedAt: new Date(^).toISOString(^),
echo     source: 'capitol.texas.gov',
echo     totalCount: legislators.length,
echo     legislators: legislators
echo   };
echo   
echo   fs.writeFileSync('texas-legislators.json', JSON.stringify(data, null, 2^)^);
echo   console.log(`🎉 Collected ${legislators.length} legislators^^!`^);
echo   return data;
echo }
echo.
echo collectLegislators(^).catch(console.error^);
) > texas-legislators.js

echo 📤 Creating upload script...
(
echo const axios = require('axios'^);
echo const fs = require('fs'^);
echo.
echo const PLATFORM_URL = '%REPLIT_URL%';
echo.
echo async function uploadData(^) {
echo   try {
echo     if (^^!fs.existsSync('texas-legislators.json'^)^) {
echo       console.log('❌ No data file found. Run npm run collect first.'^);
echo       return;
echo     }
echo     
echo     const data = JSON.parse(fs.readFileSync('texas-legislators.json', 'utf8'^)^);
echo     console.log(`📤 Uploading ${data.totalCount} legislators to Act Up platform...`^);
echo     
echo     const response = await axios.post(`${PLATFORM_URL}/api/data-import/legislators`, data, {
echo       headers: { 'Content-Type': 'application/json' },
echo       timeout: 30000
echo     }^);
echo     
echo     console.log('✅ Upload successful^^!'^);
echo     console.log('📊 Response:', response.data^);
echo     
echo   } catch (error^) {
echo     console.log('💥 Upload failed:', error.message^);
echo     if (error.response^) {
echo       console.log('Server response:', error.response.data^);
echo     }
echo   }
echo }
echo.
echo uploadData(^);
) > upload-data.js

echo.
echo ✅ Setup complete! Your authentic data collector is ready.
echo.
echo 🚀 To collect real Texas legislative data:
echo    npm run collect
echo.
echo 📤 To upload data to your Act Up platform:
echo    npm run upload
echo.
echo 🔄 To do both in sequence:
echo    npm run start
echo.
echo Press any key to continue...
pause >nul