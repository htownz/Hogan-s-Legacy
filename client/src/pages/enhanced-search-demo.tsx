import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnhancedSearch from "@/components/EnhancedSearch";
import { 
  Search, 
  Sparkles, 
  Zap,
  Target,
  TrendingUp,
  Filter,
  Clock,
  Users,
  FileText,
  Building
} from "lucide-react";

export default function EnhancedSearchDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-6 shadow-lg">
            <Search className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              🔍 Enhanced Search Intelligence
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
            Smart Legislative Search
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience intelligent search with auto-suggestions, smart filters, and real-time results. 
            Find bills, legislators, and committees with powerful search capabilities.
          </p>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-blue-100 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Smart Suggestions</h3>
                <p className="text-sm text-gray-600">AI-powered search suggestions as you type</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-green-100 mb-2">
                  <Filter className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Advanced Filters</h3>
                <p className="text-sm text-gray-600">Filter by type, chamber, status, and more</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-purple-100 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Real-time Results</h3>
                <p className="text-sm text-gray-600">Instant search results with relevance scoring</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-orange-100 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Trending Topics</h3>
                <p className="text-sm text-gray-600">Discover what others are searching for</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Search Component */}
        <EnhancedSearch />

        {/* Search Features Documentation */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Search Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Bills & Legislation</h4>
                    <p className="text-sm text-gray-600">
                      Search through 1,017+ authentic Texas bills with full-text search and metadata filtering.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Legislators</h4>
                    <p className="text-sm text-gray-600">
                      Find representatives by name, district, party, or committee membership.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Committees</h4>
                    <p className="text-sm text-gray-600">
                      Explore committee structures, hearings, and membership information.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Smart Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Intelligent Suggestions</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Auto-complete based on search patterns</li>
                    <li>• Trending searches updated daily</li>
                    <li>• Search history for quick access</li>
                    <li>• Context-aware recommendations</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Advanced Filtering</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Filter by document type and status</li>
                    <li>• Chamber-specific searches</li>
                    <li>• Date range and priority filtering</li>
                    <li>• Party affiliation and committee filters</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Keyboard Shortcuts</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+K</kbd> Quick search</li>
                    <li>• <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> Execute search</li>
                    <li>• <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> Clear search</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Examples */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Search className="w-5 h-5" />
              Try These Search Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-blue-900 mb-3">Find Bills</h4>
                <div className="space-y-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "education funding"
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "healthcare reform"
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "infrastructure investment"
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900 mb-3">Find Legislators</h4>
                <div className="space-y-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "Rep. Abbott"
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "District 21"
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "Republican senators"
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900 mb-3">Find Committees</h4>
                <div className="space-y-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "education committee"
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "appropriations"
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300">
                    "judiciary hearings"
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Source Information */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Real-Time Government Data</h3>
                <p className="text-green-700 mb-3">
                  Search results connect directly to official Texas government databases including OpenStates, 
                  LegiScan, and the Federal Election Commission for the most current and accurate information.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-800">Live Updates</Badge>
                  <Badge className="bg-green-100 text-green-800">Official Sources</Badge>
                  <Badge className="bg-green-100 text-green-800">Verified Data</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}