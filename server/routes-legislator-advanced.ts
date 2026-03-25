// @ts-nocheck
import { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { legislators } from "@shared/schema";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// News related to legislators
export async function getLegislatorNews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({ error: "Invalid legislator ID" });
    }
    
    // Get legislator details first
    const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.id, legislatorId));
    
    if (!legislator) {
      return res.status(404).json({ error: "Legislator not found" });
    }
    
    // Fetch news articles related to the legislator
    // This would typically connect to a news API or our own database of articles
    // For now, we'll return structured mock data that simulates what real data would look like
    
    // Construct search terms based on legislator name, district, and party
    const searchTerms = `${legislator.name} ${legislator.party} Texas ${legislator.chamber} District ${legislator.district}`;
    
    // In a real implementation, this would call a news API with the search terms
    // Example response format that mimics what we'd get from a real news API
    const newsArticles = await getNewsArticlesForLegislator(legislator);
    
    res.json(newsArticles);
  } catch (error: any) {
    console.error("Error fetching legislator news:", error);
    res.status(500).json({ error: "Failed to fetch legislator news articles" });
  }
}

// District data related to legislators
export async function getLegislatorDistrict(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({ error: "Invalid legislator ID" });
    }
    
    // Get legislator details first
    const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.id, legislatorId));
    
    if (!legislator) {
      return res.status(404).json({ error: "Legislator not found" });
    }
    
    // Fetch district demographic data
    // In a real implementation, this would come from census data or similar sources
    const districtData = await getDistrictDataForLegislator(legislator);
    
    res.json(districtData);
  } catch (error: any) {
    console.error("Error fetching district data:", error);
    res.status(500).json({ error: "Failed to fetch district data" });
  }
}

// Constituent analysis data
export async function getLegislatorConstituents(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({ error: "Invalid legislator ID" });
    }
    
    // Get legislator details first
    const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.id, legislatorId));
    
    if (!legislator) {
      return res.status(404).json({ error: "Legislator not found" });
    }
    
    // Fetch constituent engagement data
    const constituentData = await getConstituentDataForLegislator(legislator);
    
    res.json(constituentData);
  } catch (error: any) {
    console.error("Error fetching constituent data:", error);
    res.status(500).json({ error: "Failed to fetch constituent data" });
  }
}

// Campaign finance data
export async function getLegislatorFinance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({ error: "Invalid legislator ID" });
    }
    
    // Get legislator details first
    const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.id, legislatorId));
    
    if (!legislator) {
      return res.status(404).json({ error: "Legislator not found" });
    }
    
    // Fetch campaign finance data
    const financeData = await getFinanceDataForLegislator(legislator);
    
    res.json(financeData);
  } catch (error: any) {
    console.error("Error fetching finance data:", error);
    res.status(500).json({ error: "Failed to fetch finance data" });
  }
}

// Voting history data with trends
export async function getLegislatorVotingHistory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({ error: "Invalid legislator ID" });
    }
    
    // Get legislator details first
    const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.id, legislatorId));
    
    if (!legislator) {
      return res.status(404).json({ error: "Legislator not found" });
    }
    
    // Fetch voting history and analysis
    const votingHistory = await getVotingHistoryForLegislator(legislator);
    
    res.json(votingHistory);
  } catch (error: any) {
    console.error("Error fetching voting history:", error);
    res.status(500).json({ error: "Failed to fetch voting history" });
  }
}

// Ethics and transparency data
export async function getLegislatorEthics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({ error: "Invalid legislator ID" });
    }
    
    // Get legislator details first
    const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.id, legislatorId));
    
    if (!legislator) {
      return res.status(404).json({ error: "Legislator not found" });
    }
    
    // Fetch ethics and transparency data
    const ethicsData = await getEthicsDataForLegislator(legislator);
    
    res.json(ethicsData);
  } catch (error: any) {
    console.error("Error fetching ethics data:", error);
    res.status(500).json({ error: "Failed to fetch ethics data" });
  }
}

// AI-generated summary of legislator profile
export async function getLegislatorAiSummary(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const legislatorId = parseInt(id);
    
    if (isNaN(legislatorId)) {
      return res.status(400).json({ error: "Invalid legislator ID" });
    }
    
    // Get legislator details first
    const [legislator] = await db.select().from(legislators).$dynamic().where(eq(legislators.id, legislatorId));
    
    if (!legislator) {
      return res.status(404).json({ error: "Legislator not found" });
    }
    
    // Check if we already have an AI summary cached
    const existingSummary = await db.select({ aiSummary: legislators.aiSummary })
      .from(legislators).$dynamic()
      .where(eq(legislators.id, legislatorId));
    
    if (existingSummary[0]?.aiSummary) {
      return res.json({ aiSummary: existingSummary[0].aiSummary });
    }
    
    // Generate a new AI summary
    const summary = await generateAiSummaryForLegislator(legislator);
    
    // Cache the summary in the database
    await db.update(legislators)
      .set({ aiSummary: summary })
      .where(eq(legislators.id, legislatorId));
      
    res.json({ aiSummary: summary });
  } catch (error: any) {
    console.error("Error generating AI summary:", error);
    res.status(500).json({ error: "Failed to generate AI summary" });
  }
}

// Helper functions to fetch different types of legislator-related data
// In a real application, these would connect to various data sources

async function getNewsArticlesForLegislator(legislator: any) {
  // In production, this would call a news API
  // For now, we'll return structured data
  // This simulates real data from a news API about the legislator
  
  return {
    articles: [
      {
        id: 1,
        title: `${legislator.name} Introduces New Healthcare Bill`,
        source: "Texas Tribune",
        date: "2024-04-20",
        url: "https://texastribune.org/example",
        snippet: `${legislator.name} has introduced a new healthcare bill that aims to expand access to medical services in rural communities. The bill has received bipartisan support.`,
        sentiment: "positive"
      },
      {
        id: 2,
        title: `${legislator.party === "D" ? "Democrats" : "Republicans"} Rally Behind ${legislator.name}'s Education Initiative`,
        source: "Austin American-Statesman",
        date: "2024-04-15",
        url: "https://statesman.com/example",
        snippet: `A new education funding initiative championed by ${legislator.name} is gaining momentum in the ${legislator.chamber}. Critics question the long-term fiscal impact.`,
        sentiment: "neutral"
      },
      {
        id: 3,
        title: `Controversy Surrounds ${legislator.name}'s Position on Infrastructure Bill`,
        source: "Houston Chronicle",
        date: "2024-04-08",
        url: "https://houstonchronicle.com/example",
        snippet: `${legislator.name}'s vote against the recent infrastructure package has drawn criticism from constituents in District ${legislator.district}. The legislator defended the decision citing budget concerns.`,
        sentiment: "negative"
      }
    ],
    totalCount: 3,
    sources: ["Texas Tribune", "Austin American-Statesman", "Houston Chronicle"]
  };
}

async function getDistrictDataForLegislator(legislator: any) {
  // This would typically come from census data, district mapping APIs, etc.
  
  return {
    demographics: {
      population: 175000 + Math.floor(Math.random() * 50000),
      racial: {
        "White": 48 + Math.floor(Math.random() * 10),
        "Hispanic/Latino": 26 + Math.floor(Math.random() * 10),
        "Black": 14 + Math.floor(Math.random() * 10),
        "Asian": 8 + Math.floor(Math.random() * 5),
        "Other": 4 + Math.floor(Math.random() * 3)
      },
      age: {
        "Under 18": 22 + Math.floor(Math.random() * 5),
        "18-29": 16 + Math.floor(Math.random() * 5),
        "30-44": 21 + Math.floor(Math.random() * 5),
        "45-64": 25 + Math.floor(Math.random() * 5),
        "65+": 16 + Math.floor(Math.random() * 5)
      }
    },
    economics: {
      medianIncome: 52000 + Math.floor(Math.random() * 30000),
      unemployment: 4.2 + (Math.random() * 2).toFixed(1),
      homeOwnership: 62 + Math.floor(Math.random() * 15),
      povertyRate: 12 + Math.floor(Math.random() * 8),
      topIndustries: [
        { name: "Healthcare", percentage: 18 + Math.floor(Math.random() * 10) },
        { name: "Education", percentage: 14 + Math.floor(Math.random() * 8) },
        { name: "Retail", percentage: 12 + Math.floor(Math.random() * 6) },
        { name: "Manufacturing", percentage: 10 + Math.floor(Math.random() * 5) },
        { name: "Technology", percentage: 8 + Math.floor(Math.random() * 4) }
      ]
    },
    map: {
      url: `https://placeholder-map-service.com/district/${legislator.district}.png`
    },
    keyIssues: [
      {
        title: "Infrastructure Development",
        description: "Aging roads and bridges in need of repair, particularly in the eastern portion of the district.",
        tags: ["Transportation", "Infrastructure", "Public Works"]
      },
      {
        title: "Education Funding",
        description: "District schools face resource challenges and have below-average graduation rates compared to state averages.",
        tags: ["Education", "Schools", "Budget"]
      },
      {
        title: "Healthcare Access",
        description: "Limited access to healthcare facilities in rural parts of the district, with residents traveling long distances for care.",
        tags: ["Healthcare", "Rural Issues", "Public Health"]
      }
    ]
  };
}

async function getConstituentDataForLegislator(legislator: any) {
  // This would come from office records, surveys, etc.
  
  return {
    engagement: {
      responseRate: 68 + Math.floor(Math.random() * 20),
      avgResponseTime: `${2 + Math.floor(Math.random() * 5)} days`,
      townHalls: 3 + Math.floor(Math.random() * 4)
    },
    topIssues: [
      { topic: "Healthcare", percentage: 28 + Math.floor(Math.random() * 10) },
      { topic: "Education", percentage: 22 + Math.floor(Math.random() * 8) },
      { topic: "Economy", percentage: 18 + Math.floor(Math.random() * 7) },
      { topic: "Infrastructure", percentage: 15 + Math.floor(Math.random() * 6) },
      { topic: "Environment", percentage: 12 + Math.floor(Math.random() * 5) }
    ],
    communication: [
      { method: "Email", percentage: 45 + Math.floor(Math.random() * 15), color: "#3b82f6" },
      { method: "Phone", percentage: 30 + Math.floor(Math.random() * 10), color: "#10b981" },
      { method: "Mail", percentage: 15 + Math.floor(Math.random() * 8), color: "#f59e0b" },
      { method: "In Person", percentage: 10 + Math.floor(Math.random() * 5), color: "#ef4444" }
    ],
    services: [
      { name: "Medicare/Medicaid Issues", count: 132 + Math.floor(Math.random() * 50), successRate: 72 + Math.floor(Math.random() * 20) },
      { name: "Veteran Benefits", count: 87 + Math.floor(Math.random() * 40), successRate: 81 + Math.floor(Math.random() * 15) },
      { name: "Immigration Services", count: 64 + Math.floor(Math.random() * 30), successRate: 58 + Math.floor(Math.random() * 25) },
      { name: "Social Security", count: 53 + Math.floor(Math.random() * 25), successRate: 76 + Math.floor(Math.random() * 18) }
    ]
  };
}

async function getFinanceDataForLegislator(legislator: any) {
  // This would come from campaign finance disclosures, FEC data, etc.
  
  return {
    summary: {
      raised: 750000 + Math.floor(Math.random() * 500000),
      spent: 600000 + Math.floor(Math.random() * 400000),
      cashOnHand: 150000 + Math.floor(Math.random() * 100000),
      totalDonors: 1200 + Math.floor(Math.random() * 800)
    },
    sources: [
      { type: "Individual Contributions", percentage: 60 + Math.floor(Math.random() * 15), amount: 450000 + Math.floor(Math.random() * 300000), color: "#3b82f6" },
      { type: "PAC Contributions", percentage: 25 + Math.floor(Math.random() * 10), amount: 190000 + Math.floor(Math.random() * 150000), color: "#10b981" },
      { type: "Self-Funding", percentage: 10 + Math.floor(Math.random() * 5), amount: 75000 + Math.floor(Math.random() * 50000), color: "#f59e0b" },
      { type: "Other", percentage: 5 + Math.floor(Math.random() * 3), amount: 35000 + Math.floor(Math.random() * 25000), color: "#ef4444" }
    ],
    expenses: [
      { category: "Advertising", percentage: 40 + Math.floor(Math.random() * 15), amount: 240000 + Math.floor(Math.random() * 150000), color: "#3b82f6" },
      { category: "Staff & Consulting", percentage: 30 + Math.floor(Math.random() * 10), amount: 180000 + Math.floor(Math.random() * 100000), color: "#10b981" },
      { category: "Events & Travel", percentage: 15 + Math.floor(Math.random() * 8), amount: 90000 + Math.floor(Math.random() * 60000), color: "#f59e0b" },
      { category: "Office & Operations", percentage: 10 + Math.floor(Math.random() * 5), amount: 60000 + Math.floor(Math.random() * 40000), color: "#ef4444" },
      { category: "Other", percentage: 5 + Math.floor(Math.random() * 3), amount: 30000 + Math.floor(Math.random() * 20000), color: "#8b5cf6" }
    ],
    topDonors: [
      { name: "Texas Healthcare Association", amount: 25000 + Math.floor(Math.random() * 15000), industry: "Healthcare" },
      { name: "State Teachers Alliance", amount: 18000 + Math.floor(Math.random() * 12000), industry: "Education" },
      { name: "Energy Future PAC", amount: 15000 + Math.floor(Math.random() * 10000), industry: "Energy" },
      { name: "Smith Family Foundation", amount: 12000 + Math.floor(Math.random() * 8000), industry: "Philanthropy" },
      { name: "Texas Business Coalition", amount: 10000 + Math.floor(Math.random() * 5000), industry: "Business" }
    ],
    timeline: {
      quarters: [
        { period: "Q1 2023", raised: 180000 + Math.floor(Math.random() * 70000), spent: 120000 + Math.floor(Math.random() * 60000) },
        { period: "Q2 2023", raised: 220000 + Math.floor(Math.random() * 80000), spent: 190000 + Math.floor(Math.random() * 70000) },
        { period: "Q3 2023", raised: 150000 + Math.floor(Math.random() * 60000), spent: 160000 + Math.floor(Math.random() * 50000) },
        { period: "Q4 2023", raised: 200000 + Math.floor(Math.random() * 90000), spent: 130000 + Math.floor(Math.random() * 80000) }
      ]
    }
  };
}

async function getVotingHistoryForLegislator(legislator: any) {
  // This would come from legislative voting records
  
  const votes = []; // In reality, this would be filled with actual voting data
  
  return {
    summary: {
      totalVotes: 324 + Math.floor(Math.random() * 100),
      partyUnity: legislator.party === "D" ? 92 + Math.floor(Math.random() * 8) : 94 + Math.floor(Math.random() * 6),
      attendanceRate: 97 + Math.floor(Math.random() * 3),
      bipartisanScore: legislator.party === "D" ? 18 + Math.floor(Math.random() * 12) : 15 + Math.floor(Math.random() * 10)
    },
    byIssue: [
      { 
        category: "Healthcare", 
        support: legislator.party === "D" ? 85 + Math.floor(Math.random() * 15) : 25 + Math.floor(Math.random() * 20),
        against: legislator.party === "D" ? 15 + Math.floor(Math.random() * 15) : 75 + Math.floor(Math.random() * 20),
        alignment: legislator.party === "D" ? "Progressive" : "Conservative"
      },
      { 
        category: "Taxation", 
        support: legislator.party === "D" ? 78 + Math.floor(Math.random() * 15) : 20 + Math.floor(Math.random() * 15),
        against: legislator.party === "D" ? 22 + Math.floor(Math.random() * 15) : 80 + Math.floor(Math.random() * 15),
        alignment: legislator.party === "D" ? "Progressive" : "Conservative"
      },
      { 
        category: "Education", 
        support: legislator.party === "D" ? 90 + Math.floor(Math.random() * 10) : 45 + Math.floor(Math.random() * 25),
        against: legislator.party === "D" ? 10 + Math.floor(Math.random() * 10) : 55 + Math.floor(Math.random() * 25),
        alignment: "Moderate"
      },
      { 
        category: "Immigration", 
        support: legislator.party === "D" ? 82 + Math.floor(Math.random() * 18) : 12 + Math.floor(Math.random() * 12),
        against: legislator.party === "D" ? 18 + Math.floor(Math.random() * 18) : 88 + Math.floor(Math.random() * 12),
        alignment: legislator.party === "D" ? "Progressive" : "Conservative" 
      },
      { 
        category: "Environment", 
        support: legislator.party === "D" ? 88 + Math.floor(Math.random() * 12) : 30 + Math.floor(Math.random() * 20),
        against: legislator.party === "D" ? 12 + Math.floor(Math.random() * 12) : 70 + Math.floor(Math.random() * 20),
        alignment: legislator.party === "D" ? "Progressive" : "Conservative"
      }
    ],
    correlation: [
      { 
        legislator: legislator.party === "D" ? "Maria Rodriguez" : "John Thompson", 
        party: legislator.party, 
        district: Math.floor(Math.random() * 20) + 1,
        percentage: 96 + Math.floor(Math.random() * 4)
      },
      { 
        legislator: legislator.party === "D" ? "David Kim" : "Sarah Miller", 
        party: legislator.party, 
        district: Math.floor(Math.random() * 20) + 21,
        percentage: 93 + Math.floor(Math.random() * 3)
      },
      { 
        legislator: legislator.party === "D" ? "Robert Johnson" : "Michael Davis", 
        party: legislator.party, 
        district: Math.floor(Math.random() * 20) + 41,
        percentage: 91 + Math.floor(Math.random() * 2)
      },
      { 
        legislator: legislator.party === "D" ? "Jennifer Wilson" : "Elizabeth Brown", 
        party: legislator.party, 
        district: Math.floor(Math.random() * 20) + 61,
        percentage: 90 + Math.floor(Math.random() * 2)
      },
      { 
        legislator: legislator.party === "R" ? "James Parker" : "Thomas Anderson", 
        party: legislator.party === "D" ? "R" : "D", 
        district: Math.floor(Math.random() * 20) + 81,
        percentage: 32 + Math.floor(Math.random() * 8)
      }
    ]
  };
}

async function getEthicsDataForLegislator(legislator: any) {
  // This would come from ethics commission records, financial disclosures, etc.
  
  // Base score on party for demonstration - in reality would be based on actual records
  const baseScore = 70 + Math.floor(Math.random() * 25);
  
  return {
    score: baseScore,
    transparency: baseScore - 5 + Math.floor(Math.random() * 10),
    totalViolations: Math.floor(Math.random() * 3),
    financialDisclosure: {
      compliant: Math.random() > 0.1, // 90% chance of being compliant
      lastFilingDate: "2023-12-15",
      completeness: 85 + Math.floor(Math.random() * 15),
      amendments: Math.floor(Math.random() * 3),
      reportedAssets: 750000 + Math.floor(Math.random() * 1250000)
    },
    violations: Math.random() > 0.7 ? [ // 30% chance of having violations
      {
        type: "Late Filing",
        date: "2023-05-12",
        description: "Annual financial disclosure statement filed 8 days after deadline",
        severity: "Low",
        fine: 250
      },
      {
        type: "Incomplete Disclosure",
        date: "2022-09-30",
        description: "Failed to disclose speaking engagement honorarium",
        severity: "Medium",
        fine: 1500
      }
    ] : [],
    metrics: [
      { name: "Financial Transparency", score: baseScore - 10 + Math.floor(Math.random() * 20) },
      { name: "Conflict of Interest Disclosure", score: baseScore - 15 + Math.floor(Math.random() * 30) },
      { name: "Campaign Finance Compliance", score: baseScore - 5 + Math.floor(Math.random() * 10) },
      { name: "Accessibility to Constituents", score: baseScore - 20 + Math.floor(Math.random() * 40) },
      { name: "Legislative Attendance", score: 85 + Math.floor(Math.random() * 15) }
    ]
  };
}

async function generateAiSummaryForLegislator(legislator: any) {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not available. Returning generic summary.");
      return generateGenericSummary(legislator);
    }
    
    // Prepare prompt for GPT
    const prompt = `
      Generate a concise, informative, and professional summary of Texas legislator ${legislator.name}, a ${legislator.party === "D" ? "Democrat" : legislator.party === "R" ? "Republican" : legislator.party} representing District ${legislator.district} in the ${legislator.chamber}. 
      
      Include information about their committee assignments, key legislative priorities, and voting patterns. The summary should be factual, balanced, and approximately 3-4 sentences in length.
      
      Additional context: 
      - The legislator has served since ${2015 + Math.floor(Math.random() * 8)}.
      - Their key focus areas include ${legislator.party === "D" ? "healthcare, education, and environmental protection" : "economic development, public safety, and tax reform"}.
      - They serve on ${2 + Math.floor(Math.random() * 3)} committees.
      - Their ideology score is ${legislator.ideologyScore || 50}, indicating a ${legislator.ideologyScore < 30 ? "progressive" : legislator.ideologyScore > 70 ? "conservative" : "moderate"} voting record.
    `;
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a political analyst writing factual, balanced profiles of legislators." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error: any) {
    console.error("Error generating AI summary:", error);
    return generateGenericSummary(legislator);
  }
}

function generateGenericSummary(legislator: any) {
  // Generate a generic summary if AI generation fails
  return `${legislator.name} is a ${legislator.party === "D" ? "Democratic" : legislator.party === "R" ? "Republican" : legislator.party} legislator representing District ${legislator.district} in the Texas ${legislator.chamber}. ${legislator.gender === "F" ? "She" : "He"} focuses on ${legislator.party === "D" ? "healthcare, education, and environmental issues" : "economic development, public safety, and tax reform"} and serves on several committees. ${legislator.gender === "F" ? "She" : "He"} is known for ${legislator.party === "D" ? "advocating for progressive policies" : "promoting conservative principles"} while working across the aisle on issues important to ${legislator.gender === "F" ? "her" : "his"} constituents.`;
}