import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Timeline, 
  TimelineItem, 
  TimelineItemIndicator, 
  TimelineItemContent,
  TimelineItemTitle,
  TimelineItemDescription
} from "../ui/timeline";
import { AlertCircle, CheckCircle, Clock, ExternalLink, File, ArrowRight, User, Users, BookOpen, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface BillHistoryEvent {
  id: number;
  billId: string;
  eventDate: string;
  action: string;
  chamber: string;
  committeeId?: number;
  voteData?: any;
}

interface BillHistoryViewProps {
  billId: string;
}

export default function BillHistoryView({ billId }: BillHistoryViewProps) {
  const { data: historyEvents, isLoading, error } = useQuery<any>({
    queryKey: ['/api/legislation/history', billId],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/legislation/history/${billId}`);
        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Error fetching bill history:", err);
        throw err;
      }
    },
    enabled: !!billId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getEventIcon = (action: string, chamber: string) => {
    // Helper to determine appropriate icon based on action text
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes("filed") || actionLower.includes("introduced")) {
      return <File className="h-4 w-4 text-blue-500" />;
    }
    if (actionLower.includes("passed") || actionLower.includes("enrolled") || actionLower.includes("signed")) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (actionLower.includes("vetoed") || actionLower.includes("failed")) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (actionLower.includes("committee") || actionLower.includes("referred")) {
      return <Users className="h-4 w-4 text-amber-500" />;
    }
    if (actionLower.includes("read") || actionLower.includes("reading")) {
      return <BookOpen className="h-4 w-4 text-purple-500" />;
    }
    if (actionLower.includes("received") || actionLower.includes("sent to")) {
      return <ArrowRight className="h-4 w-4 text-indigo-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getChamberColor = (chamber: string) => {
    switch (chamber.toLowerCase()) {
      case "house": return "bg-blue-100 text-blue-800";
      case "senate": return "bg-purple-100 text-purple-800";
      case "governor": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
        <p className="text-red-600">Failed to load bill history</p>
        <Button 
          variant="outline"
          size="sm" 
          className="mt-2"
          onClick={() => window.open(`https://capitol.texas.gov/BillLookup/History.aspx?LegSess=88R&Bill=${billId.replace('TX-', '')}`, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Texas Legislature Online
        </Button>
      </div>
    );
  }

  // Ensure historyEvents is an array and sort by date (newest to oldest)
  const sortedEvents = historyEvents && Array.isArray(historyEvents) 
    ? [...historyEvents].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    : [];

  if (sortedEvents.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No history events available for this bill.</p>
        <Button 
          variant="outline"
          size="sm" 
          className="mt-2"
          onClick={() => window.open(`https://capitol.texas.gov/BillLookup/History.aspx?LegSess=88R&Bill=${billId.replace('TX-', '')}`, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Texas Legislature Online
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ScrollArea className="h-[400px] px-2 pb-6">
        <Timeline>
          {sortedEvents.map((event, index) => (
            <TimelineItem key={event.id || index}>
              <TimelineItemIndicator>
                {getEventIcon(event.action, event.chamber)}
              </TimelineItemIndicator>
              <TimelineItemContent>
                <TimelineItemTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{event.action}</span>
                    <Badge variant="outline" className={getChamberColor(event.chamber)}>
                      {event.chamber.charAt(0).toUpperCase() + event.chamber.slice(1)}
                    </Badge>
                  </div>
                </TimelineItemTitle>
                <TimelineItemDescription>
                  {format(new Date(event.eventDate), 'MMMM d, yyyy')}
                </TimelineItemDescription>
              </TimelineItemContent>
            </TimelineItem>
          ))}
        </Timeline>
      </ScrollArea>
    </div>
  );
}