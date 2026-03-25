import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Download, 
  Share2, 
  Lightbulb, 
  AlertTriangle, 
  Users,
  Building,
  Scale,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BillSummaryProps {
  billId: string;
}

// Define the BillSummary type based on the API response
interface BillSummaryType {
  id: number;
  billId: string;
  executiveSummary: string;
  keyPoints: string[];
  impactAnalysis: string;
  legalImplications: string;
  stakeholderAnalysis: { stakeholder: string; impact: string }[];
  committeeActions: { action: string; date: string; result: string }[];
  keyDates: { date: string; event: string; description: string }[];
  historyHighlights: { date: string; event: string; significance: string }[];
  pdfGeneratedUrl: string | null;
  hasShareableVersion: boolean;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function BillSummary({ billId }: BillSummaryProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch the bill summary from the API
  const { data: summary, isLoading, isError, error } = useQuery<BillSummaryType>({
    queryKey: ["/api/bills", billId, "summary"],
    queryFn: () => fetch(`/api/bills/${billId}/summary`).then(res => res.json()),
    retry: 1
  });
  
  // Track the view of this summary
  useEffect(() => {
    if (summary?.id) {
      // This would typically be a POST request to track views, but we're keeping it simple
      // An actual implementation could use a mutation in React Query
    }
  }, [summary?.id]);
  
  const handleShareSummary = () => {
    // Generate a shareable URL
    const shareableLink = `${window.location.origin}/bills/${billId}/summary`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableLink);
    
    toast({
      title: "Link copied to clipboard",
      description: "Share this link to let others view this summary.",
      variant: "default",
    });
  };
  
  const handleDownloadPDF = () => {
    if (summary?.pdfGeneratedUrl) {
      window.open(summary.pdfGeneratedUrl, '_blank');
    } else {
      // If no PDF is available, redirect to the PDF generation endpoint
      window.open(`/api/bills/${billId}/summary/pdf`, '_blank');
    }
  };
  
  // If still processing
  if (summary?.processingStatus === "processing" || summary?.processingStatus === "pending") {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Lightbulb className="mr-2 text-amber-500" size={18} />
            AI Bill Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-muted h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Your summary is being generated...
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a few moments. The summary will appear here when it's ready.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If error or failed status
  if (isError || summary?.processingStatus === "failed") {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <AlertTriangle className="mr-2 text-red-500" size={18} />
            Summary Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <p className="text-muted-foreground">
              We couldn't generate a summary for this bill right now.
            </p>
            <p className="text-sm text-muted-foreground">
              {isError ? (error instanceof Error ? error.message : "An unknown error occurred") : 
                "Our AI service is currently experiencing high demand. Please try again later."}
            </p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If loading
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Skeleton className="h-4 w-[200px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-4">
              <Skeleton className="h-4 w-[150px] mb-3" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-full mb-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If no summary data
  if (!summary) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Lightbulb className="mr-2 text-amber-500" size={18} />
            AI Bill Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <p className="text-muted-foreground">
              No summary is available for this bill.
            </p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Generate Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render the full summary content
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center">
            <Lightbulb className="mr-2 text-amber-500" size={18} />
            AI Bill Summary
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={handleShareSummary}
            >
              <Share2 size={14} className="mr-1" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={handleDownloadPDF}
              disabled={!summary.hasShareableVersion && !summary.pdfGeneratedUrl}
            >
              <Download size={14} className="mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Executive Summary */}
          <div>
            <h4 className="font-medium mb-2">Executive Summary</h4>
            <p className="text-muted-foreground">
              {summary.executiveSummary}
            </p>
          </div>
          
          <Separator className="my-4" />
          
          {/* Tabbed Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <CheckCircle2 size={16} className="mr-1 text-green-500" />
                  Key Points
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {summary.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
              
              {summary.stakeholderAnalysis.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Users size={16} className="mr-1 text-blue-500" />
                    Stakeholder Analysis
                  </h4>
                  <div className="space-y-2">
                    {summary.stakeholderAnalysis.map((item, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-md">
                        <h5 className="font-medium text-sm">{item.stakeholder}</h5>
                        <p className="text-sm text-muted-foreground">{item.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Impact Tab */}
            <TabsContent value="impact">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Building size={16} className="mr-1 text-purple-500" />
                    Potential Impact
                  </h4>
                  <p className="text-muted-foreground">{summary.impactAnalysis}</p>
                </div>
                
                {summary.committeeActions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Committee Actions</h4>
                    <div className="space-y-2">
                      {summary.committeeActions.map((action, index) => (
                        <div key={index} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                          <div className="font-medium">{action.action}</div>
                          <div className="text-muted-foreground flex justify-between">
                            <span>{action.date}</span>
                            <Badge variant={action.result.toLowerCase().includes('pass') ? 'default' : 'outline'}>
                              {action.result}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Legal Tab */}
            <TabsContent value="legal">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Scale size={16} className="mr-1 text-indigo-500" />
                  Legal Implications
                </h4>
                <p className="text-muted-foreground">{summary.legalImplications}</p>
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Related Resources</h4>
                  <div className="space-y-2">
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href={`https://statutes.capitol.texas.gov/`} target="_blank" rel="noopener noreferrer">
                        <FileText size={14} className="mr-1" />
                        Texas Statutes <ExternalLink size={12} className="ml-1" />
                      </a>
                    </Button>
                    <div>
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href={`https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=${billId.replace('TX-', '')}`} target="_blank" rel="noopener noreferrer">
                          <FileText size={14} className="mr-1" />
                          Official Bill Page <ExternalLink size={12} className="ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* History Tab */}
            <TabsContent value="history">
              <div className="space-y-4">
                {summary.keyDates.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Clock size={16} className="mr-1 text-orange-500" />
                      Key Dates
                    </h4>
                    <div className="space-y-2">
                      {summary.keyDates.map((date, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="bg-muted px-2 py-1 rounded text-xs font-medium">
                            {date.date}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{date.event}</div>
                            <div className="text-sm text-muted-foreground">{date.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {summary.historyHighlights.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">History Highlights</h4>
                    <div className="space-y-3">
                      {summary.historyHighlights.map((highlight, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{highlight.event}</span>
                            <span className="text-sm text-muted-foreground">{highlight.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{highlight.significance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {summary.keyDates.length === 0 && summary.historyHighlights.length === 0 && (
                  <p className="text-muted-foreground italic">No historical information available for this bill yet.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground flex justify-between items-center">
          <div>
            Generated on {new Date(summary.createdAt).toLocaleDateString()} • Views: {summary.viewCount}
          </div>
          <Badge variant="outline" className="text-xs">
            AI Generated
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}