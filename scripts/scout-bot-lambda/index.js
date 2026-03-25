// Scout Bot Search Handler Lambda Function
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

// Configure PostgreSQL connection using environment variables
let pool;
function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

/**
 * Search engine handler - searches for information about political consultants and influencers
 * 
 * @param {string} name - The name of the consultant/influencer to search for
 * @param {string} firm - Optional firm name to refine search
 * @returns {Promise<Array>} - Array of search results
 */
async function searchPoliticalEntities(name, firm = '') {
  try {
    // Construct search query for DuckDuckGo
    const searchQuery = encodeURIComponent(
      `${name} ${firm ? firm + ' ' : ''}Texas lobbyist OR consultant OR PAC OR donor site:texastribune.org OR site:houstonchronicle.com OR site:dallasmorningnews.com`
    );
    
    const searchUrl = `https://api.duckduckgo.com/?q=${searchQuery}&format=json`;
    console.log(`Searching for: ${searchQuery}`);
    
    const response = await axios.get(searchUrl);
    
    // Parse DuckDuckGo results - note that this might need adjustment based on actual API response format
    const results = response.data.RelatedTopics || [];
    
    // Format results (limited to top 5)
    return results.slice(0, 5).map(result => ({
      title: result.Text || '',
      url: result.FirstURL || '',
      snippet: result.Text || '',
    }));
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to a simpler HTTP request and HTML parsing if API fails
    return fallbackSearch(name, firm);
  }
}

/**
 * Fallback search function that uses direct HTTP requests
 */
async function fallbackSearch(name, firm = '') {
  try {
    const searchQuery = encodeURIComponent(
      `${name} ${firm ? firm + ' ' : ''}Texas lobbyist OR consultant OR PAC OR donor`
    );
    
    // Use a simple HTTP request to a search engine
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Parse the HTML response
    const $ = cheerio.load(response.data);
    const results = [];
    
    // Extract search results - adjust selectors based on the actual HTML structure
    $('.g').slice(0, 5).each((i, element) => {
      const title = $(element).find('h3').text();
      const url = $(element).find('a').attr('href') || '';
      const snippet = $(element).find('.VwiC3b').text() || '';
      
      results.push({ title, url, snippet });
    });
    
    return results;
  } catch (error) {
    console.error('Fallback search error:', error);
    return []; // Return empty array if all search methods fail
  }
}

/**
 * Extracts and summarizes information about a political entity
 */
async function analyzeSearchResults(name, results) {
  // Simple classification based on keywords in search results
  let type = 'consultant'; // Default type
  let summary = '';
  let influenceTopics = [];
  
  // Join all snippets to analyze text content
  const allText = results.map(r => r.title + ' ' + r.snippet).join(' ').toLowerCase();
  
  // Determine type based on keywords
  if (allText.includes('firm') || allText.includes('consulting') || allText.includes('consultant') || 
      allText.includes('strategist') || allText.includes('campaign manager')) {
    type = 'consultant';
  } else if (allText.includes('corporation') || allText.includes('ceo') || allText.includes('executive') ||
             allText.includes('company') || allText.includes('business')) {
    type = 'corporate';
  } else if (allText.includes('influencer') || allText.includes('donor') || 
             allText.includes('pac') || allText.includes('political action committee')) {
    type = 'influencer';
  } else if (allText.includes('strategist') || allText.includes('advisor')) {
    type = 'strategist';
  }
  
  // Extract potential influence topics
  const topicKeywords = [
    'energy', 'oil', 'gas', 'healthcare', 'medical', 'education', 'school', 
    'taxation', 'tax', 'environment', 'climate', 'transportation', 'infrastructure',
    'tech', 'technology', 'business', 'regulation', 'development', 'property', 'real estate',
    'gambling', 'casino', 'hospitality', 'agriculture', 'farming', 'water', 'rights',
    'abortion', 'reproductive', 'gun', 'firearm', 'second amendment', 'labor', 'union'
  ];
  
  topicKeywords.forEach(keyword => {
    if (allText.includes(keyword) && !influenceTopics.includes(keyword)) {
      influenceTopics.push(keyword);
    }
  });
  
  // Create a simple summary from the first result or all combined
  if (results.length > 0) {
    summary = results[0].snippet;
    if (summary.length < 50 && results.length > 1) {
      // If first snippet is too short, combine the first two
      summary = results.slice(0, 2).map(r => r.snippet).join(' ');
    }
  } else {
    summary = `Political entity identified: ${name}. No detailed information available.`;
  }
  
  return {
    type,
    summary,
    influenceTopics
  };
}

/**
 * Saves a profile to the database
 */
async function saveProfileToDatabase(profile) {
  const client = await getDbPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert the main profile
    const profileQuery = `
      INSERT INTO scout_bot_profiles(
        id, name, type, summary, source_urls, status, submitted_at, updated_at, influence_topics
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const profileValues = [
      profile.id,
      profile.name,
      profile.type,
      profile.summary,
      JSON.stringify(profile.source_urls),
      profile.status,
      profile.submitted_at,
      profile.updated_at,
      JSON.stringify(profile.influence_topics)
    ];
    
    const result = await client.query(profileQuery, profileValues);
    const profileId = result.rows[0].id;
    
    // Save any extractions as affiliations if found
    if (profile.affiliations && profile.affiliations.length > 0) {
      for (const affiliation of profile.affiliations) {
        await client.query(`
          INSERT INTO scout_bot_affiliations(
            id, profile_id, organization, role, dates, source_url, created_at, updated_at
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          uuidv4(),
          profileId,
          affiliation.organization,
          affiliation.role,
          affiliation.dates || null,
          affiliation.source_url || null,
          new Date(),
          new Date()
        ]);
      }
    }
    
    // Save any media mentions if found
    if (profile.media_mentions && profile.media_mentions.length > 0) {
      for (const mention of profile.media_mentions) {
        await client.query(`
          INSERT INTO scout_bot_media_mentions(
            id, profile_id, headline, source, url, date, snippet, created_at, updated_at
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          uuidv4(),
          profileId,
          mention.headline,
          mention.source,
          mention.url,
          mention.date || null,
          mention.snippet || null,
          new Date(),
          new Date()
        ]);
      }
    }
    
    await client.query('COMMIT');
    console.log(`Profile saved successfully with ID: ${profileId}`);
    return profileId;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving profile to database:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main Lambda handler function
 */
exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event));
    
    // Extract name and optional firm from the event
    const name = event.name || '';
    const firm = event.firm || '';
    
    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name parameter is required' })
      };
    }
    
    // Search for information about the political entity
    const searchResults = await searchPoliticalEntities(name, firm);
    console.log(`Found ${searchResults.length} search results for ${name}`);
    
    if (searchResults.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No information found for the specified entity' })
      };
    }
    
    // Analyze the search results to determine entity type and extract information
    const analysis = await analyzeSearchResults(name, searchResults);
    
    // Create a profile object
    const profile = {
      id: uuidv4(),
      name,
      type: analysis.type,
      summary: analysis.summary,
      source_urls: searchResults.map(result => result.url),
      status: 'pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      influence_topics: analysis.influenceTopics,
      affiliations: [],
      media_mentions: searchResults.map(result => ({
        headline: result.title,
        source: new URL(result.url).hostname,
        url: result.url,
        snippet: result.snippet
      }))
    };
    
    // Save the profile to the database
    await saveProfileToDatabase(profile);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Profile created successfully',
        profile
      })
    };
    
  } catch (error) {
    console.error('Lambda error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'An error occurred while processing the request',
        details: error.message
      })
    };
  }
};