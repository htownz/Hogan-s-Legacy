import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  Heart, 
  TrendingUp, 
  Brain, 
  Target,
  Users,
  Calendar,
  FileText,
  Settings,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share,
  Bell,
  Filter,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface UserPreferences {
  topics: string[];
  chambers: string[];
  urgencyLevel: number;
  complexityLevel: number;
  partisanPreference: string;
  notificationFrequency: string;
  autoBookmark: boolean;
  prioritizeLocal: boolean;
}

interface RecommendedBill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsors: string[];
  introducedAt: string;
  matchScore: number;
  reasoning: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  userInteractions: {
    viewed: boolean;
    saved: boolean;
    shared: boolean;
    liked: boolean;
  };
  predictedImpact: string;
  similarUsers: number;
}

interface RecommendationInsight {
  type: 'trending' | 'personal' | 'urgent' | 'similar_users';
  title: string;
  description: string;
  count: number;
  icon: any;
  color: string;
}

export default function PersonalizedRecommendations() {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    topics: ["Education", "Healthcare", "Environment"],
    chambers: ["House", "Senate"],
    urgencyLevel: 70,
    complexityLevel: 50,
    partisanPreference: "balanced",
    notificationFrequency: "daily",
    autoBookmark: false,
    prioritizeLocal: true
  });
  const [feedbackScores, setFeedbackScores] = useState<{[key: string]: number}>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch personalized recommendations
  const { data: recommendations, isLoading: recommendationsLoading, refetch } = useQuery<any>({
    queryKey: ["/api/recommendations/personalized", userPreferences],
  });

  // Fetch recommendation insights
  const { data: insights } = useQuery<any>({
    queryKey: ["/api/recommendations/insights"],
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      const response = await fetch('/api/recommendations/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your recommendation preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations/personalized"] });
    }
  });

  // Bill feedback mutation
  const billFeedbackMutation = useMutation({
    mutationFn: async (data: { billId: string; action: string; score?: number }) => {
      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Recorded",
        description: "Thanks! This helps improve your recommendations.",
      });
    }
  });

  // Mock data for demonstration with realistic Texas legislative content
  const mockRecommendations: RecommendedBill[] = [
    {
      id: "HB-2847",
      title: "Texas Education Funding Equity Act",
      description: "Comprehensive reform of public school funding formulas to address disparities between rural and urban districts",
      status: "Committee Review",
      chamber: "House",
      sponsors: ["Rep. Sarah Johnson", "Rep. Michael Davis"],
      introducedAt: "2024-03-15",
      matchScore: 96,
      reasoning: [
        "Matches your interest in education policy",
        "High community engagement in your area",
        "Similar bills you've previously saved",
        "Trending among users with similar preferences"
      ],
      urgency: "high",
      complexity: 7,
      userInteractions: {
        viewed: false,
        saved: false,
        shared: false,
        liked: false
      },
      predictedImpact: "High - Could affect 1.2M Texas students",
      similarUsers: 847
    },
    {
      id: "SB-1492",
      title: "Rural Healthcare Access Expansion",
      description: "Expanding telemedicine services and mobile clinic programs for underserved Texas communities",
      status: "Passed Committee",
      chamber: "Senate",
      sponsors: ["Sen. Maria Rodriguez", "Sen. Robert Chen"],
      introducedAt: "2024-02-28",
      matchScore: 89,
      reasoning: [
        "Aligns with your healthcare interests",
        "Affects rural communities like yours",
        "Bipartisan support matches your preferences",
        "Medium complexity fits your settings"
      ],
      urgency: "medium",
      complexity: 5,
      userInteractions: {
        viewed: true,
        saved: false,
        shared: false,
        liked: false
      },
      predictedImpact: "Medium - Benefits 500K rural Texans",
      similarUsers: 623
    },
    {
      id: "HB-3156",
      title: "Texas Clean Energy Investment Initiative",
      description: "Incentives for renewable energy projects and infrastructure development across Texas",
      status: "In Committee",
      chamber: "House",
      sponsors: ["Rep. Jennifer Martinez", "Rep. David Wilson"],
      introducedAt: "2024-03-01",
      matchScore: 83,
      reasoning: [
        "Matches your environmental interests",
        "Economic impact in your region",
        "Progressive policy alignment",
        "High user engagement potential"
      ],
      urgency: "medium",
      complexity: 6,
      userInteractions: {
        viewed: false,
        saved: true,
        shared: false,
        liked: true
      },
      predictedImpact: "High - Statewide environmental benefits",
      similarUsers: 1203
    }
  ];

  const mockInsights: RecommendationInsight[] = [
    {
      type: "personal",
      title: "Personal Matches",
      description: "Bills matching your interests",
      count: 12,
      icon: Target,
      color: "bg-blue-500"
    },
    {
      type: "trending",
      title: "Trending Now",
      description: "Popular among similar users",
      count: 8,
      icon: TrendingUp,
      color: "bg-green-500"
    },
    {
      type: "urgent",
      title: "Time Sensitive",
      description: "Bills requiring immediate attention",
      count: 3,
      icon: Bell,
      color: "bg-red-500"
    },
    {
      type: "similar_users",
      title: "Community Picks",
      description: "Recommended by your network",
      count: 15,
      icon: Users,
      color: "bg-purple-500"
    }
  ];

  const availableTopics = [
    "Education", "Healthcare", "Environment", "Transportation", 
    "Criminal Justice", "Budget & Finance", "Agriculture", "Technology"
  ];

  const handleBillFeedback = (billId: string, action: string, score?: number) => {
    if (score !== undefined) {
      setFeedbackScores(prev => ({ ...prev, [billId]: score }));
    }
    billFeedbackMutation.mutate({ billId, action, score });
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...userPreferences, ...updates };
    setUserPreferences(newPreferences);
    updatePreferencesMutation.mutate(newPreferences);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🎯 Personalized Bill Recommendations
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered recommendations based on your interests, location, and engagement patterns
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Personalized Feed</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={recommendationsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${recommendationsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {mockRecommendations.map((bill) => (
              <Card key={bill.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{bill.id}</Badge>
                        <Badge className={getUrgencyColor(bill.urgency)}>
                          {bill.urgency} priority
                        </Badge>
                        <Badge variant="secondary">{bill.chamber}</Badge>
                        <div className={`flex items-center gap-1 ${getMatchScoreColor(bill.matchScore)}`}>
                          <Star className="h-4 w-4" />
                          <span className="font-bold">{bill.matchScore}% match</span>
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-2">{bill.title}</CardTitle>
                      <CardDescription className="text-base">
                        {bill.description}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBillFeedback(bill.id, 'save')}
                      >
                        <Bookmark className={`h-4 w-4 ${bill.userInteractions.saved ? 'fill-current text-blue-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBillFeedback(bill.id, 'like')}
                      >
                        <Heart className={`h-4 w-4 ${bill.userInteractions.liked ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="reasoning">Why This Bill?</TabsTrigger>
                      <TabsTrigger value="impact">Impact</TabsTrigger>
                      <TabsTrigger value="community">Community</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Introduced:</span>
                          <p className="font-medium">{new Date(bill.introducedAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Sponsors:</span>
                          <p className="font-medium">{bill.sponsors.join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Complexity:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={bill.complexity * 10} className="flex-1 h-2" />
                            <span className="text-sm">{bill.complexity}/10</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="reasoning" className="mt-4">
                      <div className="space-y-2">
                        {bill.reasoning.map((reason, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <Brain className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="impact" className="mt-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium mb-2">Predicted Impact</h4>
                        <p className="text-sm text-green-800">{bill.predictedImpact}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="community" className="mt-4">
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Community Engagement</h4>
                          <p className="text-sm text-muted-foreground">
                            {bill.similarUsers} users with similar interests are following this bill
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Feedback Section */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">How relevant is this bill to you?</h4>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBillFeedback(bill.id, 'thumbs_up', 1)}
                        className={feedbackScores[bill.id] === 1 ? 'bg-green-100 text-green-700' : ''}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Very Relevant
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBillFeedback(bill.id, 'thumbs_down', -1)}
                        className={feedbackScores[bill.id] === -1 ? 'bg-red-100 text-red-700' : ''}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Not Relevant
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <h2 className="text-2xl font-semibold">Recommendation Insights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockInsights.map((insight) => {
                const IconComponent = insight.icon;
                return (
                  <Card key={insight.type}>
                    <CardContent className="p-6 text-center">
                      <div className={`${insight.color} p-3 rounded-full text-white inline-flex mb-3`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-2xl font-bold text-blue-600 mb-2">{insight.count}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Recommendation Performance</CardTitle>
                <CardDescription>How well our recommendations matched your interests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Accuracy Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={87} className="w-32" />
                      <span className="font-bold text-green-600">87%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bills Discovered</span>
                    <span className="font-bold">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time Saved</span>
                    <span className="font-bold">2.5 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <h2 className="text-2xl font-semibold">Customize Your Recommendations</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Topics of Interest</CardTitle>
                  <CardDescription>Select the policy areas you care about most</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTopics.map((topic) => (
                      <div key={topic} className="flex items-center space-x-2">
                        <Switch
                          id={topic}
                          checked={userPreferences.topics.includes(topic)}
                          onCheckedChange={(checked) => {
                            const newTopics = checked
                              ? [...userPreferences.topics, topic]
                              : userPreferences.topics.filter(t => t !== topic);
                            updatePreferences({ topics: newTopics });
                          }}
                        />
                        <label htmlFor={topic} className="text-sm font-medium">
                          {topic}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendation Settings</CardTitle>
                  <CardDescription>Fine-tune how we select bills for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Urgency Level: {userPreferences.urgencyLevel}%
                    </label>
                    <Slider
                      value={[userPreferences.urgencyLevel]}
                      onValueChange={([value]) => updatePreferences({ urgencyLevel: value })}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher values prioritize time-sensitive bills
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Complexity Level: {userPreferences.complexityLevel}%
                    </label>
                    <Slider
                      value={[userPreferences.complexityLevel]}
                      onValueChange={([value]) => updatePreferences({ complexityLevel: value })}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher values include more complex legislation
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Auto-bookmark high matches</label>
                      <p className="text-xs text-muted-foreground">Automatically save bills with 90%+ match</p>
                    </div>
                    <Switch
                      checked={userPreferences.autoBookmark}
                      onCheckedChange={(checked) => updatePreferences({ autoBookmark: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Prioritize local impact</label>
                      <p className="text-xs text-muted-foreground">Emphasize bills affecting your area</p>
                    </div>
                    <Switch
                      checked={userPreferences.prioritizeLocal}
                      onCheckedChange={(checked) => updatePreferences({ prioritizeLocal: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}