import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shield, CheckCircle2, AlertTriangle, Clock, Info, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import { Link } from "wouter";

// Import VerificationItem component
import { VerificationItem } from "@/components/verification/verification-item";
import { SubmitUpdateForm } from "@/components/verification/submit-update-form";

export default function VerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch recent updates
  const { data: recentUpdates, isLoading: loadingRecent } = useQuery<any>({
    queryKey: ['/api/verification/updates/recent'],
    enabled: activeTab === "recent"
  });

  // Fetch pending updates
  const { data: pendingUpdates, isLoading: loadingPending } = useQuery<any>({
    queryKey: ['/api/verification/updates/pending'],
    enabled: activeTab === "pending"
  });

  // Fetch verified updates
  const { data: verifiedUpdates, isLoading: loadingVerified } = useQuery<any>({
    queryKey: ['/api/verification/updates/verified'],
    enabled: activeTab === "verified"
  });

  // Fetch user credentials
  const { data: credentials } = useQuery<any>({
    queryKey: ['/api/verification/me/credentials'],
    enabled: !!user
  });

  // Get current user verification level
  const getUserVerificationLevel = () => {
    if (!credentials || credentials.length === 0) return 1;
    
    // Find the highest verification level among credentials
    return Math.max(...credentials.map((cred: any) => cred.verificationLevel));
  };

  const verificationLevel = getUserVerificationLevel();

  // Handle loading states
  const isLoading = 
    (activeTab === "recent" && loadingRecent) || 
    (activeTab === "pending" && loadingPending) || 
    (activeTab === "verified" && loadingVerified);

  // Get updates based on active tab
  const getUpdates = () => {
    switch (activeTab) {
      case "recent":
        return recentUpdates || [];
      case "pending":
        return pendingUpdates || [];
      case "verified":
        return verifiedUpdates || [];
      default:
        return [];
    }
  };

  const updates = getUpdates();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Community Verification System</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Legislative Updates</CardTitle>
              <CardDescription>
                Help verify legislative updates to ensure accurate information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">
                    Pending <Badge variant="outline" className="ml-2">{pendingUpdates?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="verified">Verified</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : pendingUpdates?.length === 0 ? (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>No pending updates</AlertTitle>
                      <AlertDescription>
                        There are no legislative updates waiting to be verified at this time.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {updates.map((update: any) => (
                        <VerificationItem 
                          key={update.id} 
                          update={update} 
                          verificationLevel={verificationLevel}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="verified">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : verifiedUpdates?.length === 0 ? (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>No verified updates</AlertTitle>
                      <AlertDescription>
                        There are no verified legislative updates available yet.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {updates.map((update: any) => (
                        <VerificationItem 
                          key={update.id} 
                          update={update} 
                          verificationLevel={verificationLevel}
                          verified
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recent">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : recentUpdates?.length === 0 ? (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>No recent updates</AlertTitle>
                      <AlertDescription>
                        There are no recent legislative updates available.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {updates.map((update: any) => (
                        <VerificationItem 
                          key={update.id} 
                          update={update} 
                          verificationLevel={verificationLevel}
                          showStatus
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* User verification status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center">
                  <p className="mb-4">Sign in to participate in the verification process</p>
                  <Button asChild><Link to="/auth">Sign In</Link></Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center mb-4">
                    <Badge variant="outline" className="mr-2">Level {verificationLevel}</Badge>
                    <span className="font-medium">{getVerificationTitle(verificationLevel)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {credentials?.map((credential: any) => (
                      <div key={credential.credentialType} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{formatCredentialType(credential.credentialType)}</span>
                          <Badge>{credential.verificationCount} verifications</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Accuracy rate: {credential.accuracyRate}%
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Submit Update Card */}
          {user && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Submit a Legislative Update</CardTitle>
                <CardDescription>
                  Add a new legislative update for community verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubmitUpdateForm />
              </CardContent>
            </Card>
          )}
          
          {/* Verification Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Guide</CardTitle>
              <CardDescription>How community verification works</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Verify Updates</h4>
                    <p className="text-sm text-muted-foreground">Check sources, confirm accuracy, and cast your verification.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Flag Inaccuracies</h4>
                    <p className="text-sm text-muted-foreground">Identify and report incorrect information to maintain data integrity.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Threshold System</h4>
                    <p className="text-sm text-muted-foreground">Updates are verified when they reach the required number of verifications.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm" asChild>
                <a href="https://github.com/record-vote/act-up/wiki/community-verification" target="_blank" rel="noopener noreferrer">
                  Learn More <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getVerificationTitle(level: number) {
  switch(level) {
    case 1: return "Community Verifier";
    case 2: return "Advanced Verifier";
    case 3: return "Expert Verifier";
    case 4: return "Master Verifier";
    case 5: return "Trusted Authority";
    default: return "Community Verifier";
  }
}

function formatCredentialType(type: string) {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}