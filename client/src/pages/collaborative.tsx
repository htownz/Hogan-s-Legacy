import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileEdit, 
  FilePlus, 
  Users, 
  CalendarDays, 
  Clock, 
  AlertCircle, 
  FileText 
} from 'lucide-react';

interface Session {
  id: number;
  title: string;
  description: string;
  billId?: string;
  documentContent: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
}

export default function CollaborativePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    billId: '',
    documentContent: ''
  });
  
  // Fetch sessions
  const { data: sessions, isLoading } = useQuery<any>({
    queryKey: ['/api/collaborative/sessions'],
    queryFn: async () => {
      const response = await apiRequest('/api/collaborative/sessions');
      return response.json();
    },
  });
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest('/api/collaborative/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative/sessions'] });
      setIsNewSessionDialogOpen(false);
      toast({
        title: 'Success',
        description: 'New collaborative session created successfully',
      });
      
      // Navigate to the new session
      setLocation(`/collaborative/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create collaborative session. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const handleCreateSession = () => {
    if (!newSession.title || !newSession.documentContent) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    createSessionMutation.mutate(newSession);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
    });
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'archived':
        return 'secondary';
      case 'published':
        return 'success';
      default:
        return 'outline';
    }
  };
  
  return (
    <div className="container max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Collaborative Editing</h1>
          <p className="text-muted-foreground">
            Work together on bills and documents in real-time
          </p>
        </div>
        
        <Dialog open={isNewSessionDialogOpen} onOpenChange={setIsNewSessionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FilePlus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Collaborative Session</DialogTitle>
              <DialogDescription>
                Create a new session to collaborate on a document or bill in real-time with others.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="Session title"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Session description"
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="billId">
                  Bill ID <span className="text-xs text-muted-foreground">(Optional)</span>
                </Label>
                <Input 
                  id="billId" 
                  placeholder="e.g., TX-HB123"
                  value={newSession.billId}
                  onChange={(e) => setNewSession({ ...newSession, billId: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="documentContent">
                  Initial Document Content <span className="text-muted-foreground text-xs">(Required)</span>
                </Label>
                <Textarea 
                  id="documentContent" 
                  placeholder="Enter initial document text here..."
                  value={newSession.documentContent}
                  onChange={(e) => setNewSession({ ...newSession, documentContent: e.target.value })}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            
            <DialogFooter className="sm:justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsNewSessionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Collaborative Sessions</CardTitle>
          <CardDescription>
            Browse and join existing collaborative sessions
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-auto">
              {sessions?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {sessions.map((session: Session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileEdit className="h-4 w-4 text-muted-foreground" />
                            {session.title}
                          </div>
                          {session.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {session.description}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {session.billId ? (
                            <Badge variant="outline" className="font-mono">
                              {session.billId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(session.status)}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(session.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {formatTime(session.updatedAt)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => setLocation(`/collaborative/${session.id}`)}
                          >
                            Join Session
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first collaborative session to get started.
                  </p>
                  <Button onClick={() => setIsNewSessionDialogOpen(true)}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Create Session
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              <p>Real-time collaborative editing with multiple users</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{sessions?.length || 0} sessions</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Multiple contributors</span>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}