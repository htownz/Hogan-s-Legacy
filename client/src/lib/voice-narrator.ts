/**
 * Voice Narrator Utility
 * Provides text-to-speech functionality for legislative content
 */

export type VoiceNarratorOptions = {
  rate?: number;      // Speech rate (0.1 to 10)
  pitch?: number;     // Speech pitch (0 to 2)
  volume?: number;    // Speech volume (0 to 1)
  voice?: SpeechSynthesisVoice | null;  // Specific voice to use
  onStart?: () => void;      // Callback when speech starts
  onEnd?: () => void;        // Callback when speech ends
  onPause?: () => void;      // Callback when speech is paused
  onResume?: () => void;     // Callback when speech is resumed
  onError?: (error: any) => void;  // Callback for errors
};

export interface IVoiceNarrator {
  speak(text: string, options?: VoiceNarratorOptions): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getVoices(): SpeechSynthesisVoice[];
  isSupported(): boolean;
  isSpeaking(): boolean;
  isPaused(): boolean;
}

class VoiceNarrator implements IVoiceNarrator {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private paused: boolean = false;
  private speaking: boolean = false;
  private defaultOptions: VoiceNarratorOptions = {
    rate: 1,
    pitch: 1,
    volume: 1,
  };

  constructor() {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      console.warn('Speech synthesis is not supported in this browser');
    }
  }

  /**
   * Check if speech synthesis is supported in the current browser
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  /**
   * Get all available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Check if speech is currently in progress
   */
  public isSpeaking(): boolean {
    return this.speaking;
  }

  /**
   * Check if speech is currently paused
   */
  public isPaused(): boolean {
    return this.paused;
  }

  /**
   * Clean up text for better speech synthesis
   */
  private cleanText(text: string): string {
    // Replace common legislative abbreviations and formatting
    return text
      .replace(/(\w)\.(\w)/g, '$1. $2') // Add space after periods between words
      .replace(/Sec\./g, 'Section')
      .replace(/(\d+)\(([a-z])\)/g, '$1 subsection $2') // Format section references
      .replace(/H\.B\./g, 'House Bill')
      .replace(/S\.B\./g, 'Senate Bill')
      .replace(/--/g, '') // Remove double dashes
      .replace(/\s{2,}/g, ' '); // Remove extra spaces
  }

  /**
   * Format legislative content for better speech synthesis
   */
  private formatLegislativeContent(text: string): string {
    // Split text into manageable chunks and prepare for speech
    const cleanedText = this.cleanText(text);
    
    // Add pauses at appropriate punctuation
    return cleanedText
      .replace(/\.\s/g, '. ')
      .replace(/;\s/g, '; ')
      .replace(/:\s/g, ': ');
  }

  /**
   * Speak the provided text with the given options
   */
  public speak(text: string, options?: VoiceNarratorOptions): void {
    if (!this.isSupported()) {
      console.error('Speech synthesis is not supported in this browser');
      options?.onError?.('Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    this.stop();

    const mergedOptions = { ...this.defaultOptions, ...options };
    const formattedText = this.formatLegislativeContent(text);

    const utterance = new SpeechSynthesisUtterance(formattedText);
    
    // Configure utterance
    utterance.rate = mergedOptions.rate || 1;
    utterance.pitch = mergedOptions.pitch || 1;
    utterance.volume = mergedOptions.volume || 1;
    
    if (mergedOptions.voice) {
      utterance.voice = mergedOptions.voice;
    }

    // Set up event handlers
    utterance.onstart = () => {
      this.speaking = true;
      this.paused = false;
      mergedOptions.onStart?.();
    };

    utterance.onend = () => {
      this.speaking = false;
      this.paused = false;
      this.currentUtterance = null;
      mergedOptions.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      mergedOptions.onError?.(event);
    };

    // Store current utterance
    this.currentUtterance = utterance;

    // Start speaking
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Pause the current speech
   */
  public pause(): void {
    if (!this.isSupported() || !this.speaking || this.paused) return;
    window.speechSynthesis.pause();
    this.paused = true;
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (!this.isSupported() || !this.paused) return;
    window.speechSynthesis.resume();
    this.paused = false;
  }

  /**
   * Stop the current speech
   */
  public stop(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
    this.speaking = false;
    this.paused = false;
    this.currentUtterance = null;
  }
}

// Create a singleton instance
const voiceNarrator = new VoiceNarrator();
export default voiceNarrator;