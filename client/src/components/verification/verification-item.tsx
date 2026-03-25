import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Calendar, Clock, AlertTriangle, CheckCircle2, ThumbsUp, ThumbsDown, Link2, ExternalLink, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface VerificationItemProps {
  update: any;
  verificationLevel: number;
  verified?: boolean;
  showStatus?: boolean;
}

export function VerificationItem({ update, verificationLevel, verified = false, showStatus = false }: VerificationItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verificationData, setVerificationData] = useState({
    verificationStatus: "verified",
    verificationMethod: "source_check",
    verificationNotes: "",
    additionalSources: [] as string[]
  });
  const [newSource, setNewSource] = useState("");

  const addSource = () => {
    if (newSource && newSource.trim() !== "") {
      setVerificationData(prev => ({
        ...prev,
        additionalSources: [...prev.additionalSources, newSource]
      }));
      setNewSource("");
    }
  };

  const removeSource = (index: number) => {
    setVerificationData(prev => ({
      ...prev,
      additionalSources: prev.additionalSources.filter((_, i) => i !== index)
    }));
  };

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        `/api/verification/updates/${update.id}/verify`, 
        { method: "POST", data: verificationData }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification submitted",
        description: "Thank you for your contribution to the community verification system!",
      });
      setIsDialogOpen(false);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/verification/updates/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/verification/updates/verified'] });
      queryClient.invalidateQueries({ queryKey: ['/api/verification/updates/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/verification/me/credentials'] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Unable to submit verification. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = () => {
    switch (update.verificationStatus) {
      case "verified":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 cursor-default">Verified</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 cursor-default">Pending</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 cursor-default">Rejected</Badge>;
      case "needs_more_sources":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 cursor-default">Needs Sources</Badge>;
      default:
        return <Badge variant="outline">{update.verificationStatus}</Badge>;
    }
  };

  const getUpdateTypeBadge = () => {
    switch (update.updateType) {
      case "status_change":
        return <Badge variant="secondary" className="mr-2">Status Change</Badge>;
      case "text_change":
        return <Badge variant="secondary" className="mr-2">Text Change</Badge>;
      case "sponsor_change":
        return <Badge variant="secondary" className="mr-2">Sponsor Change</Badge>;
      case "scheduled_action":
        return <Badge variant="secondary" className="mr-2">Scheduled Action</Badge>;
      default:
        return <Badge variant="secondary" className="mr-2">{update.updateType.replace('_', ' ')}</Badge>;
    }
  };

  const getSourceTypeBadge = () => {
    switch (update.sourceType) {
      case "official":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 cursor-default">Official Source</Badge>;
      case "news":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 cursor-default">News Source</Badge>;
      case "community":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 cursor-default">Community Source</Badge>;
      default:
        return <Badge>{update.sourceType}</Badge>;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to verify this update.",
        variant: "destructive"
      });
      return;
    }
    
    verifyMutation.mutate();
  };

  const progressPercentage = Math.min(
    Math.round((update.verificationCount / update.verificationThreshold) * 100), 
    100
  );

  return (
    <Card className={verified ? "border-green-200" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{update.title}</CardTitle>
            <CardDescription>
              Bill ID: <Link to={`/bills/${update.billId}`} className="text-primary hover:underline">{update.billId}</Link>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showStatus && getStatusBadge()}
            {update.isProminent && 
              <Badge variant="destructive">Important</Badge>
            }
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {getUpdateTypeBadge()}
            {getSourceTypeBadge()}
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>{formatDate(update.submittedAt)}</span>
            </div>
          </div>
          
          <p className="mt-2">{update.content}</p>
          
          {update.sourceUrl && (
            <div className="flex items-center text-sm text-primary mt-2">
              <Link2 className="h-3.5 w-3.5 mr-1" />
              <a 
                href={update.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline truncate max-w-md"
              >
                {update.sourceUrl}
              </a>
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5 mr-1" />
            <span>Submitted by {update.submittedBy}</span>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Verification Progress</span>
              <span>{update.verificationCount}/{update.verificationThreshold}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {!verified && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!user} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Verify This Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Verify Legislative Update</DialogTitle>
                <DialogDescription>
                  Review the information and submit your verification.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                  <h3 className="font-medium">{update.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Bill ID: {update.billId}</p>
                  <p className="text-sm">{update.content}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="verification-status">Verification Status</Label>
                  <RadioGroup 
                    id="verification-status" 
                    value={verificationData.verificationStatus}
                    onValueChange={(value) => setVerificationData(prev => ({ ...prev, verificationStatus: value }))}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="verified" id="verified" />
                      <Label htmlFor="verified" className="flex items-center">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        Verified (accurate information)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rejected" id="rejected" />
                      <Label htmlFor="rejected" className="flex items-center">
                        <ThumbsDown className="mr-2 h-4 w-4 text-red-500" />
                        Rejected (inaccurate information)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="needs_more_sources" id="needs-more-sources" />
                      <Label htmlFor="needs-more-sources" className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                        Needs More Sources
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verification-method">Verification Method</Label>
                  <RadioGroup 
                    id="verification-method" 
                    value={verificationData.verificationMethod}
                    onValueChange={(value) => setVerificationData(prev => ({ ...prev, verificationMethod: value }))}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="source_check" id="source-check" />
                      <Label htmlFor="source-check">Source Check (verified source URL)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="official_document" id="official-document" />
                      <Label htmlFor="official-document">Official Document</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expert_verification" id="expert-verification" />
                      <Label htmlFor="expert-verification">Expert Verification</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="community_consensus" id="community-consensus" />
                      <Label htmlFor="community-consensus">Community Consensus</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verification-notes">Notes (Optional)</Label>
                  <Textarea 
                    id="verification-notes" 
                    placeholder="Add details about your verification or why this update is accurate/inaccurate"
                    value={verificationData.verificationNotes}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, verificationNotes: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Additional Sources (Optional)</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Add URL to supporting source" 
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={addSource}>Add</Button>
                  </div>
                  
                  {verificationData.additionalSources.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {verificationData.additionalSources.map((source, index) => (
                        <li key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                          <span className="truncate mr-2">{source}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeSource(index)} className="h-6 w-6 p-0">×</Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={verifyMutation.isPending} 
                    className="w-full"
                  >
                    {verifyMutation.isPending && (
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-foreground"></span>
                    )}
                    Submit Verification
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
        {verified && (
          <div className="w-full flex justify-between items-center">
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 cursor-default flex items-center">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Verified by {update.verificationCount} community members
            </Badge>
            <Link to={`/bills/${update.billId}`}>
              <Button variant="outline" size="sm">
                View Bill
              </Button>
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}