// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../../context/UserContext";

// Type definitions for our data structures
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
};

type SuggestionCategory = {
  id: number;
  suggestionId: number;
  name: string;
  createdAt: string;
};

const CommunityPage = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all suggestions
  const { data: suggestions, isLoading, isError, refetch } = useQuery<BillSuggestion[]>({
    queryKey: ["/api/community/suggestions"],
  });

  // Fetch featured suggestions
  const { data: featuredSuggestions } = useQuery<BillSuggestion[]>({
    queryKey: ["/api/community/suggestions/featured"],
  });

  // Fetch trending suggestions
  const { data: trendingSuggestions } = useQuery<BillSuggestion[]>({
    queryKey: ["/api/community/suggestions/trending"],
  });

  // Fetch all categories
  const { data: categories } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["/api/community/categories"],
  });

  // Handle upvote
  const handleUpvote = async (suggestionId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to upvote suggestions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/community/suggestions/${suggestionId}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        refetch();
        toast({
          title: "Success",
          description: "Your vote has been recorded.",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not process your vote. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const getSuggestionsToDisplay = () => {
    switch (activeTab) {
      case "featured":
        return featuredSuggestions || [];
      case "trending":
        return trendingSuggestions || [];
      case "all":
      default:
        return suggestions || [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p>Failed to load community suggestions. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community Bill Suggestions</h1>
          <p className="text-muted-foreground">
            Help identify and prioritize bills that matter to your community
          </p>
        </div>
        <Link href="/community/suggest">
          <Button size="lg">
            Suggest a Bill
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            {categories?.slice(0, 5).map((category) => (
              <Badge key={category.name} variant="outline" className="cursor-pointer">
                {category.name} ({category.count})
              </Badge>
            ))}
            {categories && categories.length > 5 && (
              <Badge variant="outline" className="cursor-pointer">
                More...
              </Badge>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getSuggestionsToDisplay().map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onUpvote={handleUpvote}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="featured" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getSuggestionsToDisplay().map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onUpvote={handleUpvote}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="trending" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getSuggestionsToDisplay().map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onUpvote={handleUpvote}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface SuggestionCardProps {
  suggestion: BillSuggestion;
  onUpvote: (id: number) => void;
}

const SuggestionCard = ({ suggestion, onUpvote }: SuggestionCardProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{suggestion.title}</CardTitle>
            {suggestion.billId && (
              <Link href={`/bills/${suggestion.billId}`}>
                <Badge variant="secondary" className="mt-1">
                  {suggestion.billId}
                </Badge>
              </Link>
            )}
          </div>
          {suggestion.featured && (
            <Badge variant="default" className="bg-amber-500">
              Featured
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2 mt-2">
          {suggestion.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <h4 className="font-semibold mb-1">Why This Matters:</h4>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {suggestion.rationale}
        </p>
        
        {suggestion.priority && (
          <div className="mb-2">
            <span className="text-xs font-medium">Priority: </span>
            <Badge variant="outline" className="ml-1">
              {suggestion.priority}
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Comments: {suggestion.commentCount}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/community/suggestions/${suggestion.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => onUpvote(suggestion.id)}
            className="flex items-center gap-1"
          >
            <ThumbsUp size={16} />
            <span>{suggestion.upvoteCount}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CommunityPage;