import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock, ThumbsUp, Check, X, RefreshCw, Shield, Users, Home, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface BillRecommendation {
  id: number;
  billId: string;
  score: number;
  reason: string;
  matchedInterests: string[];
  personalImpact: string;
  impactAreas: string[];
  familyImpact?: string;
  communityImpact?: string;
  viewed: boolean;
  saved: boolean;
  dismissed: boolean;
  bill: {
    id: string;
    title: string;
    description: string;
    status: string;
    introducedAt: string;
    lastActionAt: string;
    sponsors: string[];
    topics: string[];
  };
}

interface GenerateResponse {
  recommendations: BillRecommendation[];
  generated: number;
  message: string;
}

const PersonalizedBillRecommendations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);
  const [, setLocation] = useLocation();
  
  // Fetch recommendations with bill details
  const { data: recommendations, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['/api/recommendations'],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations?includeViewed=true&limit=20&includeDetails=true`);
      if (handleAuthError(response)) {
        setIsAuthError(true);
        throw new Error('Authentication required');
      }
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      return response.json() as Promise<BillRecommendation[]>;
    }
  });
  
  // Handle authentication errors
  const handleAuthError = (response: Response) => {
    if (response.status === 401) {
      setIsAuthError(true);
      toast({
        title: 'Authentication Required',
        description: 'Please log in to manage your recommendations.',
        variant: 'destructive',
      });
      return true;
    }
    return false;
  };

  // Generate new recommendations
  const generateRecommendations = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 5 }),
      });
      
      if (handleAuthError(response)) {
        setIsGenerating(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }
      
      const data = await response.json() as GenerateResponse;
      
      if (data.generated > 0) {
        toast({
          title: 'Success!',
          description: `Generated ${data.generated} new bill recommendations.`,
        });
        
        // Invalidate cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      } else {
        toast({
          title: 'No new recommendations',
          description: 'We couldn\'t find any new bills that match your interests.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate recommendations. Try setting your interests first.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Update recommendation status (viewed, saved, dismissed)
  const updateRecommendationStatus = async (id: number, status: { viewed?: boolean; saved?: boolean; dismissed?: boolean }) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status),
      });
      
      if (handleAuthError(response)) return;
      
      if (!response.ok) {
        throw new Error('Failed to update recommendation status');
      }
      
      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update recommendation status.',
        variant: 'destructive',
      });
    }
  };

  // Filter recommendations based on active tab
  const filteredRecommendations = recommendations ? recommendations.filter((rec: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'saved') return rec.saved;
    if (activeTab === 'new') return !rec.viewed;
    return true;
  }) : [];
  
  // Group recommendations by impact area
  const groupedRecommendations: Record<string, BillRecommendation[]> = {};
  
  filteredRecommendations.forEach((rec: any) => {
    if (rec.impactAreas && rec.impactAreas.length > 0) {
      const primaryArea = rec.impactAreas[0];
      if (!groupedRecommendations[primaryArea]) {
        groupedRecommendations[primaryArea] = [];
      }
      groupedRecommendations[primaryArea].push(rec);
    } else {
      if (!groupedRecommendations['Other']) {
        groupedRecommendations['Other'] = [];
      }
      groupedRecommendations['Other'].push(rec);
    }
  });

  // If authentication error, show login prompt
  if (isAuthError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-blue-500" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">You need to be logged in to view and manage your personalized bill recommendations.</p>
          <Button 
            onClick={() => setLocation('/auth/login')} 
            className="w-full"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Log In to Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle general errors
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Loading Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load personalized bill recommendations. Please try again later.</p>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              refetch();
            }} 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Personalized Bill Recommendations</CardTitle>
        <CardDescription>
          Bills selected just for you based on your interests and past activity
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Recommendations</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="m-0">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2 mt-3">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No recommendations found in this category.</p>
                <Button onClick={generateRecommendations} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Recommendations
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedRecommendations).map(([impactArea, recs]) => (
                  <div key={impactArea}>
                    <h3 className="text-lg font-semibold mb-3">{impactArea}</h3>
                    <div className="space-y-4">
                      {recs.map((recommendation) => (
                        <RecommendationCard 
                          key={recommendation.id} 
                          recommendation={recommendation}
                          onUpdateStatus={updateRecommendationStatus}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            refetch();
          }}
        >
          Refresh
        </Button>
        <Button onClick={generateRecommendations} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate New Recommendations
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

interface RecommendationCardProps {
  recommendation: BillRecommendation;
  onUpdateStatus: (id: number, status: { viewed?: boolean; saved?: boolean; dismissed?: boolean }) => Promise<void>;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onUpdateStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  
  // Mark as viewed when expanded
  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded && !recommendation.viewed) {
      onUpdateStatus(recommendation.id, { viewed: true });
    }
  };
  
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateStatus(recommendation.id, { saved: !recommendation.saved });
    toast({
      description: recommendation.saved 
        ? "Removed from saved bills" 
        : "Added to saved bills",
    });
  };
  
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateStatus(recommendation.id, { dismissed: true });
    toast({
      description: "Recommendation dismissed",
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // If dismissed and not in saved tab, don't show
  if (recommendation.dismissed && !recommendation.saved) {
    return null;
  }
  
  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${recommendation.viewed ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'}`}
      onClick={handleExpand}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium text-lg">
              {recommendation.bill.title}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>Introduced: {formatDate(recommendation.bill.introducedAt)}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant={recommendation.saved ? "default" : "outline"} 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleSave}
              title={recommendation.saved ? "Unsave" : "Save"}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            {!recommendation.dismissed && (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={handleDismiss}
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-1">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 mr-1">
            {recommendation.bill.status}
          </Badge>
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            Score: {Math.round(recommendation.score * 100)}%
          </Badge>
        </div>
        
        <div className="mt-3">
          <p className="text-sm text-gray-700">
            <strong>Why it matters:</strong> {recommendation.reason}
          </p>
        </div>
        
        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div>
              <div className="flex items-center mb-1">
                <Shield className="text-blue-500 h-4 w-4 mr-2" />
                <h4 className="font-medium">Personal Impact</h4>
              </div>
              <p className="text-sm text-gray-700 pl-6">{recommendation.personalImpact}</p>
            </div>
            
            {recommendation.familyImpact && (
              <div>
                <div className="flex items-center mb-1">
                  <Home className="text-green-500 h-4 w-4 mr-2" />
                  <h4 className="font-medium">Family Impact</h4>
                </div>
                <p className="text-sm text-gray-700 pl-6">{recommendation.familyImpact}</p>
              </div>
            )}
            
            {recommendation.communityImpact && (
              <div>
                <div className="flex items-center mb-1">
                  <Users className="text-purple-500 h-4 w-4 mr-2" />
                  <h4 className="font-medium">Community Impact</h4>
                </div>
                <p className="text-sm text-gray-700 pl-6">{recommendation.communityImpact}</p>
              </div>
            )}
            
            <div className="pt-2">
              <h4 className="font-medium mb-2">Bill Details</h4>
              <p className="text-sm text-gray-700 mb-2">{recommendation.bill.description}</p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {recommendation.bill.topics?.map((topic, i) => (
                  <Badge key={i} variant="outline" className="bg-gray-50">
                    {topic}
                  </Badge>
                ))}
              </div>
              
              {recommendation.bill.sponsors && recommendation.bill.sponsors.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Sponsors: </span>
                  <span className="text-xs">{recommendation.bill.sponsors.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PersonalizedBillRecommendations;