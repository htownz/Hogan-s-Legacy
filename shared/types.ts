/**
 * Shared type definitions for the Act Up platform
 */

// Theme-related types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeIntensity = 'subtle' | 'moderate' | 'strong';

export interface EmotionTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  mode: ThemeMode;
}

export interface ThemePreferences {
  useEmotionTheming: boolean;
  defaultTheme: ThemeMode;
  themeColorOverride?: string;
  emotionThemeIntensity: ThemeIntensity;
}

export interface UserSettings extends ThemePreferences {
  userId: number;
}

// Video segment tagging types
export interface VideoSegment {
  id: number;
  committeeMeetingId: number;
  committeeId: number;
  description: string;
  timestamp: Date;
  billIds: string;
  billsDiscussed: string;
  speakerName: string;
  speakerRole: string;
  keyWords: string[];
  startTimestamp: string;
  endTimestamp: string;
  summary: string;
  sentimentScore: number;
  createdAt: Date;
}

export interface VideoQuote {
  id: number;
  committeeMeetingId: number;
  speaker: string;
  quote: string;
  timestamp: Date;
  billId?: string;
  sentiment?: number;
  createdAt: Date;
}

export interface VideoTranscriptAnalysis {
  currentSegment: string;
  billsDiscussed: string[];
  primarySpeaker: {
    name: string;
    role: 'elected_official' | 'witness' | 'resource_witness';
  };
  keyWords: string[];
  timeRange: {
    startTime: string;
    endTime: string;
  };
  sentimentScore: number;
  keyQuotes: {
    speaker: string;
    quote: string;
    timestamp: string;
    billReference?: string;
  }[];
  summary: string;
}

export interface ThemeRecommendation {
  theme: string;
  intensity: string;
  mode: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  mood: string;
  confidence: number;
}

export interface UserThemePreferences {
  userId: number;
  useEmotionTheming: boolean;
  defaultTheme: string;
  emotionThemeIntensity: string;
  themeColorOverride: string;
  preferredTheme: string;
  preferredIntensity: string;
  preferredMode: string;
  autoApply: boolean;
  [key: string]: any;
}