import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { 
  ArrowRight, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  BookOpen, 
  Shield, 
  LucideIcon, 
  LineChart, 
  Network, 
  Share2, 
  TrendingUp, 
  Calendar, 
  Activity, 
  Play,
  AlertTriangle,
  Eye,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { user } = useUser();
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  // Mock data for live activity feed
  const recentActivity = [
    { 
      id: 1, 
      type: 'bill-track', 
      user: 'Sarah Johnson', 
      action: 'is now tracking', 
      target: 'TX-HB100', 
      time: '2023-05-15T14:30:00Z',
      icon: BookOpen
    },
    { 
      id: 2, 
      type: 'action-circle', 
      user: 'Miguel Reyes', 
      action: 'created a new Action Circle', 
      target: 'Education Reform Advocates', 
      time: '2023-05-15T13:45:00Z',
      icon: Users
    },
    { 
      id: 3, 
      type: 'comment', 
      user: 'Jasmine Clark', 
      action: 'commented on', 
      target: 'TX-SB10', 
      time: '2023-05-15T12:20:00Z',
      icon: MessageSquare
    },
    { 
      id: 4, 
      type: 'war-room', 
      user: 'Robert Chen', 
      action: 'launched War Room campaign', 
      target: 'Climate Action Now', 
      time: '2023-05-15T11:05:00Z',
      icon: Shield
    }
  ];
  
  // Mock data for upcoming critical legislation
  const upcomingBills = [
    { 
      id: 'TX-HB123', 
      title: 'Tax Reform and Relief Act', 
      voteDate: '2023-05-20', 
      status: 'scheduled',
      impact: 'high' 
    },
    { 
      id: 'TX-SB45', 
      title: 'Education Funding Initiative', 
      voteDate: '2023-05-25', 
      status: 'committee',
      impact: 'critical' 
    },
    { 
      id: 'TX-HB78', 
      title: 'Healthcare Accessibility Plan', 
      voteDate: '2023-06-02', 
      status: 'scheduled',
      impact: 'medium' 
    }
  ];
  
  // Feature icons with their types
  type FeatureIconProps = {
    icon: LucideIcon;
    bgColor: string;
    iconColor: string;
  };

  const FeatureIcon = ({ icon: Icon, bgColor, iconColor }: FeatureIconProps) => (
    <div className={`rounded-full ${bgColor} w-12 h-12 flex items-center justify-center mb-4`}>
      <Icon className={`h-6 w-6 ${iconColor}`} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 4.2L19.6 19H4.4L12 6.2zm1 9.8h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
            </svg>
            <span className="ml-2 text-2xl font-bold text-primary">Act Up</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Visual Elements */}
      <section className="bg-gradient-to-br from-indigo-700 via-primary to-indigo-800 text-white py-20 relative overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <Badge className="mb-4 bg-white/20 hover:bg-white/30 text-white border-none">
                100% Free & Open Source
              </Badge>
              <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight">
                Transform <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Civic Engagement</span> Through Social Impact
              </h1>
              <p className="text-xl mb-8 text-blue-100 max-w-lg">
                Join a movement of Super Users creating a new standard of transparency and accountability in government
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={user ? "/dashboard" : "/register"}>
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-blue-50">
                    {user ? "Go to Dashboard" : "Join the Movement"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  Watch Demo
                  <Play className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-4 mt-10 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl font-bold">25%</div>
                  <div className="text-xs text-blue-100">Tipping Point</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl font-bold">17,328</div>
                  <div className="text-xs text-blue-100">Active Members</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl font-bold">8.2%</div>
                  <div className="text-xs text-blue-100">Progress</div>
                </div>
              </div>
            </div>
            
            {/* Hero visual */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Abstract visual - a simplified texas map with network nodes */}
                <svg className="w-full h-auto" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M200,50 L100,100 L50,200 L100,300 L200,350 L300,300 L350,200 L300,100 Z" 
                    fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  
                  {/* Network nodes */}
                  <circle cx="200" cy="50" r="8" fill="white" />
                  <circle cx="100" cy="100" r="6" fill="white" />
                  <circle cx="50" cy="200" r="5" fill="white" />
                  <circle cx="100" cy="300" r="7" fill="white" />
                  <circle cx="200" cy="350" r="6" fill="white" />
                  <circle cx="300" cy="300" r="8" fill="white" />
                  <circle cx="350" cy="200" r="5" fill="white" />
                  <circle cx="300" cy="100" r="7" fill="white" />
                  <circle cx="200" cy="200" r="12" fill="white" />
                  
                  {/* Connection lines */}
                  <line x1="200" y1="50" x2="100" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="100" y1="100" x2="50" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="50" y1="200" x2="100" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="100" y1="300" x2="200" y2="350" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="350" x2="300" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="300" y1="300" x2="350" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="350" y1="200" x2="300" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="300" y1="100" x2="200" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  
                  {/* Center connections */}
                  <line x1="200" y1="200" x2="200" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="100" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="50" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="100" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="200" y2="350" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="300" y2="300" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="350" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="200" y1="200" x2="300" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  
                  {/* Animated pulse */}
                  <circle cx="200" cy="200" r="30" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
                    <animate attributeName="r" from="10" to="50" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                </svg>
                
                {/* Floating badges */}
                <div className="absolute top-10 right-10 bg-white text-primary px-3 py-1 rounded-full text-sm font-medium animate-bounce">
                  New Bills Added
                </div>
                <div className="absolute bottom-20 left-10 bg-white text-primary px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  Live Updates
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Activity + Critical Bills Section */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Live Activity Feed */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Activity</CardTitle>
                    <CardDescription>Real-time updates from the movement</CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="rounded-full p-2 bg-primary/10 text-primary shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            <span className="font-semibold">{activity.user}</span> {activity.action}{' '}
                            <span className="font-semibold">{activity.target}</span>
                          </p>
                          <p className="text-xs text-neutral-500">{formatDate(activity.time)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-center">
                <Button variant="ghost" className="text-primary text-sm w-full">
                  View All Activity
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            {/* Critical Bills */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Critical Legislation</CardTitle>
                    <CardDescription>Bills that need your attention soon</CardDescription>
                  </div>
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Urgent
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBills.map((bill) => (
                    <div key={bill.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={bill.impact === 'critical' ? 'destructive' : bill.impact === 'high' ? 'default' : 'secondary'}>
                              {bill.impact}
                            </Badge>
                            <span className="font-medium text-sm">{bill.id}</span>
                          </div>
                          <h4 className="font-medium">{bill.title}</h4>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center text-xs text-neutral-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(bill.voteDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {bill.status === 'scheduled' ? 'Vote Scheduled' : 'In Committee'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between mt-3">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" className="text-xs">
                          Track Bill
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-center">
                <Button variant="ghost" className="text-primary text-sm w-full">
                  View All Legislation
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Tools For Civic Transformation</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Act Up provides everything you need to track, analyze, and influence legislation
              while building a network of engaged citizens.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <FeatureIcon 
                  icon={BookOpen} 
                  bgColor="bg-blue-100" 
                  iconColor="text-blue-600" 
                />
                <CardTitle>Legislative Tracking</CardTitle>
                <CardDescription>
                  Follow bills through every stage with real-time updates and impact analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Real-time bill status changes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">AI-powered impact summaries</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Customizable alerts and notifications</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Explore Legislation
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 2 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <FeatureIcon 
                  icon={Users} 
                  bgColor="bg-purple-100" 
                  iconColor="text-purple-600" 
                />
                <CardTitle>Action Circles</CardTitle>
                <CardDescription>
                  Create and join focused groups working toward specific civic goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Coordinate with like-minded citizens</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Distribute tasks and track progress</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Share resources and success stories</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Join Action Circles
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 3 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <FeatureIcon 
                  icon={Shield} 
                  bgColor="bg-red-100" 
                  iconColor="text-red-600" 
                />
                <CardTitle>War Room Campaigns</CardTitle>
                <CardDescription>
                  Mobilize rapid-response teams for high-priority legislative efforts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Organize focused campaign efforts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Real-time chat and collaboration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Resource sharing and campaign analytics</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Deploy War Rooms
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Creating Civic Super Spreaders</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Act Up's unique approach turns engaged citizens into "super spreaders" of civic information
              and action, creating a viral spread of transparency and accountability.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-16 items-center">
            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Join & Learn</h3>
              <p className="text-neutral-600">Create your profile and learn about key legislation</p>
              
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-primary"></div>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Take Action</h3>
              <p className="text-neutral-600">Join action circles and participate in campaigns</p>
              
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-primary"></div>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Invite Others</h3>
              <p className="text-neutral-600">Grow your network by bringing in friends and family</p>
              
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-primary"></div>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-xl font-bold mb-2">Create Change</h3>
              <p className="text-neutral-600">Watch your influence grow and drive real civic impact</p>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="text-center mt-16">
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                {user ? "Go to Your Dashboard" : "Start Your Journey"} 
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}