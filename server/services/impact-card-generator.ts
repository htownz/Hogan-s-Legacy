import OpenAI from 'openai';
import { legiscanService } from './legiscan-service';
import { createLogger } from "../logger";
const log = createLogger("impact-card-generator");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface ImpactCard {
  id: string;
  billId: number;
  billNumber: string;
  title: string;
  impactSummary: string;
  keyStats: Array<{
    label: string;
    value: string;
    icon: string;
  }>;
  visualElements: {
    primaryColor: string;
    accentColor: string;
    backgroundPattern: string;
    iconSet: string;
  };
  socialText: {
    twitter: string;
    facebook: string;
    linkedin: string;
  };
  callToAction: {
    text: string;
    url: string;
  };
  createdAt: Date;
}

export interface ShareableGraphic {
  id: string;
  type: 'impact_card' | 'bill_timeline' | 'vote_tracker' | 'comparison_chart';
  format: 'social_media' | 'story' | 'banner' | 'infographic';
  dimensions: {
    width: number;
    height: number;
  };
  svgContent: string;
  metadata: {
    billId: number;
    title: string;
    description: string;
    tags: string[];
  };
  socialOptimized: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
  };
}

/**
 * Generates an impact card for a specific bill
 */
export async function generateImpactCard(
  billId: number,
  style: 'modern' | 'classic' | 'bold' | 'minimal' = 'modern'
): Promise<{ success: boolean; data?: ImpactCard; error?: string }> {
  try {
    log.info(`Generating impact card for bill ${billId} with ${style} style`);

    // Get bill details from LegiScan
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      return {
        success: false,
        error: `Bill ${billId} not found in legislative database`
      };
    }

    // Use AI to analyze bill impact and generate card content
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert civic engagement analyst who creates compelling, factual impact cards for legislative bills. Your goal is to make complex legislation accessible and actionable for everyday citizens.

ANALYSIS FRAMEWORK:
1. Personal Impact: How does this bill affect individuals, families, and communities?
2. Economic Impact: What are the financial implications - costs, savings, jobs, taxes?
3. Social Impact: How does this change daily life, rights, services, or opportunities?
4. Timeline Impact: When would changes take effect and what's the urgency?
5. Stakeholder Impact: Who supports/opposes this and why?

CONTENT GUIDELINES:
- Use concrete numbers and percentages when available
- Translate legislative jargon into everyday language
- Focus on practical, real-world consequences
- Include actionable next steps for citizens
- Create urgency without fearmongering
- Maintain strict factual accuracy
- Avoid partisan language while being engaging

DESIGN PRINCIPLES:
- Prioritize clarity and readability
- Use visual hierarchy to guide attention
- Select colors that enhance comprehension
- Choose statistics that resonate with citizens
- Create social media optimized messaging`
        },
        {
          role: 'user',
          content: `Create an impact card for this bill:

Title: ${billDetails.title}
Bill Number: ${billDetails.bill_number}
Status: ${billDetails.status}
State: ${billDetails.state}
Description: ${billDetails.description || 'No description available'}

Style preference: ${style}

Generate compelling content that helps citizens understand the bill's impact and encourages civic engagement.`
        }
      ],
      functions: [
        {
          name: 'createImpactCard',
          description: 'Create an impact card with visual and social content',
          parameters: {
            type: 'object',
            properties: {
              impactSummary: {
                type: 'string',
                description: 'Clear, concise summary of what this bill means for citizens'
              },
              keyStats: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    value: { type: 'string' },
                    icon: { type: 'string' },
                    trend: { type: 'string', enum: ['up', 'down', 'neutral'] },
                    context: { type: 'string' }
                  }
                },
                description: 'Key statistics with context and trends - focus on numbers that matter to citizens'
              },
              impactCategories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    impact: { type: 'string' },
                    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                    timeline: { type: 'string' }
                  }
                },
                description: 'Categorized impacts on different aspects of citizen life'
              },
              citizenActions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific actions citizens can take regarding this bill'
              },
              visualElements: {
                type: 'object',
                properties: {
                  primaryColor: { type: 'string' },
                  accentColor: { type: 'string' },
                  backgroundPattern: { type: 'string' },
                  iconSet: { type: 'string' }
                },
                description: 'Visual design elements for the card'
              },
              socialText: {
                type: 'object',
                properties: {
                  twitter: { type: 'string' },
                  facebook: { type: 'string' },
                  linkedin: { type: 'string' }
                },
                description: 'Platform-optimized social media text'
              },
              callToAction: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  url: { type: 'string' }
                },
                description: 'Call to action for civic engagement'
              }
            },
            required: ['impactSummary', 'keyStats', 'visualElements', 'socialText', 'callToAction']
          }
        }
      ],
      function_call: { name: 'createImpactCard' }
    });

    if (response.choices[0].message.function_call) {
      const cardData = JSON.parse(response.choices[0].message.function_call.arguments);
      
      const impactCard: ImpactCard = {
        id: `card-${billId}-${Date.now()}`,
        billId,
        billNumber: billDetails.bill_number,
        title: billDetails.title,
        impactSummary: cardData.impactSummary,
        keyStats: cardData.keyStats,
        visualElements: cardData.visualElements,
        socialText: cardData.socialText,
        callToAction: {
          text: cardData.callToAction.text,
          url: cardData.callToAction.url || `/bills/${billId}`
        },
        createdAt: new Date()
      };

      log.info(`Impact card generated successfully for bill ${billId}`);
      return {
        success: true,
        data: impactCard
      };
    }

    return {
      success: false,
      error: 'Failed to generate impact card content'
    };

  } catch (error: any) {
    log.error({ err: error }, 'Error generating impact card');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generates SVG graphics for social media sharing
 */
export async function generateShareableGraphic(
  impactCard: ImpactCard,
  format: ShareableGraphic['format'] = 'social_media'
): Promise<{ success: boolean; data?: ShareableGraphic; error?: string }> {
  try {
    log.info(`Generating shareable graphic for impact card ${impactCard.id}`);

    // Define dimensions based on format
    const dimensions = getDimensionsForFormat(format);
    
    // Generate SVG content
    const svgContent = createSVGGraphic(impactCard, format, dimensions);
    
    const shareableGraphic: ShareableGraphic = {
      id: `graphic-${impactCard.id}-${format}`,
      type: 'impact_card',
      format,
      dimensions,
      svgContent,
      metadata: {
        billId: impactCard.billId,
        title: impactCard.title,
        description: impactCard.impactSummary,
        tags: ['legislation', 'civic-engagement', 'democracy', impactCard.billNumber]
      },
      socialOptimized: generateSocialOptimizedContent(impactCard)
    };

    return {
      success: true,
      data: shareableGraphic
    };

  } catch (error: any) {
    log.error({ err: error }, 'Error generating shareable graphic');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Creates SVG content for the graphic
 */
function createSVGGraphic(
  card: ImpactCard,
  format: ShareableGraphic['format'],
  dimensions: { width: number; height: number }
): string {
  const { width, height } = dimensions;
  const { primaryColor, accentColor } = card.visualElements;

  // Enhanced color palette based on style
  const colors = getEnhancedColorPalette(primaryColor, accentColor);
  
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Enhanced gradients -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.background1};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors.background2};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${colors.background3};stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.primary}" />
      <stop offset="100%" style="stop-color:${colors.primaryDark}" />
    </linearGradient>
    
    <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.accent}" />
      <stop offset="100%" style="stop-color:${colors.accentDark}" />
    </linearGradient>
    
    <!-- Enhanced shadows and effects -->
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(0,0,0,0.15)"/>
    </filter>
    
    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.2)"/>
    </filter>
    
    <!-- Pattern for background texture -->
    <pattern id="gridPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1" fill="${colors.primary}" opacity="0.05"/>
    </pattern>
  </defs>
  
  <!-- Main background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
  <rect width="${width}" height="${height}" fill="url(#gridPattern)" />
  
  <!-- Header section with enhanced design -->
  <rect x="0" y="0" width="${width}" height="120" fill="url(#headerGradient)" filter="url(#cardShadow)" />
  
  <!-- Act Up logo and branding -->
  <g transform="translate(40, 25)">
    <circle cx="15" cy="15" r="12" fill="white" opacity="0.2"/>
    <text x="15" y="20" font-family="Arial Black, sans-serif" font-size="14" font-weight="900" fill="white" text-anchor="middle">🏛️</text>
    <text x="40" y="12" font-family="Arial Black, sans-serif" font-size="20" font-weight="bold" fill="white" filter="url(#textShadow)">ACT UP</text>
    <text x="40" y="28" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.9)">LEGISLATIVE TRANSPARENCY</text>
  </g>
  
  <!-- Bill number badge with enhanced styling -->
  <g transform="translate(${width - 200}, 25)">
    <rect x="0" y="0" width="140" height="50" rx="25" fill="white" opacity="0.15" />
    <rect x="5" y="5" width="130" height="40" rx="20" fill="white" opacity="0.9" />
    <text x="70" y="30" font-family="Arial Black, sans-serif" font-size="16" font-weight="bold" fill="${colors.primary}" text-anchor="middle">${card.billNumber}</text>
  </g>
  
  <!-- Main content area -->
  <g transform="translate(0, 140)">
    <!-- Title section with better typography -->
    <rect x="40" y="20" width="${width - 80}" height="80" fill="white" opacity="0.9" rx="15" filter="url(#cardShadow)" />
    <text x="60" y="50" font-family="Arial Black, sans-serif" font-size="22" font-weight="bold" fill="${colors.textPrimary}">
      ${wrapTextEnhanced(card.title, 45, 60, 50, 26, width - 120)}
    </text>
    
    <!-- Impact summary with enhanced styling -->
    <rect x="40" y="120" width="${width - 80}" height="100" fill="white" opacity="0.95" rx="15" filter="url(#cardShadow)" />
    <text x="60" y="145" font-family="Arial, sans-serif" font-size="16" fill="${colors.textSecondary}" font-weight="500">
      <tspan x="60" dy="0" font-weight="bold" fill="${colors.primary}">IMPACT:</tspan>
      ${wrapTextEnhanced(card.impactSummary, 55, 60, 165, 18, width - 120)}
    </text>
    
    <!-- Enhanced key stats with visual indicators -->
    ${generateEnhancedStats(card.keyStats, colors, width)}
    
    <!-- Call to action with gradient and hover effect -->
    <rect x="40" y="${height - 260}" width="${width - 80}" height="60" rx="30" fill="url(#ctaGradient)" filter="url(#cardShadow)" />
    <text x="${width / 2}" y="${height - 225}" font-family="Arial Black, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" filter="url(#textShadow)">${card.callToAction.text.toUpperCase()}</text>
    
    <!-- Enhanced footer with social proof -->
    <rect x="40" y="${height - 180}" width="${width - 80}" height="120" fill="white" opacity="0.95" rx="15" />
    <text x="${width / 2}" y="${height - 140}" font-family="Arial, sans-serif" font-size="14" fill="${colors.textSecondary}" text-anchor="middle" font-weight="600">
      Join thousands of engaged citizens on ActUp.org
    </text>
    <text x="${width / 2}" y="${height - 120}" font-family="Arial, sans-serif" font-size="12" fill="${colors.textTertiary}" text-anchor="middle">
      ✓ Verified Information  ✓ Real-Time Updates  ✓ Take Action
    </text>
    
    <!-- QR code placeholder for mobile engagement -->
    <rect x="${width / 2 - 30}" y="${height - 100}" width="60" height="60" fill="${colors.primary}" opacity="0.1" rx="8" />
    <text x="${width / 2}" y="${height - 65}" font-family="Arial, sans-serif" font-size="24" fill="${colors.primary}" text-anchor="middle">📱</text>
  </g>
</svg>`.trim();
}

/**
 * Enhanced color palette generator
 */
function getEnhancedColorPalette(primary: string, accent: string) {
  // Default to Act Up brand colors if not provided
  const primaryBase = primary || '#2563eb';
  const accentBase = accent || '#7c3aed';
  
  return {
    primary: primaryBase,
    primaryDark: adjustColor(primaryBase, -20),
    primaryLight: adjustColor(primaryBase, 40),
    accent: accentBase,
    accentDark: adjustColor(accentBase, -20),
    accentLight: adjustColor(accentBase, 40),
    background1: '#f8fafc',
    background2: '#f1f5f9',
    background3: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textTertiary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
}

/**
 * Color adjustment utility
 */
function adjustColor(color: string, percent: number): string {
  // Simple color adjustment - in production you'd use a proper color library
  if (color.startsWith('#')) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  return color;
}

/**
 * Enhanced text wrapping with better typography
 */
function wrapTextEnhanced(
  text: string, 
  maxCharsPerLine: number, 
  x: number, 
  y: number, 
  lineHeight: number,
  maxWidth: number
): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 3).map((line, index) => 
    `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${line}${lines.length > 3 && index === 2 ? '...' : ''}</tspan>`
  ).join('');
}

/**
 * Generate enhanced statistics visualization
 */
function generateEnhancedStats(stats: any[], colors: any, width: number): string {
  return stats.slice(0, 3).map((stat, index) => {
    const x = 40 + (index * ((width - 80) / 3));
    const statWidth = (width - 120) / 3;
    
    // Determine trend icon and color
    const trendIcon = stat.trend === 'up' ? '↗️' : stat.trend === 'down' ? '↘️' : '➡️';
    const trendColor = stat.trend === 'up' ? colors.success : stat.trend === 'down' ? colors.error : colors.textSecondary;
    
    return `
    <g transform="translate(${x}, 240)">
      <!-- Stat card background -->
      <rect x="0" y="0" width="${statWidth}" height="120" fill="white" opacity="0.95" rx="12" filter="url(#cardShadow)" />
      
      <!-- Stat icon and trend -->
      <circle cx="20" cy="25" r="15" fill="${colors.accent}" opacity="0.15" />
      <text x="20" y="30" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">${stat.icon || '📊'}</text>
      <text x="${statWidth - 20}" y="25" font-family="Arial, sans-serif" font-size="16" text-anchor="middle">${trendIcon}</text>
      
      <!-- Stat value (prominent) -->
      <text x="20" y="60" font-family="Arial Black, sans-serif" font-size="24" font-weight="bold" fill="${colors.primary}">${stat.value}</text>
      
      <!-- Stat label -->
      <text x="20" y="80" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="${colors.textSecondary}">
        ${wrapTextEnhanced(stat.label, 15, 20, 80, 14, statWidth - 40)}
      </text>
      
      <!-- Context if available -->
      ${stat.context ? `<text x="20" y="100" font-family="Arial, sans-serif" font-size="10" fill="${colors.textTertiary}">${truncateText(stat.context, 20)}</text>` : ''}
    </g>`;
  }).join('');
}

/**
 * Helper function to get dimensions for different formats
 */
function getDimensionsForFormat(format: ShareableGraphic['format']): { width: number; height: number } {
  switch (format) {
    case 'social_media': return { width: 1200, height: 630 }; // Facebook/Twitter
    case 'story': return { width: 1080, height: 1920 }; // Instagram/Facebook Stories
    case 'banner': return { width: 1500, height: 500 }; // Website banners
    case 'infographic': return { width: 800, height: 1200 }; // Detailed infographics
    default: return { width: 1200, height: 630 };
  }
}

/**
 * Helper function to truncate text
 */
function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Helper function to wrap text in SVG
 */
function wrapText(text: string, maxCharsPerLine: number, x: number, y: number, lineHeight: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 4).map((line, index) => 
    `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${line}</tspan>`
  ).join('');
}

/**
 * Generates social media optimized content
 */
function generateSocialOptimizedContent(card: ImpactCard): ShareableGraphic['socialOptimized'] {
  return {
    twitter: `🏛️ ${card.billNumber}: ${card.impactSummary.substring(0, 200)}... ${card.callToAction.text} #CivicEngagement #Democracy`,
    facebook: `📊 New bill alert: ${card.billNumber}\n\n${card.impactSummary}\n\n${card.callToAction.text}\n\nStay informed about legislation that affects you!`,
    instagram: `🗳️ ${card.billNumber} Impact\n\n${card.impactSummary.substring(0, 150)}...\n\n#CivicEngagement #Democracy #YourVoteMatters`,
    linkedin: `Legislative Update: ${card.billNumber}\n\n${card.impactSummary}\n\nUnderstanding legislation is key to informed civic participation. ${card.callToAction.text}`
  };
}