/**
 * Infographic Generator Service
 * 
 * This service provides functionality to generate SVG infographics based on
 * bill data, voting information, and civic actions. It serves as a bridge
 * between the data sources and the visual templates.
 */

import { Bill } from "@shared/schema";
import { InfographicTemplate } from "@shared/schema-infographics";

// Define the types of infographics that can be generated
export type InfographicType = 'bill' | 'voting' | 'civic_action' | 'impact';

// DataSource interfaces for different infographic types
export interface BillInfographicData {
  bill: Bill;
  sentimentScore?: number;
  supportPct?: number;
  statusInfo?: {
    daysInProcess: number;
    nextStepName: string;
    nextStepDate?: Date;
  };
  keySponsors?: string[];
  impactSummary?: string;
}

export interface VotingInfographicData {
  election: {
    title: string;
    date: Date;
    type: string; // primary, general, special, local
  };
  location: {
    state: string;
    district?: string;
    county?: string;
  };
  pollingInfo?: {
    hours: string;
    locations: Array<{name: string; address: string}>;
    earlyVotingAvailable: boolean;
    earlyVotingDates?: string;
  };
  candidates?: Array<{
    name: string;
    party: string;
    incumbent: boolean;
  }>;
  measures?: Array<{
    title: string;
    summary: string;
  }>;
}

export interface CivicActionInfographicData {
  actionType: string;
  title: string;
  description: string;
  date?: Date;
  location?: string;
  organizer?: string;
  impact?: {
    participantsNeeded: number;
    currentParticipants: number;
    impactDescription: string;
  };
  steps?: string[];
}

export interface ImpactInfographicData {
  title: string;
  description: string;
  stats: Array<{
    label: string;
    value: number;
    unit?: string;
  }>;
  timePeriod?: string;
  source?: string;
}

// Union type for all possible infographic data types
export type InfographicData = 
  | BillInfographicData
  | VotingInfographicData 
  | CivicActionInfographicData
  | ImpactInfographicData;

/**
 * Main service class for generating infographics
 */
export class InfographicGeneratorService {
  /**
   * Generate SVG content for a bill infographic
   */
  generateBillInfographic(data: BillInfographicData, template?: InfographicTemplate): string {
    const themeColor = '#FF6400'; // ActUp orange
    const navyBlue = '#100244';
    const slate = '#556475';
    const offWhite = '#0FAFA';
    
    // If template is provided, use it as a base, otherwise create a default template
    let svgContent = template?.templateSvg || this.getDefaultBillTemplate();
    
    // Replace placeholders with actual content
    svgContent = svgContent
      .replace(/{{BILL_ID}}/g, data.bill.id)
      .replace(/{{BILL_TITLE}}/g, data.bill.title)
      .replace(/{{BILL_DESCRIPTION}}/g, this.truncateText(data.bill.description, 150))
      .replace(/{{BILL_STATUS}}/g, this.formatBillStatus(data.bill.status))
      .replace(/{{BILL_CHAMBER}}/g, this.formatChamber(data.bill.chamber))
      .replace(/{{INTRODUCED_DATE}}/g, this.formatDate(data.bill.introducedAt))
      .replace(/{{LAST_ACTION}}/g, data.bill.lastAction || '')
      .replace(/{{LAST_ACTION_DATE}}/g, this.formatDate(data.bill.lastActionAt))
      .replace(/{{PRIMARY_SPONSOR}}/g, data.bill.sponsors?.[0] || '')
      .replace(/{{COSPONSOR_COUNT}}/g, (data.bill.cosponsors?.length || 0).toString())
      .replace(/{{SUPPORT_PERCENTAGE}}/g, (data.supportPct || data.bill.communitySupportPct || 0).toString())
      .replace(/{{SENTIMENT_SCORE}}/g, (data.sentimentScore || data.bill.sentimentScore || 0).toString())
      .replace(/{{IMPACT_SUMMARY}}/g, data.impactSummary || data.bill.impactSummary || 'Impact assessment unavailable')
      .replace(/{{THEME_COLOR}}/g, themeColor)
      .replace(/{{NAVY_BLUE}}/g, navyBlue)
      .replace(/{{SLATE_COLOR}}/g, slate)
      .replace(/{{OFF_WHITE}}/g, offWhite)
      .replace(/{{TOPICS}}/g, this.formatTopics(data.bill.topics))
      .replace(/{{CURRENT_DATE}}/g, this.formatDate(new Date()));
    
    // Generate the support meter visual  
    const supportPercentage = data.supportPct || data.bill.communitySupportPct || 0;
    svgContent = this.insertSupportMeter(svgContent, supportPercentage);
    
    // Generate bill status timeline
    svgContent = this.insertBillStatusTimeline(svgContent, data.bill.status);
    
    // Insert Act Up logo
    svgContent = this.insertActUpLogo(svgContent);
    
    return svgContent;
  }
  
  /**
   * Generate SVG content for a voting infographic
   */
  generateVotingInfographic(data: VotingInfographicData, template?: InfographicTemplate): string {
    const themeColor = '#FF6400'; // ActUp orange
    const navyBlue = '#100244';
    const slate = '#556475';
    const offWhite = '#0FAFA';
    
    // If template is provided, use it as a base, otherwise create a default template
    let svgContent = template?.templateSvg || this.getDefaultVotingTemplate();
    
    // Replace placeholders with actual content
    svgContent = svgContent
      .replace(/{{ELECTION_TITLE}}/g, data.election.title)
      .replace(/{{ELECTION_DATE}}/g, this.formatDate(data.election.date))
      .replace(/{{ELECTION_TYPE}}/g, data.election.type)
      .replace(/{{LOCATION_STATE}}/g, data.location.state)
      .replace(/{{LOCATION_DISTRICT}}/g, data.location.district || '')
      .replace(/{{LOCATION_COUNTY}}/g, data.location.county || '')
      .replace(/{{POLLING_HOURS}}/g, data.pollingInfo?.hours || 'Check your local election office')
      .replace(/{{EARLY_VOTING_AVAILABLE}}/g, data.pollingInfo?.earlyVotingAvailable ? 'Yes' : 'No')
      .replace(/{{EARLY_VOTING_DATES}}/g, data.pollingInfo?.earlyVotingDates || '')
      .replace(/{{THEME_COLOR}}/g, themeColor)
      .replace(/{{NAVY_BLUE}}/g, navyBlue)
      .replace(/{{SLATE_COLOR}}/g, slate)
      .replace(/{{OFF_WHITE}}/g, offWhite)
      .replace(/{{CURRENT_DATE}}/g, this.formatDate(new Date()));
    
    // Insert candidates if provided
    if (data.candidates && data.candidates.length > 0) {
      svgContent = this.insertCandidatesList(svgContent, data.candidates);
    }
    
    // Insert ballot measures if provided
    if (data.measures && data.measures.length > 0) {
      svgContent = this.insertMeasuresList(svgContent, data.measures);
    }
    
    // Insert polling locations if provided
    if (data.pollingInfo?.locations && data.pollingInfo.locations.length > 0) {
      svgContent = this.insertPollingLocations(svgContent, data.pollingInfo.locations);
    }
    
    // Insert Act Up logo
    svgContent = this.insertActUpLogo(svgContent);
    
    return svgContent;
  }
  
  /**
   * Generate SVG content for a civic action infographic
   */
  generateCivicActionInfographic(data: CivicActionInfographicData, template?: InfographicTemplate): string {
    const themeColor = '#FF6400'; // ActUp orange
    const navyBlue = '#100244';
    const slate = '#556475';
    const offWhite = '#0FAFA';
    
    // If template is provided, use it as a base, otherwise create a default template
    let svgContent = template?.templateSvg || this.getDefaultCivicActionTemplate();
    
    // Replace placeholders with actual content
    svgContent = svgContent
      .replace(/{{ACTION_TYPE}}/g, data.actionType)
      .replace(/{{ACTION_TITLE}}/g, data.title)
      .replace(/{{ACTION_DESCRIPTION}}/g, this.truncateText(data.description, 200))
      .replace(/{{ACTION_DATE}}/g, data.date ? this.formatDate(data.date) : 'Ongoing')
      .replace(/{{ACTION_LOCATION}}/g, data.location || 'Online/Remote')
      .replace(/{{ACTION_ORGANIZER}}/g, data.organizer || '')
      .replace(/{{THEME_COLOR}}/g, themeColor)
      .replace(/{{NAVY_BLUE}}/g, navyBlue)
      .replace(/{{SLATE_COLOR}}/g, slate)
      .replace(/{{OFF_WHITE}}/g, offWhite)
      .replace(/{{CURRENT_DATE}}/g, this.formatDate(new Date()));
    
    // Insert impact information if provided
    if (data.impact) {
      svgContent = this.insertImpactInformation(svgContent, data.impact);
    }
    
    // Insert action steps if provided
    if (data.steps && data.steps.length > 0) {
      svgContent = this.insertActionSteps(svgContent, data.steps);
    }
    
    // Insert Act Up logo
    svgContent = this.insertActUpLogo(svgContent);
    
    return svgContent;
  }
  
  /**
   * Generate SVG content for an impact infographic
   */
  generateImpactInfographic(data: ImpactInfographicData, template?: InfographicTemplate): string {
    const themeColor = '#FF6400'; // ActUp orange
    const navyBlue = '#100244';
    const slate = '#556475';
    const offWhite = '#0FAFA';
    
    // If template is provided, use it as a base, otherwise create a default template
    let svgContent = template?.templateSvg || this.getDefaultImpactTemplate();
    
    // Replace placeholders with actual content
    svgContent = svgContent
      .replace(/{{IMPACT_TITLE}}/g, data.title)
      .replace(/{{IMPACT_DESCRIPTION}}/g, this.truncateText(data.description, 200))
      .replace(/{{TIME_PERIOD}}/g, data.timePeriod || '')
      .replace(/{{SOURCE}}/g, data.source || '')
      .replace(/{{THEME_COLOR}}/g, themeColor)
      .replace(/{{NAVY_BLUE}}/g, navyBlue)
      .replace(/{{SLATE_COLOR}}/g, slate)
      .replace(/{{OFF_WHITE}}/g, offWhite)
      .replace(/{{CURRENT_DATE}}/g, this.formatDate(new Date()));
    
    // Insert stats visualization
    svgContent = this.insertStatsVisualization(svgContent, data.stats);
    
    // Insert Act Up logo
    svgContent = this.insertActUpLogo(svgContent);
    
    return svgContent;
  }
  
  // Helper methods
  
  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  private formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  private formatBillStatus(status: string): string {
    if (!status) return 'Unknown';
    // Convert statuses like 'in_committee' to 'In Committee'
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  private formatChamber(chamber: string): string {
    if (!chamber) return '';
    return chamber.charAt(0).toUpperCase() + chamber.slice(1);
  }
  
  private formatTopics(topics: string[]): string {
    if (!topics || topics.length === 0) return '';
    return topics.join(', ');
  }
  
  private insertSupportMeter(svg: string, percentage: number): string {
    // Create a visual meter showing community support percentage
    const meterSvg = `
      <g transform="translate(50, 400)">
        <text x="0" y="-10" font-family="Arial" font-size="14" fill="#100244">Community Support: ${percentage}%</text>
        <rect x="0" y="0" width="300" height="20" rx="10" ry="10" fill="#E0E0E0" />
        <rect x="0" y="0" width="${percentage * 3}" height="20" rx="10" ry="10" fill="#FF6400" />
      </g>
    `;
    
    return svg.replace('{{SUPPORT_METER}}', meterSvg);
  }
  
  private insertBillStatusTimeline(svg: string, status: string): string {
    // Map of status to position in timeline (0-100)
    const statusMap: {[key: string]: number} = {
      'introduced': 0,
      'in_committee': 25,
      'passed_house': 50,
      'passed_senate': 75,
      'signed': 100,
      'vetoed': 100
    };
    
    const position = statusMap[status] || 0;
    
    const timelineSvg = `
      <g transform="translate(50, 450)">
        <text x="0" y="-10" font-family="Arial" font-size="14" fill="#100244">Bill Progress</text>
        <line x1="0" y1="0" x2="300" y2="0" stroke="#E0E0E0" stroke-width="4" />
        <line x1="0" y1="0" x2="${position * 3}" y2="0" stroke="#FF6400" stroke-width="4" />
        
        <circle cx="0" cy="0" r="5" fill="${position >= 0 ? '#FF6400' : '#E0E0E0'}" />
        <text x="0" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="#100244">Introduced</text>
        
        <circle cx="75" cy="0" r="5" fill="${position >= 25 ? '#FF6400' : '#E0E0E0'}" />
        <text x="75" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="#100244">Committee</text>
        
        <circle cx="150" cy="0" r="5" fill="${position >= 50 ? '#FF6400' : '#E0E0E0'}" />
        <text x="150" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="#100244">House</text>
        
        <circle cx="225" cy="0" r="5" fill="${position >= 75 ? '#FF6400' : '#E0E0E0'}" />
        <text x="225" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="#100244">Senate</text>
        
        <circle cx="300" cy="0" r="5" fill="${position >= 100 ? '#FF6400' : '#E0E0E0'}" />
        <text x="300" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="#100244">${status === 'vetoed' ? 'Vetoed' : 'Signed'}</text>
      </g>
    `;
    
    return svg.replace('{{BILL_TIMELINE}}', timelineSvg);
  }
  
  private insertCandidatesList(svg: string, candidates: Array<{name: string; party: string; incumbent: boolean}>): string {
    let candidatesSvg = `
      <g transform="translate(50, 350)">
        <text x="0" y="-10" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Candidates</text>
    `;
    
    candidates.forEach((candidate, index) => {
      candidatesSvg += `
        <g transform="translate(0, ${index * 30})">
          <text x="0" y="0" font-family="Arial" font-size="14" fill="#100244">${candidate.name} (${candidate.party})</text>
          ${candidate.incumbent ? '<text x="200" y="0" font-family="Arial" font-size="14" fill="#100244">Incumbent</text>' : ''}
        </g>
      `;
    });
    
    candidatesSvg += `</g>`;
    
    return svg.replace('{{CANDIDATES_LIST}}', candidatesSvg);
  }
  
  private insertMeasuresList(svg: string, measures: Array<{title: string; summary: string}>): string {
    let measuresSvg = `
      <g transform="translate(50, 500)">
        <text x="0" y="-10" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Ballot Measures</text>
    `;
    
    measures.forEach((measure, index) => {
      measuresSvg += `
        <g transform="translate(0, ${index * 50})">
          <text x="0" y="0" font-family="Arial" font-size="14" font-weight="bold" fill="#100244">${measure.title}</text>
          <text x="0" y="20" font-family="Arial" font-size="12" fill="#556475">${this.truncateText(measure.summary, 100)}</text>
        </g>
      `;
    });
    
    measuresSvg += `</g>`;
    
    return svg.replace('{{MEASURES_LIST}}', measuresSvg);
  }
  
  private insertPollingLocations(svg: string, locations: Array<{name: string; address: string}>): string {
    let locationsSvg = `
      <g transform="translate(50, 650)">
        <text x="0" y="-10" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Polling Locations</text>
    `;
    
    locations.forEach((location, index) => {
      locationsSvg += `
        <g transform="translate(0, ${index * 40})">
          <text x="0" y="0" font-family="Arial" font-size="14" fill="#100244">${location.name}</text>
          <text x="0" y="20" font-family="Arial" font-size="12" fill="#556475">${location.address}</text>
        </g>
      `;
    });
    
    locationsSvg += `</g>`;
    
    return svg.replace('{{POLLING_LOCATIONS}}', locationsSvg);
  }
  
  private insertImpactInformation(svg: string, impact: {participantsNeeded: number; currentParticipants: number; impactDescription: string}): string {
    const percentage = impact.currentParticipants / impact.participantsNeeded * 100;
    
    const impactSvg = `
      <g transform="translate(50, 400)">
        <text x="0" y="-10" font-family="Arial" font-size="14" fill="#100244">Participation Goal: ${impact.currentParticipants}/${impact.participantsNeeded}</text>
        <rect x="0" y="0" width="300" height="20" rx="10" ry="10" fill="#E0E0E0" />
        <rect x="0" y="0" width="${Math.min(percentage * 3, 300)}" height="20" rx="10" ry="10" fill="#FF6400" />
        <text x="0" y="50" font-family="Arial" font-size="14" fill="#100244">Impact: ${impact.impactDescription}</text>
      </g>
    `;
    
    return svg.replace('{{IMPACT_INFORMATION}}', impactSvg);
  }
  
  private insertActionSteps(svg: string, steps: string[]): string {
    let stepsSvg = `
      <g transform="translate(50, 500)">
        <text x="0" y="-10" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Action Steps</text>
    `;
    
    steps.forEach((step, index) => {
      stepsSvg += `
        <g transform="translate(0, ${index * 25})">
          <text x="20" y="0" font-family="Arial" font-size="14" fill="#100244">${step}</text>
          <text x="0" y="0" font-family="Arial" font-size="14" fill="#FF6400">${index + 1}.</text>
        </g>
      `;
    });
    
    stepsSvg += `</g>`;
    
    return svg.replace('{{ACTION_STEPS}}', stepsSvg);
  }
  
  private insertStatsVisualization(svg: string, stats: Array<{label: string; value: number; unit?: string}>): string {
    let statsSvg = `
      <g transform="translate(50, 300)">
        <text x="0" y="-10" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Key Statistics</text>
    `;
    
    stats.forEach((stat, index) => {
      statsSvg += `
        <g transform="translate(0, ${index * 70})">
          <text x="0" y="0" font-family="Arial" font-size="14" fill="#556475">${stat.label}</text>
          <text x="0" y="30" font-family="Arial" font-size="24" font-weight="bold" fill="#FF6400">${stat.value}${stat.unit ? ' ' + stat.unit : ''}</text>
        </g>
      `;
    });
    
    statsSvg += `</g>`;
    
    return svg.replace('{{STATS_VISUALIZATION}}', statsSvg);
  }
  
  private insertActUpLogo(svg: string): string {
    // SVG representation of the Act Up logo
    const logoSvg = `
      <g transform="translate(550, 50) scale(0.15)">
        <!-- Orange triangle with white cutout -->
        <path d="M145,528 L435,0 L435,435 L145,528 Z" fill="#FF6400" />
        <path d="M285,264 L360,150 L360,360 L285,264 Z" fill="white" />
        
        <!-- Navy blue "ACT UP" text -->
        <g transform="translate(0, 575)">
          <text font-family="Arial" font-size="150" font-weight="bold" fill="#100244">ACT UP</text>
        </g>
      </g>
    `;
    
    return svg.replace('{{ACT_UP_LOGO}}', logoSvg);
  }
  
  // Default templates with placeholders
  
  private getDefaultBillTemplate(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- Background -->
      <rect width="800" height="600" fill="#0FAFA" />
      
      <!-- Header -->
      <rect x="0" y="0" width="800" height="80" fill="#100244" />
      <text x="50" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="white">{{BILL_ID}}: Legislative Infographic</text>
      
      <!-- Logo placeholder -->
      {{ACT_UP_LOGO}}
      
      <!-- Bill Content -->
      <g transform="translate(50, 100)">
        <text x="0" y="0" font-family="Arial" font-size="20" font-weight="bold" fill="#100244">{{BILL_TITLE}}</text>
        
        <text x="0" y="40" font-family="Arial" font-size="14" fill="#556475">{{BILL_DESCRIPTION}}</text>
        
        <text x="0" y="80" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Status: {{BILL_STATUS}}</text>
        <text x="0" y="105" font-family="Arial" font-size="14" fill="#556475">{{BILL_CHAMBER}} Bill</text>
        
        <text x="0" y="140" font-family="Arial" font-size="14" fill="#556475">Introduced: {{INTRODUCED_DATE}}</text>
        <text x="0" y="165" font-family="Arial" font-size="14" fill="#556475">Last Action: {{LAST_ACTION}} ({{LAST_ACTION_DATE}})</text>
        
        <text x="0" y="200" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Primary Sponsor</text>
        <text x="0" y="225" font-family="Arial" font-size="14" fill="#556475">{{PRIMARY_SPONSOR}}</text>
        
        <text x="0" y="260" font-family="Arial" font-size="14" fill="#556475">Cosponsors: {{COSPONSOR_COUNT}}</text>
        
        <text x="0" y="300" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Topics</text>
        <text x="0" y="325" font-family="Arial" font-size="14" fill="#556475">{{TOPICS}}</text>
      </g>
      
      <!-- Support meter placeholder -->
      {{SUPPORT_METER}}
      
      <!-- Bill timeline placeholder -->
      {{BILL_TIMELINE}}
      
      <!-- Impact assessment -->
      <g transform="translate(400, 100)">
        <text x="0" y="0" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Impact Assessment</text>
        <foreignObject x="0" y="20" width="350" height="200">
          <p xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; font-size: 14px; color: #556475; margin: 0;">
            {{IMPACT_SUMMARY}}
          </p>
        </foreignObject>
      </g>
      
      <!-- Footer -->
      <g transform="translate(50, 570)">
        <text font-family="Arial" font-size="12" fill="#556475">Generated on {{CURRENT_DATE}} · ActUp.org - We don't editorialize. We reveal.</text>
      </g>
    </svg>`;
  }
  
  private getDefaultVotingTemplate(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- Background -->
      <rect width="800" height="600" fill="#0FAFA" />
      
      <!-- Header -->
      <rect x="0" y="0" width="800" height="80" fill="#100244" />
      <text x="50" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="white">Election Information</text>
      
      <!-- Logo placeholder -->
      {{ACT_UP_LOGO}}
      
      <!-- Election Content -->
      <g transform="translate(50, 100)">
        <text x="0" y="0" font-family="Arial" font-size="20" font-weight="bold" fill="#100244">{{ELECTION_TITLE}}</text>
        
        <text x="0" y="40" font-family="Arial" font-size="16" fill="#100244">{{ELECTION_TYPE}} Election</text>
        <text x="0" y="65" font-family="Arial" font-size="16" fill="#100244">{{ELECTION_DATE}}</text>
        
        <text x="0" y="100" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">Where</text>
        <text x="0" y="125" font-family="Arial" font-size="14" fill="#556475">{{LOCATION_STATE}}
          ${(params: {district?: string, county?: string}) => 
            (params.district ? `, District ${params.district}` : '') + 
            (params.county ? `, ${params.county} County` : '')
          }
        </text>
        
        <text x="0" y="160" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">When to Vote</text>
        <text x="0" y="185" font-family="Arial" font-size="14" fill="#556475">{{POLLING_HOURS}}</text>
        
        <text x="0" y="210" font-family="Arial" font-size="14" fill="#556475">Early Voting: {{EARLY_VOTING_AVAILABLE}}</text>
        <text x="0" y="235" font-family="Arial" font-size="14" fill="#556475">{{EARLY_VOTING_DATES}}</text>
      </g>
      
      <!-- Candidates placeholder -->
      {{CANDIDATES_LIST}}
      
      <!-- Measures placeholder -->
      {{MEASURES_LIST}}
      
      <!-- Polling locations placeholder -->
      {{POLLING_LOCATIONS}}
      
      <!-- Footer -->
      <g transform="translate(50, 570)">
        <text font-family="Arial" font-size="12" fill="#556475">Generated on {{CURRENT_DATE}} · ActUp.org - Direct. Honest. Urgent.</text>
      </g>
    </svg>`;
  }
  
  private getDefaultCivicActionTemplate(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- Background -->
      <rect width="800" height="600" fill="#0FAFA" />
      
      <!-- Header -->
      <rect x="0" y="0" width="800" height="80" fill="#100244" />
      <text x="50" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="white">{{ACTION_TYPE}} Action</text>
      
      <!-- Logo placeholder -->
      {{ACT_UP_LOGO}}
      
      <!-- Action Content -->
      <g transform="translate(50, 100)">
        <text x="0" y="0" font-family="Arial" font-size="20" font-weight="bold" fill="#100244">{{ACTION_TITLE}}</text>
        
        <foreignObject x="0" y="20" width="700" height="100">
          <p xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; font-size: 14px; color: #556475; margin: 0;">
            {{ACTION_DESCRIPTION}}
          </p>
        </foreignObject>
        
        <text x="0" y="140" font-family="Arial" font-size="16" font-weight="bold" fill="#100244">When & Where</text>
        <text x="0" y="165" font-family="Arial" font-size="14" fill="#556475">Date: {{ACTION_DATE}}</text>
        <text x="0" y="190" font-family="Arial" font-size="14" fill="#556475">Location: {{ACTION_LOCATION}}</text>
        
        <text x="0" y="225" font-family="Arial" font-size="14" fill="#556475">Organized by: {{ACTION_ORGANIZER}}</text>
      </g>
      
      <!-- Impact information placeholder -->
      {{IMPACT_INFORMATION}}
      
      <!-- Action steps placeholder -->
      {{ACTION_STEPS}}
      
      <!-- Footer -->
      <g transform="translate(50, 570)">
        <text font-family="Arial" font-size="12" fill="#556475">Generated on {{CURRENT_DATE}} · ActUp.org - Direct. Honest. Urgent.</text>
      </g>
    </svg>`;
  }
  
  private getDefaultImpactTemplate(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- Background -->
      <rect width="800" height="600" fill="#0FAFA" />
      
      <!-- Header -->
      <rect x="0" y="0" width="800" height="80" fill="#100244" />
      <text x="50" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="white">Impact Report</text>
      
      <!-- Logo placeholder -->
      {{ACT_UP_LOGO}}
      
      <!-- Impact Content -->
      <g transform="translate(50, 100)">
        <text x="0" y="0" font-family="Arial" font-size="20" font-weight="bold" fill="#100244">{{IMPACT_TITLE}}</text>
        
        <foreignObject x="0" y="20" width="700" height="100">
          <p xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; font-size: 14px; color: #556475; margin: 0;">
            {{IMPACT_DESCRIPTION}}
          </p>
        </foreignObject>
        
        <text x="0" y="140" font-family="Arial" font-size="14" fill="#556475">Time Period: {{TIME_PERIOD}}</text>
        <text x="0" y="165" font-family="Arial" font-size="14" fill="#556475">Source: {{SOURCE}}</text>
      </g>
      
      <!-- Stats visualization placeholder -->
      {{STATS_VISUALIZATION}}
      
      <!-- Footer -->
      <g transform="translate(50, 570)">
        <text font-family="Arial" font-size="12" fill="#556475">Generated on {{CURRENT_DATE}} · ActUp.org - We don't editorialize. We reveal.</text>
      </g>
    </svg>`;
  }
}

export const infographicGeneratorService = new InfographicGeneratorService();