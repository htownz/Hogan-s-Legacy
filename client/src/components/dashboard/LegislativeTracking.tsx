// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Representative, RepResponse } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface LegislativeTrackingProps {
  representatives?: Representative[];
  userDistrict?: string;
  isLoading: boolean;
}

export default function LegislativeTracking({ representatives, userDistrict, isLoading }: LegislativeTrackingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [repResponses, setRepResponses] = useState<Record<number, RepResponse[]>>({});
  const [loadingRepResponses, setLoadingRepResponses] = useState<Record<number, boolean>>({});

  const fetchRepresentativeResponses = async (repId: number) => {
    if (repResponses[repId]) return; // Already fetched

    try {
      setLoadingRepResponses(prev => ({ ...prev, [repId]: true }));
      const response = await fetch(`/api/representatives/${repId}/responses`);
      if (!response.ok) {
        throw new Error('Failed to fetch representative responses');
      }
      const data: RepResponse[] = await response.json();
      setRepResponses(prev => ({ ...prev, [repId]: data }));
    } catch (error) {
      console.error('Error fetching representative responses:', error);
      toast({
        title: "Error",
        description: "Failed to load representative responses.",
        variant: "destructive",
      });
    } finally {
      setLoadingRepResponses(prev => ({ ...prev, [repId]: false }));
    }
  };

  const trackRepresentative = async (repId: number) => {
    try {
      await apiRequest('POST', `/api/representatives/${repId}/track`, {});
      
      toast({
        title: "Representative tracked",
        description: "You'll now receive updates about this representative.",
      });
      
      // Refresh representatives data
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track representative. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getResponseTimeClass = (days: number) => {
    if (days <= 3) return "text-secondary-600";
    if (days <= 7) return "text-secondary-600";
    if (days <= 14) return "text-amber-600";
    return "text-alert-600";
  };

  const getResponseRateClass = (rate?: number) => {
    if (!rate) return "bg-neutral-500";
    if (rate >= 80) return "bg-secondary-500";
    if (rate >= 60) return "bg-secondary-500";
    if (rate >= 40) return "bg-amber-500";
    return "bg-alert-500";
  };

  if (isLoading) {
    return (
      <Card className="shadow mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <Skeleton className="h-6 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="border-b border-neutral-200">
          <div className="flex px-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-32 mx-2" />
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-72 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-neutral-50 px-6 py-3 flex justify-between items-center">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow mb-8 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800">Your Representatives & Legislation</h2>
        <p className="text-sm text-neutral-500 mt-1">Track how your elected officials respond to constituents and key legislation</p>
      </div>
      
      <Tabs defaultValue="response">
        <div className="border-b border-neutral-200">
          <TabsList className="h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="response" 
              className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            >
              Response Timer
            </TabsTrigger>
            <TabsTrigger 
              value="truth" 
              className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            >
              Truth Index
            </TabsTrigger>
            <TabsTrigger 
              value="voting" 
              className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            >
              Voting History
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="response" className="pt-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-neutral-800">Response Timer Dashboard</h3>
              <div className="text-sm text-neutral-500">
                {userDistrict ? `Your District: ${userDistrict}` : 'Set your district in profile settings'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {representatives && representatives.slice(0, 3).map((rep) => (
                <div key={rep.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="p-4 flex items-center">
                    <Avatar className="h-16 w-16 mr-4">
                      <AvatarImage src={rep.imageUrl} alt={rep.name} />
                      <AvatarFallback>{rep.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-neutral-800 font-medium">{rep.name}</h4>
                      <p className="text-neutral-500 text-sm">{rep.title} {rep.party ? `(${rep.party})` : ''}</p>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4">
                    <div className="mb-4">
                      <div className="mb-1 flex justify-between">
                        <div className="text-sm font-medium text-neutral-700">Average Response Time</div>
                        <div className={`text-sm font-medium ${getResponseTimeClass(rep.averageResponseTime || 0)}`}>
                          {rep.averageResponseTime || 'N/A'} days
                        </div>
                      </div>
                      <Progress 
                        value={calculateResponseTimeScore(rep.averageResponseTime)} 
                        className="h-2"
                        indicatorClassName={getResponseRateClass(rep.responseRate)}
                      />
                      <div className="mt-1 text-xs text-neutral-500">
                        {rep.responseRate ? `Responds to ${rep.responseRate}% of constituent inquiries` : 'Response rate not available'}
                      </div>
                    </div>
                    
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-neutral-700 mb-2">Recent Responses</h5>
                      {loadingRepResponses[rep.id] ? (
                        <div className="space-y-2">
                          {[1, 2].map(i => (
                            <div key={i} className="space-y-1">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-3/4" />
                            </div>
                          ))}
                        </div>
                      ) : repResponses[rep.id] ? (
                        <ul className="space-y-2">
                          {repResponses[rep.id].slice(0, 2).map((response) => (
                            <li key={response.id} className="text-xs">
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-800">{response.topic}</span>
                                <span className={getResponseTimeClass(response.responseTime)}>
                                  {response.responseTime} days
                                </span>
                              </div>
                              <div className="text-neutral-500">{getResponseTypeLabel(response.responseType)}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-neutral-500 text-center py-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-primary-500 p-0 h-auto"
                            onClick={() => fetchRepresentativeResponses(rep.id)}
                          >
                            Load response data
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-3" 
                      variant="outline"
                      onClick={() => trackRepresentative(rep.id)}
                    >
                      Track This Official
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="truth" className="pt-0">
          <CardContent className="p-6 text-center">
            <h3 className="text-base font-medium text-neutral-800 mb-4">Truth Index - Coming Soon</h3>
            <p className="text-neutral-600 mb-4">
              The Truth Index will track how consistently your representatives' actions match their promises and statements.
            </p>
            <div className="bg-neutral-50 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-neutral-500 text-sm">
                <p>This feature is currently in development and will be available soon. The Truth Index will:</p>
                <ul className="list-disc text-left mt-3 ml-6 space-y-1">
                  <li>Compare voting records to campaign promises</li>
                  <li>Track public statement consistency</li>
                  <li>Provide objective measurements of follow-through</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="voting" className="pt-0">
          <CardContent className="p-6 text-center">
            <h3 className="text-base font-medium text-neutral-800 mb-4">Voting History - Coming Soon</h3>
            <p className="text-neutral-600 mb-4">
              Detailed voting records and analysis for your representatives will be available here.
            </p>
            <div className="bg-neutral-50 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-neutral-500 text-sm">
                <p>This feature is currently in development and will be available soon. The Voting History will:</p>
                <ul className="list-disc text-left mt-3 ml-6 space-y-1">
                  <li>Show all votes on key legislation</li>
                  <li>Categorize votes by issue area</li>
                  <li>Compare voting patterns to constituent feedback</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="bg-neutral-50 px-6 py-3 flex justify-between items-center">
        <div className="text-sm text-neutral-500">Last updated: {formatLastUpdated()}</div>
        <Button variant="link" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
          View All Representatives
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper functions
function calculateResponseTimeScore(days?: number): number {
  if (!days) return 0;
  
  // Scale: 0-3 days = 100%, 3-7 days = 80%, 7-14 days = 50%, 14+ days decreases linearly
  if (days <= 3) return 100;
  if (days <= 7) return 80;
  if (days <= 14) return 50;
  return Math.max(0, 50 - (days - 14) * 2); // Decreases by 2% for each day over 14
}

function getResponseTypeLabel(type: string): string {
  switch (type) {
    case 'form_letter': return 'Form letter response';
    case 'detailed': return 'Detailed explanation';
    case 'position_statement': return 'Position statement';
    case 'staff_response': return 'Response from staff';
    case 'personal': return 'Personal response';
    default: return type.replace(/_/g, ' ');
  }
}

function formatLastUpdated(): string {
  // Get current date in MM/DD/YYYY format
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
