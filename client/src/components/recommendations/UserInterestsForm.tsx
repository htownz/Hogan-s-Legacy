import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/MultiSelect";

// Schema for user interests
const userInterestsSchema = z.object({
  topics: z.array(z.string()).optional(),
  causes: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional()
});

type UserInterestsFormValues = z.infer<typeof userInterestsSchema>;

// Example topics (this would come from an API in a real application)
const availableTopics = [
  { label: "Education", value: "Education" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Environment", value: "Environment" },
  { label: "Economy", value: "Economy" },
  { label: "Immigration", value: "Immigration" },
  { label: "Criminal Justice", value: "Criminal Justice" },
  { label: "Infrastructure", value: "Infrastructure" },
  { label: "Veterans Affairs", value: "Veterans Affairs" },
  { label: "Taxes", value: "Taxes" },
  { label: "Agriculture", value: "Agriculture" },
  { label: "Small Business", value: "Small Business" },
  { label: "Technology", value: "Technology" },
  { label: "Transportation", value: "Transportation" },
  { label: "Housing", value: "Housing" },
  { label: "Energy", value: "Energy" },
  { label: "Finance", value: "Finance" },
  { label: "National Security", value: "National Security" },
  { label: "Labor", value: "Labor" },
  { label: "Social Security", value: "Social Security" },
  { label: "Civil Rights", value: "Civil Rights" }
];

// Example causes (would also come from an API)
const availableCauses = [
  { label: "Public School Funding", value: "Public School Funding" },
  { label: "Medicare Expansion", value: "Medicare Expansion" },
  { label: "Climate Change", value: "Climate Change" },
  { label: "Job Creation", value: "Job Creation" },
  { label: "Border Security", value: "Border Security" },
  { label: "Police Reform", value: "Police Reform" },
  { label: "Public Transit", value: "Public Transit" },
  { label: "Veterans Healthcare", value: "Veterans Healthcare" },
  { label: "Tax Reform", value: "Tax Reform" },
  { label: "Farm Subsidies", value: "Farm Subsidies" },
  { label: "Student Loan Relief", value: "Student Loan Relief" },
  { label: "Rural Internet Access", value: "Rural Internet Access" },
  { label: "Affordable Housing", value: "Affordable Housing" },
  { label: "Renewable Energy", value: "Renewable Energy" },
  { label: "Consumer Protection", value: "Consumer Protection" },
  { label: "Voting Rights", value: "Voting Rights" }
];

interface UserInterestsFormProps {
  interests: any;
  onUpdate: () => void;
}

export default function UserInterestsForm({ interests, onUpdate }: UserInterestsFormProps) {
  const { toast } = useToast();
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);

  // Set up form
  const form = useForm<UserInterestsFormValues>({
    resolver: zodResolver(userInterestsSchema),
    defaultValues: {
      topics: interests?.topics || [],
      causes: interests?.causes || [],
      keywords: interests?.keywords || []
    }
  });

  // Setup mutation for saving interests
  const mutation = useMutation({
    mutationFn: async (data: UserInterestsFormValues) => {
      if (interests && interests.id) {
        // Update existing interests
        return await apiRequest("/api/recommendations/interests", {
          method: "PATCH",
          data
        });
      } else {
        // Create new interests
        return await apiRequest("/api/recommendations/interests", {
          method: "POST",
          data
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Interests saved",
        description: "Your policy interests have been updated successfully.",
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error saving interests",
        description: `There was a problem saving your interests: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Form submit handler
  const onSubmit = (data: UserInterestsFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="topics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Topics</FormLabel>
              <FormDescription>
                Select the legislative topics you're most interested in following.
              </FormDescription>
              <FormControl>
                <MultiSelect
                  options={availableTopics}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select topics..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={form.control}
          name="causes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Causes You Care About</FormLabel>
              <FormDescription>
                Select specific causes that are important to you. This helps us find
                more targeted legislation.
              </FormDescription>
              <FormControl>
                <MultiSelect
                  options={availableCauses}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select causes..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keywords</FormLabel>
              <FormDescription>
                Add specific keywords to help us find legislation with those terms.
              </FormDescription>
              <FormControl>
                <MultiSelect
                  options={(field.value || []).map(kw => ({ label: kw, value: kw }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add keywords..."
                  allowCustomValue={true}
                  onCustomValueAdd={(value) => {
                    const currentValues = field.value || [];
                    if (!currentValues.includes(value)) {
                      field.onChange([...currentValues, value]);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full md:w-auto"
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Interests
        </Button>
      </form>
    </Form>
  );
}