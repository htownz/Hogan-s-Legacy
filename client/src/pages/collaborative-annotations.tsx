import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, FolderPlus, FileText, Plus, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import AnnotationLayer from '../components/annotations/AnnotationLayer';

interface DocumentPreview {
  id: number;
  title: string;
  documentType: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentDetails {
  id: number;
  title: string;
  content: string;
  documentType: string;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

const CollaborativeAnnotationsPage: React.FC = () => {
  const [_, setLocation] = useLocation(); // We only need the setter
  const { documentId } = useParams<{ documentId?: string }>();
  const parsedDocumentId = documentId ? parseInt(documentId) : undefined;
  
  // States
  const [newDocumentDialog, setNewDocumentDialog] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentContent, setNewDocumentContent] = useState('');
  const [newDocumentType, setNewDocumentType] = useState('bill');
  const [newDocumentExternalId, setNewDocumentExternalId] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const {
    data: documents,
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: documentsError
  } = useQuery<any>({
    queryKey: ['/api/collaborative-annotations/documents'],
    queryFn: async () => {
      const response = await fetch('/api/collaborative-annotations/documents');
      if (!response.ok) {
        throw new Error('Failed to load documents');
      }
      const data = await response.json();
      return data.data as DocumentPreview[];
    }
  });
  
  // Mutations
  const createDocumentMutation = useMutation({
    mutationFn: async (newDocument: {
      title: string;
      content: string;
      documentType: string;
      externalId?: string;
    }) => {
      const response = await fetch('/api/collaborative-annotations/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDocument)
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const data = await response.json();
      return data.data as DocumentDetails;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/collaborative-annotations/documents']
      });
      
      toast({
        title: 'Document created',
        description: 'Your document has been created successfully.',
      });
      
      setNewDocumentDialog(false);
      setNewDocumentTitle('');
      setNewDocumentContent('');
      setNewDocumentType('bill');
      setNewDocumentExternalId('');
      
      // Navigate to the new document
      setLocation(`/collaborative-annotations/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error creating document',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  const handleCreateDocument = () => {
    if (!newDocumentTitle.trim() || !newDocumentContent.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a title and content for the document.',
        variant: 'destructive'
      });
      return;
    }
    
    // Create the document object with proper typing
    const newDocument: {
      title: string;
      content: string;
      documentType: string;
      externalId?: string;
    } = {
      title: newDocumentTitle,
      content: newDocumentContent,
      documentType: newDocumentType
    };
    
    if (newDocumentExternalId) {
      newDocument.externalId = newDocumentExternalId;
    }
    
    createDocumentMutation.mutate(newDocument);
  };
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Collaborative Annotations</h1>
        <p className="text-muted-foreground">
          Create, view, and collaborate on document annotations with others in real-time.
        </p>
      </div>
      
      {parsedDocumentId ? (
        // Document annotation view
        <AnnotationLayer documentId={parsedDocumentId} />
      ) : (
        // Document list view
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Available Documents</h2>
            <Button onClick={() => setNewDocumentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
          
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-lg">Loading documents...</p>
            </div>
          ) : isErrorDocuments ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {documentsError instanceof Error ? documentsError.message : 'An error occurred while loading documents.'}
              </AlertDescription>
            </Alert>
          ) : documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <Badge>{doc.documentType}</Badge>
                    </div>
                    <CardDescription>
                      Last updated: {new Date(doc.updatedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setLocation(`/collaborative-annotations/${doc.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Open Document
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by creating your first document for collaborative annotation.
              </p>
              <Button onClick={() => setNewDocumentDialog(true)}>
                Create New Document
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Create new document dialog */}
      <Dialog open={newDocumentDialog} onOpenChange={setNewDocumentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Create a new document for collaborative annotation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="document-title" className="text-sm font-medium">
                Document Title
              </label>
              <Input
                id="document-title"
                placeholder="Enter document title"
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="document-type" className="text-sm font-medium">
                Document Type
              </label>
              <Select value={newDocumentType} onValueChange={setNewDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bill">Bill</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                  <SelectItem value="resolution">Resolution</SelectItem>
                  <SelectItem value="testimony">Testimony</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="document-external-id" className="text-sm font-medium">
                External ID (Optional)
              </label>
              <Input
                id="document-external-id"
                placeholder="Enter external ID (e.g., bill number)"
                value={newDocumentExternalId}
                onChange={(e) => setNewDocumentExternalId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="document-content" className="text-sm font-medium">
                Document Content
              </label>
              <Textarea
                id="document-content"
                placeholder="Enter document content"
                value={newDocumentContent}
                onChange={(e) => setNewDocumentContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDocumentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDocument}
              disabled={!newDocumentTitle.trim() || !newDocumentContent.trim() || createDocumentMutation.isPending}
            >
              {createDocumentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Create Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaborativeAnnotationsPage;