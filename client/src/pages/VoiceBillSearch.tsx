import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Search, 
  Volume2, 
  VolumeX,
  FileText,
  Calendar,
  Users,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Brain,
  Eye,
  Heart
} from "lucide-react";

interface VoiceSearchResult {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsors: string[];
  introducedAt: string;
  relevanceScore: number;
  summary: string;
  keyTopics: string[];
}

interface VoiceAnalysis {
  transcript: string;
  searchQuery: string;
  searchIntent: string;
  suggestedFilters: string[];
  confidence: number;
}

export default function VoiceBillSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Voice Recognition Error",
          description: "There was an issue with voice recognition. Please try again.",
          variant: "destructive"
        });
        setIsRecording(false);
      };
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  // Voice search mutation
  const voiceSearchMutation = useMutation({
    mutationFn: async (audioData: { transcript: string }) => {
      const response = await fetch('/api/voice-search/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioData)
      });
      if (!response.ok) throw new Error('Voice search failed');
      return response.json();
    },
    onSuccess: (data: VoiceAnalysis) => {
      setSearchQuery(data.searchQuery);
      toast({
        title: "Voice Search Complete",
        description: `Found search intent: ${data.searchIntent}`,
      });
      // Trigger bill search with the processed query
      queryClient.invalidateQueries({ queryKey: ['/api/bills/voice-search'] });
    },
    onError: () => {
      toast({
        title: "Voice Search Failed",
        description: "Unable to process voice search. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Bill search query
  const { data: searchResults, isLoading: searchLoading } = useQuery<any>({
    queryKey: ['/api/bills/voice-search', searchQuery],
    enabled: !!searchQuery,
  });

  const startRecording = async () => {
    try {
      if (recognitionRef.current) {
        setTranscript("");
        setIsRecording(true);
        recognitionRef.current.start();
        
        toast({
          title: "Voice Recording Started",
          description: "Speak your bill search query...",
        });
      } else {
        toast({
          title: "Voice Not Supported",
          description: "Your browser doesn't support voice recognition.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to start voice recording.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      if (transcript.trim()) {
        voiceSearchMutation.mutate({ transcript: transcript.trim() });
      }
    }
  };

  const playAudio = (text: string, billId?: string) => {
    if (!audioEnabled || !synthRef.current) return;

    // Stop any currently playing audio
    synthRef.current.cancel();
    
    if (currentlyPlaying === billId) {
      setCurrentlyPlaying(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setCurrentlyPlaying(billId || 'summary');
    };

    utterance.onend = () => {
      setCurrentlyPlaying(null);
    };

    synthRef.current.speak(utterance);
  };

  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setCurrentlyPlaying(null);
    }
  };

  const clearSearch = () => {
    setTranscript("");
    setSearchQuery("");
    setCurrentlyPlaying(null);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  // Mock search results for demonstration
  const mockResults: VoiceSearchResult[] = searchQuery ? [
    {
      id: "HB-2847",
      title: "Texas Education Funding Reform Act",
      description: "Comprehensive reform of public school funding formulas to address rural and urban disparities",
      status: "In Committee",
      chamber: "House",
      sponsors: ["Rep. Sarah Johnson", "Rep. Michael Davis"],
      introducedAt: "2024-03-15",
      relevanceScore: 95,
      summary: "This bill proposes significant changes to how Texas funds public education, particularly addressing the funding gap between rural and urban school districts.",
      keyTopics: ["Education", "Funding", "Rural Development", "Equity"]
    },
    {
      id: "SB-1492",
      title: "Healthcare Access Expansion Bill",
      description: "Expanding healthcare access in underserved Texas communities through telemedicine and mobile clinics",
      status: "Passed Committee",
      chamber: "Senate",
      sponsors: ["Sen. Maria Rodriguez", "Sen. Robert Chen"],
      introducedAt: "2024-02-28",
      relevanceScore: 87,
      summary: "Legislation designed to improve healthcare access in rural and underserved areas of Texas through innovative delivery methods.",
      keyTopics: ["Healthcare", "Rural Access", "Telemedicine", "Public Health"]
    }
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'in committee': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🎤 Voice Bill Search & Analysis
          </h1>
          <p className="text-lg text-muted-foreground">
            Speak naturally to search and analyze Texas legislation with AI-powered voice recognition
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Control Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice Control
                </CardTitle>
                <CardDescription>
                  Use your voice to search for bills and get audio summaries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recording Controls */}
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                      : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
                  }`}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full h-full text-white hover:text-white"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={voiceSearchMutation.isPending}
                    >
                      {isRecording ? (
                        <MicOff className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium">
                      {isRecording ? 'Recording...' : 'Tap to Start Recording'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRecording ? 'Say your search query' : 'Voice search is ready'}
                    </p>
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Audio Playback</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Clear Search */}
                {(transcript || searchQuery) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearSearch}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear Search
                  </Button>
                )}

                {/* Voice Processing Status */}
                {voiceSearchMutation.isPending && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Brain className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-800">Processing voice query...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcript Display */}
            {transcript && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Voice Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{transcript}</p>
                  </div>
                  {audioEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => playAudio(transcript)}
                    >
                      {currentlyPlaying === 'summary' ? (
                        <Pause className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Play Transcript
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Search Results */}
          <div className="lg:col-span-2">
            {/* Search Query Display */}
            {searchQuery && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Search Query:</span>
                  </div>
                  <p className="text-lg font-medium">{searchQuery}</p>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {searchLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <Sparkles className="h-6 w-6 text-blue-600 animate-spin mr-2" />
                    <span>Searching bills...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {mockResults.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Found {mockResults.length} relevant bills
                  </h2>
                  {audioEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playAudio(`Found ${mockResults.length} bills matching your search for ${searchQuery}`)}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Play Summary
                    </Button>
                  )}
                </div>

                {mockResults.map((bill) => (
                  <Card key={bill.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{bill.id}</Badge>
                            <Badge className={getStatusColor(bill.status)}>
                              {bill.status}
                            </Badge>
                            <Badge variant="secondary">{bill.chamber}</Badge>
                            <div className="flex items-center gap-1 text-sm text-orange-600">
                              <Zap className="h-3 w-3" />
                              {bill.relevanceScore}% match
                            </div>
                          </div>
                          <CardTitle className="text-lg">{bill.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {bill.description}
                          </CardDescription>
                        </div>
                        
                        {audioEnabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => 
                              currentlyPlaying === bill.id 
                                ? stopAudio() 
                                : playAudio(bill.summary, bill.id)
                            }
                          >
                            {currentlyPlaying === bill.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Tabs defaultValue="summary" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="summary">Summary</TabsTrigger>
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="topics">Topics</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="summary" className="mt-4">
                          <p className="text-sm text-muted-foreground">{bill.summary}</p>
                        </TabsContent>
                        
                        <TabsContent value="details" className="mt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Introduced:</span>
                              <p className="text-muted-foreground">{new Date(bill.introducedAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Sponsors:</span>
                              <p className="text-muted-foreground">{bill.sponsors.join(', ')}</p>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="topics" className="mt-4">
                          <div className="flex flex-wrap gap-2">
                            {bill.keyTopics.map((topic, index) => (
                              <Badge key={index} variant="outline">{topic}</Badge>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!searchQuery && !searchLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Voice Search Ready</h3>
                    <p className="text-muted-foreground mb-4">
                      Click the microphone to start searching for bills with your voice
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1">Try saying:</h4>
                        <p>"Find bills about education funding"</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1">Or ask:</h4>
                        <p>"Show me healthcare legislation"</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}