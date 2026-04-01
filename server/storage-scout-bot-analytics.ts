// @ts-nocheck
import { db } from "./db";
import {
  scoutBotAdvancedAnalysis,
  scoutBotHistoricalTrends,
  scoutBotCrossDatasetAnomalies,
  scoutBotAutomatedReports,
  type InsertScoutBotAdvancedAnalysis,
  type ScoutBotAdvancedAnalysis,
  type InsertScoutBotHistoricalTrends,
  type ScoutBotHistoricalTrends,
  type InsertScoutBotCrossDatasetAnomalies,
  type ScoutBotCrossDatasetAnomalies,
  type InsertScoutBotAutomatedReports,
  type ScoutBotAutomatedReports
} from "../shared/schema-scout-bot-analytics";
import { scoutBotProfiles } from "../shared/schema-scout-bot";
import { 
  scoutBotCampaignFinance, 
  scoutBotFilingCorrections,
  scoutBotEntityRelationships
} from "../shared/schema-scout-bot-extended";
import {
  scoutBotInfluenceNetworks,
  scoutBotInfluencePatterns
} from "../shared/schema-scout-bot-network";
import { 
  eq, 
  and, 
  or, 
  desc, 
  asc,
  gte, 
  lte, 
  inArray,
  like, 
  sql,
  count
} from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getScoutBotProfileById } from "./storage-scout-bot";
import { createLogger } from "./logger";
const log = createLogger("storage-scout-bot-analytics");


// Advanced Analysis Operations
export const createAdvancedAnalysis = async (
  analysis: InsertScoutBotAdvancedAnalysis
): Promise<ScoutBotAdvancedAnalysis> => {
  const newAnalysis = {
    id: createId(),
    ...analysis,
    created_at: new Date(),
    updated_at: new Date()
  };

  const [createdAnalysis] = await db
    .insert(scoutBotAdvancedAnalysis)
    .values(newAnalysis)
    .returning();

  return createdAnalysis;
};

export const getAdvancedAnalysisByProfileId = async (
  profileId: string | null,
  limit: number = 10,
  offset: number = 0
): Promise<{ analyses: ScoutBotAdvancedAnalysis[], total: number }> => {
  let networkIds: string[] = [];
  let patternIds: string[] = [];
  
  // If profileId is null, just get all analyses without filtering
  if (!profileId) {
    const analyses = await db
      .select()
      .from(scoutBotAdvancedAnalysis)
      .orderBy(desc(scoutBotAdvancedAnalysis.created_at))
      .limit(limit)
      .offset(offset);
    
    const totalCount = await db
      .select({ count: count() })
      .from(scoutBotAdvancedAnalysis);
    
    return {
      analyses,
      total: totalCount[0]?.count || 0
    };
  }
  
  // If profileId is provided, get the networks and patterns this profile is involved in
  // First get all the networks this profile is part of
  const networks = await db
    .select({
      networkId: scoutBotInfluenceNetworks.id
    })
    .from(scoutBotInfluenceNetworks).$dynamic()
    .where(
      like(
        sql`CAST(${scoutBotInfluenceNetworks.central_entities} AS TEXT)`,
        `%${profileId}%`
      )
    );
  
  networkIds = networks.map(n => n.networkId);
  
  // Get all patterns this profile is involved in
  const patterns = await db
    .select({
      patternId: scoutBotInfluencePatterns.id
    })
    .from(scoutBotInfluencePatterns).$dynamic()
    .where(
      like(
        sql`CAST(${scoutBotInfluencePatterns.involved_profiles} AS TEXT)`,
        `%${profileId}%`
      )
    );
  
  patternIds = patterns.map(p => p.patternId);
  
  // Get analyses related to these networks or patterns
  const analyses = await db
    .select()
    .from(scoutBotAdvancedAnalysis).$dynamic()
    .where(
      or(
        inArray(scoutBotAdvancedAnalysis.related_network_id, networkIds),
        inArray(scoutBotAdvancedAnalysis.related_pattern_id, patternIds),
        like(
          sql`CAST(${scoutBotAdvancedAnalysis.involved_entities} AS TEXT)`,
          `%${profileId}%`
        )
      )
    )
    .orderBy(desc(scoutBotAdvancedAnalysis.created_at))
    .limit(limit)
    .offset(offset);
  
  const totalCount = await db
    .select({ count: count() })
    .from(scoutBotAdvancedAnalysis).$dynamic()
    .where(
      or(
        inArray(scoutBotAdvancedAnalysis.related_network_id, networkIds),
        inArray(scoutBotAdvancedAnalysis.related_pattern_id, patternIds),
        like(
          sql`CAST(${scoutBotAdvancedAnalysis.involved_entities} AS TEXT)`,
          `%${profileId}%`
        )
      )
    );
  
  return {
    analyses,
    total: totalCount[0]?.count || 0
  };
};

// Historical Trends Operations
export const createHistoricalTrend = async (
  trend: InsertScoutBotHistoricalTrends
): Promise<ScoutBotHistoricalTrends> => {
  const newTrend = {
    id: createId(),
    ...trend,
    created_at: new Date(),
    updated_at: new Date()
  };

  const [createdTrend] = await db
    .insert(scoutBotHistoricalTrends)
    .values(newTrend)
    .returning();

  return createdTrend;
};

export const getHistoricalTrendsByEntityType = async (
  entityType: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ trends: ScoutBotHistoricalTrends[], total: number }> => {
  const trends = await db
    .select()
    .from(scoutBotHistoricalTrends).$dynamic()
    .where(eq(scoutBotHistoricalTrends.entity_type, entityType))
    .orderBy(desc(scoutBotHistoricalTrends.created_at))
    .limit(limit)
    .offset(offset);
  
  const totalCount = await db
    .select({ count: count() })
    .from(scoutBotHistoricalTrends).$dynamic()
    .where(eq(scoutBotHistoricalTrends.entity_type, entityType));
  
  return {
    trends,
    total: totalCount[0]?.count || 0
  };
};

// Cross-Dataset Anomaly Operations
export const createCrossDatasetAnomaly = async (
  anomaly: InsertScoutBotCrossDatasetAnomalies
): Promise<ScoutBotCrossDatasetAnomalies> => {
  const newAnomaly = {
    id: createId(),
    ...anomaly,
    created_at: new Date(),
    updated_at: new Date()
  };

  const [createdAnomaly] = await db
    .insert(scoutBotCrossDatasetAnomalies)
    .values(newAnomaly)
    .returning();

  return createdAnomaly;
};

export const getAnomaliesByProfileId = async (
  profileId: string | null,
  limit: number = 10,
  offset: number = 0
): Promise<{ anomalies: ScoutBotCrossDatasetAnomalies[], total: number }> => {
  let query = db
    .select()
    .from(scoutBotCrossDatasetAnomalies).$dynamic()
    .orderBy(desc(scoutBotCrossDatasetAnomalies.created_at))
    .limit(limit)
    .offset(offset);
  
  let countQuery = db
    .select({ count: count() })
    .from(scoutBotCrossDatasetAnomalies);
  
  // If profileId is provided, filter by it
  if (profileId) {
    query = query.where(
      or(
        eq(scoutBotCrossDatasetAnomalies.primary_entity_id, profileId),
        like(
          sql`CAST(${scoutBotCrossDatasetAnomalies.involved_entities} AS TEXT)`,
          `%${profileId}%`
        )
      )
    );
    
    countQuery = countQuery.where(
      or(
        eq(scoutBotCrossDatasetAnomalies.primary_entity_id, profileId),
        like(
          sql`CAST(${scoutBotCrossDatasetAnomalies.involved_entities} AS TEXT)`,
          `%${profileId}%`
        )
      )
    );
  }
  
  const anomalies = await query;
  const totalCount = await countQuery;
  
  return {
    anomalies,
    total: totalCount[0]?.count || 0
  };
};

export const reviewAnomaly = async (
  anomalyId: string,
  status: string,
  reviewNotes: string
): Promise<ScoutBotCrossDatasetAnomalies | null> => {
  const [updatedAnomaly] = await db
    .update(scoutBotCrossDatasetAnomalies)
    .set({ 
      status, 
      review_notes: reviewNotes,
      updated_at: new Date()
    })
    .where(eq(scoutBotCrossDatasetAnomalies.id, anomalyId))
    .returning();
  
  return updatedAnomaly || null;
};

// Automated Report Operations
export const createAutomatedReport = async (
  report: InsertScoutBotAutomatedReports
): Promise<ScoutBotAutomatedReports> => {
  const newReport = {
    id: createId(),
    ...report,
    created_at: new Date(),
    updated_at: new Date()
  };

  const [createdReport] = await db
    .insert(scoutBotAutomatedReports)
    .values(newReport)
    .returning();

  return createdReport;
};

export const getAutomatedReports = async (
  reportType?: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ reports: ScoutBotAutomatedReports[], total: number }> => {
  let query = db
    .select()
    .from(scoutBotAutomatedReports).$dynamic()
    .orderBy(desc(scoutBotAutomatedReports.created_at))
    .limit(limit)
    .offset(offset);
  
  if (reportType) {
    query = query.where(eq(scoutBotAutomatedReports.report_type, reportType));
  }
  
  const reports = await query;
  
  let countQuery = db
    .select({ count: count() })
    .from(scoutBotAutomatedReports);
  
  if (reportType) {
    countQuery = countQuery.where(eq(scoutBotAutomatedReports.report_type, reportType));
  }
  
  const totalCount = await countQuery;
  
  return {
    reports,
    total: totalCount[0]?.count || 0
  };
};

// Advanced Analytics Functions
export const analyzeFinancialNetworks = async (
  profileId: string
): Promise<ScoutBotAdvancedAnalysis | null> => {
  try {
    // Get profile to ensure it exists
    const profile = await getScoutBotProfileById(profileId);
    if (!profile) {
      return null;
    }
    
    // Look for financial data related to this profile
    const campaignFinanceData = await db
      .select()
      .from(scoutBotCampaignFinance).$dynamic()
      .where(eq(scoutBotCampaignFinance.profile_id, profileId))
      .orderBy(desc(scoutBotCampaignFinance.transaction_date));
    
    // Find all relationships related to this profile
    const relationships = await db
      .select()
      .from(scoutBotEntityRelationships).$dynamic()
      .where(
        or(
          eq(scoutBotEntityRelationships.source_profile_id, profileId),
          eq(scoutBotEntityRelationships.target_entity_id, profileId)
        )
      );
    
    // Check if we have enough data for analysis
    if (campaignFinanceData.length === 0 && relationships.length === 0) {
      // Not enough data to perform meaningful analysis
      return null;
    }
    
    // Create a network analysis
    const analysis: InsertScoutBotAdvancedAnalysis = {
      analysis_type: "financial_flow",
      title: `Financial Network Analysis for ${profile.name}`,
      description: `Comprehensive analysis of financial connections and patterns related to ${profile.name}`,
      involved_entities: [
        { 
          id: profileId, 
          name: profile.name, 
          role: "primary", 
          relevance_score: 100 
        }
      ],
      analysis_data: {
        metrics: {
          total_financial_connections: relationships.filter(r => 
            r.relationship_type === "donor" || 
            r.relationship_type === "recipient"
          ).length,
          total_transactions: campaignFinanceData.length,
          average_transaction_amount: campaignFinanceData.length > 0 ? 
            campaignFinanceData.reduce((sum, cf) => sum + Number(cf.amount || 0), 0) / campaignFinanceData.length : 
            0
        },
        dimensions: ["transactions", "relationships", "committees"],
        time_series: campaignFinanceData.length > 0 ? 
          groupTransactionsByPeriod(campaignFinanceData) : 
          undefined
      },
      source_datasets: ["campaign_finance", "entity_relationships"],
      confidence_score: 75,
      data_reliability: "medium"
    };
    
    // Add connected entities if available
    if (relationships.length > 0) {
      const connectedEntities = await getConnectedEntities(relationships);
      if (connectedEntities.length > 0) {
        analysis.involved_entities = [
          ...analysis.involved_entities,
          ...connectedEntities.map(e => ({
            id: e.id,
            name: e.name,
            role: e.role,
            relevance_score: e.relevance
          }))
        ];
      }
    }
    
    // Create and return the analysis
    return await createAdvancedAnalysis(analysis);
  } catch (error: any) {
    log.error({ err: error }, "Error in analyzeFinancialNetworks");
    return null;
  }
};

export const detectCrossDatasetAnomalies = async (
  profileId: string
): Promise<ScoutBotCrossDatasetAnomalies | null> => {
  try {
    // Get profile to ensure it exists
    const profile = await getScoutBotProfileById(profileId);
    if (!profile) {
      return null;
    }
    
    // Get filing corrections for this profile (indicates potential issues)
    const filingCorrections = await db
      .select()
      .from(scoutBotFilingCorrections).$dynamic()
      .where(eq(scoutBotFilingCorrections.profile_id, profileId));
    
    // Get campaign finance data
    const campaignFinanceData = await db
      .select()
      .from(scoutBotCampaignFinance).$dynamic()
      .where(eq(scoutBotCampaignFinance.profile_id, profileId));
    
    // Get relationships
    const relationships = await db
      .select()
      .from(scoutBotEntityRelationships).$dynamic()
      .where(
        or(
          eq(scoutBotEntityRelationships.source_profile_id, profileId),
          eq(scoutBotEntityRelationships.target_entity_id, profileId)
        )
      );
    
    // Check if we have data worth analyzing for anomalies
    if (filingCorrections.length === 0 && campaignFinanceData.length === 0 && relationships.length === 0) {
      return null;
    }
    
    // Look for anomalies
    const anomalySignals = [];
    const datasetsInvolved = [];
    
    // Check filing corrections (potential red flag)
    if (filingCorrections.length > 0) {
      anomalySignals.push({
        name: "filing_corrections_frequency",
        value: filingCorrections.length,
        threshold: 2, // More than 2 corrections is unusual
        source: "filing_corrections"
      });
      datasetsInvolved.push("filing_correction");
    }
    
    // Look for patterns in donations (e.g., large amounts just under reporting thresholds)
    if (campaignFinanceData.length > 0) {
      const thresholdDonations = campaignFinanceData.filter(cf => 
        Number(cf.amount) > 9000 && Number(cf.amount) < 10000);
      
      if (thresholdDonations.length > 0) {
        anomalySignals.push({
          name: "threshold_donations",
          value: thresholdDonations.length,
          threshold: 1,
          source: "campaign_finance"
        });
        datasetsInvolved.push("campaign_finance");
      }
    }
    
    // Check for unusual relationship patterns
    if (relationships.length > 0) {
      // Look for family members with business relationships (potential conflicts)
      const familyBusinessConnections = relationships.filter(r => 
        r.relationship_type === "family_member" && 
        relationships.some(r2 => 
          (r.target_entity_id === r2.target_entity_id || r.source_profile_id === r2.source_profile_id) && 
          (r2.relationship_type === "client" || r2.relationship_type === "employer")
        )
      );
      
      if (familyBusinessConnections.length > 0) {
        anomalySignals.push({
          name: "family_business_connections",
          value: familyBusinessConnections.length,
          threshold: 0, // Any is worth flagging
          source: "entity_relationships"
        });
        datasetsInvolved.push("entity_relationships");
      }
    }
    
    // If we found anomalies, create an anomaly record
    if (anomalySignals.length > 0) {
      // Calculate severity based on signals
      const severityScore = Math.min(10, Math.ceil(anomalySignals.reduce((sum, signal) => 
        sum + (signal.value > signal.threshold ? signal.value / signal.threshold : 0), 2)));
      
      // Create anomaly record
      const anomaly: InsertScoutBotCrossDatasetAnomalies = {
        anomaly_title: `Cross-dataset anomaly for ${profile.name}`,
        description: `Unusual patterns detected across multiple datasets for ${profile.name}`,
        primary_entity_id: profileId,
        involved_entities: [{ id: profileId, name: profile.name, role: "primary" }],
        datasets_involved: [...new Set(datasetsInvolved)],
        detection_method: "pattern_analysis",
        anomaly_data: {
          signals: anomalySignals,
          correlation_factors: datasetsInvolved.map(ds => ({
            factor: ds,
            strength: 0.8
          })),
          timeline: []
        },
        severity_score: severityScore,
        confidence_score: 75,
        status: "pending"
      };
      
      return await createCrossDatasetAnomaly(anomaly);
    }
    
    return null;
  } catch (error: any) {
    log.error({ err: error }, "Error in detectCrossDatasetAnomalies");
    return null;
  }
};

export const generateAutomatedReport = async (
  reportType: string,
  entityId?: string,
  timePeriod?: string
): Promise<ScoutBotAutomatedReports | null> => {
  try {
    let reportTitle = "";
    let reportContent: any = {
      summary: "",
      key_findings: [],
      data_visualizations: [],
      detailed_sections: []
    };
    let entitiesCovered: { id: string, name: string }[] = [];
    
    // Default time period to current quarter if not specified
    if (!timePeriod) {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      timePeriod = `${now.getFullYear()}Q${quarter}`;
    }
    
    // Set time period start and end dates
    let timePeriodStart: Date | null = null;
    let timePeriodEnd: Date | null = null;
    
    if (/^\d{4}Q[1-4]$/.test(timePeriod)) {
      // Quarterly period (e.g., 2023Q1)
      const year = parseInt(timePeriod.substring(0, 4));
      const quarter = parseInt(timePeriod.substring(5, 6));
      const startMonth = (quarter - 1) * 3;
      timePeriodStart = new Date(year, startMonth, 1);
      timePeriodEnd = new Date(year, startMonth + 3, 0);
    } else if (/^\d{4}H[1-2]$/.test(timePeriod)) {
      // Half-year period (e.g., 2023H1)
      const year = parseInt(timePeriod.substring(0, 4));
      const half = parseInt(timePeriod.substring(5, 6));
      const startMonth = (half - 1) * 6;
      timePeriodStart = new Date(year, startMonth, 1);
      timePeriodEnd = new Date(year, startMonth + 6, 0);
    } else if (/^\d{4}$/.test(timePeriod)) {
      // Yearly period (e.g., 2023)
      const year = parseInt(timePeriod);
      timePeriodStart = new Date(year, 0, 1);
      timePeriodEnd = new Date(year, 11, 31);
    } else {
      // Invalid format
      return null;
    }
    
    if (reportType === "entity_profile" && entityId) {
      // Generate entity profile report
      const profile = await getScoutBotProfileById(entityId);
      if (!profile) return null;
      
      reportTitle = `Entity Profile: ${profile.name}`;
      entitiesCovered = [{ id: entityId, name: profile.name }];
      
      // Get entity's data across different datasets
      const relationships = await db
        .select()
        .from(scoutBotEntityRelationships).$dynamic()
        .where(
          or(
            eq(scoutBotEntityRelationships.source_profile_id, entityId),
            eq(scoutBotEntityRelationships.target_entity_id, entityId)
          )
        );
      
      const campaignFinance = await db
        .select()
        .from(scoutBotCampaignFinance).$dynamic()
        .where(eq(scoutBotCampaignFinance.profile_id, entityId));
      
      const filingCorrections = await db
        .select()
        .from(scoutBotFilingCorrections).$dynamic()
        .where(eq(scoutBotFilingCorrections.profile_id, entityId));
      
      const anomalies = await getAnomaliesByProfileId(entityId, 5, 0);
      
      // Generate report content
      reportContent.summary = `Comprehensive profile analysis for ${profile.name} (${profile.type}). ${profile.summary || ''}`;
      
      // Key findings
      reportContent.key_findings = [
        {
          title: "Network Reach",
          description: `Connected to ${relationships.length} entities across various domains`,
          importance: 8
        }
      ];
      
      if (filingCorrections.length > 0) {
        reportContent.key_findings.push({
          title: "Filing Transparency",
          description: `Has ${filingCorrections.length} filing corrections recorded`,
          importance: filingCorrections.length > 2 ? 9 : 6
        });
      }
      
      if (anomalies.anomalies.length > 0) {
        reportContent.key_findings.push({
          title: "Detected Anomalies",
          description: `${anomalies.anomalies.length} unusual patterns detected in entity's data`,
          importance: 10
        });
      }
      
      // Detailed sections
      reportContent.detailed_sections = [
        {
          title: "Entity Overview",
          content: `${profile.name} is a ${profile.type} in the Texas political ecosystem. ${profile.summary || ''}`
        },
        {
          title: "Network Analysis",
          content: `This entity maintains ${relationships.length} documented relationships: ` +
            `${relationships.filter(r => r.relationship_type === "employer").length} employer, ` +
            `${relationships.filter(r => r.relationship_type === "client").length} client, ` +
            `${relationships.filter(r => r.relationship_type === "donor").length} donor, ` +
            `${relationships.filter(r => r.relationship_type === "recipient").length} recipient relationships.`
        }
      ];
      
      if (campaignFinance.length > 0) {
        reportContent.detailed_sections.push({
          title: "Financial Activity",
          content: `${campaignFinance.length} financial transactions recorded with a total value of ` +
            `$${campaignFinance.reduce((sum, cf) => sum + Number(cf.amount || 0), 0).toLocaleString()}.`
        });
      }
      
      if (anomalies.anomalies.length > 0) {
        reportContent.detailed_sections.push({
          title: "Detected Anomalies",
          content: anomalies.anomalies.map(a => a.description).join("\n\n"),
          references: anomalies.anomalies.map(a => a.id)
        });
      }
      
    } else if (reportType === "network_analysis") {
      // Generate network analysis report
      reportTitle = `Political Influence Network Analysis: ${timePeriod}`;
      
      // Get top networks for the time period
      const networks = await db
        .select()
        .from(scoutBotInfluenceNetworks).$dynamic()
        .where(
          and(
            gte(scoutBotInfluenceNetworks.created_at, timePeriodStart),
            lte(scoutBotInfluenceNetworks.created_at, timePeriodEnd)
          )
        )
        .orderBy(desc(scoutBotInfluenceNetworks.entity_count))
        .limit(5);
      
      if (networks.length === 0) return null;
      
      // Get all the central entities from these networks
      const allCentralEntities: { id: string, name: string }[] = [];
      networks.forEach(network => {
        if (network.central_entities) {
          network.central_entities.forEach((entity: { id: string, name: string }) => {
            if (!allCentralEntities.some(e => e.id === entity.id)) {
              allCentralEntities.push({ id: entity.id, name: entity.name });
            }
          });
        }
      });
      
      entitiesCovered = allCentralEntities;
      
      // Generate report content
      reportContent.summary = `Analysis of key political influence networks detected during ${timePeriod}, ` +
        `covering ${networks.length} networks and ${allCentralEntities.length} central entities.`;
      
      // Key findings
      reportContent.key_findings = [
        {
          title: "Network Activity",
          description: `${networks.length} significant influence networks identified during this period`,
          importance: 8
        },
        {
          title: "Key Players",
          description: `${allCentralEntities.length} entities identified as central to these networks`,
          importance: 9
        }
      ];
      
      // Data visualizations
      reportContent.data_visualizations = [
        {
          title: "Network Size Distribution",
          type: "bar_chart",
          data_reference: "network_sizes"
        },
        {
          title: "Network Type Distribution",
          type: "pie_chart",
          data_reference: "network_types"
        }
      ];
      
      // Detailed sections for each network
      reportContent.detailed_sections = networks.map(network => ({
        title: network.name,
        content: `${network.description || 'Influence network'} with ${network.entity_count} connected entities. ` +
          `Type: ${network.network_type}. Confidence score: ${network.confidence}/100.`,
        references: [network.id]
      }));
    }
    
    // Create the report
    const report: InsertScoutBotAutomatedReports = {
      report_title: reportTitle,
      report_type: reportType,
      report_content: reportContent,
      entities_covered: entitiesCovered,
      time_period: timePeriod,
      time_period_start: timePeriodStart,
      time_period_end: timePeriodEnd,
      generated_at: new Date(),
      scheduled: false
    };
    
    return await createAutomatedReport(report);
  } catch (error: any) {
    log.error({ err: error }, "Error in generateAutomatedReport");
    return null;
  }
};

// Helper Functions
const groupTransactionsByPeriod = (transactions: any[]) => {
  const periods = new Map<string, Record<string, number>>();
  
  transactions.forEach(transaction => {
    if (!transaction.transaction_date) return;
    
    const date = new Date(transaction.transaction_date);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!periods.has(period)) {
      periods.set(period, { count: 0, amount: 0 });
    }
    
    const periodData = periods.get(period)!;
    periodData.count++;
    periodData.amount += Number(transaction.amount || 0);
  });
  
  return Array.from(periods.entries())
    .map(([period, values]) => ({
      date: period,
      values
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getConnectedEntities = async (relationships: any[]) => {
  const connectedEntities: { id: string, name: string, role: string, relevance: number }[] = [];
  
  // Extract all unique entity IDs
  const entityIds = new Set<string>();
  relationships.forEach(rel => {
    if (rel.source_profile_id) entityIds.add(rel.source_profile_id);
    if (rel.target_entity_id) entityIds.add(rel.target_entity_id);
  });
  
  // Get profiles for these entities
  if (entityIds.size > 0) {
    const profiles = await db
      .select()
      .from(scoutBotProfiles).$dynamic()
      .where(inArray(scoutBotProfiles.id, Array.from(entityIds)));
    
    // Map to connected entities with relevance
    relationships.forEach(rel => {
      // Source profile
      const sourceProfile = profiles.find(p => p.id === rel.source_profile_id);
      if (sourceProfile && !connectedEntities.some(e => e.id === sourceProfile.id)) {
        connectedEntities.push({
          id: sourceProfile.id,
          name: sourceProfile.name,
          role: `source_${rel.relationship_type}`,
          relevance: getRelationshipRelevance(rel.relationship_type)
        });
      }
      
      // Target profile
      const targetProfile = profiles.find(p => p.id === rel.target_entity_id);
      if (targetProfile && !connectedEntities.some(e => e.id === targetProfile.id)) {
        connectedEntities.push({
          id: targetProfile.id,
          name: targetProfile.name,
          role: `target_${rel.relationship_type}`,
          relevance: getRelationshipRelevance(rel.relationship_type)
        });
      }
    });
  }
  
  return connectedEntities;
};

const getRelationshipRelevance = (relationshipType: string): number => {
  switch (relationshipType) {
    case "family_member":
    case "partner":
      return 90;
    case "employer":
    case "client":
      return 80;
    case "donor":
    case "recipient":
      return 70;
    case "sponsor":
      return 60;
    case "affiliated":
      return 50;
    default:
      return 40;
  }
};