import { Router } from "express";
import { z } from "zod";
import { advancedBillAnalysisService } from "./services/advanced-bill-analysis-service";

const router = Router();

// Validation schemas
const billAnalysisSchema = z.object({
  billText: z.string().min(100),
  billTitle: z.string().min(10),
  analysisType: z.enum(['impact', 'trends', 'complexity', 'summary']).optional()
});

// Comprehensive bill impact analysis
router.post("/analyze-impact", async (req, res) => {
  try {
    const { billText, billTitle } = billAnalysisSchema.parse(req.body);
    
    const analysis = await advancedBillAnalysisService.analyzeBillImpact(billText, billTitle);
    
    res.json({
      success: true,
      analysis,
      metadata: {
        billTitle,
        analyzedAt: new Date().toISOString(),
        analysisType: 'comprehensive_impact'
      }
    });
  } catch (error: any) {
    console.error("Error in impact analysis:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to analyze bill impact" });
    }
  }
});

// Legislative trend analysis
router.post("/analyze-trends", async (req, res) => {
  try {
    const { billText, billTitle } = billAnalysisSchema.parse(req.body);
    
    const trends = await advancedBillAnalysisService.analyzeLegislativeTrends(billText, billTitle);
    
    res.json({
      success: true,
      trends,
      metadata: {
        billTitle,
        analyzedAt: new Date().toISOString(),
        analysisType: 'legislative_trends'
      }
    });
  } catch (error: any) {
    console.error("Error in trend analysis:", error);
    res.status(500).json({ error: "Failed to analyze legislative trends" });
  }
});

// Bill complexity and readability analysis
router.post("/analyze-complexity", async (req, res) => {
  try {
    const { billText } = billAnalysisSchema.parse(req.body);
    
    const complexity = await advancedBillAnalysisService.analyzeBillComplexity(billText);
    
    res.json({
      success: true,
      complexity,
      metadata: {
        analyzedAt: new Date().toISOString(),
        analysisType: 'complexity_readability'
      }
    });
  } catch (error: any) {
    console.error("Error in complexity analysis:", error);
    res.status(500).json({ error: "Failed to analyze bill complexity" });
  }
});

// Generate shareable summary card
router.post("/generate-summary-card", async (req, res) => {
  try {
    const { billText, billTitle } = billAnalysisSchema.parse(req.body);
    
    const summaryCard = await advancedBillAnalysisService.generateBillSummaryCard(billText, billTitle);
    
    res.json({
      success: true,
      summaryCard,
      metadata: {
        billTitle,
        generatedAt: new Date().toISOString(),
        type: 'shareable_summary'
      }
    });
  } catch (error: any) {
    console.error("Error generating summary card:", error);
    res.status(500).json({ error: "Failed to generate summary card" });
  }
});

// Find similar bills using vector search
router.post("/find-similar", async (req, res) => {
  try {
    const { billText } = z.object({
      billText: z.string().min(50),
      limit: z.number().min(1).max(20).optional()
    }).parse(req.body);
    
    const limit = req.body.limit || 5;
    const similarBills = await advancedBillAnalysisService.findSimilarBills(billText, limit);
    
    res.json({
      success: true,
      similarBills,
      count: similarBills.length,
      metadata: {
        searchedAt: new Date().toISOString(),
        limit
      }
    });
  } catch (error: any) {
    console.error("Error finding similar bills:", error);
    res.status(500).json({ error: "Failed to find similar bills" });
  }
});

// Combined comprehensive analysis
router.post("/comprehensive-analysis", async (req, res) => {
  try {
    const { billText, billTitle } = billAnalysisSchema.parse(req.body);
    
    // Run multiple analyses in parallel
    const [impact, trends, complexity, summaryCard] = await Promise.all([
      advancedBillAnalysisService.analyzeBillImpact(billText, billTitle),
      advancedBillAnalysisService.analyzeLegislativeTrends(billText, billTitle),
      advancedBillAnalysisService.analyzeBillComplexity(billText),
      advancedBillAnalysisService.generateBillSummaryCard(billText, billTitle)
    ]);
    
    res.json({
      success: true,
      analysis: {
        impact,
        trends,
        complexity,
        summaryCard
      },
      metadata: {
        billTitle,
        analyzedAt: new Date().toISOString(),
        analysisType: 'comprehensive_all'
      }
    });
  } catch (error: any) {
    console.error("Error in comprehensive analysis:", error);
    res.status(500).json({ error: "Failed to perform comprehensive analysis" });
  }
});

// Analysis status and capabilities
router.get("/status", async (req, res) => {
  try {
    res.json({
      success: true,
      status: "operational",
      capabilities: {
        impactAnalysis: true,
        trendAnalysis: true,
        complexityAnalysis: true,
        summaryGeneration: true,
        similaritySearch: true,
        comprehensiveAnalysis: true
      },
      aiServices: {
        claude: process.env.ANTHROPIC_API_KEY ? "available" : "not_configured",
        pinecone: process.env.PINECONE_API_KEY ? "available" : "not_configured"
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error checking analysis status:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
});

export default router;