import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BillComparisonSlider } from "../components/shared/bill-comparison-slider";
import {
  Search,
  Loader2,
  GitCompare,
  Plus,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X
} from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InteractiveBillComparisonPage() {
  const [billId1, setBillId1] = useState<string>("");
  const [billId2, setBillId2] = useState<string>("");
  const [billSearchQuery1, setBillSearchQuery1] = useState<string>("");
  const [billSearchQuery2, setBillSearchQuery2] = useState<string>("");
  const [searchResults1, setSearchResults1] = useState<any[]>([]);
  const [searchResults2, setSearchResults2] = useState<any[]>([]);
  const [isSearching1, setIsSearching1] = useState<boolean>(false);
  const [isSearching2, setIsSearching2] = useState<boolean>(false);
  const [comparison, setComparison] = useState<any>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const { toast } = useToast();

  // Mutation for comparing bills
  const compareBillsMutation = useMutation({
    mutationFn: async (data: { billId1: number; billId2: number }) => {
      const response = await axios.post('/api/bill-comparison/compare', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setComparison(data.data);
        toast({
          title: "Comparison Complete!",
          description: `Generated detailed analysis of ${data.data.bill1.number} vs ${data.data.bill2.number}`,
        });
      } else {
        toast({
          title: "Comparison Failed",
          description: data.error || "Failed to compare bills",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Comparison Error",
        description: error.message || "An error occurred while comparing bills",
        variant: "destructive",
      });
    },
  });

  const handleSearchBills = async (query: string, billNumber: 1 | 2) => {
    if (!query) return;
    
    const setSearching = billNumber === 1 ? setIsSearching1 : setIsSearching2;
    const setResults = billNumber === 1 ? setSearchResults1 : setSearchResults2;
    
    setSearching(true);
    try {
      const response = await axios.get(`/api/legiscan/search?query=${encodeURIComponent(query)}`);
      if (response.data.success && response.data.data && response.data.data.bills) {
        setResults(response.data.data.bills);
      } else {
        setResults([]);
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
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBill = (selectedBillId: number, billNumber: 1 | 2) => {
    if (billNumber === 1) {
      setBillId1(selectedBillId.toString());
      setSearchResults1([]);
      setBillSearchQuery1("");
    } else {
      setBillId2(selectedBillId.toString());
      setSearchResults2([]);
      setBillSearchQuery2("");
    }
  };

  const handleCompareBills = () => {
    if (!billId1 || !billId2 || isNaN(parseInt(billId1, 10)) || isNaN(parseInt(billId2, 10))) {
      toast({
        title: "Invalid Bill IDs",
        description: "Please enter valid bill IDs for both bills",
        variant: "destructive",
      });
      return;
    }

    if (billId1 === billId2) {
      toast({
        title: "Same Bill Selected",
        description: "Please select two different bills to compare",
        variant: "destructive",
      });
      return;
    }

    compareBillsMutation.mutate({
      billId1: parseInt(billId1, 10),
      billId2: parseInt(billId2, 10)
    });
  };

  const clearComparison = () => {
    setComparison(null);
    setBillId1("");
    setBillId2("");
  };

  const renderBillSearch = (
    billNumber: 1 | 2,
    billId: string,
    setBillId: (value: string) => void,
    searchQuery: string,
    setSearchQuery: (value: string) => void,
    searchResults: any[],
    isSearching: boolean
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">Bill {billNumber}</span>
          {billId && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Select the {billNumber === 1 ? 'first' : 'second'} bill for comparison
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword or bill number"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchBills(searchQuery, billNumber);
              }}
            />
            <Button 
              onClick={() => handleSearchBills(searchQuery, billNumber)} 
              disabled={isSearching || !searchQuery}
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
                  onClick={() => handleSelectBill(bill.bill_id, billNumber)}
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
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GitCompare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Interactive Bill Comparison</h1>
                <p className="text-muted-foreground">
                  Compare bills side-by-side with our interactive slider interface
                </p>
              </div>
            </div>
            {comparison && (
              <Button variant="outline" onClick={clearComparison}>
                <X className="mr-2 h-4 w-4" />
                New Comparison
              </Button>
            )}
          </div>
        </div>

        {!comparison ? (
          <div className="space-y-6">
            {/* Bill Selection Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderBillSearch(
                1, billId1, setBillId1, billSearchQuery1, setBillSearchQuery1, 
                searchResults1, isSearching1
              )}
              {renderBillSearch(
                2, billId2, setBillId2, billSearchQuery2, setBillSearchQuery2, 
                searchResults2, isSearching2
              )}
            </div>

            {/* Compare Button */}
            <div className="flex justify-center">
              <Button 
                size="lg"
                onClick={handleCompareBills}
                disabled={compareBillsMutation.isPending || !billId1 || !billId2}
                className="px-8"
              >
                {compareBillsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Bills...
                  </>
                ) : (
                  <>
                    <GitCompare className="mr-2 h-4 w-4" />
                    Compare Bills
                  </>
                )}
              </Button>
            </div>

            {/* Feature Preview */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Lightbulb className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Interactive Bill Analysis</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Our interactive slider lets you focus on individual bills or compare them side-by-side. 
                    Get AI-powered insights, visual comparisons, and understand how bills relate to each other.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Smart Analysis</h4>
                      <p className="text-xs text-muted-foreground">AI-powered comparison insights</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <GitCompare className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Interactive Slider</h4>
                      <p className="text-xs text-muted-foreground">Focus on either bill or both</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <CheckCircle2 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Visual Insights</h4>
                      <p className="text-xs text-muted-foreground">Category scores and timelines</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Interactive Comparison Results */}
            <BillComparisonSlider 
              comparison={comparison}
              onSliderChange={(position) => setSliderPosition(position)}
            />

            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="similarities" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="similarities">Similarities</TabsTrigger>
                <TabsTrigger value="differences">Differences</TabsTrigger>
                <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
              </TabsList>
              
              <TabsContent value="similarities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                      Key Similarities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comparison.comparison.similarities.map((similarity: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{similarity}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="differences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ArrowRight className="mr-2 h-5 w-5 text-blue-500" />
                      Key Differences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comparison.comparison.differences.map((difference: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{difference}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conflicts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                      Conflict Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comparison.comparison.conflictAreas.map((conflict: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{conflict}</p>
                        </div>
                      ))}
                      
                      {comparison.comparison.complementaryAspects.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3 text-green-600">Complementary Aspects</h4>
                          {comparison.comparison.complementaryAspects.map((aspect: string, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg mb-2">
                              <Plus className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{aspect}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="impact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-purple-500" />
                      Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-700 mb-2">If {comparison.bill1.number} Passes</h4>
                          <p className="text-sm text-blue-600">{comparison.comparison.impactAnalysis.if_bill1_passes}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-700 mb-2">If {comparison.bill2.number} Passes</h4>
                          <p className="text-sm text-green-600">{comparison.comparison.impactAnalysis.if_bill2_passes}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-700 mb-2">If Both Bills Pass</h4>
                        <p className="text-sm text-purple-600">{comparison.comparison.impactAnalysis.if_both_pass}</p>
                      </div>

                      {comparison.comparison.impactAnalysis.citizen_action_needed.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Citizen Action Needed</h4>
                          <div className="space-y-2">
                            {comparison.comparison.impactAnalysis.citizen_action_needed.map((action: string, index: number) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                                <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}