import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Trash, 
  Edit, 
  Loader2, 
  Globe,
  Lock,
  Users,
  Send
} from "lucide-react";
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
import AnnotationReplies from "./AnnotationReplies";

// Define extended User interface for this component
interface ExtendedUser {
  id: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface Annotation {
  id: number;
  billId: string;
  userId: number;
  text: string;
  sectionReference?: string;
  pageNumber?: number;
  visibility: 'public' | 'private' | 'circle';
  circleId?: number;
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

interface AnnotationListProps {
  annotations: Annotation[];
  billId: string;
  isUserTab: boolean;
}

export default function AnnotationList({ annotations, billId, isUserTab }: AnnotationListProps) {
  const { user } = useAuth();
  // Cast user to ExtendedUser for type compatibility
  const extendedUser = user as ExtendedUser | null;
  const queryClient = useQueryClient();
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [submittingReplyFor, setSubmittingReplyFor] = useState<number | null>(null);
  const [deletingAnnotation, setDeletingAnnotation] = useState<number | null>(null);
  
  const isAuthenticated = !!user;

  // Toggle replies visibility
  const toggleReplies = (annotationId: number) => {
    setExpandedReplies(prevState => {
      const newState = new Set(prevState);
      if (newState.has(annotationId)) {
        newState.delete(annotationId);
      } else {
        newState.add(annotationId);
      }
      return newState;
    });
  };

  // Handle reply text input
  const handleReplyTextChange = (annotationId: number, text: string) => {
    setReplyText(prev => ({ ...prev, [annotationId]: text }));
  };

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async (annotationId: number) => {
      const response = await apiRequest(`/api/annotations/${annotationId}/upvote`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to upvote");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/bill', billId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/user'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upvote. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Downvote mutation
  const downvoteMutation = useMutation({
    mutationFn: async (annotationId: number) => {
      const response = await apiRequest(`/api/annotations/${annotationId}/downvote`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to downvote");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/bill', billId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/user'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to downvote. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ annotationId, text }: { annotationId: number, text: string }) => {
      const response = await apiRequest(`/api/annotations/${annotationId}/replies`, {
        method: "POST",
        data: { text }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post reply");
      }
      
      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Clear reply text and submitting state
      setReplyText(prev => ({ ...prev, [variables.annotationId]: "" }));
      setSubmittingReplyFor(null);
      
      // Show toast message
      toast({
        title: "Reply posted",
        description: "Your reply has been added successfully."
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/bill', billId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/user'] });
      
      // Make sure replies for this annotation are expanded
      setExpandedReplies(prev => {
        const newSet = new Set(prev);
        newSet.add(variables.annotationId);
        return newSet;
      });
    },
    onError: () => {
      setSubmittingReplyFor(null);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete annotation mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: number) => {
      const response = await apiRequest(`/api/annotations/${annotationId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete annotation");
      }
      
      return true;
    },
    onSuccess: () => {
      setDeletingAnnotation(null);
      
      toast({
        title: "Annotation deleted",
        description: "Your annotation has been deleted successfully."
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/bill', billId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/user'] });
    },
    onError: () => {
      setDeletingAnnotation(null);
      toast({
        title: "Error",
        description: "Failed to delete annotation. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Submit reply
  const submitReply = async (annotationId: number) => {
    const text = replyText[annotationId]?.trim();
    if (!text) return;
    
    setSubmittingReplyFor(annotationId);
    await replyMutation.mutateAsync({ annotationId, text });
  };

  // Delete annotation
  const confirmDeleteAnnotation = async (annotationId: number) => {
    setDeletingAnnotation(annotationId);
    await deleteAnnotationMutation.mutateAsync(annotationId);
  };

  // Get visibility icon
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe size={14} />;
      case 'private':
        return <Lock size={14} />;
      case 'circle':
        return <Users size={14} />;
      default:
        return <Globe size={14} />;
    }
  };

  // Get visibility label
  const getVisibilityLabel = (visibility: string, circleId?: number) => {
    switch (visibility) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Private';
      case 'circle':
        return `Circle #${circleId}`;
      default:
        return 'Public';
    }
  };

  if (annotations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>{isUserTab 
          ? "You haven't created any annotations for this bill yet." 
          : "No public annotations for this bill yet."
        }</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {annotations.map((annotation) => (
        <Card key={annotation.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                {annotation.user?.avatarUrl ? (
                  <AvatarImage src={annotation.user.avatarUrl} alt={annotation.user?.displayName || annotation.user?.username || 'User'} />
                ) : (
                  <AvatarFallback>{(annotation.user?.displayName || annotation.user?.username || 'U').charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {annotation.user?.displayName || annotation.user?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {annotation.sectionReference && (
                      <Badge variant="outline" className="text-xs">
                        {annotation.sectionReference}
                      </Badge>
                    )}
                    
                    {annotation.pageNumber && (
                      <Badge variant="outline" className="text-xs">
                        Page {annotation.pageNumber}
                      </Badge>
                    )}
                    
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 text-xs"
                    >
                      {getVisibilityIcon(annotation.visibility)}
                      {getVisibilityLabel(annotation.visibility, annotation.circleId)}
                    </Badge>
                  </div>
                </div>
                
                <p className="mt-2 text-sm">{annotation.text}</p>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-muted-foreground hover:text-primary"
                      onClick={() => isAuthenticated && upvoteMutation.mutate(annotation.id)}
                      disabled={!isAuthenticated || upvoteMutation.isPending}
                    >
                      <ThumbsUp size={16} className="mr-1" />
                      {annotation.upvotes || 0}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-muted-foreground hover:text-primary"
                      onClick={() => isAuthenticated && downvoteMutation.mutate(annotation.id)}
                      disabled={!isAuthenticated || downvoteMutation.isPending}
                    >
                      <ThumbsDown size={16} className="mr-1" />
                      {annotation.downvotes || 0}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-muted-foreground hover:text-primary"
                      onClick={() => toggleReplies(annotation.id)}
                    >
                      <MessageCircle size={16} className="mr-1" />
                      Reply
                    </Button>
                  </div>
                  
                  {/* Delete and Edit buttons for user's own annotations */}
                  {extendedUser && annotation.userId === extendedUser.id && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-muted-foreground hover:text-primary"
                      >
                        <Edit size={16} />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete annotation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this annotation? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => confirmDeleteAnnotation(annotation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingAnnotation === annotation.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          {/* Replies section */}
          {expandedReplies.has(annotation.id) && (
            <AnnotationReplies
              annotationId={annotation.id}
              billId={billId}
            />
          )}
          
          {/* Reply form */}
          {expandedReplies.has(annotation.id) && isAuthenticated && (
            <CardFooter className="p-4 pt-0 border-t">
              <div className="flex items-start gap-3 w-full">
                <Avatar className="h-8 w-8">
                  {extendedUser?.avatarUrl ? (
                    <AvatarImage src={extendedUser.avatarUrl} alt={extendedUser?.displayName || extendedUser?.username || 'User'} />
                  ) : (
                    <AvatarFallback>{(extendedUser?.displayName || extendedUser?.username || 'U').charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 flex items-center gap-2">
                  <Textarea
                    placeholder="Write your reply..."
                    className="min-h-[40px] flex-1"
                    value={replyText[annotation.id] || ''}
                    onChange={(e) => handleReplyTextChange(annotation.id, e.target.value)}
                    disabled={submittingReplyFor === annotation.id}
                  />
                  <Button
                    size="sm"
                    onClick={() => submitReply(annotation.id)}
                    disabled={!replyText[annotation.id]?.trim() || submittingReplyFor === annotation.id}
                  >
                    {submittingReplyFor === annotation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}