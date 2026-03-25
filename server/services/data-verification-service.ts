import OpenAI from 'openai';
import { legiscanService } from './legiscan-service';

// Initialize OpenAI client for verification analysis
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  sources: Array<{
    name: string;
    url?: string;
    type: 'primary' | 'secondary' | 'official';
    dataMatches: boolean;
    discrepancies?: string[];
  }>;
  crossReferenceChecks: {
    legiscanVerified: boolean;
    officialSourcesChecked: boolean;
    timelinessVerified: boolean;
    consistencyScore: number;
  };
  recommendations: string[];
  lastVerified: Date;
  flaggedIssues: string[];
}

export interface DataSource {
  name: string;
  priority: number;
  endpoint?: string;
  type: 'official' | 'verified' | 'supplementary';
  reliability: number;
}

// Authorized data sources in order of priority
const AUTHORIZED_SOURCES: DataSource[] = [
  {
    name: 'LegiScan API',
    priority: 1,
    endpoint: 'https://api.legiscan.com',
    type: 'official',
    reliability: 0.95
  },
  {
    name: 'Texas Legislature Official Site',
    priority: 2,
    type: 'official',
    reliability: 0.95
  },
  {
    name: 'Texas Ethics Commission',
    priority: 3,
    type: 'official',
    reliability: 0.92
  },
  {
    name: 'Texas Secretary of State',
    priority: 4,
    type: 'official',
    reliability: 0.90
  },
  {
    name: 'Legislative Reference Library',
    priority: 5,
    type: 'verified',
    reliability: 0.88
  }
];

/**
 * Verifies bill data across multiple official sources
 */
export async function verifyBillData(billId: number, existingData: any): Promise<VerificationResult> {
  try {
    console.log(`Starting verification for bill ID: ${billId}`);
    
    const verificationResult: VerificationResult = {
      isVerified: false,
      confidence: 0,
      sources: [],
      crossReferenceChecks: {
        legiscanVerified: false,
        officialSourcesChecked: false,
        timelinessVerified: false,
        consistencyScore: 0
      },
      recommendations: [],
      lastVerified: new Date(),
      flaggedIssues: []
    };

    // Step 1: Verify with LegiScan API (primary source)
    try {
      const legiscanData = await legiscanService.getBill(billId);
      if (legiscanData) {
        verificationResult.crossReferenceChecks.legiscanVerified = true;
        
        // Compare existing data with LegiScan data
        const legiscanSource = {
          name: 'LegiScan API',
          type: 'primary' as const,
          dataMatches: true,
          discrepancies: [] as string[]
        };

        // Check for discrepancies
        if (existingData.title && existingData.title !== legiscanData.title) {
          legiscanSource.dataMatches = false;
          legiscanSource.discrepancies!.push(`Title mismatch: "${existingData.title}" vs "${legiscanData.title}"`);
        }

        if (existingData.status && existingData.status !== legiscanData.status) {
          legiscanSource.dataMatches = false;
          legiscanSource.discrepancies!.push(`Status mismatch: "${existingData.status}" vs "${legiscanData.status}"`);
        }

        verificationResult.sources.push(legiscanSource);
      } else {
        verificationResult.flaggedIssues.push('Bill not found in LegiScan API');
      }
    } catch (error: any) {
      console.error('LegiScan verification failed:', error);
      verificationResult.flaggedIssues.push('LegiScan API verification failed');
    }

    // Step 2: Cross-reference with AI analysis for consistency
    if (existingData && Object.keys(existingData).length > 0) {
      try {
        const aiVerification = await performAIConsistencyCheck(existingData, verificationResult.sources);
        verificationResult.crossReferenceChecks.consistencyScore = aiVerification.consistencyScore;
        verificationResult.recommendations.push(...aiVerification.recommendations);
        
        if (aiVerification.flaggedIssues.length > 0) {
          verificationResult.flaggedIssues.push(...aiVerification.flaggedIssues);
        }
      } catch (error: any) {
        console.error('AI consistency check failed:', error);
        verificationResult.flaggedIssues.push('AI consistency verification failed');
      }
    }

    // Step 3: Timeliness verification
    verificationResult.crossReferenceChecks.timelinessVerified = verifyTimeliness(existingData);

    // Step 4: Calculate overall verification status
    const hasValidSources = verificationResult.sources.length > 0;
    const hasMatchingData = verificationResult.sources.some(s => s.dataMatches);
    const hasMinimalIssues = verificationResult.flaggedIssues.length <= 2;
    const hasGoodConsistency = verificationResult.crossReferenceChecks.consistencyScore >= 0.7;

    verificationResult.isVerified = hasValidSources && hasMatchingData && hasMinimalIssues && hasGoodConsistency;
    verificationResult.confidence = calculateConfidenceScore(verificationResult);

    // Step 5: Generate recommendations
    if (!verificationResult.isVerified) {
      verificationResult.recommendations.push('Additional verification required before database update');
      
      if (verificationResult.flaggedIssues.length > 0) {
        verificationResult.recommendations.push('Resolve flagged issues before proceeding');
      }
      
      if (verificationResult.crossReferenceChecks.consistencyScore < 0.7) {
        verificationResult.recommendations.push('Data consistency below threshold - manual review recommended');
      }
    } else {
      verificationResult.recommendations.push('Data verified and safe for database update');
    }

    console.log(`Verification completed for bill ${billId}:`, {
      verified: verificationResult.isVerified,
      confidence: verificationResult.confidence,
      sources: verificationResult.sources.length,
      issues: verificationResult.flaggedIssues.length
    });

    return verificationResult;

  } catch (error: any) {
    console.error('Data verification service error:', error);
    
    return {
      isVerified: false,
      confidence: 0,
      sources: [],
      crossReferenceChecks: {
        legiscanVerified: false,
        officialSourcesChecked: false,
        timelinessVerified: false,
        consistencyScore: 0
      },
      recommendations: ['Verification service error - manual review required'],
      lastVerified: new Date(),
      flaggedIssues: ['Service error occurred during verification']
    };
  }
}

/**
 * Performs AI-powered consistency analysis across data sources
 */
async function performAIConsistencyCheck(data: any, sources: any[]): Promise<{
  consistencyScore: number;
  recommendations: string[];
  flaggedIssues: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a data verification expert analyzing legislative information for consistency and accuracy. Focus on identifying discrepancies, timeline issues, and data quality problems.'
        },
        {
          role: 'user',
          content: `Analyze this legislative data for consistency and flag any issues:

Data to verify: ${JSON.stringify(data, null, 2)}

Source verification results: ${JSON.stringify(sources, null, 2)}

Check for:
1. Internal consistency within the data
2. Logical timeline progression
3. Data format and structure issues
4. Missing critical information
5. Potential data corruption or errors`
        }
      ],
      functions: [
        {
          name: 'analyzeDataConsistency',
          description: 'Analyze data consistency and provide verification assessment',
          parameters: {
            type: 'object',
            properties: {
              consistencyScore: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Overall consistency score from 0-1'
              },
              recommendations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific recommendations for data verification'
              },
              flaggedIssues: {
                type: 'array',
                items: { type: 'string' },
                description: 'Issues that require attention before database update'
              },
              dataQualityMetrics: {
                type: 'object',
                properties: {
                  completeness: { type: 'number' },
                  accuracy: { type: 'number' },
                  timeliness: { type: 'number' }
                }
              }
            },
            required: ['consistencyScore', 'recommendations', 'flaggedIssues']
          }
        }
      ],
      function_call: { name: 'analyzeDataConsistency' }
    });

    if (response.choices[0].message.function_call) {
      const result = JSON.parse(response.choices[0].message.function_call.arguments);
      return result;
    }

    return {
      consistencyScore: 0.5,
      recommendations: ['AI analysis unavailable - manual review recommended'],
      flaggedIssues: ['AI verification service unavailable']
    };

  } catch (error: any) {
    console.error('AI consistency check error:', error);
    return {
      consistencyScore: 0.3,
      recommendations: ['AI verification failed - manual review required'],
      flaggedIssues: ['AI verification service error']
    };
  }
}

/**
 * Verifies data timeliness and freshness
 */
function verifyTimeliness(data: any): boolean {
  if (!data.updatedAt && !data.lastModified && !data.timestamp) {
    return false; // No timestamp information
  }

  const dataTimestamp = new Date(data.updatedAt || data.lastModified || data.timestamp);
  const now = new Date();
  const timeDiff = now.getTime() - dataTimestamp.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);

  // Consider data fresh if it's less than 7 days old
  return daysDiff <= 7;
}

/**
 * Calculates overall confidence score based on verification results
 */
function calculateConfidenceScore(verification: VerificationResult): number {
  let score = 0;

  // Source verification weight (40%)
  if (verification.sources.length > 0) {
    const matchingSourcesRatio = verification.sources.filter(s => s.dataMatches).length / verification.sources.length;
    score += matchingSourcesRatio * 0.4;
  }

  // Consistency score weight (30%)
  score += verification.crossReferenceChecks.consistencyScore * 0.3;

  // Issue penalty (20%)
  const issuePenalty = Math.min(verification.flaggedIssues.length * 0.1, 0.2);
  score += (0.2 - issuePenalty);

  // Cross-reference checks weight (10%)
  let crossRefScore = 0;
  if (verification.crossReferenceChecks.legiscanVerified) crossRefScore += 0.4;
  if (verification.crossReferenceChecks.officialSourcesChecked) crossRefScore += 0.3;
  if (verification.crossReferenceChecks.timelinessVerified) crossRefScore += 0.3;
  score += crossRefScore * 0.1;

  return Math.max(0, Math.min(1, score));
}

/**
 * Verifies ethics and campaign finance data
 */
export async function verifyEthicsData(data: any): Promise<VerificationResult> {
  // Similar verification process for ethics data
  // This would integrate with Texas Ethics Commission API
  
  return {
    isVerified: false,
    confidence: 0,
    sources: [],
    crossReferenceChecks: {
      legiscanVerified: false,
      officialSourcesChecked: false,
      timelinessVerified: false,
      consistencyScore: 0
    },
    recommendations: ['Ethics data verification not yet implemented'],
    lastVerified: new Date(),
    flaggedIssues: ['Implementation pending']
  };
}

/**
 * Batch verification for multiple data items
 */
export async function batchVerifyData(items: Array<{ id: number; data: any; type: 'bill' | 'ethics' | 'legislator' }>): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  
  for (const item of items) {
    try {
      let verification: VerificationResult;
      
      switch (item.type) {
        case 'bill':
          verification = await verifyBillData(item.id, item.data);
          break;
        case 'ethics':
          verification = await verifyEthicsData(item.data);
          break;
        default:
          verification = {
            isVerified: false,
            confidence: 0,
            sources: [],
            crossReferenceChecks: {
              legiscanVerified: false,
              officialSourcesChecked: false,
              timelinessVerified: false,
              consistencyScore: 0
            },
            recommendations: ['Unknown data type'],
            lastVerified: new Date(),
            flaggedIssues: ['Unsupported data type for verification']
          };
      }
      
      results.push(verification);
      
      // Add delay between verifications to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`Batch verification error for item ${item.id}:`, error);
      results.push({
        isVerified: false,
        confidence: 0,
        sources: [],
        crossReferenceChecks: {
          legiscanVerified: false,
          officialSourcesChecked: false,
          timelinessVerified: false,
          consistencyScore: 0
        },
        recommendations: ['Verification failed'],
        lastVerified: new Date(),
        flaggedIssues: ['Verification service error']
      });
    }
  }
  
  return results;
}