import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function RecommendationSettings() {
  const { toast } = useToast();
  
  // Default settings until we load user settings
  const [settings, setSettings] = useState({
    notifyNewRecommendations: true,
    includeEmergingBills: true,
    includeControversialBills: true,
    recommendationFrequency: 7, // days
    maxRecommendationsPerWeek: 10,
  });

  // Fetch user interests to get settings
  const { data: interests, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/recommendations/interests"],
    retry: false
  });
  
  // Update settings when data is loaded
  useEffect(() => {
    if (interests && typeof interests === 'object' && 'settings' in interests && interests.settings) {
      setSettings({
        ...settings,
        ...interests.settings
      });
    }
  }, [interests]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      return await apiRequest("/api/recommendations/interests", {
        method: "PATCH",
        data: {
          settings: newSettings
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your recommendation settings have been saved.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: `There was a problem saving your settings: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle settings save
  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  // Handle toggle change
  const handleToggleChange = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  // Handle slider change
  const handleSliderChange = (key: string, value: number[]) => {
    setSettings({
      ...settings,
      [key]: value[0]
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recommendation Settings</CardTitle>
          <CardDescription>
            Customize how your bill recommendations are delivered and filtered.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recommendation Settings</CardTitle>
        <CardDescription>
          Customize how your bill recommendations are delivered and filtered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-new">Notification Preferences</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when new recommendations are available
              </p>
            </div>
            <Switch
              id="notify-new"
              checked={settings.notifyNewRecommendations}
              onCheckedChange={(checked) => 
                handleToggleChange('notifyNewRecommendations', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emerging-bills">Emerging Bills</Label>
              <p className="text-sm text-muted-foreground">
                Include newly introduced bills in recommendations
              </p>
            </div>
            <Switch
              id="emerging-bills"
              checked={settings.includeEmergingBills}
              onCheckedChange={(checked) => 
                handleToggleChange('includeEmergingBills', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="controversial-bills">Controversial Bills</Label>
              <p className="text-sm text-muted-foreground">
                Include politically divisive legislation in recommendations
              </p>
            </div>
            <Switch
              id="controversial-bills"
              checked={settings.includeControversialBills}
              onCheckedChange={(checked) => 
                handleToggleChange('includeControversialBills', checked)
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Recommendation Frequency</Label>
            <p className="text-sm text-muted-foreground mb-6">
              How often should we refresh your bill recommendations?
            </p>
            <div className="px-2">
              <Slider
                defaultValue={[settings.recommendationFrequency]}
                max={14}
                min={1}
                step={1}
                onValueChange={(value) => 
                  handleSliderChange('recommendationFrequency', value)
                }
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Daily</span>
                <span>Weekly</span>
                <span>Bi-weekly</span>
              </div>
            </div>
            <p className="text-sm text-center mt-4">
              Current setting: <span className="font-medium">{settings.recommendationFrequency === 1 ? 'Daily' : 
                settings.recommendationFrequency === 7 ? 'Weekly' : 
                `Every ${settings.recommendationFrequency} days`}</span>
            </p>
          </div>

          <div className="mt-6">
            <Label>Maximum Recommendations</Label>
            <p className="text-sm text-muted-foreground mb-6">
              How many bill recommendations would you like to receive each week?
            </p>
            <div className="px-2">
              <Slider
                defaultValue={[settings.maxRecommendationsPerWeek]}
                max={30}
                min={5}
                step={5}
                onValueChange={(value) => 
                  handleSliderChange('maxRecommendationsPerWeek', value)
                }
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span>25</span>
                <span>30</span>
              </div>
            </div>
            <p className="text-sm text-center mt-4">
              Current setting: <span className="font-medium">{settings.maxRecommendationsPerWeek} recommendations per week</span>
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}