import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHtml } from '@/lib/sanitize';

interface Annotation {
  id: number;
  documentId: number;
  userId: number;
  content: string;
  startOffset: number;
  endOffset: number;
  selectionText: string;
  color: string;
  isPublic: boolean;
  isResolved: boolean;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  replies?: Annotation[];
}

interface CollaboratorInfo {
  id: number;
  documentId: number;
  userId: number;
  role: string;
  joinedAt: string;
  user?: {
    id: number;
    username: string;
    displayName?: string;
  };
}

interface CursorPosition {
  userId: number;
  position: number;
  username: string;
}

interface DocumentInfo {
  id: number;
  title: string;
  content: string;
  documentType: string;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AnnotationLayerProps {
  documentId?: number;
  readOnly?: boolean;
  userId?: number;
  userName?: string;
}

// Mock user ID for development - in production, get this from auth context
const CURRENT_USER_ID = 1;
const CURRENT_USER_NAME = 'CurrentUser';

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  documentId: propDocumentId,
  readOnly = false,
  userId = CURRENT_USER_ID,
  userName = CURRENT_USER_NAME
}) => {
  const { id: paramId } = useParams();
  const documentId = propDocumentId || (paramId ? parseInt(paramId) : undefined);
  
  // States
  const [selection, setSelection] = useState<{ text: string; startOffset: number; endOffset: number } | null>(null);
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [newAnnotationColor, setNewAnnotationColor] = useState('yellow');
  const [cursorPositions, setCursorPositions] = useState<Record<number, CursorPosition>>({});
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<number | null>(null);
  
  // References
  const contentRef = useRef<HTMLDivElement>(null);
  const lastActivity = useRef<number>(Date.now());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const {
    data: document,
    isLoading: isLoadingDocument,
    isError: isErrorDocument,
    error: documentError
  } = useQuery<any>({
    queryKey: ['/api/collaborative-annotations/documents', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await fetch(`/api/collaborative-annotations/documents/${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      const data = await response.json();
      return data.data as DocumentInfo;
    },
    enabled: !!documentId
  });
  
  const {
    data: annotations,
    isLoading: isLoadingAnnotations,
    isError: isErrorAnnotations,
    error: annotationsError
  } = useQuery<any>({
    queryKey: ['/api/collaborative-annotations/documents', documentId, 'annotations'],
    queryFn: async () => {
      if (!documentId) return [];
      const response = await fetch(`/api/collaborative-annotations/documents/${documentId}/annotations`);
      if (!response.ok) {
        throw new Error('Failed to load annotations');
      }
      const data = await response.json();
      return data.data as Annotation[];
    },
    enabled: !!documentId
  });
  
  const {
    data: collaborators,
    isLoading: isLoadingCollaborators
  } = useQuery<any>({
    queryKey: ['/api/collaborative-annotations/documents', documentId, 'collaborators'],
    queryFn: async () => {
      if (!documentId) return [];
      const response = await fetch(`/api/collaborative-annotations/documents/${documentId}/collaborators`);
      if (!response.ok) {
        throw new Error('Failed to load collaborators');
      }
      const data = await response.json();
      return data.data as CollaboratorInfo[];
    },
    enabled: !!documentId
  });
  
  // Mutations
  const createAnnotationMutation = useMutation({
    mutationFn: async (newAnnotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch(`/api/collaborative-annotations/documents/${documentId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAnnotation),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create annotation');
      }
      
      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['/api/collaborative-annotations/documents', documentId, 'annotations']
      });
      
      toast({
        title: 'Annotation created',
        description: 'Your annotation has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating annotation',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // WebSocket setup
  useEffect(() => {
    if (!documentId || readOnly) return;
    
    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/annotations`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join document on connection
      ws.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId,
        payload: {
          username: userName
        }
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'create_annotation':
            // Handle new annotation from other users
            queryClient.invalidateQueries({
              queryKey: ['/api/collaborative-annotations/documents', documentId, 'annotations']
            });
            
            setRecentActivity(prev => [
              `${message.payload.username || 'Someone'} added an annotation`,
              ...prev.slice(0, 4)
            ]);
            break;
            
          case 'update_annotation':
            // Handle annotation update from other users
            queryClient.invalidateQueries({
              queryKey: ['/api/collaborative-annotations/documents', documentId, 'annotations']
            });
            
            setRecentActivity(prev => [
              `${message.payload.username || 'Someone'} updated an annotation`,
              ...prev.slice(0, 4)
            ]);
            break;
            
          case 'delete_annotation':
            // Handle annotation deletion from other users
            queryClient.invalidateQueries({
              queryKey: ['/api/collaborative-annotations/documents', documentId, 'annotations']
            });
            
            setRecentActivity(prev => [
              `${message.payload.username || 'Someone'} removed an annotation`,
              ...prev.slice(0, 4)
            ]);
            break;
            
          case 'cursor_position':
            // Update cursor position for a user
            setCursorPositions(prev => ({
              ...prev,
              [message.payload.userId]: {
                userId: message.payload.userId,
                position: message.payload.position,
                username: message.payload.username || 'Anonymous'
              }
            }));
            break;
            
          case 'user_activity':
            // Handle user joining/leaving
            if (message.payload.action === 'joined') {
              setRecentActivity(prev => [
                `${message.payload.username || 'Someone'} joined the document`,
                ...prev.slice(0, 4)
              ]);
              
              // Refresh collaborators
              queryClient.invalidateQueries({
                queryKey: ['/api/collaborative-annotations/documents', documentId, 'collaborators']
              });
            } else if (message.payload.action === 'left') {
              setRecentActivity(prev => [
                `${message.payload.username || 'Someone'} left the document`,
                ...prev.slice(0, 4)
              ]);
              
              // Remove cursor
              setCursorPositions(prev => {
                const newPositions = {...prev};
                delete newPositions[message.payload.userId];
                return newPositions;
              });
              
              // Refresh collaborators
              queryClient.invalidateQueries({
                queryKey: ['/api/collaborative-annotations/documents', documentId, 'collaborators']
              });
            }
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after delay
      setTimeout(() => {
        if (websocket && websocket.readyState === WebSocket.CLOSED) {
          console.log('Attempting to reconnect WebSocket...');
          setWebsocket(null); // This will trigger a reconnection
        }
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    setWebsocket(ws);
    
    // Cleanup on component unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'leave_document',
          documentId,
          userId,
          payload: {}
        }));
        ws.close();
      }
    };
  }, [documentId, userId, userName, readOnly, queryClient]);
  
  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    if (!contentRef.current || readOnly) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }
    
    // Get selected text and range
    const range = selection.getRangeAt(0);
    
    // Calculate offsets
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(contentRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;
    
    const selectionText = range.toString();
    const endOffset = startOffset + selectionText.length;
    
    if (selectionText && selectionText.trim().length > 0) {
      setSelection({
        text: selectionText,
        startOffset,
        endOffset
      });
      
      // Open annotation dialog
      setAnnotationDialogOpen(true);
    }
  }, [readOnly]);
  
  useEffect(() => {
    // Use browser document object, not our document state
    window.document.addEventListener('mouseup', handleSelectionChange);
    window.document.addEventListener('keyup', handleSelectionChange);
    
    return () => {
      window.document.removeEventListener('mouseup', handleSelectionChange);
      window.document.removeEventListener('keyup', handleSelectionChange);
    };
  }, [handleSelectionChange]);
  
  // Handle cursor position updates via WebSocket
  const handleCursorMove = useCallback((e: React.MouseEvent) => {
    if (!contentRef.current || !websocket || websocket.readyState !== WebSocket.OPEN || readOnly) {
      return;
    }
    
    // Only send updates if enough time has passed (avoid flooding)
    const now = Date.now();
    if (now - lastActivity.current < 500) return;
    lastActivity.current = now;
    
    // Calculate cursor position
    const rect = contentRef.current.getBoundingClientRect();
    
    // Convert to a document position (character offset)
    // This is a simplified approach - for real implementation you'd want a more precise mapping
    const textNodes = Array.from(contentRef.current.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE);
      
    let position = 0;
    let found = false;
    
    for (const node of textNodes) {
      const range = window.document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        // Rough estimation of horizontal position
        const ratio = (e.clientX - rect.left) / rect.width;
        const nodeText = node.textContent || '';
        position += Math.floor(nodeText.length * ratio);
        found = true;
        break;
      }
      
      position += (node.textContent || '').length;
    }
    
    if (!found) {
      // If not found by vertical position, use a rough approximation
      const totalHeight = rect.height;
      const relativePosition = (e.clientY - rect.top) / totalHeight;
      const totalLength = (contentRef.current.textContent || '').length;
      position = Math.floor(totalLength * relativePosition);
    }
    
    // Send cursor position update
    websocket.send(JSON.stringify({
      type: 'cursor_position',
      documentId,
      userId,
      payload: {
        position,
        username: userName
      }
    }));
  }, [websocket, documentId, userId, userName, readOnly]);
  
  // Create new annotation
  const handleCreateAnnotation = useCallback(() => {
    if (!selection || !documentId) return;
    
    const newAnnotation = {
      documentId,
      userId,
      content: newAnnotationText,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      selectionText: selection.text,
      color: newAnnotationColor,
      isPublic: true,
      isResolved: false,
      parentId: null,
    };
    
    createAnnotationMutation.mutate(newAnnotation);
    
    // Send WebSocket notification
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'create_annotation',
        documentId,
        userId,
        payload: {
          ...newAnnotation,
          username: userName
        }
      }));
    }
    
    // Reset form
    setSelection(null);
    setAnnotationDialogOpen(false);
    setNewAnnotationText('');
  }, [
    selection, 
    documentId, 
    userId, 
    userName,
    newAnnotationText, 
    newAnnotationColor, 
    createAnnotationMutation, 
    websocket
  ]);
  
  // Annotation highlights
  const highlightedContent = useMemo(() => {
    if (!document?.content || !annotations) return '';
    
    const content = document.content;
    
    // Sort annotations by start offset (descending) to process from end to start
    const sortedAnnotations = [...(annotations || [])].sort((a, b) => b.startOffset - a.startOffset);
    
    let result = content;
    
    sortedAnnotations.forEach((annotation) => {
      const before = result.substring(0, annotation.startOffset);
      const selected = result.substring(annotation.startOffset, annotation.endOffset);
      const after = result.substring(annotation.endOffset);
      
      // Create highlight with data attributes
      result = `${before}<span 
        class="annotation-highlight" 
        style="background-color: ${annotation.color}40;"
        data-annotation-id="${annotation.id}"
        data-highlight="${annotation.color}"
        >${selected}</span>${after}`;
    });
    
    return result;
  }, [document, annotations]);
  
  if (isLoadingDocument) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Loading document...</p>
      </div>
    );
  }
  
  if (isErrorDocument) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Document</AlertTitle>
        <AlertDescription>
          {documentError instanceof Error ? documentError.message : 'An error occurred while loading the document.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden gap-4">
      {/* Main document content */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div className="bg-card p-4 rounded-md mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-semibold">{document?.title}</h2>
              <p className="text-sm text-muted-foreground">
                <Badge variant="outline">{document?.documentType}</Badge>
                <span className="ml-2">Last updated: {new Date(document?.updatedAt || '').toLocaleString()}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Document content with annotations */}
        <div 
          className="flex-1 border rounded-md p-6 mb-4 overflow-y-auto bg-white relative"
          onMouseMove={handleCursorMove}
        >
          {/* Cursor indicators from other users */}
          {Object.values(cursorPositions).map((cursor) => {
            // Skip current user's cursor
            if (cursor.userId === userId) return null;
            
            // This is a simplified positioning - real implementation would be more precise
            const position = Math.min(
              cursor.position / (document?.content.length || 1), 
              1
            ) * 100;
            
            return (
              <TooltipProvider key={cursor.userId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute w-2 h-5 bg-blue-500 rounded-full z-10"
                      style={{
                        left: `${position}%`,
                        top: '20px'
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{cursor.username}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          
          {/* Document with highlighted annotations */}
          <div 
            ref={contentRef}
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedContent) }}
            onMouseOver={(e) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains('annotation-highlight')) {
                const annotationId = target.getAttribute('data-annotation-id');
                if (annotationId) {
                  setHoveredAnnotationId(parseInt(annotationId));
                }
              }
            }}
            onMouseOut={() => {
              setHoveredAnnotationId(null);
            }}
          />
        </div>
      </div>
      
      {/* Sidebar with annotations and collaborators */}
      <div className="w-full lg:w-96 border rounded-md p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Annotations</h3>
          <span className="text-sm text-muted-foreground">
            {annotations?.length || 0} annotations
          </span>
        </div>
        
        {/* Collaborators section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Collaborators</h4>
          <div className="flex flex-wrap gap-2">
            {isLoadingCollaborators ? (
              <div className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin text-primary mr-1" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : collaborators && collaborators.length > 0 ? (
              collaborators.map((collaborator: any) => (
                <Badge 
                  key={collaborator.id} 
                  variant={collaborator.userId === userId ? "default" : "outline"}
                  className="flex items-center gap-1"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    collaborator.userId === userId ? 'bg-white' : 'bg-green-500'
                  }`} />
                  {collaborator.user?.username || `User ${collaborator.userId}`}
                  <span className="text-xs opacity-70">{collaborator.role}</span>
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No collaborators</span>
            )}
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Activity log */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
          <div className="bg-muted/50 rounded-md p-2 text-sm max-h-24 overflow-y-auto">
            {recentActivity.length > 0 ? (
              <ul className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <li key={index} className="text-xs">{activity}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Annotations list */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-medium mb-2">Document Annotations</h4>
          {isLoadingAnnotations ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
              <p className="text-sm">Loading annotations...</p>
            </div>
          ) : isErrorAnnotations ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Annotations</AlertTitle>
              <AlertDescription>
                {annotationsError instanceof Error ? annotationsError.message : 'An error occurred while loading annotations.'}
              </AlertDescription>
            </Alert>
          ) : annotations && annotations.length > 0 ? (
            <div className="space-y-2">
              {annotations.map((annotation: any) => (
                <div 
                  key={annotation.id} 
                  className={`border rounded-md p-3 text-sm ${
                    annotation.id === hoveredAnnotationId ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                  style={{ 
                    borderLeft: `4px solid ${annotation.color}`, 
                    backgroundColor: annotation.id === hoveredAnnotationId ? `${annotation.color}10` : '' 
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline" className="text-xs">
                      User {annotation.userId}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(annotation.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="italic text-muted-foreground text-xs mb-1">
                      "{annotation.selectionText}"
                    </div>
                    <p>{annotation.content}</p>
                  </div>
                  {annotation.replies && annotation.replies.length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 space-y-2">
                      {annotation.replies.map((reply: any) => (
                        <div key={reply.id} className="text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">User {reply.userId}</span>
                            <span className="text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</span>
                          </div>
                          <p>{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Reply
                    </Button>
                    {annotation.userId === userId && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500">
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-2">No annotations yet. Select text to add annotations.</p>
          )}
        </div>
      </div>
      
      {/* Annotation creation dialog */}
      <Dialog open={annotationDialogOpen} onOpenChange={setAnnotationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              You're annotating: <span className="font-medium">{selection?.text}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="annotation-content" className="text-sm font-medium">
                Your annotation:
              </label>
              <Textarea
                id="annotation-content"
                placeholder="Enter your annotation here..."
                value={newAnnotationText}
                onChange={(e) => setNewAnnotationText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Highlight color:</label>
              <div className="flex space-x-2">
                {['yellow', 'green', 'blue', 'purple', 'red'].map((color) => (
                  <div
                    key={color}
                    className={`w-6 h-6 rounded-full cursor-pointer ${
                      newAnnotationColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: `${color}40` }}
                    onClick={() => setNewAnnotationColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnotationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAnnotation}
              disabled={!newAnnotationText.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Annotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnotationLayer;