import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Search, 
  Bot, 
  Zap, 
  TrendingUp, 
  Users, 
  FileText, 
  Network, 
  BarChart3, 
  Eye, 
  Star,
  ArrowRight,
  Sparkles,
  Target,
  MessageSquare,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Lightbulb
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BillAnalysisResult {
  summary: string;
  executiveSummary: string;
  detailedImpact: {
    economic: { score: number; description: string; affectedSectors: string[]; fiscalImpact: string; };
    social: { score: number; description: string; affectedGroups: string[]; equityImpact: string; };
    environmental: { score: number; description: string; environmentalFactors: string[]; };
    legal: { score: number; description: string; constitutionalConcerns: string[]; precedentImpact: string; };
  };
  complexity: string;
  readabilityScore: number;
  plainLanguageSummary: string;
  keyTermsGlossary: { term: string; definition: string }[];
  keyStakeholders: string[];
  citizenImpactScore: number;
  urgencyLevel: string;
  analysisConfidence: number;
}

interface ResearchReport {
  summary: string;
  keyFindings: string[];
  entitiesDiscovered: any[];
  financialNetworks: any[];
  policyConnections: any[];
  recommendations: string[];
  followUpQuestions: string[];
  confidenceLevel: number;
}

interface SearchResult {
  id: string;
  score: number;
  document: {
    title: string;
    content: string;
    type: string;
  };
  explanation: {
    matchType: string;
    keyTerms: string[];
    relevanceFactors: string[];
    confidenceScore: number;
  };
  relatedDocuments: any[];
}

export default function EnhancedAISuiteDemo() {
  const [activeTab, setActiveTab] = useState("bill-analysis");
  const [billText, setBillText] = useState("");
  const [billTitle, setBillTitle] = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [entityName, setEntityName] = useState("");

  const queryClient = useQueryClient();

  // Bill Analysis Mutation
  const billAnalysisMutation = useMutation({
    mutationFn: async (data: { billText: string; billTitle: string }) => {
      return apiRequest("/api/ai-suite/bill-analysis/comprehensive", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-suite"] });
    },
  });

  // Scout Bot Research Mutation
  const researchMutation = useMutation({
    mutationFn: async (data: { topic: string; scope: string; depth: string }) => {
      return apiRequest("/api/ai-suite/scout-bot/research", "POST", data);
    },
  });

  // Vector Search Mutation
  const searchMutation = useMutation({
    mutationFn: async (data: { query: string; type: string }) => {
      return apiRequest("/api/ai-suite/vector-search/advanced", "POST", data);
    },
  });

  // Entity Profile Mutation
  const entityProfileMutation = useMutation({
    mutationFn: async (data: { entityName: string; context: string }) => {
      return apiRequest("/api/ai-suite/scout-bot/profile", "POST", data);
    },
  });

  // Integrated Analysis Mutation
  const integratedAnalysisMutation = useMutation({
    mutationFn: async (data: { billText: string; billTitle: string; researchTopic?: string }) => {
      return apiRequest("/api/ai-suite/integrated-analysis", "POST", data);
    },
  });

  // AI Suite Status Query
  const { data: suiteStatus } = useQuery<any>({
    queryKey: ["/api/ai-suite/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleBillAnalysis = () => {
    if (!billText.trim() || !billTitle.trim()) return;
    billAnalysisMutation.mutate({ billText, billTitle });
  };

  const handleResearch = () => {
    if (!researchTopic.trim()) return;
    researchMutation.mutate({
      topic: researchTopic,
      scope: "state",
      depth: "detailed"
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate({
      query: searchQuery,
      type: "semantic"
    });
  };

  const handleEntityProfile = () => {
    if (!entityName.trim()) return;
    entityProfileMutation.mutate({
      entityName,
      context: "Texas politics"
    });
  };

  const handleIntegratedAnalysis = () => {
    if (!billText.trim() || !billTitle.trim()) return;
    integratedAnalysisMutation.mutate({
      billText,
      billTitle,
      researchTopic: researchTopic || undefined
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Enhanced AI Suite Demo
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Supercharged AI Intelligence Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience the power of three enhanced AI systems working together: Advanced Bill Analysis, 
            Scout Bot Research, and Enhanced Vector Search with Claude AI and Pinecone.
          </p>

          {/* Status Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-sm">Bill Analysis Engine</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {suiteStatus?.data?.billAnalysisEngine || 'operational'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-sm">Scout Bot</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {suiteStatus?.data?.scoutBot || 'operational'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-sm">Vector Search</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {suiteStatus?.data?.vectorSearch || 'operational'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="bill-analysis" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Bill Analysis
            </TabsTrigger>
            <TabsTrigger value="scout-bot" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Scout Bot
            </TabsTrigger>
            <TabsTrigger value="vector-search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Vector Search
            </TabsTrigger>
            <TabsTrigger value="integrated" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Integrated Analysis
            </TabsTrigger>
          </TabsList>

          {/* Bill Analysis Tab */}
          <TabsContent value="bill-analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Advanced Bill Analysis Engine
                  </CardTitle>
                  <CardDescription>
                    Powered by Claude AI for comprehensive legislative analysis with impact scoring and stakeholder mapping
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bill-title">Bill Title</Label>
                    <Input
                      id="bill-title"
                      placeholder="Enter bill title (e.g., House Bill 1234)"
                      value={billTitle}
                      onChange={(e) => setBillTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bill-text">Bill Text</Label>
                    <Textarea
                      id="bill-text"
                      placeholder="Paste the full bill text here for comprehensive analysis..."
                      value={billText}
                      onChange={(e) => setBillText(e.target.value)}
                      rows={8}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleBillAnalysis}
                    disabled={billAnalysisMutation.isPending || !billText.trim() || !billTitle.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {billAnalysisMutation.isPending ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Bill...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze Bill
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    Comprehensive AI-powered insights and impact assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {billAnalysisMutation.data?.data ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {/* Summary */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
                          <p className="text-sm text-gray-600">{billAnalysisMutation.data.data.executiveSummary}</p>
                        </div>

                        <Separator />

                        {/* Impact Scores */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Impact Analysis</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">Economic</span>
                                <span className="text-xs text-gray-500">{billAnalysisMutation.data.data.detailedImpact.economic.score}/10</span>
                              </div>
                              <Progress value={billAnalysisMutation.data.data.detailedImpact.economic.score * 10} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">Social</span>
                                <span className="text-xs text-gray-500">{billAnalysisMutation.data.data.detailedImpact.social.score}/10</span>
                              </div>
                              <Progress value={billAnalysisMutation.data.data.detailedImpact.social.score * 10} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">Environmental</span>
                                <span className="text-xs text-gray-500">{billAnalysisMutation.data.data.detailedImpact.environmental.score}/10</span>
                              </div>
                              <Progress value={billAnalysisMutation.data.data.detailedImpact.environmental.score * 10} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">Legal</span>
                                <span className="text-xs text-gray-500">{billAnalysisMutation.data.data.detailedImpact.legal.score}/10</span>
                              </div>
                              <Progress value={billAnalysisMutation.data.data.detailedImpact.legal.score * 10} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500">Citizen Impact</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-semibold">{billAnalysisMutation.data.data.citizenImpactScore}/10</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Urgency Level</span>
                            <Badge variant="outline" className="mt-1">
                              {billAnalysisMutation.data.data.urgencyLevel}
                            </Badge>
                          </div>
                        </div>

                        {/* Key Stakeholders */}
                        {billAnalysisMutation.data.data.keyStakeholders?.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Key Stakeholders</h4>
                              <div className="flex flex-wrap gap-1">
                                {billAnalysisMutation.data.data.keyStakeholders.map((stakeholder: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {stakeholder}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  ) : billAnalysisMutation.isError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Analysis failed. Please try again.</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Enter bill details and click "Analyze Bill" to see comprehensive AI analysis results.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scout Bot Tab */}
          <TabsContent value="scout-bot">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-600" />
                      Advanced Scout Bot Research
                    </CardTitle>
                    <CardDescription>
                      Deep research capabilities with entity profiling and network analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="research-topic">Research Topic</Label>
                      <Input
                        id="research-topic"
                        placeholder="Enter research topic (e.g., Healthcare policy, Education funding)"
                        value={researchTopic}
                        onChange={(e) => setResearchTopic(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleResearch}
                      disabled={researchMutation.isPending || !researchTopic.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {researchMutation.isPending ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Conducting Research...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 mr-2" />
                          Start Research
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-600" />
                      Entity Profile Analysis
                    </CardTitle>
                    <CardDescription>
                      Comprehensive profiling of political entities and stakeholders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="entity-name">Entity Name</Label>
                      <Input
                        id="entity-name"
                        placeholder="Enter entity name (e.g., legislator, organization, lobbyist)"
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleEntityProfile}
                      disabled={entityProfileMutation.isPending || !entityName.trim()}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {entityProfileMutation.isPending ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Profiling Entity...
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          Profile Entity
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Research Results</CardTitle>
                  <CardDescription>
                    Comprehensive research insights and entity analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {researchMutation.data?.data || entityProfileMutation.data?.data ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {researchMutation.data?.data && (
                          <>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Research Summary</h4>
                              <p className="text-sm text-gray-600">{researchMutation.data.data.summary}</p>
                            </div>

                            {researchMutation.data.data.keyFindings?.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Key Findings</h4>
                                  <ul className="space-y-1">
                                    {researchMutation.data.data.keyFindings.map((finding: string, index: number) => (
                                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                        {finding}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </>
                            )}

                            <Separator />
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">Confidence Level: {researchMutation.data.data.confidenceLevel}%</span>
                            </div>
                          </>
                        )}

                        {entityProfileMutation.data?.data && (
                          <>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Entity Profile</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{entityProfileMutation.data.data.type}</Badge>
                                  <span className="text-sm font-medium">{entityProfileMutation.data.data.name}</span>
                                </div>
                                <p className="text-xs text-gray-600">{entityProfileMutation.data.data.primaryRole}</p>
                              </div>
                            </div>

                            {entityProfileMutation.data.data.influenceMetrics && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Influence Metrics</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500">Legislative</span>
                                      <Progress value={entityProfileMutation.data.data.influenceMetrics.legislativeInfluence} className="h-2" />
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">Financial</span>
                                      <Progress value={entityProfileMutation.data.data.influenceMetrics.financialInfluence} className="h-2" />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  ) : researchMutation.isError || entityProfileMutation.isError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Research failed. Please try again.</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Enter a research topic or entity name to begin AI-powered analysis.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vector Search Tab */}
          <TabsContent value="vector-search">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-green-600" />
                    Enhanced Vector Search
                  </CardTitle>
                  <CardDescription>
                    Semantic search powered by Pinecone with query expansion and smart reranking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="search-query">Search Query</Label>
                    <Input
                      id="search-query"
                      placeholder="Enter search query (e.g., bills about healthcare reform)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSearch}
                    disabled={searchMutation.isPending || !searchQuery.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {searchMutation.isPending ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>
                    AI-enhanced semantic search with relevance explanations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searchMutation.data?.data ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {searchMutation.data.data.map((result: SearchResult, index: number) => (
                          <div key={result.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm text-gray-900">{result.document.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(result.score * 100)}% match
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{result.document.content.substring(0, 150)}...</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge variant="secondary" className="text-xs">{result.explanation.matchType}</Badge>
                              <span>Confidence: {Math.round(result.explanation.confidenceScore)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : searchMutation.isError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Search failed. Please try again.</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Enter a search query to find relevant legislative documents using AI-powered semantic search.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrated Analysis Tab */}
          <TabsContent value="integrated">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  Integrated AI Analysis Suite
                </CardTitle>
                <CardDescription className="text-lg">
                  Combine all three AI systems for comprehensive legislative intelligence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="integrated-bill-title">Bill Title</Label>
                    <Input
                      id="integrated-bill-title"
                      placeholder="Enter bill title"
                      value={billTitle}
                      onChange={(e) => setBillTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="integrated-research-topic">Research Topic (Optional)</Label>
                    <Input
                      id="integrated-research-topic"
                      placeholder="Additional research focus"
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="integrated-bill-text">Bill Text</Label>
                  <Textarea
                    id="integrated-bill-text"
                    placeholder="Paste the full bill text for comprehensive integrated analysis..."
                    value={billText}
                    onChange={(e) => setBillText(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button 
                  onClick={handleIntegratedAnalysis}
                  disabled={integratedAnalysisMutation.isPending || !billText.trim() || !billTitle.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                  size="lg"
                >
                  {integratedAnalysisMutation.isPending ? (
                    <>
                      <Activity className="w-5 h-5 mr-2 animate-spin" />
                      Running Integrated Analysis...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Run Integrated Analysis
                    </>
                  )}
                </Button>

                {integratedAnalysisMutation.data?.data && (
                  <div className="mt-8 space-y-6">
                    <Separator />
                    <h3 className="text-xl font-semibold text-gray-900">Integrated Analysis Results</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Bill Analysis Results */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Brain className="w-4 h-4 text-blue-600" />
                            Bill Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Citizen Impact</span>
                              <span className="text-xs font-medium">{integratedAnalysisMutation.data.data.billAnalysis.citizenImpactScore}/10</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Complexity</span>
                              <Badge variant="outline" className="text-xs">{integratedAnalysisMutation.data.data.billAnalysis.complexity}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Urgency</span>
                              <Badge variant="outline" className="text-xs">{integratedAnalysisMutation.data.data.billAnalysis.urgencyLevel}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Research Results */}
                      {integratedAnalysisMutation.data.data.researchReport && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <Bot className="w-4 h-4 text-purple-600" />
                              Research Report
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-xs text-gray-600">{integratedAnalysisMutation.data.data.researchReport.summary?.substring(0, 100)}...</p>
                              <div className="flex items-center gap-2">
                                <Target className="w-3 h-3 text-blue-600" />
                                <span className="text-xs">Confidence: {integratedAnalysisMutation.data.data.researchReport.confidenceLevel}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Similar Bills */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Search className="w-4 h-4 text-green-600" />
                            Similar Bills
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {integratedAnalysisMutation.data.data.similarBills?.slice(0, 3).map((bill: SearchResult, index: number) => (
                              <div key={bill.id} className="text-xs">
                                <span className="font-medium">{Math.round(bill.score * 100)}%</span>
                                <span className="text-gray-600 ml-1">{bill.document.title.substring(0, 40)}...</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}