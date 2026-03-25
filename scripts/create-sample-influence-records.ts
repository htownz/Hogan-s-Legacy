import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema-power-influencers';
import { 
  billTopicInfluence, 
  billInfluenceRecords,
  consultantClients,
  consultantCampaigns,
  influencerDonations
} from '../shared/schema-power-influencers';

const { Pool } = pg;
config();

async function main() {
  // Create and setup the database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const db = drizzle(pool, { schema });
  
  console.log('Creating sample influence records...');
  
  try {
    // Add bill topic influence for Alan Blackmore (consultant)
    const [economicDevTopic] = await db.insert(billTopicInfluence).values({
      influencerId: 1, // Alan Blackmore
      topic: "economic development",
      billsInfluenced: 12,
      totalSpent: 125000,
      successRate: 75,
      documented: true,
      influence: "support",
      influenceStrength: 8,
      firstActivity: new Date('2022-01-15'),
      lastActivity: new Date('2024-03-10')
    }).returning();
    
    console.log('Created bill topic influence:', economicDevTopic);
    
    const [campaignFinanceTopic] = await db.insert(billTopicInfluence).values({
      influencerId: 1, // Alan Blackmore
      topic: "campaign finance reform",
      billsInfluenced: 5,
      totalSpent: 75000,
      successRate: 40,
      documented: true,
      influence: "oppose",
      influenceStrength: 9,
      firstActivity: new Date('2021-02-20'),
      lastActivity: new Date('2023-11-05')
    }).returning();
    
    console.log('Created bill topic influence:', campaignFinanceTopic);
    
    // Add bill topic influence for Tillman Fertitta (mega_influencer)
    const [casinoTopic] = await db.insert(billTopicInfluence).values({
      influencerId: 2, // Tillman Fertitta
      topic: "casino legalization",
      billsInfluenced: 3,
      totalSpent: 750000,
      successRate: 33,
      documented: true,
      influence: "support",
      influenceStrength: 10,
      firstActivity: new Date('2021-09-10'),
      lastActivity: new Date('2024-02-28')
    }).returning();
    
    console.log('Created bill topic influence:', casinoTopic);
    
    const [taxBreaksTopic] = await db.insert(billTopicInfluence).values({
      influencerId: 2, // Tillman Fertitta
      topic: "hospitality industry tax breaks",
      billsInfluenced: 7,
      totalSpent: 425000,
      successRate: 85,
      documented: true,
      influence: "support",
      influenceStrength: 9,
      firstActivity: new Date('2020-05-15'),
      lastActivity: new Date('2024-01-20')
    }).returning();
    
    console.log('Created bill topic influence:', taxBreaksTopic);
    
    // Add bill influence records
    const [billRecord1] = await db.insert(billInfluenceRecords).values({
      influencerId: 1, // Alan Blackmore
      billId: "TX-HB0123", // Example bill ID that should exist in the database
      position: "oppose",
      activityType: "lobbying",
      amountSpent: 25000,
      activityDate: new Date('2023-03-10'),
      activityDescription: "Organized lobbying meetings with 5 key committee members to oppose bill.",
      successMetric: true, // bill was successfully stopped
      evidenceUrl: "https://example.com/lobbying-reports/2023/hb123",
      evidenceType: "lobbying disclosure",
      verified: true
    }).returning();
    
    console.log('Created bill influence record:', billRecord1);
    
    // Add clients for consultant
    const [client1] = await db.insert(consultantClients).values({
      consultantId: 1, // Alan Blackmore's consultant record
      clientName: "Texans for Business Growth PAC",
      clientType: "PAC",
      relationshipStart: new Date('2015-01-01'),
      relationshipEnd: null, // ongoing
      serviceDescription: "Campaign strategy, ad placement, and opposition research.",
      contractValue: 450000,
      clientImageUrl: "https://example.com/client-logos/tfbg.png",
      contractLink: "https://example.com/contracts/tfbg-2023",
      successRate: 80
    }).returning();
    
    console.log('Created consultant client:', client1);
    
    // Add campaign for consultant
    const [campaign1] = await db.insert(consultantCampaigns).values({
      consultantId: 1, // Alan Blackmore's consultant record
      campaignName: "Martinez for HD-115",
      candidateName: "Laura Martinez",
      office: "State Representative, HD-115",
      electionYear: 2022,
      electionCycle: "general",
      result: "won",
      campaignBudget: 750000,
      role: "Senior Strategist",
      highlightedAchievements: [
        "Increased voter turnout by 15% in key precincts",
        "Successfully managed $250,000 digital advertising budget",
        "Coordinated 25+ campaign events with over 5,000 total attendees"
      ]
    }).returning();
    
    console.log('Created consultant campaign:', campaign1);
    
    // Add donations for mega influencer
    const [donation1] = await db.insert(influencerDonations).values({
      influencerId: 2, // Tillman Fertitta
      recipientName: "Sen. Charles Young",
      recipientType: "candidate",
      amount: 100000,
      donationDate: new Date('2024-05-02'),
      electionCycle: "2024 Primary",
      donationMethod: "direct",
      reportUrl: "https://example.com/campaign-finance/cy-2024",
      donationPurpose: "Support for Senate candidate with favorable position on gaming legislation",
      declared: true
    }).returning();
    
    console.log('Created influencer donation:', donation1);
    
    console.log('Sample influence records created successfully!');
    
  } catch (error) {
    console.error('Error creating sample influence records:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);