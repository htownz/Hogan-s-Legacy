import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Mic, MicOff, Volume2, VolumeX, Search, Loader2, Wifi, WifiOff } from 'lucide-react';

// Define types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface VoiceSearchProps {
  standalone?: boolean;
}

export const VoiceSearch = ({ standalone = false }: VoiceSearchProps) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  const [_, setLocation] = useLocation();
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection following the correct protocol based on current connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/voice-search`;
    
    console.log('Attempting to connect to WebSocket at:', wsUrl);
    
    // Initialize WebSocket connection
    webSocketRef.current = new WebSocket(wsUrl);
    
    // Set up WebSocket event handlers
    webSocketRef.current.onopen = () => {
      console.log('WebSocket connection established for voice search');
      setWsConnected(true);
      
      toast({
        title: 'Voice Search Connected',
        description: 'Real-time voice processing is now active.',
      });
    };
    
    webSocketRef.current.onclose = () => {
      console.log('WebSocket connection closed for voice search');
      setWsConnected(false);
    };
    
    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
      
      toast({
        title: 'Connection Error',
        description: 'Could not establish real-time voice processing connection.',
        variant: 'destructive'
      });
    };
    
    webSocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'search-results') {
          setResults(data.results);
          setIsSearching(false);
          
          if (data.results.length > 0) {
            const resultsText = `I found ${data.results.length} bills related to your search. ${
              data.results.slice(0, 3).map((bill: any, index: number) => 
                `Bill ${index + 1}: ${bill.displayName}, ${bill.shortDescription}`
              ).join('. ')
            }`;
            
            speakText(resultsText);
          } else {
            speakText("I couldn't find any bills matching your search. Please try a different query.");
          }
        } else if (data.type === 'navigation') {
          setLocation(data.path);
          speakText(`Taking you to ${data.billId}`);
          setIsSearching(false);
        } else if (data.type === 'summary') {
          if (data.summary) {
            setResults([{ 
              id: data.billId, 
              displayName: data.billId, 
              summary: data.summary 
            }]);
            
            speakText(`Here's a summary of ${data.billId}: ${data.summary.executiveSummary}`);
          } else {
            speakText(`Sorry, I couldn't find a summary for ${data.billId}.`);
          }
          setIsSearching(false);
        } else if (data.type === 'error') {
          console.error('WebSocket error message:', data.message);
          toast({
            title: 'Voice Search Error',
            description: data.message || 'An error occurred processing your voice command.',
            variant: 'destructive'
          });
          setIsSearching(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    // Clean up WebSocket on component unmount
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [setLocation]);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setTranscript(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone access denied',
            description: 'Please allow microphone access to use voice search.',
            variant: 'destructive'
          });
        }
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    } else {
      toast({
        title: 'Speech Recognition Not Supported',
        description: 'Your browser does not support speech recognition. Please try using a modern browser like Chrome.',
        variant: 'destructive'
      });
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Load available voices
      const loadVoices = () => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        setAvailableVoices(voices);
      };
      
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);
  
  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
      } else {
        toast({
          title: 'Speech Recognition Unavailable',
          description: 'Speech recognition is not available on your device.',
          variant: 'destructive'
        });
      }
    }
  };
  
  // Process the transcript and search for bills
  const processVoiceCommand = async () => {
    if (!transcript.trim()) return;
    
    setIsSearching(true);
    
    try {
      // If WebSocket is connected, use it for real-time processing
      if (webSocketRef.current && wsConnected && webSocketRef.current.readyState === WebSocket.OPEN) {
        // Send query via WebSocket for real-time processing
        webSocketRef.current.send(JSON.stringify({
          type: 'voice-query',
          query: transcript
        }));
        
        // Note: Results will be handled by the WebSocket onmessage event handler
        // No need to set isSearching to false here as it's handled in the message handler
      } else {
        // Fallback to REST API if WebSocket is not available
        const response = await fetch('/api/voice-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: transcript }),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.action === 'search') {
          setResults(data.results);
          
          // Read out the search results if there are any
          if (data.results.length > 0) {
            const resultsText = `I found ${data.results.length} bills related to your search. ${
              data.results.slice(0, 3).map((bill: any, index: number) => 
                `Bill ${index + 1}: ${bill.displayName}, ${bill.shortDescription}`
              ).join('. ')
            }`;
            
            speakText(resultsText);
          } else {
            speakText("I couldn't find any bills matching your search. Please try a different query.");
          }
        } else if (data.action === 'navigate') {
          // Directly navigate to a specific bill
          setLocation(data.path);
          
          // Speak the navigation confirmation
          speakText(`Taking you to ${data.billId}`);
        } else if (data.action === 'summarize') {
          // Handle bill summary request
          if (data.summary) {
            setResults([{ 
              id: data.billId, 
              displayName: data.billId, 
              summary: data.summary 
            }]);
            
            // Speak the bill summary
            speakText(`Here's a summary of ${data.billId}: ${data.summary.executiveSummary}`);
          } else {
            speakText(`Sorry, I couldn't find a summary for ${data.billId}.`);
          }
        }
        
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Voice search error:', error);
      toast({
        title: 'Search Error',
        description: 'There was an error processing your voice command. Please try again.',
        variant: 'destructive'
      });
      speakText("I'm sorry, I encountered an error processing your request. Please try again.");
      setIsSearching(false);
    }
  };
  
  // Speak text using speech synthesis
  const speakText = (text: string) => {
    if (!speechSynthesisRef.current) return;
    
    // Cancel any existing speech
    speechSynthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use selected voice if available
    if (availableVoices.length > 0) {
      utterance.voice = availableVoices[currentVoiceIndex];
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesisRef.current.speak(utterance);
  };
  
  // Toggle speech output
  const toggleSpeech = () => {
    if (isSpeaking && speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    } else if (results.length > 0) {
      // Re-speak last result
      const result = results[0];
      if (result.summary) {
        speakText(`Here's a summary of ${result.displayName}: ${result.summary.executiveSummary}`);
      } else {
        speakText(`Bill ${result.displayName}: ${result.shortDescription}`);
      }
    }
  };
  
  // Change voice
  const changeVoice = () => {
    if (availableVoices.length > 0) {
      const newIndex = (currentVoiceIndex + 1) % availableVoices.length;
      setCurrentVoiceIndex(newIndex);
      
      // Notify user of voice change
      toast({
        title: 'Voice Changed',
        description: `Now using: ${availableVoices[newIndex].name}`,
      });
    }
  };
  
  // Navigation to bill details
  const navigateToBill = (billId: string) => {
    setLocation(`/bills/${billId}`);
  };
  
  // Navigation to bill summary
  const navigateToBillSummary = (billId: string) => {
    setLocation(`/bill-summary/${billId}`);
  };
  
  return (
    <div className={`voice-search ${standalone ? 'w-full' : 'w-auto'}`}>
      <Card className="p-6 shadow-md">
        <div className="flex flex-col space-y-4">
          {/* Voice control buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {/* WebSocket connection status indicator */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      size="icon"
                      className={`rounded-full ${wsConnected ? 'text-green-500' : 'text-red-500'}`}
                      disabled
                    >
                      {wsConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {wsConnected ? 'Real-time voice processing active' : 'Using standard voice processing'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={toggleListening} 
                      variant={isListening ? "destructive" : "default"}
                      size="icon"
                      className="rounded-full"
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={toggleSpeech} 
                      variant="outline"
                      size="icon"
                      disabled={results.length === 0}
                      className="rounded-full"
                    >
                      {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSpeaking ? 'Stop Speaking' : 'Speak Results'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {availableVoices.length > 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={changeVoice} 
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Change Voice
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Next voice: {availableVoices[(currentVoiceIndex + 1) % availableVoices.length]?.name || 'Default'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <Button 
              onClick={processVoiceCommand} 
              disabled={!transcript.trim() || isSearching}
              className="rounded-full"
            >
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
          
          {/* Transcript display */}
          <div className={`min-h-[60px] p-3 rounded-md border ${isListening ? 'border-primary bg-primary/5 animate-pulse' : 'border-gray-200'}`}>
            {transcript ? transcript : (
              <span className="text-gray-400 italic">
                {isListening ? 'Listening... Speak now' : 'Press the microphone button to start speaking'}
              </span>
            )}
          </div>
          
          {/* Results display */}
          {results.length > 0 && (
            <div className="mt-4 space-y-4">
              <h3 className="text-lg font-medium">Results:</h3>
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.id} className="p-4 border rounded-md hover:bg-gray-50">
                    <h4 className="font-medium flex justify-between">
                      {result.displayName}
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => navigateToBill(result.id)}
                        >
                          View Bill
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => navigateToBillSummary(result.id)}
                        >
                          See Summary
                        </Button>
                      </div>
                    </h4>
                    
                    {result.shortDescription && (
                      <p className="mt-2 text-sm text-gray-600">{result.shortDescription}</p>
                    )}
                    
                    {result.summary && (
                      <div className="mt-2">
                        <h5 className="font-medium">Executive Summary</h5>
                        <p className="text-sm">{result.summary.executiveSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Suggested voice commands */}
          {standalone && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Try saying:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>"Find bills about education"</li>
                <li>"Show me House Bill 1"</li>
                <li>"What does Senate Bill 100 do?"</li>
                <li>"Summarize HB 10"</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};