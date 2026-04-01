// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeHtml } from '@/lib/sanitize';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger, 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  MessageSquare, 
  Users, 
  AlertCircle, 
  Check, 
  Trash2, 
  Edit, 
  ThumbsUp, 
  Flag, 
  Tag,
  HelpCircle,
  CornerUpRight,
  MessageSquarePlus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Annotation type definitions
interface Annotation {
  id: number;
  sessionId: number;
  userId: number;
  content: string;
  startPosition: number;
  endPosition: number;
  textSelection: string;
  annotationType: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata: any;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  replyCount: number;
  reactionCount: number;
  isResolved: boolean;
}

interface AnnotationReply {
  id: number;
  annotationId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  reactionCount: number;
}

interface NewAnnotation {
  sessionId: number;
  userId: number;
  content: string;
  startPosition: number;
  endPosition: number;
  textSelection: string;
  annotationType: string;
  visibility: string;
  metadata?: any;
}

interface NewReply {
  annotationId: number;
  userId: number;
  content: string;
}

interface BillAnnotatorProps {
  billId: string;
  billText: string;
  sessionId: number;
  userId: number;
  readOnly?: boolean;
}

export default function BillAnnotator({ 
  billId, 
  billText, 
  sessionId, 
  userId,
  readOnly = false
}: BillAnnotatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{ start: number, end: number } | null>(null);
  const [annotationContent, setAnnotationContent] = useState<string>('');
  const [annotationType, setAnnotationType] = useState<string>('comment');
  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState<boolean>(false);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [highlightedAnnotationId, setHighlightedAnnotationId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Fetch annotations for this session
  const { 
    data: annotations = [], 
    isLoading: annotationsLoading 
  } = useQuery<any>({
    queryKey: ['/api/collaborative-annotations/sessions', sessionId],
    queryFn: async () => {
      const response = await apiRequest(`/api/collaborative-annotations/sessions/${sessionId}?withUserDetails=true`);
      return response.json();
    },
  });

  // Setup WebSocket connection for real-time collaboration
  useEffect(() => {
    if (!sessionId) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/collaborative-annotations?sessionId=${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Annotation WebSocket connection established');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionId]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'ANNOTATION_ADDED':
        queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
        toast({
          title: 'New Annotation',
          description: 'A new annotation has been added',
        });
        break;
      
      case 'ANNOTATION_UPDATED':
        queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
        break;
      
      case 'ANNOTATION_DELETED':
        queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
        break;
      
      case 'REPLY_ADDED':
        if (activeAnnotation && message.payload.annotationId === activeAnnotation.id) {
          // If we're looking at this annotation's replies, refresh them
          queryClient.invalidateQueries({ 
            queryKey: ['/api/collaborative-annotations', activeAnnotation.id, 'replies'] 
          });
        }
        break;
      
      case 'REPLY_UPDATED':
      case 'REPLY_DELETED':
        if (activeAnnotation) {
          // Refresh replies for the active annotation if we're looking at them
          queryClient.invalidateQueries({ 
            queryKey: ['/api/collaborative-annotations', activeAnnotation.id, 'replies'] 
          });
        }
        break;
      
      case 'REACTION_ADDED':
      case 'REACTION_REMOVED':
        // Refresh the entire annotation set to update reaction counts
        queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
        break;
      
      case 'ANNOTATION_RESOLVED':
      case 'ANNOTATION_UNRESOLVED':
        queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Create annotation mutation
  const createAnnotationMutation = useMutation({
    mutationFn: async (newAnnotation: NewAnnotation) => {
      const response = await apiRequest('/api/collaborative-annotations', {
        method: 'POST',
        body: JSON.stringify(newAnnotation),
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate query to refresh annotations
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
      
      // Send WebSocket notification if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ADD_ANNOTATION',
          payload: { annotation: data }
        }));
      }
      
      toast({
        title: 'Annotation Created',
        description: 'Your annotation has been added successfully',
      });
      
      // Clear form
      setAnnotationContent('');
      setSelectedText('');
      setSelectionRange(null);
      setIsAnnotationDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error creating annotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create annotation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete annotation mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: number) => {
      const response = await apiRequest(`/api/collaborative-annotations/${annotationId}`, {
        method: 'DELETE',
      });
      return response.status === 200;
    },
    onSuccess: (_, annotationId) => {
      // Invalidate query to refresh annotations
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
      
      // Send WebSocket notification if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'DELETE_ANNOTATION',
          payload: { id: annotationId }
        }));
      }
      
      toast({
        title: 'Annotation Deleted',
        description: 'The annotation has been removed',
      });
      
      // Clear active annotation if it was deleted
      if (activeAnnotation?.id === annotationId) {
        setActiveAnnotation(null);
      }
    },
    onError: (error) => {
      console.error('Error deleting annotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete annotation. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (newReply: NewReply) => {
      const response = await apiRequest(`/api/collaborative-annotations/${newReply.annotationId}/replies`, {
        method: 'POST',
        body: JSON.stringify(newReply),
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate query to refresh replies
      queryClient.invalidateQueries({ 
        queryKey: ['/api/collaborative-annotations', variables.annotationId, 'replies'] 
      });
      
      // Send WebSocket notification if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ADD_REPLY',
          payload: { reply: data }
        }));
      }
      
      // Increment reply count for this annotation in cache
      queryClient.setQueryData(
        ['/api/collaborative-annotations/sessions', sessionId],
        (oldData: Annotation[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(annotation => 
            annotation.id === variables.annotationId 
              ? { ...annotation, replyCount: annotation.replyCount + 1 } 
              : annotation
          );
        }
      );
      
      // Clear reply content
      setReplyContent('');
      
      toast({
        title: 'Reply Added',
        description: 'Your reply has been added successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reply. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Resolve annotation mutation
  const resolveAnnotationMutation = useMutation({
    mutationFn: async (data: { annotationId: number, resolvedById: number, resolutionNote?: string }) => {
      const response = await apiRequest(`/api/collaborative-annotations/${data.annotationId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolvedById: data.resolvedById,
          resolutionNote: data.resolutionNote || 'Marked as resolved',
          isResolved: true
        }),
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate query to refresh annotations
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative-annotations/sessions', sessionId] });
      
      // Send WebSocket notification if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'RESOLVE_ANNOTATION',
          payload: { 
            resolution: {
              annotationId: variables.annotationId,
              resolvedById: variables.resolvedById,
              resolutionNote: variables.resolutionNote,
              isResolved: true
            } 
          }
        }));
      }
      
      toast({
        title: 'Annotation Resolved',
        description: 'The annotation has been marked as resolved',
      });
    },
    onError: (error) => {
      console.error('Error resolving annotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve annotation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Fetch replies for active annotation
  const {
    data: replies = [],
    isLoading: repliesLoading,
  } = useQuery<any>({
    queryKey: ['/api/collaborative-annotations', activeAnnotation?.id, 'replies'],
    queryFn: async () => {
      if (!activeAnnotation) return [];
      const response = await apiRequest(`/api/collaborative-annotations/${activeAnnotation.id}/replies`);
      return response.json();
    },
    enabled: !!activeAnnotation,
  });

  // Handle text selection
  const handleTextSelection = () => {
    if (readOnly) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      setSelectedText('');
      setSelectionRange(null);
      return;
    }
    
    const range = selection.getRangeAt(0);
    const textContainer = textContainerRef.current;
    
    if (textContainer && textContainer.contains(range.commonAncestorContainer)) {
      const selectedContent = selection.toString().trim();
      
      // Calculate absolute positions within the text
      const textNodeIterator = document.createNodeIterator(
        textContainer,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let startPos = 0;
      let endPos = 0;
      let currentPos = 0;
      let textNode;
      
      while ((textNode = textNodeIterator.nextNode())) {
        const nodeLength = textNode.textContent?.length || 0;
        
        if (range.startContainer === textNode) {
          startPos = currentPos + range.startOffset;
        }
        
        if (range.endContainer === textNode) {
          endPos = currentPos + range.endOffset;
          break;
        }
        
        currentPos += nodeLength;
      }
      
      setSelectedText(selectedContent);
      setSelectionRange({ start: startPos, end: endPos });
      
      // Open annotation dialog if selection is made
      if (selectedContent.length > 0) {
        setAnnotationContent('');
        setIsAnnotationDialogOpen(true);
      }
    }
  };

  // Handle creating new annotation
  const handleCreateAnnotation = () => {
    if (!annotationContent.trim() || !selectionRange) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide annotation content and select text',
        variant: 'destructive',
      });
      return;
    }
    
    const newAnnotation: NewAnnotation = {
      sessionId,
      userId,
      content: annotationContent,
      startPosition: selectionRange.start,
      endPosition: selectionRange.end,
      textSelection: selectedText,
      annotationType,
      visibility: 'public',
      metadata: { billId }
    };
    
    createAnnotationMutation.mutate(newAnnotation);
  };

  // Handle adding reply to an annotation
  const handleAddReply = () => {
    if (!activeAnnotation || !replyContent.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide reply content',
        variant: 'destructive',
      });
      return;
    }
    
    const newReply: NewReply = {
      annotationId: activeAnnotation.id,
      userId,
      content: replyContent
    };
    
    createReplyMutation.mutate(newReply);
  };

  // Handle marking annotation as resolved
  const handleResolveAnnotation = (annotationId: number) => {
    resolveAnnotationMutation.mutate({
      annotationId,
      resolvedById: userId
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get annotation type icon
  const getAnnotationTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle className="h-4 w-4" />;
      case 'issue':
        return <AlertCircle className="h-4 w-4" />;
      case 'suggestion':
        return <Edit className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Get annotation type color
  const getAnnotationTypeColor = (type: string) => {
    switch (type) {
      case 'question':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'issue':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'suggestion':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Generate highlighted text with annotations
  const renderHighlightedText = () => {
    if (!billText) return null;
    
    // Create array of annotation positions for highlighting
    let annotationPositions: Array<{
      start: number;
      end: number;
      id: number;
      type: string;
      resolved: boolean;
    }> = [];
    
    // Add all active annotations to position array
    annotations.forEach((annotation: Annotation) => {
      if (annotation.isActive) {
        annotationPositions.push({
          start: annotation.startPosition,
          end: annotation.endPosition,
          id: annotation.id,
          type: annotation.annotationType,
          resolved: annotation.isResolved
        });
      }
    });
    
    // Sort positions to process from end to start
    annotationPositions.sort((a, b) => b.start - a.start);
    
    // Create a copy of the text
    let result = billText;
    
    // Insert highlighting spans from end to start
    annotationPositions.forEach(pos => {
      const highlightClass = pos.resolved
        ? 'bg-gray-200 text-gray-600'
        : `${getAnnotationTypeColor(pos.type)}`;
        
      const beforeText = result.substring(0, pos.start);
      const highlightedText = result.substring(pos.start, pos.end);
      const afterText = result.substring(pos.end);
      
      result = `${beforeText}<span 
        class="annotation-highlight cursor-pointer rounded px-0.5 ${highlightClass}"
        data-annotation-id="${pos.id}"
      >${highlightedText}</span>${afterText}`;
    });
    
    return (
      <div
        ref={textContainerRef}
        className="bill-text font-mono text-sm whitespace-pre-wrap p-4"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(result) }}
        onClick={(e) => {
          // Handle clicking on annotations
          const target = e.target as HTMLElement;
          if (target.classList.contains('annotation-highlight')) {
            const annotationId = parseInt(target.getAttribute('data-annotation-id') || '0');
            if (annotationId > 0) {
              const annotation = annotations.find((a: any) => a.id === annotationId);
              if (annotation) {
                setActiveAnnotation(annotation);
                setHighlightedAnnotationId(annotationId);
              }
            }
          }
        }}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Bill Text Panel */}
      <div className="col-span-1 lg:col-span-8 border rounded-md overflow-hidden relative">
        <div className="bg-muted px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{billId}</span>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              {annotations.length} Annotations
            </Badge>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-320px)]">
          {renderHighlightedText()}
        </ScrollArea>
        
        {!readOnly && selectedText && (
          <div className="absolute bottom-4 right-4">
            <Button 
              onClick={() => setIsAnnotationDialogOpen(true)}
              size="sm"
              className="shadow-lg"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Annotate Selection
            </Button>
          </div>
        )}
      </div>
      
      {/* Annotations Panel */}
      <div className="col-span-1 lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Annotations</span>
              {!readOnly && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2">
                        Select text to annotate
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Highlight text in the document to add annotations</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            <CardDescription>
              Collaborative annotations for this document
            </CardDescription>
          </CardHeader>
          
          <ScrollArea className="h-[calc(100vh-400px)]">
            <CardContent className="px-4 space-y-3">
              {annotationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center text-muted-foreground">
                    Loading annotations...
                  </div>
                </div>
              ) : annotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No annotations yet</p>
                  {!readOnly && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select text in the document to add the first annotation
                    </p>
                  )}
                </div>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="issues">Issues</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-2 space-y-3">
                    {annotations.map((annotation: Annotation) => (
                      <Card 
                        key={annotation.id} 
                        className={`${annotation.id === highlightedAnnotationId ? 'ring-2 ring-primary' : ''}`}
                      >
                        <CardHeader className="px-4 py-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={annotation.user?.avatarUrl || ''} />
                                <AvatarFallback>
                                  {getInitials(annotation.user?.displayName || annotation.user?.username || 'User')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-sm font-medium">
                                  {annotation.user?.displayName || annotation.user?.username || 'Unknown User'}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {formatDate(annotation.createdAt)}
                                </CardDescription>
                              </div>
                            </div>
                            
                            <Badge variant="outline" className={getAnnotationTypeColor(annotation.annotationType)}>
                              {getAnnotationTypeIcon(annotation.annotationType)}
                              <span className="ml-1 capitalize">{annotation.annotationType}</span>
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="px-4 py-2">
                          <div className="text-sm">
                            {annotation.content}
                          </div>
                          
                          {annotation.textSelection && (
                            <div className="mt-2 text-xs italic bg-muted p-2 rounded">
                              "{annotation.textSelection}"
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="px-4 py-2 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setActiveAnnotation(annotation)}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">{annotation.replyCount}</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2"
                              disabled
                            >
                              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">{annotation.reactionCount}</span>
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {!annotation.isResolved && !readOnly && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleResolveAnnotation(annotation.id)}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            
                            {annotation.userId === userId && !readOnly && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteAnnotationMutation.mutate(annotation.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardFooter>
                        
                        {annotation.isResolved && (
                          <div className="px-4 py-1 bg-muted/50 flex items-center justify-between text-xs">
                            <span className="flex items-center text-muted-foreground">
                              <Check className="h-3 w-3 mr-1" />
                              Resolved
                            </span>
                          </div>
                        )}
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="comments" className="mt-2 space-y-3">
                    {annotations
                      .filter((a: any) => a.annotationType === 'comment')
                      .map((annotation: Annotation) => (
                        <Card 
                          key={annotation.id} 
                          className={`${annotation.id === highlightedAnnotationId ? 'ring-2 ring-primary' : ''}`}
                        >
                          {/* Same card content as above, simplified for brevity */}
                          <CardHeader className="px-4 py-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {getInitials(annotation.user?.displayName || annotation.user?.username || 'User')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-sm font-medium">
                                    {annotation.user?.displayName || annotation.user?.username || 'Unknown User'}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {formatDate(annotation.createdAt)}
                                  </CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="px-4 py-2">
                            <div className="text-sm">
                              {annotation.content}
                            </div>
                          </CardContent>
                          
                          <CardFooter className="px-4 py-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setActiveAnnotation(annotation)}
                            >
                              <CornerUpRight className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Reply</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="questions" className="mt-2 space-y-3">
                    {annotations
                      .filter((a: any) => a.annotationType === 'question')
                      .map((annotation: Annotation) => (
                        <Card 
                          key={annotation.id} 
                          className={`${annotation.id === highlightedAnnotationId ? 'ring-2 ring-primary' : ''}`}
                        >
                          {/* Question annotation cards */}
                          <CardHeader className="px-4 py-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {getInitials(annotation.user?.displayName || annotation.user?.username || 'User')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-sm font-medium">
                                    {annotation.user?.displayName || annotation.user?.username || 'Unknown User'}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {formatDate(annotation.createdAt)}
                                  </CardDescription>
                                </div>
                              </div>
                              
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                                Question
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="px-4 py-2">
                            <div className="text-sm">
                              {annotation.content}
                            </div>
                          </CardContent>
                          
                          <CardFooter className="px-4 py-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setActiveAnnotation(annotation)}
                            >
                              <CornerUpRight className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Reply</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="issues" className="mt-2 space-y-3">
                    {annotations
                      .filter((a: any) => a.annotationType === 'issue')
                      .map((annotation: Annotation) => (
                        <Card 
                          key={annotation.id} 
                          className={`${annotation.id === highlightedAnnotationId ? 'ring-2 ring-primary' : ''}`}
                        >
                          {/* Issue annotation cards */}
                          <CardHeader className="px-4 py-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {getInitials(annotation.user?.displayName || annotation.user?.username || 'User')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-sm font-medium">
                                    {annotation.user?.displayName || annotation.user?.username || 'Unknown User'}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {formatDate(annotation.createdAt)}
                                  </CardDescription>
                                </div>
                              </div>
                              
                              <Badge variant="outline" className="bg-red-100 text-red-800">
                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                Issue
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="px-4 py-2">
                            <div className="text-sm">
                              {annotation.content}
                            </div>
                          </CardContent>
                          
                          <CardFooter className="px-4 py-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setActiveAnnotation(annotation)}
                            >
                              <CornerUpRight className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Reply</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
      
      {/* Annotation Dialog */}
      <Dialog 
        open={isAnnotationDialogOpen} 
        onOpenChange={setIsAnnotationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              Add your thoughts, questions, or comments to the selected text.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedText && (
              <div className="text-sm bg-muted p-3 rounded-md italic">
                "{selectedText}"
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant={annotationType === 'comment' ? 'default' : 'outline'}
                className="col-span-1"
                onClick={() => setAnnotationType('comment')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Comment
              </Button>
              
              <Button
                type="button"
                variant={annotationType === 'question' ? 'default' : 'outline'}
                className="col-span-1"
                onClick={() => setAnnotationType('question')}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Question
              </Button>
              
              <Button
                type="button"
                variant={annotationType === 'suggestion' ? 'default' : 'outline'}
                className="col-span-1"
                onClick={() => setAnnotationType('suggestion')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Suggestion
              </Button>
              
              <Button
                type="button"
                variant={annotationType === 'issue' ? 'default' : 'outline'}
                className="col-span-1"
                onClick={() => setAnnotationType('issue')}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Issue
              </Button>
            </div>
            
            <Textarea 
              placeholder="Enter your annotation..."
              value={annotationContent}
              onChange={(e) => setAnnotationContent(e.target.value)}
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnotationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAnnotation} disabled={!annotationContent.trim()}>
              Add Annotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Annotation Detail Dialog */}
      <Dialog 
        open={!!activeAnnotation} 
        onOpenChange={(open) => !open && setActiveAnnotation(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <DialogTitle className="flex items-center gap-2">
                <Badge variant="outline" className={`${getAnnotationTypeColor(activeAnnotation?.annotationType || 'comment')}`}>
                  {getAnnotationTypeIcon(activeAnnotation?.annotationType || 'comment')}
                  <span className="ml-1 capitalize">{activeAnnotation?.annotationType || 'Comment'}</span>
                </Badge>
                <span>Annotation</span>
              </DialogTitle>
              
              {activeAnnotation?.isResolved && (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            <DialogDescription>
              View and reply to this annotation
            </DialogDescription>
          </DialogHeader>
          
          {activeAnnotation && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeAnnotation.user?.avatarUrl || ''} />
                  <AvatarFallback>
                    {getInitials(activeAnnotation.user?.displayName || activeAnnotation.user?.username || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="font-semibold text-sm">
                      {activeAnnotation.user?.displayName || activeAnnotation.user?.username || 'Unknown User'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(activeAnnotation.createdAt)}
                    </div>
                  </div>
                  <div className="mt-1">
                    {activeAnnotation.content}
                  </div>
                  
                  {activeAnnotation.textSelection && (
                    <div className="mt-2 text-xs italic bg-muted p-2 rounded border">
                      "{activeAnnotation.textSelection}"
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Replies</h4>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {repliesLoading ? (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                      Loading replies...
                    </div>
                  ) : replies.length === 0 ? (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                      No replies yet
                    </div>
                  ) : (
                    replies.map((reply: AnnotationReply) => (
                      <div key={reply.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-md">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={reply.user?.avatarUrl || ''} />
                          <AvatarFallback className="text-xs">
                            {getInitials(reply.user?.displayName || reply.user?.username || 'User')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-semibold text-xs">
                              {reply.user?.displayName || reply.user?.username || 'Unknown User'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(reply.createdAt)}
                            </div>
                          </div>
                          <div className="mt-1 text-sm">
                            {reply.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {!readOnly && (
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Add your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddReply}
                      disabled={!replyContent.trim()}
                      size="sm"
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            {activeAnnotation && !activeAnnotation.isResolved && !readOnly && (
              <Button 
                variant="outline"
                onClick={() => handleResolveAnnotation(activeAnnotation.id)}
                className="mr-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setActiveAnnotation(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}