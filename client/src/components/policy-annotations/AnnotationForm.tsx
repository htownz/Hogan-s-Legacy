import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, Lock, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ActionCircleSelector from "./ActionCircleSelector";
import { useAuth } from "@/hooks/use-auth";

interface AnnotationFormProps {
  billId: string;
}

const formSchema = z.object({
  text: z.string().min(3, "Annotation text must be at least 3 characters"),
  sectionReference: z.string().optional(),
  pageNumber: z.string().optional(),
  visibility: z.enum(["public", "private", "circle"]),
  circleId: z.string().optional().refine(
    (val) => {
      // If visibility is 'circle', circleId must be provided
      return val !== "" || val !== undefined;
    },
    {
      message: "Please select a circle",
      path: ["circleId"],
    }
  ),
});

type FormValues = z.infer<typeof formSchema>;

export default function AnnotationForm({ billId }: AnnotationFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("public");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      sectionReference: "",
      pageNumber: "",
      visibility: "public",
      circleId: "",
    },
  });

  // Update visibility based on tab selection
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    form.setValue("visibility", value as "public" | "private" | "circle");
    
    // Reset circleId when not on circle tab
    if (value !== "circle") {
      form.setValue("circleId", "");
    }
  };

  const createAnnotationMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert pageNumber to number if provided
      const payload = {
        ...values,
        billId,
        pageNumber: values.pageNumber ? parseInt(values.pageNumber) : undefined,
        circleId: values.visibility === "circle" && values.circleId ? parseInt(values.circleId) : undefined,
      };

      const response = await apiRequest("/api/annotations", {
        method: "POST",
        data: payload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create annotation");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Annotation created",
        description: "Your annotation has been added successfully.",
      });
      
      // Reset form
      form.reset({
        text: "",
        sectionReference: "",
        pageNumber: "",
        visibility: "public",
        circleId: "",
      });
      
      // Reset active tab
      setActiveTab("public");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/bill', billId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/annotations/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create annotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: FormValues) => {
    // Make sure visibility matches current tab
    values.visibility = activeTab as "public" | "private" | "circle";
    
    // Validate circle selection when on circle tab
    if (values.visibility === "circle" && (!values.circleId || values.circleId === "")) {
      form.setError("circleId", {
        type: "manual",
        message: "Please select a circle to share with",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createAnnotationMutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Your Annotation</CardTitle>
        <CardDescription>
          Share your insights and questions about this legislation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your annotation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your analysis, insight or question about this bill..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sectionReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section reference (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Section 3.2" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pageNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page number (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 5" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Visibility Tabs */}
            <div className="space-y-2">
              <FormLabel>Share with</FormLabel>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="public" className="flex items-center gap-1.5">
                    <Globe size={16} />
                    Public
                  </TabsTrigger>
                  <TabsTrigger value="private" className="flex items-center gap-1.5">
                    <Lock size={16} />
                    Private
                  </TabsTrigger>
                  <TabsTrigger value="circle" className="flex items-center gap-1.5" disabled={!user}>
                    <Users size={16} />
                    Circle
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="public" className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Your annotation will be visible to everyone.
                  </p>
                </TabsContent>
                
                <TabsContent value="private" className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Only you will be able to see this annotation.
                  </p>
                </TabsContent>
                
                <TabsContent value="circle" className="pt-4">
                  <FormField
                    control={form.control}
                    name="circleId"
                    render={({ field }) => (
                      <ActionCircleSelector 
                        onValueChange={field.onChange}
                        selectedValue={field.value}
                        isRequired={true}
                      />
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              {/* Hidden field to store visibility value */}
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <input type="hidden" {...field} value={activeTab} />
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Annotation"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}