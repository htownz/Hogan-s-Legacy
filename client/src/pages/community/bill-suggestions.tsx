// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  ShareIcon
} from "lucide-react";

interface BillSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy: string;
  submittedAt: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  status: 'proposed' | 'under_review' | 'in_drafting' | 'rejected' | 'implemented';
  tags: string[];
  userVote?: 'up' | 'down' | null;
  views: number;
}

interface SuggestionComment {
  id: string;
  suggestionId: string;
  content: string;
  author: string;
  createdAt: string;
  upvotes: number;
  userVote?: 'up' | 'down' | null;
}

export default function BillSuggestionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BillSuggestion | null>(null);
  const [newComment, setNewComment] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch bill suggestions
  const { data: suggestions, isLoading } = useQuery<any>({
    queryKey: ["bill-suggestions", searchQuery, categoryFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchQuery,
        category: categoryFilter,
        sortBy: sortBy,
        limit: "20"
      });
      
      const response = await fetch(`/api/community/bill-suggestions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    }
  });

  // Fetch comments for selected suggestion
  const { data: comments } = useQuery<any>({
    queryKey: ["suggestion-comments", selectedSuggestion?.id],
    queryFn: async () => {
      if (!selectedSuggestion?.id) return [];
      const response = await fetch(`/api/community/suggestions/${selectedSuggestion.id}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: !!selectedSuggestion?.id
  });

  // Create suggestion mutation
  const createSuggestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/community/bill-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create suggestion");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-suggestions"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success!",
        description: "Your bill suggestion has been submitted to the community."
      });
    }
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ suggestionId, voteType }: { suggestionId: string; voteType: 'up' | 'down' }) => {
      const response = await fetch(`/api/community/suggestions/${suggestionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType })
      });
      if (!response.ok) throw new Error("Failed to vote");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-suggestions"] });
    }
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/community/suggestions/${selectedSuggestion?.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestion-comments"] });
      queryClient.invalidateQueries({ queryKey: ["bill-suggestions"] });
      setNewComment("");
    }
  });

  const handleVote = (suggestionId: string, voteType: 'up' | 'down') => {
    voteMutation.mutate({ suggestionId, voteType });
  };

  const handleCreateSuggestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createSuggestionMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      priority: formData.get("priority"),
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()).filter(Boolean) || []
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    commentMutation.mutate({
      content: newComment,
      suggestionId: selectedSuggestion?.id
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'bg-blue-500';
      case 'under_review': return 'bg-yellow-500';
      case 'in_drafting': return 'bg-orange-500';
      case 'implemented': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏛️ Community Bill Suggestions
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Propose legislation, vote on community ideas, and help shape the future of our democracy.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search bill suggestions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <FilterIcon className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="housing">Housing</SelectItem>
              <SelectItem value="criminal_justice">Criminal Justice</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="most_voted">Most Voted</SelectItem>
              <SelectItem value="most_discussed">Most Discussed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="min-w-[160px]">
              <PlusIcon className="w-4 h-4 mr-2" />
              Suggest a Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Propose New Legislation</DialogTitle>
              <DialogDescription>
                Share your idea for new legislation that could benefit the community.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateSuggestion} className="space-y-4">
              <div>
                <Label htmlFor="title">Bill Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="e.g., Affordable Housing Development Act"
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Describe what this bill would accomplish and why it's needed..."
                  rows={4}
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="environment">Environment</SelectItem>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="criminal_justice">Criminal Justice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  placeholder="e.g., affordable, housing, development, zoning"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSuggestionMutation.isPending}>
                  {createSuggestionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PlusIcon className="w-4 h-4 mr-2" />
                  )}
                  Submit Suggestion
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suggestions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions?.suggestions?.map((suggestion: BillSuggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {suggestion.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-3 mb-3">
                          {suggestion.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(suggestion.status)}>
                            {suggestion.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {suggestion.category}
                          </Badge>
                          {suggestion.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          {suggestion.submittedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {new Date(suggestion.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {suggestion.views}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(suggestion.id, 'up')}
                            className={`p-1 ${suggestion.userVote === 'up' ? 'text-green-600' : 'text-gray-400'}`}
                            disabled={voteMutation.isPending}
                          >
                            <ArrowUpIcon className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium text-green-600">
                            {suggestion.upvotes}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(suggestion.id, 'down')}
                            className={`p-1 ${suggestion.userVote === 'down' ? 'text-red-600' : 'text-gray-400'}`}
                            disabled={voteMutation.isPending}
                          >
                            <ArrowDownIcon className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium text-red-600">
                            {suggestion.downvotes}
                          </span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSuggestion(suggestion)}
                          className="flex items-center gap-1"
                        >
                          <MessageSquareIcon className="w-4 h-4" />
                          {suggestion.commentCount}
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <ShareIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-blue-600" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Sarah Chen", suggestions: 12, upvotes: 145 },
                  { name: "Mike Rodriguez", suggestions: 8, upvotes: 98 },
                  { name: "Emily Johnson", suggestions: 6, upvotes: 76 }
                ].map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{contributor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contributor.name}</p>
                      <p className="text-xs text-gray-500">
                        {contributor.suggestions} suggestions • {contributor.upvotes} upvotes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-red-600" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["affordable-housing", "climate-action", "education-funding", "healthcare-access", "transportation"].map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gray-100">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Suggestions</span>
                  <span className="font-medium">{suggestions?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active This Week</span>
                  <span className="font-medium">{suggestions?.activeThisWeek || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Implemented</span>
                  <span className="font-medium text-green-600">{suggestions?.implemented || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comments Dialog */}
      {selectedSuggestion && (
        <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSuggestion.title}</DialogTitle>
              <DialogDescription>
                Discussion and feedback for this bill suggestion
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">{selectedSuggestion.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(selectedSuggestion.status)}>
                    {selectedSuggestion.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={getPriorityColor(selectedSuggestion.priority)}>
                    {selectedSuggestion.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-4">Discussion ({comments?.length || 0} comments)</h4>
                
                <div className="space-y-4 mb-6">
                  {comments?.map((comment: SuggestionComment) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {comment.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.author}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="p-1">
                            <ThumbsUpIcon className="w-3 h-3" />
                          </Button>
                          <span className="text-xs">{comment.upvotes}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add your thoughts on this suggestion..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={commentMutation.isPending || !newComment.trim()}
                  >
                    {commentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquareIcon className="w-4 h-4 mr-2" />
                    )}
                    Add Comment
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}