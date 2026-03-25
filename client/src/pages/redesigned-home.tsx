import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowUpRight,
  ArrowDown,
  Search, 
  ChevronRight,
  Gavel, 
  Calendar, 
  UsersRound, 
  Megaphone,
  LayoutDashboard,
  BarChart2,
  BookOpen,
  TrendingUp,
  Zap,
  FileText,
  Newspaper,
  Video,
  Eye,
  MessageSquare,
  Terminal,
  Globe,
  FolderOpen,
  X,
  Bell,
  Flame,
  BarChart4 
} from "lucide-react";
import { debounce } from "lodash";
import { useUser } from "@/hooks/use-user";
import { TrendingBillsDashboard } from "@/components/legislation/TrendingBillsDashboard";
import { cn } from "@/lib/utils";

// Featured tool interface
interface FeaturedTool {
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  bgClass: string;
  textClass: string;
  iconClass: string;
}

export default function RedesignedHome() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Debounce search
  const debouncedSearch = debounce((query: string) => {
    if (query.trim().length > 2) {
      setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, 500);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Fetch trending bills
  const { data: trendingBills } = useQuery<any>({
    queryKey: ['/api/bills/trending'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/bills/trending?limit=5');
        if (!response.ok) return [];
        const data = await response.json();
        return data.bills || [];
      } catch (error) {
        console.error('Error fetching trending bills:', error);
        return [];
      }
    }
  });

  // Fetch recent news for the news feed
  const { data: newsItems } = useQuery<any>({
    queryKey: ['/api/feed/type/news', { limit: 5 }],
    queryFn: async () => {
      try {
        const response = await fetch('/api/feed/type/news?limit=5');
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching news feed:', error);
        return [];
      }
    }
  });

  // Fetch upcoming committee meetings
  const { data: committeeMeetings } = useQuery<any>({
    queryKey: ['/api/committee-meetings/upcoming', { limit: 3 }],
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

  // Default trending bills if the API doesn't return anything
  const defaultTrendingBills = Array(5).fill(null).map((_, i) => ({
    id: i,
    billNumber: `SB ${1234 + i}`,
    title: [
      "Education Funding Act",
      "Transportation Infrastructure Bill",
      "Healthcare Access Improvement Act",
      "Criminal Justice Reform",
      "Environmental Protection Act"
    ][i],
    chamber: ["senate", "house", "senate", "house", "senate"][i],
    status: ["Committee", "Floor Vote Scheduled", "Passed Committee", "Introduced", "Referred to Committee"][i],
    watchCount: 120 - (i * 15),
    lastUpdated: new Date(Date.now() - i * 86400000).toISOString()
  }));

  // Default news items if the API doesn't return anything
  const defaultNewsItems = Array(5).fill(null).map((_, i) => ({
    id: i,
    title: [
      "New Climate Bill Advances Through Committee",
      "Education Reform Bill Hearing Scheduled",
      "Healthcare Access Improvement Act Gains Momentum",
      "Transportation Budget Passes Senate",
      "Environmental Protection Bill Introduced"
    ][i],
    type: "news",
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    content: [
      "The Climate Action Initiative passed a key committee vote today, moving forward with bipartisan support.",
      "The Education Committee will hear testimony on the Education Investment Act next Tuesday.",
      "As public support grows, the Healthcare Access Bill continues to gain momentum in both chambers.",
      "The Senate approved the annual transportation budget with funding for major infrastructure projects.",
      "A new bill aimed at strengthening environmental protections was introduced in the House today."
    ][i],
    metadata: { priority: i === 0 ? 3 : i === 1 ? 2 : 1 }
  }));

  // Default committee meetings if the API doesn't return anything
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
    agenda: ["SB 1234, HB 5678", "Budget Hearings", "Healthcare Legislation"][i],
    isLive: i === 0
  }));

  // Use the API data if available, otherwise fall back to defaults
  const displayTrendingBills = trendingBills?.length > 0 ? trendingBills : defaultTrendingBills;
  const displayNewsItems = newsItems?.length > 0 ? newsItems : defaultNewsItems;
  const displayCommitteeMeetings = committeeMeetings?.length > 0 ? committeeMeetings : defaultCommitteeMeetings;

  // Featured tools to showcase on the homepage
  const featuredTools: FeaturedTool[] = [
    {
      icon: Gavel,
      title: "Bill Tracker",
      description: "Follow legislation through the legislative process",
      path: "/legislation",
      bgClass: "bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200",
      textClass: "text-blue-700",
      iconClass: "text-blue-600"
    },
    {
      icon: Video,
      title: "Committee Videos",
      description: "Watch and analyze committee meetings live",
      path: "/committee-meetings",
      bgClass: "bg-gradient-to-br from-violet-50 to-purple-100 hover:from-violet-100 hover:to-purple-200",
      textClass: "text-violet-700",
      iconClass: "text-violet-600"
    },
    {
      icon: Terminal,
      title: "AI Assistant",
      description: "Get AI-powered help with understanding legislation",
      path: "/ai-assistant",
      bgClass: "bg-gradient-to-br from-cyan-50 to-blue-100 hover:from-cyan-100 hover:to-blue-200",
      textClass: "text-cyan-700",
      iconClass: "text-cyan-600"
    },
    {
      icon: Globe,
      title: "Community Impact",
      description: "See how collective actions are making a difference",
      path: "/community-impact",
      bgClass: "bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200",
      textClass: "text-emerald-700",
      iconClass: "text-emerald-600"
    },
    {
      icon: Eye,
      title: "War Room",
      description: "Strategic analysis of key legislative battles",
      path: "/war-room",
      bgClass: "bg-gradient-to-br from-indigo-50 to-blue-100 hover:from-indigo-100 hover:to-blue-200",
      textClass: "text-indigo-700",
      iconClass: "text-indigo-600"
    },
    {
      icon: FolderOpen,
      title: "Document Center",
      description: "Access and share important civic documents",
      path: "/documents",
      bgClass: "bg-gradient-to-br from-amber-50 to-yellow-100 hover:from-amber-100 hover:to-yellow-200",
      textClass: "text-amber-700",
      iconClass: "text-amber-600"
    }
  ];

  // Platform statistics
  const platformStats = {
    activeBills: 350,
    membersCount: 17000,
    committeesTracked: 42,
    documentsShared: 1250
  };

  // Key CTA sections
  const ctaSections = [
    {
      title: "Track Legislation",
      description: "Stay informed about bills that matter to you. Get notifications about status changes, amendments, and votes.",
      icon: FileText,
      buttonText: "Browse Legislation",
      buttonLink: "/legislation",
      bgClass: "bg-gradient-to-br from-blue-600 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 transition-all shadow-lg hover:shadow-xl"
    },
    {
      title: "Watch Committee Hearings",
      description: "View livestreams and recordings of committee meetings with AI-generated summaries and analysis.",
      icon: Video,
      buttonText: "View Committees",
      buttonLink: "/committee-meetings",
      bgClass: "bg-gradient-to-br from-violet-600 to-purple-800 hover:from-violet-700 hover:to-purple-900 transition-all shadow-lg hover:shadow-xl"
    },
    {
      title: "Join the Community",
      description: "Connect with like-minded citizens, join action circles, and participate in meaningful civic discussions.",
      icon: UsersRound,
      buttonText: "Find Your Circle",
      buttonLink: "/action-circles",
      bgClass: "bg-gradient-to-br from-cyan-600 to-blue-800 hover:from-cyan-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={cn(
        "py-4 sticky top-0 z-50 transition-all duration-200",
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 4.2L19.6 19H4.4L12 6.2zm1 9.8h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
            </svg>
            <span className="ml-2 text-2xl font-bold text-primary">Act Up</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/enhanced-dashboard">
                  <Button>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 via-indigo-800 to-violet-900 text-white py-12 md:py-16 lg:py-20 relative overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="white" />
              </pattern>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Transform <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-white">Democracy</span> Through Action
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Track legislation, connect with your community, and make a real impact on the issues that matter to you.
            </p>
          </div>
          
          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for bills, topics, committees, or civic terms..."
                className="pl-10 pr-10 py-6 bg-white text-gray-900 rounded-lg shadow-lg focus:ring-2 focus:ring-cyan-300 focus:border-transparent"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-3 text-sm text-blue-100">
              <span>Try:</span>
              <button 
                type="button"
                onClick={() => setSearchQuery("education funding")}
                className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
              >
                education funding
              </button>
              <button 
                type="button"
                onClick={() => setSearchQuery("healthcare")}
                className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
              >
                healthcare
              </button>
              <button 
                type="button"
                onClick={() => setSearchQuery("property tax")}
                className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
              >
                property tax
              </button>
            </div>
          </form>
          
          {/* Quick Access Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10">
            <Link href="/legislation">
              <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-all duration-200 cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1">
                <Gavel className="h-6 w-6 text-cyan-300 mb-2" />
                <span className="font-medium text-sm">Bills</span>
              </div>
            </Link>
            
            <Link href="/committee-meetings">
              <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-all duration-200 cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1">
                <Calendar className="h-6 w-6 text-cyan-300 mb-2" />
                <span className="font-medium text-sm">Committees</span>
              </div>
            </Link>
            
            <Link href="/action-circles">
              <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-all duration-200 cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1">
                <UsersRound className="h-6 w-6 text-cyan-300 mb-2" />
                <span className="font-medium text-sm">Communities</span>
              </div>
            </Link>
            
            <Link href="/legislation">
              <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-all duration-200 cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1">
                <Newspaper className="h-6 w-6 text-cyan-300 mb-2" />
                <span className="font-medium text-sm">News Feed</span>
              </div>
            </Link>
            
            <Link href="/documents">
              <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-all duration-200 cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1">
                <FolderOpen className="h-6 w-6 text-cyan-300 mb-2" />
                <span className="font-medium text-sm">Documents</span>
              </div>
            </Link>
            
            <Link href="/ai-assistant">
              <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-all duration-200 cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1">
                <Terminal className="h-6 w-6 text-cyan-300 mb-2" />
                <span className="font-medium text-sm">AI Assistant</span>
              </div>
            </Link>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link href={user ? "/enhanced-dashboard" : "/register"}>
              <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 shadow-md">
                {user ? "Go to Dashboard" : "Join Now"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn How It Works
              </Button>
            </Link>
          </div>
          
          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center">
              <FileText className="h-8 w-8 mb-2 text-cyan-300" />
              <div className="text-2xl font-bold">{platformStats.activeBills}+</div>
              <div className="text-sm text-blue-100">Bills Tracked</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center">
              <UsersRound className="h-8 w-8 mb-2 text-cyan-300" />
              <div className="text-2xl font-bold">{platformStats.membersCount / 1000}K+</div>
              <div className="text-sm text-blue-100">Active Members</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center">
              <Video className="h-8 w-8 mb-2 text-cyan-300" />
              <div className="text-2xl font-bold">{platformStats.committeesTracked}</div>
              <div className="text-sm text-blue-100">Committees Tracked</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center">
              <FolderOpen className="h-8 w-8 mb-2 text-cyan-300" />
              <div className="text-2xl font-bold">{platformStats.documentsShared}+</div>
              <div className="text-sm text-blue-100">Documents Shared</div>
            </div>
          </div>
          
          {/* Scroll down indicator */}
          <div className="flex justify-center mt-16">
            <button 
              onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})}
              className="text-white/70 hover:text-white flex flex-col items-center transition-colors"
            >
              <span className="text-sm mb-2">Explore Platform Features</span>
              <ArrowDown className="h-5 w-5 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Tools Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Powerful Tools for Civic Engagement</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides everything you need to stay informed and make your voice heard in the legislative process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool, i) => (
              <Link key={i} href={tool.path}>
                <div className={cn(
                  "rounded-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl cursor-pointer h-full flex flex-col hover:-translate-y-1", 
                  tool.bgClass
                )}>
                  <div className="mb-4 bg-white/60 w-14 h-14 rounded-full flex items-center justify-center shadow-sm">
                    <tool.icon className={cn("h-8 w-8", tool.iconClass)} />
                  </div>
                  <h3 className={cn("text-xl font-bold mb-2", tool.textClass)}>{tool.title}</h3>
                  <p className="text-gray-600 mb-4">{tool.description}</p>
                  <div className="mt-auto flex items-center text-blue-600 font-medium">
                    Learn more
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Content Tabs Section - Bills, Committees, News */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="trending" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Latest Updates</h2>
              <TabsList>
                <TabsTrigger value="trending">Trending Bills</TabsTrigger>
                <TabsTrigger value="committees">Committee Meetings</TabsTrigger>
                <TabsTrigger value="news">News Feed</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="trending" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayTrendingBills.map((bill: any, i: number) => (
                  <Link href={`/legislation/${bill.billNumber}`} key={i}>
                    <Card className="hover:shadow-md transition-all border-gray-200 h-full overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Badge variant={bill.chamber === 'senate' ? 'default' : 'secondary'}>
                            {bill.billNumber}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-50">
                            {bill.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <h3 className="text-lg font-semibold mb-2">{bill.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{bill.watchCount} watching</span>
                          <span className="mx-2">•</span>
                          <span>Updated {new Date(bill.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex items-center text-blue-600 text-sm font-medium">
                          View bill details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center">
                <Link href="/legislation">
                  <Button>
                    Browse All Legislation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="committees" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {displayCommitteeMeetings.map((meeting: any, i: number) => (
                  <Link href={`/committee-meetings/${meeting.id}`} key={i}>
                    <Card className={cn(
                      "hover:shadow-md transition-all border-gray-200 h-full overflow-hidden",
                      meeting.isLive && "border-red-300 border-2"
                    )}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{meeting.committee}</CardTitle>
                          {meeting.isLive && (
                            <Badge variant="destructive" className="animate-pulse">
                              Live Now
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="mb-2">
                          <div className="font-medium">
                            {new Date(meeting.date).toLocaleDateString()} • {meeting.time}
                          </div>
                          <div className="text-gray-500 text-sm">{meeting.location}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Agenda:</div>
                          <div className="text-sm text-gray-600">{meeting.agenda}</div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex items-center text-blue-600 text-sm font-medium">
                          {meeting.isLive ? "Watch Live" : "View Details"}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center">
                <Link href="/committee-meetings">
                  <Button>
                    View All Committee Meetings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="news" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayNewsItems.map((item: any, i: number) => (
                  <Card key={i} className="overflow-hidden hover:shadow-md transition-all border-gray-200 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        {item.metadata?.priority >= 3 ? (
                          <span className="mt-1 text-red-500"><Flame className="h-5 w-5" /></span>
                        ) : (
                          <span className="mt-1 text-primary"><Bell className="h-5 w-5" /></span>
                        )}
                        <div>
                          <h3 className="font-medium text-lg mb-2">{item.title}</h3>
                          <p className="text-gray-600">{item.content}</p>
                          <div className="flex items-center mt-3 text-sm text-gray-500">
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                            {item.metadata?.sourceName && (
                              <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                                {item.metadata.sourceName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-center">
                <Link href="/feed">
                  <Button>
                    View Full News Feed
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Start Making an Impact Today</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of citizens who are transforming democracy through informed engagement.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ctaSections.map((section, i) => (
              <div 
                key={i} 
                className={cn(
                  "rounded-xl p-6 text-white shadow-lg overflow-hidden relative",
                  section.bgClass
                )}
              >
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id={`dots-${i}`} width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="5" cy="5" r="1" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#dots-${i})`} />
                  </svg>
                </div>
                
                <div className="relative z-10">
                  <section.icon className="h-10 w-10 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{section.title}</h3>
                  <p className="mb-6 text-white/90">{section.description}</p>
                  <Link href={section.buttonLink}>
                    <Button className="bg-white hover:bg-gray-100 text-blue-800">
                      {section.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/how-it-works" className="text-gray-300 hover:text-white">How It Works</Link></li>
                <li><Link href="/about" className="text-gray-300 hover:text-white">About Act Up</Link></li>
                <li><Link href="/team" className="text-gray-300 hover:text-white">Our Team</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Features</h3>
              <ul className="space-y-2">
                <li><Link href="/legislation" className="text-gray-300 hover:text-white">Bill Tracking</Link></li>
                <li><Link href="/committee-meetings" className="text-gray-300 hover:text-white">Committee Videos</Link></li>
                <li><Link href="/action-circles" className="text-gray-300 hover:text-white">Action Circles</Link></li>
                <li><Link href="/ai-assistant" className="text-gray-300 hover:text-white">AI Assistant</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-300 hover:text-white">Help Center</Link></li>
                <li><Link href="/civic-terms" className="text-gray-300 hover:text-white">Civic Terms</Link></li>
                <li><Link href="/documents" className="text-gray-300 hover:text-white">Document Library</Link></li>
                <li><Link href="/infographics" className="text-gray-300 hover:text-white">Infographics</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-300 hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-gray-300 hover:text-white">Cookie Policy</Link></li>
                <li><Link href="/accessibility" className="text-gray-300 hover:text-white">Accessibility</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm0 4.2L19.6 19H4.4L12 6.2zm1 9.8h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-primary">Act Up</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Act Up. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}