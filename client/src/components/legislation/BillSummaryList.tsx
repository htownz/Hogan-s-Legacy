import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  TrendingUp, 
  Star, 
  Clock, 
  ExternalLink,
  FileText
} from "lucide-react";

interface BillSummaryListProps {
  title?: string;
  description?: string;
  limit?: number;
  filter?: "popular" | "recent" | "featured" | "all";
}

interface BillSummaryItem {
  id: number;
  billId: string;
  billTitle: string;
  executiveSummary: string;
  billStatus: string;
  billChamber: string;
  viewCount: number;
  createdAt: string;
  topics?: string[];
}

export default function BillSummaryList({ 
  title = "Bill Summaries", 
  description = "AI-powered summaries of Texas legislation",
  limit = 5,
  filter = "all"
}: BillSummaryListProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>(filter);
  
  // Query to fetch bill summaries
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/api/bill-summaries", { limit, filter: activeTab }],
    queryFn: () => fetch(`/api/bill-summaries?limit=${limit}&filter=${activeTab}`).then(res => res.json()),
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleViewSummary = (billId: string) => {
    setLocation(`/bills/${billId}/summary`);
  };
  
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(date);
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Date unavailable";
    }
  };
  
  const truncateSummary = (text: string, maxLength: number = 120): string => {
    if (!text) return "No summary available";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 text-amber-500" size={20} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-1">
              <TrendingUp size={14} />
              Popular
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-1">
              <Star size={14} />
              Featured
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-1">
              <Clock size={14} />
              Recent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {renderSummaryList(data, isLoading, error)}
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            {renderSummaryList(data, isLoading, error)}
          </TabsContent>
          
          <TabsContent value="featured" className="mt-0">
            {renderSummaryList(data, isLoading, error)}
          </TabsContent>
          
          <TabsContent value="recent" className="mt-0">
            {renderSummaryList(data, isLoading, error)}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t pt-4 pb-2">
        <Button variant="outline" onClick={() => setLocation("/legislation")}>
          View All Legislation
          <ExternalLink size={14} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  function renderSummaryList(data: any, isLoading: boolean, error: any) {
    if (isLoading) {
      return (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Unable to load bill summaries at this time.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      );
    }
    
    if (!data || !data.summaries || data.summaries.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No bill summaries are available in this category yet.
          </p>
          <Button variant="outline" onClick={() => setActiveTab("all")}>
            View All Summaries
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {data.summaries.map((summary: BillSummaryItem) => (
          <div key={summary.id} className="border rounded-lg p-4 hover:shadow-sm hover:border-primary/40 transition-all">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between">
                <h3 className="font-semibold text-lg">{summary.billId}</h3>
                <Badge variant="outline" className={summary.billChamber?.toLowerCase() === 'house' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}>
                  {summary.billChamber || "Unknown Chamber"}
                </Badge>
              </div>
              
              <h4 className="text-base font-medium">
                {summary.billTitle || "Untitled Bill"}
              </h4>
              
              <p className="text-sm text-muted-foreground">
                {truncateSummary(summary.executiveSummary)}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(summary.createdAt)}</span>
                <span>•</span>
                <span>{summary.viewCount || 0} views</span>
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <div className="flex gap-1.5">
                  {summary.topics && summary.topics.slice(0, 2).map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {summary.topics && summary.topics.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{summary.topics.length - 2}
                    </Badge>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => handleViewSummary(summary.billId)}
                >
                  <FileText size={14} />
                  View Summary
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}