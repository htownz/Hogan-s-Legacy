// @ts-nocheck
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  type: z.enum(["consultant", "mega_influencer"], {
    required_error: "Please select a profile type.",
  }),
  summary: z.string().min(10, {
    message: "Summary must be at least 10 characters.",
  }),
  source_urls: z.string()
    .transform((val) => val.split('\n').map(url => url.trim()).filter(url => url !== "")),
  influence_topics: z.string()
    .transform((val) => val.split(',').map(topic => topic.trim()).filter(topic => topic !== "")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Default values
const defaultValues: Partial<ProfileFormValues> = {
  name: "",
  type: "consultant",
  summary: "",
  source_urls: "",
  influence_topics: "",
};

export default function CreateScoutBotProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      return apiRequest('/api/scout-bot/profiles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Created",
        description: "The profile has been successfully created and is pending review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/statistics'] });
      navigate('/scout-bot');
    },
    onError: (error) => {
      toast({
        title: "Error Creating Profile",
        description: "There was an error creating the profile. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating profile:", error);
    },
  });
  
  // Form submission handler
  function onSubmit(data: ProfileFormValues) {
    createProfileMutation.mutate(data);
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Link href="/scout-bot">
          <Button variant="outline" size="sm" className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Profile</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Political Influencer Profile</CardTitle>
          <CardDescription>
            Add a new political consultant or mega influencer to the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name of the individual" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the full name of the political consultant or influencer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a profile type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consultant">Political Consultant</SelectItem>
                        <SelectItem value="mega_influencer">Mega Influencer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether this individual is a political consultant or a mega influencer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the individual's background, influence, and significance..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a concise summary of this individual's political influence and background.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="influence_topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topics of Influence</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Education, Healthcare, Energy, Taxes, etc." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter topics separated by commas (e.g., "Education, Healthcare, Energy").
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source_urls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source URLs</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="https://example.com/article1&#10;https://example.com/article2"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter each source URL on a new line. Include articles, profiles, or other references.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={createProfileMutation.isPending}
              >
                {createProfileMutation.isPending ? (
                  "Creating Profile..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Profile
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}