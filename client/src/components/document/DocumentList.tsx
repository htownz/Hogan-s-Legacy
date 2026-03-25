import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Document } from "@/types/documents";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileIcon, FileTextIcon, FolderIcon, SearchIcon, PlusIcon, FileUpIcon } from "lucide-react";
import { format } from "date-fns";

export default function DocumentList() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch public documents
  const { data: publicDocuments = [], isLoading: isLoadingPublic } = useQuery<any>({
    queryKey: ['/api/documents/public'],
    queryFn: async () => {
      const response = await apiRequest('/api/documents/public');
      return response as Document[];
    },
  });
  
  // Fetch user's documents (will return empty if not authenticated)
  const { data: userDocuments = [], isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/documents');
        return response as Document[];
      } catch (error) {
        return [];
      }
    },
  });
  
  // Fetch shared documents (will return empty if not authenticated)
  const { data: sharedDocuments = [], isLoading: isLoadingShared } = useQuery<any>({
    queryKey: ['/api/documents/shared'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/documents/shared');
        return response as Document[];
      } catch (error) {
        return [];
      }
    },
  });
  
  // Search documents if query exists
  const { data: searchResults = [], isLoading: isLoadingSearch } = useQuery<any>({
    queryKey: ['/api/documents/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      try {
        const response = await apiRequest(`/api/documents/search?q=${encodeURIComponent(searchQuery)}`);
        return response as Document[];
      } catch (error) {
        return [];
      }
    },
    enabled: !!searchQuery.trim(),
  });
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The query will run automatically when searchQuery changes
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const renderDocumentCard = (document: Document) => (
    <Card key={document.id} className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{document.title || "Untitled Document"}</CardTitle>
        <CardDescription className="line-clamp-2">
          {document.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <FileTextIcon className="h-4 w-4 mr-1" />
          <span>{document.file_type || "Unknown type"}</span>
          <span className="mx-2">•</span>
          <span>{formatFileSize(document.file_size || 0)}</span>
        </div>
        {document.category && (
          <div className="mt-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {document.category}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/documents/${document.id}`}>View Details</Link>
        </Button>
        <div className="text-xs text-muted-foreground">
          {document.created_at && format(new Date(document.created_at), 'MMM d, yyyy')}
        </div>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="container max-w-6xl py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage documents in the Act Up community
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/documents/upload">
              <FileUpIcon className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/collections/new">
              <FolderIcon className="mr-2 h-4 w-4" />
              New Collection
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex w-full max-w-lg gap-2">
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" variant="outline">
            <SearchIcon className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </form>
      </div>
      
      {searchQuery.trim() ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Search Results for "{searchQuery}"
          </h2>
          {isLoadingSearch ? (
            <p>Loading search results...</p>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(renderDocumentCard)}
            </div>
          ) : (
            <p>No documents found matching your search.</p>
          )}
        </div>
      ) : (
        <Tabs defaultValue="public">
          <TabsList className="mb-4">
            <TabsTrigger value="public">Public Documents</TabsTrigger>
            <TabsTrigger value="my">My Documents</TabsTrigger>
            <TabsTrigger value="shared">Shared With Me</TabsTrigger>
          </TabsList>
          
          <TabsContent value="public">
            {isLoadingPublic ? (
              <p>Loading public documents...</p>
            ) : publicDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicDocuments.map(renderDocumentCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No public documents</h3>
                <p className="mt-2 text-muted-foreground">
                  Be the first to share a document with the community.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/documents/upload">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Upload Document
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my">
            {isLoadingUser ? (
              <p>Loading your documents...</p>
            ) : userDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userDocuments.map(renderDocumentCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No documents uploaded yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Upload your first document to share with others or keep private.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/documents/upload">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Upload Document
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="shared">
            {isLoadingShared ? (
              <p>Loading shared documents...</p>
            ) : sharedDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedDocuments.map(renderDocumentCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No documents shared with you</h3>
                <p className="mt-2 text-muted-foreground">
                  Documents shared with you will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}