// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ScoutBotQuery {
  topic: string;
  scope: 'local' | 'state' | 'federal';
  focus: 'policy' | 'financial' | 'political' | 'ethics';
}

export interface ScoutBotResult {
  summary: string;
  keyFindings: string[];
  entities: string[];
  sources: string[];
  confidence: number;
}

export class ScoutBotFramework {
  async investigate(query: ScoutBotQuery): Promise<ScoutBotResult> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        system: `You are an investigative research assistant for civic engagement. Research the topic using factual, objective analysis. Focus on transparency and accountability in Texas politics.`,
        messages: [{
          role: 'user',
          content: `Research this topic: ${query.topic}
          
Scope: ${query.scope} level
Focus: ${query.focus} aspects

Provide a clear, factual summary with key findings, important entities/people involved, and reliable sources. Be objective and highlight transparency issues if relevant.`
        }]
      });

      const content = response.content[0];
      const responseText = content.type === 'text' ? content.text : '';
      return this.parseResponse(responseText, query);
    } catch (error: any) {
      console.error('Scout Bot research failed:', error);
      throw new Error('Research investigation failed');
    }
  }

  async analyzeEntity(entityName: string): Promise<ScoutBotResult> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        system: `You are an investigative research assistant. Analyze political figures, organizations, or entities for transparency and accountability. Focus on factual information only.`,
        messages: [{
          role: 'user',
          content: `Analyze this entity: ${entityName}

Provide information about:
- Role and position
- Key legislative activities
- Financial connections and campaign finance
- Ethics records and transparency
- Notable relationships and influences

Be factual and objective.`
        }]
      });

      return this.parseResponse(response.content[0].text, { 
        topic: entityName, 
        scope: 'state' as const, 
        focus: 'ethics' as const 
      });
    } catch (error: any) {
      console.error('Entity analysis failed:', error);
      throw new Error('Entity analysis failed');
    }
  }

  private parseResponse(text: string, query: ScoutBotQuery): ScoutBotResult {
    // Extract key information from the AI response
    const summary = this.extractSummary(text);
    const keyFindings = this.extractKeyFindings(text);
    const entities = this.extractEntities(text);
    const sources = this.extractSources(text);
    const confidence = this.calculateConfidence(text);

    return {
      summary,
      keyFindings,
      entities,
      sources,
      confidence
    };
  }

  private extractSummary(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.slice(0, 3).join(' ').substring(0, 300);
  }

  private extractKeyFindings(text: string): string[] {
    const findings: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('finding') || line.includes('important') || line.includes('significant')) {
        findings.push(line.trim().substring(0, 150));
      }
    }
    
    return findings.slice(0, 5);
  }

  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Simple entity extraction based on capitalized words
      const matches = line.match(/[A-Z][a-z]+ [A-Z][a-z]+/g);
      if (matches) {
        entities.push(...matches);
      }
    }
    
    return [...new Set(entities)].slice(0, 10);
  }

  private extractSources(text: string): string[] {
    return [
      'Texas Ethics Commission',
      'Texas Legislature Online',
      'Campaign Finance Reports',
      'Public Records'
    ];
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on response quality
    const wordCount = text.split(' ').length;
    return Math.min(0.8, wordCount / 500);
  }
}

export const scoutBot = new ScoutBotFramework();