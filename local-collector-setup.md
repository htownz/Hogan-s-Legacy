# Local Data Collection Setup for Act Up

## Quick Setup for Your PC

### 1. Create Local Project Folder
Create a new folder on your PC called `act-up-collector` and copy these files into it.

### 2. Package.json for Local Collector
```json
{
  "name": "act-up-local-collector",
  "version": "1.0.0",
  "description": "Local data collector for Act Up platform",
  "scripts": {
    "collect:legislators": "node collectors/texas-legislators.js",
    "collect:bills": "node collectors/texas-bills.js",
    "collect:all": "node collectors/collect-all.js",
    "upload": "node uploaders/sync-to-platform.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "dotenv": "^16.3.1",
    "fs-extra": "^11.1.1"
  }
}
```

### 3. Environment Setup (.env file)
```env
# Your Act Up Platform URL
PLATFORM_URL=https://your-replit-app-url.replit.app

# Texas Legislative APIs (optional but recommended)
LEGISCAN_API_KEY=your_legiscan_key_here
OPENSTATES_API_KEY=your_openstates_key_here

# Collection Settings
COLLECTION_INTERVAL_HOURS=6
MAX_RETRY_ATTEMPTS=3
```

### 4. Run Commands
```bash
# Install dependencies
npm install

# Collect Texas legislators (most reliable)
npm run collect:legislators

# Upload collected data to your platform
npm run upload
```

## Benefits of Local Collection

✅ **No Server Timeouts**: Your PC has unlimited processing time
✅ **Better Error Handling**: Full control over retry logic and error recovery  
✅ **Scheduled Collection**: Set up daily/hourly automated runs
✅ **Data Validation**: Verify data quality before uploading
✅ **Incremental Updates**: Only collect new/changed data
✅ **Multiple Data Sources**: Combine capitol.texas.gov, LegiScan, and OpenStates

## What You'll Collect

1. **Texas Legislators** - Names, districts, contact info, committees
2. **Current Bills** - Bill text, status, sponsors, voting records  
3. **Committee Data** - Meeting schedules, membership, hearing records
4. **Voting Records** - Roll call votes, vote tallies, bill outcomes

## Next Steps

Would you like me to create the actual collector scripts that you can copy to your PC? These will be much more robust than running data collection directly in the web environment.