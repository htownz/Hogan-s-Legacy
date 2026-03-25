import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileTextIcon, ClipboardIcon, FileUpIcon, PlusIcon, LoaderIcon } from "lucide-react";

export default function FilingAssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const { toast } = useToast();

  // Simulated data for templates
  const sampleTemplates = [
    { id: 1, name: "Campaign Finance Report", description: "Disclosure report for campaign donations and expenditures" },
    { id: 2, name: "Lobbyist Registration", description: "Form to register as a lobbyist with the ethics commission" },
    { id: 3, name: "Conflict of Interest Disclosure", description: "Disclosure of potential conflicts for public officials" },
  ];

  // Simulated data for drafts
  const sampleDrafts = [
    { id: 1, name: "Q1 Finance Report", formTemplateId: 1, lastEdited: "2025-04-01", status: "In Progress" },
    { id: 2, name: "Annual Lobbyist Registration", formTemplateId: 2, lastEdited: "2025-03-15", status: "In Progress" },
  ];

  useEffect(() => {
    // In a real implementation, we'd fetch these from the API
    setTemplates(sampleTemplates);
    setDrafts(sampleDrafts);
  }, []);

  const createNewDraft = (templateId: number) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Draft Created",
        description: "Your new draft has been created successfully.",
      });
    }, 1000);
  };

  const handleUpload = () => {
    toast({
      title: "Upload Feature",
      description: "File upload functionality will be implemented in the next phase.",
    });
  };

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Filing Assistant</h1>
          <p className="text-gray-500 mt-2">
            Complete and file ethics commission forms with AI assistance
          </p>
        </div>

        <Tabs defaultValue="forms">
          <TabsList className="mb-4">
            <TabsTrigger value="forms">Start New Form</TabsTrigger>
            <TabsTrigger value="drafts">My Drafts</TabsTrigger>
            <TabsTrigger value="upload">Upload Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="forms" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileTextIcon className="h-5 w-5" /> 
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => createNewDraft(template.id)} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? <LoaderIcon className="h-4 w-4 mr-2 animate-spin" /> : <PlusIcon className="h-4 w-4 mr-2" />}
                      Create New
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            {drafts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft) => (
                  <Card key={draft.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardIcon className="h-5 w-5" /> 
                        {draft.name}
                      </CardTitle>
                      <CardDescription>
                        Last edited: {draft.lastEdited}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        Status: <span className="font-medium text-amber-600">{draft.status}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">Continue Editing</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No drafts found</h3>
                <p className="text-gray-500 mt-2">You haven't started any forms yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Existing Form</CardTitle>
                <CardDescription>
                  Upload a form that you've previously downloaded or received via email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file">Select File</Label>
                    <Input id="file" type="file" />
                  </div>
                  <div className="text-sm text-gray-500">
                    Supported formats: PDF, DOC, DOCX
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpload} className="w-full">
                  <FileUpIcon className="h-4 w-4 mr-2" />
                  Upload and Process
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}