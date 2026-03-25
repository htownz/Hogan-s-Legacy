import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ResponsiveContainer,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  BarChart3,
  Globe,
  Target
} from "lucide-react";

interface LiveMetric {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface ActivityFeed {
  id: string;
  type: 'bill_introduced' | 'committee_action' | 'vote_scheduled' | 'amendment_proposed';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  chamber: 'House' | 'Senate';
}

interface HeatmapData {
  day: string;
  hour: number;
  activity: number;
  bills: number;
}

export default function RealTimeAnalyticsDashboard() {
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch real-time metrics
  const { data: liveMetrics, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ["/api/analytics/live-metrics", timeRange],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  // Fetch activity feed
  const { data: activityFeed, isLoading: activityLoading } = useQuery<any>({
    queryKey: ["/api/analytics/activity-feed"],
    refetchInterval: autoRefresh ? 15000 : false, // Auto-refresh every 15 seconds
  });

  // Fetch heatmap data
  const { data: heatmapData, isLoading: heatmapLoading } = useQuery<any>({
    queryKey: ["/api/analytics/activity-heatmap", timeRange],
  });

  // Mock data for demonstration
  const mockLiveMetrics: LiveMetric[] = [
    {
      label: "Active Bills",
      value: 342,
      change: 12,
      trend: 'up',
      icon: FileText,
      color: "text-blue-600"
    },
    {
      label: "Committee Actions",
      value: 28,
      change: -3,
      trend: 'down',
      icon: Users,
      color: "text-green-600"
    },
    {
      label: "Votes Today",
      value: 15,
      change: 8,
      trend: 'up',
      icon: Target,
      color: "text-purple-600"
    },
    {
      label: "Amendments",
      value: 47,
      change: 5,
      trend: 'up',
      icon: Activity,
      color: "text-orange-600"
    }
  ];

  const mockActivityFeed: ActivityFeed[] = [
    {
      id: "1",
      type: "bill_introduced",
      title: "HB 3892 - Education Funding Reform",
      description: "New bill introduced by Rep. Johnson addressing rural school funding disparities",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      priority: "high",
      chamber: "House"
    },
    {
      id: "2",
      type: "committee_action",
      title: "SB 1847 - Healthcare Access",
      description: "Passed committee vote 7-2, scheduled for floor debate",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      priority: "critical",
      chamber: "Senate"
    },
    {
      id: "3",
      type: "vote_scheduled",
      title: "HB 2156 - Infrastructure Investment",
      description: "Floor vote scheduled for tomorrow at 2:00 PM",
      timestamp: new Date(Date.now() - 32 * 60 * 1000),
      priority: "medium",
      chamber: "House"
    },
    {
      id: "4",
      type: "amendment_proposed",
      title: "SB 987 - Environmental Protection",
      description: "Amendment 23A proposed by Sen. Martinez to expand green energy provisions",
      timestamp: new Date(Date.now() - 47 * 60 * 1000),
      priority: "medium",
      chamber: "Senate"
    }
  ];

  const mockHourlyActivity = [
    { hour: "00", bills: 2, votes: 0, amendments: 1 },
    { hour: "01", bills: 1, votes: 0, amendments: 0 },
    { hour: "02", bills: 0, votes: 0, amendments: 0 },
    { hour: "03", bills: 1, votes: 0, amendments: 0 },
    { hour: "04", bills: 0, votes: 0, amendments: 1 },
    { hour: "05", bills: 2, votes: 0, amendments: 0 },
    { hour: "06", bills: 3, votes: 1, amendments: 2 },
    { hour: "07", bills: 5, votes: 2, amendments: 3 },
    { hour: "08", bills: 8, votes: 4, amendments: 5 },
    { hour: "09", bills: 12, votes: 6, amendments: 7 },
    { hour: "10", bills: 15, votes: 8, amendments: 9 },
    { hour: "11", bills: 18, votes: 12, amendments: 11 },
    { hour: "12", bills: 22, votes: 15, amendments: 13 },
    { hour: "13", bills: 25, votes: 18, amendments: 15 },
    { hour: "14", bills: 28, votes: 22, amendments: 18 },
    { hour: "15", bills: 24, votes: 19, amendments: 16 },
    { hour: "16", bills: 21, votes: 16, amendments: 14 },
    { hour: "17", bills: 18, votes: 13, amendments: 12 },
    { hour: "18", bills: 12, votes: 8, amendments: 8 },
    { hour: "19", bills: 8, votes: 5, amendments: 5 },
    { hour: "20", bills: 5, votes: 2, amendments: 3 },
    { hour: "21", bills: 3, votes: 1, amendments: 2 },
    { hour: "22", bills: 2, votes: 0, amendments: 1 },
    { hour: "23", bills: 1, votes: 0, amendments: 0 }
  ];

  const getActivityIcon = (type: ActivityFeed['type']) => {
    switch (type) {
      case 'bill_introduced': return <FileText className="h-4 w-4" />;
      case 'committee_action': return <Users className="h-4 w-4" />;
      case 'vote_scheduled': return <Target className="h-4 w-4" />;
      case 'amendment_proposed': return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: ActivityFeed['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable': return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                ⚡ Real-Time Legislative Analytics
              </h1>
              <p className="text-lg text-muted-foreground">
                Live insights and activity monitoring for Texas Legislature
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-muted-foreground">
                  {autoRefresh ? 'Live' : 'Paused'}
                </span>
              </div>
              <Button
                variant={autoRefresh ? "destructive" : "default"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Pause' : 'Resume'} Auto-Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockLiveMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {getTrendIcon(metric.trend)}
                    <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                      {metric.change > 0 ? '+' : ''}{metric.change} since last hour
                    </span>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                  metric.trend === 'up' ? 'bg-green-500' : 
                  metric.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>Real-time legislative events and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {mockActivityFeed.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          activity.chamber === 'House' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            <Badge className={`text-xs ${getPriorityColor(activity.priority)}`}>
                              {activity.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.chamber}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Today's Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bills Introduced</span>
                  <span className="font-bold">23</span>
                </div>
                <Progress value={76} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Committee Votes</span>
                  <span className="font-bold">8</span>
                </div>
                <Progress value={53} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amendments</span>
                  <span className="font-bold">15</span>
                </div>
                <Progress value={62} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Public Hearings</span>
                  <span className="font-bold">4</span>
                </div>
                <Progress value={40} className="h-2" />
              </CardContent>
            </Card>

            {/* Chamber Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Chamber Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">House</span>
                      <span className="text-sm text-muted-foreground">68% active</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Senate</span>
                      <span className="text-sm text-muted-foreground">82% active</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">156</div>
                      <div className="text-xs text-muted-foreground">House Bills</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">89</div>
                      <div className="text-xs text-muted-foreground">Senate Bills</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Collection</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Status</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">Healthy</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Real-time Sync</span>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs text-yellow-600">Delayed</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Heatmap */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              24-Hour Activity Pattern
            </CardTitle>
            <CardDescription>Legislative activity distribution throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockHourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="bills" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Bills" />
                <Area type="monotone" dataKey="votes" stackId="1" stroke="#10b981" fill="#10b981" name="Votes" />
                <Area type="monotone" dataKey="amendments" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Amendments" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}