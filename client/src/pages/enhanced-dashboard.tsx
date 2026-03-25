import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Gavel, 
  Calendar, 
  Bell, 
  FileText, 
  Megaphone, 
  BarChart2, 
  ArrowRight, 
  Video,
  User,
  TrendingUp,
  Eye,
  MessageSquare,
  Clock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernDashboard } from "@/components/dashboard/ModernDashboard";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user";

export default function EnhancedDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch user notifications
  const { data: notifications } = useQuery<any>({
    queryKey: ['/api/notifications', { limit: 5 }],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications?limit=5');
        if (!response.ok) throw new Error("Failed to fetch notifications");
        const data = await response.json();
        return data.notifications || [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    }
  });

  // Fetch active bills the user is following
  const { data: followedBills } = useQuery<any>({
    queryKey: ['/api/user/followed-bills'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/followed-bills?limit=5');
        if (!response.ok) return [];
        const data = await response.json();
        return data.bills || [];
      } catch (error) {
        console.error('Error fetching followed bills:', error);
        return [];
      }
    }
  });

  // Fetch committee meetings
  const { data: committeeMeetings } = useQuery<any>({
    queryKey: ['/api/committee-meetings/upcoming'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/committee-meetings/upcoming?limit=3');
        if (!response.ok) return [];
        const data = await response.json();
        return data.meetings || [];
      } catch (error) {
        console.error('Error fetching committee meetings:', error);
        return [];
      }
    }
  });

  // Fetch recent user actions
  const { data: userActions } = useQuery<any>({
    queryKey: ['/api/user/recent-actions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/recent-actions?limit=3');
        if (!response.ok) return [];
        const data = await response.json();
        return data.actions || [];
      } catch (error) {
        console.error('Error fetching user actions:', error);
        return [];
      }
    }
  });

  // Default data to use if API calls don't return actual data
  const defaultNotifications = Array(3).fill(null).map((_, i) => ({
    id: i,
    title: [
      "New bill matching your interests",
      "Committee hearing scheduled",
      "Action needed on followed legislation"
    ][i],
    content: [
      "SB 1234 has been filed and matches your interest in education.",
      "The Transportation Committee will discuss HB 5678 tomorrow at 10 AM.",
      "HB 9012 is scheduled for a vote. Contact your representative."
    ][i],
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    read: false,
    type: ["bill", "committee", "action"][i]
  }));

  const defaultFollowedBills = Array(3).fill(null).map((_, i) => ({
    id: i,
    billNumber: `SB ${1234 + i}`,
    title: [
      "Education Funding Act",
      "Transportation Infrastructure Bill",
      "Healthcare Access Improvement Act"
    ][i],
    status: ["Committee", "Floor Vote", "Passed"][i],
    lastUpdated: new Date(Date.now() - i * 86400000).toISOString(),
    chamber: ["senate", "house", "senate"][i]
  }));

  const defaultCommitteeMeetings = Array(3).fill(null).map((_, i) => ({
    id: i,
    committee: [
      "Education Committee", 
      "Finance Committee", 
      "Health & Human Services"
    ][i],
    date: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
    time: ["10:00 AM", "1:30 PM", "9:00 AM"][i],
    location: "Capitol Extension E1.012",
    agenda: ["SB 1234, HB 5678", "Budget Hearings", "Healthcare Legislation"][i]
  }));

  const defaultUserActions = Array(3).fill(null).map((_, i) => ({
    id: i,
    type: ["comment", "follow", "share"][i],
    target: ["SB 1234", "Education Committee", "Healthcare Infographic"][i],
    date: new Date(Date.now() - i * 43200000).toISOString(),
    impact: Math.floor(Math.random() * 50) + 10
  }));

  // Use the API data if available, otherwise fall back to defaults
  const displayNotifications = notifications?.length > 0 ? notifications : defaultNotifications;
  const displayFollowedBills = followedBills?.length > 0 ? followedBills : defaultFollowedBills;
  const displayCommitteeMeetings = committeeMeetings?.length > 0 ? committeeMeetings : defaultCommitteeMeetings;
  const displayUserActions = userActions?.length > 0 ? userActions : defaultUserActions;

  // For metrics and statistics
  const metrics = {
    impact: 42,
    actionsCompleted: 15,
    billsFollowed: 8,
    commentsPosted: 23
  };

  // Render 'overview' tab with personalized metrics and recent activity
  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column - metrics */}
      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Civic Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Impact Score</span>
                  <span className="text-sm font-bold">{metrics.impact}/100</span>
                </div>
                <Progress value={metrics.impact} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{metrics.actionsCompleted}</span>
                  <span className="text-xs text-gray-500">Actions Completed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{metrics.billsFollowed}</span>
                  <span className="text-xs text-gray-500">Bills Followed</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/civic-impact">
              <Button variant="outline" size="sm" className="w-full">
                View Detailed Impact
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-3">
              {displayNotifications.map((notification: any, i: any) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="mt-0.5">
                    {notification.type === 'bill' ? (
                      <Gavel className="h-4 w-4 text-blue-500" />
                    ) : notification.type === 'committee' ? (
                      <Calendar className="h-4 w-4 text-green-500" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{notification.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{notification.content}</p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="w-full">
                View All Notifications
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Center column - followed bills */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Bills You're Following
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-3">
              {displayFollowedBills.map((bill: any, i: any) => (
                <Link key={i} href={`/legislation/${bill.billNumber}`}>
                  <div className="flex flex-col p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <Badge variant={bill.chamber === 'senate' ? 'default' : 'secondary'} className="text-xs px-1.5">
                          {bill.billNumber}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          {bill.status}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium mt-1.5">{bill.title}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-400">
                        Updated {new Date(bill.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/legislation">
              <Button variant="outline" size="sm" className="w-full">
                View All Bills
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Right column - committee & activity */}
      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Upcoming Committee Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-3">
              {displayCommitteeMeetings.map((meeting: any, i: any) => (
                <Link key={i} href={`/committee-meetings/${meeting.id}`}>
                  <div className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-sm">{meeting.committee}</h4>
                      <Badge variant="outline" className="text-xs">
                        {new Date(meeting.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {meeting.time} • {meeting.location}
                    </p>
                    <p className="text-xs mt-2">
                      <span className="font-semibold">Agenda:</span> {meeting.agenda}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/committee-meetings">
              <Button variant="outline" size="sm" className="w-full">
                View All Meetings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayUserActions.map((action: any, i: any) => (
                <div key={i} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                  <div className="flex items-start gap-2">
                    {action.type === 'comment' ? (
                      <MessageSquare className="h-4 w-4 text-purple-500 mt-0.5" />
                    ) : action.type === 'follow' ? (
                      <Eye className="h-4 w-4 text-blue-500 mt-0.5" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-green-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm">
                        You {action.type === 'comment' ? 'commented on' : action.type === 'follow' ? 'followed' : 'shared'}{' '}
                        <span className="font-medium">{action.target}</span>
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-400">
                            {new Date(action.date).toLocaleString()}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          +{action.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/activity">
              <Button variant="ghost" size="sm" className="w-full">
                View All Activity
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">All your civic engagement tools in one place</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link href="/search">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </Link>
          <Link href="/feed">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Feed
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Activity Overview</TabsTrigger>
          <TabsTrigger value="tools">All Tools & Features</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>
        <TabsContent value="tools" className="mt-6">
          <ModernDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Import missing Search component at the top
import { Search } from "lucide-react";