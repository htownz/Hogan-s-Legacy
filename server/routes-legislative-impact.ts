import { Request, Response, Express } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { bills } from "../shared/schema";
import { insertLegislativeImpactAnalysisSchema, legislativeImpactAnalyses } from "../shared/schema-legislative-impact";
import { generateLegislativeImpactAnalysis } from "./services/legislative-impact-analyzer";

// Define validation schema for personalized impact request
const personalizedImpactRequestSchema = z.object({
  demographics: z.object({
    age: z.string().optional(),
    income: z.string().optional(),
    location: z.string().optional(), 
    occupation: z.string().optional(),
    familySize: z.string().optional(),
    propertyOwner: z.boolean().optional(),
    businessOwner: z.boolean().optional(),
    interests: z.array(z.string()).optional(),
    taxBracket: z.string().optional(),
    education: z.string().optional(),
    sector: z.string().optional(),
    politicalLeaning: z.string().optional()
  })
});

// Define validation schema for bill comparison request
const billComparisonRequestSchema = z.object({
  billId1: z.string().min(1),
  billId2: z.string().min(1)
});

/**
 * Register routes for the legislative impact analysis feature
 */
export function registerLegislativeImpactRoutes(app: Express): void {
  /**
   * Get a legislative impact analysis for a specific bill
   */
  app.get("/api/legislative-impact/:billId", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      if (!billId) {
        return res.status(400).json({ error: "Bill ID is required" });
      }

      // First, check if we have an existing impact analysis for this bill
      const existingAnalysis = await db.query.legislativeImpactAnalyses.findFirst({
        where: eq(legislativeImpactAnalyses.billId, billId)
      });

      if (existingAnalysis) {
        // Return the existing analysis
        return res.json(existingAnalysis.analysis);
      }

      // If we don't have an analysis, we need to get the bill details first
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId)
      });

      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      // Generate the legislative impact analysis
      const analysisResult = await generateLegislativeImpactAnalysis(bill);
      
      // Save the analysis to the database
      const newAnalysis = await db.insert(legislativeImpactAnalyses).values({
        billId,
        analysis: analysisResult
      }).returning();

      // Return the analysis
      res.json(analysisResult);
    } catch (error: any) {
      console.error("Error getting legislative impact analysis:", error);
      res.status(500).json({ error: "Failed to get legislative impact analysis" });
    }
  });

  /**
   * Compare the legislative impact of two bills
   */
  app.get("/api/legislative-impact/compare", async (req: Request, res: Response) => {
    try {
      // Validate the request query
      const validation = billComparisonRequestSchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      const { billId1, billId2 } = validation.data;

      // Get analyses for both bills
      const analysis1 = await db.query.legislativeImpactAnalyses.findFirst({
        where: eq(legislativeImpactAnalyses.billId, billId1)
      });

      const analysis2 = await db.query.legislativeImpactAnalyses.findFirst({
        where: eq(legislativeImpactAnalyses.billId, billId2)
      });

      if (!analysis1 || !analysis2) {
        return res.status(404).json({ 
          error: "One or both analyses not found", 
          billId1Found: !!analysis1,
          billId2Found: !!analysis2
        });
      }

      // Here we would typically generate a comparison, but for now we'll send
      // a placeholder response for demonstration
      const mockComparison = {
        comparisonSummary: `Comparative analysis of Bills ${billId1} and ${billId2}`,
        impactScoreComparison: {
          overall: {
            difference: 1.5,
            analysis: "Bill " + billId2 + " has a higher overall impact score."
          },
          economic: {
            difference: 0.8,
            analysis: "Bill " + billId2 + " has a slightly higher economic impact."
          },
          social: {
            difference: 2.1,
            analysis: "Bill " + billId2 + " has a significantly higher social impact."
          },
          environmental: {
            difference: -0.5,
            analysis: "Bill " + billId1 + " has a slightly higher environmental impact."
          },
          legal: {
            difference: 1.2,
            analysis: "Bill " + billId2 + " has a higher legal impact."
          },
          governance: {
            difference: 0.3,
            analysis: "The governance impact is similar for both bills."
          }
        },
        stakeholderComparison: {
          commonBeneficiaries: ["Small business owners", "Middle-income families"],
          commonAdverselyAffected: ["Large corporations"],
          divergentImpacts: "Bill " + billId1 + " more positively impacts rural communities, while " + billId2 + " more positively impacts urban areas."
        },
        implementationComparison: {
          timeframeComparison: "Bill " + billId2 + " has a longer implementation timeframe due to its complexity.",
          feasibilityComparison: "Bill " + billId1 + " is more feasible to implement due to lower resource requirements.",
          resourceComparison: "Bill " + billId2 + " requires significantly more resources for implementation."
        },
        budgetaryComparison: {
          costDifference: "Bill " + billId2 + " is estimated to be 25% more costly.",
          fiscalImpactComparison: "Bill " + billId1 + " has a more sustainable fiscal impact due to fewer ongoing costs."
        },
        recommendationSynthesis: [
          "Consider the immediate needs versus long-term impact when choosing between these bills.",
          "If prioritizing economic growth, Bill " + billId2 + " may be preferred.",
          "If resource constraints are a concern, Bill " + billId1 + " may be more practical."
        ],
        conclusionStatement: "Both bills aim to address similar issues but with different approaches and tradeoffs."
      };

      res.json(mockComparison);
    } catch (error: any) {
      console.error("Error comparing legislative impact:", error);
      res.status(500).json({ error: "Failed to compare legislative impact" });
    }
  });

  /**
   * Get a personalized impact assessment for a bill based on user demographics
   */
  app.post("/api/legislative-impact/:billId/personalized", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Validate the request body
      const validation = personalizedImpactRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      // Get the bill's impact analysis
      const analysisRecord = await db.query.legislativeImpactAnalyses.findFirst({
        where: eq(legislativeImpactAnalyses.billId, billId)
      });

      if (!analysisRecord) {
        return res.status(404).json({ error: "Impact analysis not found for this bill" });
      }
      
      // The analysis is stored as a JSON object in the database
      const analysisData = analysisRecord.analysis as Record<string, any>;

      // In a real implementation, we would use the LLM to generate a personalized assessment
      // based on the user's demographics and the bill's impact analysis
      const userDemographics = validation.data.demographics;
      
      // For now, we'll return a placeholder response
      const personalizedImpact = {
        personalSummary: `Personalized impact assessment for this legislation based on your demographics as a ${userDemographics.age || "resident"} from ${userDemographics.location || "Texas"}.`,
        relevanceScore: 75,
        keyImpacts: [
          {
            area: "Property Taxes",
            description: userDemographics.propertyOwner 
              ? "As a property owner, you may see changes in your property tax rates."
              : "This bill has minimal direct impact on you as a non-property owner.",
            severity: userDemographics.propertyOwner ? 7 : 3,
            timeline: "Within 1-2 tax cycles"
          },
          {
            area: "Business Regulations",
            description: userDemographics.businessOwner 
              ? "As a business owner, you may need to adapt to new regulatory requirements."
              : "Changes to business regulations may indirectly affect employment opportunities.",
            severity: userDemographics.businessOwner ? 8 : 4,
            timeline: "6-12 months after implementation"
          },
          {
            area: "Local Services",
            description: `Based on your location in ${userDemographics.location || "Texas"}, you may see changes in local service funding.`,
            severity: 5,
            timeline: "Starting next fiscal year"
          }
        ],
        householdImpact: `For a household of ${userDemographics.familySize || "your"} size, this legislation may affect your access to certain services and potentially impact your household budget.`,
        financialImpact: {
          description: `Based on your income bracket (${userDemographics.income || "unspecified"}), this bill could have moderate financial implications.`,
          estimatedChange: userDemographics.income?.includes("under") 
            ? "Potential annual savings of $200-400"
            : userDemographics.income?.includes("150k") 
              ? "Potential additional annual costs of $500-700"
              : "Minimal financial impact expected"
        },
        recommendedActions: [
          {
            action: "Review your property tax assessment next year",
            benefit: "Ensure you're not overpaying if rates change"
          },
          {
            action: "Stay informed about implementation dates",
            benefit: "Be prepared for changes that directly affect you"
          },
          {
            action: "Consider contacting your local representative",
            benefit: "Voice your perspective on how this legislation affects you"
          }
        ],
        sentiment: userDemographics.propertyOwner && userDemographics.income?.includes("under")
          ? "positive"
          : userDemographics.businessOwner && userDemographics.income?.includes("150k")
            ? "negative"
            : "mixed"
      };

      res.json(personalizedImpact);
    } catch (error: any) {
      console.error("Error generating personalized impact:", error);
      res.status(500).json({ error: "Failed to generate personalized impact assessment" });
    }
  });

  /**
   * Get top bills by impact score (overall or specific dimension)
   */
  app.get("/api/legislative-impact/top-bills", async (req: Request, res: Response) => {
    try {
      const { dimension = "overall", limit = "10" } = req.query;
      
      // In a real implementation, we'd query the database for the top bills
      // For now, we'll return a placeholder response
      const topBills = [
        {
          billId: "TX-HB1234",
          title: "Relating to public school finance and property tax relief",
          category: "Education",
          impactScore: 9.2,
          summary: "Comprehensive reform of public school funding and property tax rates."
        },
        {
          billId: "TX-SB789",
          title: "Relating to healthcare access and insurance coverage",
          category: "Healthcare",
          impactScore: 8.7,
          summary: "Expands healthcare access and modifies insurance regulations."
        },
        {
          billId: "TX-HB456",
          title: "Relating to environmental regulations and renewable energy",
          category: "Environment",
          impactScore: 8.5,
          summary: "Updates environmental protection standards and renewable energy incentives."
        },
        {
          billId: "TX-SB321",
          title: "Relating to state infrastructure development",
          category: "Infrastructure",
          impactScore: 8.1,
          summary: "Major infrastructure development initiative focusing on transportation and utilities."
        },
        {
          billId: "TX-HB789",
          title: "Relating to criminal justice reform and rehabilitation",
          category: "Criminal Justice",
          impactScore: 7.9,
          summary: "Reforms sentencing guidelines and expands rehabilitation programs."
        }
      ];

      res.json(topBills);
    } catch (error: any) {
      console.error("Error getting top bills:", error);
      res.status(500).json({ error: "Failed to get top bills by impact" });
    }
  });

  /**
   * Get impact analysis statistics by bill categories/topics
   */
  app.get("/api/legislative-impact/stats/by-category", async (req: Request, res: Response) => {
    try {
      // In a real implementation, we'd aggregate statistics from the database
      // For now, we'll return a placeholder response
      const categoryStats = [
        {
          category: "Education",
          totalBills: 83,
          avgOverall: 7.8,
          avgEconomic: 8.1,
          avgSocial: 8.5,
          avgEnvironmental: 4.2,
          avgLegal: 6.9,
          avgGovernance: 7.4
        },
        {
          category: "Healthcare",
          totalBills: 64,
          avgOverall: 7.5,
          avgEconomic: 7.9,
          avgSocial: 8.7,
          avgEnvironmental: 3.8,
          avgLegal: 6.5,
          avgGovernance: 7.2
        },
        {
          category: "Environment",
          totalBills: 47,
          avgOverall: 6.9,
          avgEconomic: 5.8,
          avgSocial: 6.3,
          avgEnvironmental: 9.2,
          avgLegal: 7.1,
          avgGovernance: 6.8
        },
        {
          category: "Infrastructure",
          totalBills: 35,
          avgOverall: 7.2,
          avgEconomic: 8.3,
          avgSocial: 6.1,
          avgEnvironmental: 7.5,
          avgLegal: 5.9,
          avgGovernance: 7.0
        },
        {
          category: "Taxation",
          totalBills: 58,
          avgOverall: 7.7,
          avgEconomic: 9.1,
          avgSocial: 7.4,
          avgEnvironmental: 3.2,
          avgLegal: 7.3,
          avgGovernance: 8.2
        },
        {
          category: "Criminal Justice",
          totalBills: 42,
          avgOverall: 6.8,
          avgEconomic: 5.3,
          avgSocial: 8.6,
          avgEnvironmental: 2.1,
          avgLegal: 9.0,
          avgGovernance: 7.5
        },
        {
          category: "Business",
          totalBills: 69,
          avgOverall: 7.3,
          avgEconomic: 8.7,
          avgSocial: 6.8,
          avgEnvironmental: 4.9,
          avgLegal: 7.8,
          avgGovernance: 7.3
        }
      ];

      res.json(categoryStats);
    } catch (error: any) {
      console.error("Error getting category stats:", error);
      res.status(500).json({ error: "Failed to get impact statistics by category" });
    }
  });
}