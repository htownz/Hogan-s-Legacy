import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowLeft, 
  FileText,
  Clock,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CollaborativeEditor from '@/components/collaborative/CollaborativeEditor';

export default function CollaborativeEditPage() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();

  
  // Fetch the session data
  const { data: session } = useQuery<any>({
    queryKey: [`/api/collaborative/sessions/${id}`],
    queryFn: async () => {
      const response = await apiRequest(`/api/collaborative/sessions/${id}`);
      return response.json();
    },
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
    });
  };
  
  if (!session) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Loading session...</h2>
            <p className="text-muted-foreground mb-6">
              Please wait while we load the collaborative session.
            </p>
            <Button onClick={() => setLocation('/collaborative')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/collaborative')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
            
            <h1 className="text-2xl font-bold">{session.title}</h1>
            
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {session.billId && (
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>Bill: {session.billId}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-1" />
                <span>Created: {formatDate(session.createdAt)}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Updated: {formatTime(session.updatedAt)}</span>
              </div>
            </div>
            
            {session.description && (
              <p className="mt-2 text-muted-foreground">
                {session.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="editor">Collaborative Editor</TabsTrigger>
            <TabsTrigger value="preview">Document Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="p-0">
            <CollaborativeEditor 
              sessionId={Number(id)} 
              initialContent={session.documentContent} 
            />
          </TabsContent>
          
          <TabsContent value="preview" className="p-4 border rounded-md">
            <div className="prose max-w-none">
              <h2>Document Preview</h2>
              <div className="whitespace-pre-wrap font-mono text-sm p-4 bg-muted rounded-md">
                {session.documentContent}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}