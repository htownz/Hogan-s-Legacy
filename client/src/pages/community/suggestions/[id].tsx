// @ts-nocheck
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../../../context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageSquare, Calendar, User, ChevronLeft, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Types
type BillSuggestion = {
  id: number;
  userId: number;
  billId: string | null;
  title: string;
  description: string;
  rationale: string;
  actionItems: string | null;
  priority: string | null;
  impact: string | null;
  upvoteCount: number;
  commentCount: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    username: string;
    displayName: string | null;
  };
};

type SuggestionCategory = {
  id: number;
  suggestionId: number;
  name: string;
  createdAt: string;
};

type SuggestionComment = {
  id: number;
  suggestionId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    displayName: string | null;
  };
};

const SuggestionDetailPage = () => {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  // Fetch suggestion details
  const { data: suggestion, isLoading: isSuggestionLoading, isError: isSuggestionError } = useQuery<BillSuggestion>({
    queryKey: [`/api/community/suggestions/${id}`],
  });

  // Fetch suggestion categories
  const { data: categories } = useQuery<SuggestionCategory[]>({
    queryKey: [`/api/community/suggestions/${id}/categories`],
    enabled: !!suggestion,
  });

  // Fetch suggestion comments
  const { data: comments, isLoading: isCommentsLoading, refetch: refetchComments } = useQuery<SuggestionComment[]>({
    queryKey: [`/api/community/suggestions/${id}/comments`],
    enabled: !!suggestion,
  });

  // Check if user has upvoted
  const { data: hasUpvoted } = useQuery<{ hasUpvoted: boolean }>({
    queryKey: [`/api/community/suggestions/${id}/upvoted`],
    enabled: !!user && !!suggestion,
  });

  // Handle upvote
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to upvote");

      const response = await fetch(`/api/community/suggestions/${id}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upvote");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/suggestions/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/community/suggestions/${id}/upvoted`] });
      toast({
        title: "Success",
        description: "Your vote has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upvote",
        variant: "destructive",
      });
    },
  });

  // Handle adding comment
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("You must be logged in to comment");

      const response = await fetch(`/api/community/suggestions/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id, content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add comment");
      }

      return response.json();
    },
    onSuccess: () => {
      setCommentContent("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: [`/api/community/suggestions/${id}`] });
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upvote suggestions.",
        variant: "destructive",
      });
      return;
    }

    upvoteMutation.mutate();
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    commentMutation.mutate(commentContent);
  };

  if (isSuggestionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  if (isSuggestionError || !suggestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Could not find the requested suggestion</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/community")}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Community
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/community")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Community
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{suggestion.title}</CardTitle>
                  {suggestion.billId && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="mr-2">
                        {suggestion.billId}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/bills/${suggestion.billId}`} target="_blank" rel="noopener noreferrer">
                          View Bill <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
                {suggestion.featured && (
                  <Badge variant="default" className="bg-amber-500">
                    Featured
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <Tabs defaultValue="info" className="w-full" onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="comments">
                    Comments ({suggestion.commentCount})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="info" className="mt-0">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Description</h3>
                      <p className="mt-2">{suggestion.description}</p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold">Why This Matters</h3>
                      <p className="mt-2 whitespace-pre-line">{suggestion.rationale}</p>
                    </div>

                    {suggestion.actionItems && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold">Suggested Actions</h3>
                          <p className="mt-2 whitespace-pre-line">{suggestion.actionItems}</p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      {categories?.map((category) => (
                        <Badge key={category.id} variant="outline">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="comments" className="mt-0">
                <CardContent className="pt-6">
                  {user && (
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="min-h-[100px] mb-2"
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={commentMutation.isPending}>
                          {commentMutation.isPending ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </form>
                  )}

                  {isCommentsLoading ? (
                    <div className="text-center py-10">Loading comments...</div>
                  ) : comments && comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <Card key={comment.id}>
                          <CardHeader className="py-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span className="font-medium">
                                  {comment.user.displayName || comment.user.username}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2">
                            <p className="whitespace-pre-line">{comment.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  <span>{suggestion.upvoteCount} Upvotes</span>
                </div>
                <Button
                  onClick={handleUpvote}
                  disabled={upvoteMutation.isPending}
                  variant={hasUpvoted?.hasUpvoted ? "default" : "outline"}
                  size="sm"
                >
                  {hasUpvoted?.hasUpvoted ? "Upvoted" : "Upvote"}
                </Button>
              </div>

              <div className="flex items-center mb-4">
                <MessageSquare className="h-5 w-5 mr-2" />
                <span>{suggestion.commentCount} Comments</span>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2" />
                  <span>Suggested by: <span className="font-medium">{suggestion.user?.displayName || suggestion.user?.username || "Anonymous"}</span></span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Posted: {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {suggestion.priority || suggestion.impact ? (
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestion.priority && (
                    <div>
                      <h4 className="font-medium mb-1">Priority:</h4>
                      <Badge>{suggestion.priority}</Badge>
                    </div>
                  )}
                  
                  {suggestion.impact && (
                    <div>
                      <h4 className="font-medium mb-1">Impact:</h4>
                      <p>{suggestion.impact}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SuggestionDetailPage;