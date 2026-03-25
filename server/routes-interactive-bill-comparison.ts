// @ts-nocheck
import express from 'express';
import { Request, Response } from 'express';
import { storage } from './storage';

const router = express.Router();

interface BillComparisonMetrics {
  similarity: number;
  differences: string[];
  commonElements: string[];
  conflictingProvisions: string[];
  detailedAnalysis: string;
}

/**
 * Interactive Bill Comparison API Routes
 * Provides bill comparison analysis with AI-powered insights
 */

// Compare multiple bills and provide analysis
router.post('/api/bills/compare', async (req: Request, res: Response) => {
  try {
    const { billIds } = req.body;
    
    if (!billIds || !Array.isArray(billIds) || billIds.length < 2) {
      return res.status(400).json({
        error: 'Please provide at least 2 bill IDs for comparison'
      });
    }

    if (billIds.length > 3) {
      return res.status(400).json({
        error: 'Maximum 3 bills can be compared at once'
      });
    }

    console.log(`🔍 Comparing ${billIds.length} bills: ${billIds.join(', ')}`);

    // Fetch the bills from storage
    const bills = await Promise.all(
      billIds.map(async (id: string) => {
        const bill = await storage.getBillById(id);
        if (!bill) {
          throw new Error(`Bill with ID ${id} not found`);
        }
        return bill;
      })
    );

    // Perform comparison analysis
    const comparisonMetrics = await performBillComparison(bills);

    console.log(`✅ Bill comparison completed for ${bills.length} bills`);

    res.json({
      success: true,
      bills: bills,
      metrics: comparisonMetrics,
      comparedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in bill comparison:', error.message);
    res.status(500).json({
      error: 'Failed to compare bills',
      details: error.message
    });
  }
});

// Get bill comparison analysis using GET method with query params
router.get('/api/bills/compare', async (req: Request, res: Response) => {
  try {
    const billIds = req.query.ids;
    
    if (!billIds) {
      return res.status(400).json({
        error: 'Please provide bill IDs as query parameter: ?ids=bill1,bill2'
      });
    }

    const billIdArray = typeof billIds === 'string' ? billIds.split(',') : [];
    
    if (billIdArray.length < 2) {
      return res.status(400).json({
        error: 'Please provide at least 2 bill IDs for comparison'
      });
    }

    console.log(`🔍 Comparing bills via GET: ${billIdArray.join(', ')}`);

    // Fetch the bills from storage
    const bills = await Promise.all(
      billIdArray.map(async (id: string) => {
        const bill = await storage.getBillById(id.trim());
        if (!bill) {
          throw new Error(`Bill with ID ${id} not found`);
        }
        return bill;
      })
    );

    // Perform comparison analysis
    const comparisonMetrics = await performBillComparison(bills);

    res.json({
      success: true,
      bills: bills,
      metrics: comparisonMetrics,
      comparedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in bill comparison:', error.message);
    res.status(500).json({
      error: 'Failed to compare bills',
      details: error.message
    });
  }
});

// Enhanced bill similarity analysis
router.get('/api/bills/:id1/similarity/:id2', async (req: Request, res: Response) => {
  try {
    const { id1, id2 } = req.params;
    
    console.log(`🔍 Analyzing similarity between bills ${id1} and ${id2}`);

    const bill1 = await storage.getBillById(id1);
    const bill2 = await storage.getBillById(id2);

    if (!bill1 || !bill2) {
      return res.status(404).json({
        error: 'One or both bills not found'
      });
    }

    const similarityScore = calculateBillSimilarity(bill1, bill2);
    const detailedAnalysis = await generateDetailedComparison(bill1, bill2);

    res.json({
      success: true,
      similarity: similarityScore,
      bill1: {
        id: bill1.id,
        number: bill1.number,
        title: bill1.title
      },
      bill2: {
        id: bill2.id,
        number: bill2.number,
        title: bill2.title
      },
      analysis: detailedAnalysis,
      comparedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in similarity analysis:', error.message);
    res.status(500).json({
      error: 'Failed to analyze bill similarity',
      details: error.message
    });
  }
});

/**
 * Core comparison logic functions
 */

async function performBillComparison(bills: any[]): Promise<BillComparisonMetrics> {
  try {
    // Calculate overall similarity when comparing multiple bills
    let totalSimilarity = 0;
    let comparisonCount = 0;

    // Compare each bill with every other bill
    for (let i = 0; i < bills.length; i++) {
      for (let j = i + 1; j < bills.length; j++) {
        const similarity = calculateBillSimilarity(bills[i], bills[j]);
        totalSimilarity += similarity;
        comparisonCount++;
      }
    }

    const averageSimilarity = comparisonCount > 0 ? Math.round(totalSimilarity / comparisonCount) : 0;

    // Extract common elements and differences
    const commonElements = findCommonElements(bills);
    const differences = findKeyDifferences(bills);
    const conflictingProvisions = findConflictingProvisions(bills);

    // Generate detailed analysis
    const detailedAnalysis = await generateDetailedAnalysis(bills);

    return {
      similarity: averageSimilarity,
      commonElements,
      differences,
      conflictingProvisions,
      detailedAnalysis
    };

  } catch (error: any) {
    console.error('Error in bill comparison analysis:', error);
    return {
      similarity: 0,
      differences: ['Analysis unavailable'],
      commonElements: [],
      conflictingProvisions: [],
      detailedAnalysis: 'Detailed analysis could not be completed'
    };
  }
}

function calculateBillSimilarity(bill1: any, bill2: any): number {
  try {
    let similarityScore = 0;
    let factors = 0;

    // Compare sponsors (same sponsor = higher similarity)
    if (bill1.sponsor && bill2.sponsor) {
      if (bill1.sponsor === bill2.sponsor) similarityScore += 20;
      factors++;
    }

    // Compare party affiliation
    if (bill1.party && bill2.party) {
      if (bill1.party === bill2.party) similarityScore += 15;
      factors++;
    }

    // Compare chamber
    if (bill1.chamber && bill2.chamber) {
      if (bill1.chamber === bill2.chamber) similarityScore += 10;
      factors++;
    }

    // Compare categories/subjects
    if (bill1.category && bill2.category) {
      if (bill1.category === bill2.category) similarityScore += 25;
      factors++;
    }

    // Compare keywords overlap
    if (bill1.keywords && bill2.keywords && Array.isArray(bill1.keywords) && Array.isArray(bill2.keywords)) {
      const commonKeywords = bill1.keywords.filter((keyword: string) => 
        bill2.keywords.includes(keyword)
      );
      const keywordSimilarity = (commonKeywords.length / Math.max(bill1.keywords.length, bill2.keywords.length)) * 30;
      similarityScore += keywordSimilarity;
      factors++;
    }

    // Normalize score based on available factors
    return factors > 0 ? Math.round(similarityScore / factors * (100 / 100)) : 0;

  } catch (error: any) {
    console.error('Error calculating bill similarity:', error);
    return 0;
  }
}

function findCommonElements(bills: any[]): string[] {
  try {
    const commonElements: string[] = [];

    // Find common sponsors
    const sponsors = bills.map(bill => bill.sponsor).filter(Boolean);
    const uniqueSponsors = [...new Set(sponsors)];
    if (uniqueSponsors.length < bills.length && uniqueSponsors.length > 0) {
      commonElements.push(`Common sponsor: ${uniqueSponsors[0]}`);
    }

    // Find common chambers
    const chambers = bills.map(bill => bill.chamber).filter(Boolean);
    if (new Set(chambers).size === 1 && chambers.length > 1) {
      commonElements.push(`All bills from ${chambers[0]} chamber`);
    }

    // Find common party affiliation
    const parties = bills.map(bill => bill.party).filter(Boolean);
    if (new Set(parties).size === 1 && parties.length > 1) {
      commonElements.push(`All sponsored by ${parties[0]} party members`);
    }

    // Find common keywords
    if (bills.length >= 2 && bills.every(bill => bill.keywords && Array.isArray(bill.keywords))) {
      const commonKeywords = bills[0].keywords.filter((keyword: string) =>
        bills.every(bill => bill.keywords.includes(keyword))
      );
      
      if (commonKeywords.length > 0) {
        commonElements.push(`Shared topics: ${commonKeywords.slice(0, 3).join(', ')}`);
      }
    }

    return commonElements.length > 0 ? commonElements : ['No significant common elements identified'];

  } catch (error: any) {
    console.error('Error finding common elements:', error);
    return ['Analysis unavailable'];
  }
}

function findKeyDifferences(bills: any[]): string[] {
  try {
    const differences: string[] = [];

    // Chamber differences
    const chambers = [...new Set(bills.map(bill => bill.chamber).filter(Boolean))];
    if (chambers.length > 1) {
      differences.push(`Bills span multiple chambers: ${chambers.join(', ')}`);
    }

    // Party differences
    const parties = [...new Set(bills.map(bill => bill.party).filter(Boolean))];
    if (parties.length > 1) {
      differences.push(`Bipartisan bills: ${parties.join(' and ')} parties involved`);
    }

    // Status differences
    const statuses = [...new Set(bills.map(bill => bill.status).filter(Boolean))];
    if (statuses.length > 1) {
      differences.push(`Different legislative stages: ${statuses.join(', ')}`);
    }

    // Category differences
    const categories = [...new Set(bills.map(bill => bill.category).filter(Boolean))];
    if (categories.length > 1) {
      differences.push(`Different policy areas: ${categories.join(', ')}`);
    }

    return differences.length > 0 ? differences : ['Bills are very similar in scope and approach'];

  } catch (error: any) {
    console.error('Error finding differences:', error);
    return ['Analysis unavailable'];
  }
}

function findConflictingProvisions(bills: any[]): string[] {
  try {
    const conflicts: string[] = [];

    // Check for opposing party bills on same topic
    const partiesAndTopics = bills.map(bill => ({
      party: bill.party,
      category: bill.category,
      number: bill.number
    })).filter(bill => bill.party && bill.category);

    const categoriesMap = new Map();
    partiesAndTopics.forEach(bill => {
      if (!categoriesMap.has(bill.category)) {
        categoriesMap.set(bill.category, []);
      }
      categoriesMap.get(bill.category).push(bill);
    });

    categoriesMap.forEach((billsInCategory, category) => {
      const parties = [...new Set(billsInCategory.map((bill: any) => bill.party))];
      if (parties.length > 1) {
        conflicts.push(`Competing approaches in ${category}: ${parties.join(' vs ')} party positions`);
      }
    });

    return conflicts.length > 0 ? conflicts : [];

  } catch (error: any) {
    console.error('Error finding conflicts:', error);
    return [];
  }
}

async function generateDetailedAnalysis(bills: any[]): Promise<string> {
  try {
    const billCount = bills.length;
    const chambers = [...new Set(bills.map(bill => bill.chamber).filter(Boolean))];
    const parties = [...new Set(bills.map(bill => bill.party).filter(Boolean))];
    const categories = [...new Set(bills.map(bill => bill.category).filter(Boolean))];

    let analysis = `Comparative Analysis of ${billCount} Texas Bills:\n\n`;

    analysis += `Legislative Scope: `;
    if (chambers.length === 1) {
      analysis += `All bills originate from the ${chambers[0]} chamber, indicating focused legislative attention in this area.\n\n`;
    } else {
      analysis += `Bills span ${chambers.join(' and ')} chambers, showing broad legislative interest across both houses.\n\n`;
    }

    analysis += `Political Dynamics: `;
    if (parties.length === 1) {
      analysis += `All bills sponsored by ${parties[0]} party members, suggesting unified party position on this issue.\n\n`;
    } else {
      analysis += `Bipartisan bills involving ${parties.join(' and ')} parties, indicating cross-party interest or competing approaches.\n\n`;
    }

    if (categories.length > 1) {
      analysis += `Policy Areas: Bills address multiple policy domains including ${categories.join(', ')}, showing interconnected legislative priorities.\n\n`;
    }

    analysis += `Recommendation: `;
    if (parties.length > 1) {
      analysis += `Monitor these bills closely as bipartisan measures often have higher chances of passage but may involve compromises.`;
    } else {
      analysis += `These aligned bills may move together through the legislative process if they have strong party support.`;
    }

    return analysis;

  } catch (error: any) {
    console.error('Error generating detailed analysis:', error);
    return 'Detailed analysis could not be completed at this time.';
  }
}

async function generateDetailedComparison(bill1: any, bill2: any): Promise<string> {
  try {
    let comparison = `Detailed Comparison: ${bill1.number} vs ${bill2.number}\n\n`;
    
    comparison += `Sponsorship: ${bill1.sponsor} (${bill1.party}) vs ${bill2.sponsor} (${bill2.party})\n`;
    comparison += `Chamber: ${bill1.chamber} vs ${bill2.chamber}\n`;
    comparison += `Status: ${bill1.status} vs ${bill2.status}\n\n`;
    
    if (bill1.category === bill2.category) {
      comparison += `Both bills address ${bill1.category} policy area, suggesting related legislative priorities.\n\n`;
    } else {
      comparison += `Different policy focus: ${bill1.category} vs ${bill2.category}\n\n`;
    }

    return comparison;

  } catch (error: any) {
    console.error('Error generating comparison:', error);
    return 'Comparison analysis unavailable';
  }
}

export function registerInteractiveBillComparisonRoutes(app: express.Application) {
  app.use(router);
  console.log('📊 Interactive Bill Comparison routes registered successfully!');
}