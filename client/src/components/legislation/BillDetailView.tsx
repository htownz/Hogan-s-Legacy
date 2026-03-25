import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  FileText,
  ExternalLink,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Send,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowUpRight,
  Megaphone,
  Mail,
  History,
  Volume2
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { type Bill } from "./BillCard";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BillSummary from "./BillSummary";
import PointOfOrderAnalysis from "../bill-detail/point-of-order-analysis";
import LegislativeTimeline from "./LegislativeTimeline";
import BillTrackingAnimation from "./BillTrackingAnimation";
import Confetti from "./Confetti";
import { LegislativeContentNarrator } from "@/components/accessibility";
import SentimentVisualization from "../sentiment/SentimentVisualization";
import { QuickActionShortcuts } from "@/components/civic-actions";

interface BillDetailViewProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  isTracked?: boolean;
  onTrackToggle?: (billId: string, isTracked: boolean) => void;
}

export default function BillDetailView({ 
  bill, 
  isOpen, 
  onClose,
  isTracked = false,
  onTrackToggle 
}: BillDetailViewProps) {
  const [tracking, setTracking] = useState(isTracked);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showTrackAnimation, setShowTrackAnimation] = useState(false);
  const [showUntrackAnimation, setShowUntrackAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Update tracking state when isTracked prop changes
  useEffect(() => {
    setTracking(isTracked);
  }, [isTracked]);
  
  if (!bill) return null;
  
  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("introduced") || statusLower.includes("filed")) {
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    } else if (statusLower.includes("committee")) {
      return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
    } else if (statusLower.includes("passed") || statusLower.includes("enacted")) {
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    } else if (statusLower.includes("failed") || statusLower.includes("vetoed")) {
      return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    }
    return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  };
  
  const formatStatus = (status: string): string => {
    // Remove any trailing periods
    status = status.replace(/\.$/, "");
    
    // Convert to title case
    return status
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  
  const handleTrackToggle = async () => {
    if (!onTrackToggle) return;
    
    setIsLoading(true);
    
    try {
      // Call the parent component's track toggle handler
      await onTrackToggle(bill.id, !tracking);
      
      // Update local state
      setTracking(!tracking);
      
      // Show tracking animation and confetti
      if (!tracking) {
        setShowTrackAnimation(true);
        setShowConfetti(true);
        
        // Hide confetti after 3 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      } else {
        setShowUntrackAnimation(true);
      }
      
      // Show toast message
      toast({
        title: tracking ? "Bill untracked" : "Bill tracked",
        description: tracking 
          ? "You'll no longer receive updates about this bill." 
          : "You'll receive updates when this bill changes status.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tracking status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContactReps = () => {
    toast({
      title: "Contact feature coming soon",
      description: "This feature will be available in the next update.",
      variant: "default",
    });
  };
  
  const handleShareBill = () => {
    // Copy URL or generate shareable link
    const shareableLink = `${window.location.origin}/legislation/${bill.id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableLink);
    
    toast({
      title: "Link copied to clipboard",
      description: "Share this link with others to view this bill.",
      variant: "default",
    });
  };
  
  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    
    setSubmittingComment(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Comment submitted",
        description: "Your comment has been added to the discussion.",
        variant: "default",
      });
      
      setComment("");
      setSubmittingComment(false);
    }, 500);
  };

  return (
    <div className="relative">
      {/* Track/Untrack animations */}
      <BillTrackingAnimation 
        isActive={showTrackAnimation} 
        onComplete={() => setShowTrackAnimation(false)}
        type="track"
      />
      
      <BillTrackingAnimation 
        isActive={showUntrackAnimation} 
        onComplete={() => setShowUntrackAnimation(false)}
        type="untrack"
      />
      
      {/* Confetti animation */}
      <Confetti isActive={showConfetti} count={100} duration={3000} />
      
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold pr-8">
              Bill Detail + Impact Analysis
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-6 overflow-y-auto">
            {/* Bill Title + Status Indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">{bill.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(bill.status)}>
                    {formatStatus(bill.status)}
                  </Badge>
                  <span className="text-sm capitalize">{bill.chamber}</span>
                  <span className="text-sm">•</span>
                  <span className="text-sm flex items-center">
                    <CalendarDays size={14} className="mr-1" />
                    {bill.introducedAt ? 
                      (() => {
                        try {
                          return formatDate(new Date(bill.introducedAt));
                        } catch (e) {
                          console.error("Date formatting error:", e);
                          return "Date unavailable";
                        }
                      })() : 
                      "Date unavailable"}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{bill.description}</p>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {bill.topics.map((topic, index) => (
                    <Badge key={index} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
                
                {bill.hasOwnProperty('fullTextUrl') && (
                  <Button variant="link" className="p-0 h-auto mt-3" asChild>
                    <a href={(bill as any).fullTextUrl} target="_blank" rel="noreferrer noopener">
                      <FileText className="mr-1" size={16} />
                      View full bill text <ExternalLink size={14} className="ml-1" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {/* AI-Powered Bill Summary */}
            <BillSummary billId={bill.id} />
            
            {/* Advocate / Comment / Share */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Megaphone className="mr-2 text-primary" size={18} />
                  Advocate & Comment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant={tracking ? "default" : "outline"} 
                      className="gap-1"
                      onClick={handleTrackToggle}
                      disabled={isLoading}
                    >
                      {tracking ? <Bell size={16} /> : <Bell size={16} />}
                      {tracking ? "Tracking" : "Track Bill"}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="gap-1"
                      onClick={handleShareBill}
                    >
                      <Share2 size={16} />
                      Share
                    </Button>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    className="gap-1"
                    onClick={handleContactReps}
                  >
                    <Mail size={16} />
                    Contact Representatives
                  </Button>
                </div>
                
                <Separator />
                
                {/* Quick Civic Action Shortcuts */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Quick Civic Actions</h4>
                  <QuickActionShortcuts location="bill_detail" billId={bill.id} className="mb-2" />
                </div>
                
                <Separator className="my-3" />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Community Support</h4>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {(bill as any).communitySupportPct ? `${(bill as any).communitySupportPct}% support this bill` : "Not enough votes"}
                    </span>
                    <div className="flex gap-4">
                      <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                        <ThumbsUp size={14} />
                        Support
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                        <ThumbsDown size={14} />
                        Oppose
                      </Button>
                    </div>
                  </div>
                  <Progress value={(bill as any).communitySupportPct || 0} className="h-2" />
                </div>
                
                <div className="pt-3">
                  <h4 className="text-sm font-medium mb-2">Add Your Comment</h4>
                  <Textarea 
                    placeholder="Share your thoughts on this legislation..."
                    className="mb-2 min-h-[80px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitComment} 
                      disabled={!comment.trim() || submittingComment}
                      size="sm"
                    >
                      {submittingComment ? "Posting..." : "Post Comment"}
                      <Send size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Interactive Legislative Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center">
                  <History className="mr-2 text-blue-500" size={18} />
                  Interactive Legislative Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <LegislativeTimeline 
                  billId={bill.id} 
                  billNumber={bill.id}
                  billTitle={bill.title || 'Bill Title Unavailable'}
                  events={[
                    {
                      id: '1',
                      date: (() => {
                        try {
                          // Safely parse the date or use current date as fallback
                          return bill.introducedAt ? new Date(bill.introducedAt).toISOString() : new Date().toISOString();
                        } catch (e) {
                          console.error("Timeline date error:", e);
                          return new Date().toISOString();
                        }
                      })(),
                      title: 'Bill Filed',
                      description: `Bill was filed in the ${bill.chamber || 'legislature'}`,
                      eventType: 'introduction',
                      chamber: bill.chamber?.toLowerCase() as 'house' | 'senate' | 'governor' || 'house'
                    }
                  ]}
                />
              </CardContent>
            </Card>

            {/* Point of Order Analysis */}
            <PointOfOrderAnalysis billId={bill.id} />
            
            {/* Dynamic Civic Sentiment Visualization */}
            <SentimentVisualization billId={bill.id} />
            
            {/* Related Intel Feed + Updates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ArrowUpRight className="mr-2 text-purple-500" size={18} />
                  Related Intel Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-3">
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium">Committee Hearing Scheduled</h4>
                      <span className="text-xs text-muted-foreground">2 days ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">The Energy Committee has scheduled a hearing for this bill on May 15th at 10:00 AM.</p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium">New Supporting Organization</h4>
                      <span className="text-xs text-muted-foreground">1 week ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">The Texas Solar Industry Association has officially endorsed this legislation.</p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium">Amendment Proposed</h4>
                      <span className="text-xs text-muted-foreground">2 weeks ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Rep. Johnson has proposed an amendment to increase the rural exemption threshold.</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm">
                      View All Updates
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}