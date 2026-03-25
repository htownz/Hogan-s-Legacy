import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Bell, 
  MapPin, 
  Settings, 
  Save,
  Eye,
  EyeOff,
  Users,
  Gavel,
  Shield,
  Heart,
  Target,
  Zap,
  Calendar,
  Mail,
  Phone,
  Home,
  Palette,
  Monitor
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserPreferences {
  profile: {
    name: string;
    email: string;
    district: string;
    phone?: string;
    address?: string;
  };
  notifications: {
    billAlerts: boolean;
    votingReminders: boolean;
    committeeMeetings: boolean;
    ethicsUpdates: boolean;
    weeklyDigest: boolean;
    emailFrequency: string;
  };
  interests: string[];
  tracking: {
    representatives: string[];
    committees: string[];
    billTopics: string[];
  };
  privacy: {
    profileVisibility: string;
    shareVotingHistory: boolean;
    allowDataAnalytics: boolean;
  };
  display: {
    theme: string;
    compactMode: boolean;
    showAdvancedFeatures: boolean;
  };
}

export default function UserCustomizationDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Load user preferences
  const { data: userPrefs, isLoading } = useQuery<any>({
    queryKey: ["/api/user/preferences"],
    initialData: {
      profile: {
        name: "Texas Citizen",
        email: "citizen@example.com",
        district: "District 15",
        phone: "",
        address: ""
      },
      notifications: {
        billAlerts: true,
        votingReminders: true,
        committeeMeetings: false,
        ethicsUpdates: true,
        weeklyDigest: true,
        emailFrequency: "daily"
      },
      interests: ["Education Policy", "Healthcare", "Transportation"],
      tracking: {
        representatives: ["rep_1", "rep_2"],
        committees: ["education", "health"],
        billTopics: ["education", "healthcare", "transportation"]
      },
      privacy: {
        profileVisibility: "private",
        shareVotingHistory: false,
        allowDataAnalytics: true
      },
      display: {
        theme: "dark",
        compactMode: false,
        showAdvancedFeatures: true
      }
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences>(userPrefs);

  // Save preferences mutation
  const savePreferences = useMutation({
    mutationFn: (prefs: UserPreferences) => apiRequest("/api/user/preferences", "PUT", prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
    },
  });

  const updatePreference = (section: keyof UserPreferences, field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const civicInterests = [
    "Education Policy", "Healthcare", "Transportation", "Environment", 
    "Criminal Justice", "Economic Development", "Housing", "Immigration",
    "Technology", "Agriculture", "Energy", "Civil Rights", "Budget & Taxes",
    "Government Reform", "Veterans Affairs", "Social Services"
  ];

  const representatives = [
    { id: "rep_1", name: "Rep. John Smith", district: "District 15", party: "Republican" },
    { id: "rep_2", name: "Sen. Jane Doe", district: "District 7", party: "Democrat" },
    { id: "rep_3", name: "Rep. Maria Garcia", district: "District 25", party: "Republican" }
  ];

  const committees = [
    { id: "education", name: "Public Education Committee", chamber: "House" },
    { id: "health", name: "Health & Human Services", chamber: "Senate" },
    { id: "transportation", name: "Transportation Committee", chamber: "House" },
    { id: "judiciary", name: "Judiciary & Civil Jurisprudence", chamber: "House" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading your preferences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Customize Your Civic Experience
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Personalize how you engage with authentic Texas government data and stay informed about issues that matter to you.
          </p>
        </div>

        {/* Customization Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="interests" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Interests
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Display
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      value={preferences.profile.name}
                      onChange={(e) => updatePreference("profile", "name", e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={preferences.profile.email}
                      onChange={(e) => updatePreference("profile", "email", e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-white">Legislative District</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        id="district"
                        value={preferences.profile.district}
                        onChange={(e) => updatePreference("profile", "district", e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white"
                        placeholder="e.g., District 15, Austin"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        id="phone"
                        value={preferences.profile.phone}
                        onChange={(e) => updatePreference("profile", "phone", e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white"
                        placeholder="(512) 555-0123"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Address (Optional)</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      id="address"
                      value={preferences.profile.address}
                      onChange={(e) => updatePreference("profile", "address", e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white"
                      placeholder="Your address for local bill impact analysis"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="space-y-1">
                      <div className="text-white font-medium">Smart Bill Alerts</div>
                      <div className="text-blue-200 text-sm">Get notified about bills matching your interests</div>
                    </div>
                    <Switch
                      checked={preferences.notifications.billAlerts}
                      onCheckedChange={(checked) => updatePreference("notifications", "billAlerts", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="space-y-1">
                      <div className="text-white font-medium">Voting Reminders</div>
                      <div className="text-blue-200 text-sm">Reminders about upcoming votes on bills you track</div>
                    </div>
                    <Switch
                      checked={preferences.notifications.votingReminders}
                      onCheckedChange={(checked) => updatePreference("notifications", "votingReminders", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="space-y-1">
                      <div className="text-white font-medium">Committee Meetings</div>
                      <div className="text-blue-200 text-sm">Alerts about committee hearings on your topics</div>
                    </div>
                    <Switch
                      checked={preferences.notifications.committeeMeetings}
                      onCheckedChange={(checked) => updatePreference("notifications", "committeeMeetings", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="space-y-1">
                      <div className="text-white font-medium">Ethics Updates</div>
                      <div className="text-blue-200 text-sm">Campaign finance and lobbying activity alerts</div>
                    </div>
                    <Switch
                      checked={preferences.notifications.ethicsUpdates}
                      onCheckedChange={(checked) => updatePreference("notifications", "ethicsUpdates", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="space-y-1">
                      <div className="text-white font-medium">Weekly Digest</div>
                      <div className="text-blue-200 text-sm">Summary of legislative activity and your interests</div>
                    </div>
                    <Switch
                      checked={preferences.notifications.weeklyDigest}
                      onCheckedChange={(checked) => updatePreference("notifications", "weeklyDigest", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Email Frequency</Label>
                  <Select
                    value={preferences.notifications.emailFrequency}
                    onValueChange={(value) => updatePreference("notifications", "emailFrequency", value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interests Tab */}
          <TabsContent value="interests">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Civic Interests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-blue-200">
                  Select the policy areas you care about to receive personalized bill alerts and legislative updates.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {civicInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={preferences.interests.includes(interest) ? "default" : "secondary"}
                      className={`cursor-pointer text-sm py-2 px-3 text-center justify-center transition-all ${
                        preferences.interests.includes(interest)
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 text-blue-200 hover:bg-white/20"
                      }`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Selected Interests ({preferences.interests.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferences.interests.map((interest) => (
                      <Badge key={interest} className="bg-blue-600 text-white">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Legislative Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Representatives */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Track Representatives
                  </h3>
                  <div className="space-y-3">
                    {representatives.map((rep) => (
                      <div key={rep.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{rep.name}</div>
                          <div className="text-blue-200 text-sm">{rep.district} • {rep.party}</div>
                        </div>
                        <Switch
                          checked={preferences.tracking.representatives.includes(rep.id)}
                          onCheckedChange={(checked) => {
                            const newReps = checked
                              ? [...preferences.tracking.representatives, rep.id]
                              : preferences.tracking.representatives.filter(id => id !== rep.id);
                            updatePreference("tracking", "representatives", newReps);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Committees */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Gavel className="h-4 w-4" />
                    Track Committees
                  </h3>
                  <div className="space-y-3">
                    {committees.map((committee) => (
                      <div key={committee.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{committee.name}</div>
                          <div className="text-blue-200 text-sm">{committee.chamber}</div>
                        </div>
                        <Switch
                          checked={preferences.tracking.committees.includes(committee.id)}
                          onCheckedChange={(checked) => {
                            const newCommittees = checked
                              ? [...preferences.tracking.committees, committee.id]
                              : preferences.tracking.committees.filter(id => id !== committee.id);
                            updatePreference("tracking", "committees", newCommittees);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Profile Visibility</Label>
                  <Select
                    value={preferences.privacy.profileVisibility}
                    onValueChange={(value) => updatePreference("privacy", "profileVisibility", value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-white font-medium">Share Voting History</div>
                    <div className="text-blue-200 text-sm">Allow others to see your civic engagement activity</div>
                  </div>
                  <Switch
                    checked={preferences.privacy.shareVotingHistory}
                    onCheckedChange={(checked) => updatePreference("privacy", "shareVotingHistory", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-white font-medium">Allow Data Analytics</div>
                    <div className="text-blue-200 text-sm">Help improve Act Up with anonymous usage data</div>
                  </div>
                  <Switch
                    checked={preferences.privacy.allowDataAnalytics}
                    onCheckedChange={(checked) => updatePreference("privacy", "allowDataAnalytics", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Theme</Label>
                  <Select
                    value={preferences.display.theme}
                    onValueChange={(value) => updatePreference("display", "theme", value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-white font-medium">Compact Mode</div>
                    <div className="text-blue-200 text-sm">Show more information in less space</div>
                  </div>
                  <Switch
                    checked={preferences.display.compactMode}
                    onCheckedChange={(checked) => updatePreference("display", "compactMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-white font-medium">Advanced Features</div>
                    <div className="text-blue-200 text-sm">Show advanced analytics and tools</div>
                  </div>
                  <Switch
                    checked={preferences.display.showAdvancedFeatures}
                    onCheckedChange={(checked) => updatePreference("display", "showAdvancedFeatures", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => savePreferences.mutate(preferences)}
            disabled={savePreferences.isPending}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
          >
            <Save className="h-5 w-5 mr-2" />
            {savePreferences.isPending ? "Saving..." : "Save All Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}