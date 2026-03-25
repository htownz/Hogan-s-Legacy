import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  DollarSign, 
  Users, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Search,
  Smartphone,
  Eye,
  ExternalLink,
  Filter,
  TrendingUp
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface DataSource {
  name: string;
  type: string;
  status: string;
  lastSync: string;
}

export default function TransparencyPortal() {
  const [selectedCategory, setSelectedCategory] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch authentic government data
  const { data: campaignData, isLoading: campaignLoading } = useQuery<any>({
    queryKey: ['/api/live-data/campaign-finance'],
    enabled: true
  });

  const { data: lobbyistData, isLoading: lobbyistLoading } = useQuery<any>({
    queryKey: ['/api/live-data/lobbyists'],
    enabled: true
  });

  const { data: ethicsData, isLoading: ethicsLoading } = useQuery<any>({
    queryKey: ['/api/live-data/ethics-violations'],
    enabled: true
  });

  const { data: dataSources } = useQuery<any>({
    queryKey: ['/api/live-data/status'],
    enabled: true
  });

  // Fetch elected officials data
  const { data: officialsData, isLoading: officialsLoading } = useQuery<any>({
    queryKey: ['/api/live-data/elected-officials'],
    enabled: true
  });

  const isLoading = campaignLoading || lobbyistLoading || ethicsLoading || officialsLoading;

  // Mobile gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const categories = ["overview", "campaign", "lobbyists", "ethics", "officials"];
      const currentIndex = categories.indexOf(selectedCategory);
      
      if (isLeftSwipe && currentIndex < categories.length - 1) {
        setSelectedCategory(categories[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        setSelectedCategory(categories[currentIndex - 1]);
      }
    }
  };

  // Pull to refresh handler
  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/live-data/campaign-finance'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/live-data/lobbyists'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/live-data/ethics-violations'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/live-data/elected-officials'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/live-data/status'] })
      ]);
      
      // Add a small delay for visual feedback
      setTimeout(() => setIsRefreshing(false), 1000);
    } catch (error) {
      setIsRefreshing(false);
    }
  };

  // Mobile-optimized data processing
  const statsData = {
    campaign: Array.isArray(campaignData) ? campaignData.length : 0,
    lobbyist: Array.isArray(lobbyistData) ? lobbyistData.length : 0,
    ethics: Array.isArray(ethicsData) ? ethicsData.length : 0,
    totalSources: dataSources?.sources?.length || 0,
    activeSources: dataSources?.sources?.filter((s: any) => s.status === 'active').length || 0
  };

  // Mobile categories for bottom navigation
  const mobileCategories = [
    { id: "overview", label: "Overview", icon: Eye, color: "text-blue-600" },
    { id: "campaign", label: "Campaign $", icon: DollarSign, color: "text-green-600" },
    { id: "lobbyists", label: "Lobbyists", icon: Users, color: "text-purple-600" },
    { id: "ethics", label: "Ethics", icon: Shield, color: "text-red-600" },
    { id: "officials", label: "Officials", icon: Building, color: "text-orange-600" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading authentic government data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Texas Transparency</h1>
                <p className="text-xs text-gray-500">Live Government Data</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="h-10 w-10 p-0"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          
          {isSearchExpanded && (
            <div className="mt-3 animate-in slide-in-from-top-2">
              <Input
                placeholder="Search records, officials, committees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 text-base"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      <div 
        className="px-4 py-6"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        ref={contentRef}
      >
        {/* Pull to Refresh Indicator */}
        {isRefreshing && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Swipe Indicator */}
        <div className="flex justify-center mb-4">
          <div className="flex space-x-1">
            {mobileCategories.map((category, index) => (
              <div
                key={category.id}
                className={`h-1 w-8 rounded-full transition-all duration-300 ${
                  selectedCategory === category.id ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        {/* Quick Stats Grid - Mobile First */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Campaign Records</p>
                  <p className="text-2xl font-bold text-green-900">{statsData.campaign}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Lobbyists</p>
                  <p className="text-2xl font-bold text-purple-900">{statsData.lobbyist}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Ethics Records</p>
                  <p className="text-2xl font-bold text-red-900">{statsData.ethics}</p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Data Sources</p>
                  <p className="text-2xl font-bold text-blue-900">{statsData.activeSources}/{statsData.totalSources}</p>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Based on Selected Category */}
        {selectedCategory === "overview" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Live Data Connections
                </CardTitle>
                <CardDescription>
                  Authentic government data sources connected and syncing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataSources?.sources?.map((source: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {source.status === 'active' ? (
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{source.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{source.type}</p>
                        </div>
                      </div>
                      <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {source.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedCategory === "campaign" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Campaign Finance Records
                </CardTitle>
                <CardDescription>
                  Authentic data from Federal Election Commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(campaignData) && campaignData.length > 0 ? (
                  <div className="space-y-3">
                    {campaignData.slice(0, 5).map((record: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{record.entityName || 'Unknown Entity'}</p>
                            <p className="text-xs text-gray-600">{record.entityType || 'Type unknown'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">${record.amount?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-gray-500">{record.cycle || new Date().getFullYear()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Campaign finance data will appear here when synced</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedCategory === "lobbyists" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                  Lobbyist Registrations
                </CardTitle>
                <CardDescription>
                  Authentic data from Texas Ethics Commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(lobbyistData) && lobbyistData.length > 0 ? (
                  <div className="space-y-3">
                    {lobbyistData.slice(0, 5).map((record: any, index: number) => (
                      <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{record.lobbyistName || 'Unknown Lobbyist'}</p>
                            <p className="text-xs text-gray-600">{record.clientName || 'Client unknown'}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {record.year || new Date().getFullYear()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Lobbyist registration data will appear here when synced</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedCategory === "ethics" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-red-500" />
                  Ethics Records
                </CardTitle>
                <CardDescription>
                  Authentic data from Texas Ethics Commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(ethicsData) && ethicsData.length > 0 ? (
                  <div className="space-y-3">
                    {ethicsData.slice(0, 5).map((record: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{record.entityName || 'Unknown Entity'}</p>
                            <p className="text-xs text-gray-600">{record.entityType || 'Type unknown'}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {record.cycle || new Date().getFullYear()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Ethics records will appear here when synced</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedCategory === "officials" && (
          <div className="space-y-4">
            <div className="text-center text-gray-600 text-sm mb-4">
              Living Profile Cards - Real Government Data
            </div>
            
            {Array.isArray(officialsData) && officialsData.length > 0 ? (
              <div className="space-y-4">
                {officialsData.slice(0, 6).map((official: any, index: number) => (
                  <Card key={index} className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-orange-800 text-lg">{official.name || 'Official Name'}</h3>
                          <p className="text-orange-600 text-sm font-medium">{official.position || official.office || 'Position'}</p>
                          <p className="text-gray-600 text-xs">{official.district || official.party || 'District/Party'}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                            {official.transparency_score || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-green-100 p-2 rounded text-center">
                          <div className="font-semibold text-green-800">${official.campaign_raised || '0'}</div>
                          <div className="text-green-600">Raised</div>
                        </div>
                        <div className="bg-purple-100 p-2 rounded text-center">
                          <div className="font-semibold text-purple-800">{official.lobbyist_contacts || '0'}</div>
                          <div className="text-purple-600">Contacts</div>
                        </div>
                        <div className="bg-red-100 p-2 rounded text-center">
                          <div className="font-semibold text-red-800">{official.ethics_issues || '0'}</div>
                          <div className="text-red-600">Issues</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Last updated: {official.last_updated || 'Recently'}
                        </span>
                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-300">
                          View Full Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="text-center">
                  <Button variant="outline" className="w-full text-orange-600 border-orange-300">
                    Load More Officials
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6 text-center">
                  <Building className="h-12 w-12 text-orange-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-orange-800 mb-2">Loading Official Profiles</h3>
                  <p className="text-orange-600 text-sm mb-4">
                    Fetching live data from Texas government sources...
                  </p>
                  <Button 
                    onClick={handlePullToRefresh}
                    variant="outline" 
                    className="text-orange-600 border-orange-300"
                  >
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {mobileCategories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col gap-1 h-16 px-2 ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{category.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}