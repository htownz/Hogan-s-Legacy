import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ThumbsUp, ThumbsDown, Trash, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

// Define extended User interface for this component
interface ExtendedUser {
  id: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface Reply {
  id: number;
  annotationId: number;
  userId: number;
  text: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  user?: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface AnnotationRepliesProps {
  annotationId: number;
  billId: string;
}

export default function AnnotationReplies({ annotationId, billId }: AnnotationRepliesProps) {
  const { user } = useAuth();
  // Cast user to ExtendedUser for type compatibility
  const extendedUser = user as ExtendedUser | null;
  const queryClient = useQueryClient();
  const [deletingReply, setDeletingReply] = useState<number | null>(null);
  
  const isAuthenticated = !!user;

  // Fetch replies
  const { 
    data: replies, 
    isLoading, 
    error 
  } = useQuery<any>({
    queryKey: ['/api/annotations', annotationId, 'replies'],
    queryFn: async () => {
      const response = await apiRequest(`/api/annotations/${annotationId}/replies`);
      if (!response.ok) {
        throw new Error("Failed to fetch replies");
      }
      return response.json();
    }
  });

  // Upvote reply mutation
  const upvoteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const response = await apiRequest(`/api/annotations/replies/${replyId}/upvote`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to upvote reply");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/annotations', annotationId, 'replies'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upvote reply. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Downvote reply mutation
  const downvoteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const response = await apiRequest(`/api/annotations/replies/${replyId}/downvote`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to downvote reply");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/annotations', annotationId, 'replies'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to downvote reply. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const response = await apiRequest(`/api/annotations/replies/${replyId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete reply");
      }
      
      return true;
    },
    onSuccess: () => {
      setDeletingReply(null);
      
      toast({
        title: "Reply deleted",
        description: "Your reply has been deleted successfully."
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/annotations', annotationId, 'replies'] });
    },
    onError: () => {
      setDeletingReply(null);
      toast({
        title: "Error",
        description: "Failed to delete reply. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete reply
  const confirmDeleteReply = async (replyId: number) => {
    setDeletingReply(replyId);
    await deleteReplyMutation.mutateAsync(replyId);
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center border-t">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center border-t">
        <AlertCircle className="h-6 w-6 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">Failed to load replies</p>
      </div>
    );
  }

  if (!replies || replies.length === 0) {
    return (
      <div className="p-4 text-center border-t">
        <p className="text-sm text-muted-foreground">No replies yet</p>
      </div>
    );
  }

  return (
    <div className="border-t divide-y">
      {replies.map((reply: Reply) => (
        <div key={reply.id} className="p-4 pl-12">
          <div className="flex items-start gap-3">
            <Avatar className="h-7 w-7">
              {reply.user?.avatarUrl ? (
                <AvatarImage src={reply.user.avatarUrl} alt={reply.user?.displayName || reply.user?.username || 'User'} />
              ) : (
                <AvatarFallback>{(reply.user?.displayName || reply.user?.username || 'U').charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {reply.user?.displayName || reply.user?.username || 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <p className="mt-1 text-sm">{reply.text}</p>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => isAuthenticated && upvoteReplyMutation.mutate(reply.id)}
                    disabled={!isAuthenticated || upvoteReplyMutation.isPending}
                  >
                    <ThumbsUp size={14} className="mr-1" />
                    {reply.upvotes || 0}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => isAuthenticated && downvoteReplyMutation.mutate(reply.id)}
                    disabled={!isAuthenticated || downvoteReplyMutation.isPending}
                  >
                    <ThumbsDown size={14} className="mr-1" />
                    {reply.downvotes || 0}
                  </Button>
                </div>
                
                {/* Delete button for user's own replies */}
                {extendedUser && reply.userId === extendedUser.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete reply</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this reply? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => confirmDeleteReply(reply.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingReply === reply.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}