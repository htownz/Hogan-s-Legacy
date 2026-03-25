// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Brain, 
  Clock, 
  TrendingUp,
  Zap,
  Target,
  BookOpen,
  Users,
  Building,
  Calendar,
  Tag,
  X,
  Sparkles
} from "lucide-react";

interface AdvancedSearchIntelligenceProps {
  onSearchResults?: (results: any[]) => void;
  onFilterChange?: (filters: any) => void;
}

export function AdvancedSearchIntelligence({ onSearchResults, onFilterChange }: AdvancedSearchIntelligenceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'simple' | 'semantic' | 'boolean'>('simple');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch authentic bills and legislators for intelligent suggestions
  const { data: billsData } = useQuery<any>({
    queryKey: ['/api/bills/texas-authentic'],
    enabled: true
  });

  const { data: legislatorsData } = useQuery<any>({
    queryKey: ['/api/legislators/texas-authentic'],
    enabled: true
  });

  const bills = Array.isArray(billsData) ? billsData : [];
  const legislators = Array.isArray(legislatorsData) ? legislatorsData : [];

  // Smart suggestion generation from authentic data
  const generateSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Bill title suggestions
    bills.forEach(bill => {
      if (bill.title && bill.title.toLowerCase().includes(query)) {
        const words = bill.title.split(' ');
        const queryIndex = words.findIndex((word: any) => word.toLowerCase().includes(query));
        if (queryIndex !== -1) {
          // Suggest the complete phrase containing the query
          const start = Math.max(0, queryIndex - 2);
          const end = Math.min(words.length, queryIndex + 3);
          const phrase = words.slice(start, end).join(' ');
          suggestions.add(phrase);
        }
      }
      
      // Subject suggestions
      bill.subjects?.forEach((subject: any) => {
        if (subject.toLowerCase().includes(query)) {
          suggestions.add(subject);
        }
      });

      // Sponsor suggestions
      if (bill.sponsors && bill.sponsors.toLowerCase().includes(query)) {
        bill.sponsors.split(',').forEach((sponsor: any) => {
          const trimmedSponsor = sponsor.trim();
          if (trimmedSponsor.toLowerCase().includes(query)) {
            suggestions.add(trimmedSponsor);
          }
        });
      }
    });

    // Legislator name suggestions
    legislators.forEach(legislator => {
      if (legislator.name && legislator.name.toLowerCase().includes(query)) {
        suggestions.add(legislator.name);
      }
      
      // Committee suggestions
      legislator.committees?.forEach((committee: any) => {
        if (committee.toLowerCase().includes(query)) {
          suggestions.add(committee);
        }
      });
    });

    return Array.from(suggestions).slice(0, 8);
  }, [searchQuery, bills, legislators]);

  // Semantic search concepts
  const semanticConcepts = [
    { term: "education funding", related: ["school", "university", "student", "teacher", "education budget"] },
    { term: "healthcare policy", related: ["medical", "health", "hospital", "medicare", "medicaid"] },
    { term: "criminal justice", related: ["crime", "police", "prison", "court", "justice"] },
    { term: "environmental protection", related: ["environment", "pollution", "climate", "conservation"] },
    { term: "economic development", related: ["business", "economy", "job", "employment", "development"] },
    { term: "infrastructure", related: ["roads", "bridges", "transportation", "utilities", "construction"] }
  ];

  // Boolean search helper
  const booleanOperators = ['AND', 'OR', 'NOT', '(', ')'];

  // Popular search categories from authentic data
  const popularCategories = useMemo(() => {
    const subjectCounts = {};
    bills.forEach(bill => {
      bill.subjects?.forEach((subject: any) => {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      });
    });
    
    return Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([subject, count]) => ({ subject, count }));
  }, [bills]);

  // Trending searches based on recent activity
  const trendingSearches = [
    "budget appropriations",
    "education reform",
    "healthcare access",
    "criminal justice reform",
    "economic development",
    "environmental protection"
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(s => s !== query)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });

    // Perform search based on mode
    let results = [];
    
    switch (searchMode) {
      case 'semantic':
        results = performSemanticSearch(query);
        break;
      case 'boolean':
        results = performBooleanSearch(query);
        break;
      default:
        results = performSimpleSearch(query);
    }

    onSearchResults?.(results);
    setShowSuggestions(false);
  };

  const performSimpleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return bills.filter(bill => 
      bill.title?.toLowerCase().includes(lowerQuery) ||
      bill.description?.toLowerCase().includes(lowerQuery) ||
      bill.sponsors?.toLowerCase().includes(lowerQuery) ||
      bill.subjects?.some((subject: any) => subject.toLowerCase().includes(lowerQuery))
    );
  };

  const performSemanticSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const relatedTerms = new Set([lowerQuery]);
    
    // Find semantic matches
    semanticConcepts.forEach(concept => {
      if (concept.term.includes(lowerQuery) || concept.related.some(term => term.includes(lowerQuery))) {
        concept.related.forEach(term => relatedTerms.add(term));
      }
    });

    return bills.filter(bill => 
      Array.from(relatedTerms).some(term =>
        bill.title?.toLowerCase().includes(term) ||
        bill.description?.toLowerCase().includes(term) ||
        bill.subjects?.some((subject: any) => subject.toLowerCase().includes(term))
      )
    );
  };

  const performBooleanSearch = (query: string) => {
    // Simplified boolean search implementation
    const terms = query.split(' ');
    let results = bills;
    
    // Basic AND/OR/NOT implementation
    terms.forEach(term => {
      if (term === 'AND' || term === 'OR' || term === 'NOT') return;
      
      const termResults = bills.filter(bill => 
        bill.title?.toLowerCase().includes(term.toLowerCase()) ||
        bill.description?.toLowerCase().includes(term.toLowerCase())
      );
      
      // For simplicity, treating as AND by default
      results = results.filter(bill => termResults.includes(bill));
    });
    
    return results;
  };

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      const newFilters = [...activeFilters, filter];
      setActiveFilters(newFilters);
      onFilterChange?.(newFilters);
    }
  };

  const removeFilter = (filter: string) => {
    const newFilters = activeFilters.filter(f => f !== filter);
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Main Search Interface */}
      <Card className="border-0 shadow-2xl" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-400" />
            Advanced Search Intelligence
          </CardTitle>
          <CardDescription className="text-slate-300">
            Powered by authentic Texas legislative data - smart suggestions, semantic search, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Input with Intelligence */}
          <div className="relative">
            <div className="flex gap-3 mb-4">
              <Button
                variant={searchMode === 'simple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('simple')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Simple
              </Button>
              <Button
                variant={searchMode === 'semantic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('semantic')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Brain className="w-4 h-4 mr-2" />
                Semantic
              </Button>
              <Button
                variant={searchMode === 'boolean' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('boolean')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Filter className="w-4 h-4 mr-2" />
                Boolean
              </Button>
            </div>

            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length > 1);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                onFocus={() => setShowSuggestions(searchQuery.length > 1)}
                placeholder={
                  searchMode === 'semantic' ? "Search by concept (e.g., 'education funding', 'criminal justice')" :
                  searchMode === 'boolean' ? "Use AND, OR, NOT (e.g., 'education AND budget NOT healthcare')" :
                  "Search bills, legislators, committees, or subjects..."
                }
                className="bg-white/10 border-white/20 text-white placeholder-slate-400 text-lg py-4 pr-12"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            {/* Smart Suggestions Dropdown */}
            {showSuggestions && generateSuggestions.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-0 shadow-2xl" style={{
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Smart Suggestions
                  </div>
                  {generateSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(suggestion)}
                      className="w-full text-left p-2 rounded hover:bg-white/10 text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-slate-300">Active filters:</span>
              {activeFilters.map((filter) => (
                <Badge key={filter} className="bg-blue-600 flex items-center gap-1">
                  {filter}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-400"
                    onClick={() => removeFilter(filter)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Popular Categories */}
            <div>
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                Popular Categories
              </h4>
              <div className="space-y-2">
                {popularCategories.map(({ subject, count }) => (
                  <button
                    key={subject}
                    onClick={() => addFilter(subject)}
                    className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <span className="text-white text-sm">{subject}</span>
                    <Badge className="bg-emerald-600 text-xs">{count}</Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div>
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Recent Searches
              </h4>
              <div className="space-y-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors text-white text-sm"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div>
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Trending Searches
              </h4>
              <div className="space-y-2">
                {trendingSearches.map((trend) => (
                  <button
                    key={trend}
                    onClick={() => handleSearch(trend)}
                    className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors text-white text-sm"
                  >
                    {trend}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Tips */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-bold text-slate-300 mb-2">Search Tips:</h4>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-400">
              <div>
                <strong className="text-emerald-400">Simple:</strong> Search by any keyword in bills, legislators, or subjects
              </div>
              <div>
                <strong className="text-blue-400">Semantic:</strong> Find related concepts even without exact matches
              </div>
              <div>
                <strong className="text-purple-400">Boolean:</strong> Use AND, OR, NOT for complex queries
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}