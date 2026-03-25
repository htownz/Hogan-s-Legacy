import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Loader2, 
  ExternalLink, 
  AlertTriangle,
  Image,
  Users,
  MessageSquare,
  DollarSign,
  LineChart,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import axios from "axios";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ContextualBillAnalysisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [year, setYear] = useState<string>("2023");
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState({
    includeWitnessTestimony: true,
    includeOfficialStatements: true,
    includeCampaignFinance: true,
    includeNarrativeContext: true
  });
  const [activeTab, setActiveTab] = useState<string>("analysis");
  const { toast } = useToast();

  // Query for bill search results
  const { 
    data: searchResults, 
    isLoading: isSearching,
    refetch: refetchSearch
  } = useQuery<any>({ 
    queryKey: ['billSearch', searchQuery, year],
    queryFn: async () => {
      if (!searchQuery) return { bills: [] };
      const response = await axios.get(`/api/legiscan/search?query=${encodeURIComponent(searchQuery)}&year=${year}`);
      return response.data.data;
    },
    enabled: false
  });

  // Query for comprehensive bill analysis
  const { 
    data: analysisData, 
    isLoading: isAnalysisLoading,
    refetch: refetchAnalysis
  } = useQuery<any>({ 
    queryKey: ['billContextualAnalysis', selectedBillId, analysisOptions],
    queryFn: async () => {
      if (!selectedBillId) return null;
      
      const params = new URLSearchParams();
      Object.entries(analysisOptions).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
      
      const response = await axios.get(`/api/contextual/bill/${selectedBillId}/analysis?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!selectedBillId
  });

  // Query for witness testimony
  const { 
    data: testimonyData, 
    isLoading: isTestimonyLoading
  } = useQuery<any>({ 
    queryKey: ['billTestimony', selectedBillId],
    queryFn: async () => {
      if (!selectedBillId) return null;
      const response = await axios.get(`/api/contextual/bill/${selectedBillId}/testimony`);
      return response.data.data;
    },
    enabled: !!selectedBillId && activeTab === "testimony"
  });

  // Query for campaign finance connections
  const { 
    data: financeData, 
    isLoading: isFinanceLoading
  } = useQuery<any>({ 
    queryKey: ['billFinance', selectedBillId],
    queryFn: async () => {
      if (!selectedBillId) return null;
      const response = await axios.get(`/api/contextual/bill/${selectedBillId}/finance`);
      return response.data.data;
    },
    enabled: !!selectedBillId && activeTab === "finance"
  });

  // Query for narrative context
  const { 
    data: narrativeData, 
    isLoading: isNarrativeLoading
  } = useQuery<any>({ 
    queryKey: ['billNarrative', selectedBillId],
    queryFn: async () => {
      if (!selectedBillId) return null;
      const response = await axios.get(`/api/contextual/bill/${selectedBillId}/narrative`);
      return response.data.data;
    },
    enabled: !!selectedBillId && activeTab === "narrative"
  });

  const handleSearch = () => {
    if (!searchQuery) {
      toast({
        title: "Search query required",
        description: "Please enter a search term to find bills",
        variant: "destructive"
      });
      return;
    }
    refetchSearch();
  };

  const handleSelectBill = (billId: number) => {
    setSelectedBillId(billId);
    refetchAnalysis();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!imageData || !selectedBillId) {
      toast({
        title: "Missing data",
        description: "Please select a bill and upload an image to analyze",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // For file upload
      if (imageData.startsWith('data:')) {
        const formData = new FormData();
        // Convert base64 to file
        const fetchResponse = await fetch(imageData);
        const blob = await fetchResponse.blob();
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        formData.append('image', file);
        
        await axios.post(`/api/contextual/bill/${selectedBillId}/image-analysis`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // For URL
        await axios.post(`/api/contextual/bill/${selectedBillId}/image-url-analysis`, {
          imageUrl: imageData
        });
      }
      
      toast({
        title: "Analysis complete",
        description: "The image has been analyzed in the context of this bill",
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive"
      });
    }
  };

  const renderBillSearchResults = () => {
    if (!searchResults || !searchResults.bills || searchResults.bills.length === 0) {
      return (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {isSearching ? "Searching for bills..." : "No bills found. Try a different search term."}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="mt-4 space-y-4">
        <h3 className="text-lg font-semibold">Search Results</h3>
        <div className="grid gap-4">
          {searchResults.bills.map((bill: any) => (
            <Card 
              key={bill.bill_id} 
              className={`cursor-pointer transition-colors ${selectedBillId === bill.bill_id ? 'border-primary' : ''}`}
              onClick={() => handleSelectBill(bill.bill_id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-start">
                  <span>{bill.number}</span>
                  <span className="text-sm font-normal text-muted-foreground">{bill.state}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm">{bill.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{bill.last_action_date}</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalysisOptions = () => {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Analysis Options</CardTitle>
          <CardDescription>Select what to include in the analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="witnessTestimony"
                checked={analysisOptions.includeWitnessTestimony}
                onChange={(e) => setAnalysisOptions({
                  ...analysisOptions,
                  includeWitnessTestimony: e.target.checked
                })}
              />
              <label htmlFor="witnessTestimony" className="cursor-pointer">
                Witness Testimony
              </label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Witness Testimony</h4>
                    <p className="text-sm">
                      Include testimony from witnesses who have spoken about this bill in committee hearings.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="officialStatements"
                checked={analysisOptions.includeOfficialStatements}
                onChange={(e) => setAnalysisOptions({
                  ...analysisOptions,
                  includeOfficialStatements: e.target.checked
                })}
              />
              <label htmlFor="officialStatements" className="cursor-pointer">
                Official Statements
              </label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Official Statements</h4>
                    <p className="text-sm">
                      Include statements from elected officials about this bill or related topics.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="campaignFinance"
                checked={analysisOptions.includeCampaignFinance}
                onChange={(e) => setAnalysisOptions({
                  ...analysisOptions,
                  includeCampaignFinance: e.target.checked
                })}
              />
              <label htmlFor="campaignFinance" className="cursor-pointer">
                Campaign Finance
              </label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Campaign Finance</h4>
                    <p className="text-sm">
                      Include campaign finance connections between bill sponsors and donors.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="narrativeContext"
                checked={analysisOptions.includeNarrativeContext}
                onChange={(e) => setAnalysisOptions({
                  ...analysisOptions,
                  includeNarrativeContext: e.target.checked
                })}
              />
              <label htmlFor="narrativeContext" className="cursor-pointer">
                Narrative Context
              </label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Narrative Context</h4>
                    <p className="text-sm">
                      Include analysis of how this bill is being framed in media and public discourse.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            <Button 
              onClick={() => refetchAnalysis()} 
              disabled={!selectedBillId || isAnalysisLoading}
              className="w-full mt-2"
            >
              {isAnalysisLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Update Analysis"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAnalysisResults = () => {
    if (!analysisData) {
      return (
        <div className="text-center py-8">
          {isAnalysisLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Analyzing bill context and connections...</p>
            </div>
          ) : (
            <p>Select a bill to see comprehensive analysis</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{analysisData.billNumber}</CardTitle>
                <CardDescription>{analysisData.state} - {analysisData.session?.session_name || ""}</CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(analysisData.status)}>
                {analysisData.status || "Unknown Status"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Title</h3>
              <p>{analysisData.title}</p>
            </div>
            
            {analysisData.description && (
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p>{analysisData.description}</p>
              </div>
            )}
            
            {analysisData.aiAnalysis && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="text-lg font-semibold mb-3">AI Analysis</h3>
                
                {analysisData.aiAnalysis.keyInsights && (
                  <div className="mb-4">
                    <h4 className="text-md font-medium mb-2">Key Insights</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisData.aiAnalysis.keyInsights.map((insight: string, index: number) => (
                        <li key={index} className="text-sm">{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysisData.aiAnalysis.stakeholderAnalysis && (
                  <Accordion type="single" collapsible className="mb-3">
                    <AccordionItem value="stakeholders">
                      <AccordionTrigger>Stakeholder Analysis</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm">{analysisData.aiAnalysis.stakeholderAnalysis}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                {analysisData.aiAnalysis.politicalDynamics && (
                  <Accordion type="single" collapsible className="mb-3">
                    <AccordionItem value="politics">
                      <AccordionTrigger>Political Dynamics</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm">{analysisData.aiAnalysis.politicalDynamics}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                {analysisData.aiAnalysis.narrativeAnalysis && (
                  <Accordion type="single" collapsible className="mb-3">
                    <AccordionItem value="narrative">
                      <AccordionTrigger>Narrative Analysis</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm">{analysisData.aiAnalysis.narrativeAnalysis}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                {analysisData.aiAnalysis.financialInfluences && (
                  <Accordion type="single" collapsible className="mb-3">
                    <AccordionItem value="financial">
                      <AccordionTrigger>Financial Influences</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm">{analysisData.aiAnalysis.financialInfluences}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                {analysisData.aiAnalysis.historicalContext && (
                  <Accordion type="single" collapsible className="mb-3">
                    <AccordionItem value="historical">
                      <AccordionTrigger>Historical Context</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm">{analysisData.aiAnalysis.historicalContext}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                <div className="text-xs text-right mt-3 text-muted-foreground">
                  Confidence Level: {analysisData.aiAnalysis.confidenceLevel || "Unknown"}
                </div>
              </div>
            )}
            
            {analysisData.sponsors && analysisData.sponsors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Sponsors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {analysisData.sponsors.map((sponsor: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span>{sponsor.name}</span>
                      {sponsor.party && (
                        <Badge variant="outline">{sponsor.party}</Badge>
                      )}
                      {sponsor.sponsor_type && (
                        <span className="text-xs text-muted-foreground">
                          ({sponsor.sponsor_type})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="analysis" className="flex items-center">
              <LineChart className="h-4 w-4 mr-2" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="testimony" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>Testimony</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>Finance</span>
            </TabsTrigger>
            <TabsTrigger value="narrative" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span>Narrative</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Comprehensive Analysis</CardTitle>
                <CardDescription>
                  AI-generated insights based on all available data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisData.aiAnalysis ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Summary</h3>
                      <p className="text-sm">
                        {analysisData.aiAnalysis.keyInsights?.[0] || "No summary available"}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold">Implementation Status</h3>
                      <div className="bg-muted p-4 rounded-md mt-2">
                        <p className="text-sm">
                          Note: This feature is currently showing placeholder data. To fully implement this feature, we need to:
                        </p>
                        <ul className="list-disc pl-5 mt-2 text-sm">
                          <li>Integrate with Texas Legislature Online to access committee witness records</li>
                          <li>Connect to news APIs and social media APIs for official statements</li>
                          <li>Integrate with Texas Ethics Commission data and FEC data for campaign finance</li>
                          <li>Develop media content analysis capabilities for narrative tracking</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No analysis available for this bill</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="testimony">
            <Card>
              <CardHeader>
                <CardTitle>Witness Testimony</CardTitle>
                <CardDescription>
                  Testimony from committee hearings related to this bill
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTestimonyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : testimonyData && testimonyData.length > 0 ? (
                  <div className="space-y-4">
                    {testimonyData.map((testimony: any, index: number) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{testimony.witnessName}</CardTitle>
                          <CardDescription>{testimony.affiliation}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>
                                <Badge>{testimony.position}</Badge>
                              </span>
                              <span className="text-muted-foreground">{testimony.date}</span>
                            </div>
                            <p className="text-sm">{testimony.summary}</p>
                            {testimony.keyPoints && testimony.keyPoints.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mt-2">Key Points</h4>
                                <ul className="list-disc pl-5 text-sm">
                                  {testimony.keyPoints.map((point: string, i: number) => (
                                    <li key={i}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No testimony data available for this bill</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="finance">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Finance Connections</CardTitle>
                <CardDescription>
                  Financial connections between bill sponsors and donors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFinanceLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : financeData && financeData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Legislator</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Industry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financeData.map((connection: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{connection.legislatorName}</TableCell>
                          <TableCell>{connection.donorName}</TableCell>
                          <TableCell>${connection.amount.toLocaleString()}</TableCell>
                          <TableCell>{connection.industry}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    <p>No campaign finance data available for this bill</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="narrative">
            <Card>
              <CardHeader>
                <CardTitle>Narrative Context</CardTitle>
                <CardDescription>
                  How this bill is being framed in media and public discourse
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isNarrativeLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : narrativeData ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dominant Frames</h3>
                      <div className="flex flex-wrap gap-2">
                        {narrativeData.dominantFrames.map((frame: string, index: number) => (
                          <Badge key={index} variant="secondary">{frame}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Opposing Frames</h3>
                      <div className="flex flex-wrap gap-2">
                        {narrativeData.opposingFrames.map((frame: string, index: number) => (
                          <Badge key={index} variant="outline">{frame}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {narrativeData.mediaPortrayal && narrativeData.mediaPortrayal.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Media Portrayal</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Source</TableHead>
                              <TableHead>Perspective</TableHead>
                              <TableHead>Influence</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {narrativeData.mediaPortrayal.map((media: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{media.source}</TableCell>
                                <TableCell>{media.perspective}</TableCell>
                                <TableCell>
                                  <Badge variant={getInfluenceBadgeVariant(media.influence)}>
                                    {media.influence}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    {narrativeData.publicOpinion && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Public Opinion</h3>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-500">
                              {narrativeData.publicOpinion.supportPercent}%
                            </div>
                            <div className="text-sm text-muted-foreground">Support</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-500">
                              {narrativeData.publicOpinion.opposePercent}%
                            </div>
                            <div className="text-sm text-muted-foreground">Oppose</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-500">
                              {narrativeData.publicOpinion.neutralPercent}%
                            </div>
                            <div className="text-sm text-muted-foreground">Neutral</div>
                          </div>
                        </div>
                        <div className="text-xs text-right mt-2 text-muted-foreground">
                          Source: {narrativeData.publicOpinion.source} ({narrativeData.publicOpinion.date})
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No narrative data available for this bill</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    if (!status) return "outline";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("passed") || statusLower.includes("enacted")) {
      return "success";
    } else if (statusLower.includes("introduced") || statusLower.includes("filed")) {
      return "default";
    } else if (statusLower.includes("failed") || statusLower.includes("vetoed")) {
      return "destructive";
    } else if (statusLower.includes("committee") || statusLower.includes("reading")) {
      return "secondary";
    }
    
    return "outline";
  };

  const getInfluenceBadgeVariant = (influence: string) => {
    switch (influence) {
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Contextual Bill Analysis</h1>
          <p className="text-muted-foreground max-w-3xl">
            Comprehensive analysis of legislation including witness testimony, official statements, 
            campaign finance connections, and narrative context.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Bill search section */}
            <Card>
              <CardHeader>
                <CardTitle>Find Legislative Bills</CardTitle>
                <CardDescription>
                  Search for bills by keyword, bill number, or topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Enter search term" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bill search results */}
            {renderBillSearchResults()}
            
            {/* Analysis options */}
            {selectedBillId && renderAnalysisOptions()}
            
            {/* Image analysis section */}
            {selectedBillId && (
              <Card>
                <CardHeader>
                  <CardTitle>Visual Analysis</CardTitle>
                  <CardDescription>
                    Analyze images in the context of this bill
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-4"
                  />
                  
                  {imageData && (
                    <div className="mt-4">
                      <div className="border rounded-md overflow-hidden w-full h-32 relative mb-4">
                        <img 
                          src={imageData} 
                          alt="Preview" 
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <Button
                        onClick={handleAnalyzeImage}
                        className="w-full"
                      >
                        <Image className="mr-2 h-4 w-4" />
                        Analyze with Bill Context
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {/* Analysis results */}
            {renderAnalysisResults()}
          </div>
        </div>
      </main>
    </div>
  );
}