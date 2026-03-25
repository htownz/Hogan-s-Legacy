import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define the form schema
const submitUpdateSchema = z.object({
  billId: z.string().min(1, "Bill ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  updateType: z.string().min(1, "Update type is required"),
  sourceType: z.string().min(1, "Source type is required"),
  sourceUrl: z.string().url("Please enter a valid URL"),
  isProminent: z.boolean().optional().default(false),
});

type SubmitUpdateFormValues = z.infer<typeof submitUpdateSchema>;

export function SubmitUpdateForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<SubmitUpdateFormValues>({
    resolver: zodResolver(submitUpdateSchema),
    defaultValues: {
      billId: "",
      title: "",
      content: "",
      updateType: "",
      sourceType: "",
      sourceUrl: "",
      isProminent: false,
    },
  });

  // Setup mutation
  const submitUpdateMutation = useMutation({
    mutationFn: async (data: SubmitUpdateFormValues) => {
      const response = await apiRequest("/api/verification/updates", { method: "POST", data });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Update submitted",
        description: "Your legislative update has been submitted for verification.",
      });
      form.reset();
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/verification/updates/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/verification/updates/recent'] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Unable to submit update. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Form submission handler
  const onSubmit = (values: SubmitUpdateFormValues) => {
    setIsSubmitting(true);
    submitUpdateMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="billId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bill ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., HB123, SB456" {...field} />
              </FormControl>
              <FormDescription>
                Enter the official ID of the bill this update refers to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief title of the update" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detailed description of what has changed" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="updateType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Update Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="status_change">Status Change</SelectItem>
                    <SelectItem value="text_change">Text Change</SelectItem>
                    <SelectItem value="sponsor_change">Sponsor Change</SelectItem>
                    <SelectItem value="committee_action">Committee Action</SelectItem>
                    <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
                    <SelectItem value="vote_recorded">Vote Recorded</SelectItem>
                    <SelectItem value="amendment_added">Amendment Added</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sourceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="official">Official Source</SelectItem>
                    <SelectItem value="news">News Source</SelectItem>
                    <SelectItem value="community">Community Source</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="sourceUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormDescription>
                Link to the source of this information
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isProminent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  Mark as important update
                </FormLabel>
                <FormDescription>
                  Only mark updates as important if they significantly affect the bill's progress or content
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-foreground"></span>
          )}
          Submit Update
        </Button>
      </form>
    </Form>
  );
}