import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { Search, CalendarRange, Filter, X, Video, User, Clock } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Define interfaces for our types
interface VideoSearchParams {
  query?: string;
  committeeId?: string;
  dateRange?: { start?: Date; end?: Date };
  billId?: string;
  speakerName?: string;
  importance?: string;
  limit?: number;
  offset?: number;
}

interface VideoSegment {
  id: number;
  meetingId: number;
  startTime: number;
  endTime: number;
  transcript: string;
  speakerName: string;
  speakerRole: string;
  importance: string;
  billReferences: Array<{ billId: string; confidence: number }>;
  keyTopics: string[];
  tags: string[];
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  committeeId: number;
  videoUrl: string;
}

interface Committee {
  name: string;
}

interface VideoSearchResult {
  segment: VideoSegment;
  meeting: Meeting;
  committee: Committee;
}

interface VideoSearchResponse {
  results: VideoSearchResult[];
  totalCount: number;
  query: VideoSearchParams;
}

export function CommitteeVideoSearch() {
  // State for search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: Date, end?: Date }>({});
  const [speakerName, setSpeakerName] = useState<string>('');
  const [importance, setImportance] = useState<string>('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsPerPage = 10;

  // Debounce search query
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch({
      query: e.target.value,
      committeeId: selectedCommittee,
      dateRange,
      billId: selectedBillId,
      speakerName,
      importance,
      limit: resultsPerPage,
      offset: (page - 1) * resultsPerPage
    });
  };

  // Debounced search function
  const debouncedSearch = debounce((params: VideoSearchParams) => {
    setDebouncedQuery(params.query || '');
  }, 500);

  // Handle filter changes
  const applyFilters = () => {
    setPage(1); // Reset to first page when filters change
  };

  // Fetch committees for filter dropdown
  const { data: committees } = useQuery<any>({
    queryKey: ['/api/committees'],
    refetchOnWindowFocus: false
  });

  // Fetch video search results
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/search/committee-videos', {
      query: debouncedQuery,
      committeeId: selectedCommittee,
      dateRange,
      billId: selectedBillId,
      speakerName,
      importance,
      limit: resultsPerPage,
      offset: (page - 1) * resultsPerPage
    }],
    enabled: !!debouncedQuery || !!selectedCommittee || !!dateRange.start || !!dateRange.end || !!selectedBillId || !!speakerName || !!importance,
    refetchOnWindowFocus: false
  });

  // Format timestamp (seconds) to MM:SS format
  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCommittee('');
    setDateRange({});
    setSelectedBillId('');
    setSpeakerName('');
    setImportance('');
    setPage(1);
    setFiltersOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search committee videos..."
            className="pl-10 py-6"
            value={searchQuery}
            onChange={handleSearchQueryChange}
          />
        </div>
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {(!!selectedCommittee || !!dateRange.start || !!selectedBillId || !!speakerName || !!importance) && (
                <Badge variant="secondary" className="rounded-full px-1 min-w-4 h-4 flex items-center justify-center text-xs">
                  {[
                    selectedCommittee ? 1 : 0,
                    dateRange.start ? 1 : 0,
                    selectedBillId ? 1 : 0,
                    speakerName ? 1 : 0,
                    importance ? 1 : 0
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] md:w-[500px] p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Search Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-xs">
                  <X className="h-3 w-3" /> Clear
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Committee</label>
                  <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select committee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Committees</SelectItem>
                      {committees?.map((committee: any) => (
                        <SelectItem key={committee.id} value={committee.id.toString()}>
                          {committee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bill ID</label>
                  <Input
                    placeholder="e.g., TX-HB1234"
                    value={selectedBillId}
                    onChange={(e) => setSelectedBillId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speaker Name</label>
                  <Input
                    placeholder="e.g., John Smith"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Importance</label>
                  <Select value={importance} onValueChange={setImportance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any importance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          {dateRange.start ? formatDate(dateRange.start.toISOString()) : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.start}
                          onSelect={(date) => setDateRange({ ...dateRange, start: date || undefined })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          {dateRange.end ? formatDate(dateRange.end.toISOString()) : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.end}
                          onSelect={(date) => setDateRange({ ...dateRange, end: date || undefined })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <Button onClick={() => { applyFilters(); setFiltersOpen(false); }} className="w-full mt-2">
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3 mt-1" />
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
            <CardTitle className="text-destructive">Error Loading Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the video search results. Please try again later.</p>
          </CardContent>
        </Card>
      ) : data?.results.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Videos Found</CardTitle>
            <CardDescription>
              {debouncedQuery 
                ? `No committee videos found matching "${debouncedQuery}". Try different search terms or filters.`
                : "No committee videos found matching the selected filters. Try adjusting your search filters."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * resultsPerPage) + 1}-{Math.min(page * resultsPerPage, data?.totalCount || 0)} of {data?.totalCount} results
            </p>
            {(!!selectedCommittee || !!dateRange.start || !!selectedBillId || !!speakerName || !!importance) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
                <X className="h-3 w-3" /> Clear Filters
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {data?.results.map((result: VideoSearchResult) => (
              <Card key={result.segment.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{result.meeting.title || 'Committee Meeting'}</CardTitle>
                    <Badge>{result.segment.importance}</Badge>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {result.segment.speakerName} ({result.segment.speakerRole})
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTimestamp(result.segment.startTime)}-{formatTimestamp(result.segment.endTime)}
                    </span>
                    <span>
                      {formatDate(result.meeting.date)}
                    </span>
                    <span className="flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      {result.committee.name}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 mb-2">{result.segment.transcript}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.segment.billReferences.map((ref, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ref.billId} ({Math.round(ref.confidence * 100)}%)
                      </Badge>
                    ))}
                    {result.segment.keyTopics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <div className="bg-muted/50 p-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => window.open(result.meeting.videoUrl + `?t=${result.segment.startTime}`, '_blank')}>
                    Watch Segment
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {data && data.totalCount > resultsPerPage && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, Math.ceil(data.totalCount / resultsPerPage)) }).map((_, i) => {
                  const pageNum = i + 1;
                  const totalPages = Math.ceil(data.totalCount / resultsPerPage);
                  
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipsis
                  if (pageNum === 2 && page > 3) {
                    return (
                      <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  if (pageNum === totalPages - 1 && page < totalPages - 2) {
                    return (
                      <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(Math.ceil(data.totalCount / resultsPerPage), page + 1))}
                    className={page === Math.ceil(data.totalCount / resultsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}