import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Document } from "@/types/documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileIcon, 
  DownloadIcon, 
  LinkIcon, 
  Share2Icon, 
  MessageSquareIcon,
  ArrowLeft,
  Clock, 
  User, 
  Tag
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function DocumentDetailPage() {
  const [, params] = useRoute<{ id: string }>("/documents/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const documentId = params?.id ? parseInt(params.id, 10) : 0;
  
  // Fetch document details
  const { data: document, isLoading, error } = useQuery<any>({
    queryKey: ['/api/documents', documentId],
    queryFn: async () => {
      if (!documentId) throw new Error("Invalid document ID");
      const response = await apiRequest(`/api/documents/${documentId}`);
      return response as Document;
    },
    enabled: !!documentId,
  });
  
  // Fetch document comments
  const { data: comments = [] } = useQuery<any>({
    queryKey: ['/api/documents', documentId, 'comments'],
    queryFn: async () => {
      if (!documentId) return [];
      try {
        const response = await apiRequest(`/api/documents/${documentId}/comments`);
        return response;
      } catch (error) {
        return [];
      }
    },
    enabled: !!documentId,
  });
  
  const handleDownload = async () => {
    try {
      // Get the download URL
      const response = await apiRequest(`/api/documents/${documentId}/download`);
      
      // Check if response contains a URL
      if (typeof response === 'object' && response && 'url' in response) {
        // Create a temporary anchor to trigger the download
        const link = window.document.createElement('a');
        link.href = response.url as string;
        link.download = document?.file_name || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: "Your download will begin shortly",
        });
      } else {
        throw new Error("Invalid download response");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Document link copied to clipboard",
    });
  };
  
  if (isLoading) {
    return <div className="container py-8">Loading document details...</div>;
  }
  
  if (error || !document) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Document not found</h1>
        <p className="text-muted-foreground mb-4">
          The document you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate("/documents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-6">
      <Button 
        variant="outline" 
        size="sm" 
        className="mb-4" 
        onClick={() => navigate("/documents")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Documents
      </Button>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{document.title}</CardTitle>
              <CardDescription>{document.description || "No description provided"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Uploaded {format(new Date(document.created_at), 'PPP')}</span>
                </div>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Owner ID: {document.owner_id}</span>
                </div>
                {document.category && (
                  <div className="flex items-center">
                    <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{document.category}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 p-6 border rounded-md flex flex-col items-center justify-center bg-muted/30">
                <FileIcon className="h-16 w-16 text-primary/70 mb-2" />
                <div className="text-xl font-medium">{document.file_name}</div>
                <div className="text-sm text-muted-foreground">
                  {document.file_type} • {(document.file_size / 1024).toFixed(1)} KB
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleDownload}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Downloaded {document.download_count} times
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button variant="outline" size="sm">
                  <Share2Icon className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {document.allow_comments && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">
                  <div className="flex items-center">
                    <MessageSquareIcon className="mr-2 h-5 w-5" />
                    Comments
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* This would be replaced with a proper comments component */}
                <div className="text-center py-8 text-muted-foreground">
                  <p>Comment functionality will be implemented soon.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">File Name</dt>
                  <dd className="mt-1">{document.file_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">File Type</dt>
                  <dd className="mt-1">{document.file_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">File Size</dt>
                  <dd className="mt-1">{(document.file_size / 1024).toFixed(1)} KB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Visibility</dt>
                  <dd className="mt-1">{document.is_public ? "Public" : "Private"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Comments</dt>
                  <dd className="mt-1">{document.allow_comments ? "Allowed" : "Disabled"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Uploaded On</dt>
                  <dd className="mt-1">{format(new Date(document.created_at), 'PPP')}</dd>
                </div>
                {document.updated_at && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                    <dd className="mt-1">{format(new Date(document.updated_at), 'PPP')}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Related Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <p>Related documents will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}