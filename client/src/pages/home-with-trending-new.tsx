import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { 
  ArrowRight, 
  Play,
  Gavel,
  Calendar,
  UsersRound,
  Megaphone,
  Search,
  BarChart2,
  Flame as Fire,
  TrendingUp,
  Zap,
  FileText,
  X,
  Bell,
  Newspaper,
  Eye,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrendingBillsDashboard } from "@/components/legislation/TrendingBillsDashboard";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";

export default function HomeWithTrending() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search to avoid excessive redirects
  const debouncedSearch = debounce((query: string) => {
    if (query.trim().length > 2) {
      setLocation(`/unified-search?q=${encodeURIComponent(query.trim())}`);
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
      setLocation(`/unified-search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

  // Default news items if the API doesn't return anything
  const defaultNewsItems = [
    {
      id: 1,
      title: "New Climate Bill Advances Through Committee",
      type: "news",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      content: "The Climate Action Initiative passed a key committee vote today, moving forward with bipartisan support.",
      metadata: { priority: 3 }
    },
    {
      id: 2,
      title: "Education Reform Bill Hearing Scheduled",
      type: "news",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      content: "The Education Committee will hear testimony on the Education Investment Act next Tuesday.",
      metadata: { priority: 2 }
    },
    {
      id: 3,
      title: "Healthcare Access Bill Gains Momentum",
      type: "news",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      content: "As public support grows, the Healthcare Access Bill continues to gain momentum in both chambers.",
      metadata: { priority: 2 }
    }
  ];

  // Combine API data with defaults if needed
  const effectiveNewsItems = (newsItems && newsItems.length > 0) ? newsItems : defaultNewsItems;
  
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

      {/* Hero Section with Global Search */}
      <section className="bg-gradient-to-b from-blue-800 to-indigo-900 text-white py-10 md:py-14 lg:py-16 relative overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
              Your Voice in <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-white">Democracy</span>
            </h1>
            <p className="text-lg mb-6 text-blue-100 max-w-2xl mx-auto">
              Track legislation, connect with like-minded citizens, and make a real impact on the issues that matter to you.
            </p>
          </div>
          
          {/* Quick Access Navigation - Moved up for mobile */}
          <div className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/legislation">
                <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                  <Gavel className="h-6 w-6 text-cyan-300 mb-2" />
                  <span className="font-medium text-sm">Bills</span>
                </div>
              </Link>
              
              <Link href="/committee-meetings">
                <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                  <Calendar className="h-6 w-6 text-cyan-300 mb-2" />
                  <span className="font-medium text-sm">Committees</span>
                </div>
              </Link>
              
              <Link href="/action-circles">
                <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                  <UsersRound className="h-6 w-6 text-cyan-300 mb-2" />
                  <span className="font-medium text-sm">Communities</span>
                </div>
              </Link>
              
              <Link href="/action-center">
                <div className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors cursor-pointer border border-white/10 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                  <Megaphone className="h-6 w-6 text-cyan-300 mb-2" />
                  <span className="font-medium text-sm">Take Action</span>
                </div>
              </Link>
            </div>
          </div>
            
          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for bills, topics, committees, or civic terms..."
                className="pl-10 pr-10 py-5 bg-white text-gray-900 rounded-lg shadow-lg focus:ring-2 focus:ring-cyan-300 focus:border-transparent"
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
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 shadow-md">
                {user ? "My Dashboard" : "Join Now"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
          
          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 mr-3 text-cyan-300" />
              <div>
                <div className="text-2xl font-bold">25%</div>
                <div className="text-xs text-blue-100">Influence Goal</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg flex items-center justify-center">
              <Zap className="h-5 w-5 mr-3 text-cyan-300" />
              <div>
                <div className="text-2xl font-bold">17K+</div>
                <div className="text-xs text-blue-100">Active Members</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg flex items-center justify-center">
              <FileText className="h-5 w-5 mr-3 text-cyan-300" />
              <div>
                <div className="text-2xl font-bold">350+</div>
                <div className="text-xs text-blue-100">Bills Tracked</div>
              </div>
            </div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg flex items-center justify-center overflow-hidden">
              <Fire className="h-5 w-5 mr-3 text-cyan-300" />
              <div className="relative z-10">
                <div className="text-2xl font-bold">8.2%</div>
                <div className="text-xs text-blue-100">Progress</div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-400" style={{width: '8.2%'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Trending + News Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* News Feed */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-primary" />
                    Latest Updates
                  </h2>
                  <Link href="/feed">
                    <Button variant="link" className="text-primary">
                      View All
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {effectiveNewsItems.map((item: any) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {item.metadata?.priority >= 3 ? (
                            <span className="mt-1 text-red-500"><Fire className="h-5 w-5" /></span>
                          ) : (
                            <span className="mt-1 text-primary"><Bell className="h-5 w-5" /></span>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
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
                  
                  <Card className="bg-gray-50 border-dashed">
                    <CardContent className="p-4 text-center">
                      <Link href="/feed">
                        <Button variant="outline" className="w-full">
                          View Full News Feed
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* Quick Access & Trending */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {/* Quick Access Navigation Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Quick Actions</h2>
                  <Link href="/how-it-works">
                    <Button variant="link" className="text-primary">
                      How it Works
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/legislation">
                    <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                      <Gavel className="h-8 w-8 text-primary mb-3" />
                      <span className="font-medium">Bills</span>
                    </div>
                  </Link>
                  
                  <Link href="/committee-meetings">
                    <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                      <Calendar className="h-8 w-8 text-primary mb-3" />
                      <span className="font-medium">Committees</span>
                    </div>
                  </Link>
                  
                  <Link href="/action-circles">
                    <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                      <UsersRound className="h-8 w-8 text-primary mb-3" />
                      <span className="font-medium">Communities</span>
                    </div>
                  </Link>
                  
                  <Link href="/action-center">
                    <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition-colors cursor-pointer border border-gray-200 h-full flex flex-col items-center justify-center shadow-sm hover:shadow">
                      <Megaphone className="h-8 w-8 text-primary mb-3" />
                      <span className="font-medium">Take Action</span>
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Trending Bills Tabs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Trending Legislation
                  </h2>
                  <Link href="/legislation">
                    <Button variant="link" className="text-primary">
                      View All Bills
                    </Button>
                  </Link>
                </div>
                
                <Tabs defaultValue="most-watched" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="most-watched" className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="hidden md:inline">Most Watched</span>
                      <span className="md:hidden">Watched</span>
                    </TabsTrigger>
                    <TabsTrigger value="most-contentious" className="flex items-center justify-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      <span className="hidden md:inline">Most Contentious</span>
                      <span className="md:hidden">Contentious</span>
                    </TabsTrigger>
                    <TabsTrigger value="recent-activity" className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="hidden md:inline">Recent Activity</span>
                      <span className="md:hidden">Recent</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <BillTabContent />
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Make a Real Impact?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the movement that's transforming how citizens engage with government and hold power accountable.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                Join Act Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-blue-300 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">Act Up</h3>
              <p className="text-sm">
                Transforming civic engagement through social impact to create a more equitable democratic process.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legislation">Legislation Tracking</Link></li>
                <li><Link href="/committees">Committee Monitoring</Link></li>
                <li><Link href="/action-circles">Action Circles</Link></li>
                <li><Link href="/war-room">War Room</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works">How It Works</Link></li>
                <li><Link href="/training">Training Center</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/cookies">Cookie Policy</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© {new Date().getFullYear()} Act Up. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-blue-300 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-blue-300 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-blue-300 hover:text-white">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simpler bill tab content component to replace the full TrendingBillsDashboard
function BillTabContent() {
  const [activeTab, setActiveTab] = useState("most-watched");

  // Query most watched bills
  const { 
    data: mostWatchedBills = [],
    isLoading: isLoadingMostWatched
  } = useQuery<any>({
    queryKey: ['/api/trending/most-watched'],
    enabled: activeTab === "most-watched"
  });

  // Query most contentious bills
  const {
    data: mostContentiousBills = [],
    isLoading: isLoadingContentious
  } = useQuery<any>({
    queryKey: ['/api/trending/most-contentious'],
    enabled: activeTab === "most-contentious"
  });

  // Query bills with recent activity
  const {
    data: recentActivityBills = [],
    isLoading: isLoadingRecent
  } = useQuery<any>({
    queryKey: ['/api/trending/recent-activity'],
    enabled: activeTab === "recent-activity"
  });

  useEffect(() => {
    // Update active tab based on selected TabsTrigger
    const handleTabChange = () => {
      const activeTabElement = document.querySelector('[data-state="active"][data-radix-collection-item]');
      if (activeTabElement) {
        const tabValue = activeTabElement.getAttribute('value');
        if (tabValue) setActiveTab(tabValue);
      }
    };

    // Add event listener to detect tab changes
    document.addEventListener('click', handleTabChange);
    
    return () => {
      document.removeEventListener('click', handleTabChange);
    };
  }, []);

  if (isLoadingMostWatched || isLoadingContentious || isLoadingRecent) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  // Display appropriate bills based on active tab
  let billsToShow: any[] = [];
  
  switch (activeTab) {
    case "most-watched":
      billsToShow = mostWatchedBills as any[];
      break;
    case "most-contentious":
      billsToShow = mostContentiousBills as any[];
      break;
    case "recent-activity":
      billsToShow = recentActivityBills as any[];
      break;
  }

  if (!billsToShow.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bills found for this category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {billsToShow.slice(0, 4).map((item) => {
        // Handle different bill formats based on the query
        const bill = activeTab === "most-watched" 
          ? (item as any).bill
          : item;
          
        const trackCount = activeTab === "most-watched" 
          ? (item as any).trackCount
          : null;
          
        const contentionScore = activeTab === "most-contentious" 
          ? (item as any).contention_score
          : null;

        return (
          <Link key={bill.id} href={`/legislation/${bill.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{bill.id}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{bill.title}</p>
                  </div>
                  <Badge variant={getBillStatusVariant(bill.status) as "default" | "outline" | "secondary" | "destructive"}>
                    {bill.status}
                  </Badge>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 flex items-center">
                  {activeTab === "most-watched" && trackCount !== null && (
                    <>
                      <Eye className="h-4 w-4 mr-1 text-primary" />
                      <span>{trackCount} watchers</span>
                    </>
                  )}
                  
                  {activeTab === "most-contentious" && contentionScore !== null && (
                    <>
                      <BarChart2 className="h-4 w-4 mr-1 text-primary" />
                      <span>{parseFloat(contentionScore.toFixed(2))} contention score</span>
                    </>
                  )}
                  
                  {activeTab === "recent-activity" && (
                    <>
                      <Clock className="h-4 w-4 mr-1 text-primary" />
                      <span>Updated recently</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function getBillStatusVariant(status: string): "default" | "outline" | "secondary" | "destructive" | "success" {
  switch (status.toLowerCase()) {
    case "passed":
    case "enacted":
      return "success";
    case "filed":
    case "introduced":
      return "default";
    case "in committee":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}