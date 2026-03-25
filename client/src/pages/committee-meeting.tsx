import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Video,
  Briefcase,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  Bot,
  Check,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { type CommitteeMeeting } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import VideoSegmentDisplay from "@/components/committees/VideoSegmentDisplay";

type SummaryData = {
  summary: string;
  keyPoints: Array<{
    title: string;
    description: string;
    timestamp?: string;
  }>;
  billDiscussions: Array<{
    billId: string;
    discussionSummary: string;
    keyPoints: string[];
    votes?: {
      for: number;
      against: number;
      abstain: number;
      result: string;
    };
  }>;
  publicTestimonies: Array<{
    speakerName?: string;
    organization?: string;
    position: 'for' | 'against' | 'neutral';
    summary: string;
    keyPoints: string[];
  }>;
  status: string;
  lastUpdated: string;
};

export default function CommitteeMeetingDetail() {
  const [, params] = useRoute("/committee-meetings/:id");
  const meetingId = params?.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");

  // Fetch meeting data
  const { data: meeting, isLoading } = useQuery<CommitteeMeeting & { committee: { name: string } }>({
    queryKey: [`/api/committee-meetings/${meetingId}`],
    enabled: !!meetingId,
  });

  // Fetch summary data if available
  const { 
    data: summaryData, 
    isLoading: summaryLoading, 
    isError: summaryError
  } = useQuery<SummaryData>({
    queryKey: [`/api/committee-meetings/${meetingId}/summary`],
    enabled: !!meetingId,
    retry: 1,
    // This query is allowed to fail if the summary doesn't exist
  });

  // For checking processing status
  const processingStatusQuery = useQuery<{ status: string, lastUpdated: string }>({
    queryKey: [`/api/committee-meetings/${meetingId}/process-status`],
    enabled: !!meetingId && !!meeting?.videoUrl,
    refetchInterval: (query) => {
      // Poll every 5 seconds if the status is 'pending' or 'processing'
      return query.state.data && (query.state.data.status === 'pending' || query.state.data.status === 'processing') ? 5000 : false;
    },
  });
  const processingStatus = processingStatusQuery.data;

  // Mutation for requesting video processing
  const processVideoMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/committee-meetings/${meetingId}/process-video`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({
        title: "Processing started",
        description: "The meeting video is now being processed. This may take a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/committee-meetings/${meetingId}/process-status`] });
    },
    onError: (error) => {
      toast({
        title: "Error starting processing",
        description: `Failed to start video processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Meeting Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The committee meeting you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/legislation">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Legislation
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Format date and time
  const meetingDate = new Date(meeting.date);
  const formattedDate = format(meetingDate, "MMMM d, yyyy");
  const formattedTime = format(meetingDate, "h:mm a");

  const getStatusBadgeProps = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return { variant: "outline" as const, text: "Scheduled" };
      case "in_progress":
        return { variant: "default" as const, text: "In Progress" };
      case "completed":
        return { variant: "secondary" as const, text: "Completed" };
      case "cancelled":
        return { variant: "destructive" as const, text: "Cancelled" };
      case "postponed":
        return { variant: "destructive" as const, text: "Postponed" };
      default:
        return { variant: "outline" as const, text: status };
    }
  };

  const statusProps = getStatusBadgeProps(meeting.status);

  // Determine the summary status UI
  let summaryStatus;
  if (processingStatus) {
    switch (processingStatus.status) {
      case "pending":
        summaryStatus = (
          <div className="flex items-center text-blue-500">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <span>Queued for processing</span>
          </div>
        );
        break;
      case "processing":
        summaryStatus = (
          <div className="flex items-center text-blue-500">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <span>Processing in progress</span>
          </div>
        );
        break;
      case "completed":
        summaryStatus = (
          <div className="flex items-center text-green-500">
            <Check className="h-4 w-4 mr-2" />
            <span>Processing complete</span>
          </div>
        );
        break;
      case "failed":
        summaryStatus = (
          <div className="flex items-center text-red-500">
            <XCircle className="h-4 w-4 mr-2" />
            <span>Processing failed</span>
          </div>
        );
        break;
      default:
        summaryStatus = null;
    }
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/legislation" className="text-muted-foreground hover:text-foreground flex items-center mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Legislation
        </Link>
        
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{meeting.committee.name}</h1>
            <p className="text-muted-foreground">{formattedDate} at {formattedTime}</p>
          </div>
          <Badge variant={statusProps.variant} className="text-sm">
            {statusProps.text}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span>{meeting.location}</span>
          </div>
          {meeting.billsDiscussed && meeting.billsDiscussed.length > 0 && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>{meeting.billsDiscussed.length} bill{meeting.billsDiscussed.length !== 1 ? 's' : ''} discussed</span>
            </div>
          )}
        </div>
        
        {meeting.agenda && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Agenda</h3>
            <p className="text-sm">{meeting.agenda}</p>
          </div>
        )}
        
        {meeting.videoUrl && (
          <div className="mt-4">
            <Button variant="outline" asChild className="gap-1.5">
              <a href={meeting.videoUrl} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4" />
                <span>Watch Video</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            <span>AI-Generated Meeting Summary</span>
          </h2>
          
          {meeting.videoUrl && !summaryData && !processingStatus?.status && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>
                  <Bot className="mr-2 h-4 w-4" />
                  Process Video
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Process committee meeting video?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will analyze the video to generate an AI summary of the meeting discussion, key points, and public testimonies.
                    The process may take a few minutes to complete.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => processVideoMutation.mutate()}
                    disabled={processVideoMutation.isPending}
                  >
                    {processVideoMutation.isPending ? 'Processing...' : 'Yes, process it'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {summaryStatus}
        </div>
        
        {summaryLoading && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
        
        {(processingStatus?.status === "pending" || processingStatus?.status === "processing") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Processing in Progress</CardTitle>
              <CardDescription>
                The AI is currently analyzing the meeting video. This may take a few minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center my-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Please check back in a few minutes. The summary will appear here once processing is complete.
              </p>
            </CardContent>
          </Card>
        )}
        
        {summaryError && !processingStatus?.status && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary Not Available</CardTitle>
              <CardDescription>
                This meeting has not been processed for AI summary yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Use the "Process Video" button above to generate an AI summary of this meeting.
              </p>
            </CardContent>
          </Card>
        )}
        
        {processingStatus?.status === "failed" && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                Processing Failed
              </CardTitle>
              <CardDescription>
                There was an error processing this meeting video.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                We encountered a problem while trying to analyze this meeting. You can try again by clicking the "Process Video" button above.
              </p>
              <Button onClick={() => processVideoMutation.mutate()} disabled={processVideoMutation.isPending}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {processVideoMutation.isPending ? 'Processing...' : 'Try Again'}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {(summaryData || meeting.status === "in_progress" || meeting.status === "completed") && (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {summaryData && (
                  <>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="keyPoints">Key Points</TabsTrigger>
                    <TabsTrigger value="billDiscussions">Bill Discussions</TabsTrigger>
                    <TabsTrigger value="testimonies">Public Testimonies</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="liveSegments">Live Segments</TabsTrigger>
              </TabsList>
              
              {summaryData && (
                <>
                  <TabsContent value="summary">
                    <Card>
                      <CardHeader>
                        <CardTitle>Executive Summary</CardTitle>
                        <CardDescription>
                          AI-generated summary of the committee meeting
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-line">{summaryData.summary}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="keyPoints">
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Points</CardTitle>
                        <CardDescription>
                          Important points discussed during the meeting
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {summaryData.keyPoints?.length === 0 ? (
                          <p className="text-muted-foreground">No key points were identified for this meeting.</p>
                        ) : (
                          <div className="space-y-6">
                            {summaryData.keyPoints?.map((point, index) => (
                              <div key={index} className="space-y-2">
                                <h3 className="font-medium flex items-center">
                                  {point.timestamp && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded mr-2 text-muted-foreground">
                                      {point.timestamp}
                                    </span>
                                  )}
                                  <span>{point.title}</span>
                                </h3>
                                <p className="text-sm">{point.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="billDiscussions">
                    <Card>
                      <CardHeader>
                        <CardTitle>Bill Discussions</CardTitle>
                        <CardDescription>
                          Details about bills discussed during the meeting
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!summaryData.billDiscussions || summaryData.billDiscussions.length === 0 ? (
                          <p className="text-muted-foreground">No specific bill discussions were identified.</p>
                        ) : (
                          <div className="space-y-8">
                            {summaryData.billDiscussions.map((bill, index) => (
                              <div key={index} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                                <h3 className="font-medium">
                                  <Link to={`/legislation/${bill.billId}`} className="text-primary hover:underline">
                                    {bill.billId}
                                  </Link>
                                </h3>
                                <p className="text-sm mb-3">{bill.discussionSummary}</p>
                                
                                {bill.keyPoints && bill.keyPoints.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Key Points:</h4>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                      {bill.keyPoints.map((point, idx) => (
                                        <li key={idx}>{point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {bill.votes && (
                                  <div className="mt-3 bg-muted p-3 rounded-md">
                                    <h4 className="text-sm font-medium mb-2">Vote Results:</h4>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      <div>
                                        <span className="block text-green-600 font-medium">For: {bill.votes.for}</span>
                                      </div>
                                      <div>
                                        <span className="block text-red-600 font-medium">Against: {bill.votes.against}</span>
                                      </div>
                                      <div>
                                        <span className="block text-muted-foreground font-medium">Abstain: {bill.votes.abstain}</span>
                                      </div>
                                    </div>
                                    <p className="mt-2 text-sm font-medium">
                                      Result: <span className={bill.votes.result === "Passed" ? "text-green-600" : "text-red-600"}>
                                        {bill.votes.result}
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="testimonies">
                    <Card>
                      <CardHeader>
                        <CardTitle>Public Testimonies</CardTitle>
                        <CardDescription>
                          Summaries of public testimony given during the meeting
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!summaryData.publicTestimonies || summaryData.publicTestimonies.length === 0 ? (
                          <p className="text-muted-foreground">No public testimonies were recorded during this meeting.</p>
                        ) : (
                          <div className="space-y-8">
                            {summaryData.publicTestimonies.map((testimony, index) => (
                              <div key={index} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h3 className="font-medium">
                                    {testimony.speakerName || "Anonymous Speaker"}
                                    {testimony.organization && (
                                      <span className="text-muted-foreground ml-2">
                                        ({testimony.organization})
                                      </span>
                                    )}
                                  </h3>
                                  <Badge variant={
                                    testimony.position === "for" ? "default" : 
                                    testimony.position === "against" ? "destructive" : 
                                    "outline"
                                  }>
                                    {testimony.position === "for" ? "For" : 
                                      testimony.position === "against" ? "Against" : 
                                      "Neutral"}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm">{testimony.summary}</p>
                                
                                {testimony.keyPoints && testimony.keyPoints.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Key Points:</h4>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                      {testimony.keyPoints.map((point, idx) => (
                                        <li key={idx}>{point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}
              
              <TabsContent value="liveSegments">
                <VideoSegmentDisplay meetingId={meetingId || ''} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}