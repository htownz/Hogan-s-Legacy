import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FeedPost } from './feed-post';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

type FeedType = 'all' | 'news' | 'bill_update' | 'action_alert' | 'event' | 'user_post';

export const FeedList: React.FC<{ personalized?: boolean }> = ({ personalized = false }) => {
  const [feedType, setFeedType] = useState<FeedType>('all');
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const feedEndpoint = personalized ? '/api/feed/personalized' : '/api/feed';
  const typeEndpoint = feedType !== 'all' ? `/api/feed/type/${feedType}` : null;
  
  const feedQuery = useQuery<any>({
    queryKey: [
      typeEndpoint || feedEndpoint, 
      { limit, offset: (page - 1) * limit }
    ],
    queryFn: async () => {
      const url = typeEndpoint || feedEndpoint;
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit)
      });
      const response = await apiRequest(`${url}?${params}`);
      // Ensure we always return an array even if the API returns something else
      return Array.isArray(response) ? response : [];
    }
  });

  const handleReact = async (postId: number, reactionType: string) => {
    try {
      // Make a POST request to add a reaction
      await fetch(`/api/feed/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: reactionType }),
      });
      
      // Refetch post data after reaction
      await feedQuery.refetch();
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const handleComment = (postId: number) => {
    // This would typically open a comment modal or navigate to a post detail page
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: number) => {
    // This would typically open a share dialog
    console.log('Share post:', postId);
    
    // For demo purposes, just copy a link to clipboard
    const url = `${window.location.origin}/feed/post/${postId}`;
    navigator.clipboard.writeText(url)
      .then(() => alert('Link copied to clipboard!'))
      .catch(err => console.error('Failed to copy link:', err));
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => setFeedType(value as FeedType)}>
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="bill_update">Bills</TabsTrigger>
          <TabsTrigger value="action_alert">Alerts</TabsTrigger>
          <TabsTrigger value="event">Events</TabsTrigger>
          <TabsTrigger value="user_post">Community</TabsTrigger>
        </TabsList>

        <TabsContent value={feedType}>
          {feedQuery.isPending ? (
            // Loading state
            <div>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="mb-4">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : feedQuery.isError ? (
            // Error state
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load feed. Please try again later.
              </AlertDescription>
            </Alert>
          ) : feedQuery.data?.length === 0 ? (
            // Empty state
            <div className="text-center py-8">
              <p className="text-gray-500">No posts to display.</p>
            </div>
          ) : (
            // Success state with posts
            <>
              {feedQuery.data?.map((post: any) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  onReact={handleReact}
                  onComment={handleComment}
                  onShare={handleShare}
                  // These would typically come from the API
                  userReaction={null}
                  reactionCounts={[]}
                  commentCount={0}
                />
              ))}
              {feedQuery.data?.length === limit && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={feedQuery.isFetching}
                  >
                    {feedQuery.isFetching && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};