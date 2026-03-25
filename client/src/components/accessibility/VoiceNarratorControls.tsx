import { useState } from 'react';
import { useVoiceNarrator } from '@/hooks/use-voice-narrator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, Square, Settings2, Volume2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface VoiceNarratorControlsProps {
  className?: string;
  text?: string;
  simplified?: boolean;
  onToggle?: (enabled: boolean) => void;
}

/**
 * Voice Narrator Controls component
 * Provides UI for controlling text-to-speech functionality
 */
export function VoiceNarratorControls({
  className = '',
  text,
  simplified = false,
  onToggle
}: VoiceNarratorControlsProps) {
  const {
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
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume
  } = useVoiceNarrator();

  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Toggle the narrator on/off
  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    onToggle?.(enabled);
    
    if (!enabled && isSpeaking) {
      stop();
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!isEnabled) return;
    
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else if (text) {
      speak(text);
    }
  };

  // Handle stop
  const handleStop = () => {
    if (isSpeaking) {
      stop();
    }
  };

  // Handle voice change
  const handleVoiceChange = (voiceURI: string) => {
    const voice = availableVoices.find(v => v.voiceURI === voiceURI) || null;
    setVoice(voice);
  };

  if (!isSupported) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Text-to-speech is not supported in your browser.
      </div>
    );
  }

  if (simplified) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                disabled={!isEnabled || !text}
                aria-label={isPaused ? "Resume narration" : isSpeaking ? "Pause narration" : "Start narration"}
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : isSpeaking ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isPaused ? "Resume narration" : isSpeaking ? "Pause narration" : "Start narration"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {isSpeaking && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStop}
                  aria-label="Stop narration"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Stop narration
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="narrator-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="narrator-toggle">Voice Narrator</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            disabled={!isEnabled || !text}
            className="w-20"
          >
            {isPaused ? "Resume" : isSpeaking ? "Pause" : "Play"}
          </Button>
          
          {isSpeaking && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
            >
              Stop
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Narrator settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Voice Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize how the narrator speaks
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="narrator-voice">Voice</Label>
                    <div className="col-span-2">
                      <Select
                        value={currentVoice?.voiceURI || ''}
                        onValueChange={handleVoiceChange}
                        disabled={!isEnabled}
                      >
                        <SelectTrigger id="narrator-voice">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices.map((voice) => (
                            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name} ({voice.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="narrator-rate">Speed</Label>
                    <div className="col-span-2">
                      <Slider
                        id="narrator-rate"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[rate]}
                        onValueChange={values => setRate(values[0])}
                        disabled={!isEnabled}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="narrator-pitch">Pitch</Label>
                    <div className="col-span-2">
                      <Slider
                        id="narrator-pitch"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[pitch]}
                        onValueChange={values => setPitch(values[0])}
                        disabled={!isEnabled}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="narrator-volume">Volume</Label>
                    <div className="col-span-2">
                      <Slider
                        id="narrator-volume"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[volume]}
                        onValueChange={values => setVolume(values[0])}
                        disabled={!isEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

export default VoiceNarratorControls;