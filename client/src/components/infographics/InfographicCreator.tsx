import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Form schema definition
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  templateId: z.string().optional(),
  themeColor: z.string().default('#FF6400'),
  isPublic: z.boolean().default(true),
  dataSource: z.enum(['bill', 'voting', 'civic_action', 'impact']),
  // Bill specific
  billId: z.string().optional(),
  // Voting specific
  votingData: z.any().optional(),
  // Civic action specific
  actionData: z.any().optional(),
  // Impact specific
  impactData: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  previewUrl?: string;
}

interface Bill {
  id: string;
  title: string;
  description: string;
}

interface InfographicCreatorProps {
  onSuccess?: (infographic: any) => void;
  billId?: string;
  bill?: Bill;
}

export const InfographicCreator: React.FC<InfographicCreatorProps> = ({
  onSuccess,
  billId,
  bill
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: bill ? `${bill.id}: ${bill.title}` : '',
      description: bill?.description || '',
      themeColor: '#FF6400',
      isPublic: true,
      dataSource: billId ? 'bill' : 'voting', // Default to bill if billId provided, otherwise voting
      billId: billId || undefined,
    },
  });
  
  const { data: templates = [], isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/infographics/templates'],
    enabled: true,
  });
  
  const { data: billTemplates = [], isLoading: billTemplatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/infographics/templates/type/bill'],
    enabled: form.watch('dataSource') === 'bill',
  });
  
  const { data: votingTemplates = [], isLoading: votingTemplatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/infographics/templates/type/voting'],
    enabled: form.watch('dataSource') === 'voting',
  });
  
  const { data: actionTemplates = [], isLoading: actionTemplatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/infographics/templates/type/civic_action'],
    enabled: form.watch('dataSource') === 'civic_action',
  });
  
  const { data: impactTemplates = [], isLoading: impactTemplatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/infographics/templates/type/impact'],
    enabled: form.watch('dataSource') === 'impact',
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery<Bill[]>({
    queryKey: ['/api/bills'],
    enabled: form.watch('dataSource') === 'bill' && !billId,
  });
  
  const createInfographicMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      let endpoint = '';
      const payload = { ...data };
      
      switch (data.dataSource) {
        case 'bill':
          endpoint = `/api/infographics/generate/bill/${data.billId}`;
          break;
        case 'voting':
          endpoint = '/api/infographics/generate/voting';
          break;
        case 'civic_action':
          endpoint = '/api/infographics/generate/civic-action';
          break;
        case 'impact':
          endpoint = '/api/infographics/generate/impact';
          break;
      }
      
      return apiRequest(endpoint, {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/infographics'] });
      toast({
        title: "Infographic created!",
        description: "Your infographic was created successfully.",
      });
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating infographic",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (values: FormValues) => {
    createInfographicMutation.mutate(values);
  };
  
  const getTemplatesForCurrentType = () => {
    switch (form.watch('dataSource')) {
      case 'bill':
        return billTemplates || [];
      case 'voting':
        return votingTemplates || [];
      case 'civic_action':
        return actionTemplates || [];
      case 'impact':
        return impactTemplates || [];
      default:
        return [];
    }
  };
  
  const currentTemplates = getTemplatesForCurrentType();
  const isTemplatesLoading = 
    (form.watch('dataSource') === 'bill' && billTemplatesLoading) ||
    (form.watch('dataSource') === 'voting' && votingTemplatesLoading) ||
    (form.watch('dataSource') === 'civic_action' && actionTemplatesLoading) ||
    (form.watch('dataSource') === 'impact' && impactTemplatesLoading);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Infographic</CardTitle>
          <CardDescription>
            Generate a shareable infographic to promote civic engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue={billId ? "bill" : "voting"} 
                    onValueChange={(value) => form.setValue('dataSource', value as any)}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="bill">Bill</TabsTrigger>
                  <TabsTrigger value="voting">Voting</TabsTrigger>
                  <TabsTrigger value="civic_action">Civic Action</TabsTrigger>
                  <TabsTrigger value="impact">Impact</TabsTrigger>
                </TabsList>
                
                <TabsContent value="bill" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="billId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Bill</FormLabel>
                        <Select
                          disabled={!!billId}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a bill" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {billsLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              bills?.map((bill: any) => (
                                <SelectItem key={bill.id} value={bill.id}>
                                  {bill.id}: {bill.title}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a bill to create an infographic for
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="voting" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Configure voting information infographic options
                  </div>
                  {/* Add form fields for voting data */}
                </TabsContent>
                
                <TabsContent value="civic_action" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Configure civic action infographic options
                  </div>
                  {/* Add form fields for civic action data */}
                </TabsContent>
                
                <TabsContent value="impact" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Configure impact visualization infographic options
                  </div>
                  {/* Add form fields for impact data */}
                </TabsContent>
              </Tabs>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Infographic title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive title for your infographic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this infographic is about"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isTemplatesLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            currentTemplates.map((template: Template) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a template for your infographic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="themeColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Color</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input type="color" {...field} className="w-12 h-10 p-1" />
                        </FormControl>
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          className="flex-1"
                        />
                      </div>
                      <FormDescription>
                        Choose a primary color for your infographic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Infographic</FormLabel>
                      <FormDescription>
                        Make this infographic visible to everyone
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={createInfographicMutation.isPending}
                >
                  {createInfographicMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Infographic
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {preview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-md p-4"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview) }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InfographicCreator;