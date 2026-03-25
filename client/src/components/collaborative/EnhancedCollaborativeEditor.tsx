import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Save, Users, History, MessageSquare, GitBranch, Eye, User } from 'lucide-react';

// Define interfaces for our component
interface Position {
  line: number;
  ch: number;
}

interface Selection {
  from: Position;
  to: Position;
}

interface Change {
  id?: number;
  userId: number;
  username: string;
  displayName?: string;
  timestamp: string;
  content: string;
  type: 'insert' | 'delete' | 'replace';
  startPosition: number;
  endPosition?: number;
  metadata?: any;
}

interface User {
  id: number;
  username: string;
  displayName?: string;
  color: string;
  avatarUrl?: string;
  lastActiveAt?: string;
  isActive?: boolean;
  isCurrentUser?: boolean;
  currentSection?: string;
}

interface SectionActivity {
  sectionId: string;
  name: string;
  startLine: number;
  endLine: number;
  users: User[];
}

interface CollaborativeEditorProps {
  sessionId: number;
  initialContent: string;
  billId?: string;
  billNumber?: string;
  currentUser: User;
  readOnly?: boolean;
}

export default function EnhancedCollaborativeEditor({ 
  sessionId, 
  initialContent, 
  billId, 
  billNumber,
  currentUser,
  readOnly = false
}: CollaborativeEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent || '');
  const [participants, setParticipants] = useState<User[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Track cursor positions of other users
  const userCursorsRef = useRef<Record<number, Position>>({});
  // Track selections of other users
  const userSelectionsRef = useRef<Record<number, Selection>>({});
  const [localChanges, setLocalChanges] = useState<string>('');
  const [changes, setChanges] = useState<Change[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [newComment, setNewComment] = useState('');
  const [sectionActivities, setSectionActivities] = useState<SectionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Parse document into sections to track who's editing each section
  const identifySections = useCallback(() => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const sections: SectionActivity[] = [];
    let currentSection: SectionActivity | null = null;
    
    // Identify sections based on headings or section separators in the document
    lines.forEach((line, index) => {
      // Check if this line is a heading or section start
      const isHeading = /^(#+)\s+(.+)$/.test(line) || 
                      /^(SECTION|Article|Chapter)\s+\d+/.test(line) ||
                      /^-{3,}$/.test(line);
      
      if (isHeading || index === 0) {
        // If we already have a section, finalize it
        if (currentSection) {
          currentSection.endLine = index - 1;
          sections.push(currentSection);
        }
        
        // Create new section
        const sectionId = `section-${index}`;
        const name = line.trim() || `Section ${sections.length + 1}`;
        
        currentSection = {
          sectionId,
          name,
          startLine: index,
          endLine: lines.length - 1, // Default end until we find the next section
          users: []
        };
      }
    });
    
    // Add the last section if exists
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If no sections were identified, create one default section
    if (sections.length === 0) {
      sections.push({
        sectionId: 'section-full',
        name: 'Full Document',
        startLine: 0,
        endLine: lines.length - 1,
        users: []
      });
    }
    
    return sections;
  }, [content]);
  
  // Setup WebSocket connection
  useEffect(() => {
    if (!sessionId) return;
    
    // Initialize sections
    setSectionActivities(identifySections());
    
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/bill-editing`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Join the session
      ws.send(JSON.stringify({
        type: 'join',
        sessionId,
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        color: currentUser.color
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
      // Leave session and close connection when unmounting
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'leave',
          sessionId,
          userId: currentUser.id
        }));
        ws.close();
      }
    };
  }, [sessionId, currentUser, identifySections]);
  
  // Fetch session data including participants, changes, comments
  const fetchSessionData = async () => {
    setLoading(true);
    try {
      // Fetch participants
      const participantsResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}/participants`);
      if (participantsResponse && 'ok' in participantsResponse && participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData.map((p: User) => ({
          ...p,
          isCurrentUser: p.id === currentUser.id
        })));
      }
      
      // Fetch change history
      const changesResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}/changes`);
      if (changesResponse && 'ok' in changesResponse && changesResponse.ok) {
        const changesData = await changesResponse.json();
        setChanges(changesData);
      }
      
      // Fetch comments
      const commentsResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}/comments`);
      if (commentsResponse && 'ok' in commentsResponse && commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(commentsData);
      }
      
      // Fetch the latest content if we don't have initial content
      if (!initialContent) {
        const contentResponse = await apiRequest(`/api/collaborative/sessions/${sessionId}`);
        if (contentResponse && 'ok' in contentResponse && contentResponse.ok) {
          const contentData = await contentResponse.json();
          setContent(contentData.documentContent);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session data. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'participant_joined':
        // Add new participant
        setParticipants(prev => {
          const exists = prev.some(p => p.id === message.user.id);
          if (exists) {
            return prev.map(p => p.id === message.user.id 
              ? { ...p, isActive: true, lastActiveAt: new Date().toISOString() } 
              : p
            );
          } else {
            return [...prev, { 
              ...message.user, 
              isActive: true, 
              isCurrentUser: message.user.id === currentUser.id 
            }];
          }
        });
        break;
      
      case 'participant_left':
        // Mark participant as inactive
        setParticipants(prev => prev.map(p => 
          p.id === message.userId 
            ? { ...p, isActive: false } 
            : p
        ));
        
        // Remove their cursor and selection
        const newCursors = { ...userCursorsRef.current };
        delete newCursors[message.userId];
        userCursorsRef.current = newCursors;
        
        const newSelections = { ...userSelectionsRef.current };
        delete newSelections[message.userId];
        userSelectionsRef.current = newSelections;
        break;
      
      case 'content_change':
        // Update content if change is from another user
        if (message.userId !== currentUser.id) {
          setContent(message.content);
          
          // Add to change history
          if (message.change) {
            setChanges(prev => [message.change, ...prev]);
          }
        }
        break;
      
      case 'cursor_move':
        // Update user cursor position
        if (message.userId !== currentUser.id) {
          userCursorsRef.current = {
            ...userCursorsRef.current,
            [message.userId]: message.position,
          };
          
          // Update section activity if section info included
          if (message.sectionId) {
            updateUserSection(message.userId, message.sectionId);
          }
        }
        break;
      
      case 'selection_change':
        // Update user selection
        if (message.userId !== currentUser.id) {
          userSelectionsRef.current = {
            ...userSelectionsRef.current,
            [message.userId]: message.selection,
          };
        }
        break;
      
      case 'comment_added':
        // Add new comment to list
        setComments(prev => [message.comment, ...prev]);
        break;
      
      case 'comment_deleted':
        // Remove deleted comment
        setComments(prev => prev.filter(c => c.id !== message.commentId));
        break;
        
      case 'user_section_change':
        // Update which section a user is working on
        if (message.userId !== currentUser.id) {
          updateUserSection(message.userId, message.sectionId);
        }
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };
  
  // Update which section a user is currently editing
  const updateUserSection = (userId: number, sectionId: string) => {
    const user = participants.find(p => p.id === userId);
    if (!user) return;
    
    // Update participants data with section info
    setParticipants(prev => prev.map(p => 
      p.id === userId ? { ...p, currentSection: sectionId } : p
    ));
    
    // Update section activities with this user
    setSectionActivities(prev => {
      return prev.map(section => {
        // Remove user from any sections they were in
        const filteredUsers = section.users.filter(u => u.id !== userId);
        
        // Add user to the new section
        if (section.sectionId === sectionId) {
          return {
            ...section,
            users: [...filteredUsers, user]
          };
        }
        
        return {
          ...section,
          users: filteredUsers
        };
      });
    });
  };
  
  // Determine which section the cursor is in
  const getCurrentSection = (position: Position) => {
    const sections = identifySections();
    
    const section = sections.find(s => 
      position.line >= s.startLine && position.line <= s.endLine
    );
    
    return section?.sectionId || null;
  };
  
  // Save content to server
  const saveContent = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || readOnly) {
      return;
    }
    
    try {
      // Save to the server
      const response = await apiRequest(`/api/collaborative/sessions/${sessionId}/content`, 
        'POST',
        { content }
      );
      
      if (!response || !('ok' in response) || !response.ok) {
        throw new Error('Failed to save content');
      }
      
      // Create change record
      const change: Change = {
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        timestamp: new Date().toISOString(),
        content,
        type: 'replace',
        startPosition: 0,
        endPosition: content.length,
        metadata: {
          billId,
          billNumber
        }
      };
      
      // Broadcast to all participants
      wsRef.current.send(JSON.stringify({
        type: 'content_change',
        sessionId,
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        content,
        change
      }));
      
      setLocalChanges('');
      setChanges(prev => [change, ...prev]);
      
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
  
  // Handle content changes in editor
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    const newContent = e.target.value;
    setContent(newContent);
    setLocalChanges(newContent);
    
    // Update sections based on new content
    setSectionActivities(identifySections());
    
    // Debounce save to avoid too many requests
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveContent();
    }, 1000);
  };
  
  // Handle text selection change
  const handleSelectionChange = () => {
    if (!editorRef.current || readOnly) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Calculate line and column for selection
    const contentUpToStart = content.substring(0, start);
    const contentUpToEnd = content.substring(0, end);
    const startLine = contentUpToStart.split('\n').length - 1;
    const endLine = contentUpToEnd.split('\n').length - 1;
    
    // Get character position within each line
    const startLineStart = contentUpToStart.lastIndexOf('\n') + 1;
    const endLineStart = contentUpToEnd.lastIndexOf('\n') + 1;
    const startCh = start - startLineStart;
    const endCh = end - endLineStart;
    
    const newSelection = {
      from: { line: startLine, ch: startCh },
      to: { line: endLine, ch: endCh }
    };
    
    // Only update if selection changed
    if (JSON.stringify(newSelection) !== JSON.stringify(selection)) {
      setSelection(newSelection);
      
      // Send selection update to other users
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && start !== end) {
        wsRef.current.send(JSON.stringify({
          type: 'selection_change',
          sessionId,
          userId: currentUser.id,
          username: currentUser.username,
          selection: newSelection
        }));
      }
    }
    
    // Update which section user is working on
    const currentPosition = { line: startLine, ch: startCh };
    const sectionId = getCurrentSection(currentPosition);
    
    if (sectionId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_section_change',
        sessionId,
        userId: currentUser.id,
        sectionId
      }));
      
      updateUserSection(currentUser.id, sectionId);
    }
  };
  
  // Handle cursor position update
  const handleCursorMove = () => {
    if (!editorRef.current || readOnly) return;
    
    const textarea = editorRef.current;
    const position = textarea.selectionStart;
    
    // Calculate line and column
    const contentUpToPosition = content.substring(0, position);
    const line = contentUpToPosition.split('\n').length - 1;
    const lineStart = contentUpToPosition.lastIndexOf('\n') + 1;
    const ch = position - lineStart;
    
    const cursorPosition = { line, ch };
    
    // Send cursor update
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const sectionId = getCurrentSection(cursorPosition);
      
      wsRef.current.send(JSON.stringify({
        type: 'cursor_move',
        sessionId,
        userId: currentUser.id,
        username: currentUser.username,
        position: cursorPosition,
        sectionId
      }));
    }
  };
  
  // Add a comment
  const addComment = async () => {
    if (!selection || !newComment.trim() || readOnly) return;
    
    try {
      const response = await apiRequest(`/api/collaborative/sessions/${sessionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id,
          content: newComment,
          startPosition: getCharacterIndex(selection.from),
          endPosition: getCharacterIndex(selection.to)
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      const comment = await response.json();
      
      // Broadcast to all participants
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'comment_added',
          sessionId,
          userId: currentUser.id,
          comment
        }));
      }
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Delete a comment
  const deleteComment = async (commentId: number) => {
    if (readOnly) return;
    
    try {
      const response = await apiRequest(`/api/collaborative/sessions/${sessionId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      // Broadcast to all participants
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'comment_deleted',
          sessionId,
          userId: currentUser.id,
          commentId
        }));
      }
      
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      toast({
        title: 'Comment Removed',
        description: 'The comment has been removed',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Helper to convert position to character index
  const getCharacterIndex = (position: Position): number => {
    if (!content) return 0;
    
    const lines = content.split('\n');
    let index = 0;
    
    for (let i = 0; i < position.line; i++) {
      index += lines[i].length + 1; // +1 for newline character
    }
    
    return index + position.ch;
  };
  
  // Format a timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Generate user name and badge
  const getUserBadge = (user: User) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={user.isCurrentUser ? "default" : "outline"} 
              style={{ 
                backgroundColor: user.isCurrentUser ? undefined : 'transparent',
                borderColor: user.color,
                color: user.isCurrentUser ? undefined : user.color
              }}
              className="flex items-center gap-1 cursor-pointer"
            >
              <span 
                className="inline-block w-2 h-2 rounded-full" 
                style={{ backgroundColor: user.color }}
              ></span>
              {user.displayName || user.username}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col">
              <span className="font-medium">{user.displayName || user.username}</span>
              {user.isActive && <span className="text-xs">Currently active</span>}
              {user.currentSection && (
                <span className="text-xs">
                  Editing: {sectionActivities.find(s => s.sectionId === user.currentSection)?.name || user.currentSection}
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // Render editor with user highlight overlays
  const renderEditor = () => {
    return (
      <div className="relative border rounded-md">
        <Textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          onSelect={handleSelectionChange}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          disabled={loading || readOnly}
          className={`w-full h-[500px] font-mono p-4 resize-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none border-0 ${loading ? 'opacity-70' : ''}`}
          placeholder={loading ? "Loading document..." : "Start editing..."}
        />
        
        {/* Section activity indicators */}
        <div className="absolute right-2 top-2 z-10">
          {sectionActivities.filter(section => section.users.length > 0).map(section => (
            <TooltipProvider key={section.sectionId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="flex items-center mb-2 p-1 rounded bg-white border shadow-sm cursor-pointer"
                    onClick={() => {
                      if (editorRef.current && !readOnly) {
                        // Move cursor to this section
                        const index = getCharacterIndex({ line: section.startLine, ch: 0 });
                        editorRef.current.focus();
                        editorRef.current.setSelectionRange(index, index);
                        editorRef.current.scrollTop = (section.startLine * 20); // Approximate line height
                      }
                    }}
                  >
                    <div className="flex -space-x-2 mr-2">
                      {section.users.slice(0, 3).map(user => (
                        <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                          {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                          ) : (
                            <AvatarFallback 
                              style={{ backgroundColor: user.color }}
                              className="text-white text-xs"
                            >
                              {(user.displayName || user.username).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                      {section.users.length > 3 && (
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="bg-muted text-xs">
                            +{section.users.length - 3}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[120px]">
                      {section.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-medium">{section.name}</p>
                    <p className="text-xs">Line {section.startLine + 1} - {section.endLine + 1}</p>
                    <div className="mt-1 space-y-1">
                      {section.users.map(user => (
                        <div key={user.id} className="flex items-center text-xs">
                          <span 
                            className="inline-block w-2 h-2 rounded-full mr-1"
                            style={{ backgroundColor: user.color }}
                          ></span>
                          {user.displayName || user.username}
                        </div>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <h2 className="text-xl font-bold flex-shrink-0">
            {billNumber ? `Bill ${billNumber} Editor` : 'Collaborative Editor'}
          </h2>
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants.filter(p => p.isActive).length} Active
          </Badge>
          {readOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3 mr-1" />
              Read Only
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {!readOnly && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={saveContent}
              disabled={!isConnected || !localChanges || loading}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          )}
        </div>
      </div>
      
      {/* Participant List */}
      <div className="flex flex-wrap gap-2">
        {participants.map(user => getUserBadge(user))}
      </div>
      
      {/* Main Interface */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Editor Area */}
        <div className="col-span-1 md:col-span-3">
          <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="editor" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Comments {comments.length > 0 && `(${comments.length})`}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                History {changes.length > 0 && `(${changes.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-4">
              {renderEditor()}
              
              {!readOnly && selection && selection.from.line !== selection.to.line && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Add Comment on Selection</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3 px-4 space-y-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Enter comment..."
                      className="w-full"
                    />
                    <Button 
                      size="sm" 
                      onClick={addComment}
                      disabled={!newComment.trim()}
                    >
                      Add Comment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="comments" className="space-y-4">
              {comments.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {comments.map(comment => {
                    const userColor = participants.find(p => p.id === comment.userId)?.color || '#888';
                    return (
                      <div key={comment.id} className="p-3 hover:bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-1 h-5 rounded-full" 
                              style={{ backgroundColor: userColor }}
                            ></div>
                            <span className="font-medium">
                              {participants.find(p => p.id === comment.userId)?.displayName || comment.userId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(comment.createdAt)}
                            </span>
                          </div>
                          {!readOnly && (comment.userId === currentUser.id || currentUser.id === 1) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteComment(comment.id)}
                              className="h-6 w-6 p-0 rounded-full"
                            >
                              <span className="sr-only">Delete comment</span>
                              &times;
                            </Button>
                          )}
                        </div>
                        <p className="mt-1">{comment.content}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium">No Comments Yet</p>
                  <p className="text-sm text-muted-foreground">
                    Select text in the editor and add a comment to start a discussion.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              {changes.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {changes.map((change, index) => {
                    const userColor = participants.find(p => p.id === change.userId)?.color || '#888';
                    return (
                      <div key={index} className="p-3 hover:bg-muted/30">
                        <div className="flex items-center space-x-2 mb-1">
                          <div 
                            className="w-1 h-5 rounded-full" 
                            style={{ backgroundColor: userColor }}
                          ></div>
                          <span className="font-medium">
                            {change.displayName || change.username}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {change.type === 'insert' ? 'Added' : change.type === 'delete' ? 'Removed' : 'Changed'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(change.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium">No Change History</p>
                  <p className="text-sm text-muted-foreground">
                    Changes to the document will be tracked and shown here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar / Activity Panel */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center">
                <GitBranch className="h-4 w-4 mr-2" />
                Document Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-full bg-muted/60 animate-pulse rounded"></div>
                  <div className="h-6 w-3/4 bg-muted/60 animate-pulse rounded"></div>
                  <div className="h-6 w-5/6 bg-muted/60 animate-pulse rounded"></div>
                </div>
              ) : sectionActivities.length > 0 ? (
                <div className="space-y-3">
                  {sectionActivities.map(section => (
                    <div 
                      key={section.sectionId}
                      className="p-2 rounded border hover:bg-accent hover:cursor-pointer"
                      onClick={() => {
                        if (editorRef.current && !readOnly) {
                          // Move cursor to this section
                          const index = getCharacterIndex({ line: section.startLine, ch: 0 });
                          editorRef.current.focus();
                          editorRef.current.setSelectionRange(index, index);
                          editorRef.current.scrollTop = (section.startLine * 20); // Approximate line height
                        }
                      }}
                    >
                      <div className="font-medium text-sm truncate">
                        {section.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lines {section.startLine + 1}-{section.endLine + 1}
                      </div>
                      {section.users.length > 0 && (
                        <div className="mt-2 flex -space-x-2">
                          {section.users.map(user => (
                            <TooltipProvider key={user.id}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Avatar className="h-6 w-6 border-2 border-background">
                                    {user.avatarUrl ? (
                                      <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                                    ) : (
                                      <AvatarFallback 
                                        style={{ backgroundColor: user.color }}
                                        className="text-white text-xs"
                                      >
                                        {(user.displayName || user.username).substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{user.displayName || user.username}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No document sections identified.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}