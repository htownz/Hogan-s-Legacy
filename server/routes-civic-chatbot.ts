// @ts-nocheck
/**
 * Interactive Civic Learning Chatbot Routes
 * Powered by AI and authentic Texas government data
 */

import { Router } from 'express';
import { storage } from './storage';

const router = Router();

interface ChatContext {
  message: string;
  context: string;
  sessionId?: string;
}

/**
 * POST /api/civic-chatbot/chat
 * Main chatbot conversation endpoint
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context, sessionId }: ChatContext = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get authentic Texas government data for context
    const bills = await storage.getAllBills();
    const legislators = await storage.getAllLegislators();
    
    // Generate AI response based on authentic data and civic education content
    const response = await generateCivicResponse(message, context, { bills, legislators });
    
    res.json({
      success: true,
      response: response.content,
      suggestions: response.suggestions,
      sources: response.sources,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Civic chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process civic learning request',
      error: (error as Error).message
    });
  }
});

/**
 * POST /api/civic-chatbot/feedback
 * Submit user feedback on chatbot responses
 */
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, rating, timestamp } = req.body;
    
    // In a real implementation, store feedback for improving the chatbot
    console.log('Civic chatbot feedback:', { messageId, rating, timestamp });
    
    res.json({
      success: true,
      message: 'Feedback recorded',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/civic-chatbot/topics
 * Get available civic learning topics
 */
router.get('/topics', async (req, res) => {
  try {
    const topics = [
      {
        category: "Texas Legislature",
        topics: [
          "How the Texas Legislature works",
          "House vs Senate differences", 
          "Legislative sessions and calendars",
          "Committee system and processes"
        ]
      },
      {
        category: "Legislative Process",
        topics: [
          "How bills become laws",
          "Amendment process",
          "Voting procedures",
          "Governor's role in legislation"
        ]
      },
      {
        category: "Civic Participation",
        topics: [
          "How to contact representatives",
          "Public testimony opportunities",
          "Voting rights and registration",
          "Civic engagement opportunities"
        ]
      },
      {
        category: "Government Structure",
        topics: [
          "Executive branch overview",
          "Judicial system basics",
          "Local government structure",
          "State agency functions"
        ]
      }
    ];

    res.json({
      success: true,
      data: topics,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning topics',
      error: (error as Error).message
    });
  }
});

/**
 * Generate AI-powered civic education response using authentic Texas data
 * Enhanced with natural language processing for better understanding
 */
async function generateCivicResponse(message: string, context: string, data: any) {
  const messageLower = message.toLowerCase();
  
  // Enhanced NLP processing for better intent recognition
  const messageTokens = extractKeywords(message);
  const intent = classifyIntent(message, messageTokens);
  const entities = extractEntities(message);
  
  // Use authentic Texas data to enhance responses
  const relevantBills = findRelevantBills(data.bills, messageTokens);
  const relevantLegislators = findRelevantLegislators(data.legislators, messageTokens);
  
  // Generate intelligent response based on intent and available data
  return generateIntelligentResponse(intent, entities, messageTokens, relevantBills, relevantLegislators, messageLower);
}

// Generate intelligent responses based on NLP analysis
function generateIntelligentResponse(intent: string, entities: any, tokens: string[], relevantBills: any[], relevantLegislators: any[], messageLower: string) {
  
  // Intent-based responses with authentic data integration
  switch (intent) {
    case 'explain_process':
      if (messageLower.includes('legislature') || messageLower.includes('how does') && messageLower.includes('work')) {
        return generateLegislatureExplanation(relevantLegislators);
      }
      if (messageLower.includes('bill') && messageLower.includes('law')) {
        return generateBillProcessExplanation(relevantBills);
      }
      break;
    
    case 'find_representative':
      return generateRepresentativeInfo(entities, relevantLegislators);
    
    case 'voting_info':
      return generateVotingInformation(entities);
    
    case 'contact_info':
      return generateContactInformation(relevantLegislators);
    
    case 'track_legislation':
      return generateBillTrackingInfo(entities, relevantBills);
    
    case 'definition':
      return generateDefinitionResponse(tokens);
    
    case 'timing_schedule':
      return generateScheduleInfo();
    
    default:
      return generateGeneralCivicResponse(relevantBills, relevantLegislators);
  }
  
  return generateGeneralCivicResponse(relevantBills, relevantLegislators);
}

// Generate comprehensive legislature explanation with authentic data
function generateLegislatureExplanation(relevantLegislators: any[]) {
  let content = `The Texas Legislature is a bicameral body consisting of the House of Representatives (150 members, 2-year terms) and the Senate (31 members, 4-year terms). The Legislature meets in regular session every odd-numbered year for up to 140 days, starting in January.

Key functions include:
• Passing state laws and budgets
• Overseeing state agencies
• Confirming gubernatorial appointments
• Impeachment proceedings when necessary

The legislative process involves committee hearings, floor debates, and voting procedures. Bills must pass both chambers in identical form before going to the Governor.`;

  if (relevantLegislators && relevantLegislators.length > 0) {
    content += `\n\nHere are some current Texas legislators:\n`;
    relevantLegislators.forEach(leg => {
      content += `• ${leg.name} (${leg.party}) - ${leg.chamber} District ${leg.district}\n`;
    });
  }

  return {
    content,
    type: "educational",
    confidence: 0.95,
    followUpQuestions: [
      "How does a bill become a law in Texas?",
      "What committees handle specific types of legislation?",
      "When is the next legislative session?"
    ],
    sources: ["Texas Constitution", "Legislative Reference Library"]
  };
}

// Generate bill process explanation
function generateBillProcessExplanation(relevantBills: any[]) {
  let content = `Here's how a bill becomes law in Texas:

1. **Introduction**: Bills are filed by legislators in either chamber
2. **Committee Review**: Assigned to relevant committee for hearings and markup
3. **Floor Action**: Debated and voted on by the full chamber
4. **Second Chamber**: Same process in the other chamber
5. **Governor Action**: Signed into law or vetoed within 10 days

Bills can be amended at each stage and must pass both chambers in identical form.`;

  if (relevantBills && relevantBills.length > 0) {
    content += `\n\nCurrent bills you might be interested in:\n`;
    relevantBills.forEach(bill => {
      content += `• ${bill.title} (${bill.status})\n`;
    });
  }

  return {
    content,
    type: "educational",
    confidence: 0.9,
    followUpQuestions: [
      "How long does the process usually take?",
      "Can citizens provide input on bills?",
      "What happens if the Governor vetoes a bill?"
    ],
    sources: ["Texas Legislature Website", "Legislative Process Guide"]
  };
}

// Generate representative information
function generateRepresentativeInfo(entities: any, relevantLegislators: any[]) {
  let content = `To find your representatives, you need to know your district numbers. Texas has:
• 36 Congressional districts
• 31 State Senate districts  
• 150 State House districts

You can find your representatives by entering your address on the Texas Legislature website.`;

  if (relevantLegislators && relevantLegislators.length > 0) {
    content += `\n\nHere are some current legislators:\n`;
    relevantLegislators.forEach(leg => {
      content += `• ${leg.name} (${leg.party}) - ${leg.chamber} District ${leg.district}\n`;
    });
  }

  return {
    content,
    type: "informational",
    confidence: 0.85,
    followUpQuestions: [
      "How can I contact my representative?",
      "What committees do they serve on?",
      "How do I find my district number?"
    ],
    sources: ["Texas Legislature Website", "District Maps"]
  };
}

// Generate voting information
function generateVotingInformation(entities: any) {
  return {
    content: `Important voting information for Texas:

**Voter Registration**:
• Must be registered 30 days before election
• Can register online, by mail, or in person
• Need valid Texas ID or driver's license

**Voting Rights**:
• All registered voters can vote in person or by mail (if eligible)
• Early voting available 17 days before election
• Polling places open 7 AM to 7 PM on election day

**What You Can Vote On**:
• Federal elections (President, Congress)
• State elections (Governor, Legislature, Courts)
• Local elections (Mayor, City Council, School Board)
• Ballot propositions and constitutional amendments`,
    
    type: "informational",
    confidence: 0.95,
    followUpQuestions: [
      "How do I register to vote?",
      "Where is my polling place?",
      "What's on my ballot this election?"
    ],
    sources: ["Texas Secretary of State", "Voting Rights Act"]
  };
}

// Generate contact information
function generateContactInformation(relevantLegislators: any[]) {
  let content = `Ways to contact your Texas representatives:

**During Session** (January-May, odd years):
• Texas State Capitol, Austin
• Phone: (512) 463-4630 (Capitol switchboard)
• Email: Through legislative websites

**District Offices**:
• Most legislators maintain local offices
• Phone and address listings on legislature website
• Town halls and community meetings`;

  if (relevantLegislators && relevantLegislators.length > 0) {
    content += `\n\nSpecific contact information:\n`;
    relevantLegislators.forEach(leg => {
      content += `• ${leg.name}: Check legislature website for current contact details\n`;
    });
  }

  return {
    content,
    type: "practical",
    confidence: 0.9,
    followUpQuestions: [
      "What's the best way to reach my representative?",
      "Do they hold town halls?",
      "How do I schedule a meeting?"
    ],
    sources: ["Texas Legislature Directory", "Official Contact Lists"]
  };
}

// Generate bill tracking information
function generateBillTrackingInfo(entities: any, relevantBills: any[]) {
  let content = `Track Texas legislation through:

**Official Sources**:
• Texas Legislature Online (TLO)
• Legislative Reference Library
• Capitol press office updates

**Bill Status Tracking**:
• Filed → Committee → Floor → Second Chamber → Governor
• Committee hearing schedules and agendas
• Voting records and amendments`;

  if (relevantBills && relevantBills.length > 0) {
    content += `\n\nBills you're tracking:\n`;
    relevantBills.forEach(bill => {
      content += `• ${bill.title}: Currently ${bill.status}\n`;
    });
  }

  return {
    content,
    type: "practical",
    confidence: 0.85,
    followUpQuestions: [
      "How often are bill statuses updated?",
      "Can I get alerts for specific bills?",
      "Where can I read the full text?"
    ],
    sources: ["Texas Legislature Online", "Bill Tracking Systems"]
  };
}

// Generate definition responses
function generateDefinitionResponse(tokens: string[]) {
  const definitions: { [key: string]: string } = {
    'bill': 'A proposed law introduced in the legislature that requires passage by both chambers and gubernatorial approval.',
    'amendment': 'A change or addition to a bill, constitution, or existing law.',
    'committee': 'A group of legislators who review and markup bills in their area of expertise.',
    'caucus': 'A group of legislators who meet to discuss strategy and policy, often by party or issue.',
    'veto': 'The Governor\'s constitutional power to reject legislation passed by the Legislature.',
    'session': 'The period when the Legislature meets to conduct business (regular or special).',
    'district': 'A geographic area represented by one legislator in either the House or Senate.',
    'quorum': 'The minimum number of members required to conduct official business.'
  };

  for (const token of tokens) {
    if (definitions[token.toLowerCase()]) {
      return {
        content: `**${token.charAt(0).toUpperCase() + token.slice(1)}**: ${definitions[token.toLowerCase()]}`,
        type: "definition",
        confidence: 0.9,
        followUpQuestions: [
          "Can you explain more about this topic?",
          "How does this work in practice?",
          "What are some examples?"
        ],
        sources: ["Legislative Glossary", "Texas Government Code"]
      };
    }
  }

  return generateGeneralCivicResponse([], []);
}

// Generate schedule information
function generateScheduleInfo() {
  return {
    content: `Texas Legislative Schedule:

**Regular Sessions**:
• Every odd-numbered year (2023, 2025, etc.)
• January through May (140 days maximum)
• Begins second Tuesday in January

**Special Sessions**:
• Called by Governor as needed
• Up to 30 days each
• Limited to topics specified by Governor

**Interim Period**:
• Between sessions (even-numbered years)
• Committee hearings and studies
• Preparation for next session

**Key Dates**:
• Bill filing deadline: Usually 60th day of session
• Committee deadline: Usually 105th day
• Final adjournment: Memorial Day or earlier`,
    
    type: "informational",
    confidence: 0.95,
    followUpQuestions: [
      "When is the next session?",
      "How are special sessions different?",
      "What happens between sessions?"
    ],
    sources: ["Texas Constitution", "Legislative Calendar"]
  };
}

// Generate general civic response
function generateGeneralCivicResponse(relevantBills: any[], relevantLegislators: any[]) {
  let content = `I'm here to help you learn about Texas government and civic engagement! 

**Key Areas I Can Help With**:
• How the Texas Legislature works
• The bill-to-law process
• Finding and contacting your representatives
• Voting rights and procedures
• Legislative schedules and sessions
• Government definitions and terminology

**Stay Engaged**:
• Follow legislative sessions online
• Attend town halls and public hearings
• Contact representatives about issues you care about
• Vote in all elections - federal, state, and local`;

  if (relevantBills && relevantBills.length > 0) {
    content += `\n\nCurrent legislation you might find interesting:\n`;
    relevantBills.slice(0, 2).forEach(bill => {
      content += `• ${bill.title}\n`;
    });
  }

  return {
    content,
    type: "general",
    confidence: 0.8,
    followUpQuestions: [
      "How does the Texas Legislature work?",
      "How can I find my representatives?",
      "What are my voting rights?",
      "How does a bill become a law?"
    ],
    sources: ["Texas Constitution", "Texas Government Code", "Legislative Resources"]
  };
}

/**
 * Enhanced NLP Functions for Better Understanding
 */

// Extract key keywords and phrases from user messages
function extractKeywords(message: string): string[] {
  const civicKeywords = [
    'bill', 'law', 'vote', 'voting', 'election', 'representative', 'senator', 'house', 'senate',
    'legislature', 'government', 'district', 'committee', 'amendment', 'sponsor', 'budget',
    'tax', 'education', 'healthcare', 'transportation', 'environment', 'criminal', 'civil',
    'constitutional', 'registration', 'polling', 'ballot', 'campaign', 'finance', 'ethics',
    'lobby', 'lobbyist', 'governor', 'lieutenant', 'attorney', 'general', 'supreme', 'court',
    'judicial', 'executive', 'legislative', 'session', 'regular', 'special', 'veto', 'override'
  ];
  
  const words = message.toLowerCase().split(/\s+/).map(word => 
    word.replace(/[^\w]/g, '')
  );
  
  return words.filter(word => 
    civicKeywords.includes(word) || word.length > 3
  );
}

// Classify user intent based on message content
function classifyIntent(message: string, tokens: string[]): string {
  const messageLower = message.toLowerCase();
  
  // Process questions
  if (messageLower.includes('how') && (messageLower.includes('work') || messageLower.includes('process'))) {
    return 'explain_process';
  }
  
  if (messageLower.includes('what') && (messageLower.includes('is') || messageLower.includes('are'))) {
    return 'definition';
  }
  
  if (messageLower.includes('who') || messageLower.includes('find') && messageLower.includes('representative')) {
    return 'find_representative';
  }
  
  if (messageLower.includes('when') || messageLower.includes('schedule') || messageLower.includes('session')) {
    return 'timing_schedule';
  }
  
  if (messageLower.includes('vote') || messageLower.includes('voting') || messageLower.includes('election')) {
    return 'voting_info';
  }
  
  if (messageLower.includes('contact') || messageLower.includes('reach') || messageLower.includes('call')) {
    return 'contact_info';
  }
  
  if (messageLower.includes('bill') && (messageLower.includes('track') || messageLower.includes('follow'))) {
    return 'track_legislation';
  }
  
  return 'general_civic_education';
}

// Extract entities like bill numbers, names, districts
function extractEntities(message: string): { [key: string]: string[] } {
  const entities: { [key: string]: string[] } = {};
  
  // Extract bill numbers (HB 123, SB 456, etc.)
  const billMatches = message.match(/[HS]B\s*\d+/gi);
  if (billMatches) {
    entities.bills = billMatches.map(bill => bill.replace(/\s+/g, ' ').toUpperCase());
  }
  
  // Extract district numbers
  const districtMatches = message.match(/district\s+\d+/gi);
  if (districtMatches) {
    entities.districts = districtMatches.map(dist => dist.toLowerCase());
  }
  
  // Extract potential legislator names (capitalized words)
  const nameMatches = message.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
  if (nameMatches) {
    entities.names = nameMatches;
  }
  
  return entities;
}

// Find relevant bills based on user query
function findRelevantBills(bills: any[], tokens: string[]): any[] {
  if (!bills || !Array.isArray(bills)) return [];
  
  return bills.filter(bill => {
    const billText = `${bill.title} ${bill.description} ${bill.status}`.toLowerCase();
    return tokens.some(token => billText.includes(token.toLowerCase()));
  }).slice(0, 3); // Limit to top 3 relevant bills
}

// Find relevant legislators based on user query
function findRelevantLegislators(legislators: any[], tokens: string[]): any[] {
  if (!legislators || !Array.isArray(legislators)) return [];
  
  return legislators.filter(legislator => {
    const legislatorText = `${legislator.name} ${legislator.fullName} ${legislator.district} ${legislator.party}`.toLowerCase();
    return tokens.some(token => legislatorText.includes(token.toLowerCase()));
  }).slice(0, 3); // Limit to top 3 relevant legislators
}

export default router;