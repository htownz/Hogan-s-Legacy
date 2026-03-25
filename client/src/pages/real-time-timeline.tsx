import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RealTimeTimeline } from "../components/shared/real-time-timeline";
import {
  Search,
  Loader2,
  Clock,
  TrendingUp,
  RefreshCw,
  Plus,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RealTimeTimelinePage() {
  const [billId, setBillId] = useState<string>("");
  const [billSearchQuery, setBillSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedTimeline, setSelectedTimeline] = useState<any>(null);
  const [watchList, setWatchList] = useState<number[]>([]);
  const { toast } = useToast();

  // Mutation for generating timeline
  const generateTimelineMutation = useMutation({
    mutationFn: async (billId: number) => {
      const response = await axios.get(`/api/timeline/bill/${billId}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setSelectedTimeline(data.data);
        toast({
          title: "Timeline Generated!",
          description: `Real-time timeline loaded for ${data.data.billNumber}`,
        });
      } else {
        toast({
          title: "Timeline Failed",
          description: data.error || "Failed to generate timeline",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Timeline Error",
        description: error.message || "An error occurred while generating timeline",
        variant: "destructive",
      });
    },
  });

  // Mutation for batch timeline updates
  const batchTimelineMutation = useMutation({
    mutationFn: async (billIds: number[]) => {
      const response = await axios.post('/api/timeline/batch', { billIds });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Batch Update Complete!",
          description: `Updated timelines for ${data.data.length} bills`,
        });
      }
    },
  });

  const handleSearchBills = async (query: string) => {
    if (!query) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/legiscan/search?query=${encodeURIComponent(query)}`);
      if (response.data.success && response.data.data && response.data.data.bills) {
        setSearchResults(response.data.data.bills);
      } else {
        setSearchResults([]);
        toast({
          title: "Search Failed",
          description: "Failed to retrieve bills. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching bills:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for bills",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBill = (selectedBillId: number) => {
    setBillId(selectedBillId.toString());
    setSearchResults([]);
    setBillSearchQuery("");
  };

  const handleGenerateTimeline = () => {
    if (!billId || isNaN(parseInt(billId, 10))) {
      toast({
        title: "Invalid Bill ID",
        description: "Please enter a valid bill ID",
        variant: "destructive",
      });
      return;
    }

    generateTimelineMutation.mutate(parseInt(billId, 10));
  };

  const handleAddToWatchList = (billId: number) => {
    if (!watchList.includes(billId)) {
      setWatchList(prev => [...prev, billId]);
      toast({
        title: "Added to Watch List",
        description: "Bill will be monitored for real-time updates",
      });
    }
  };

  const handleBatchUpdate = () => {
    if (watchList.length === 0) {
      toast({
        title: "No Bills to Update",
        description: "Add bills to your watch list first",
        variant: "destructive",
      });
      return;
    }

    batchTimelineMutation.mutate(watchList);
  };

  const handleEventClick = (event: any) => {
    toast({
      title: "Event Details",
      description: event.description,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Real-Time Legislative Timeline</h1>
              <p className="text-muted-foreground">
                Track bill progress with live updates and AI-powered predictions
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Single Bill Timeline</TabsTrigger>
            <TabsTrigger value="watchlist">Watch List</TabsTrigger>
            <TabsTrigger value="batch">Batch Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            {!selectedTimeline ? (
              <div className="space-y-6">
                {/* Bill Selection Interface */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Search className="mr-2 h-5 w-5" />
                      Select Bill for Timeline
                    </CardTitle>
                    <CardDescription>
                      Enter a bill ID or search by keyword to generate real-time timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Bill ID</label>
                      <Input
                        value={billId}
                        onChange={(e) => setBillId(e.target.value)}
                        placeholder="Enter bill ID number"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="h-px flex-1 bg-border"></div>
                      <span className="text-xs text-muted-foreground">OR</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Search for Bill</label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          value={billSearchQuery}
                          onChange={(e) => setBillSearchQuery(e.target.value)}
                          placeholder="Search by keyword or bill number"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchBills(billSearchQuery);
                          }}
                        />
                        <Button 
                          onClick={() => handleSearchBills(billSearchQuery)} 
                          disabled={isSearching || !billSearchQuery}
                          size="sm"
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {searchResults.map((bill) => (
                            <div 
                              key={bill.bill_id}
                              className="p-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleSelectBill(bill.bill_id)}
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">{bill.number}</span>
                                <span className="text-sm text-muted-foreground">{bill.state}</span>
                              </div>
                              <p className="text-sm truncate">{bill.title}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleGenerateTimeline}
                      disabled={generateTimelineMutation.isPending || !billId}
                      className="w-full"
                    >
                      {generateTimelineMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Timeline...
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Generate Real-Time Timeline
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Feature Preview */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Activity className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold">Real-Time Legislative Tracking</h3>
                      <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        Get live updates on bill progress with AI-powered predictions, visual timelines, 
                        and detailed event tracking to stay informed about legislation that matters to you.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-4 bg-white rounded-lg border">
                          <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                          <h4 className="font-medium text-sm">Live Updates</h4>
                          <p className="text-xs text-muted-foreground">Real-time bill progress tracking</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border">
                          <Zap className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                          <h4 className="font-medium text-sm">AI Predictions</h4>
                          <p className="text-xs text-muted-foreground">Smart forecasting of next steps</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border">
                          <CheckCircle2 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                          <h4 className="font-medium text-sm">Stage Indicators</h4>
                          <p className="text-xs text-muted-foreground">Clear progress visualization</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timeline Controls */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Timeline for {selectedTimeline.billNumber}
                  </h2>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddToWatchList(selectedTimeline.billId)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add to Watch List
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateTimelineMutation.mutate(selectedTimeline.billId)}
                    >
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTimeline(null)}
                    >
                      New Timeline
                    </Button>
                  </div>
                </div>

                {/* Real-Time Timeline Component */}
                <RealTimeTimeline 
                  timeline={selectedTimeline}
                  autoRefresh={true}
                  onEventClick={handleEventClick}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Watch List</CardTitle>
                <CardDescription>
                  Bills you're monitoring for real-time updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {watchList.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Bills in Watch List</h3>
                    <p className="text-muted-foreground mb-4">
                      Add bills to your watch list to monitor them for real-time updates
                    </p>
                    <Button onClick={() => {
                      // Switch to single bill tab
                      const tab = document.querySelector('[value="single"]') as HTMLElement;
                      tab?.click();
                    }}>
                      Add Your First Bill
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {watchList.map((billId) => (
                      <div key={billId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">Bill ID: {billId}</span>
                          <Badge variant="secondary" className="ml-2">Monitoring</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWatchList(prev => prev.filter(id => id !== billId))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Batch Timeline Updates</CardTitle>
                <CardDescription>
                  Update multiple bill timelines simultaneously
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Bills in watch list: {watchList.length}</span>
                    <Button 
                      onClick={handleBatchUpdate}
                      disabled={batchTimelineMutation.isPending || watchList.length === 0}
                    >
                      {batchTimelineMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Update All Timelines
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {watchList.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Add bills to your watch list to enable batch updates
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}