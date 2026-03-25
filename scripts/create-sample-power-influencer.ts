import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema-power-influencers';
import { powerInfluencers, consultants } from '../shared/schema-power-influencers';

const { Pool } = pg;
config();

async function main() {
  // Create and setup the database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const db = drizzle(pool, { schema });
  
  console.log('Creating sample power influencer data...');
  
  try {
    // Insert sample power influencer
    const [newInfluencer] = await db.insert(powerInfluencers).values({
      name: "Alan Blackmore",
      type: "consultant",
      imageUrl: "https://example.com/blackmore.jpg",
      biography: "Political strategist with over 15 years of experience in Texas politics.",
      title: "Founder & Principal Consultant",
      organization: "Blackmore Strategies",
      website: "https://blackmorestrategies.com",
      email: "alan@blackmorestrategies.com",
      phone: "512-555-1234",
      socialMedia: {
        twitter: "@alanblackmore",
        linkedin: "alan-blackmore"
      },
      active: true,
      influenceScore: 85,
      policyAreas: ["economic development", "campaign finance reform", "education"],
      lastUpdated: new Date()
    }).returning();
    
    console.log('Created power influencer:', newInfluencer);
    
    // Insert consultant details
    const [newConsultant] = await db.insert(consultants).values({
      influencerId: newInfluencer.id,
      firm: "Blackmore Strategies",
      certifications: ["AAPC", "TPCB"],
      specialties: ["Campaign Management", "Opposition Research", "Media Relations"],
      consultingFocus: ["State Legislative Races", "PAC Strategy", "Corporate Advocacy"],
      yearsActive: 15,
      averageContractSize: 75000,
      registeredLobbyist: true,
      transparencyRating: 65
    }).returning();
    
    console.log('Created consultant:', newConsultant);
    
    console.log('Sample power influencer data created successfully!');
    
  } catch (error) {
    console.error('Error creating sample power influencer data:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);