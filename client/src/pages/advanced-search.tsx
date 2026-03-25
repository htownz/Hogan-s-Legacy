import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { debounce } from 'lodash';
import { 
  Search, FileText, Users, Video, LayoutGrid, CalendarDays, 
  Clock, User, Newspaper, Filter, SlidersHorizontal, X, ChevronDown,
  ChevronUp, Download, Save, Share
} from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { apiRequest } from '@/lib/api';

// Type definition for search result hit highlighting
interface HighlightedText {
  original: string;
  highlighted: string;
}

// Helper function to highlight search terms in text
const highlightSearchTerm = (text: string, searchTerm: string): HighlightedText => {
  if (!searchTerm || !text) {
    return { original: text, highlighted: text };
  }
  
  try {
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const highlighted = text.replace(regex, '<mark>$1</mark>');
    return { original: text, highlighted };
  } catch (e) {
    return { original: text, highlighted: text };
  }
};

// Interface for advanced search filters
interface AdvancedSearchFilters {
  searchIn: string[];
  chambers: string[];
  status: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  topics: string[];
  sponsors: string[];
  sortBy: string;
  sortOrder: string;
  searchType: string;
  excludeTerms: string[];
  exactPhrases: string[];
  session: string;
}

export default function AdvancedSearchPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('bills');
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced search filters with defaults
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    searchIn: ['title', 'description', 'fullText'],
    chambers: ['house', 'senate'],
    status: [],
    dateRange: {
      start: null,
      end: null,
    },
    topics: [],
    sponsors: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
    searchType: 'keyword',
    excludeTerms: [],
    exactPhrases: [],
    session: '89R'
  });

  // Generate a search key based on all search parameters for caching
  const searchKey = useMemo(() => {
    return btoa(JSON.stringify({
      query: debouncedQuery,
      filters,
      tab: activeTab
    }));
  }, [debouncedQuery, filters, activeTab]);

  // Debounce search to avoid excessive API calls
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

  // Add an exclude term
  const addExcludeTerm = () => {
    const term = prompt("Enter a term to exclude:");
    if (term) {
      setFilters({
        ...filters,
        excludeTerms: [...filters.excludeTerms, term]
      });
    }
  };

  // Remove an exclude term
  const removeExcludeTerm = (index: number) => {
    setFilters({
      ...filters,
      excludeTerms: filters.excludeTerms.filter((_, i) => i !== index)
    });
  };

  // Add an exact phrase
  const addExactPhrase = () => {
    const phrase = prompt("Enter an exact phrase to search for:");
    if (phrase) {
      setFilters({
        ...filters,
        exactPhrases: [...filters.exactPhrases, phrase]
      });
    }
  };

  // Remove an exact phrase
  const removeExactPhrase = (index: number) => {
    setFilters({
      ...filters,
      exactPhrases: filters.exactPhrases.filter((_, i) => i !== index)
    });
  };

  // Reset all filters to defaults
  const resetFilters = () => {
    setFilters({
      searchIn: ['title', 'description', 'fullText'],
      chambers: ['house', 'senate'],
      status: [],
      dateRange: {
        start: null,
        end: null,
      },
      topics: [],
      sponsors: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      searchType: 'keyword',
      excludeTerms: [],
      exactPhrases: [],
      session: '89R'
    });
  };

  // Prepare query parameters for API request
  const prepareQueryParams = () => {
    // Build parameters
    const params: any = {
      query: debouncedQuery,
      type: activeTab,
      searchIn: filters.searchIn.join(','),
      chambers: filters.chambers.join(','),
      status: filters.status.join(','),
      dateRange: JSON.stringify(filters.dateRange),
      topics: filters.topics.join(','),
      sponsors: filters.sponsors.join(','),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      searchType: filters.searchType,
      excludeTerms: filters.excludeTerms.length ? filters.excludeTerms.join(',') : undefined,
      exactPhrases: filters.exactPhrases.length ? filters.exactPhrases.join(',') : undefined,
      session: filters.session
    };

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
    );
  };

  // Define the search result interface
interface SearchResultItem {
  id: string;
  title: string;
  status: string;
  chamber: string;
  introducedAt: string;
  lastAction?: string;
  sponsors?: string[];
  description?: string;
  relevance?: number;
  policy_difficulty?: number;
  engagement_difficulty?: number;
  sentiment_score?: number;
}

interface SearchResponse {
  results: SearchResultItem[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

// Fetch search results
const { data, isLoading, error } = useQuery<SearchResponse>({
  queryKey: ['/api/search/bills', prepareQueryParams(), searchKey],
  enabled: !!debouncedQuery && debouncedQuery.length > 1,
  refetchOnWindowFocus: false
});

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Go to bill detail
  const goToBillDetail = (billId: string) => {
    setLocation(`/legislation/${billId}`);
  };

  // Export search results as CSV
  const exportAsCsv = () => {
    if (!data?.results || data.results.length === 0) return;

    // Define headers
    const headers = [
      'Bill ID', 'Title', 'Status', 'Chamber',
      'Introduced', 'Last Action', 'Sponsors'
    ];

    // Format rows
    const rows = data.results.map((bill: SearchResultItem) => [
      bill.id,
      bill.title,
      bill.status,
      bill.chamber,
      formatDate(bill.introducedAt),
      bill.lastAction || 'N/A',
      bill.sponsors?.join(', ') || 'None'
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'search-results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
            <p className="text-muted-foreground mt-1">
              Use powerful filters to find exactly what you're looking for
            </p>
          </div>
          
          <div className="flex gap-2">
            {data?.results && data.results.length > 0 && (
              <Button variant="outline" onClick={exportAsCsv} className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative flex">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Enter search terms..."
              className="pl-10 py-6 text-lg"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && searchQuery && debouncedSearch(searchQuery)}
            />
            
            <Button 
              variant={showFilters ? "default" : "outline"} 
              className="ml-2" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Applied filters display */}
          {(filters.chambers.length < 2 || 
            filters.status.length > 0 || 
            filters.excludeTerms.length > 0 || 
            filters.exactPhrases.length > 0) && (
            <div className="flex flex-wrap gap-2 py-2">
              {filters.chambers.length < 2 && (
                <Badge variant="secondary" className="flex items-center">
                  {filters.chambers[0] === 'house' ? 'House' : 'Senate'} only
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setFilters({...filters, chambers: ['house', 'senate']})}
                  />
                </Badge>
              )}
              
              {filters.status.map(status => (
                <Badge key={status} variant="secondary" className="flex items-center">
                  Status: {status}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setFilters({
                      ...filters, 
                      status: filters.status.filter(s => s !== status)
                    })}
                  />
                </Badge>
              ))}
              
              {filters.exactPhrases.map((phrase, index) => (
                <Badge key={index} variant="secondary" className="flex items-center">
                  "{phrase}"
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => removeExactPhrase(index)}
                  />
                </Badge>
              ))}
              
              {filters.excludeTerms.map((term, index) => (
                <Badge key={index} variant="secondary" className="flex items-center">
                  NOT: {term}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => removeExcludeTerm(index)}
                  />
                </Badge>
              ))}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs" 
                onClick={resetFilters}
              >
                Reset All
              </Button>
            </div>
          )}
          
          {/* Advanced filters panel */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Search parameters */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Search Parameters</h3>
                    
                    <div className="space-y-2">
                      <Label>Search Type</Label>
                      <Select 
                        value={filters.searchType} 
                        onValueChange={(value) => setFilters({...filters, searchType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Search Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">Keyword Search</SelectItem>
                          <SelectItem value="semantic">Semantic Search</SelectItem>
                          <SelectItem value="boolean">Boolean Search</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Search In</Label>
                      <div className="flex flex-col space-y-2">
                        {[
                          {value: 'title', label: 'Title'},
                          {value: 'description', label: 'Description'},
                          {value: 'fullText', label: 'Full Text'},
                          {value: 'sponsors', label: 'Sponsors'},
                          {value: 'annotations', label: 'Annotations'}
                        ].map(option => (
                          <div className="flex items-center space-x-2" key={option.value}>
                            <Checkbox 
                              id={`search-in-${option.value}`} 
                              checked={filters.searchIn.includes(option.value)} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({
                                    ...filters, 
                                    searchIn: [...filters.searchIn, option.value]
                                  });
                                } else {
                                  setFilters({
                                    ...filters, 
                                    searchIn: filters.searchIn.filter(item => item !== option.value)
                                  });
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`search-in-${option.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label>Exact Phrases</Label>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={addExactPhrase}
                        >
                          Add
                        </Button>
                      </div>
                      {filters.exactPhrases.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No exact phrases added</p>
                      ) : (
                        <div className="space-y-1">
                          {filters.exactPhrases.map((phrase, index) => (
                            <div key={index} className="flex items-center justify-between bg-accent/50 p-2 rounded">
                              <span className="text-sm">"{phrase}"</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0" 
                                onClick={() => removeExactPhrase(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label>Exclude Terms</Label>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={addExcludeTerm}
                        >
                          Add
                        </Button>
                      </div>
                      {filters.excludeTerms.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No exclusions added</p>
                      ) : (
                        <div className="space-y-1">
                          {filters.excludeTerms.map((term, index) => (
                            <div key={index} className="flex items-center justify-between bg-accent/50 p-2 rounded">
                              <span className="text-sm">NOT "{term}"</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0" 
                                onClick={() => removeExcludeTerm(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content filters */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Content Filters</h3>
                    
                    <div className="space-y-2">
                      <Label>Chamber</Label>
                      <div className="flex flex-col space-y-2">
                        {[
                          {value: 'house', label: 'House'},
                          {value: 'senate', label: 'Senate'}
                        ].map(option => (
                          <div className="flex items-center space-x-2" key={option.value}>
                            <Checkbox 
                              id={`chamber-${option.value}`} 
                              checked={filters.chambers.includes(option.value)} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({
                                    ...filters, 
                                    chambers: [...filters.chambers, option.value]
                                  });
                                } else {
                                  setFilters({
                                    ...filters, 
                                    chambers: filters.chambers.filter(item => item !== option.value)
                                  });
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`chamber-${option.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Bill Status</Label>
                      <Select 
                        value={filters.status.length > 0 ? filters.status[0] : ''}
                        onValueChange={(value) => {
                          if (value) {
                            setFilters({...filters, status: [value]});
                          } else {
                            setFilters({...filters, status: []});
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any Status</SelectItem>
                          <SelectItem value="Filed">Filed</SelectItem>
                          <SelectItem value="In Committee">In Committee</SelectItem>
                          <SelectItem value="Passed Committee">Passed Committee</SelectItem>
                          <SelectItem value="On Floor Calendar">On Floor Calendar</SelectItem>
                          <SelectItem value="Passed Chamber">Passed Chamber</SelectItem>
                          <SelectItem value="Sent to Governor">Sent to Governor</SelectItem>
                          <SelectItem value="Signed">Signed</SelectItem>
                          <SelectItem value="Vetoed">Vetoed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Legislative Session</Label>
                      <Select 
                        value={filters.session}
                        onValueChange={(value) => setFilters({...filters, session: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="89R">89th Session (Current)</SelectItem>
                          <SelectItem value="88R">88th Session</SelectItem>
                          <SelectItem value="87R">87th Session</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Sort filters */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Sorting</h3>
                    
                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select 
                        value={filters.sortBy}
                        onValueChange={(value) => setFilters({...filters, sortBy: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="lastActionAt">Last Action Date</SelectItem>
                          <SelectItem value="introducedAt">Introduction Date</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Select 
                        value={filters.sortOrder}
                        onValueChange={(value) => setFilters({...filters, sortOrder: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Descending</SelectItem>
                          <SelectItem value="asc">Ascending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => debouncedSearch(searchQuery)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t flex justify-between">
                  <Button variant="outline" onClick={resetFilters}>Reset All Filters</Button>
                  <Button 
                    variant="default" 
                    onClick={() => setShowFilters(false)}
                  >
                    Close Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search results */}
        <div className="space-y-4">
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
          ) : data?.results?.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Results Found</CardTitle>
                <CardDescription>
                  Try adjusting your search terms or filters to find what you're looking for.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : data?.results ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {data.results.length} of {data.pagination?.total || data.results.length} results
                </p>
              </div>
              
              <div className="grid gap-4 grid-cols-1">
                {data.results.map((bill: SearchResultItem) => {
                  // Highlight matching text in bill title
                  const titleHighlight = highlightSearchTerm(bill.title, debouncedQuery);
                  
                  return (
                    <Card 
                      key={bill.id} 
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => goToBillDetail(bill.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {bill.id}
                              {bill.sentiment_score !== undefined && (
                                <Badge 
                                  className={`ml-2 ${
                                    bill.sentiment_score > 20 ? 'bg-green-100 text-green-800' : 
                                    bill.sentiment_score < -20 ? 'bg-red-100 text-red-800' : 
                                    'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {bill.sentiment_score > 20 ? 'Positive' : 
                                   bill.sentiment_score < -20 ? 'Negative' : 'Neutral'}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center">
                              {bill.chamber === 'house' ? 'House' : 'Senate'} Bill
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <CalendarDays className="h-3 w-3 mr-1" />
                                {formatDate(bill.introducedAt)}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 items-center">
                            {bill.policy_difficulty !== undefined && (
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
                      </CardHeader>
                      <CardContent>
                        <p 
                          className="text-lg"
                          dangerouslySetInnerHTML={{ __html: titleHighlight.highlighted }}
                        ></p>
                        
                        {bill.description && (
                          <p className="mt-2 text-muted-foreground">
                            {bill.description.length > 150
                              ? `${bill.description.substring(0, 150)}...`
                              : bill.description}
                          </p>
                        )}
                        
                        {bill.relevance !== undefined && (
                          <div className="mt-3 flex items-center">
                            <Badge variant="secondary" className="mr-2">
                              Relevance: {(bill.relevance * 100).toFixed(0)}%
                            </Badge>
                            
                            {bill.sponsors && bill.sponsors.length > 0 && (
                              <span className="text-sm text-muted-foreground flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                Sponsors: {bill.sponsors.slice(0, 2).join(', ')}
                                {bill.sponsors.length > 2 && ` +${bill.sponsors.length - 2} more`}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {data.pagination && data.pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      disabled={data.pagination.offset === 0}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      Page {Math.floor(data.pagination.offset / data.pagination.limit) + 1} of {data.pagination.pages}
                    </span>
                    
                    <Button 
                      variant="outline"
                      disabled={(data.pagination.offset + data.pagination.limit) >= data.pagination.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}