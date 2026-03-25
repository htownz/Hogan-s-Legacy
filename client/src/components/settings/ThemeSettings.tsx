import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEmotionTheme } from '@/hooks/use-emotion-theme';
import type { UserThemePreferences } from '@shared/types';

export function ThemeSettings() {
  const { toast } = useToast();
  const { 
    themePreferences,
    updateThemePreferences,
    isLoadingPreferences
  } = useEmotionTheme();

  const form = useForm<UserThemePreferences>({
    defaultValues: themePreferences || {
      useEmotionTheming: true,
      defaultTheme: 'system',
      emotionThemeIntensity: 'moderate'
    }
  });

  const onSubmit = async (data: UserThemePreferences) => {
    try {
      await updateThemePreferences(data);
      toast({
        title: 'Theme preferences updated',
        description: 'Your theme settings have been saved.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Failed to update theme preferences',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingPreferences) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 bg-muted rounded"></div>
          <div className="h-4 w-2/3 bg-muted rounded"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-8 w-full bg-muted rounded"></div>
          <div className="h-8 w-full bg-muted rounded"></div>
          <div className="h-8 w-full bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Customize how Act Up looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="useEmotionTheming"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Emotion-Responsive Theme</FormLabel>
                    <FormDescription>
                      Automatically adjust the UI theme based on emotional content of legislative material
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

            {form.watch('useEmotionTheming') && (
              <FormField
                control={form.control}
                name="emotionThemeIntensity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emotion Theme Intensity</FormLabel>
                    <FormDescription>
                      Control how strongly the emotion affects the UI colors
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="subtle" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Subtle - Minimal color adjustments
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="moderate" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Moderate - Balanced color adjustments
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="strong" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Strong - Maximum color impact
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {!form.watch('useEmotionTheming') && (
              <>
                <FormField
                  control={form.control}
                  name="defaultTheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Theme</FormLabel>
                      <FormDescription>
                        Choose your preferred theme when emotion theming is disabled
                      </FormDescription>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="themeColorOverride"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Theme</FormLabel>
                      <FormDescription>
                        Choose a primary color for your theme
                      </FormDescription>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          '#0ea5e9', // Sky
                          '#f97316', // Orange
                          '#8b5cf6', // Violet
                          '#10b981', // Emerald
                          '#ef4444', // Red
                        ].map(color => (
                          <div 
                            key={color}
                            className={`h-10 w-full rounded-md cursor-pointer ring-offset-2 ${field.value === color ? 'ring-2 ring-primary' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}