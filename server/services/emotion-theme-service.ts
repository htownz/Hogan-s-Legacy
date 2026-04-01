// @ts-nocheck
import { db } from '../db';
import { bills, liveStreamSegments } from '../../shared/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { ThemeRecommendation } from '../../shared/types';
import { createLogger } from "../logger";
const log = createLogger("emotion-theme-service");


/**
 * Analyzes sentiment data and recommends appropriate UI themes
 */
export class EmotionThemeService {
  /**
   * Get a theme recommendation based on bill sentiment
   * 
   * @param billId The bill ID to analyze
   * @returns Theme recommendation object with color scheme and intensity
   */
  async getBillThemeRecommendation(billId: string): Promise<ThemeRecommendation> {
    try {
      // Get bill sentiment
      const billResults = await db.select().from(bills).$dynamic().where(eq(bills.id, billId));
      
      if (billResults.length === 0) {
        return this.getDefaultTheme();
      }
      
      const bill = billResults[0];
      
      // If bill has a sentiment score, use it
      if (bill.sentimentScore !== null) {
        // Convert from -100 to 100 scale to -1 to 1 scale
        const normalizedScore = bill.sentimentScore / 100;
        return this.getThemeFromSentiment(normalizedScore);
      }
      
      return this.getDefaultTheme();
    } catch (error: any) {
      log.error({ err: error }, 'Error getting bill theme recommendation');
      return this.getDefaultTheme();
    }
  }

  /**
   * Get theme recommendation for a committee meeting
   * 
   * @param committeeId The committee ID
   * @returns Theme recommendation object
   */
  async getCommitteeThemeRecommendation(committeeId: number): Promise<ThemeRecommendation> {
    try {
      // Get recent segments for this committee
      const segments = await db.select()
        .from(liveStreamSegments).$dynamic()
        .where(eq(liveStreamSegments.committeeId, committeeId))
        .orderBy(desc(liveStreamSegments.timestamp))
        .limit(10);
      
      if (segments.length === 0) {
        return this.getDefaultTheme();
      }
      
      // Calculate average sentiment
      const sentimentValues = segments
        .filter(segment => segment.sentimentScore !== null && segment.sentimentScore !== undefined)
        .map(segment => segment.sentimentScore as number);
      
      if (sentimentValues.length === 0) {
        return this.getDefaultTheme();
      }
      
      const averageSentiment = sentimentValues.reduce((sum, score) => sum + score, 0) / sentimentValues.length;
      
      // Convert from -100 to 100 scale to -1 to 1 scale
      const normalizedScore = averageSentiment / 100;
      
      return this.getThemeFromSentiment(normalizedScore);
    } catch (error: any) {
      log.error({ err: error }, 'Error getting committee theme recommendation');
      return this.getDefaultTheme();
    }
  }

  /**
   * Get default neutral theme
   */
  getDefaultTheme(): ThemeRecommendation {
    return {
      primaryColor: '#3b82f6', // blue-500
      secondaryColor: '#6b7280', // gray-500
      accentColor: '#10b981', // emerald-500
      intensity: 'neutral',
      mood: 'neutral'
    };
  }

  /**
   * Maps a sentiment score to a theme recommendation
   * 
   * @param sentiment The sentiment score (-1 to 1)
   * @returns A theme recommendation object
   */
  getThemeFromSentiment(sentiment: number): ThemeRecommendation {
    // Ensure sentiment is between -1 and 1
    const normalizedSentiment = Math.max(-1, Math.min(1, sentiment));
    
    // Determine intensity and mood based on sentiment value
    let intensity: 'low' | 'medium' | 'high' | 'neutral';
    let mood: 'negative' | 'positive' | 'neutral';
    
    const absValue = Math.abs(normalizedSentiment);
    
    if (absValue < 0.1) {
      intensity = 'neutral';
      mood = 'neutral';
    } else if (absValue < 0.4) {
      intensity = 'low';
      mood = normalizedSentiment > 0 ? 'positive' : 'negative';
    } else if (absValue < 0.7) {
      intensity = 'medium';
      mood = normalizedSentiment > 0 ? 'positive' : 'negative';
    } else {
      intensity = 'high';
      mood = normalizedSentiment > 0 ? 'positive' : 'negative';
    }
    
    // Generate colors based on sentiment
    let primaryColor, secondaryColor, accentColor;
    
    if (mood === 'positive') {
      // Positive sentiment: Use green/teal/blue hues
      // Intensify the color based on the intensity level
      const hue = 160 - (intensity === 'high' ? 40 : intensity === 'medium' ? 20 : 0);
      primaryColor = this.hslToHex(hue, 70, 45);
      secondaryColor = this.hslToHex(hue - 30, 40, 60);
      accentColor = this.hslToHex(hue + 40, 90, 65);
    } else if (mood === 'negative') {
      // Negative sentiment: Use red/orange/amber hues
      // Intensify the color based on the intensity level
      const hue = 0 + (intensity === 'high' ? 10 : intensity === 'medium' ? 20 : 30);
      primaryColor = this.hslToHex(hue, 70, 50);
      secondaryColor = this.hslToHex(hue + 15, 40, 40);
      accentColor = this.hslToHex(hue - 10, 90, 65);
    } else {
      // Neutral: Use blue as the default
      primaryColor = '#3b82f6'; // blue-500
      secondaryColor = '#6b7280'; // gray-500
      accentColor = '#10b981'; // emerald-500
    }
    
    return {
      primaryColor,
      secondaryColor,
      accentColor,
      intensity,
      mood
    };
  }

  /**
   * Converts HSL color values to a hex color string
   * 
   * @param h Hue (0-360)
   * @param s Saturation (0-100)
   * @param l Lightness (0-100)
   * @returns Hex color string (e.g., #ff0000)
   */
  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number): string => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

export const emotionThemeService = new EmotionThemeService();