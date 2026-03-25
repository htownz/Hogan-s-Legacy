import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  SearchIcon, 
  Brain, 
  Sparkles, 
  FileTextIcon, 
  TrendingUpIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  Loader2
} from "lucide-react";

interface SearchResult {
  id: string;
  score: number;
  metadata: {
    title: string;
    content: string;
    type: string;
    date?: string;
  };
}

interface BillAnalysis {
  summary: string;
  impact: string;
  complexity: 'simple' | 'moderate' | 'complex';
  keyPoints: string[];
  citizenImpact: string;
  actionable: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  actionableSteps?: string[];
  similarBills?: SearchResult[];
}

export default function EnhancedAISearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<SearchResult | null>(null);
  const [userInterests] = useState(["healthcare", "education", "environment"]);
  const queryClient = useQueryClient();

  // Semantic search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 8 })
      });
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-results"] });
    }
  });

  // Bill analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (bill: SearchResult) => {
      const response = await fetch("/api/ai/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          billText: bill.metadata.content,
          billTitle: bill.metadata.title,
          billId: bill.id
        })
      });
      
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
      
      return response.json();
    }
  });

  // Get recommendations
  const { data: recommendations } = useQuery<any>({
    queryKey: ["ai-recommendations"],
    queryFn: async () => {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userInterests,
          previousBills: [],
          limit: 5
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }
      
      return response.json();
    }
  });

  // AI service status
  const { data: aiStatus } = useQuery<any>({
    queryKey: ["ai-status"],
    queryFn: async () => {
      const response = await fetch("/api/ai/status");
      return response.json();
    },
    refetchInterval: 30000 // Check every 30 seconds
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
    }
  };

  const handleAnalyzeBill = (bill: SearchResult) => {
    setSelectedBill(bill);
    analysisMutation.mutate(bill);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'simple': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'moderate': return <AlertCircleIcon className="w-4 h-4 text-yellow-500" />;
      case 'complex': return <AlertCircleIcon className="w-4 h-4 text-red-500" />;
      default: return <AlertCircleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🤖 AI-Powered Legislative Search
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Search and analyze legislation with advanced AI. Get instant explanations, 
          impact assessments, and personalized recommendations.
        </p>
      </div>

      {/* AI Status Indicator */}
      {aiStatus && (
        <Alert className="mb-6">
          <Sparkles className="w-4 h-4" />
          <AlertDescription>
            <strong>AI Services Active:</strong> 
            {' '}Claude AI ({aiStatus.services?.anthropic?.available ? '✅' : '❌'})
            {' '}• Pinecone Search ({aiStatus.services?.pinecone?.available ? '✅' : '❌'})
          </AlertDescription>
        </Alert>
      )}

      {/* Search Interface */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Intelligent Legislative Search
          </CardTitle>
          <CardDescription>
            Search bills by topic, impact, or any concept. Our AI understands context and meaning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search for bills about healthcare, climate change, education..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={searchMutation.isPending}
              className="min-w-[120px]"
            >
              {searchMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <SearchIcon className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Results */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="results">Search Results</TabsTrigger>
              <TabsTrigger value="recommendations">Recommended for You</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              {searchMutation.data && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Found {searchMutation.data.count} results for "{searchMutation.data.query}"
                  </h3>
                  
                  {searchMutation.data.results.map((result: SearchResult) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 flex-1">
                            {result.metadata.title}
                          </h4>
                          <Badge variant="secondary" className="ml-4">
                            Score: {(result.score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {result.metadata.content.substring(0, 200)}...
                        </p>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileTextIcon className="w-4 h-4" />
                              {result.metadata.type}
                            </span>
                            {result.metadata.date && (
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {new Date(result.metadata.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalyzeBill(result)}
                            disabled={analysisMutation.isPending}
                          >
                            {analysisMutation.isPending && selectedBill?.id === result.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Brain className="w-4 h-4 mr-2" />
                            )}
                            Analyze with AI
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchMutation.isPending && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Searching legislative documents...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations && recommendations.recommendations && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Bills You Might Be Interested In
                  </h3>
                  
                  {recommendations.recommendations.map((result: SearchResult) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {result.metadata.title}
                        </h4>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {result.metadata.content.substring(0, 150)}...
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyzeBill(result)}
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Get AI Analysis
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          {analysisMutation.data && selectedBill && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  {selectedBill.metadata.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisMutation.data.analysis && (
                  <>
                    {/* Urgency & Complexity Indicators */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Urgency:</span>
                        <Badge className={getUrgencyColor(analysisMutation.data.analysis.urgencyLevel)}>
                          {analysisMutation.data.analysis.urgencyLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getComplexityIcon(analysisMutation.data.analysis.complexity)}
                        <span className="text-sm">{analysisMutation.data.analysis.complexity}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div>
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-sm text-gray-600">
                        {analysisMutation.data.analysis.summary}
                      </p>
                    </div>

                    {/* Citizen Impact */}
                    <div>
                      <h4 className="font-semibold mb-2">How This Affects You</h4>
                      <p className="text-sm text-gray-600">
                        {analysisMutation.data.analysis.citizenImpact}
                      </p>
                    </div>

                    {/* Key Points */}
                    {analysisMutation.data.analysis.keyPoints.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Points</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {analysisMutation.data.analysis.keyPoints.map((point: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Steps */}
                    {analysisMutation.data.analysis.actionableSteps && (
                      <div>
                        <h4 className="font-semibold mb-2">What You Can Do</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {analysisMutation.data.analysis.actionableSteps.map((step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Similar Bills */}
                    {analysisMutation.data.analysis.similarBills && analysisMutation.data.analysis.similarBills.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Similar Bills</h4>
                        <div className="space-y-2">
                          {analysisMutation.data.analysis.similarBills.map((bill: SearchResult) => (
                            <div key={bill.id} className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium">{bill.metadata.title}</p>
                              <p className="text-xs text-gray-500">
                                Similarity: {(bill.score * 100).toFixed(0)}%
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {analysisMutation.isPending && (
            <Card>
              <CardContent className="p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Analyzing with AI...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Getting insights from Claude AI and Pinecone
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-green-600" />
                Your Search Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Searches Today</span>
                  <span className="font-medium">{searchMutation.data ? 1 : 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bills Analyzed</span>
                  <span className="font-medium">{analysisMutation.data ? 1 : 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AI Insights</span>
                  <span className="font-medium text-blue-600">Powered by Claude</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}