import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Loader2,
  Search,
  ExternalLink,
  FileText,
  Lightbulb,
  Sparkles,
  ScrollText,
  CheckCircle2,
  ArrowRight,
  AlignLeft,
  List,
  BookOpen,
  MessageSquare
} from "lucide-react";
import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function BillTranslatorPage() {
  const [activeTab, setActiveTab] = useState<string>("bill-id");
  const [billId, setBillId] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [readabilityLevel, setReadabilityLevel] = useState<string>("general");
  const [format, setFormat] = useState<string>("plain");
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { toast } = useToast();

  // Mutation for translating text
  const translateTextMutation = useMutation({
    mutationFn: async (data: { text: string; readabilityLevel: string; format: string }) => {
      const response = await axios.post('/api/translator/text', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setTranslationResult(data.data);
        toast({
          title: "Translation Complete",
          description: "The text has been successfully translated",
        });
      } else {
        toast({
          title: "Translation Failed",
          description: data.error || "An error occurred during translation",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Translation Failed",
        description: error.message || "An error occurred during translation",
        variant: "destructive",
      });
    },
  });

  // Mutation for translating bill by ID
  const translateBillMutation = useMutation({
    mutationFn: async (data: { billId: number; readabilityLevel: string; format: string }) => {
      const response = await axios.post(`/api/translator/bill/${data.billId}`, {
        readabilityLevel: data.readabilityLevel,
        format: data.format
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setTranslationResult(data.data);
        toast({
          title: "Bill Translation Complete",
          description: `Bill ${data.data.billInfo?.billNumber} has been translated`,
        });
      } else {
        toast({
          title: "Bill Translation Failed",
          description: data.error || "An error occurred during translation",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Bill Translation Failed",
        description: error.message || "An error occurred during translation",
        variant: "destructive",
      });
    },
  });

  const handleSearchBills = async () => {
    if (!searchQuery) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/legiscan/search?query=${encodeURIComponent(searchQuery)}`);
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
    setSearchQuery("");
  };

  const handleTranslateText = () => {
    if (!customText) {
      toast({
        title: "No Text Provided",
        description: "Please enter some text to translate",
        variant: "destructive",
      });
      return;
    }
    
    translateTextMutation.mutate({
      text: customText,
      readabilityLevel,
      format
    });
  };

  const handleTranslateBill = () => {
    if (!billId || isNaN(parseInt(billId, 10))) {
      toast({
        title: "Invalid Bill ID",
        description: "Please enter a valid bill ID",
        variant: "destructive",
      });
      return;
    }
    
    translateBillMutation.mutate({
      billId: parseInt(billId, 10),
      readabilityLevel,
      format
    });
  };

  const renderReadabilityOptions = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Reading Level</label>
        <Select value={readabilityLevel} onValueChange={setReadabilityLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Select reading level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="elementary" className="flex items-center">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Elementary School</span>
              </div>
            </SelectItem>
            <SelectItem value="middle_school">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Middle School</span>
              </div>
            </SelectItem>
            <SelectItem value="high_school">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>High School</span>
              </div>
            </SelectItem>
            <SelectItem value="college">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>College</span>
              </div>
            </SelectItem>
            <SelectItem value="general">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>General Adult</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">Format</label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plain">
              <div className="flex items-center">
                <AlignLeft className="mr-2 h-4 w-4" />
                <span>Plain Text</span>
              </div>
            </SelectItem>
            <SelectItem value="bullet_points">
              <div className="flex items-center">
                <List className="mr-2 h-4 w-4" />
                <span>Bullet Points</span>
              </div>
            </SelectItem>
            <SelectItem value="sections">
              <div className="flex items-center">
                <ScrollText className="mr-2 h-4 w-4" />
                <span>Sections</span>
              </div>
            </SelectItem>
            <SelectItem value="conversational">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Conversational</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTranslationResults = () => {
    if (!translationResult) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            Simplified Version
            {translationResult.billInfo && (
              <Badge variant="outline" className="ml-2">
                {translationResult.billInfo.billNumber}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Translated to {getReadabilityLevelLabel(translationResult.readabilityLevel)} level in {getFormatLabel(translationResult.format)} format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-md bg-muted/30">
            <p className="whitespace-pre-line">{translationResult.simplifiedText}</p>
          </div>
          
          {translationResult.keyTerms && translationResult.keyTerms.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="key-terms">
                <AccordionTrigger className="font-semibold">
                  Key Terms
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2">
                    {translationResult.keyTerms.map((term: any, index: number) => (
                      <div key={index} className="p-2 border rounded-md">
                        <span className="font-medium">{term.term}:</span> {term.explanation}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {translationResult.mainImpacts && translationResult.mainImpacts.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="main-impacts">
                <AccordionTrigger className="font-semibold">
                  Main Impacts
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    {translationResult.mainImpacts.map((impact: string, index: number) => (
                      <li key={index}>{impact}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {translationResult.readabilityStats && (
            <div className="flex justify-between text-sm text-muted-foreground border-t pt-2 mt-4">
              <span>
                Original Complexity: {translationResult.readabilityStats.originalComplexity}
              </span>
              <span>
                Technical Terms: {translationResult.readabilityStats.technicalTermCount}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const getReadabilityLevelLabel = (level: string) => {
    switch (level) {
      case 'elementary': return 'Elementary School';
      case 'middle_school': return 'Middle School';
      case 'high_school': return 'High School';
      case 'college': return 'College';
      case 'general': return 'General Adult';
      default: return level;
    }
  };

  const getFormatLabel = (formatValue: string) => {
    switch (formatValue) {
      case 'plain': return 'Plain Text';
      case 'bullet_points': return 'Bullet Points';
      case 'sections': return 'Sections';
      case 'conversational': return 'Conversational';
      default: return formatValue;
    }
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) return null;

    return (
      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
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
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Bill Translator</h1>
          <p className="text-muted-foreground max-w-3xl">
            Translate complex legislative language into simple, everyday terms that are easy to understand.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>What would you like to translate?</CardTitle>
                <CardDescription>
                  Choose a bill or enter custom text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bill-id">Bill ID</TabsTrigger>
                    <TabsTrigger value="custom-text">Custom Text</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bill-id" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bill ID</label>
                      <div className="flex space-x-2">
                        <Input 
                          value={billId}
                          onChange={(e) => setBillId(e.target.value)}
                          placeholder="Enter bill ID number"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="h-px flex-1 bg-border"></div>
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="h-px flex-1 bg-border"></div>
                      </div>
                      
                      <div className="mt-2">
                        <label className="text-sm font-medium">Search for a bill</label>
                        <div className="flex space-x-2 mt-1">
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by keyword or bill number"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSearchBills();
                            }}
                          />
                          <Button 
                            onClick={handleSearchBills} 
                            disabled={isSearching || !searchQuery}
                          >
                            {isSearching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {renderSearchResults()}
                      </div>
                    </div>
                    
                    {renderReadabilityOptions()}
                    
                    <Button 
                      className="w-full"
                      onClick={handleTranslateBill}
                      disabled={translateBillMutation.isPending || !billId}
                    >
                      {translateBillMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Translate Bill
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="custom-text" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Enter legislative text</label>
                      <Textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Paste legislative text here..."
                        className="min-h-[200px] mt-1"
                      />
                    </div>
                    
                    {renderReadabilityOptions()}
                    
                    <Button 
                      className="w-full"
                      onClick={handleTranslateText}
                      disabled={translateTextMutation.isPending || !customText}
                    >
                      {translateTextMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Translate Text
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {!translationResult && !translateBillMutation.isPending && !translateTextMutation.isPending && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">Bill Translator</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        The Bill Translator simplifies complex legislative language into easy-to-understand terms, helping everyone engage with the democratic process.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      <div className="border rounded-md p-3 text-left">
                        <div className="font-medium flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Multiple Reading Levels
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Adjust the complexity from elementary to college level
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-3 text-left">
                        <div className="font-medium flex items-center">
                          <ScrollText className="h-4 w-4 mr-2" />
                          Various Formats
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Choose between plain text, bullet points, or conversational
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-3 text-left">
                        <div className="font-medium flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Key Term Definitions
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Automatically explains technical or legal terms
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-3 text-left">
                        <div className="font-medium flex items-center">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Impact Assessment
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Highlights the main impacts of the legislation
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {(translateBillMutation.isPending || translateTextMutation.isPending) && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center">
                      <h3 className="text-lg font-medium">Translating Content</h3>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we process and simplify the legislative language...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {renderTranslationResults()}
          </div>
        </div>
      </main>
    </div>
  );
}