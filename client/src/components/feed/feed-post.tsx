import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Share2, Clock, Eye, AlertCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

type FeedPostProps = {
  post: {
    id: number;
    type: 'news' | 'user_post' | 'bill_update' | 'action_alert' | 'event';
    title: string;
    content: string;
    imageUrl?: string | null;
    externalUrl?: string | null;
    author?: {
      name: string;
      profileImageUrl: string | null;
    };
    tags?: string[];
    metadata?: {
      billId?: string;
      eventDate?: string | Date;
      sourceName?: string;
      sourceUrl?: string;
      priority?: number;
      location?: string;
    };
    isVerified?: boolean;
    isFeatured?: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
  };
  onReact?: (postId: number, reactionType: string) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  userReaction?: string | null;
  reactionCounts?: { type: string; count: number }[];
  commentCount?: number;
};

export const FeedPost: React.FC<FeedPostProps> = ({
  post,
  onReact,
  onComment,
  onShare,
  userReaction,
  reactionCounts = [],
  commentCount = 0
}) => {
  const formattedDate = typeof post.createdAt === 'string' 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : formatDistanceToNow(post.createdAt as Date, { addSuffix: true });

  const totalReactions = reactionCounts.reduce((total, reaction) => total + reaction.count, 0);
  
  // Generate post type badge
  const getPostTypeBadge = () => {
    switch (post.type) {
      case 'news':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">News</Badge>;
      case 'bill_update':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Bill Update</Badge>;
      case 'action_alert':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Action Alert</Badge>;
      case 'event':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Event</Badge>;
      case 'user_post':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Post</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {post.author && (
              <Avatar>
                <AvatarImage src={post.author.profileImageUrl || ''} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{post.author?.name || 'Anonymous'}</CardTitle>
                {post.isVerified && (
                  <span className="text-primary" title="Verified">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </span>
                )}
              </div>
              <CardDescription className="text-sm flex items-center gap-1">
                <Clock size={14} />
                {formattedDate}
                {getPostTypeBadge()}
              </CardDescription>
            </div>
          </div>
          {post.isFeatured && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <h3 className="font-bold text-lg mb-2">{post.title}</h3>
        <p className="text-gray-700">{post.content}</p>
        
        {post.imageUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover" />
          </div>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        
        {post.type === 'event' && post.metadata?.eventDate && (
          <div className="flex items-center gap-1 mt-3 text-sm text-gray-600">
            <Calendar size={16} />
            {typeof post.metadata.eventDate === 'string' 
              ? new Date(post.metadata.eventDate).toLocaleDateString() 
              : (post.metadata.eventDate as Date).toLocaleDateString()}
          </div>
        )}
        
        {post.type === 'bill_update' && post.metadata?.billId && (
          <div className="flex items-center gap-1 mt-3 text-sm text-gray-600">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {post.metadata.billId}
            </Badge>
          </div>
        )}
        
        {post.type === 'action_alert' && (
          <div className="flex items-center gap-1 mt-3 text-sm text-red-600 font-medium">
            <AlertCircle size={16} />
            Action Required
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 pb-3 flex flex-col">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <div className="flex items-center mr-4">
            <ThumbsUp size={14} className="mr-1" />
            <span>{totalReactions}</span>
          </div>
          <div className="flex items-center mr-4">
            <MessageSquare size={14} className="mr-1" />
            <span>{commentCount} comments</span>
          </div>
          {post.metadata?.sourceName && (
            <div className="ml-auto text-xs text-gray-400">
              Source: {post.metadata.sourceName}
            </div>
          )}
        </div>
        
        <div className="flex justify-between border-t pt-2 w-full">
          <Button
            variant={userReaction === 'like' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 mr-1"
            onClick={() => onReact?.(post.id, 'like')}
          >
            <ThumbsUp size={18} className="mr-2" />
            Support
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 mr-1"
            onClick={() => onComment?.(post.id)}
          >
            <MessageSquare size={18} className="mr-2" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onShare?.(post.id)}
          >
            <Share2 size={18} className="mr-2" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};