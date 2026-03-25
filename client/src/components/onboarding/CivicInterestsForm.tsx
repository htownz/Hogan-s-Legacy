import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Define form schema
const interestFormSchema = z.object({
  interestCategory: z.string().min(1, 'Please select a category'),
  interestValue: z.string().min(1, 'Please enter a specific interest'),
  priorityLevel: z.number().min(1).max(5),
});

type InterestFormValues = z.infer<typeof interestFormSchema>;

// Interest categories
const interestCategories = [
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'environment', label: 'Environment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'housing', label: 'Housing' },
  { value: 'publicSafety', label: 'Public Safety' },
  { value: 'economy', label: 'Economy' },
  { value: 'civilRights', label: 'Civil Rights' },
  { value: 'immigration', label: 'Immigration' },
  { value: 'tax', label: 'Taxation' },
  { value: 'other', label: 'Other' },
];

const CivicInterestsForm: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch existing civic interests
  const { data: interests, isLoading } = useQuery<any>({
    queryKey: ['/api/onboarding/interests'],
    select: (data) => data || [],
  });

  // Add new civic interest
  const addInterestMutation = useMutation({
    mutationFn: (data: InterestFormValues) => apiRequest('/api/onboarding/interests', {
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/interests'] });
      form.reset({
        interestCategory: '',
        interestValue: '',
        priorityLevel: 3,
      });
      toast({
        title: 'Interest added',
        description: 'Your civic interest has been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add interest. Please try again.',
        variant: 'destructive',
      });
      console.error('Error adding interest:', error);
    },
  });

  // Delete civic interest
  const deleteInterestMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/onboarding/interests/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/interests'] });
      toast({
        title: 'Interest removed',
        description: 'The civic interest has been removed from your profile.',
      });
    },
  });

  // Define form
  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: {
      interestCategory: '',
      interestValue: '',
      priorityLevel: 3,
    },
  });

  const onSubmit = (data: InterestFormValues) => {
    addInterestMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    deleteInterestMutation.mutate(id);
  };

  const getPriorityLabel = (level: number) => {
    switch(level) {
      case 1: return 'Very Low';
      case 2: return 'Low';
      case 3: return 'Medium';
      case 4: return 'High';
      case 5: return 'Very High';
      default: return 'Medium';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight mb-2">What issues matter to you?</h2>
        <p className="text-muted-foreground">
          Tell us which civic issues you care about most so we can personalize your experience
        </p>
      </div>

      {/* Interest list */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Civic Interests</h3>
        
        {isLoading ? (
          <div className="text-center py-4">Loading your interests...</div>
        ) : interests?.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No interests added yet</AlertTitle>
            <AlertDescription>
              Add civic interests below to help us personalize your Act Up experience.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {interests?.map((interest: any) => (
              <Card key={interest.id} className="group relative">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {interestCategories.find(c => c.value === interest.interestCategory)?.label || interest.interestCategory}
                      </Badge>
                      <Badge 
                        variant={
                          interest.priorityLevel >= 4 ? 'default' :
                          interest.priorityLevel >= 3 ? 'secondary' : 'outline'
                        }
                      >
                        {getPriorityLabel(interest.priorityLevel)}
                      </Badge>
                    </div>
                    <div className="mt-1 text-lg font-medium">{interest.interestValue}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(interest.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Add interest form */}
      <div>
        <h3 className="text-lg font-medium mb-4">Add New Interest</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interestCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {interestCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the general area of civic interest
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="interestValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Interest</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Public School Funding" />
                    </FormControl>
                    <FormDescription>
                      Enter a specific issue or topic
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="priorityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      className="flex justify-between"
                    >
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem value="1" className="peer sr-only" />
                        </FormControl>
                        <FormLabel className="text-xs cursor-pointer p-2 rounded peer-data-[state=checked]:bg-primary/10">
                          Very Low
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem value="2" className="peer sr-only" />
                        </FormControl>
                        <FormLabel className="text-xs cursor-pointer p-2 rounded peer-data-[state=checked]:bg-primary/10">
                          Low
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem value="3" className="peer sr-only" />
                        </FormControl>
                        <FormLabel className="text-xs cursor-pointer p-2 rounded peer-data-[state=checked]:bg-primary/10">
                          Medium
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem value="4" className="peer sr-only" />
                        </FormControl>
                        <FormLabel className="text-xs cursor-pointer p-2 rounded peer-data-[state=checked]:bg-primary/10">
                          High
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem value="5" className="peer sr-only" />
                        </FormControl>
                        <FormLabel className="text-xs cursor-pointer p-2 rounded peer-data-[state=checked]:bg-primary/10">
                          Very High
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    How important is this issue to you? Higher priority items will receive more prominent notifications and updates.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={addInterestMutation.isPending}
              className="w-full"
            >
              {addInterestMutation.isPending ? 'Adding...' : 'Add Interest'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CivicInterestsForm;