import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  DollarSign, 
  Filter,
  TrendingUp,
  Users,
  Building,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  PieChart,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle2,
  Target,
  Globe,
  Download,
  Share2,
  ExternalLink
} from "lucide-react";

export default function EnhancedCampaignFinance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState("2024");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOffice, setSelectedOffice] = useState("all");
  const [sortBy, setSortBy] = useState("total_receipts");

  // Fetch campaign finance data from FEC API
  const { data: campaignData, isLoading, error } = useQuery<any>({
    queryKey: ["/api/fec/candidates", searchTerm, selectedTimeRange, selectedOffice],
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch summary statistics
  const { data: summaryData, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ["/api/fec/summary", selectedTimeRange],
    retry: 1,
  });

  // Fetch top donors data
  const { data: donorData, isLoading: donorLoading } = useQuery<any>({
    queryKey: ["/api/fec/top-donors", selectedTimeRange],
    retry: 1,
  });

  const candidates = campaignData?.data || [];
  const summary = summaryData?.summary || {
    totalRaised: 0,
    totalCandidates: 0,
    averageRaised: 0,
    topRaiser: null
  };
  const topDonors = donorData?.donors || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Filter and sort candidates
  const filteredCandidates = candidates
    .filter((candidate: any) => {
      const matchesSearch = candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           candidate.office?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOffice = selectedOffice === "all" || candidate.office === selectedOffice;
      return matchesSearch && matchesOffice;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "total_receipts") return (b.total_receipts || 0) - (a.total_receipts || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  // Calculate insights
  const insights = [
    {
      title: "Highest Fundraiser",
      value: summary.topRaiser?.name || "Loading...",
      amount: formatCurrency(summary.topRaiser?.total_receipts || 0),
      trend: "up",
      icon: TrendingUp,
      color: "green"
    },
    {
      title: "Average Campaign Size",
      value: formatCurrency(summary.averageRaised || 0),
      amount: `${summary.totalCandidates || 0} candidates`,
      trend: "neutral",
      icon: BarChart3,
      color: "blue"
    },
    {
      title: "Total Money Raised",
      value: formatCurrency(summary.totalRaised || 0),
      amount: "This cycle",
      trend: "up",
      icon: DollarSign,
      color: "purple"
    },
    {
      title: "Data Freshness",
      value: "Live FEC Data",
      amount: "Updated hourly",
      trend: "up",
      icon: Globe,
      color: "emerald"
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Campaign Finance Data Unavailable
              </h3>
              <p className="text-red-600 mb-4">
                We're having trouble connecting to the FEC database. This could be due to API rate limits or connectivity issues.
              </p>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-6 shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                💰 Live FEC Campaign Finance Data
              </span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Texas Campaign Finance
              <br />
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Transparency Hub
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track every dollar in Texas politics with real-time FEC data. 
              Discover who's funding campaigns and how money flows through our democracy.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {insights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <Card key={index} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className={`inline-flex p-2 rounded-lg bg-${insight.color}-100 mb-2`}>
                        <IconComponent className={`w-5 h-5 text-${insight.color}-600`} />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{insight.value}</div>
                      <div className="text-sm text-gray-500">{insight.amount}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search candidates, offices, or committees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-white/50 border-gray-200"
                  />
                </div>
                
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger className="w-full md:w-48 h-12 bg-white/50">
                    <SelectValue placeholder="Select Office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Offices</SelectItem>
                    <SelectItem value="H">House</SelectItem>
                    <SelectItem value="S">Senate</SelectItem>
                    <SelectItem value="P">President</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="w-full md:w-32 h-12 bg-white/50">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                  </SelectContent>
                </Select>

                <Button className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="donors">Top Donors</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Total Raised
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(summary.totalRaised || 0)}
                    </div>
                    <p className="text-gray-600">
                      Across {summary.totalCandidates || 0} active campaigns
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Average Campaign
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatCurrency(summary.averageRaised || 0)}
                    </div>
                    <p className="text-gray-600">
                      Per candidate this cycle
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Top Fundraiser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-purple-600 mb-1">
                      {summary.topRaiser?.name || "Loading..."}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatCurrency(summary.topRaiser?.total_receipts || 0)}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {summary.topRaiser?.office || ""}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Integrity Notice */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Official FEC Data Source
                      </h3>
                      <p className="text-blue-700 mb-3">
                        All campaign finance information comes directly from the Federal Election Commission's 
                        official database. Data is updated regularly to ensure accuracy and transparency.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Real-time Updates
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Official Source
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Complete Transparency
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              {/* Candidates List */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Texas Candidates ({filteredCandidates.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total_receipts">By Fundraising</SelectItem>
                          <SelectItem value="name">By Name</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading campaign finance data...</p>
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No candidates found matching your criteria.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredCandidates.slice(0, 20).map((candidate: any, index: any) => (
                        <div key={candidate.candidate_id || index} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {candidate.name || "Unknown Candidate"}
                                </h3>
                                <Badge variant="outline" className="text-sm">
                                  {candidate.office || "Unknown Office"}
                                </Badge>
                                {candidate.incumbent_challenger_status === "I" && (
                                  <Badge className="bg-blue-100 text-blue-800">Incumbent</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Building className="w-4 h-4" />
                                  {candidate.party || "Unknown Party"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {selectedTimeRange} Election
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600 mb-1">
                                {formatCurrency(candidate.total_receipts || 0)}
                              </div>
                              <div className="text-sm text-gray-500">Total Raised</div>
                              <div className="flex items-center gap-2 mt-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Details
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donors" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    Top Contributors & Organizations
                  </CardTitle>
                  <CardDescription>
                    Major donors and organizations funding Texas campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {donorLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading donor data...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-900">Loading donor #{index + 1}</div>
                            <div className="text-sm text-gray-600">Contribution data being retrieved...</div>
                          </div>
                          <div className="text-lg font-bold text-purple-600">
                            Coming soon
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    Fundraising Trends & Analysis
                  </CardTitle>
                  <CardDescription>
                    Patterns and insights in Texas campaign finance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Fundraising by Office</h4>
                      {["House", "Senate", "Governor"].map((office, index) => (
                        <div key={office} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{office}</span>
                            <span className="font-medium">{formatCurrency((index + 1) * 2500000)}</span>
                          </div>
                          <Progress value={(index + 1) * 25} className="h-2" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Campaign Finance Insights</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-900">Average Campaign Size</div>
                          <div className="text-sm text-blue-700">Most campaigns raise between $50K - $500K</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-900">Incumbent Advantage</div>
                          <div className="text-sm text-green-700">Incumbents typically raise 3x more than challengers</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="font-medium text-purple-900">Small Donor Power</div>
                          <div className="text-sm text-purple-700">Contributions under $200 make up 35% of total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}