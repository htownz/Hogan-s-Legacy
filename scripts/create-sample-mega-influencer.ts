import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema-power-influencers';
import { powerInfluencers, megaInfluencers } from '../shared/schema-power-influencers';

const { Pool } = pg;
config();

async function main() {
  // Create and setup the database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const db = drizzle(pool, { schema });
  
  console.log('Creating sample mega influencer data...');
  
  try {
    // Insert sample power influencer (mega_influencer type)
    const [newInfluencer] = await db.insert(powerInfluencers).values({
      name: "Tillman Fertitta",
      type: "mega_influencer",
      imageUrl: "https://example.com/fertitta.jpg",
      biography: "Billionaire businessman, entertainer, and Texas power player with extensive influence across hospitality, gaming, and real estate.",
      title: "Chairman & CEO",
      organization: "Fertitta Entertainment",
      website: "https://landrysinc.com",
      email: "tfertitta@landrysinc.com",
      phone: "713-555-7890",
      socialMedia: {
        twitter: "@TillmanFertitta",
        linkedin: "tillman-fertitta"
      },
      active: true,
      influenceScore: 95,
      policyAreas: ["casino legalization", "real estate incentives", "hospitality industry tax breaks", "tourism development"],
      lastUpdated: new Date()
    }).returning();
    
    console.log('Created power influencer:', newInfluencer);
    
    // Insert mega influencer details
    const [newMegaInfluencer] = await db.insert(megaInfluencers).values({
      influencerId: newInfluencer.id,
      netWorth: 8500000000, // $8.5 billion
      companies: [
        {
          name: "Landry's Inc.",
          role: "CEO",
          ownership: 100
        },
        {
          name: "Golden Nugget Casinos",
          role: "Owner",
          ownership: 100
        },
        {
          name: "Houston Rockets",
          role: "Owner",
          ownership: 100
        }
      ],
      industryFocus: ["Hospitality", "Entertainment", "Gaming", "Sports", "Real Estate"],
      politicalAffiliation: "Bipartisan with Republican lean",
      influenceRadius: "national",
      philanthropicFocus: ["Education", "Healthcare", "Community Development"],
      totalDonations: 3750000, // $3.75 million in political donations
      transparencyRating: 55
    }).returning();
    
    console.log('Created mega influencer:', newMegaInfluencer);
    
    console.log('Sample mega influencer data created successfully!');
    
  } catch (error) {
    console.error('Error creating sample mega influencer data:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);