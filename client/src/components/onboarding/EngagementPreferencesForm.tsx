import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, MessageSquare, MapPin, Info } from 'lucide-react';

// Define form schema
const preferencesFormSchema = z.object({
  notificationsEnabled: z.boolean().default(true),
  emailFrequency: z.string().min(1),
  pushNotificationsEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  locationSharingEnabled: z.boolean().default(false),
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

const EngagementPreferencesForm: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user's engagement preferences
  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ['/api/onboarding/preferences'],
    select: (data) => data || {
      notificationsEnabled: true,
      emailFrequency: 'weekly',
      pushNotificationsEnabled: true,
      smsEnabled: false,
      locationSharingEnabled: false
    },
  });

  // Update engagement preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: PreferencesFormValues) => apiRequest('/api/onboarding/preferences', {
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/preferences'] });
      toast({
        title: 'Preferences updated',
        description: 'Your engagement preferences have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating preferences:', error);
    },
  });

  // Define form
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      notificationsEnabled: true,
      emailFrequency: 'weekly',
      pushNotificationsEnabled: true,
      smsEnabled: false,
      locationSharingEnabled: false,
    },
  });

  // Update form values when preferences data is loaded
  useEffect(() => {
    if (preferences) {
      form.reset({
        notificationsEnabled: preferences.notificationsEnabled,
        emailFrequency: preferences.emailFrequency,
        pushNotificationsEnabled: preferences.pushNotificationsEnabled,
        smsEnabled: preferences.smsEnabled,
        locationSharingEnabled: preferences.locationSharingEnabled,
      });
    }
  }, [preferences, form]);

  const onSubmit = (data: PreferencesFormValues) => {
    updatePreferencesMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight mb-2">How would you like to stay engaged?</h2>
        <p className="text-muted-foreground">
          Customize how and when you receive updates about civic activities
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Notification settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Control how you receive updates about legislation and civic activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable All Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive notifications about bills, events, and civic actions
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
              
              <FormField
                control={form.control}
                name="emailFrequency"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4" />
                      <FormLabel>Email Frequency</FormLabel>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!form.watch('notificationsEnabled')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select how often to receive emails" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="real-time">Real-time (as events happen)</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="monthly">Monthly Recap</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How frequently would you like to receive email updates about your tracked bills and interests?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pushNotificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Push Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive browser notifications for important updates
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch('notificationsEnabled')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="smsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        SMS Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive text messages for urgent civic actions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch('notificationsEnabled')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Location settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Location Settings</span>
              </CardTitle>
              <CardDescription>
                Control how your location is used to personalize your civic engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="locationSharingEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Share Location Data
                      </FormLabel>
                      <FormDescription>
                        Allow Act Up to use your location to show relevant civic issues in your area
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
            </CardContent>
          </Card>

          <div className="bg-muted p-4 rounded-lg flex items-start gap-2">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              You can change these preferences at any time from your account settings. 
              We're committed to protecting your privacy and only sending you relevant information.
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={updatePreferencesMutation.isPending}
          >
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EngagementPreferencesForm;