import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  FileText, 
  AlertTriangle,
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Download,
  Zap,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  MapPin
} from "lucide-react";

interface LegislativeMetrics {
  totalBills: number;
  activeBills: number;
  passedBills: number;
  failedBills: number;
  committeeBills: number;
  averageProcessingDays: number;
  bipartisanBills: number;
  controversialBills: number;
}

interface TrendData {
  month: string;
  introduced: number;
  passed: number;
  failed: number;
  active: number;
}

interface PartyBreakdown {
  party: string;
  bills: number;
  passRate: number;
  avgDays: number;
  color: string;
}

interface TopicAnalysis {
  topic: string;
  count: number;
  trend: string;
  impact: number;
  urgency: string;
}

interface PredictiveInsight {
  billId: string;
  title: string;
  passageProbability: number;
  timeToVote: number;
  keyFactors: string[];
  riskLevel: string;
}

export default function AdvancedAnalyticsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months");
  const [selectedChamber, setSelectedChamber] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/advanced-analytics/overview", selectedTimeframe, selectedChamber, selectedCategory],
  });

  // Fetch trend analysis
  const { data: trends, isLoading: trendsLoading } = useQuery<any>({
    queryKey: ["/api/advanced-analytics/trends", selectedTimeframe],
  });

  // Fetch predictive insights
  const { data: predictions, isLoading: predictionsLoading } = useQuery<any>({
    queryKey: ["/api/advanced-analytics/predictions"],
  });

  // Mock data for demonstration
  const mockMetrics: LegislativeMetrics = {
    totalBills: 1247,
    activeBills: 342,
    passedBills: 189,
    failedBills: 67,
    committeeBills: 649,
    averageProcessingDays: 89,
    bipartisanBills: 123,
    controversialBills: 34
  };

  const mockTrends: TrendData[] = [
    { month: "Jul", introduced: 45, passed: 12, failed: 8, active: 25 },
    { month: "Aug", introduced: 62, passed: 18, failed: 11, active: 33 },
    { month: "Sep", introduced: 78, passed: 24, failed: 15, active: 39 },
    { month: "Oct", introduced: 93, passed: 31, failed: 19, active: 43 },
    { month: "Nov", introduced: 67, passed: 22, failed: 13, active: 32 },
    { month: "Dec", introduced: 54, passed: 16, failed: 9, active: 29 }
  ];

  const mockPartyData: PartyBreakdown[] = [
    { party: "Republican", bills: 687, passRate: 76, avgDays: 82, color: "#ef4444" },
    { party: "Democrat", bills: 423, passRate: 68, avgDays: 94, color: "#3b82f6" },
    { party: "Independent", bills: 31, passRate: 58, avgDays: 107, color: "#10b981" },
    { party: "Bipartisan", bills: 106, passRate: 84, avgDays: 71, color: "#8b5cf6" }
  ];

  const mockTopics: TopicAnalysis[] = [
    { topic: "Education", count: 156, trend: "up", impact: 85, urgency: "high" },
    { topic: "Healthcare", count: 134, trend: "up", impact: 92, urgency: "critical" },
    { topic: "Budget", count: 89, trend: "down", impact: 78, urgency: "medium" },
    { topic: "Environment", count: 67, trend: "up", impact: 71, urgency: "high" },
    { topic: "Transportation", count: 54, trend: "stable", impact: 65, urgency: "medium" },
    { topic: "Criminal Justice", count: 43, trend: "down", impact: 82, urgency: "high" }
  ];

  const mockPredictions: PredictiveInsight[] = [
    {
      billId: "HB-2847",
      title: "Texas Education Funding Reform Act",
      passageProbability: 87,
      timeToVote: 23,
      keyFactors: ["Bipartisan support", "Economic impact", "Rural district backing"],
      riskLevel: "low"
    },
    {
      billId: "SB-1492",
      title: "Healthcare Access Expansion Bill",
      passageProbability: 64,
      timeToVote: 45,
      keyFactors: ["Urban support", "Cost concerns", "Federal alignment"],
      riskLevel: "medium"
    },
    {
      billId: "HB-3156",
      title: "Environmental Protection Standards",
      passageProbability: 38,
      timeToVote: 67,
      keyFactors: ["Industry opposition", "Environmental groups support", "Economic concerns"],
      riskLevel: "high"
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-600 bg-green-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "high": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            📊 Advanced Legislative Analytics
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time insights, predictive analysis, and comprehensive data visualization for Texas legislation
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedChamber} onValueChange={setSelectedChamber}>
            <SelectTrigger>
              <SelectValue placeholder="Select chamber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Both Chambers</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="senate">Senate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
            </SelectContent>
          </Select>

          <Button className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockMetrics.totalBills.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Bills</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockMetrics.activeBills}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently in process
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((mockMetrics.passedBills / (mockMetrics.passedBills + mockMetrics.failedBills)) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Success rate this session
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Process Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockMetrics.averageProcessingDays}</div>
                  <p className="text-xs text-muted-foreground">
                    Days to completion
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bill Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Bill Status Distribution</CardTitle>
                  <CardDescription>Current status of all bills in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Active", value: mockMetrics.activeBills, fill: "#3b82f6" },
                          { name: "Passed", value: mockMetrics.passedBills, fill: "#10b981" },
                          { name: "Failed", value: mockMetrics.failedBills, fill: "#ef4444" },
                          { name: "In Committee", value: mockMetrics.committeeBills, fill: "#f59e0b" }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Party Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Party Performance</CardTitle>
                  <CardDescription>Success rates by political party</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockPartyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="party" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="passRate" fill="#3b82f6" name="Pass Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Legislative Activity Trends</CardTitle>
                <CardDescription>Bill introduction and passage trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={mockTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="introduced" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Introduced" />
                    <Area type="monotone" dataKey="passed" stackId="2" stroke="#10b981" fill="#10b981" name="Passed" />
                    <Area type="monotone" dataKey="failed" stackId="3" stroke="#ef4444" fill="#ef4444" name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Efficiency</CardTitle>
                  <CardDescription>Average days to process bills by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="active" stroke="#8b5cf6" strokeWidth={3} name="Active Bills" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bipartisan Collaboration</CardTitle>
                  <CardDescription>Cross-party bill sponsorship trends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bipartisan Bills</span>
                    <span className="text-2xl font-bold">{mockMetrics.bipartisanBills}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    65% increase from last session
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {mockPredictions.map((prediction, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{prediction.title}</CardTitle>
                        <CardDescription>Bill ID: {prediction.billId}</CardDescription>
                      </div>
                      <Badge className={getRiskColor(prediction.riskLevel)}>
                        {prediction.riskLevel} risk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm font-medium mb-2">Passage Probability</div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {prediction.passageProbability}%
                        </div>
                        <Progress value={prediction.passageProbability} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Estimated Time to Vote</div>
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {prediction.timeToVote}
                        </div>
                        <p className="text-sm text-muted-foreground">days</p>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Key Factors</div>
                        <div className="space-y-1">
                          {prediction.keyFactors.map((factor, factorIndex) => (
                            <Badge key={factorIndex} variant="outline" className="mr-1">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTopics.map((topic, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{topic.topic}</CardTitle>
                      {getTrendIcon(topic.trend)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold">{topic.count}</div>
                        <p className="text-sm text-muted-foreground">bills this session</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Impact Score</span>
                          <span>{topic.impact}/100</span>
                        </div>
                        <Progress value={topic.impact} className="h-2" />
                      </div>
                      
                      <Badge variant={topic.urgency === "critical" ? "destructive" : topic.urgency === "high" ? "default" : "secondary"}>
                        {topic.urgency} urgency
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Legislative Efficiency Metrics</CardTitle>
                  <CardDescription>Key performance indicators for the legislative process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <div className="text-sm text-muted-foreground">Committee Efficiency</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">76%</div>
                      <div className="text-sm text-muted-foreground">Amendment Success</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">92%</div>
                      <div className="text-sm text-muted-foreground">Public Engagement</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">67%</div>
                      <div className="text-sm text-muted-foreground">Media Coverage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Real-time Activity Feed</CardTitle>
                  <CardDescription>Latest legislative activities and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {[
                        { action: "Bill HB-2847 passed committee vote", time: "2 hours ago", type: "success" },
                        { action: "SB-1492 scheduled for floor debate", time: "4 hours ago", type: "info" },
                        { action: "Amendment proposed for HB-3156", time: "6 hours ago", type: "warning" },
                        { action: "Public hearing scheduled for SB-2001", time: "8 hours ago", type: "info" },
                        { action: "Bill HB-1829 withdrawn by sponsor", time: "12 hours ago", type: "error" },
                        { action: "Committee markup session completed", time: "1 day ago", type: "success" }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === "success" ? "bg-green-500" :
                            activity.type === "warning" ? "bg-yellow-500" :
                            activity.type === "error" ? "bg-red-500" : "bg-blue-500"
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}