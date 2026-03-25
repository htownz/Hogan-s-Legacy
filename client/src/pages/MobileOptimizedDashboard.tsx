import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Bell, 
  User, 
  Menu,
  X,
  Home,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  Star,
  Filter,
  ChevronRight,
  Heart,
  Share,
  Bookmark,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Phone
} from "lucide-react";

interface MobileBill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsors: string[];
  introducedAt: string;
  priority: 'high' | 'medium' | 'low';
  userInterest: number;
  trending: boolean;
  saved: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
}

export default function MobileOptimizedDashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("feed");
  const [savedBills, setSavedBills] = useState<string[]>([]);

  // Fetch personalized bill recommendations
  const { data: recommendedBills, isLoading } = useQuery<any>({
    queryKey: ["/api/bills/recommendations"],
  });

  // Fetch trending bills
  const { data: trendingBills } = useQuery<any>({
    queryKey: ["/api/bills/trending"],
  });

  // Mock data optimized for mobile viewing
  const mockBills: MobileBill[] = [
    {
      id: "HB-2847",
      title: "Education Funding Reform",
      description: "Comprehensive reform of public school funding formulas",
      status: "Committee Review",
      chamber: "House",
      sponsors: ["Rep. Johnson", "Rep. Davis"],
      introducedAt: "2024-03-15",
      priority: "high",
      userInterest: 95,
      trending: true,
      saved: false
    },
    {
      id: "SB-1492",
      title: "Healthcare Access Expansion",
      description: "Expanding healthcare access in underserved communities",
      status: "Passed Committee",
      chamber: "Senate",
      sponsors: ["Sen. Rodriguez"],
      introducedAt: "2024-02-28",
      priority: "high",
      userInterest: 87,
      trending: false,
      saved: true
    },
    {
      id: "HB-3156",
      title: "Environmental Protection Standards",
      description: "New environmental regulations for industrial facilities",
      status: "In Committee",
      chamber: "House",
      sponsors: ["Rep. Chen", "Rep. Miller"],
      introducedAt: "2024-03-01",
      priority: "medium",
      userInterest: 72,
      trending: true,
      saved: false
    }
  ];

  const quickActions: QuickAction[] = [
    {
      id: "voice-search",
      title: "Voice Search",
      description: "Search bills with voice",
      icon: Search,
      color: "bg-blue-500",
      action: () => console.log("Voice search")
    },
    {
      id: "trending",
      title: "Trending Bills",
      description: "See what's popular",
      icon: TrendingUp,
      color: "bg-green-500",
      action: () => setActiveTab("trending")
    },
    {
      id: "saved",
      title: "Saved Bills",
      description: "Your bookmarks",
      icon: Bookmark,
      color: "bg-purple-500",
      action: () => setActiveTab("saved")
    },
    {
      id: "alerts",
      title: "Bill Alerts",
      description: "Custom notifications",
      icon: Bell,
      color: "bg-orange-500",
      action: () => console.log("Alerts")
    }
  ];

  const toggleSaveBill = (billId: string) => {
    setSavedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed committee': return 'bg-green-100 text-green-800';
      case 'committee review': case 'in committee': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <h1 className="text-lg font-bold text-blue-600">ActUp Texas</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bills, legislators, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="bg-white w-64 h-full shadow-lg">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Menu</h2>
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Bills
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Legislators
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center text-center hover:bg-gray-50"
                onClick={action.action}
              >
                <div className={`${action.color} p-3 rounded-full text-white mb-2`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
            <TabsTrigger value="trending" className="text-xs">Trending</TabsTrigger>
            <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
          </TabsList>

          {/* Personalized Feed */}
          <TabsContent value="feed" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Personalized Feed</h3>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {mockBills.map((bill) => (
                <Card key={bill.id} className={`border-l-4 ${getPriorityColor(bill.priority)} hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{bill.id}</Badge>
                          <Badge className={`${getStatusColor(bill.status)} text-xs`}>
                            {bill.status}
                          </Badge>
                          {bill.trending && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm leading-tight mb-1">{bill.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{bill.description}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSaveBill(bill.id)}
                        className="ml-2"
                      >
                        <Heart className={`h-4 w-4 ${savedBills.includes(bill.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span>{bill.chamber}</span>
                        <span>{new Date(bill.introducedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{bill.userInterest}% match</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-gray-500">
                        Sponsored by {bill.sponsors[0]}
                        {bill.sponsors.length > 1 && ` +${bill.sponsors.length - 1} more`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Share className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Trending Bills */}
          <TabsContent value="trending" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Trending Now</h3>
              {mockBills.filter(bill => bill.trending).map((bill) => (
                <Card key={bill.id} className="border border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <Badge variant="outline">{bill.id}</Badge>
                      <Badge className="bg-green-100 text-green-800">Hot</Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{bill.title}</h4>
                    <p className="text-xs text-gray-600">{bill.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{bill.chamber} • {new Date(bill.introducedAt).toLocaleDateString()}</span>
                      <span>🔥 High Activity</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Saved Bills */}
          <TabsContent value="saved" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Saved Bills</h3>
              {savedBills.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">No saved bills yet</h4>
                    <p className="text-sm text-gray-500">
                      Tap the heart icon on bills to save them for later
                    </p>
                  </CardContent>
                </Card>
              ) : (
                mockBills.filter(bill => savedBills.includes(bill.id)).map((bill) => (
                  <Card key={bill.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                        <Badge variant="outline">{bill.id}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{bill.title}</h4>
                      <p className="text-xs text-gray-600">{bill.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bill Alerts</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Education Bills Alert</h4>
                      <p className="text-xs text-gray-500">Get notified about education legislation</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto">
                      Active
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Healthcare Updates</h4>
                      <p className="text-xs text-gray-500">Track healthcare-related bills</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto">
                      Active
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <Button variant="ghost" size="sm" className="flex flex-col items-center">
            <Home className="h-4 w-4" />
            <span className="text-xs mt-1">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center">
            <Search className="h-4 w-4" />
            <span className="text-xs mt-1">Search</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs mt-1">Trending</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center">
            <Bell className="h-4 w-4" />
            <span className="text-xs mt-1">Alerts</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center">
            <User className="h-4 w-4" />
            <span className="text-xs mt-1">Profile</span>
          </Button>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
}