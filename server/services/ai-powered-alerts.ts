// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';

/**
 * AI-Powered Legislative Alert Enhancement System
 * Uses Anthropic Claude for intelligent alert analysis and prioritization
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class AIPoweredAlertSystem {

  async enhanceAlertsWithAI(alerts: any[]) {
    console.log("🤖 Enhancing alerts with AI-powered analysis...");
    
    const enhancedAlerts = [];
    
    for (const alert of alerts) {
      try {
        const aiEnhancement = await this.analyzeAlertWithAI(alert);
        enhancedAlerts.push({
          ...alert,
          aiEnhanced: true,
          impactScore: aiEnhancement.impactScore,
          personalRelevance: aiEnhancement.personalRelevance,
          actionPriority: aiEnhancement.actionPriority,
          smartSummary: aiEnhancement.smartSummary,
          suggestedActions: aiEnhancement.suggestedActions,
          relatedTopics: aiEnhancement.relatedTopics
        });
      } catch (error: any) {
        console.error('AI enhancement error for alert:', alert.id, error);
        enhancedAlerts.push(alert);
      }
    }
    
    return enhancedAlerts;
  }

  async analyzeAlertWithAI(alert: any) {
    console.log(`🧠 AI analyzing alert: ${alert.title}`);
    
    const prompt = `
    Analyze this Texas legislative alert and provide intelligent insights:

    Alert Type: ${alert.type}
    Title: ${alert.title}
    Message: ${alert.message}
    Committee: ${alert.committee || 'N/A'}
    Bill ID: ${alert.billId || 'N/A'}
    Urgency: ${alert.urgency}
    Source: ${alert.source}

    Please provide a JSON response with:
    1. impactScore (1-10): How significant this is for Texas citizens
    2. personalRelevance (1-10): How relevant this might be to average citizens
    3. actionPriority (low/medium/high/critical): Recommended user action priority
    4. smartSummary: A concise, engaging summary in plain language
    5. suggestedActions: Array of 2-3 specific actions citizens can take
    6. relatedTopics: Array of 3-5 related policy areas or keywords
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      const aiAnalysis = JSON.parse(content.type === 'text' ? content.text : '');
      
      return {
        impactScore: Math.min(10, Math.max(1, aiAnalysis.impactScore || 5)),
        personalRelevance: Math.min(10, Math.max(1, aiAnalysis.personalRelevance || 5)),
        actionPriority: aiAnalysis.actionPriority || 'medium',
        smartSummary: aiAnalysis.smartSummary || alert.message,
        suggestedActions: aiAnalysis.suggestedActions || [],
        relatedTopics: aiAnalysis.relatedTopics || []
      };
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      return {
        impactScore: 5,
        personalRelevance: 5,
        actionPriority: 'medium',
        smartSummary: alert.message,
        suggestedActions: ['View details', 'Contact representatives'],
        relatedTopics: ['Texas Legislature']
      };
    }
  }

  async generatePersonalizedAlertFeed(userPreferences: any = {}) {
    console.log("🎯 Generating personalized alert feed with AI...");
    
    const prompt = `
    Generate personalized Texas legislative alerts based on these preferences:
    
    Interests: ${userPreferences.interests || 'General civic engagement'}
    Location: ${userPreferences.location || 'Texas'}
    Priority Topics: ${userPreferences.priorityTopics || 'Education, Healthcare, Environment'}
    
    Create 3-4 realistic alerts that would be highly relevant to this user profile.
    Focus on authentic Texas legislative processes and real committee activities.
    
    Return JSON array with: id, type, title, message, urgency, committee, source, personalizedReason
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      return JSON.parse(response.content[0].text);
    } catch (error: any) {
      console.error('Personalized feed generation failed:', error);
      return [];
    }
  }

  async intelligentAlertPrioritization(alerts: any[]) {
    console.log("🧠 AI prioritizing alerts by relevance and impact...");
    
    const prompt = `
    Prioritize these Texas legislative alerts for maximum citizen engagement:
    
    ${alerts.map((alert, i) => `
    ${i + 1}. ${alert.title}
       Type: ${alert.type}
       Urgency: ${alert.urgency}
       Committee: ${alert.committee || 'N/A'}
       Message: ${alert.message}
    `).join('\n')}
    
    Rank them 1-${alerts.length} based on:
    - Immediate impact on Texas citizens
    - Time-sensitive action opportunities
    - Civic engagement potential
    
    Return JSON: { "prioritizedOrder": [array of alert IDs in priority order], "reasoning": "brief explanation" }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const prioritization = JSON.parse(response.content[0].text);
      
      // Reorder alerts based on AI prioritization
      const prioritizedAlerts = prioritization.prioritizedOrder
        .map((id: string) => alerts.find(alert => alert.id === id))
        .filter(Boolean);
      
      return {
        alerts: prioritizedAlerts,
        reasoning: prioritization.reasoning
      };
    } catch (error: any) {
      console.error('Alert prioritization failed:', error);
      return { alerts, reasoning: 'Default chronological order' };
    }
  }

  async generateSmartAlertInsights(alertHistory: any[]) {
    console.log("📊 Generating smart insights from alert patterns...");
    
    const prompt = `
    Analyze these Texas legislative alert patterns and generate insights:
    
    Recent Alerts:
    ${alertHistory.slice(0, 10).map(alert => `
    - ${alert.title} (${alert.type}, ${alert.urgency})
    `).join('\n')}
    
    Provide insights in JSON format:
    {
      "trends": ["key trends in legislative activity"],
      "hotTopics": ["most active policy areas"],
      "urgentAreas": ["areas needing immediate attention"],
      "opportunities": ["upcoming civic engagement opportunities"],
      "recommendations": ["personalized recommendations for user"]
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });

      return JSON.parse(response.content[0].text);
    } catch (error: any) {
      console.error('Smart insights generation failed:', error);
      return {
        trends: ['Active legislative session'],
        hotTopics: ['Education', 'Healthcare'],
        urgentAreas: ['Committee deadlines'],
        opportunities: ['Public comment periods'],
        recommendations: ['Stay engaged with your representatives']
      };
    }
  }

  async predictiveAlertAnalysis(alerts: any[]) {
    console.log("🔮 Running AI predictive analysis on legislative patterns...");
    
    const prompt = `
    Analyze these Texas legislative alerts and predict future developments:
    
    Recent Activity:
    ${alerts.slice(0, 8).map(alert => `
    - ${alert.title} (${alert.type}, Impact: ${alert.impactScore || 'Unknown'})
      Message: ${alert.message}
      Committee: ${alert.committee || 'N/A'}
    `).join('\n')}
    
    Based on these patterns, predict:
    1. What legislative developments are likely in the next 2 weeks
    2. Which committees will be most active
    3. What bills are likely to advance
    4. Emerging policy priorities
    5. Opportunities for citizen engagement
    
    Return JSON: {
      "predictions": ["specific predictions"],
      "hotCommittees": ["committee names"],
      "advancingBills": ["bill topics"],
      "emergingPriorities": ["policy areas"],
      "engagementOpportunities": ["specific opportunities"],
      "confidence": "high/medium/low"
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      return JSON.parse(content.type === 'text' ? content.text : '{}');
    } catch (error: any) {
      console.error('Predictive analysis failed:', error);
      return {
        predictions: ['Legislative session continues with education and healthcare focus'],
        hotCommittees: ['House State Affairs', 'Senate Education'],
        advancingBills: ['Education funding', 'Healthcare access'],
        emergingPriorities: ['Budget priorities', 'Regulatory reform'],
        engagementOpportunities: ['Committee hearings', 'Public comment periods'],
        confidence: 'medium'
      };
    }
  }

  async sentimentAnalysisOfAlerts(alerts: any[]) {
    console.log("😊 Analyzing sentiment and public mood from legislative activity...");
    
    const prompt = `
    Analyze the sentiment and public impact of these Texas legislative alerts:
    
    ${alerts.slice(0, 6).map(alert => `
    Alert: ${alert.title}
    Message: ${alert.message}
    Type: ${alert.type}
    `).join('\n')}
    
    Analyze:
    1. Overall sentiment (positive/negative/neutral)
    2. Public mood implications
    3. Citizen engagement level
    4. Urgency perception
    5. Democratic health indicators
    
    Return JSON: {
      "overallSentiment": "positive/negative/neutral",
      "sentimentScore": 1-10,
      "publicMood": "description",
      "engagementLevel": "high/medium/low",
      "urgencyLevel": "critical/high/medium/low",
      "democraticHealth": "strong/moderate/concerning",
      "recommendations": ["specific recommendations"]
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      return JSON.parse(content.type === 'text' ? content.text : '{}');
    } catch (error: any) {
      console.error('Sentiment analysis failed:', error);
      return {
        overallSentiment: 'neutral',
        sentimentScore: 5,
        publicMood: 'Moderate legislative activity',
        engagementLevel: 'medium',
        urgencyLevel: 'medium',
        democraticHealth: 'moderate',
        recommendations: ['Stay informed', 'Engage with representatives']
      };
    }
  }

  async intelligentAlertClustering(alerts: any[]) {
    console.log("🧩 AI clustering related alerts by topic and urgency...");
    
    const prompt = `
    Group these Texas legislative alerts into intelligent clusters:
    
    ${alerts.map((alert, i) => `
    ${i + 1}. ${alert.title}
       Type: ${alert.type}
       Message: ${alert.message}
       Committee: ${alert.committee || 'N/A'}
    `).join('\n')}
    
    Create logical clusters based on:
    - Related policy areas
    - Urgency levels
    - Committee connections
    - Citizen impact
    
    Return JSON: {
      "clusters": [
        {
          "name": "cluster name",
          "theme": "policy theme",
          "alertIds": ["alert IDs in this cluster"],
          "urgency": "high/medium/low",
          "summary": "brief summary",
          "actionItems": ["suggested actions"]
        }
      ]
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      return JSON.parse(content.type === 'text' ? content.text : '{"clusters": []}');
    } catch (error: any) {
      console.error('Alert clustering failed:', error);
      return {
        clusters: [
          {
            name: 'Education & Healthcare',
            theme: 'Public Services',
            alertIds: alerts.slice(0, 2).map(a => a.id),
            urgency: 'high',
            summary: 'Critical public service legislation',
            actionItems: ['Monitor committee votes', 'Contact representatives']
          }
        ]
      };
    }
  }
}

export const aiPoweredAlerts = new AIPoweredAlertSystem();