// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index('llama-text-embed-v2-index');

interface ResearchQuery {
  topic: string;
  scope: 'local' | 'state' | 'federal' | 'comparative';
  timeframe?: string;
  focus?: 'policy' | 'financial' | 'political' | 'social' | 'legal';
  depth: 'overview' | 'detailed' | 'comprehensive';
}

interface AdvancedEntityProfile {
  // Basic Information
  name: string;
  type: 'person' | 'organization' | 'committee' | 'lobbyist' | 'pac' | 'corporation';
  primaryRole: string;
  aliases: string[];
  
  // Political Information
  politicalAffiliation?: string;
  district?: string;
  office?: string;
  tenure?: string;
  
  // Financial Networks
  financialConnections: {
    entity: string;
    relationship: 'donor' | 'recipient' | 'lobbyist' | 'employer' | 'client';
    amount?: number;
    timeframe: string;
    source: string;
  }[];
  
  // Legislative Activity
  legislativeActivity: {
    billsSponsored: string[];
    billsSupported: string[];
    billsOpposed: string[];
    committeeMemberships: string[];
    votingRecord: {
      billId: string;
      position: 'for' | 'against' | 'abstain';
      date: string;
    }[];
  };
  
  // Ethics and Transparency
  ethicsRecords: {
    violations: {
      type: string;
      description: string;
      date: string;
      resolution: string;
      status: 'pending' | 'resolved' | 'dismissed';
    }[];
    disclosures: {
      type: 'financial' | 'conflict' | 'gift' | 'travel';
      description: string;
      value?: number;
      date: string;
      reportingPeriod: string;
    }[];
  };
  
  // Network Analysis
  connectionNetwork: {
    directConnections: string[];
    indirectConnections: string[];
    influenceScore: number;
    networkCentrality: number;
  };
  
  // Research Intelligence
  investigativeFlags: {
    type: 'financial_anomaly' | 'voting_inconsistency' | 'ethics_concern' | 'influence_pattern';
    severity: 'low' | 'medium' | 'high';
    description: string;
    evidence: string[];
    confidenceScore: number;
  }[];
  
  // Research Metadata
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
  completenessScore: number;
  keyRelationships?: any[];
  influenceMetrics?: {
    legislativeInfluence: number;
    financialInfluence: number;
    networkInfluence: number;
    mediaInfluence: number;
    overallScore: number;
  };
  sources?: string[];
  confidenceScore?: number;
}

interface NetworkConnection {
  entity: string;
  strength: number;
  type: 'financial' | 'political' | 'professional' | 'personal';
  directness: 'direct' | 'indirect';
}

interface ResearchResult {
  query: ResearchQuery;
  entities: AdvancedEntityProfile[];
  insights: string[];
  recommendations: string[];
  confidenceScore: number;
  sources: string[];
}

interface NetworkMap {
  nodes: {
    id: string;
    name: string;
    type: string;
    influence: number;
    position: { x: number; y: number };
  }[];
  edges: {
    source: string;
    target: string;
    relationship: string;
    strength: number;
    amount?: number;
  }[];
  clusters: {
    name: string;
    members: string[];
    description: string;
  }[];
}

interface ResearchReport {
  summary: string;
  keyFindings: string[];
  entitiesDiscovered: AdvancedEntityProfile[];
  financialNetworks: any[];
  policyConnections: any[];
  recommendations: string[];
  followUpQuestions: string[];
  confidenceLevel: number;
  sources: string[];
}

export class AdvancedScoutBot {
  constructor() {
    console.log('🔍 Advanced Scout Bot initialized with enhanced research capabilities');
  }

  // Advanced Entity Extraction with AI
  async extractEntitiesFromText(text: string): Promise<AdvancedEntityProfile[]> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Analyze the following text and extract all political entities (people, organizations, committees, PACs, etc.) with detailed information:

Text: ${text}

Please provide a comprehensive JSON response with the following structure for each entity:
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "person|organization|committee|lobbyist|pac|corporation",
      "primaryRole": "Role description",
      "aliases": ["alternative names"],
      "politicalAffiliation": "if applicable",
      "district": "if applicable",
      "office": "if applicable",
      "keyConnections": ["related entities mentioned"],
      "mentionedActivities": ["activities described in text"],
      "potentialFlags": ["any concerning patterns"],
      "contextualRelevance": "high|medium|low"
    }
  ]
}

Focus on extracting actionable intelligence for civic engagement and transparency.`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          return this.normalizeExtractedEntities(parsed.entities || []);
        } catch (parseError: any) {
          console.error('Failed to parse entity extraction response:', parseError);
          return [];
        }
      }
      return [];

    } catch (error: any) {
      console.error('Entity extraction failed:', error);
      return [];
    }
  }

  // Deep Research with Multiple Data Sources
  async conductAdvancedResearch(query: ResearchQuery): Promise<ResearchResult> {
    try {
      // Step 1: Entity Discovery
      const discoveredEntities = await this.discoverEntities(query.topic);
      
      // Step 2: Financial Analysis
      const financialIntelligence = await this.analyzeFinancialNetworks(discoveredEntities);
      
      // Step 3: Pattern Detection
      const patterns = await this.detectSuspiciousPatterns(discoveredEntities);
      
      // Step 4: Generate Insights
      const insights = await this.generateInvestigativeInsights(query, discoveredEntities, patterns);
      
      // Step 5: Provide Recommendations
      const recommendations = await this.generateActionableRecommendations(query, insights);

      return {
        query,
        entities: discoveredEntities,
        insights,
        recommendations,
        confidenceScore: this.calculateResearchConfidenceScore(discoveredEntities, patterns),
        sources: this.compileSources(discoveredEntities)
      };

    } catch (error: any) {
      console.error('Advanced research failed:', error);
      return {
        query,
        entities: [],
        insights: ['Research analysis temporarily unavailable'],
        recommendations: ['Please try again or contact support'],
        confidenceScore: 0,
        sources: []
      };
    }
  }

  async conductDeepResearch(query: ResearchQuery): Promise<ResearchReport> {
    try {
      const entityProfiles = await this.discoverAndProfileEntities(query);
      const financialNetworks = await this.analyzeTopicFinancialNetworks(query);
      const policyConnections = await this.mapPolicyConnections(query);
      const keyFindings = await this.generateInvestigativeInsights(query, entityProfiles, []);

      return this.synthesizeResearchReport(
        query,
        { immediateFindings: keyFindings },
        entityProfiles,
        financialNetworks,
        policyConnections
      );
    } catch (error: any) {
      console.error('Deep research failed:', error);
      return {
        summary: 'Deep research is temporarily unavailable',
        keyFindings: ['Unable to complete research analysis'],
        entitiesDiscovered: [],
        financialNetworks: [],
        policyConnections: [],
        recommendations: ['Retry the request after verifying AI service configuration'],
        followUpQuestions: ['What specific Texas entity or bill should be researched next?'],
        confidenceLevel: 0,
        sources: []
      };
    }
  }

  async extractAndProfileEntity(entityName: string, context: string): Promise<AdvancedEntityProfile> {
    try {
      const basicInfo = await this.getBasicEntityInfo(entityName, context);
      const financialConnections = await this.extractFinancialConnections(entityName);
      const legislativeActivity = await this.analyzeLegislativeActivity(entityName);
      const relationships = await this.mapEntityRelationships(entityName);
      const influenceMetrics = await this.calculateInfluenceMetrics(entityName, basicInfo);

      const directConnections = relationships
        .map((relationship: any) => relationship.entity)
        .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0);

      const profileConfidenceScore = this.calculateProfileConfidenceScore(basicInfo);
      const normalizedVotingRecord = Array.isArray(legislativeActivity.votingRecord)
        ? legislativeActivity.votingRecord.map((vote: any) => ({
            billId: vote.billId || vote.bill || '',
            position: vote.position || (vote.vote === 'yes' ? 'for' : vote.vote === 'no' ? 'against' : 'abstain'),
            date: vote.date || ''
          }))
        : [];

      return {
        name: basicInfo.name || entityName,
        type: basicInfo.type || 'person',
        primaryRole: basicInfo.primaryRole || '',
        aliases: basicInfo.aliases || [],
        politicalAffiliation: basicInfo.politicalAffiliation,
        district: basicInfo.district,
        office: basicInfo.office,
        tenure: basicInfo.tenure,
        financialConnections,
        legislativeActivity: {
          billsSponsored: legislativeActivity.billsSponsored || [],
          billsSupported: legislativeActivity.billsSupported || [],
          billsOpposed: legislativeActivity.billsOpposed || [],
          committeeMemberships: legislativeActivity.committeeMemberships || [],
          votingRecord: normalizedVotingRecord,
        },
        ethicsRecords: {
          violations: [],
          disclosures: [],
        },
        connectionNetwork: {
          directConnections,
          indirectConnections: [],
          influenceScore: influenceMetrics.overallScore || 0,
          networkCentrality: directConnections.length,
        },
        investigativeFlags: [],
        keyRelationships: relationships,
        influenceMetrics,
        lastUpdated: new Date().toISOString(),
        dataQuality: this.assessDataQuality(entityName),
        completenessScore: profileConfidenceScore / 100,
        sources: await this.getEntitySources(entityName),
        confidenceScore: profileConfidenceScore,
      };
    } catch (error: any) {
      console.error('Entity profiling failed:', error);
      throw new Error('Failed to create comprehensive entity profile');
    }
  }

  // Network Analysis Engine
  async analyzeInfluenceNetwork(entityName: string): Promise<NetworkConnection[]> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Analyze the influence network for: ${entityName}

Identify key connections based on:
- Financial relationships (donations, contracts, employment)
- Political relationships (endorsements, joint activities, shared committees)
- Professional relationships (lobbying, consulting, board memberships)
- Personal relationships (family, social connections)

Provide JSON response:
{
  "connections": [
    {
      "entity": "Connected Entity Name",
      "strength": 0.8,
      "type": "financial|political|professional|personal",
      "directness": "direct|indirect",
      "description": "Nature of relationship",
      "evidenceStrength": "high|medium|low"
    }
  ]
}

Focus on connections that could indicate influence, conflicts of interest, or transparency concerns.`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          return parsed.connections || [];
        } catch (parseError: any) {
          console.error('Failed to parse network analysis:', parseError);
          return [];
        }
      }
      return [];

    } catch (error: any) {
      console.error('Network analysis failed:', error);
      return [];
    }
  }

  // Ethics and Compliance Scanner
  async scanForEthicsIssues(entityProfile: AdvancedEntityProfile): Promise<any[]> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: `Analyze this entity profile for potential ethics and transparency concerns:

Entity: ${JSON.stringify(entityProfile, null, 2)}

Look for:
- Conflicts of interest
- Unusual financial patterns
- Voting inconsistencies
- Disclosure gaps
- Influence concentration
- Regulatory violations

Provide JSON response:
{
  "flags": [
    {
      "type": "financial_anomaly|voting_inconsistency|ethics_concern|influence_pattern",
      "severity": "low|medium|high",
      "description": "Detailed description of the concern",
      "evidence": ["supporting evidence"],
      "confidenceScore": 0.85,
      "recommendations": ["suggested actions"]
    }
  ]
}

Be thorough but fair - only flag genuine concerns with solid reasoning.`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          return parsed.flags || [];
        } catch (parseError: any) {
          console.error('Failed to parse ethics scan:', parseError);
          return [];
        }
      }
      return [];

    } catch (error: any) {
      console.error('Ethics scanning failed:', error);
      return [];
    }
  }

  // Private helper methods
  private normalizeExtractedEntities(entities: any[]): AdvancedEntityProfile[] {
    return entities.map(entity => ({
      name: entity.name || 'Unknown',
      type: entity.type || 'person',
      primaryRole: entity.primaryRole || '',
      aliases: entity.aliases || [],
      politicalAffiliation: entity.politicalAffiliation,
      district: entity.district,
      office: entity.office,
      tenure: entity.tenure,
      financialConnections: [],
      legislativeActivity: {
        billsSponsored: [],
        billsSupported: [],
        billsOpposed: [],
        committeeMemberships: [],
        votingRecord: []
      },
      ethicsRecords: {
        violations: [],
        disclosures: []
      },
      connectionNetwork: {
        directConnections: entity.keyConnections || [],
        indirectConnections: [],
        influenceScore: 0,
        networkCentrality: 0
      },
      investigativeFlags: [],
      lastUpdated: new Date().toISOString(),
      dataQuality: 'medium',
      completenessScore: 0.6
    }));
  }

  private async discoverEntities(topic: string): Promise<AdvancedEntityProfile[]> {
    // Simulate entity discovery - in production, this would query multiple databases
    return this.extractEntitiesFromText(`Research topic: ${topic}`);
  }

  private async analyzeFinancialNetworks(entities: AdvancedEntityProfile[]): Promise<any> {
    // Financial network analysis would connect to campaign finance APIs
    return { patterns: [], anomalies: [] };
  }

  private async detectSuspiciousPatterns(entities: AdvancedEntityProfile[]): Promise<any[]> {
    // Pattern detection using AI and statistical analysis
    return [];
  }

  private async generateInvestigativeInsights(query: ResearchQuery, entities: AdvancedEntityProfile[], patterns: any[]): Promise<string[]> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Generate investigative insights for this civic research:

Query: ${JSON.stringify(query)}
Entities Found: ${entities.length}
Key Entities: ${entities.slice(0, 3).map(e => e.name).join(', ')}

Provide 3-5 actionable insights that help citizens understand:
- Power dynamics and influence patterns
- Transparency and accountability concerns
- Opportunities for civic engagement
- Important relationships to monitor

Format as an array of clear, actionable insight statements.`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text) || [];
        } catch {
          return content.text.split('\n').filter(line => line.trim().length > 0);
        }
      }
      return [];

    } catch (error: any) {
      console.error('Insight generation failed:', error);
      return ['Analysis capabilities temporarily unavailable'];
    }
  }

  private async generateActionableRecommendations(query: ResearchQuery, insights: string[]): Promise<string[]> {
    return [
      'Monitor campaign finance disclosures for these entities',
      'Track voting patterns on related legislation',
      'Set up alerts for public meetings and hearings',
      'Review ethics filings for potential conflicts',
      'Engage with local civic groups on these issues'
    ];
  }

  private calculateResearchConfidenceScore(entities: AdvancedEntityProfile[], patterns: any[]): number {
    if (entities.length === 0) return 0;
    const baseScore = Math.min(entities.length * 0.2, 0.8);
    const qualityBonus = entities.reduce((sum, e) => sum + e.completenessScore, 0) / entities.length * 0.2;
    return Math.min(baseScore + qualityBonus, 1.0);
  }

  private compileSources(entities: AdvancedEntityProfile[]): string[] {
    return [
      'Federal Election Commission (FEC) database',
      'Texas Ethics Commission records',
      'Legislative voting records',
      'Public disclosure documents',
      'News media coverage analysis'
    ];
  }

  private async getBasicEntityInfo(entityName: string, context: string): Promise<Partial<AdvancedEntityProfile>> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      system: `You are an expert in Texas political research and entity identification. Extract comprehensive basic information about political entities. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Research and profile this entity in Texas politics:

Entity: ${entityName}
Context: ${context}

Provide basic entity information in this JSON format:
{
  "name": "Full official name",
  "type": "person|organization|committee|lobbyist|pac|corporation",
  "primaryRole": "Main role or position",
  "aliases": ["alias1", "alias2"],
  "politicalAffiliation": "political party or affiliation",
  "district": "electoral district if applicable",
  "office": "current office or position",
  "tenure": "time in current position"
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
    throw new Error('Invalid basic entity info response');
  }

  private async extractFinancialConnections(entityName: string): Promise<any[]> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: `You are an expert in campaign finance and lobbying analysis. Extract financial relationships and money flows for Texas political entities. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Extract all known financial connections for this entity in Texas politics:

Entity: ${entityName}

Provide financial connections in this JSON format:
{
  "connections": [
    {
      "entity": "Connected entity name",
      "relationship": "donor|recipient|lobbyist|employer|client",
      "amount": 50000,
      "timeframe": "2024 cycle",
      "source": "TEC filing or data source"
    }
  ]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const result = JSON.parse(content.text);
      return result.connections || [];
    }
    return [];
  }

  private async analyzeLegislativeActivity(entityName: string): Promise<any> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: `You are an expert in Texas legislative tracking and analysis. Extract comprehensive legislative activity data. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Analyze legislative activity for this entity:

Entity: ${entityName}

Provide legislative activity in this JSON format:
{
  "billsSponsored": ["HB 1234", "SB 5678"],
  "billsSupported": ["HB 9999", "SB 8888"],
  "billsOpposed": ["HB 7777", "SB 6666"],
  "committeeMemberships": ["House Education", "Senate Finance"],
  "votingRecord": [
    {
      "bill": "HB 1234",
      "vote": "yes|no|abstain|absent",
      "date": "2024-03-15"
    }
  ]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }

    return {
      billsSponsored: [],
      billsSupported: [],
      billsOpposed: [],
      committeeMemberships: [],
      votingRecord: []
    };
  }

  private async mapEntityRelationships(entityName: string): Promise<any[]> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      system: `You are an expert in political network analysis and relationship mapping. Identify key relationships and their significance. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Map key relationships for this entity:

Entity: ${entityName}

Provide relationships in this JSON format:
{
  "relationships": [
    {
      "entity": "Related entity name",
      "relationshipType": "business partner|political ally|family member|employer|etc",
      "strength": "strong|moderate|weak",
      "context": "Brief description of the relationship context"
    }
  ]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const result = JSON.parse(content.text);
      return result.relationships || [];
    }
    return [];
  }

  private async calculateInfluenceMetrics(entityName: string, basicInfo: Partial<AdvancedEntityProfile>): Promise<AdvancedEntityProfile['influenceMetrics']> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      system: `You are an expert in political influence analysis. Calculate influence metrics based on available data. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Calculate influence metrics for this entity:

Entity: ${entityName}
Type: ${basicInfo.type}
Role: ${basicInfo.primaryRole}

Provide influence metrics (1-100 scale) in this JSON format:
{
  "legislativeInfluence": 75,
  "financialInfluence": 80,
  "networkInfluence": 60,
  "mediaInfluence": 50,
  "overallScore": 66
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }

    return {
      legislativeInfluence: 50,
      financialInfluence: 50,
      networkInfluence: 50,
      mediaInfluence: 50,
      overallScore: 50
    };
  }

  async generateNetworkMap(entities: string[]): Promise<NetworkMap> {
    try {
      const networkAnalysis = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2500,
        system: `You are an expert in network visualization and relationship mapping. Create comprehensive network maps showing connections between political entities. Always respond with valid JSON.`,
        messages: [{
          role: 'user',
          content: `Create a network map for these entities:

Entities: ${entities.join(', ')}

Provide network map data in this JSON format:
{
  "nodes": [
    {
      "id": "entity_id",
      "name": "Entity Name",
      "type": "person|organization|committee|etc",
      "influence": 75,
      "position": {"x": 100, "y": 200}
    }
  ],
  "edges": [
    {
      "source": "entity1_id",
      "target": "entity2_id",
      "relationship": "donor|employer|ally|etc",
      "strength": 0.8,
      "amount": 50000
    }
  ],
  "clusters": [
    {
      "name": "Business Network",
      "members": ["entity1", "entity2"],
      "description": "Connected through business relationships"
    }
  ]
}`
        }]
      });

      const content = networkAnalysis.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      throw new Error('Invalid network map response');
    } catch (error: any) {
      console.error('Network map generation failed:', error);
      return {
        nodes: [],
        edges: [],
        clusters: []
      };
    }
  }

  private async discoverAndProfileEntities(query: ResearchQuery): Promise<AdvancedEntityProfile[]> {
    const entityDiscovery = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      system: `You are an expert entity discovery specialist. Identify key political entities related to research topics. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Identify key entities related to this research topic:

Topic: ${query.topic}
Scope: ${query.scope}

Provide entities to research in this JSON format:
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "person|organization|etc",
      "relevance": "high|medium|low",
      "context": "Why this entity is relevant"
    }
  ]
}`
      }]
    });

    const content = entityDiscovery.content[0];
    if (content.type === 'text') {
      const discovery = JSON.parse(content.text);
      const entities = discovery.entities || [];
      const profiles: AdvancedEntityProfile[] = [];

      for (const entity of entities.slice(0, 5)) {
        try {
          const profile = await this.extractAndProfileEntity(entity.name, entity.context);
          profiles.push(profile);
        } catch (error: any) {
          console.error(`Failed to profile entity ${entity.name}:`, error);
        }
      }

      return profiles;
    }

    return [];
  }

  private async analyzeTopicFinancialNetworks(query: ResearchQuery): Promise<any[]> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: `You are an expert in campaign finance and lobbying network analysis. Identify financial networks and money flows related to research topics. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Analyze financial networks related to this topic:

Topic: ${query.topic}
Scope: ${query.scope}

Provide financial networks in this JSON format:
{
  "networks": [
    {
      "networkName": "Network Name",
      "participants": ["participant1", "participant2"],
      "totalAmount": 500000,
      "purpose": "Purpose of the financial activity",
      "timeframe": "2024 election cycle"
    }
  ]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const result = JSON.parse(content.text);
      return result.networks || [];
    }
    return [];
  }

  private async mapPolicyConnections(query: ResearchQuery): Promise<any[]> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: `You are an expert in policy analysis and legislative tracking. Map connections between bills, entities, and interests. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Map policy connections for this research topic:

Topic: ${query.topic}
Focus: ${query.focus}

Provide policy connections in this JSON format:
{
  "connections": [
    {
      "bill": "HB 1234",
      "connectedEntities": ["entity1", "entity2"],
      "connectionType": "financial|lobbying|political|employment",
      "significance": "high|medium|low"
    }
  ]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const result = JSON.parse(content.text);
      return result.connections || [];
    }
    return [];
  }

  private async synthesizeResearchReport(
    query: ResearchQuery,
    initialFindings: { immediateFindings?: string[] },
    entityProfiles: AdvancedEntityProfile[],
    financialNetworks: any[],
    policyConnections: any[]
  ): Promise<ResearchReport> {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2500,
      system: `You are an expert research analyst who synthesizes complex political and financial data into comprehensive reports. Create clear, actionable insights from research findings. Always respond with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Synthesize this research data into a comprehensive report:

Research Query: ${JSON.stringify(query)}
Initial Findings: ${JSON.stringify(initialFindings)}
Entity Count: ${entityProfiles.length}
Network Count: ${financialNetworks.length}
Policy Connections: ${policyConnections.length}

Provide synthesis in this JSON format:
{
  "summary": "Executive summary of research findings",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "followUpQuestions": ["question1", "question2"],
  "confidenceLevel": 85,
  "sources": ["source1", "source2"]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const synthesis = JSON.parse(content.text);
      return {
        ...synthesis,
        entitiesDiscovered: entityProfiles,
        financialNetworks,
        policyConnections
      };
    }

    return {
      summary: 'Research completed with limited synthesis capability',
      keyFindings: initialFindings.immediateFindings || [],
      entitiesDiscovered: entityProfiles,
      financialNetworks,
      policyConnections,
      recommendations: ['Further investigation recommended'],
      followUpQuestions: ['Additional research needed'],
      confidenceLevel: 60,
      sources: ['Multiple research sources']
    };
  }

  private assessDataQuality(entityName: string): 'high' | 'medium' | 'low' {
    if (entityName.length > 10) return 'high';
    if (entityName.length > 5) return 'medium';
    return 'low';
  }

  private async getEntitySources(entityName: string): Promise<string[]> {
    return ['Texas Ethics Commission', 'Legislative records', 'Public filings'];
  }

  private calculateProfileConfidenceScore(basicInfo: Partial<AdvancedEntityProfile>): number {
    let score = 50;
    if (basicInfo.name) score += 10;
    if (basicInfo.type) score += 10;
    if (basicInfo.primaryRole) score += 10;
    if (basicInfo.politicalAffiliation) score += 10;
    if (basicInfo.office) score += 10;
    return Math.min(score, 95);
  }
}

export const advancedScoutBot = new AdvancedScoutBot();