import { useState, useEffect, useCallback } from 'react';
import voiceNarrator, { VoiceNarratorOptions } from '@/lib/voice-narrator';

export interface UseVoiceNarratorResult {
  speak: (text: string, options?: VoiceNarratorOptions) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  speakingText: string | null;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

/**
 * Hook for using voice narrator functionality in React components
 */
export function useVoiceNarrator(): UseVoiceNarratorResult {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const isSupported = voiceNarrator.isSupported();

  // Load available voices when component mounts
  useEffect(() => {
    if (!isSupported) return;

    // Initial voice list
    setAvailableVoices(voiceNarrator.getVoices());

    // Chrome loads voices asynchronously, so listen for the voiceschanged event
    const handleVoicesChanged = () => {
      const voices = voiceNarrator.getVoices();
      setAvailableVoices(voices);
      
      // Set a default English voice if available and not already set
      if (!currentVoice && voices.length > 0) {
        const englishVoice = voices.find(voice => 
          voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        setCurrentVoice(englishVoice || voices[0]);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    // Try to get voices immediately as well (for Firefox and others)
    handleVoicesChanged();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [isSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  // Speak text with current settings
  const speak = useCallback((text: string, options?: VoiceNarratorOptions) => {
    if (!isSupported || !text) return;
    
    const speakOptions: VoiceNarratorOptions = {
      ...options,
      voice: options?.voice || currentVoice,
      rate: options?.rate || rate,
      pitch: options?.pitch || pitch,
      volume: options?.volume || volume,
      onStart: () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setSpeakingText(text);
        options?.onStart?.();
      },
      onEnd: () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeakingText(null);
        options?.onEnd?.();
      },
      onPause: () => {
        setIsPaused(true);
        options?.onPause?.();
      },
      onResume: () => {
        setIsPaused(false);
        options?.onResume?.();
      },
      onError: (error) => {
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeakingText(null);
        options?.onError?.(error);
      }
    };

    voiceNarrator.speak(text, speakOptions);
  }, [isSupported, currentVoice, rate, pitch, volume]);

  // Pause current speech
  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking || isPaused) return;
    voiceNarrator.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking, isPaused]);

  // Resume paused speech
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    voiceNarrator.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  // Stop current speech
  const stop = useCallback(() => {
    if (!isSupported) return;
    voiceNarrator.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeakingText(null);
  }, [isSupported]);

  // Set the current voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setCurrentVoice(voice);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
    availableVoices,
    currentVoice,
    setVoice,
    speakingText,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume
  };
}

export default useVoiceNarrator;