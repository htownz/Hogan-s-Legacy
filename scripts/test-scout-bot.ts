/**
 * Test script for Scout Bot - simulates the Lambda function locally
 * This helps test the Scout Bot functionality without deploying to AWS
 */

import axios from 'axios';
import cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { pool, db } from '../server/db';
import {
  profileStatusEnum,
  profileTypeEnum,
  scoutBotProfiles,
  scoutBotAffiliations,
  scoutBotMediaMentions,
} from '../shared/schema-scout-bot';

/**
 * Search engine handler - searches for information about political consultants and influencers
 */
async function searchPoliticalEntities(name: string, firm = '') {
  try {
    console.log(`🔍 Searching for political entity: ${name} ${firm ? `(${firm})` : ''}`);
    
    // Simulate search results for demonstration purposes
    // In a real implementation, this would make actual API calls to search engines
    
    const searchResults = [];
    
    // Example search result 1
    searchResults.push({
      title: `${name} - Texas Tribune Profile`,
      url: `https://www.texastribune.org/directory/${name.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `${name} is a political consultant with expertise in campaign strategy and fundraising. Known for work with the Texas business community.`,
    });
    
    // Example search result 2
    searchResults.push({
      title: `${name} Consulting Firm Expands in Austin`,
      url: `https://www.houstonchronicle.com/business/article/${name.toLowerCase().replace(/\s+/g, '-')}-consulting-expands`,
      snippet: `The ${name} Group, a political consulting firm, has expanded its operations in Austin, working with key legislators on economic development initiatives.`,
    });
    
    // Example search result 3
    searchResults.push({
      title: `Political Power Players: ${name}`,
      url: `https://www.dallasmorningnews.com/politics/profiles/${name.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `A look at how ${name} has influenced Texas politics through strategic consulting and lobbyist activities over the past decade.`,
    });
    
    console.log(`✅ Found ${searchResults.length} search results`);
    return searchResults;
  } catch (error) {
    console.error('❌ Search error:', error);
    return []; // Return empty array if search fails
  }
}

/**
 * Extracts and summarizes information about a political entity
 */
async function analyzeSearchResults(name: string, results: any[]) {
  console.log(`🧠 Analyzing search results for ${name}...`);
  
  // Simple classification based on keywords in search results
  let type: (typeof profileTypeEnum.enumValues)[number] = 'consultant'; // Default type
  let summary = '';
  let influenceTopics: string[] = [];
  
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
    'tech', 'technology', 'business', 'regulation', 'development', 'property', 'real estate'
  ];
  
  topicKeywords.forEach(keyword => {
    if (allText.includes(keyword) && !influenceTopics.includes(keyword)) {
      influenceTopics.push(keyword);
    }
  });
  
  // Add some topics for testing if none were found
  if (influenceTopics.length === 0) {
    influenceTopics = ['business', 'economic development', 'taxation'];
  }
  
  // Create a simple summary
  if (results.length > 0) {
    summary = results[0].snippet;
  } else {
    summary = `Political entity identified: ${name}. No detailed information available.`;
  }
  
  console.log(`✅ Analysis complete. Type: ${type}, Topics: ${influenceTopics.join(', ')}`);
  
  return {
    type,
    summary,
    influenceTopics
  };
}

/**
 * Saves a profile to the database
 */
async function saveProfileToDatabase(profile: any) {
  console.log(`💾 Saving profile for ${profile.name} to database...`);
  
  try {
    // Insert the main profile
    const [createdProfile] = await db
      .insert(scoutBotProfiles)
      .values({
        id: profile.id,
        name: profile.name,
        type: profile.type as any,
        summary: profile.summary,
        source_urls: profile.source_urls,
        status: profile.status as any,
        submitted_at: new Date(profile.submitted_at),
        updated_at: new Date(profile.updated_at),
        influence_topics: profile.influence_topics,
      })
      .returning();
    
    console.log(`✅ Profile saved with ID: ${createdProfile.id}`);
    
    // Save media mentions
    if (profile.media_mentions && profile.media_mentions.length > 0) {
      console.log(`💾 Saving ${profile.media_mentions.length} media mentions...`);
      
      for (const mention of profile.media_mentions) {
        await db
          .insert(scoutBotMediaMentions)
          .values({
            profile_id: createdProfile.id,
            headline: mention.headline,
            source: mention.source,
            url: mention.url,
            snippet: mention.snippet,
          });
      }
      
      console.log(`✅ Media mentions saved`);
    }
    
    return createdProfile.id;
  } catch (error) {
    console.error('❌ Error saving profile to database:', error);
    throw error;
  }
}

/**
 * Main function to run the Scout Bot locally
 */
async function runScoutBot(name: string, firm = '') {
  console.log(`🤖 Starting Scout Bot for ${name}...`);
  
  try {
    // Step 1: Search for information about the political entity
    const searchResults = await searchPoliticalEntities(name, firm);
    
    if (searchResults.length === 0) {
      console.log(`❌ No information found for ${name}`);
      return null;
    }
    
    // Step 2: Analyze the search results to determine entity type and extract information
    const analysis = await analyzeSearchResults(name, searchResults);
    
    // Step 3: Create a profile object
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
      media_mentions: searchResults.map(result => ({
        headline: result.title,
        source: new URL(result.url).hostname,
        url: result.url,
        snippet: result.snippet
      }))
    };
    
    // Step 4: Save the profile to the database
    const profileId = await saveProfileToDatabase(profile);
    
    console.log(`🎉 Scout Bot completed successfully! Profile ID: ${profileId}`);
    return profile;
  } catch (error) {
    console.error('❌ Scout Bot error:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Test the Scout Bot with a sample name
    const sampleName = 'Alex Mitchell';
    console.log(`🚀 Testing Scout Bot with sample name: ${sampleName}`);
    
    const result = await runScoutBot(sampleName);
    
    if (result) {
      console.log(`\n✅ Success! Scout Bot created a profile for ${sampleName}`);
      console.log(`Type: ${result.type}`);
      console.log(`Summary: ${result.summary}`);
      console.log(`Topics: ${result.influence_topics.join(', ')}`);
      console.log(`Media Mentions: ${result.media_mentions.length}`);
    } else {
      console.log(`\n❌ Scout Bot failed to create a profile for ${sampleName}`);
    }
  } catch (error) {
    console.error('Main error:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the main function
main();