// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import BillCard, { Bill } from "@/components/legislation/BillCard";
import BillDetailView from "@/components/legislation/BillDetailView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Calendar, 
  Trash2, 
  SlidersHorizontal,
  ArrowUpDown,
  FileText,
  X,
  TrendingUp,
  BarChart,
  List,
  Grid3x3
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";

export default function Legislation() {
  // Basic filters
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [chamber, setChamber] = useState("all");
  const [topic, setTopic] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Advanced filters
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [communityRatingFilter, setCommunityRatingFilter] = useState<number | null>(null);
  const [keywordFilters, setKeywordFilters] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [savedSearches, setSavedSearches] = useState<Array<{id: string, name: string, filters: any}>>([]);
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  // Build query parameters for advanced search
  const buildAdvancedSearchParams = () => {
    const params = new URLSearchParams();
    
    // Add basic search filters
    if (searchQuery) params.append('query', searchQuery);
    if (status !== 'all') params.append('status', status);
    if (chamber !== 'all') params.append('chamber', chamber);
    if (topic !== 'all') params.append('topics', topic);
    
    // Add advanced filters
    if (sentimentFilter !== 'all') {
      const sentimentRange = {
        min: sentimentFilter === 'positive' ? 0 : undefined,
        max: sentimentFilter === 'negative' ? 0 : undefined
      };
      params.append('sentiment', JSON.stringify(sentimentRange));
    }
    
    if (dateRange.start || dateRange.end) {
      params.append('dateRange', JSON.stringify({
        start: dateRange.start ? dateRange.start.toISOString() : undefined,
        end: dateRange.end ? dateRange.end.toISOString() : undefined
      }));
    }
    
    // Add sorting parameters
    if (sortBy) {
      // Map our frontend sort values to backend ones
      let backendSortBy = sortBy;
      if (sortBy === 'lastUpdated') backendSortBy = 'lastAction';
      if (sortBy === 'introducedDate') backendSortBy = 'introduced';
      if (sortBy === 'sentimentScore') backendSortBy = 'sentiment';
      if (sortBy === 'communitySupport') backendSortBy = 'community';
      
      params.append('sortBy', backendSortBy);
      params.append('sortOrder', sortOrder);
    }
    
    // Add pagination
    params.append('limit', '50');
    params.append('offset', '0');
    
    return params.toString();
  };
  
  // Query to get all bills with advanced search
  const { data: allBills, isLoading: isLoadingAllBills, error: allBillsError } = useQuery<any>({
    queryKey: ['/api/search/bills', searchQuery, status, chamber, topic, sentimentFilter, dateRange, sortBy, sortOrder],
    queryFn: async () => {
      const searchParams = buildAdvancedSearchParams();
      const response = await apiRequest(`/api/search/bills?${searchParams}`);
      return response.json();
    },
  });

  // Query to get tracked bills
  const { data: trackedBills, isLoading: isLoadingTrackedBills, error: trackedBillsError } = useQuery<any>({
    queryKey: ['/api/legislation/tracked'],
    queryFn: async () => {
      const response = await apiRequest('/api/legislation/tracked');
      return response.json();
    },
  });

  // Get filtered bills based on search and filter params
  const getFilteredBills = () => {
    // Handle possible response types for the tracked bills
    const getBillsArray = (data: any) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      return [];
    };
    
    // For the advanced search results, we need to handle the pagination structure
    const getAdvancedSearchResults = (data: any) => {
      if (!data) return [];
      if (data.results && Array.isArray(data.results)) return data.results;
      if (Array.isArray(data)) return data;
      return [];
    };
    
    // Get the bills based on the active tab
    let bills = activeTab === "tracked" 
      ? getBillsArray(trackedBills)
      : getAdvancedSearchResults(allBills);
    
    // If we're on the tracked bills tab, we still need to apply filters client-side
    if (activeTab === "tracked") {
      // Apply keyword filters (if any) - only needed for tracked bills
      if (keywordFilters.length > 0) {
        bills = bills.filter((bill: any) => {
          const content = `${bill.title} ${bill.description} ${bill.topics.join(' ')}`.toLowerCase();
          return keywordFilters.some(keyword => content.includes(keyword.toLowerCase()));
        });
      }
      
      // Apply search filter - only needed for tracked bills
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        bills = bills.filter((bill: any) => 
          bill.title.toLowerCase().includes(query) || 
          bill.description.toLowerCase().includes(query) ||
          bill.id.toLowerCase().includes(query)
        );
      }
      
      // Apply status filter - only needed for tracked bills
      if (status !== "all") {
        bills = bills.filter((bill: any) => bill.status === status);
      }
      
      // Apply chamber filter - only needed for tracked bills
      if (chamber !== "all") {
        bills = bills.filter((bill: any) => bill.chamber === chamber);
      }
      
      // Apply topic filter - only needed for tracked bills
      if (topic !== "all") {
        bills = bills.filter((bill: any) => 
          Array.isArray(bill.topics) && bill.topics.includes(topic)
        );
      }
      
      // Apply sentiment filter - only needed for tracked bills
      if (sentimentFilter !== "all" && bills.some((bill: any) => bill.hasOwnProperty('sentimentScore'))) {
        bills = bills.filter((bill: any) => {
          if (!bill.hasOwnProperty('sentimentScore')) return false;
          
          const score = bill.sentimentScore;
          if (sentimentFilter === "positive") return score > 0;
          if (sentimentFilter === "negative") return score < 0;
          if (sentimentFilter === "neutral") return score === 0;
          return true;
        });
      }
      
      // Apply community rating filter - only needed for tracked bills
      if (communityRatingFilter !== null && bills.some((bill: any) => bill.hasOwnProperty('communitySupportPct'))) {
        bills = bills.filter((bill: any) => {
          if (!bill.hasOwnProperty('communitySupportPct')) return false;
          return bill.communitySupportPct >= communityRatingFilter;
        });
      }
      
      // Apply date range filter - only needed for tracked bills
      if (dateRange.start || dateRange.end) {
        bills = bills.filter((bill: any) => {
          let lastActionDate;
          try {
            lastActionDate = bill.lastActionAt ? new Date(bill.lastActionAt) : new Date();
          } catch (e) {
            console.error("Invalid date format for lastActionAt:", bill.lastActionAt);
            lastActionDate = new Date(); // Fallback to current date
          }
          
          if (dateRange.start && dateRange.end) {
            return lastActionDate >= dateRange.start && lastActionDate <= dateRange.end;
          } else if (dateRange.start) {
            return lastActionDate >= dateRange.start;
          } else if (dateRange.end) {
            return lastActionDate <= dateRange.end;
          }
          
          return true;
        });
      }
      
      // Apply sorting - only needed for tracked bills
      bills = [...bills].sort((a: any, b: any) => {
        let comparison = 0;
        
        switch (sortBy) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "introducedDate":
            try {
              const dateA = a.introducedAt ? new Date(a.introducedAt) : new Date(0);
              const dateB = b.introducedAt ? new Date(b.introducedAt) : new Date(0);
              comparison = dateA.getTime() - dateB.getTime();
            } catch (e) {
              console.error("Date comparison error for introducedAt:", e);
              comparison = 0;
            }
            break;
          case "lastUpdated":
            try {
              const dateA = a.lastActionAt ? new Date(a.lastActionAt) : new Date(0);
              const dateB = b.lastActionAt ? new Date(b.lastActionAt) : new Date(0);
              comparison = dateA.getTime() - dateB.getTime();
            } catch (e) {
              console.error("Date comparison error for lastActionAt:", e);
              comparison = 0;
            }
            break;
          case "sentimentScore":
            comparison = (a.sentimentScore || 0) - (b.sentimentScore || 0);
            break;
          case "communitySupport":
            comparison = (a.communitySupportPct || 0) - (b.communitySupportPct || 0);
            break;
          default:
            try {
              const dateA = a.lastActionAt ? new Date(a.lastActionAt) : new Date(0);
              const dateB = b.lastActionAt ? new Date(b.lastActionAt) : new Date(0);
              comparison = dateA.getTime() - dateB.getTime();
            } catch (e) {
              console.error("Date comparison error for default sorting:", e);
              comparison = 0;
            }
        }
        
        // Apply sort order
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }
    
    return bills;
  };

  // Get all available topics from bills
  const getAllTopics = () => {
    const topicSet = new Set<string>();
    
    // Handle the new response format
    const billsArray = allBills && allBills.results && Array.isArray(allBills.results) 
      ? allBills.results 
      : Array.isArray(allBills) ? allBills : [];
    
    billsArray.forEach((bill: any) => {
      if (bill.topics && Array.isArray(bill.topics)) {
        bill.topics.forEach((topic: string) => topicSet.add(topic));
      }
    });
    
    return Array.from(topicSet).sort();
  };

  // Handle bill view click
  const handleViewBill = (bill: any) => {
    setSelectedBill(bill);
    setDialogOpen(true);
  };

  // Handle track toggle
  const handleTrackToggle = (billId: string, isTracked: boolean) => {
    // Invalidate the queries to refresh data
    import('@/lib/queryClient').then(module => {
      const { queryClient } = module;
      
      // Invalidate tracked bills to update the tracked bills tab
      queryClient.invalidateQueries({ queryKey: ['/api/legislation/tracked'] });
      
      // We don't need to invalidate all bills since tracking status is managed client-side
      // in the BillCard component, however if we fetch tracking status from API in the future,
      // we should invalidate all bills as well.
    });
  };

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatus("all");
    setChamber("all");
    setTopic("all");
    
    // Reset advanced filters too
    setSentimentFilter("all");
    setCommunityRatingFilter(null);
    setKeywordFilters([]);
    setDateRange({ start: null, end: null });
  };
  
  // Handle adding a keyword filter
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywordFilters.includes(newKeyword.trim())) {
      setKeywordFilters([...keywordFilters, newKeyword.trim()]);
      setNewKeyword("");
    }
  };
  
  // Handle removing a keyword filter
  const handleRemoveKeyword = (keyword: string) => {
    setKeywordFilters(keywordFilters.filter(k => k !== keyword));
  };
  
  // Handle saving the current search
  const handleSaveSearch = async (name: string) => {
    // Create the search parameters object
    const searchFilters = {
      searchQuery,
      status,
      chamber,
      topic,
      sentimentFilter,
      communityRatingFilter,
      keywordFilters,
      dateRange,
      sortBy,
      sortOrder
    };
    
    try {
      // Save to the API if user is authenticated
      const response = await apiRequest('/api/search/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          queryParams: searchFilters
        })
      });
      
      if (response.ok) {
        // Get the saved search from the response
        const savedSearch = await response.json();
        
        // Add the search to local state
        const searchId = savedSearch.id || `search_${Date.now()}`;
        setSavedSearches([...savedSearches, { id: searchId, name, filters: searchFilters }]);
        setActiveSearchId(searchId);
      } else {
        // If API save fails, still save locally
        const searchId = `search_${Date.now()}`;
        setSavedSearches([...savedSearches, { id: searchId, name, filters: searchFilters }]);
        setActiveSearchId(searchId);
      }
    } catch (error) {
      // If there's an error (e.g. user not authenticated), still save locally
      const searchId = `search_${Date.now()}`;
      setSavedSearches([...savedSearches, { id: searchId, name, filters: searchFilters }]);
      setActiveSearchId(searchId);
      console.error('Error saving search:', error);
    }
  };
  
  // Handle loading a saved search
  const handleLoadSearch = (searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (!search) return;
    
    setActiveSearchId(searchId);
    
    // Apply the search filters
    const { filters } = search;
    setSearchQuery(filters.searchQuery || "");
    setStatus(filters.status || "all");
    setChamber(filters.chamber || "all");
    setTopic(filters.topic || "all");
    setSentimentFilter(filters.sentimentFilter || "all");
    setCommunityRatingFilter(filters.communityRatingFilter || null);
    setKeywordFilters(filters.keywordFilters || []);
    setDateRange(filters.dateRange || { start: null, end: null });
    setSortBy(filters.sortBy || "lastUpdated");
    setSortOrder(filters.sortOrder || "desc");
  };
  
  // Handle deleting a saved search
  const handleDeleteSearch = (searchId: string) => {
    setSavedSearches(savedSearches.filter(s => s.id !== searchId));
    if (activeSearchId === searchId) {
      setActiveSearchId(null);
    }
  };

  // Loading states
  const isLoading = (activeTab === "all" && isLoadingAllBills) || 
                   (activeTab === "tracked" && isLoadingTrackedBills);
  
  // Error states
  const error = (activeTab === "all" && allBillsError) || 
                (activeTab === "tracked" && trackedBillsError);
  
  // Getting bills based on active tab and filters
  const filteredBills = getFilteredBills();
  const topics = getAllTopics();
  
  // Check if there are tracked bills
  const hasTrackedBills = Array.isArray(trackedBills) && trackedBills.length > 0;

  // Check if the selected bill is tracked
  const isSelectedBillTracked = selectedBill && Array.isArray(trackedBills) 
    ? trackedBills.some((bill: any) => bill.id === selectedBill.id)
    : false;

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Legislation</h1>
            <p className="text-muted-foreground mt-2">
              Search, track, and take action on pending legislation.
            </p>
          </div>
          <Button variant="outline" asChild className="mt-1">
            <Link href="/committee-meetings">
              <Calendar className="mr-2 h-4 w-4" />
              Committee Meetings
            </Link>
          </Button>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Legislation</TabsTrigger>
            <TabsTrigger value="tracked" disabled={isLoadingTrackedBills}>
              My Tracked Bills {hasTrackedBills && Array.isArray(trackedBills) && `(${trackedBills.length})`}
            </TabsTrigger>
          </TabsList>
          
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bill title or description"
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchInput}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="introduced">Introduced</SelectItem>
                    <SelectItem value="in_committee">In Committee</SelectItem>
                    <SelectItem value="passed_house">Passed House</SelectItem>
                    <SelectItem value="passed_senate">Passed Senate</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="vetoed">Vetoed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={chamber} onValueChange={setChamber}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chamber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chambers</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="senate">Senate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex gap-2 flex-wrap">
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger className="w-[230px]">
                      <SelectValue placeholder="Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {topics.map((topic, index) => (
                        <SelectItem key={index} value={topic}>{topic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Advanced Search Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => setShowAdvancedFilters(true)}
                      >
                        <SlidersHorizontal size={15} />
                        Advanced Search
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Advanced Search Options</SheetTitle>
                        <SheetDescription>
                          Refine your search with advanced filters and save your searches for later.
                        </SheetDescription>
                      </SheetHeader>
                      
                      {/* Advanced Filters Content */}
                      <div className="py-6 space-y-6">
                        {/* Sorting Options */}
                        <div className="space-y-2">
                          <h3 className="font-medium">Sort Results</h3>
                          <div className="flex gap-3">
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sort by" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lastUpdated">Last Updated</SelectItem>
                                <SelectItem value="introducedDate">Date Introduced</SelectItem>
                                <SelectItem value="title">Bill Title</SelectItem>
                                <SelectItem value="sentimentScore">Sentiment Score</SelectItem>
                                <SelectItem value="communitySupport">Community Support</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                              title={sortOrder === "asc" ? "Ascending" : "Descending"}
                            >
                              <ArrowUpDown className={sortOrder === "asc" ? "rotate-0" : "rotate-180"} />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Sentiment Filter */}
                        <div className="space-y-2">
                          <h3 className="font-medium">Sentiment Analysis</h3>
                          <Select 
                            value={sentimentFilter} 
                            onValueChange={(value: any) => setSentimentFilter(value as "all" | "positive" | "negative" | "neutral")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Filter by sentiment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sentiments</SelectItem>
                              <SelectItem value="positive">Positive</SelectItem>
                              <SelectItem value="negative">Negative</SelectItem>
                              <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Community Rating Filter */}
                        <div className="space-y-2">
                          <h3 className="font-medium">Community Support</h3>
                          <Select 
                            value={communityRatingFilter?.toString() || ""}
                            onValueChange={(value) => setCommunityRatingFilter(value ? parseInt(value) : null)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Minimum community support" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Any Support Level</SelectItem>
                              <SelectItem value="25">At least 25% support</SelectItem>
                              <SelectItem value="50">At least 50% support</SelectItem>
                              <SelectItem value="75">At least 75% support</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Keyword Filters */}
                        <div className="space-y-2">
                          <h3 className="font-medium">Keyword Filters</h3>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add keyword filter"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                            />
                            <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                              Add
                            </Button>
                          </div>
                          
                          {keywordFilters.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {keywordFilters.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                                  {keyword}
                                  <button onClick={() => handleRemoveKeyword(keyword)} className="ml-1">
                                    <X size={14} />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* View Type */}
                        <div className="space-y-2">
                          <h3 className="font-medium">View Type</h3>
                          <div className="flex space-x-2">
                            <Button 
                              variant={view === "grid" ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setView("grid")}
                              className="flex-1 gap-2"
                            >
                              <Grid3x3 size={15} />
                              Grid View
                            </Button>
                            <Button 
                              variant={view === "list" ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setView("list")}
                              className="flex-1 gap-2"
                            >
                              <List size={15} />
                              List View
                            </Button>
                          </div>
                        </div>
                        
                        {/* Saved Searches */}
                        <div className="space-y-2">
                          <h3 className="font-medium">Saved Searches</h3>
                          {savedSearches.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-3 border rounded-md">
                              You don't have any saved searches yet. Save your current search to access it quickly later.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {savedSearches.map((search) => (
                                <div key={search.id} className="flex items-center justify-between p-2 border rounded-md">
                                  <div className="flex-1 truncate pr-2">
                                    <button 
                                      onClick={() => handleLoadSearch(search.id)}
                                      className={`text-left text-sm w-full ${activeSearchId === search.id ? 'font-semibold text-primary' : ''}`}
                                    >
                                      {search.name}
                                    </button>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteSearch(search.id)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Save Current Search */}
                          <div className="mt-3 flex gap-2">
                            <Input
                              placeholder="Name this search"
                              id="save-search-name"
                            />
                            <Button 
                              onClick={() => {
                                const nameInput = document.getElementById('save-search-name') as HTMLInputElement;
                                if (nameInput && nameInput.value.trim()) {
                                  handleSaveSearch(nameInput.value.trim());
                                  nameInput.value = '';
                                }
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <SheetFooter>
                        <SheetClose asChild>
                          <Button>Apply Filters</Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Apply visual indicator for active filters */}
                  {(searchQuery || status !== "all" || chamber !== "all" || topic !== "all" || keywordFilters.length > 0 || sentimentFilter !== "all" || communityRatingFilter !== null) && (
                    <Badge variant="secondary" className="whitespace-nowrap">
                      Filters Applied
                    </Badge>
                  )}
                  
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} found
                  </span>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={handleResetFilters}
                    disabled={!searchQuery && status === "all" && chamber === "all" && topic === "all" && 
                              keywordFilters.length === 0 && sentimentFilter === "all" && communityRatingFilter === null}
                  >
                    <Trash2 size={14} />
                    Reset
                  </Button>
                </div>
              </div>
          </div>
          
          <TabsContent value="all" className="m-0">
            {isLoadingAllBills ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[125px] w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allBillsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load legislation data. Please try again later.
                </AlertDescription>
              </Alert>
            ) : filteredBills.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No bills found</AlertTitle>
                <AlertDescription>
                  No bills match your current search and filter criteria. Try adjusting your filters.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* View Switch Controls */}
                <div className="mb-4 flex justify-end">
                  <div className="bg-secondary rounded-md p-1 flex">
                    <Button 
                      size="sm" 
                      variant={view === "grid" ? "default" : "ghost"}
                      onClick={() => setView("grid")}
                      className="gap-1"
                    >
                      <Grid3x3 size={15} />
                      <span className="sr-only sm:not-sr-only">Grid</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant={view === "list" ? "default" : "ghost"}
                      onClick={() => setView("list")}
                      className="gap-1"
                    >
                      <List size={15} />
                      <span className="sr-only sm:not-sr-only">List</span>
                    </Button>
                  </div>
                </div>
                
                {view === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBills.map((bill: any) => (
                      <BillCard
                        key={bill.id}
                        bill={bill}
                        isTracked={Array.isArray(trackedBills) && trackedBills.some((tracked: any) => tracked.id === bill.id) || false}
                        onTrackToggle={handleTrackToggle}
                        onViewDetails={handleViewBill}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBills.map((bill: any) => (
                      <div 
                        key={bill.id} 
                        className="flex flex-col sm:flex-row items-start border rounded-lg p-4 hover:bg-secondary/10 transition-colors"
                      >
                        <div className="flex-1 mb-3 sm:mb-0 sm:mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold hover:text-primary cursor-pointer" onClick={() => handleViewBill(bill)}>
                              {bill.id}: {bill.title}
                            </h3>
                            <Badge className="bg-gray-500">{bill.chamber}</Badge>
                            <Badge className={`
                              ${bill.status.includes('introduced') ? 'bg-blue-500' : ''}
                              ${bill.status.includes('committee') ? 'bg-amber-500' : ''}
                              ${bill.status.includes('passed') ? 'bg-green-500' : ''}
                              ${bill.status.includes('vetoed') ? 'bg-red-500' : ''}
                            `}>
                              {bill.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bill.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {bill.topics.slice(0, 3).map((topic: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{topic}</Badge>
                            ))}
                            {bill.topics.length > 3 && <Badge variant="outline" className="text-xs">+{bill.topics.length - 3}</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center justify-between gap-3 w-full sm:w-auto">
                          <div className="text-sm text-muted-foreground">
                            Last action: {(() => {
                              try {
                                return bill.lastActionAt ? new Date(bill.lastActionAt).toLocaleDateString() : "N/A";
                              } catch (e) {
                                console.error("Error formatting last action date:", e);
                                return "N/A";
                              }
                            })()}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => handleViewBill(bill)}
                            >
                              <FileText size={15} />
                              Details
                            </Button>
                            <Button 
                              variant={Array.isArray(trackedBills) && trackedBills.some((tracked: any) => tracked.id === bill.id) ? "default" : "outline"} 
                              size="sm" 
                              className="gap-1"
                              onClick={() => handleTrackToggle(bill.id, !(Array.isArray(trackedBills) && trackedBills.some((tracked: any) => tracked.id === bill.id)))}
                            >
                              {Array.isArray(trackedBills) && trackedBills.some((tracked: any) => tracked.id === bill.id) ? (
                                <>
                                  <Star size={15} />
                                  Tracking
                                </>
                              ) : (
                                <>
                                  <Star size={15} />
                                  Track
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="tracked" className="m-0">
            {isLoadingTrackedBills ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[125px] w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trackedBillsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load tracked bills. Please try again later.
                </AlertDescription>
              </Alert>
            ) : !hasTrackedBills ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No tracked bills</AlertTitle>
                <AlertDescription>
                  You haven't tracked any bills yet. Browse the legislation and star bills to track them.
                </AlertDescription>
              </Alert>
            ) : filteredBills.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No bills found</AlertTitle>
                <AlertDescription>
                  No tracked bills match your current search and filter criteria. Try adjusting your filters.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBills.map((bill: any) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    isTracked={true}
                    onTrackToggle={handleTrackToggle}
                    onViewDetails={handleViewBill}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bill Detail Dialog */}
      <BillDetailView
        bill={selectedBill}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        isTracked={isSelectedBillTracked}
        onTrackToggle={handleTrackToggle}
      />
    </div>
  );
}