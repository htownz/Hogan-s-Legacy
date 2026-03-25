// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../../context/UserContext";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }).max(500),
  rationale: z.string().min(20, { message: "Rationale must be at least 20 characters" }).max(1000),
  billId: z.string().optional().nullable(),
  priority: z.enum(["High", "Medium", "Low"]).optional().nullable(),
  impact: z.string().optional().nullable(),
  actionItems: z.string().optional().nullable(),
  categories: z.array(z.string()).min(1, { message: "Select at least one category" }),
});

type FormValues = z.infer<typeof formSchema>;

// Sample categories (in a real app, these would be fetched from the API)
const availableCategories = [
  "Healthcare",
  "Education",
  "Environment",
  "Civil Rights",
  "Criminal Justice",
  "Technology",
  "Infrastructure",
  "Finance",
  "Public Safety",
  "Immigration",
];

const SuggestBillPage = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      rationale: "",
      billId: "",
      priority: null,
      impact: "",
      actionItems: "",
      categories: [],
    },
  });

  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) {
        throw new Error("You must be logged in to suggest a bill");
      }

      const response = await fetch("/api/community/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...values,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create suggestion");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // On successful submission, invalidate queries and navigate to the suggestion
      queryClient.invalidateQueries({ queryKey: ["/api/community/suggestions"] });
      toast({
        title: "Success!",
        description: "Your bill suggestion has been submitted.",
      });
      navigate(`/community/suggestions/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit suggestion",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to suggest a bill.",
        variant: "destructive",
      });
      return;
    }

    // Ensure categories are included
    values.categories = selectedCategories;
    mutation.mutate(values);
  };

  // Handle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to suggest a bill for community focus.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Suggest a Bill for Community Focus</CardTitle>
          <CardDescription>
            Help the community identify important legislation that deserves attention and action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Education Funding Reform" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, concise title for your suggestion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., TX-HB1234" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      If you're suggesting an existing bill, enter its ID
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
                    <FormLabel>Description*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe what this bill or suggestion is about..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rationale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why This Matters*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this bill or issue is important to the community..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potential Impact (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Statewide, Regional, Local" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="actionItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggested Actions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What actions do you suggest the community take regarding this bill?"
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormLabel>Categories*</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableCategories.map((category) => (
                        <Button
                          key={category}
                          type="button"
                          variant={selectedCategories.includes(category) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCategory(category)}
                          className="rounded-full"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                    {form.formState.errors.categories && (
                      <p className="text-sm font-medium text-destructive mt-2">
                        {form.formState.errors.categories.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/community")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestBillPage;