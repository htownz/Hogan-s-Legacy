import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  MessageSquareIcon, 
  PlusIcon, 
  TrendingUpIcon,
  ClockIcon,
  UserIcon,
  FilterIcon,
  SearchIcon,
  Flame,
  Loader2,
  ThumbsUpIcon,
  EyeIcon,
  ShareIcon,
  Star,
  Heart,
  Users,
  Trophy,
  Target,
  Lightbulb,
  Calendar,
  Tag
} from "lucide-react";

interface EnhancedBillSuggestion {
  id: string;
  title: string;
  description: string;
  fullProposal?: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy: string;
  submittedAt: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  status: 'proposed' | 'under_review' | 'in_drafting' | 'rejected' | 'implemented' | 'needs_support';
  tags: string[];
  userVote?: 'up' | 'down' | null;
  views: number;
  supporterCount: number;
  expertEndorsements: number;
  targetVotes: number;
  daysRemaining?: number;
  impactArea: string[];
  estimatedCost?: string;
  difficultyLevel: 'low' | 'medium' | 'high';
  legislativeSession?: string;
  relatedBills?: string[];
}

interface SuggestionStats {
  totalSuggestions: number;
  activeCampaigns: number;
  successfulBills: number;
  totalVotes: number;
  topCategories: Array<{ name: string; count: number; trend: number }>;
  recentActivity: Array<{ type: string; title: string; time: string }>;
}

export default function EnhancedBillSuggestionsPage() {
  const [activeTab, setActiveTab] = useState("explore");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EnhancedBillSuggestion | null>(null);
  
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    fullProposal: "",
    category: "",
    subcategory: "",
    priority: "medium" as const,
    tags: [] as string[],
    impactArea: [] as string[],
    estimatedCost: "",
    difficultyLevel: "medium" as const,
    targetVotes: 100
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const mockSuggestions: EnhancedBillSuggestion[] = [
    {
      id: "1",
      title: "Expand Mental Health Services in Texas Schools",
      description: "Mandate comprehensive mental health support programs in all Texas public schools, including counselors, therapy services, and crisis intervention.",
      fullProposal: "This bill would require all Texas school districts to provide at least one mental health counselor per 250 students, establish peer support programs, and create emergency mental health response protocols.",
      category: "Education",
      subcategory: "Mental Health",
      priority: "high",
      submittedBy: "Sarah M.",
      submittedAt: "2024-01-15",
      upvotes: 2847,
      downvotes: 156,
      commentCount: 183,
      status: "under_review",
      tags: ["mental health", "schools", "counseling", "crisis intervention"],
      views: 15420,
      supporterCount: 2691,
      expertEndorsements: 12,
      targetVotes: 5000,
      daysRemaining: 45,
      impactArea: ["Student Wellbeing", "Educational Outcomes", "Suicide Prevention"],
      estimatedCost: "$50-75M annually",
      difficultyLevel: "high",
      legislativeSession: "89th Regular Session",
      relatedBills: ["HB 1234", "SB 567"]
    },
    {
      id: "2", 
      title: "Universal High-Speed Internet Access Act",
      description: "Establish statewide broadband infrastructure to ensure every Texas household has access to affordable high-speed internet.",
      category: "Technology",
      subcategory: "Infrastructure",
      priority: "high",
      submittedBy: "Marcus J.",
      submittedAt: "2024-01-12",
      upvotes: 1923,
      downvotes: 287,
      commentCount: 94,
      status: "proposed",
      tags: ["broadband", "internet", "rural access", "digital divide"],
      views: 8765,
      supporterCount: 1636,
      expertEndorsements: 8,
      targetVotes: 3000,
      daysRemaining: 62,
      impactArea: ["Rural Development", "Economic Growth", "Education"],
      estimatedCost: "$2.1B over 5 years",
      difficultyLevel: "high"
    },
    {
      id: "3",
      title: "Small Business Tax Relief for Local Entrepreneurs", 
      description: "Reduce business taxes for small businesses with fewer than 50 employees to stimulate local economic growth.",
      category: "Economic Development",
      subcategory: "Small Business",
      priority: "medium",
      submittedBy: "Jennifer L.",
      submittedAt: "2024-01-10",
      upvotes: 1456,
      downvotes: 203,
      commentCount: 67,
      status: "needs_support",
      tags: ["small business", "tax relief", "economic growth", "entrepreneurs"],
      views: 5432,
      supporterCount: 1253,
      expertEndorsements: 5,
      targetVotes: 2000,
      daysRemaining: 38,
      impactArea: ["Job Creation", "Local Economy", "Innovation"],
      estimatedCost: "$125M in tax revenue reduction",
      difficultyLevel: "medium"
    }
  ];

  const mockStats: SuggestionStats = {
    totalSuggestions: 147,
    activeCampaigns: 23,
    successfulBills: 8,
    totalVotes: 45678,
    topCategories: [
      { name: "Education", count: 34, trend: 12 },
      { name: "Healthcare", count: 28, trend: 8 },
      { name: "Environment", count: 25, trend: -3 },
      { name: "Transportation", count: 19, trend: 15 }
    ],
    recentActivity: [
      { type: "vote", title: "Mental Health Services", time: "2 hours ago" },
      { type: "comment", title: "Broadband Access Act", time: "4 hours ago" },
      { type: "proposal", title: "Green Energy Initiative", time: "1 day ago" }
    ]
  };

  const categories = [
    "Education", "Healthcare", "Environment", "Transportation", 
    "Economic Development", "Technology", "Public Safety", "Housing"
  ];

  const impactAreas = [
    "Student Wellbeing", "Public Health", "Economic Growth", "Environmental Protection",
    "Rural Development", "Urban Planning", "Job Creation", "Innovation"
  ];

  const handleVote = useMutation({
    mutationFn: async ({ suggestionId, voteType }: { suggestionId: string; voteType: 'up' | 'down' }) => {
      const response = await fetch('/api/community/suggestions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, voteType })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/suggestions'] });
      toast({ title: "Vote recorded!", description: "Thank you for participating in civic democracy." });
    }
  });

  const handleCreateSuggestion = useMutation({
    mutationFn: async (suggestion: typeof newSuggestion) => {
      const response = await fetch('/api/community/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestion)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/suggestions'] });
      setShowCreateForm(false);
      setNewSuggestion({
        title: "", description: "", fullProposal: "", category: "", subcategory: "",
        priority: "medium", tags: [], impactArea: [], estimatedCost: "",
        difficultyLevel: "medium", targetVotes: 100
      });
      toast({ title: "Suggestion created!", description: "Your proposal is now live for community voting." });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'in_drafting': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'needs_support': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Flame className="w-4 h-4 text-red-600" />;
      case 'high': return <TrendingUpIcon className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Target className="w-4 h-4 text-blue-600" />;
      default: return <ClockIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredSuggestions = mockSuggestions.filter(suggestion => {
    const matchesSearch = suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suggestion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || suggestion.category === selectedCategory;
    const matchesPriority = selectedPriority === "all" || suggestion.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Community Bill Suggestions</h1>
        <p className="text-muted-foreground">
          Propose, vote, and champion legislation that matters to Texas citizens
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalSuggestions}</p>
                <p className="text-sm text-muted-foreground">Total Proposals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.activeCampaigns}</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.successfulBills}</p>
                <p className="text-sm text-muted-foreground">Bills Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalVotes.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Community Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explore">Explore Proposals</TabsTrigger>
          <TabsTrigger value="trending">Trending Now</TabsTrigger>
          <TabsTrigger value="my-activity">My Activity</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search proposals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="most_votes">Most Votes</SelectItem>
                    <SelectItem value="most_comments">Most Discussed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions List */}
          <div className="grid gap-6">
            {filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(suggestion.priority)}
                        <h3 className="text-xl font-semibold">{suggestion.title}</h3>
                        <Badge className={getStatusColor(suggestion.status)}>
                          {suggestion.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground">{suggestion.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {suggestion.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  {suggestion.targetVotes && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Support Progress</span>
                        <span>{suggestion.upvotes} / {suggestion.targetVotes} votes</span>
                      </div>
                      <Progress 
                        value={(suggestion.upvotes / suggestion.targetVotes) * 100} 
                        className="h-2"
                      />
                      {suggestion.daysRemaining && (
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {suggestion.daysRemaining} days remaining
                        </p>
                      )}
                    </div>
                  )}

                  {/* Impact Areas */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Impact Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.impactArea.map((area, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {suggestion.submittedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      {suggestion.views.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquareIcon className="w-4 h-4" />
                      {suggestion.commentCount} comments
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {suggestion.expertEndorsements} expert endorsements
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote.mutate({ suggestionId: suggestion.id, voteType: 'up' })}
                        className="flex items-center gap-1"
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                        {suggestion.upvotes}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote.mutate({ suggestionId: suggestion.id, voteType: 'down' })}
                        className="flex items-center gap-1"
                      >
                        <ArrowDownIcon className="w-4 h-4" />
                        {suggestion.downvotes}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <MessageSquareIcon className="w-4 h-4 mr-1" />
                        Discuss
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <ShareIcon className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setSelectedSuggestion(suggestion)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Bill Proposal</CardTitle>
              <p className="text-muted-foreground">
                Submit your legislative idea to the Texas community for feedback and support
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title *</Label>
                  <Input
                    id="title"
                    value={newSuggestion.title}
                    onChange={(e) => setNewSuggestion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a clear, compelling title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={newSuggestion.category} onValueChange={(value) => 
                    setNewSuggestion(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Brief Description *</Label>
                <Textarea
                  id="description"
                  value={newSuggestion.description}
                  onChange={(e) => setNewSuggestion(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize your proposal in 2-3 sentences"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullProposal">Full Proposal Details</Label>
                <Textarea
                  id="fullProposal"
                  value={newSuggestion.fullProposal}
                  onChange={(e) => setNewSuggestion(prev => ({ ...prev, fullProposal: e.target.value }))}
                  placeholder="Provide detailed explanation, implementation steps, expected outcomes..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={newSuggestion.priority} onValueChange={(value: any) => 
                    setNewSuggestion(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Implementation Difficulty</Label>
                  <Select value={newSuggestion.difficultyLevel} onValueChange={(value: any) => 
                    setNewSuggestion(prev => ({ ...prev, difficultyLevel: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetVotes">Target Support Votes</Label>
                  <Input
                    id="targetVotes"
                    type="number"
                    value={newSuggestion.targetVotes}
                    onChange={(e) => setNewSuggestion(prev => ({ ...prev, targetVotes: parseInt(e.target.value) || 100 }))}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost/Impact</Label>
                <Input
                  id="estimatedCost"
                  value={newSuggestion.estimatedCost}
                  onChange={(e) => setNewSuggestion(prev => ({ ...prev, estimatedCost: e.target.value }))}
                  placeholder="e.g. '$50M annually' or 'Cost-neutral' or 'Revenue generating'"
                />
              </div>

              <Button 
                onClick={() => handleCreateSuggestion.mutate(newSuggestion)}
                disabled={!newSuggestion.title || !newSuggestion.description || !newSuggestion.category}
                className="w-full"
                size="lg"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Submit Proposal for Community Review
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}