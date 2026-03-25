// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter,
  X,
  FileText,
  Users,
  Building,
  Calendar,
  Tag,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  History,
  BookOpen,
  Vote
} from "lucide-react";

interface SearchResult {
  id: string;
  type: 'bill' | 'legislator' | 'committee';
  title: string;
  description: string;
  relevanceScore: number;
  metadata: Record<string, any>;
}

interface SearchFilters {
  type: string[];
  chamber: string[];
  status: string[];
  party: string[];
  dateRange: string;
  priority: string[];
}

export default function EnhancedSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    type: [],
    chamber: [],
    status: [],
    party: [],
    dateRange: "all",
    priority: []
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch authentic Texas bills for search
  const { data: billsData } = useQuery<any>({
    queryKey: ["/api/bills"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch authentic Texas legislators for search  
  const { data: legislatorsData } = useQuery<any>({
    queryKey: ["/api/legislators"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const allBills = billsData?.results || [];
  const allLegislators = legislatorsData?.results || [];

  // Client-side search through your authentic data
  const results = searchQuery.length >= 2 ? (() => {
    const searchTerm = searchQuery.toLowerCase();
    const searchResults = [];

    // Search through authentic Texas bills with enhanced relevance scoring
    if (!activeFilters.type.length || activeFilters.type.includes('bill')) {
      const matchingBills = allBills.filter((bill: any) => {
        const titleMatch = bill.title?.toLowerCase().includes(searchTerm);
        const descMatch = bill.description?.toLowerCase().includes(searchTerm);
        const billNumMatch = bill.billNumber?.toLowerCase().includes(searchTerm);
        return titleMatch || descMatch || billNumMatch;
      }).filter((bill: any) => {
        if (activeFilters.chamber.length && !activeFilters.chamber.includes(bill.chamber?.toLowerCase())) return false;
        if (activeFilters.status.length && !activeFilters.status.includes(bill.status?.toLowerCase())) return false;
        return true;
      }).map((bill: any) => {
        // Calculate enhanced relevance score
        let score = 0;
        const title = bill.title?.toLowerCase() || '';
        const desc = bill.description?.toLowerCase() || '';
        
        if (title.includes(searchTerm)) score += title.startsWith(searchTerm) ? 100 : 50;
        if (desc.includes(searchTerm)) score += 25;
        if (bill.billNumber?.toLowerCase().includes(searchTerm)) score += 75;
        
        return { bill, score };
      }).sort((a: any, b: any) => b.score - a.score);

      searchResults.push(...matchingBills.slice(0, 10).map(({ bill, score }) => ({
        id: bill.id,
        type: 'bill',
        title: bill.title || 'Untitled Bill',
        description: bill.description || 'No description available',
        relevanceScore: score / 100,
        metadata: {
          chamber: bill.chamber,
          status: bill.status,
          date: bill.introducedAt || new Date().toISOString(),
          sponsor: bill.sponsors || 'Unknown',
          billNumber: bill.billNumber,
          matchType: bill.title?.toLowerCase().includes(searchTerm) ? 'title' : 'content'
        }
      })));
    }

    // Search through authentic Texas legislators
    if (!activeFilters.type.length || activeFilters.type.includes('legislator')) {
      const matchingLegislators = allLegislators.filter((legislator: any) => 
        `${legislator.firstName} ${legislator.lastName}`.toLowerCase().includes(searchTerm) ||
        legislator.district?.toString().includes(searchTerm)
      ).filter((legislator: any) => {
        if (activeFilters.party.length && !activeFilters.party.includes(legislator.party?.toLowerCase())) return false;
        if (activeFilters.chamber.length && !activeFilters.chamber.includes(legislator.chamber?.toLowerCase())) return false;
        return true;
      });

      searchResults.push(...matchingLegislators.slice(0, 10).map((legislator: any) => ({
        id: legislator.id,
        type: 'legislator',
        title: `${legislator.firstName} ${legislator.lastName}`,
        description: `${legislator.party || 'Unknown'} - District ${legislator.district || 'Unknown'}`,
        relevanceScore: 0.9,
        metadata: {
          party: legislator.party,
          district: legislator.district,
          chamber: legislator.chamber,
          email: legislator.email
        }
      })));
    }

    return searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  })() : [];

  const isLoading = false;
  const error = null;

  // Generate intelligent suggestions from authentic data
  const suggestedQueries = searchQuery.length >= 1 ? (() => {
    const searchTerm = searchQuery.toLowerCase();
    const suggestions: string[] = [];
    
    // Smart bill suggestions with priority scoring
    const billSuggestions = allBills
      .map((bill: any) => {
        if (!bill.title) return null;
        const title = bill.title.toLowerCase();
        if (!title.includes(searchTerm)) return null;
        
        const score = title.startsWith(searchTerm) ? 100 : title.indexOf(searchTerm) === 0 ? 90 : 50;
        return { text: bill.title, score };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b!.score - a!.score)
      .slice(0, 3)
      .map((item: any) => item!.text);
    
    suggestions.push(...billSuggestions);
    
    // Smart legislator suggestions using actual names from your data
    const legislatorSuggestions = allLegislators
      .map((legislator: any) => {
        const fullName = legislator.name || `${legislator.firstName || ''} ${legislator.lastName || ''}`.trim();
        if (!fullName.toLowerCase().includes(searchTerm)) return null;
        
        const score = fullName.toLowerCase().startsWith(searchTerm) ? 100 : 60;
        return { text: fullName, score };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b!.score - a!.score)
      .slice(0, 2)
      .map((item: any) => item!.text);
    
    suggestions.push(...legislatorSuggestions);
    
    return suggestions.slice(0, 5);
  })() : [];

  const trending = [
    "education funding",
    "healthcare reform",
    "infrastructure bill", 
    "voting rights",
    "border security"
  ];

  // Smart search suggestions
  const smartSuggestions = [
    "Find bills by Rep. Smith",
    "Show all education bills",
    "Healthcare votes this year",
    "Committee hearings this week",
    "Bills passed in 2024"
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !searchHistory.includes(query.trim())) {
      setSearchHistory(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
    setShowSuggestions(false);
  };

  const addFilter = (category: keyof SearchFilters, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: Array.isArray(prev[category]) 
        ? [...(prev[category] as string[]), value]
        : [value]
    }));
  };

  const removeFilter = (category: keyof SearchFilters, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: Array.isArray(prev[category])
        ? (prev[category] as string[]).filter(v => v !== value)
        : prev[category]
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      type: [],
      chamber: [],
      status: [],
      party: [],
      dateRange: "all",
      priority: []
    });
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'bill': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'legislator': return <Users className="w-4 h-4 text-green-600" />;
      case 'committee': return <Building className="w-4 h-4 text-purple-600" />;
      default: return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().filter(Boolean).length;
  };

  // Highlight search terms in results
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Enhanced Search Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${
                isSearchFocused ? 'transform scale-105' : ''
              }`}>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search bills, legislators, committees... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setIsSearchFocused(false);
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                    }
                  }}
                  className="pl-12 pr-12 h-14 text-lg bg-white/70 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (searchQuery || isSearchFocused) && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border shadow-xl">
                  <CardContent className="p-0">
                    {searchQuery && suggestedQueries.length > 0 && (
                      <div className="p-4 border-b">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Suggestions
                        </h4>
                        <div className="space-y-1">
                          {suggestedQueries.slice(0, 5).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(suggestion)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchHistory.length > 0 && (
                      <div className="p-4 border-b">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Recent Searches
                        </h4>
                        <div className="space-y-1">
                          {searchHistory.map((query, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(query)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm text-gray-600"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!searchQuery && (
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Trending Searches
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {trending.map((term, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              onClick={() => handleSearch(term)}
                            >
                              {term}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-4">
                          <h5 className="text-xs font-medium text-gray-600 mb-2">Quick Searches</h5>
                          <div className="grid grid-cols-1 gap-1">
                            {smartSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSearch(suggestion)}
                                className="text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm text-gray-600"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Smart Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <Select onValueChange={(value) => addFilter('type', value)}>
                <SelectTrigger className="w-auto h-8 text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bill">Bills</SelectItem>
                  <SelectItem value="legislator">Legislators</SelectItem>
                  <SelectItem value="committee">Committees</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => addFilter('chamber', value)}>
                <SelectTrigger className="w-auto h-8 text-sm">
                  <SelectValue placeholder="Chamber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="senate">Senate</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => addFilter('status', value)}>
                <SelectTrigger className="w-auto h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {getActiveFilterCount() > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 text-sm"
                >
                  Clear Filters ({getActiveFilterCount()})
                </Button>
              )}
            </div>

            {/* Active Filters */}
            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([category, values]) =>
                  Array.isArray(values) ? values.map(value => (
                    <Badge
                      key={`${category}-${value}`}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                      onClick={() => removeFilter(category as keyof SearchFilters, value)}
                    >
                      {value}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )) : null
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Search Results
                {results.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {results.length} found
                  </Badge>
                )}
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Search functionality is currently connecting to government databases. 
                  Please try again in a moment.
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No results found for "{searchQuery}"
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["education", "healthcare", "infrastructure", "voting"].map(term => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => handleSearch(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getResultIcon(result.type)}
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {highlightSearchTerm(result.title, searchQuery)}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Zap className="w-3 h-3" />
                            {Math.round(result.relevanceScore * 100)}% match
                          </div>
                          {result.metadata.matchType === 'title' && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              Title Match
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {result.metadata.chamber && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {result.metadata.chamber}
                            </span>
                          )}
                          {result.metadata.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {result.metadata.date}
                            </span>
                          )}
                          {result.metadata.status && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {result.metadata.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      {!searchQuery && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <BookOpen className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-3">Search Tips</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <h4 className="font-medium mb-2">Search Examples:</h4>
                    <ul className="space-y-1">
                      <li>• "education funding Texas"</li>
                      <li>• "Rep. John Smith votes"</li>
                      <li>• "healthcare committee"</li>
                      <li>• "infrastructure bills 2024"</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Advanced Features:</h4>
                    <ul className="space-y-1">
                      <li>• Use filters to narrow results</li>
                      <li>• Press Ctrl+K for quick search</li>
                      <li>• Search history is saved</li>
                      <li>• Trending topics updated daily</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}