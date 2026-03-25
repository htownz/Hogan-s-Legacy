import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  FileText, 
  Loader2, 
  ExternalLink, 
  AlertTriangle,
  Image
} from "lucide-react";
import axios from "axios";
import { Link } from "wouter";

// Define types for our bill data
interface BillSearchResult {
  bill_id: number;
  number: string;
  change_hash: string;
  state: string;
  state_id: number;
  session_id: number;
  session: string;
  url: string;
  status_date: string;
  status: number;
  last_action: string;
  last_action_date: string;
  title: string;
  description: string;
}

interface BillDetail {
  bill_id: number;
  bill_number: string;
  bill_type: string;
  bill_type_id: string;
  body: string;
  body_id: number;
  current_body: string;
  current_body_id: number;
  title: string;
  description: string;
  state: string;
  state_id: number;
  session: { session_id: number; session_name: string };
  progress: { [key: string]: any };
  history: { [key: string]: any }[];
  sponsors: { [key: string]: any }[];
  texts: { 
    doc_id: number;
    date: string;
    type: string;
    type_id: number;
    mime: string;
    mime_id: number;
    url: string;
    state_link: string;
  }[];
  votes: { [key: string]: any }[];
  amendments: { [key: string]: any }[];
  calendar: { [key: string]: any }[];
  status: number;
  status_date: string;
  committee: { committee_id: number; chamber: string; name: string } | null;
}

export default function BillVisualAnalysisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [year, setYear] = useState<string>("2023");
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  // Query for bill details
  const { 
    data: billDetail, 
    isLoading: isBillLoading
  } = useQuery<any>({ 
    queryKey: ['billDetail', selectedBillId],
    queryFn: async () => {
      if (!selectedBillId) return null;
      const response = await axios.get(`/api/legiscan/bill/${selectedBillId}`);
      return response.data.data;
    },
    enabled: !!selectedBillId
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
    setAnalysisResult(null);
    setImageData(null);
  };

  const handleAnalyzeWithBillContext = async () => {
    if (!imageData || !billDetail) {
      toast({
        title: "Missing data",
        description: "Please select a bill and upload an image to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Prepare context object with bill information
      const context = {
        billNumber: billDetail.bill_number,
        billTitle: billDetail.title,
        description: billDetail.description,
        state: billDetail.state,
        session: billDetail.session.session_name,
        statusDate: billDetail.status_date,
        lastAction: billDetail.status || "Unknown"
      };

      // Send image and context to the multimodal analysis API
      const response = await axios.post("/api/multimodal/analyze-image-url", {
        imageUrl: imageData,
        context,
        analysisType: "detailed"
      });

      if (response.data.success) {
        setAnalysisResult(response.data.data);
        toast({
          title: "Analysis complete",
          description: "The image has been analyzed in the context of this bill",
        });
      } else {
        throw new Error(response.data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
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
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlInput = (url: string) => {
    setImageData(url);
    setAnalysisResult(null);
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
          {searchResults.bills.map((bill: BillSearchResult) => (
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

  const renderBillDetail = () => {
    if (!billDetail) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{billDetail.bill_number}</CardTitle>
          <CardDescription>
            {billDetail.state} - {billDetail.session.session_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Title</h3>
            <p>{billDetail.title}</p>
          </div>
          
          {billDetail.description && (
            <div>
              <h3 className="text-lg font-semibold">Description</h3>
              <p>{billDetail.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold">Status</h3>
            <p>{billDetail.status_date} - {billDetail.status || "Unknown"}</p>
          </div>
          
          {billDetail.texts && billDetail.texts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">Bill Texts</h3>
              <ul className="list-disc pl-5">
                {billDetail.texts.map((text: any) => (
                  <li key={text.doc_id}>
                    <a 
                      href={text.state_link || text.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      {text.type} ({text.date})
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            {analysisResult.visualType && `Detected content type: ${analysisResult.visualType}`}
            {analysisResult.confidence && ` (Confidence: ${analysisResult.confidence})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysisResult.summary && (
              <div>
                <h3 className="text-lg font-semibold">Summary</h3>
                <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
              </div>
            )}
            
            {analysisResult.billReferences && analysisResult.billReferences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Bill References</h3>
                <ul className="list-disc pl-5">
                  {analysisResult.billReferences.map((bill: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{bill.billNumber}</span>: {bill.context}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.committeeReferences && analysisResult.committeeReferences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Committee References</h3>
                <ul className="list-disc pl-5">
                  {analysisResult.committeeReferences.map((committee: string, index: number) => (
                    <li key={index} className="text-sm">{committee}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.dataPoints && analysisResult.dataPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Key Data Points</h3>
                <ul className="list-disc pl-5">
                  {analysisResult.dataPoints.map((dataPoint: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{dataPoint.metric}</span>: {dataPoint.value} 
                      {dataPoint.context && <span className="text-muted-foreground"> ({dataPoint.context})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.speakers && analysisResult.speakers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Speakers</h3>
                <ul className="list-disc pl-5">
                  {analysisResult.speakers.map((speaker: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{speaker.name}</span>
                      {speaker.role && <span className="text-muted-foreground"> ({speaker.role})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Bill Visual Analysis</h1>
            <p className="text-muted-foreground mb-6">
              Search for bills and analyze related visual content from hearings and documents.
            </p>
            
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
            
            {/* Selected bill details */}
            {renderBillDetail()}
          </div>
          
          <div>
            {/* Visual content analysis section */}
            <Card>
              <CardHeader>
                <CardTitle>Visual Content Analysis</CardTitle>
                <CardDescription>
                  Analyze images related to the selected bill
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    <TabsTrigger value="url">Image URL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={!selectedBillId}
                    />
                    {!selectedBillId && (
                      <div className="text-sm text-muted-foreground">
                        Please select a bill first before uploading an image.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      onChange={(e) => handleImageUrlInput(e.target.value)}
                      disabled={!selectedBillId}
                    />
                    {!selectedBillId && (
                      <div className="text-sm text-muted-foreground">
                        Please select a bill first before providing an image URL.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                {imageData && (
                  <>
                    <Separator className="my-4" />
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Preview</h3>
                      <div className="border rounded-md overflow-hidden w-full h-52 relative">
                        <img 
                          src={imageData} 
                          alt="Preview" 
                          className="object-contain w-full h-full"
                          onError={() => {
                            toast({
                              title: "Image error",
                              description: "Failed to load the image. Please check the URL and try again.",
                              variant: "destructive"
                            });
                            setImageData(null);
                          }}
                        />
                      </div>
                      <Button
                        className="mt-4 w-full"
                        onClick={handleAnalyzeWithBillContext}
                        disabled={isAnalyzing || !selectedBillId || !imageData}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Image className="mr-2 h-4 w-4" />
                            Analyze with Bill Context
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
                
                <div className="mt-4 text-xs text-muted-foreground">
                  <AlertTriangle className="inline-block mr-1 h-3 w-3" />
                  Images are analyzed using AI. Results may not always be accurate.
                </div>
              </CardContent>
            </Card>
            
            {/* Analysis results */}
            {renderAnalysisResults()}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/multimodal-analysis">
            <Button variant="outline">
              Go to Standard Multimodal Analysis
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}