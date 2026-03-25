import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Users, History } from 'lucide-react';

// Mock data for development
const mockParticipants = [
  { id: 1, username: 'sarah_j', displayName: 'Sarah Johnson', color: '#FF5733', avatarUrl: '', lastActiveAt: new Date().toISOString() },
  { id: 2, username: 'mike_smith', displayName: 'Mike Smith', color: '#33A1FF', avatarUrl: '', lastActiveAt: new Date().toISOString() },
  { id: 3, username: 'elena_k', displayName: 'Elena Kowalski', color: '#33FF57', avatarUrl: '', lastActiveAt: new Date().toISOString() },
  { id: 4, username: 'current_user', displayName: 'You', color: '#FFFF33', avatarUrl: '', lastActiveAt: new Date().toISOString() },
];

// Mock current user
const mockCurrentUser = { id: 4, username: 'current_user', displayName: 'You', color: '#FFFF33' };

interface Position {
  line: number;
  ch: number;
}

interface Selection {
  from: Position;
  to: Position;
}

interface Annotation {
  id: number;
  userId: number;
  username: string;
  text: string;
  selection: Selection;
  createdAt: string;
}

interface Change {
  userId: number;
  username: string;
  timestamp: string;
  content: string;
  type: 'add' | 'remove' | 'replace';
  position: Position;
  length: number;
}

interface User {
  id: number;
  username: string;
  displayName?: string;
  color: string;
}

interface CollaborativeEditorProps {
  sessionId: number;
  initialContent: string;
  billId?: string;
}

export default function CollaborativeEditor({ sessionId, initialContent }: CollaborativeEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent || '');
  const [participants, setParticipants] = useState<User[]>(mockParticipants);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserCursor, setCurrentUserCursor] = useState<Position>({ line: 0, ch: 0 });
  const [userCursors, setUserCursors] = useState<Record<number, Position>>({});
  const [localChanges, setLocalChanges] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    if (!sessionId) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Join the session
      ws.send(JSON.stringify({
        type: 'join',
        sessionId,
        userId: mockCurrentUser.id,
        username: mockCurrentUser.username,
      }));
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
    
    // Fetch initial data
    fetchSessionData();
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionId]);
  
  // Fetch session data (participants, annotations, etc.)
  const fetchSessionData = async () => {
    try {
      // Fetch participants
      const participantsResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}/participants`);
      const participantsData = await participantsResponse.json();
      setParticipants(participantsData.length > 0 ? participantsData : mockParticipants);
      
      // Fetch annotations
      const annotationsResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}/annotations`);
      const annotationsData = await annotationsResponse.json();
      setAnnotations(annotationsData);
      
      // Fetch change history
      const changesResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}/changes`);
      const changesData = await changesResponse.json();
      setChanges(changesData);
      
      // Fetch the latest content
      const contentResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}`);
      const contentData = await contentResponse.json();
      setContent(contentData.documentContent);
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session data. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'participant_joined':
        setParticipants(prev => 
          prev.some(p => p.id === message.user.id) 
            ? prev 
            : [...prev, message.user]
        );
        break;
      
      case 'participant_left':
        setParticipants(prev => prev.filter(p => p.id !== message.userId));
        setUserCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[message.userId];
          return newCursors;
        });
        break;
      
      case 'content_change':
        if (message.userId !== mockCurrentUser.id) {
          setContent(message.content);
          // Add to change history
          setChanges(prev => [message.change, ...prev]);
        }
        break;
      
      case 'cursor_move':
        if (message.userId !== mockCurrentUser.id) {
          setUserCursors(prev => ({
            ...prev,
            [message.userId]: message.position,
          }));
        }
        break;
      
      case 'annotation_added':
        setAnnotations(prev => [message.annotation, ...prev]);
        break;
      
      case 'annotation_deleted':
        setAnnotations(prev => prev.filter(a => a.id !== message.annotationId));
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  };
  
  // Send content changes to the server
  const saveContent = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    try {
      // Save to the server
      const response = await apiRequest(`/api/collaborative/sessions/${sessionId}/content`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      
      // Broadcast to all participants
      wsRef.current.send(JSON.stringify({
        type: 'content_change',
        sessionId,
        userId: mockCurrentUser.id,
        username: mockCurrentUser.username,
        content,
        change: {
          userId: mockCurrentUser.id,
          username: mockCurrentUser.username,
          timestamp: new Date().toISOString(),
          content,
          type: 'replace',
          position: { line: 0, ch: 0 },
          length: content.length,
        },
      }));
      
      setLocalChanges('');
      
      toast({
        title: 'Saved',
        description: 'Document saved successfully',
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save content. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Add an annotation
  const addAnnotation = async (text: string) => {
    if (!selection) return;
    
    try {
      const response = await apiRequest(`/api/collaborative/sessions/${sessionId}/annotations`, {
        method: 'POST',
        body: JSON.stringify({
          userId: mockCurrentUser.id,
          username: mockCurrentUser.username,
          text,
          selection,
        }),
      });
      
      const annotation = await response.json();
      
      // Broadcast to all participants
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'annotation_added',
          sessionId,
          userId: mockCurrentUser.id,
          annotation,
        }));
      }
      
      setAnnotations(prev => [annotation, ...prev]);
      
      toast({
        title: 'Annotation Added',
        description: 'Your annotation has been added successfully',
      });
    } catch (error) {
      console.error('Error adding annotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to add annotation. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Delete an annotation
  const deleteAnnotation = async (annotationId: number) => {
    try {
      const response = await apiRequest(`/api/collaborative/sessions/${sessionId}/annotations/${annotationId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          userId: mockCurrentUser.id,
        }),
      });
      
      // Broadcast to all participants
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'annotation_deleted',
          sessionId,
          userId: mockCurrentUser.id,
          annotationId,
        }));
      }
      
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      
      toast({
        title: 'Annotation Removed',
        description: 'The annotation has been removed',
      });
    } catch (error) {
      console.error('Error deleting annotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete annotation. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setLocalChanges(newContent);
    
    // Debounce save to avoid too many requests
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveContent();
    }, 1000);
  };
  
  // Handle text selection
  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) {
      setSelection(null);
      return;
    }
    
    // Convert character index to line and column
    const contentUpToStart = content.substring(0, start);
    const contentUpToEnd = content.substring(0, end);
    const startLine = contentUpToStart.split('\n').length - 1;
    const endLine = contentUpToEnd.split('\n').length - 1;
    
    // Get character offset within the line
    const startLineStart = contentUpToStart.lastIndexOf('\n') + 1;
    const endLineStart = contentUpToEnd.lastIndexOf('\n') + 1;
    const startCh = start - startLineStart;
    const endCh = end - endLineStart;
    
    setSelection({
      from: { line: startLine, ch: startCh },
      to: { line: endLine, ch: endCh },
    });
  };
  
  // Get highlighting for the content
  const getHighlightedContent = () => {
    let highlightedContent = content;
    
    // Highlight annotations
    annotations.forEach(annotation => {
      const { from, to } = annotation.selection;
      
      // Convert line and column to character index
      const lines = content.split('\n');
      let startIndex = 0;
      let endIndex = 0;
      
      // Calculate start index
      for (let i = 0; i < from.line; i++) {
        startIndex += lines[i].length + 1; // +1 for the newline character
      }
      startIndex += from.ch;
      
      // Calculate end index
      for (let i = 0; i < to.line; i++) {
        endIndex += lines[i].length + 1;
      }
      endIndex += to.ch;
      
      // Replace the text with highlighted version
      const before = highlightedContent.slice(0, startIndex);
      const highlighted = highlightedContent.slice(startIndex, endIndex);
      const after = highlightedContent.slice(endIndex);
      
      highlightedContent = `${before}<mark data-annotation-id="${annotation.id}">${highlighted}</mark>${after}`;
    });
    
    return highlightedContent;
  };
  
  // Get the user display name by ID
  const getUserName = (userId: number) => {
    const user = participants.find(p => p.id === userId);
    return user ? (user.displayName || user.username) : 'Unknown User';
  };
  
  // Get the user color by ID
  const getUserColor = (userId: number) => {
    const user = participants.find(p => p.id === userId);
    return user ? user.color : '#CCCCCC';
  };
  
  // Format a timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Editor */}
      <div className="col-span-1 md:col-span-3">
        <div className="space-y-4">
          {/* Editor controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isConnected ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {participants.length} Active
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => saveContent()}
                disabled={!isConnected || !localChanges}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
          
          {/* Editor area */}
          <div className="border rounded-md overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleTextSelection}
              className="w-full h-[500px] font-mono p-4 resize-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none border-0"
              placeholder="Start editing..."
            />
          </div>
          
          {/* Editor footer */}
          <div className="text-xs text-muted-foreground border rounded-md p-2">
            <div className="flex items-center justify-between">
              <div>
                Selection: {selection ? 
                  `Line ${selection.from.line + 1}, Col ${selection.from.ch + 1} to Line ${selection.to.line + 1}, Col ${selection.to.ch + 1}` : 
                  'None'
                }
              </div>
              <div>
                {content.split('\n').length} lines | {content.length} characters
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="col-span-1">
        <div className="space-y-4">
          {/* Participants */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Active Participants</h3>
                <Badge variant="outline" className="text-xs">{participants.length}</Badge>
              </div>
              
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full bg-green-500" 
                        style={{ backgroundColor: participant.color }}
                      ></div>
                      <span className="text-sm">
                        {participant.displayName || participant.username}
                        {participant.id === mockCurrentUser.id && " (You)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Changes History */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Recent Changes</h3>
                <Badge variant="outline" className="text-xs">{changes.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {changes.length > 0 ? (
                  changes.slice(0, 5).map((change, index) => (
                    <div key={index} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getUserColor(change.userId) }}
                        ></div>
                        <span className="font-medium">{getUserName(change.userId)}</span>
                      </div>
                      <div className="ml-3 mt-1 text-muted-foreground">
                        <span>{change.type === 'add' ? 'Added' : 
                              change.type === 'remove' ? 'Removed' : 'Updated'} content</span>
                        <span className="block">{formatTimestamp(change.timestamp)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic">No changes yet</div>
                )}
                
                {changes.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    <History className="h-3 w-3 mr-1" />
                    View all changes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Annotations */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Annotations</h3>
                <Badge variant="outline" className="text-xs">{annotations.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {annotations.length > 0 ? (
                  annotations.map((annotation) => (
                    <div key={annotation.id} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getUserColor(annotation.userId) }}
                        ></div>
                        <span className="font-medium">{getUserName(annotation.userId)}</span>
                        <span className="text-muted-foreground ml-auto">
                          {formatTimestamp(annotation.createdAt)}
                        </span>
                      </div>
                      <div className="ml-3 mt-1">{annotation.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic">No annotations yet</div>
                )}
              </div>
              
              {selection && (
                <div className="mt-3 pt-3 border-t">
                  <Input 
                    placeholder="Add annotation for selected text..." 
                    className="text-xs mb-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addAnnotation((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    Press Enter to add annotation
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}