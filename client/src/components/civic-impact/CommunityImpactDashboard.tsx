import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Map, 
  Building2, 
  GraduationCap, 
  HeartPulse, 
  DollarSign, 
  Scale, 
  Leaf, 
  Loader2 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

// Types for community impact data
interface LegislativeSentiment {
  category: string;
  support: number;
  neutral: number;
  against: number;
}

interface RegionalParticipation {
  region: string;
  participationRate: number;
  activeBills: number;
  population: number;
}

interface DemographicBreakdown {
  ageGroup: string;
  participationPercentage: number;
  value: number;
}

interface BillCategoryEngagement {
  category: string;
  engagementScore: number;
  communitySize: number;
  color: string;
}

interface TopContributors {
  name: string;
  contributions: number;
  impactScore: number;
  reachMultiplier: number;
}

interface CommunityGrowthData {
  date: string;
  newMembers: number;
  activeMembers: number;
  billDiscussions: number;
}

interface CommunityImpactData {
  overview: {
    totalMembers: number;
    activeMembersPercent: number;
    averageEngagementScore: number;
    billsCovered: number;
    totalActions: number;
    growthRate: number;
    verificationRate: number;
  };
  legislativeSentiment: LegislativeSentiment[];
  regionalParticipation: RegionalParticipation[];
  demographicBreakdown: DemographicBreakdown[];
  billCategoryEngagement: BillCategoryEngagement[];
  topContributors: TopContributors[];
  communityGrowth: CommunityGrowthData[];
  legislativeCategories: {
    name: string;
    color: string;
    billCount: number;
  }[];
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
  "#82CA9D", "#A4DE6C", "#D0ED57", "#FFC658", "#FF7A5A"
];

// Mock data for development
const MOCK_DATA: CommunityImpactData = {
  overview: {
    totalMembers: 2845,
    activeMembersPercent: 68,
    averageEngagementScore: 72,
    billsCovered: 253,
    totalActions: 18763,
    growthRate: 15,
    verificationRate: 86
  },
  legislativeSentiment: [
    { category: "Education", support: 65, neutral: 20, against: 15 },
    { category: "Healthcare", support: 58, neutral: 22, against: 20 },
    { category: "Environment", support: 72, neutral: 18, against: 10 },
    { category: "Economy", support: 45, neutral: 30, against: 25 },
    { category: "Criminal Justice", support: 52, neutral: 28, against: 20 },
    { category: "Infrastructure", support: 60, neutral: 25, against: 15 }
  ],
  regionalParticipation: [
    { region: "North Austin", participationRate: 75, activeBills: 130, population: 180000 },
    { region: "South Austin", participationRate: 68, activeBills: 115, population: 165000 },
    { region: "East Austin", participationRate: 62, activeBills: 95, population: 125000 },
    { region: "West Austin", participationRate: 70, activeBills: 120, population: 155000 },
    { region: "Downtown", participationRate: 80, activeBills: 140, population: 95000 },
    { region: "Northwest", participationRate: 65, activeBills: 105, population: 140000 },
    { region: "Southwest", participationRate: 72, activeBills: 125, population: 150000 }
  ],
  demographicBreakdown: [
    { ageGroup: "18-24", participationPercentage: 18, value: 512 },
    { ageGroup: "25-34", participationPercentage: 32, value: 911 },
    { ageGroup: "35-44", participationPercentage: 24, value: 683 },
    { ageGroup: "45-54", participationPercentage: 12, value: 341 },
    { ageGroup: "55-64", participationPercentage: 9, value: 256 },
    { ageGroup: "65+", participationPercentage: 5, value: 142 }
  ],
  billCategoryEngagement: [
    { category: "Education", engagementScore: 85, communitySize: 750, color: "#0088FE" },
    { category: "Healthcare", engagementScore: 72, communitySize: 680, color: "#00C49F" },
    { category: "Environment", engagementScore: 78, communitySize: 580, color: "#FFBB28" },
    { category: "Economy", engagementScore: 62, communitySize: 520, color: "#FF8042" },
    { category: "Criminal Justice", engagementScore: 68, communitySize: 450, color: "#8884D8" },
    { category: "Infrastructure", engagementScore: 58, communitySize: 380, color: "#82CA9D" }
  ],
  topContributors: [
    { name: "Alexandra R.", contributions: 287, impactScore: 92, reachMultiplier: 3.2 },
    { name: "Marcus T.", contributions: 265, impactScore: 88, reachMultiplier: 2.9 },
    { name: "Sophia C.", contributions: 243, impactScore: 85, reachMultiplier: 2.7 },
    { name: "Leon J.", contributions: 221, impactScore: 81, reachMultiplier: 2.5 },
    { name: "Maria G.", contributions: 204, impactScore: 78, reachMultiplier: 2.3 }
  ],
  communityGrowth: [
    { date: "2024-05", newMembers: 180, activeMembers: 1700, billDiscussions: 2800 },
    { date: "2024-06", newMembers: 210, activeMembers: 1780, billDiscussions: 3100 },
    { date: "2024-07", newMembers: 195, activeMembers: 1850, billDiscussions: 2950 },
    { date: "2024-08", newMembers: 220, activeMembers: 1920, billDiscussions: 3250 },
    { date: "2024-09", newMembers: 240, activeMembers: 2050, billDiscussions: 3500 },
    { date: "2024-10", newMembers: 265, activeMembers: 2180, billDiscussions: 3850 },
    { date: "2024-11", newMembers: 285, activeMembers: 2320, billDiscussions: 4100 },
    { date: "2024-12", newMembers: 310, activeMembers: 2500, billDiscussions: 4450 },
    { date: "2025-01", newMembers: 340, activeMembers: 2680, billDiscussions: 4800 },
    { date: "2025-02", newMembers: 320, activeMembers: 2750, billDiscussions: 4650 },
    { date: "2025-03", newMembers: 350, activeMembers: 2845, billDiscussions: 5000 }
  ],
  legislativeCategories: [
    { name: "Education", color: "#0088FE", billCount: 53 },
    { name: "Healthcare", color: "#00C49F", billCount: 47 },
    { name: "Environment", color: "#FFBB28", billCount: 42 },
    { name: "Economy", color: "#FF8042", billCount: 35 },
    { name: "Criminal Justice", color: "#8884D8", billCount: 30 },
    { name: "Infrastructure", color: "#82CA9D", billCount: 25 },
    { name: "Housing", color: "#A4DE6C", billCount: 21 }
  ]
};

export default function CommunityImpactDashboard() {
  // Fetch data
  const { data, isLoading, isError } = useQuery<CommunityImpactData>({
    queryKey: ['/api/civic-engagement/community-impact-dashboard'],
  });

  const DEVELOPMENT_MODE = true;
  const effectiveData = (isError || !data) && DEVELOPMENT_MODE ? MOCK_DATA : (data || MOCK_DATA);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError && !DEVELOPMENT_MODE) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Unable to load community impact data</h2>
        <p className="mb-4">There was an error retrieving community engagement metrics. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Calculate total engagement by demographic
  const totalDemographicEngagement = effectiveData.demographicBreakdown.reduce(
    (acc, item) => acc + item.participationPercentage, 0
  );

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-screen-xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Community Impact Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize how the Act Up community is influencing legislative awareness and civic engagement.
        </p>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Community Size</p>
                <p className="text-2xl font-bold mt-1">{effectiveData.overview.totalMembers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span>Active members</span>
                <span className="font-medium">{effectiveData.overview.activeMembersPercent}%</span>
              </div>
              <Progress value={effectiveData.overview.activeMembersPercent} className="h-1.5 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bills Covered</p>
                <p className="text-2xl font-bold mt-1">{effectiveData.overview.billsCovered}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">{effectiveData.overview.growthRate}%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Score</p>
                <p className="text-2xl font-bold mt-1">{effectiveData.overview.averageEngagementScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span>Community Average</span>
                <span className="font-medium">{effectiveData.overview.averageEngagementScore}/100</span>
              </div>
              <Progress value={effectiveData.overview.averageEngagementScore} className="h-1.5 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold mt-1">{effectiveData.overview.totalActions.toLocaleString()}</p>
              </div>
              <Map className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span>Verification Rate</span>
                <span className="font-medium">{effectiveData.overview.verificationRate}%</span>
              </div>
              <Progress value={effectiveData.overview.verificationRate} className="h-1.5 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regional">Regional Impact</TabsTrigger>
          <TabsTrigger value="demographic">Demographic Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Community Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Community Growth and Engagement</CardTitle>
                <CardDescription>
                  Track community membership growth and engagement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={effectiveData.communityGrowth}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="activeMembers"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="Active Members"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="newMembers"
                        stroke="#82ca9d"
                        name="New Members"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="billDiscussions"
                        stroke="#ffc658"
                        name="Bill Discussions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bill Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Legislation Categories</CardTitle>
                <CardDescription>
                  Distribution of bills by primary policy area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={effectiveData.legislativeCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="billCount"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {effectiveData.legislativeCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Bills`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Legislative Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Legislative Sentiment Analysis</CardTitle>
                <CardDescription>
                  Community sentiment on bills by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={effectiveData.legislativeSentiment}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="support" stackId="a" fill="#4CAF50" name="Support" />
                      <Bar dataKey="neutral" stackId="a" fill="#9E9E9E" name="Neutral" />
                      <Bar dataKey="against" stackId="a" fill="#F44336" name="Against" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Community Contributors</CardTitle>
              <CardDescription>
                Members with the highest engagement and impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {effectiveData.topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                        {contributor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">{contributor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contributor.contributions} contributions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Impact Score: {contributor.impactScore}</div>
                      <div className="text-xs text-muted-foreground">
                        {contributor.reachMultiplier}x reach multiplier
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Impact Tab */}
        <TabsContent value="regional" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Participation */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Regional Civic Participation</CardTitle>
                <CardDescription>
                  Engagement rates across different regions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={effectiveData.regionalParticipation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="region" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="participationRate"
                        fill="#8884d8"
                        name="Participation Rate (%)"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="activeBills"
                        fill="#82ca9d"
                        name="Active Bills"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Regional Distribution Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>
                  Geographic distribution of civic engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                  <div className="text-center">
                    <Map className="h-12 w-12 text-primary mx-auto mb-3 opacity-70" />
                    <p className="text-muted-foreground">
                      Interactive map visualization would go here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Region-Specific Policy Interests */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Policy Interests</CardTitle>
                <CardDescription>
                  Top policy areas by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">North Austin</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Education</span>
                        <div className="ml-auto text-sm font-medium">78%</div>
                      </div>
                      <div className="flex items-center">
                        <HeartPulse className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Healthcare</span>
                        <div className="ml-auto text-sm font-medium">65%</div>
                      </div>
                      <div className="flex items-center">
                        <Leaf className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Environment</span>
                        <div className="ml-auto text-sm font-medium">62%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">South Austin</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center">
                        <Leaf className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Environment</span>
                        <div className="ml-auto text-sm font-medium">82%</div>
                      </div>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Housing</span>
                        <div className="ml-auto text-sm font-medium">75%</div>
                      </div>
                      <div className="flex items-center">
                        <Scale className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Criminal Justice</span>
                        <div className="ml-auto text-sm font-medium">58%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Downtown</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Economy</span>
                        <div className="ml-auto text-sm font-medium">86%</div>
                      </div>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Housing</span>
                        <div className="ml-auto text-sm font-medium">79%</div>
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-primary opacity-70" />
                        <span className="text-sm">Education</span>
                        <div className="ml-auto text-sm font-medium">52%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographic Insights Tab */}
        <TabsContent value="demographic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demographic Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Demographic Breakdown</CardTitle>
                <CardDescription>
                  Participation by age group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={effectiveData.demographicBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="participationPercentage"
                        nameKey="ageGroup"
                        label={({ name, percent }) => `${name}: ${(Number(percent) * 100 / totalDemographicEngagement).toFixed(0)}%`}
                      >
                        {effectiveData.demographicBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const numValue = Number(value);
                          const percentage = (numValue * 100 / totalDemographicEngagement).toFixed(1);
                          const members = props?.payload?.value;
                          return [`${percentage}% (${members} members)`, name];
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bill Category Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>Bill Category Engagement</CardTitle>
                <CardDescription>
                  Engagement scores across policy areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={effectiveData.billCategoryEngagement}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="engagementScore" name="Engagement Score">
                        {effectiveData.billCategoryEngagement.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Growth by Demographic */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Engagement Growth by Demographic</CardTitle>
                <CardDescription>
                  Month-over-month growth in community participation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={effectiveData.communityGrowth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="activeMembers"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Active Members"
                      />
                      <Area
                        type="monotone"
                        dataKey="newMembers"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="New Members"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}