// @ts-nocheck
import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Scale, 
  Lightbulb, 
  Share2, 
  Download, 
  CalendarClock, 
  Building, 
  BadgeAlert 
} from "lucide-react";
import { BillSummaryGenerator } from "@/components/legislation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

// Types for Bill Summary data
interface BillSummary {
  id: number;
  billId: string;
  billTitle: string;
  executiveSummary: string;
  keyPoints: string[];
  impactAnalysis: string;
  legalImplications: string;
  stakeholderAnalysis: {
    supportingGroups: string[];
    opposingGroups: string[];
    explanation: string;
  };
  committeeActions: string;
  keyDates: {
    date: string;
    event: string;
    description: string;
  }[];
  historyHighlights: string[];
  processingStatus: "pending" | "processing" | "completed" | "failed";
  implementationTimeline?: string;
  fiscalConsiderations?: string;
  citizenActionGuide?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  shareCount: number;
}

export default function BillSummaryPage() {
  const { billId } = useParams<{ billId: string }>();
  const [_, setLocation] = useLocation();

  // Fetch bill summary data
  const { 
    data: summary, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<BillSummary>({
    queryKey: ["/api/bills", billId, "summary"],
    queryFn: async () => {
      const response = await fetch(`/api/bills/${billId}/summary`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch bill summary");
      }
      return response.json();
    },
    enabled: !!billId,
  });

  // Handle back navigation
  const handleBack = () => {
    setLocation("/advanced-search");
  };

  // Track summary view
  React.useEffect(() => {
    if (summary?.id && summary.processingStatus === "completed") {
      // Track view (could be implemented as an API call in a production app)
      console.log(`Viewed bill summary for ${billId}`);
    }
  }, [summary, billId]);

  // Share summary
  const handleShare = async () => {
    if (!summary) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Summary of ${summary.billTitle}`,
          text: `Check out this summary of Texas bill ${summary.billId}`,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard");
      }
      
      // Track share action (could send to API in production)
      console.log(`Shared bill summary for ${billId}`);
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!summary) return;
    
    // Navigate to the PDF endpoint
    window.open(`/api/bills/${billId}/summary/pdf`, "_blank");
    
    // Track download action
    console.log(`Downloaded PDF for bill ${billId}`);
  };

  // If not found or failed to fetch
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Alert variant="destructive" className="mb-8">
          <BadgeAlert className="h-5 w-5 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unable to load bill summary. Please try again later."}
          </AlertDescription>
        </Alert>
        
        <BillSummaryGenerator 
          billId={billId} 
          onComplete={() => refetch()}
        />
      </div>
    );
  }

  // Show loading state if data is loading or not available
  if (isLoading || !summary) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-60" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If summary is still being generated
  if (summary.processingStatus !== "completed") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">{summary.billId || billId}</h1>
        </div>
        
        <Alert className="mb-8">
          <AlertTitle>Summary is being generated</AlertTitle>
          <AlertDescription>
            {summary.processingStatus === "processing" 
              ? "Your summary is currently being generated. This may take a minute." 
              : "No summary is available for this bill yet."}
          </AlertDescription>
        </Alert>
        
        <BillSummaryGenerator 
          billId={billId} 
          onComplete={() => refetch()}
        />
      </div>
    );
  }

  // Render the full summary when available
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>{`${summary.billId} - ${summary.billTitle} | Act Up Texas`}</title>
        <meta name="description" content={summary.executiveSummary.substring(0, 160)} />
      </Helmet>
      
      <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">{summary.billId}</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">{summary.billTitle}</CardTitle>
          <CardDescription>
            {`Generated ${formatDate(summary.updatedAt)} • ${summary.viewCount} views`}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="summary" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
              <TabsTrigger value="key-points" className="flex items-center">
                <Lightbulb className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Key Points</span>
              </TabsTrigger>
              <TabsTrigger value="impact" className="flex items-center">
                <Building className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Impact</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="flex items-center">
                <Scale className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Legal</span>
              </TabsTrigger>
              <TabsTrigger value="stakeholders" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Stakeholders</span>
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[500px] mt-4 pr-4">
              <TabsContent value="summary" className="pt-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Executive Summary</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{summary.executiveSummary}</p>
                  </div>
                  
                  {summary.implementationTimeline && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Implementation Timeline</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{summary.implementationTimeline}</p>
                      </div>
                    </>
                  )}
                  
                  {summary.fiscalConsiderations && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Fiscal Considerations</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{summary.fiscalConsiderations}</p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="key-points" className="pt-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Key Points</h3>
                    <ul className="space-y-2">
                      {summary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {summary.citizenActionGuide && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Citizen Action Guide</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{summary.citizenActionGuide}</p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="impact" className="pt-2">
                <div>
                  <h3 className="text-lg font-medium mb-2">Impact Analysis</h3>
                  <p className="text-muted-foreground whitespace-pre-line mb-8">{summary.impactAnalysis}</p>
                  
                  {summary.keyDates && summary.keyDates.length > 0 && (
                    <>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <CalendarClock className="mr-2 h-5 w-5" />
                        Key Dates
                      </h3>
                      <div className="space-y-4 mb-8">
                        {summary.keyDates.map((item, index) => (
                          <div key={index} className="flex">
                            <div className="mr-4 relative">
                              <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center">
                                {new Date(item.date).getDate()}
                              </div>
                              {index < summary.keyDates.length - 1 && (
                                <div className="absolute top-10 bottom-0 left-1/2 w-0.5 -ml-px bg-muted-foreground/20 h-full"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{item.event}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(item.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div className="text-sm mt-1">{item.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {summary.historyHighlights && summary.historyHighlights.length > 0 && (
                    <>
                      <h3 className="text-lg font-medium mb-2">History Highlights</h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {summary.historyHighlights.map((highlight, index) => (
                          <li key={index}>{highlight}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="legal" className="pt-2">
                <div>
                  <h3 className="text-lg font-medium mb-2">Legal Implications</h3>
                  <p className="text-muted-foreground whitespace-pre-line mb-6">{summary.legalImplications}</p>
                  
                  {summary.committeeActions && (
                    <>
                      <h3 className="text-lg font-medium mb-2">Committee Actions</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{summary.committeeActions}</p>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="stakeholders" className="pt-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Stakeholder Analysis</h3>
                    <p className="text-muted-foreground mb-6 whitespace-pre-line">
                      {summary.stakeholderAnalysis.explanation}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">Supporting Groups</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {summary.stakeholderAnalysis.supportingGroups.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {summary.stakeholderAnalysis.supportingGroups.map((group, index) => (
                                <li key={index}>{group}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground italic">No identified supporting groups</p>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">Opposing Groups</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {summary.stakeholderAnalysis.opposingGroups.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {summary.stakeholderAnalysis.opposingGroups.map((group, index) => (
                                <li key={index}>{group}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground italic">No identified opposing groups</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between flex-wrap gap-2 border-t pt-6">
          <div className="text-sm text-muted-foreground">
            This summary is generated using AI and should not be considered legal advice.
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`https://capitol.texas.gov/BillLookup/Text.aspx?LegSess=89R&Bill=${billId}`} target="_blank" rel="noopener noreferrer">
              View Official Bill
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}