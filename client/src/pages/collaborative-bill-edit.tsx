import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowLeft, 
  AlertCircle,
  Users,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import EnhancedCollaborativeEditor from '@/components/collaborative/EnhancedCollaborativeEditor';
import { useToast } from '@/hooks/use-toast';

// Mock current user for development
const mockCurrentUser = {
  id: 4,
  username: 'current_user',
  displayName: 'You',
  color: '#7C3AED',
  isCurrentUser: true
};

export default function CollaborativeBillEditPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [readOnly, setReadOnly] = useState(false);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [billId, setBillId] = useState('');
  
  // Fetch session details
  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
    error: sessionError,
    refetch: refetchSession
  } = useQuery<any>({
    queryKey: ['/api/collaborative/sessions', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest(`/api/collaborative/sessions/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      return response.json();
    },
    enabled: !!id,
    refetchOnWindowFocus: false
  });
  
  // Create a new session for a bill
  const createNewSession = async () => {
    if (!billId.trim() || isCreatingNewSession) return;
    
    setIsCreatingNewSession(true);
    
    try {
      const response = await apiRequest('/api/collaborative/sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: `Bill ${billNumber} Collaborative Edit`,
          description: `Collaborative editing session for bill ${billNumber}`,
          billId: billId,
          documentContent: `# Bill ${billNumber}\n\nStart editing this bill collaboratively.\n\n## Section 1\n\nAdd content here...\n\n## Section 2\n\nAdd more content here...\n`,
          status: 'active',
          createdById: mockCurrentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create collaborative session');
      }
      
      const newSession = await response.json();
      
      toast({
        title: 'Session Created',
        description: `New collaborative session for Bill ${billNumber} created successfully.`
      });
      
      // Navigate to the new session
      setLocation(`/collaborative-bill-edit/${newSession.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create collaborative session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingNewSession(false);
    }
  };
  
  // Update UI with bill information when session loads
  useEffect(() => {
    if (session) {
      if (session.billId) {
        setBillId(session.billId);
        // Extract bill number from billId if available
        const billIdParts = session.billId.split('-');
        if (billIdParts.length > 1) {
          const extractedBillNumber = billIdParts[1];
          setBillNumber(extractedBillNumber);
        }
      }
    }
  }, [session]);
  
  // If no ID provided, show the create session form
  if (!id) {
    return (
      <div className="container py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Collaborative Bill Editor</h1>
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/collaborative')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Start New Collaborative Session</CardTitle>
            <CardDescription>
              Create a new collaborative editing session for a bill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billId">Bill ID</Label>
                <input
                  id="billId"
                  className="w-full p-2 border rounded"
                  placeholder="e.g., TX-HB1234"
                  value={billId}
                  onChange={(e) => setBillId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billNumber">Bill Number</Label>
                <input
                  id="billNumber"
                  className="w-full p-2 border rounded"
                  placeholder="e.g., HB1234"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={createNewSession} 
              disabled={!billId.trim() || isCreatingNewSession}
              className="w-full"
            >
              {isCreatingNewSession ? 'Creating...' : 'Create Collaborative Session'}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Collaborative Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-10 w-10 mb-4" />
              <p>Active sessions will appear here.</p>
              <p className="text-sm">Start a new session to begin collaborative editing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isSessionLoading) {
    return (
      <div className="container py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (isSessionError) {
    return (
      <div className="container py-6 max-w-4xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/collaborative')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {(sessionError as Error)?.message || 'Failed to load collaborative session'}
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchSession()}
            className="mt-2"
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container py-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/collaborative')}
              size="sm"
              className="h-8"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{session?.title || 'Collaborative Bill Editor'}</h1>
          </div>
          {session?.description && (
            <p className="text-sm text-muted-foreground ml-12">{session.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="read-only" 
              checked={readOnly}
              onCheckedChange={setReadOnly}
            />
            <Label htmlFor="read-only" className="flex items-center cursor-pointer">
              <Eye className="h-4 w-4 mr-1" />
              Read-only mode
            </Label>
          </div>
        </div>
      </div>
      
      {session && (
        <EnhancedCollaborativeEditor
          sessionId={parseInt(id as string)}
          initialContent={session.documentContent}
          billId={session.billId}
          billNumber={billNumber}
          currentUser={mockCurrentUser}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}