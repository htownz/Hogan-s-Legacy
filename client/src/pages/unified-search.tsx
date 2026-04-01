// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { debounce } from 'lodash';
import { Search, FileText, Users, Video, LayoutGrid, CalendarDays, Clock, User, Newspaper, Filter, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { CommitteeVideoSearch } from '@/components/committees/CommitteeVideoSearch';
import { sanitizeHtml } from '@/lib/sanitize';

// Type definition for search result hit highlighting
interface HighlightedText {
  original: string;
  highlighted: string;
}

// Helper function to highlight search terms in text
const highlightSearchTerm = (text: string, searchTerm: string): HighlightedText => {
  if (!searchTerm || !text) {
    return { original: text, highlighted: sanitizeHtml(text) };
  }
  
  try {
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const highlighted = sanitizeHtml(text).replace(regex, '<mark>$1</mark>');
    return { original: text, highlighted };
  } catch (e) {
    return { original: text, highlighted: sanitizeHtml(text) };
  }
};

export default function UnifiedSearchPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchSettings, setSearchSettings] = useState({
    useExactMatch: false,
    includePastSessions: true,
    prioritizeCurrentBills: true
  });
  
  // Generate a cache key based on search settings
  const cacheKey = useMemo(() => {
    return btoa(JSON.stringify(searchSettings));
  }, [searchSettings]);

  // Debounce search to avoid excessive API calls - 300ms is more responsive than 500ms
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };
  
  // Prefetch related queries when search is performed
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 2) {
      // Prefetch the next page of results
      queryClient.prefetchQuery({
        queryKey: ['/api/search/unified', { 
          query: debouncedQuery, 
          types: activeTab === 'all' ? 'all' : [activeTab], 
          limit: 10,
          page: 2,
          cacheKey
        }]
      });
      
      // If we're in 'all' tab, prefetch individual category tabs
      if (activeTab === 'all') {
        ['bills', 'videos', 'annotations', 'committees'].forEach(tab => {
          queryClient.prefetchQuery({
            queryKey: ['/api/search/unified', { 
              query: debouncedQuery, 
              types: [tab], 
              limit: 10,
              cacheKey
            }]
          });
        });
      }
    }
  }, [debouncedQuery, activeTab, queryClient, cacheKey]);

  // Fetch unified search results with optimized settings
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/search/unified', { 
      query: debouncedQuery, 
      types: activeTab === 'all' ? 'all' : [activeTab], 
      limit: 10,
      cacheKey
    }],
    enabled: !!debouncedQuery && debouncedQuery.length > 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep unused data in cache for 10 minutes
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Navigate to bill detail page
  const goToBillDetail = (billId: string) => {
    setLocation(`/legislation/${billId}`);
  };

  // Navigate to annotation detail
  const goToAnnotation = (billId: string, annotationId: number) => {
    setLocation(`/legislation/${billId}/annotations/${annotationId}`);
  };

  // Navigate to committee detail
  const goToCommittee = (committeeId: number) => {
    setLocation(`/committees/${committeeId}`);
  };

  // Navigate to committee meeting detail
  const goToCommitteeMeeting = (meetingId: number) => {
    setLocation(`/committee-meetings/${meetingId}`);
  };

  // Get the count for a particular result type
  const getResultCount = (type: string) => {
    if (!data?.metadata?.counts) return 0;
    return data.metadata.counts[type] || 0;
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Search</h1>
          <p className="text-muted-foreground mt-2">
            Search across legislation, committee videos, and more.
          </p>
        </div>

        <div className="space-y-2">
          <div className="relative flex">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for bills, committee videos, annotations..."
              className="pl-10 py-6 text-lg flex-1"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && searchQuery && debouncedSearch(searchQuery)}
            />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="ml-2 flex items-center" aria-label="Search Settings">
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Search Settings</h4>
                  <Separator />
                  
                  <div className="flex items-center justify-between space-y-2">
                    <Label htmlFor="exact-match">Use exact match</Label>
                    <Switch 
                      id="exact-match" 
                      checked={searchSettings.useExactMatch}
                      onCheckedChange={(checked) => setSearchSettings({
                        ...searchSettings,
                        useExactMatch: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-y-2">
                    <Label htmlFor="past-sessions">Include past sessions</Label>
                    <Switch 
                      id="past-sessions" 
                      checked={searchSettings.includePastSessions}
                      onCheckedChange={(checked) => setSearchSettings({
                        ...searchSettings,
                        includePastSessions: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-y-2">
                    <Label htmlFor="prioritize-current">Prioritize current bills</Label>
                    <Switch 
                      id="prioritize-current" 
                      checked={searchSettings.prioritizeCurrentBills}
                      onCheckedChange={(checked) => setSearchSettings({
                        ...searchSettings,
                        prioritizeCurrentBills: checked
                      })}
                    />
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      debouncedSearch(searchQuery); // Re-run search with new settings
                    }}
                  >
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {searchSettings.useExactMatch && (
            <p className="text-xs text-muted-foreground flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Exact match is enabled
            </p>
          )}
          {!searchSettings.includePastSessions && (
            <p className="text-xs text-muted-foreground flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Only searching current session
            </p>
          )}
        </div>

        {debouncedQuery.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all" className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-2" />
                All Results
                {data && <Badge variant="secondary" className="ml-2">{Object.values(data.metadata.counts).reduce((acc, count) => acc + count, 0)}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="bills" className="flex items-center">
                <Newspaper className="h-4 w-4 mr-2" />
                Bills
                {data && <Badge variant="secondary" className="ml-2">{getResultCount('bills')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center">
                <Video className="h-4 w-4 mr-2" />
                Committee Videos
                {data && <Badge variant="secondary" className="ml-2">{getResultCount('videos')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="annotations" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Annotations
                {data && <Badge variant="secondary" className="ml-2">{getResultCount('annotations')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="committees" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Committees
                {data && <Badge variant="secondary" className="ml-2">{getResultCount('committees')}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/4 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>There was an error loading the search results. Please try again later.</p>
                  </CardContent>
                </Card>
              ) : data && Object.values(data.results).reduce((acc, arr) => acc + (arr as any[]).length, 0) === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Results Found</CardTitle>
                    <CardDescription>
                      Try adjusting your search terms to find what you're looking for.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <>
                  {data?.results.bills && data.results.bills.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Newspaper className="h-5 w-5 mr-2 text-primary" />
                        Bills
                      </h2>
                      <div className="grid gap-4 grid-cols-1">
                        {data.results.bills.slice(0, 3).map((bill: any) => {
                          // Highlight matching text in bill title
                          const titleHighlight = highlightSearchTerm(bill.title, debouncedQuery);
                          
                          return (
                            <Card key={bill.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => goToBillDetail(bill.id)}>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between">
                                  <CardTitle className="text-lg">{bill.id}</CardTitle>
                                  <div className="flex gap-2 items-center">
                                    {bill.policy_difficulty && (
                                      <Badge variant="outline" className={`
                                        ${bill.policy_difficulty <= 2 ? 'bg-green-100 text-green-800' : 
                                          bill.policy_difficulty === 3 ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-red-100 text-red-800'}
                                      `}>
                                        Policy: {['Easy', 'Moderate', 'Complex', 'Very Complex', 'Expert'][bill.policy_difficulty - 1]}
                                      </Badge>
                                    )}
                                    <Badge>{bill.status}</Badge>
                                  </div>
                                </div>
                                <CardDescription>{bill.chamber === 'house' ? 'House' : 'Senate'} Bill</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p dangerouslySetInnerHTML={{ __html: titleHighlight.highlighted }}></p>
                                {bill.relevance && (
                                  <div className="mt-2 text-xs flex items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      Relevance Score: {(bill.relevance * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      {data.results.bills.length > 3 && (
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab('bills')}>
                          See all {data.results.bills.length} bills
                        </Button>
                      )}
                    </div>
                  )}

                  {data?.results.videos && data.results.videos.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Video className="h-5 w-5 mr-2 text-primary" />
                        Committee Videos
                      </h2>
                      <div className="grid gap-4 grid-cols-1">
                        {data.results.videos.slice(0, 3).map((video: any) => {
                          // Highlight matching text in video transcript
                          const transcriptHighlight = highlightSearchTerm(video.transcript, debouncedQuery);
                          
                          return (
                            <Card key={video.id} className="cursor-pointer hover:bg-accent/50 transition-colors" 
                              onClick={() => window.open(video.videoUrl, '_blank')}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{video.meetingTitle || 'Committee Meeting'}</CardTitle>
                                <CardDescription className="flex items-center flex-wrap">
                                  <span className="flex items-center mr-2">
                                    <CalendarDays className="h-4 w-4 mr-1" />
                                    {formatDate(video.meetingDate || new Date())}
                                  </span>
                                  <span className="flex items-center mr-2">
                                    <User className="h-4 w-4 mr-1" />
                                    {video.speakerName || 'Unknown Speaker'}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {Math.floor(video.startTime / 60)}:{(video.startTime % 60).toString().padStart(2, '0')}
                                  </span>
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="line-clamp-2" dangerouslySetInnerHTML={{ __html: transcriptHighlight.highlighted }}></div>
                                {video.relevance && (
                                  <div className="mt-2 text-xs flex items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      Relevance Score: {(video.relevance * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      {data.results.videos.length > 3 && (
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab('videos')}>
                          See all {data.results.videos.length} video segments
                        </Button>
                      )}
                    </div>
                  )}

                  {data?.results.annotations && data.results.annotations.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        Annotations
                      </h2>
                      <div className="grid gap-4 grid-cols-1">
                        {data.results.annotations.slice(0, 3).map((annotation: any) => {
                          // Highlight matching text in annotation text
                          const textHighlight = highlightSearchTerm(annotation.text, debouncedQuery);
                          
                          return (
                            <Card key={annotation.id} className="cursor-pointer hover:bg-accent/50 transition-colors" 
                              onClick={() => goToAnnotation(annotation.billId, annotation.id)}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Annotation on {annotation.billId}</CardTitle>
                                <CardDescription>Section: {annotation.sectionReference || 'General'}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: textHighlight.highlighted }}></div>
                                {annotation.relevance && (
                                  <div className="mt-2 text-xs flex items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      Relevance Score: {(annotation.relevance * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      {data.results.annotations.length > 3 && (
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab('annotations')}>
                          See all {data.results.annotations.length} annotations
                        </Button>
                      )}
                    </div>
                  )}

                  {data?.results.committees && data.results.committees.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Users className="h-5 w-5 mr-2 text-primary" />
                        Committees
                      </h2>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {data.results.committees.slice(0, 4).map((committee: any) => {
                          // Highlight matching text in committee name and description
                          const nameHighlight = highlightSearchTerm(committee.name, debouncedQuery);
                          const descHighlight = committee.description 
                            ? highlightSearchTerm(committee.description, debouncedQuery)
                            : { original: '', highlighted: '' };
                          
                          return (
                            <Card key={committee.id} className="cursor-pointer hover:bg-accent/50 transition-colors" 
                              onClick={() => goToCommittee(committee.id)}>
                              <CardHeader>
                                <CardTitle dangerouslySetInnerHTML={{ __html: nameHighlight.highlighted }}></CardTitle>
                              </CardHeader>
                              {committee.description && (
                                <CardContent>
                                  <div className="line-clamp-2" dangerouslySetInnerHTML={{ __html: descHighlight.highlighted }}></div>
                                </CardContent>
                              )}
                              {committee.relevance && (
                                <CardFooter className="pt-0">
                                  <Badge variant="secondary" className="text-xs">
                                    Relevance Score: {(committee.relevance * 100).toFixed(0)}%
                                  </Badge>
                                </CardFooter>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                      {data.results.committees.length > 4 && (
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab('committees')}>
                          See all {data.results.committees.length} committees
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="bills">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                  ))}
                </div>
              ) : data?.results.bills && data.results.bills.length > 0 ? (
                <div className="space-y-4">
                  {data.results.bills.map((bill: any) => {
                    // Highlight matching text in bill title and description
                    const titleHighlight = highlightSearchTerm(bill.title, debouncedQuery);
                    const descHighlight = bill.description 
                      ? highlightSearchTerm(bill.description, debouncedQuery)
                      : { original: '', highlighted: '' };
                    
                    return (
                      <Card key={bill.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => goToBillDetail(bill.id)}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-lg">{bill.id}</CardTitle>
                            <div className="flex gap-2 items-center">
                              {bill.policy_difficulty && (
                                <Badge variant="outline" className={`
                                  ${bill.policy_difficulty <= 2 ? 'bg-green-100 text-green-800' : 
                                    bill.policy_difficulty === 3 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'}
                                `}>
                                  Policy: {['Easy', 'Moderate', 'Complex', 'Very Complex', 'Expert'][bill.policy_difficulty - 1]}
                                </Badge>
                              )}
                              {bill.engagement_difficulty && (
                                <Badge variant="outline" className={`
                                  ${bill.engagement_difficulty <= 2 ? 'bg-green-100 text-green-800' : 
                                    bill.engagement_difficulty === 3 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'}
                                `}>
                                  Engagement: {['Easy', 'Moderate', 'Complex', 'Very Complex', 'Expert'][bill.engagement_difficulty - 1]}
                                </Badge>
                              )}
                              <Badge>{bill.status}</Badge>
                            </div>
                          </div>
                          <CardDescription>{bill.chamber === 'house' ? 'House' : 'Senate'} Bill</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div dangerouslySetInnerHTML={{ __html: titleHighlight.highlighted }}></div>
                          {bill.description && (
                            <div className="text-sm text-muted-foreground mt-2" 
                              dangerouslySetInnerHTML={{ __html: descHighlight.highlighted }}>
                            </div>
                          )}
                          {bill.relevance && (
                            <div className="mt-2 text-xs flex items-center">
                              <Badge variant="secondary" className="text-xs">
                                Relevance Score: {(bill.relevance * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Bills Found</CardTitle>
                    <CardDescription>
                      Try adjusting your search terms to find bills.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="videos">
              <CommitteeVideoSearch />
            </TabsContent>

            <TabsContent value="annotations">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                  ))}
                </div>
              ) : data?.results.annotations && data.results.annotations.length > 0 ? (
                <div className="space-y-4">
                  {data.results.annotations.map((annotation: any) => {
                    // Highlight matching text in annotation text
                    const textHighlight = highlightSearchTerm(annotation.text, debouncedQuery);
                    
                    return (
                      <Card key={annotation.id} className="cursor-pointer hover:bg-accent/50 transition-colors" 
                        onClick={() => goToAnnotation(annotation.billId, annotation.id)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Annotation on {annotation.billId}</CardTitle>
                          <CardDescription>Section: {annotation.sectionReference || 'General'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div dangerouslySetInnerHTML={{ __html: textHighlight.highlighted }}></div>
                          {annotation.relevance && (
                            <div className="mt-2 text-xs flex items-center">
                              <Badge variant="secondary" className="text-xs">
                                Relevance Score: {(annotation.relevance * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Annotations Found</CardTitle>
                    <CardDescription>
                      Try adjusting your search terms to find annotations.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="committees">
              {isLoading ? (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                  ))}
                </div>
              ) : data?.results.committees && data.results.committees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.results.committees.map((committee: any) => {
                    // Highlight matching text in committee name and description
                    const nameHighlight = highlightSearchTerm(committee.name, debouncedQuery);
                    const descHighlight = committee.description 
                      ? highlightSearchTerm(committee.description, debouncedQuery)
                      : { original: '', highlighted: '' };
                    
                    return (
                      <Card key={committee.id} className="cursor-pointer hover:bg-accent/50 transition-colors" 
                        onClick={() => goToCommittee(committee.id)}>
                        <CardHeader>
                          <CardTitle dangerouslySetInnerHTML={{ __html: nameHighlight.highlighted }}></CardTitle>
                        </CardHeader>
                        {committee.description && (
                          <CardContent>
                            <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: descHighlight.highlighted }}></div>
                          </CardContent>
                        )}
                        {committee.relevance && (
                          <CardFooter className="pt-0">
                            <Badge variant="secondary" className="text-xs">
                              Relevance Score: {(committee.relevance * 100).toFixed(0)}%
                            </Badge>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Committees Found</CardTitle>
                    <CardDescription>
                      Try adjusting your search terms to find committees.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Tips</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Find Bills</h3>
                  <p className="text-sm">Search for bills by ID, title, or topics (e.g., "education funding", "TX-HB100")</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Find Committee Videos</h3>
                  <p className="text-sm">Search for specific discussions, testimony, or bill mentions in committee videos</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Find Annotations</h3>
                  <p className="text-sm">Search community annotations and comments on specific bill sections</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Find Committees</h3>
                  <p className="text-sm">Search for legislative committees by name or description</p>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-semibold mb-4">Popular Searches</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setSearchQuery("education")}>Education</Button>
                <Button variant="outline" onClick={() => setSearchQuery("healthcare")}>Healthcare</Button>
                <Button variant="outline" onClick={() => setSearchQuery("property tax")}>Property Tax</Button>
                <Button variant="outline" onClick={() => setSearchQuery("border security")}>Border Security</Button>
                <Button variant="outline" onClick={() => setSearchQuery("water rights")}>Water Rights</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}