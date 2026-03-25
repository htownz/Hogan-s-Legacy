// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import BillAnnotator from '@/components/legislation/BillAnnotator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Share2, 
  FileText, 
  Calendar, 
  Building, 
  Users,
  MessageSquare,
  BookOpen
} from 'lucide-react';

export default function BillAnnotatorPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number>(1); // Default to user 1 for now

  // Fetch current user
  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/me');
        return response.json();
      } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
      }
    },
  });

  useEffect(() => {
    // Set actual user ID once user data is loaded
    if (currentUser?.id) {
      setUserId(currentUser.id);
    }
  }, [currentUser]);

  // Fetch bill details
  const { data: bill, isLoading: billLoading, error: billError } = useQuery<any>({
    queryKey: [`/api/bills/${id}`],
    queryFn: async () => {
      const response = await apiRequest(`/api/bills/${id}`);
      return response.json();
    },
  });

  // Fetch or create annotation session for this bill
  const { data: annotationSession, isLoading: sessionLoading } = useQuery<any>({
    queryKey: [`/api/collaborative/sessions/bill/${id}`],
    queryFn: async () => {
      try {
        // Try to find existing session
        const response = await apiRequest(`/api/collaborative/sessions?billId=${id}`);
        const sessions = await response.json();
        
        // If session exists, return the first one
        if (sessions && sessions.length > 0) {
          return sessions[0];
        }
        
        // Otherwise create a new session
        if (bill) {
          const createResponse = await apiRequest('/api/collaborative/sessions', {
            method: 'POST',
            body: JSON.stringify({
              title: `Annotation Session for ${bill.billNumber}`,
              description: `Collaborative annotations for ${bill.title || bill.billNumber}`,
              billId: id,
              documentContent: bill.text || bill.summary || 'Bill text not available',
              status: 'active'
            }),
          });
          
          return createResponse.json();
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching or creating annotation session:', error);
        toast({
          title: 'Error',
          description: 'Failed to load annotation session',
          variant: 'destructive',
        });
        return null;
      }
    },
    enabled: !!bill, // Only run this query once bill data is loaded
  });

  useEffect(() => {
    if (annotationSession?.id) {
      setSessionId(annotationSession.id);
    }
  }, [annotationSession]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle loading and error states
  if (billLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => navigate('/legislation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bills
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="col-span-1 lg:col-span-8">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-28" />
            </div>
            
            <Skeleton className="h-[500px] w-full" />
          </div>
          
          <div className="col-span-1 lg:col-span-4">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (billError || !bill) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => navigate('/legislation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bills
          </Button>
        </div>
        
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Error Loading Bill</h2>
          <p>Failed to load bill information. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => navigate('/legislation')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bills
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{bill.billNumber}: {bill.title}</h1>
          
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Filed: {formatDate(bill.filingDate)}</span>
            </div>
            
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-1" />
              <span>Chamber: {bill.chamber}</span>
            </div>
            
            {bill.author && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>Author: {bill.author}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Badge variant={bill.status === 'Enacted' ? 'success' : 'secondary'}>
                {bill.status || 'Pending'}
              </Badge>
            </div>
          </div>
          
          <Tabs defaultValue="annotate" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="annotate" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Annotate Bill
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Bill Details
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="annotate" className="p-0">
              {sessionLoading ? (
                <div className="text-center p-12">
                  <Skeleton className="h-[600px] w-full" />
                </div>
              ) : sessionId ? (
                <BillAnnotator 
                  billId={id}
                  billText={bill.text || bill.summary || 'Bill text not available.'} 
                  sessionId={sessionId}
                  userId={userId}
                />
              ) : (
                <div className="text-center p-12 border rounded-md">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load annotation session</h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn't create or load an annotation session for this bill.
                  </p>
                  <Button onClick={() => navigate('/legislation')}>
                    Return to Bills
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">Bill Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm">Bill Number</h4>
                      <p>{bill.billNumber}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">Session</h4>
                      <p>{bill.session || 'Unknown'}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">Status</h4>
                      <p>{bill.status || 'Pending'}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">Filed</h4>
                      <p>{formatDate(bill.filingDate)}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">Chamber</h4>
                      <p>{bill.chamber}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">Author</h4>
                      <p>{bill.author || 'Unknown'}</p>
                    </div>
                    
                    {bill.coAuthors && (
                      <div>
                        <h4 className="font-medium text-sm">Co-Authors</h4>
                        <p>{bill.coAuthors}</p>
                      </div>
                    )}
                    
                    {bill.committee && (
                      <div>
                        <h4 className="font-medium text-sm">Committee</h4>
                        <p>{bill.committee}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {bill.history && bill.history.length > 0 && (
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2">Legislative History</h3>
                    
                    <div className="space-y-2">
                      {bill.history.map((event: any, index: number) => (
                        <div key={index} className="border-b pb-2 last:border-b-0">
                          <div className="flex justify-between">
                            <span className="font-medium">{event.action}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(event.date)}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm">{event.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {bill.subjects && bill.subjects.length > 0 && (
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2">Subjects</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {bill.subjects.map((subject: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="summary">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Bill Summary</h3>
                
                {bill.summary ? (
                  <div className="whitespace-pre-wrap">
                    {bill.summary}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    No summary available for this bill.
                  </div>
                )}
              </div>
              
              {bill.fiscalNotes && (
                <div className="border rounded-md p-4 mt-4">
                  <h3 className="text-lg font-medium mb-2">Fiscal Notes</h3>
                  <div className="whitespace-pre-wrap">
                    {bill.fiscalNotes}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}