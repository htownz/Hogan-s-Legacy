import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { VideoSegment } from "@shared/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Clock, Tag, MessageSquare, User, FileText } from "lucide-react";

interface VideoSegmentDisplayProps {
  meetingId: string | number;
}

export function VideoSegmentDisplay({ meetingId }: VideoSegmentDisplayProps) {
  const [selectedSegment, setSelectedSegment] = useState<VideoSegment | null>(null);

  const { data: segments, isLoading, error } = useQuery<VideoSegment[]>({
    queryKey: [`/api/committee-meetings/${meetingId}/live-segments`],
    enabled: !!meetingId,
  });

  const getSentimentColor = (score: number) => {
    if (score >= 50) return "bg-green-100 text-green-800";
    if (score >= 20) return "bg-emerald-100 text-emerald-800";
    if (score >= 0) return "bg-blue-100 text-blue-800";
    if (score >= -20) return "bg-amber-100 text-amber-800";
    if (score >= -50) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 50) return "Very Positive";
    if (score >= 20) return "Positive";
    if (score >= 0) return "Neutral";
    if (score >= -20) return "Mild Concern";
    if (score >= -50) return "Concerned";
    return "Critical";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-4">
          <Skeleton className="h-[400px] w-[200px] rounded-lg" />
          <Skeleton className="flex-1 h-[400px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !segments || segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Segments</CardTitle>
          <CardDescription>
            No video segments have been processed yet for this meeting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Segments will appear here once the meeting is in progress or has been processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 h-[600px]">
      {/* List of segments */}
      <Card className="sm:w-1/3 min-w-[250px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Video Segments</CardTitle>
          <CardDescription>{segments.length} segments analyzed</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] p-4">
            <div className="space-y-2">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedSegment?.id === segment.id
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => setSelectedSegment(segment)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm line-clamp-2">{segment.description}</h4>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 shrink-0 ${getSentimentColor(segment.sentimentScore)}`}
                    >
                      {getSentimentLabel(segment.sentimentScore)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    <span>{segment.startTimestamp || "00:00"}</span>
                  </div>
                  
                  {segment.billIds && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {segment.billIds.split(",").map((billId, idx) => 
                        billId.trim() && (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {billId.trim()}
                          </Badge>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Segment details */}
      <Card className="flex-1">
        {selectedSegment ? (
          <>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedSegment.description}</CardTitle>
                  <CardDescription>
                    {new Date(selectedSegment.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getSentimentColor(selectedSegment.sentimentScore)}`}
                >
                  Sentiment: {selectedSegment.sentimentScore} | {getSentimentLabel(selectedSegment.sentimentScore)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Time range */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Time Range:</span>
                  <span className="text-sm">
                    {selectedSegment.startTimestamp} - {selectedSegment.endTimestamp}
                  </span>
                </div>
                
                {/* Speaker info */}
                {selectedSegment.speakerName && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <span className="text-sm font-medium">Speaker:</span>
                      <div className="text-sm">
                        {selectedSegment.speakerName}
                        {selectedSegment.speakerRole && (
                          <Badge variant="outline" className="ml-2">
                            {selectedSegment.speakerRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bills discussed */}
                {selectedSegment.billsDiscussed && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <span className="text-sm font-medium">Bills Discussed:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedSegment.billIds.split(",").map((billId, idx) => 
                          billId.trim() && (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <Link to={`/bills/${billId.trim()}`} className="flex items-center">
                                {billId.trim()}
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Badge>
                          )
                        )}
                      </div>
                      <p className="text-sm mt-1">{selectedSegment.billsDiscussed}</p>
                    </div>
                  </div>
                )}
                
                {/* Keywords */}
                {selectedSegment.keyWords && selectedSegment.keyWords.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <span className="text-sm font-medium">Key Topics:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedSegment.keyWords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Summary */}
                {selectedSegment.summary && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <span className="text-sm font-medium">Summary:</span>
                      <p className="text-sm mt-1">{selectedSegment.summary}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-8">
            <p>Select a segment to view details</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default VideoSegmentDisplay;