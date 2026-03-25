// @ts-nocheck
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Upload, FileUp, Download, Bot, Save, Check, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type FormTemplate = {
  id: number;
  formNumber: string;
  formTitle: string;
  formDescription: string;
  formType: string;
  currentVersion: string;
  effectiveDate: string;
  templateUrl: string;
  instructionsUrl: string;
  aiModelTrained: boolean;
};

type FormDraft = {
  id: number;
  formTemplateId: number;
  draftName: string;
  formData: Record<string, any>;
  formState: 'in-progress' | 'review' | 'ready-to-file';
  completionPercentage: number;
  generatedPdfUrl?: string;
  lastEditedField?: string;
  aiAssisted: boolean;
  lastAccessed: string;
};

type FormField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  section: string;
  group?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
};

export default function FilingAssistant() {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<FormDraft | null>(null);
  const [formMode, setFormMode] = useState<'view' | 'edit' | 'ai'>('view');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch form templates
  const { data: formTemplates = [], isLoading: isLoadingTemplates } = useQuery<any>({
    queryKey: ['/api/filing-forms/templates'],
    select: (data) => data as FormTemplate[]
  });
  
  // Fetch user's form drafts
  const { data: formDrafts = [], isLoading: isLoadingDrafts } = useQuery<any>({
    queryKey: ['/api/filing-forms/drafts'],
    select: (data) => data as FormDraft[]
  });
  
  // Mutation for creating a new draft
  const createDraftMutation = useMutation({
    mutationFn: (data: { formTemplateId: number, draftName: string }) => {
      return apiRequest('/api/filing-forms/drafts', {
        method: 'POST',
        data,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/filing-forms/drafts'] });
      setSelectedDraft(data);
      setFormMode('edit');
      setActiveTab('edit');
      toast({
        title: "Draft Created",
        description: "You can now fill out the form or use our AI assistant for help.",
      });
    }
  });
  
  // Mutation for updating a draft
  const updateDraftMutation = useMutation({
    mutationFn: (data: { id: number, formData: Record<string, any>, formState: string }) => {
      return apiRequest(`/api/filing-forms/drafts/${data.id}`, {
        method: 'PATCH',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filing-forms/drafts'] });
      toast({
        title: "Draft Saved",
        description: "Your changes have been saved successfully.",
      });
    }
  });
  
  // Mutation for AI assistant interaction
  const aiAssistantMutation = useMutation({
    mutationFn: (message: string) => {
      return apiRequest('/api/filing-forms/ai-assistant', {
        method: 'POST',
        data: {
          message,
          formTemplateId: selectedTemplate?.id,
          draftId: selectedDraft?.id,
          history: chatMessages,
        },
      });
    },
    onSuccess: (data) => {
      setChatMessages(prev => [
        ...prev, 
        data.message as ChatMessage,
      ]);
      
      // If the AI suggested form field updates
      if (data.fieldUpdates) {
        updateDraftMutation.mutate({
          id: selectedDraft!.id,
          formData: {
            ...selectedDraft!.formData,
            ...data.fieldUpdates,
          },
          formState: 'in-progress',
        });
      }
      
      setUserMessage('');
    }
  });
  
  // Generates a downloadable PDF from the draft
  const generatePdfMutation = useMutation({
    mutationFn: (draftId: number) => {
      return apiRequest(`/api/filing-forms/drafts/${draftId}/pdf`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      if (selectedDraft) {
        setSelectedDraft({
          ...selectedDraft,
          generatedPdfUrl: data.pdfUrl,
        });
        
        // Open PDF in new tab
        window.open(data.pdfUrl, '_blank');
        
        toast({
          title: "PDF Generated",
          description: "Your form has been generated as a PDF. You can download it now.",
        });
      }
    }
  });
  
  // Load form fields when a template or draft is selected
  useEffect(() => {
    if (selectedTemplate) {
      // Fetch form fields for this template
      apiRequest(`/api/filing-forms/templates/${selectedTemplate.id}/fields`, {
        method: 'GET',
      }).then((data) => {
        setFormFields(data);
        if (data.length > 0) {
          const sections = [...new Set(data.map((field: FormField) => field.section))];
          setActiveSection(sections[0]);
        }
      });
    }
  }, [selectedTemplate]);
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);
    
    // Send the file to the server
    apiRequest('/api/filing-forms/upload', {
      method: 'POST',
      body: formData,
    }).then((data) => {
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        
        // Create a new draft from the uploaded form
        if (data.formTemplateId) {
          const template = formTemplates.find((t: any) => t.id === data.formTemplateId);
          setSelectedTemplate(template || null);
          
          createDraftMutation.mutate({
            formTemplateId: data.formTemplateId,
            draftName: `${file.name.split('.')[0]} (Uploaded)`,
          });
          
          // Pre-fill form data if extracted from the upload
          if (data.extractedData) {
            setSelectedDraft(prev => prev ? {
              ...prev,
              formData: data.extractedData,
            } : null);
          }
        }
      }, 500);
    }).catch(() => {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: "There was an error processing your form. Please try again.",
        variant: "destructive",
      });
    });
  };
  
  // Send message to AI assistant
  const sendMessage = () => {
    if (!userMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    aiAssistantMutation.mutate(userMessage);
  };
  
  // Save the current draft
  const saveDraft = (formState: 'in-progress' | 'review' | 'ready-to-file' = 'in-progress') => {
    if (!selectedDraft) return;
    
    const form = document.getElementById('filing-form') as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    updateDraftMutation.mutate({
      id: selectedDraft.id,
      formData: data,
      formState,
    });
  };
  
  // Extract groups of form fields by section
  const getFieldsBySection = (section: string) => {
    return formFields.filter(field => field.section === section);
  };
  
  // Get unique sections for navigation
  const getSections = () => {
    return [...new Set(formFields.map(field => field.section))];
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Filing Assistant</h1>
      <p className="text-muted-foreground mb-6">
        Create, edit, and file your Texas Ethics Commission forms with guided assistance
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="browse">Browse Forms</TabsTrigger>
          <TabsTrigger value="edit" disabled={!selectedDraft}>Edit Form</TabsTrigger>
          <TabsTrigger value="ai" disabled={!selectedDraft}>AI Assistant</TabsTrigger>
        </TabsList>
        
        {/* BROWSE FORMS TAB */}
        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT SIDE: FORM TEMPLATES */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Form Templates</h2>
                <div className="relative">
                  <Input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <Button variant="outline" className="flex items-center gap-2">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Form
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isUploading && (
                <div className="mb-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center mt-1">Processing form...</p>
                </div>
              )}
              
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <div className="space-y-3">
                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    formTemplates.map((template: any) => (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'border-primary' : ''}`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            {template.formNumber} - {template.formTitle}
                            {template.aiModelTrained && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                AI Ready
                              </span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <CardDescription className="text-xs mb-2">
                            {template.formType} • Version {template.currentVersion} • Effective {formatDate(template.effectiveDate)}
                          </CardDescription>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs" 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(template.templateUrl, '_blank');
                              }}
                            >
                              Blank Form
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(template.instructionsUrl, '_blank');
                              }}
                            >
                              Instructions
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="text-xs ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                createDraftMutation.mutate({
                                  formTemplateId: template.id,
                                  draftName: `New ${template.formNumber} Form`,
                                });
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> New Draft
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* RIGHT SIDE: MY DRAFTS */}
            <div>
              <h2 className="text-xl font-semibold mb-4">My Drafts</h2>
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <div className="space-y-3">
                  {isLoadingDrafts ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : formDrafts.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center">
                      <p className="text-muted-foreground">No drafts yet. Create a new form to get started.</p>
                    </div>
                  ) : (
                    formDrafts.map((draft: any) => {
                      const template = formTemplates.find((t: any) => t.id === draft.formTemplateId);
                      return (
                        <Card 
                          key={draft.id} 
                          className={`cursor-pointer transition-colors ${selectedDraft?.id === draft.id ? 'border-primary' : ''}`}
                          onClick={() => {
                            setSelectedDraft(draft);
                            const template = formTemplates.find((t: any) => t.id === draft.formTemplateId);
                            setSelectedTemplate(template || null);
                          }}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                              <span>{draft.draftName}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                                {draft.completionPercentage}% complete
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <CardDescription className="text-xs mb-2">
                              {template?.formNumber} • {formatDate(draft.lastAccessed)} 
                              {draft.aiAssisted && " • AI Assisted"}
                            </CardDescription>
                            <Progress value={draft.completionPercentage} className="h-1.5 mt-2" />
                            <div className="flex gap-2 mt-3">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDraft(draft);
                                  const template = formTemplates.find((t: any) => t.id === draft.formTemplateId);
                                  setSelectedTemplate(template || null);
                                  setFormMode('edit');
                                  setActiveTab('edit');
                                }}
                              >
                                Continue Editing
                              </Button>
                              {draft.formState === 'ready-to-file' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generatePdfMutation.mutate(draft.id);
                                  }}
                                >
                                  <FileUp className="h-3 w-3 mr-1" /> Download PDF
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
        
        {/* EDIT FORM TAB */}
        <TabsContent value="edit" className="space-y-6">
          {selectedDraft && selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* LEFT SIDEBAR: SECTIONS */}
              <div className="md:col-span-1">
                <div className="sticky top-4">
                  <h2 className="text-xl font-semibold mb-4">{selectedTemplate.formNumber} Form Sections</h2>
                  <div className="space-y-1">
                    {getSections().map((section) => (
                      <Button
                        key={section}
                        variant={activeSection === section ? "default" : "ghost"}
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setActiveSection(section)}
                      >
                        {section}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="mt-8 space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => saveDraft('in-progress')}
                      disabled={updateDraftMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        saveDraft('review');
                        toast({
                          title: "Form Saved for Review",
                          description: "Your form is now saved and ready for review.",
                        });
                      }}
                      disabled={updateDraftMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save & Review
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setFormMode('ai');
                        setActiveTab('ai');
                      }}
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      Ask AI for Help
                    </Button>
                    
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(selectedTemplate.instructionsUrl, '_blank')}
                      >
                        View Instructions
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* RIGHT SIDE: FORM FIELDS */}
              <div className="md:col-span-3">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">{selectedDraft.draftName}</h2>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => generatePdfMutation.mutate(selectedDraft.id)}
                    disabled={generatePdfMutation.isPending}
                  >
                    {generatePdfMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Generate PDF
                  </Button>
                </div>
                
                <div className="bg-white p-6 rounded-lg border">
                  <form id="filing-form" className="space-y-8">
                    <h3 className="text-lg font-medium border-b pb-2">{activeSection}</h3>
                    
                    {getFieldsBySection(activeSection).map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {field.type === 'text' && (
                          <Input
                            id={field.id}
                            name={field.id}
                            placeholder={field.placeholder}
                            defaultValue={selectedDraft.formData?.[field.id] || ''}
                            required={field.required}
                          />
                        )}
                        
                        {field.type === 'number' && (
                          <Input
                            id={field.id}
                            name={field.id}
                            type="number"
                            placeholder={field.placeholder}
                            defaultValue={selectedDraft.formData?.[field.id] || ''}
                            required={field.required}
                          />
                        )}
                        
                        {field.type === 'date' && (
                          <Input
                            id={field.id}
                            name={field.id}
                            type="date"
                            defaultValue={selectedDraft.formData?.[field.id] || ''}
                            required={field.required}
                          />
                        )}
                        
                        {field.type === 'select' && (
                          <Select
                            defaultValue={selectedDraft.formData?.[field.id] || ''}
                            name={field.id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {field.type === 'textarea' && (
                          <Textarea
                            id={field.id}
                            name={field.id}
                            placeholder={field.placeholder}
                            defaultValue={selectedDraft.formData?.[field.id] || ''}
                            required={field.required}
                            rows={4}
                          />
                        )}
                        
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const sections = getSections();
                          const currentIndex = sections.indexOf(activeSection);
                          if (currentIndex > 0) {
                            setActiveSection(sections[currentIndex - 1]);
                          }
                        }}
                        disabled={getSections().indexOf(activeSection) === 0}
                      >
                        Previous Section
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const sections = getSections();
                          const currentIndex = sections.indexOf(activeSection);
                          if (currentIndex < sections.length - 1) {
                            setActiveSection(sections[currentIndex + 1]);
                          } else {
                            saveDraft('review');
                            toast({
                              title: "Form Completed",
                              description: "You've completed all sections of this form.",
                            });
                          }
                        }}
                      >
                        {getSections().indexOf(activeSection) === getSections().length - 1
                          ? "Save & Finish"
                          : "Next Section"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* AI ASSISTANT TAB */}
        <TabsContent value="ai" className="space-y-6">
          {selectedDraft && selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* LEFT SIDE: FORM PREVIEW */}
              <div className="md:col-span-1">
                <div className="sticky top-4">
                  <h2 className="text-xl font-semibold mb-4">Form Preview</h2>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{selectedDraft.draftName}</CardTitle>
                      <CardDescription className="text-sm">
                        {selectedTemplate.formNumber} - {selectedTemplate.formTitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Completion Status</p>
                          <Progress value={selectedDraft.completionPercentage} className="h-2 mt-2" />
                          <p className="text-xs text-right mt-1">{selectedDraft.completionPercentage}% complete</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Form Sections</p>
                          <ScrollArea className="h-72">
                            {getSections().map((section) => {
                              const fields = getFieldsBySection(section);
                              const filledFields = fields.filter(field => 
                                selectedDraft.formData?.[field.id] && selectedDraft.formData[field.id] !== ''
                              ).length;
                              
                              return (
                                <div key={section} className="mb-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm">{section}</p>
                                    <span className="text-xs text-muted-foreground">
                                      {filledFields}/{fields.length} fields
                                    </span>
                                  </div>
                                  <Progress 
                                    value={fields.length ? (filledFields / fields.length) * 100 : 0} 
                                    className="h-1" 
                                  />
                                </div>
                              );
                            })}
                          </ScrollArea>
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={() => {
                            setFormMode('edit');
                            setActiveTab('edit');
                          }}
                        >
                          Continue Editing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* RIGHT SIDE: CHAT INTERFACE */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">AI Filing Assistant</h2>
                <Card className="h-[calc(100vh-240px)] flex flex-col">
                  <CardHeader className="p-4 pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Filing Assistant</CardTitle>
                    </div>
                    <CardDescription>
                      I can help you complete your {selectedTemplate.formNumber} form. Ask me questions or 
                      get guidance on filling specific sections.
                    </CardDescription>
                  </CardHeader>
                  
                  <ScrollArea className="flex-1 p-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <Bot className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">How can I help you today?</h3>
                        <p className="text-muted-foreground max-w-md">
                          Ask me about specific form fields, filing requirements, or let me guide you through 
                          completing your {selectedTemplate.formNumber} form.
                        </p>
                        <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-md">
                          <Button
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 text-left"
                            onClick={() => {
                              const message = `What's the purpose of the ${selectedTemplate.formNumber} form?`;
                              setUserMessage(message);
                              
                              const newMessage: ChatMessage = {
                                role: 'user',
                                content: message,
                                timestamp: new Date().toISOString(),
                              };
                              
                              setChatMessages(prev => [...prev, newMessage]);
                              aiAssistantMutation.mutate(message);
                            }}
                          >
                            <div>
                              <p className="font-medium">What's the purpose of this form?</p>
                              <p className="text-xs text-muted-foreground">
                                Learn about form {selectedTemplate.formNumber} requirements
                              </p>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 text-left"
                            onClick={() => {
                              const message = `Guide me through completing this ${selectedTemplate.formNumber} form step-by-step.`;
                              setUserMessage(message);
                              
                              const newMessage: ChatMessage = {
                                role: 'user',
                                content: message,
                                timestamp: new Date().toISOString(),
                              };
                              
                              setChatMessages(prev => [...prev, newMessage]);
                              aiAssistantMutation.mutate(message);
                            }}
                          >
                            <div>
                              <p className="font-medium">Guide me step-by-step</p>
                              <p className="text-xs text-muted-foreground">
                                Get comprehensive guidance through the entire form
                              </p>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 text-left"
                            onClick={() => {
                              // Identify incomplete sections
                              const sections = getSections();
                              const incompleteSection = sections.find(section => {
                                const fields = getFieldsBySection(section);
                                const filledFields = fields.filter(field => 
                                  selectedDraft.formData?.[field.id] && selectedDraft.formData[field.id] !== ''
                                ).length;
                                
                                return filledFields < fields.length;
                              }) || sections[0];
                              
                              const message = `Help me fill out the "${incompleteSection}" section of this form.`;
                              setUserMessage(message);
                              
                              const newMessage: ChatMessage = {
                                role: 'user',
                                content: message,
                                timestamp: new Date().toISOString(),
                              };
                              
                              setChatMessages(prev => [...prev, newMessage]);
                              aiAssistantMutation.mutate(message);
                            }}
                          >
                            <div>
                              <p className="font-medium">Complete a specific section</p>
                              <p className="text-xs text-muted-foreground">
                                Get help with an incomplete section of your form
                              </p>
                            </div>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {aiAssistantMutation.isPending && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <p className="text-sm">Thinking...</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <CardFooter className="p-4 pt-3 border-t mt-auto">
                    <form
                      className="flex w-full gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                    >
                      <Input
                        placeholder="Ask a question about your form..."
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={!userMessage.trim() || aiAssistantMutation.isPending}
                      >
                        {aiAssistantMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}