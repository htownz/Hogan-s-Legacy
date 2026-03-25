import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bell, 
  Users, 
  FileText, 
  TrendingUp, 
  MapPin,
  Calendar,
  Gavel,
  AlertCircle,
  CheckCircle,
  Clock,
  Heart,
  Target,
  Settings,
  Plus,
  ArrowRight,
  Eye,
  BarChart3
} from "lucide-react";

interface PersonalizedData {
  user: {
    name: string;
    district: string;
    interests: string[];
    joinDate: string;
  };
  dashboard: {
    trackedBills: number;
    followedReps: number;
    alertsToday: number;
    engagementScore: number;
  };
  recentActivity: Array<{
    type: string;
    title: string;
    date: string;
    status: string;
  }>;
  recommendedBills: Array<{
    id: string;
    title: string;
    chamber: string;
    relevanceScore: number;
    status: string;
  }>;
  yourRepresentatives: Array<{
    id: string;
    name: string;
    chamber: string;
    party: string;
    district: string;
    recentVotes: number;
  }>;
  upcomingEvents: Array<{
    type: string;
    title: string;
    date: string;
    committee?: string;
  }>;
}

export default function PersonalizedDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");

  // Load personalized dashboard data
  const { data: dashboardData, isLoading } = useQuery<any>({
    queryKey: ["/api/user/dashboard", selectedTimeframe],
    initialData: {
      user: {
        name: "Alex Johnson",
        district: "District 15",
        interests: ["Education Policy", "Healthcare", "Transportation"],
        joinDate: "2024-01-15"
      },
      dashboard: {
        trackedBills: 12,
        followedReps: 3,
        alertsToday: 5,
        engagementScore: 78
      },
      recentActivity: [
        { type: "bill_alert", title: "HB 2847 - Public School Funding", date: "2024-05-27", status: "new" },
        { type: "vote", title: "Your rep voted on SB 1523", date: "2024-05-26", status: "important" },
        { type: "committee", title: "Education Committee Meeting", date: "2024-05-25", status: "attended" }
      ],
      recommendedBills: [
        { id: "HB2847", title: "Public School Funding Reform", chamber: "House", relevanceScore: 95, status: "In Committee" },
        { id: "SB1523", title: "Healthcare Access Expansion", chamber: "Senate", relevanceScore: 89, status: "Passed House" },
        { id: "HB3421", title: "Transportation Infrastructure", chamber: "House", relevanceScore: 82, status: "Filed" }
      ],
      yourRepresentatives: [
        { id: "rep1", name: "Rep. Sarah Williams", chamber: "House", party: "Democrat", district: "District 15", recentVotes: 8 },
        { id: "sen1", name: "Sen. Michael Torres", chamber: "Senate", party: "Republican", district: "District 7", recentVotes: 12 },
        { id: "rep2", name: "Rep. James Chen", chamber: "House", party: "Democrat", district: "At-Large", recentVotes: 6 }
      ],
      upcomingEvents: [
        { type: "hearing", title: "Public Education Committee Hearing", date: "2024-05-28", committee: "Education" },
        { type: "vote", title: "Floor Vote on HB 2847", date: "2024-05-29" },
        { type: "meeting", title: "Town Hall with Rep. Williams", date: "2024-05-30" }
      ]
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500";
      case "important": return "bg-red-500";
      case "attended": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: "Highly Engaged", color: "text-green-400", icon: <TrendingUp className="h-4 w-4" /> };
    if (score >= 60) return { level: "Active Citizen", color: "text-blue-400", icon: <Target className="h-4 w-4" /> };
    if (score >= 40) return { level: "Getting Started", color: "text-yellow-400", icon: <Clock className="h-4 w-4" /> };
    return { level: "New Member", color: "text-gray-400", icon: <Users className="h-4 w-4" /> };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading your personalized dashboard...</div>
      </div>
    );
  }

  const engagement = getEngagementLevel(dashboardData.dashboard.engagementScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Welcome back, {dashboardData.user.name}!
            </h1>
            <p className="text-xl text-blue-200 mt-2 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {dashboardData.user.district} • {dashboardData.user.interests.length} Interests Tracked
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Bills Tracked</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.dashboard.trackedBills}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Representatives</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.dashboard.followedReps}</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Alerts Today</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.dashboard.alertsToday}</p>
                </div>
                <Bell className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Engagement</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.dashboard.engagementScore}%</p>
                  <div className={`flex items-center gap-1 text-sm ${engagement.color}`}>
                    {engagement.icon}
                    {engagement.level}
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={dashboardData.dashboard.engagementScore} className="h-2 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Bills & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Recommended Bills */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  Bills Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recommendedBills.map((bill: any) => (
                    <div key={bill.id} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{bill.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {bill.chamber}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {bill.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 font-semibold">{bill.relevanceScore}% match</div>
                          <Progress value={bill.relevanceScore} className="h-1 w-16 mt-1" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-200 text-sm">Matches your {dashboardData.user.interests[0]} interest</p>
                        <Button size="sm" variant="ghost" className="text-blue-400 hover:text-white">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity: any, index: any) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)}`} />
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-blue-200 text-sm">{activity.date}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-400">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Representatives & Events */}
          <div className="space-y-8">
            
            {/* Your Representatives */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  Your Representatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.yourRepresentatives.map((rep: any) => (
                    <div key={rep.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{rep.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {rep.chamber}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rep.party}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-200 text-sm">{rep.recentVotes} recent votes</p>
                        <Button size="sm" variant="ghost" className="text-purple-400 hover:text-white">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Voting Record
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-400" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingEvents.map((event: any, index: any) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{event.title}</h4>
                          <p className="text-blue-200 text-sm">{event.date}</p>
                          {event.committee && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {event.committee}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {event.type === "hearing" && <Gavel className="h-4 w-4 text-orange-400" />}
                          {event.type === "vote" && <CheckCircle className="h-4 w-4 text-green-400" />}
                          {event.type === "meeting" && <Users className="h-4 w-4 text-blue-400" />}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-orange-400 hover:text-white w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Calendar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Your Interests */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-400" />
                  Your Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.user.interests.map((interest: any, index: any) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white">{interest}</span>
                      <Badge className="bg-red-600 text-white">Active</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Interest
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}