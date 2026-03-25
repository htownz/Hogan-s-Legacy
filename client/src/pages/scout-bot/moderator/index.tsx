import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckIcon, 
  XIcon, 
  ShieldIcon, 
  ExternalLinkIcon,
  SearchIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowUpCircleIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

// Types
interface ScoutBotProfile {
  id: string;
  name: string;
  type: 'consultant' | 'mega_influencer';
  summary: string;
  source_urls: string[];
  influence_topics: string[];
  status: 'pending' | 'approved' | 'rejected';
  transparency_score?: number;
  firm?: string;
  clients?: string[];
  major_donations?: string[];
  political_connections?: string[];
  ethics_flags?: string[];
  submitted_at: string;
  updated_at: string;
}

interface ModeratorStats {
  pendingProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  totalModerated: number;
  approvalRate: number;
}

export default function ScoutBotModeratorPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ScoutBotProfile | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch profiles
  const { data: pendingProfilesData, isLoading: pendingLoading } = useQuery<{
    profiles: ScoutBotProfile[];
  }>({
    queryKey: ['/api/scout-bot/profiles/pending'],
    enabled: activeTab === "pending",
  });

  const { data: approvedProfilesData, isLoading: approvedLoading } = useQuery<{
    profiles: ScoutBotProfile[];
  }>({
    queryKey: ['/api/scout-bot/profiles/approved'],
    enabled: activeTab === "approved",
  });

  const { data: rejectedProfilesData, isLoading: rejectedLoading } = useQuery<{
    profiles: ScoutBotProfile[];
  }>({
    queryKey: ['/api/scout-bot/profiles/rejected'],
    enabled: activeTab === "rejected",
  });

  // Fetch moderator statistics
  const { data: statsData, isLoading: statsLoading } = useQuery<ModeratorStats>({
    queryKey: ['/api/scout-bot/moderator/stats'],
    enabled: true,
  });

  // Update profiles based on active tab
  const activeProfiles = (() => {
    switch (activeTab) {
      case "pending":
        return pendingProfilesData?.profiles || [];
      case "approved":
        return approvedProfilesData?.profiles || [];
      case "rejected":
        return rejectedProfilesData?.profiles || [];
      default:
        return [];
    }
  })();

  // Filtered profiles based on search term
  const filteredProfiles = searchTerm
    ? activeProfiles.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.influence_topics && p.influence_topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : activeProfiles;

  // Handle profile selection
  const handleProfileSelect = (profile: ScoutBotProfile) => {
    setSelectedProfile(profile);
    setModerationNotes("");
  };

  // Handle profile approval
  const handleApprove = async () => {
    if (!selectedProfile) return;
    
    try {
      await apiRequest('/api/scout-bot/moderator/approve', {
        method: 'POST',
        data: {
          profileId: selectedProfile.id,
          moderationNotes: moderationNotes
        }
      });
      
      toast({
        title: "Profile Approved",
        description: `${selectedProfile.name} has been approved.`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/profiles/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/profiles/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/moderator/stats'] });
      
      setSelectedProfile(null);
      setModerationNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve profile.",
        variant: "destructive",
      });
    }
  };

  // Handle profile rejection
  const handleReject = async () => {
    if (!selectedProfile) return;
    
    try {
      await apiRequest('/api/scout-bot/moderator/reject', {
        method: 'POST',
        data: {
          profileId: selectedProfile.id,
          moderationNotes: moderationNotes
        }
      });
      
      toast({
        title: "Profile Rejected",
        description: `${selectedProfile.name} has been rejected.`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/profiles/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/profiles/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/moderator/stats'] });
      
      setSelectedProfile(null);
      setModerationNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject profile.",
        variant: "destructive",
      });
    }
  };

  // Handle profile publishing
  const handlePublish = async () => {
    if (!selectedProfile) return;
    
    try {
      await apiRequest('/api/scout-bot/moderator/publish', {
        method: 'POST',
        data: {
          profileId: selectedProfile.id
        }
      });
      
      toast({
        title: "Profile Published",
        description: `${selectedProfile.name} has been published to live database.`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/profiles/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/moderator/stats'] });
      
      setSelectedProfile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish profile.",
        variant: "destructive",
      });
    }
  };

  const isLoading = pendingLoading || approvedLoading || rejectedLoading;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scout Bot Moderator</h1>
          <p className="text-gray-500 mt-2">
            Review, approve, reject, and publish political consultant and influencer profiles
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/scout-bot">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "..." : statsData?.pendingProfiles || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "..." : statsData?.approvedProfiles || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "..." : statsData?.rejectedProfiles || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Moderated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "..." : statsData?.totalModerated || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? "..." : `${Math.round((statsData?.approvalRate || 0) * 100)}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left panel - Profile List */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Profile Queue</CardTitle>
              <CardDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    placeholder="Search profiles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <Button variant="ghost" size="icon">
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>

            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className="w-full">
                  <TabsTrigger value="pending" className="flex-1">
                    Pending
                    {!pendingLoading && pendingProfilesData?.profiles?.length ? (
                      <Badge variant="secondary" className="ml-2">
                        {pendingProfilesData.profiles.length}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex-1">
                    Approved
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="flex-1">
                    Rejected
                  </TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="pt-4 pb-0 px-0">
                <div className="h-[60vh] overflow-y-auto">
                  <TabsContent value="pending" className="m-0">
                    {pendingLoading ? (
                      <div className="p-6 text-center">Loading profiles...</div>
                    ) : filteredProfiles.length === 0 ? (
                      <div className="p-6 text-center">No pending profiles found</div>
                    ) : (
                      <Table>
                        <TableBody>
                          {filteredProfiles.map((profile) => (
                            <TableRow 
                              key={profile.id}
                              className={`cursor-pointer hover:bg-slate-50 ${
                                selectedProfile?.id === profile.id ? "bg-slate-100" : ""
                              }`}
                              onClick={() => handleProfileSelect(profile)}
                            >
                              <TableCell>
                                <div className="font-medium">{profile.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {profile.summary.substring(0, 80)}...
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant={profile.type === "consultant" ? "default" : "secondary"} className="text-xs">
                                    {profile.type === "consultant" ? "Consultant" : "Mega Influencer"}
                                  </Badge>
                                  {profile.transparency_score !== undefined && (
                                    <Badge variant={
                                      profile.transparency_score > 75 ? "outline" :
                                      profile.transparency_score > 50 ? "secondary" : "destructive"
                                    } className="text-xs">
                                      Score: {profile.transparency_score}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="approved" className="m-0">
                    {approvedLoading ? (
                      <div className="p-6 text-center">Loading profiles...</div>
                    ) : filteredProfiles.length === 0 ? (
                      <div className="p-6 text-center">No approved profiles found</div>
                    ) : (
                      <Table>
                        <TableBody>
                          {filteredProfiles.map((profile) => (
                            <TableRow 
                              key={profile.id}
                              className={`cursor-pointer hover:bg-slate-50 ${
                                selectedProfile?.id === profile.id ? "bg-slate-100" : ""
                              }`}
                              onClick={() => handleProfileSelect(profile)}
                            >
                              <TableCell>
                                <div className="font-medium">{profile.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {profile.summary.substring(0, 80)}...
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant={profile.type === "consultant" ? "default" : "secondary"} className="text-xs">
                                    {profile.type === "consultant" ? "Consultant" : "Mega Influencer"}
                                  </Badge>
                                  {profile.transparency_score !== undefined && (
                                    <Badge variant={
                                      profile.transparency_score > 75 ? "outline" :
                                      profile.transparency_score > 50 ? "secondary" : "destructive"
                                    } className="text-xs">
                                      Score: {profile.transparency_score}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="rejected" className="m-0">
                    {rejectedLoading ? (
                      <div className="p-6 text-center">Loading profiles...</div>
                    ) : filteredProfiles.length === 0 ? (
                      <div className="p-6 text-center">No rejected profiles found</div>
                    ) : (
                      <Table>
                        <TableBody>
                          {filteredProfiles.map((profile) => (
                            <TableRow 
                              key={profile.id}
                              className={`cursor-pointer hover:bg-slate-50 ${
                                selectedProfile?.id === profile.id ? "bg-slate-100" : ""
                              }`}
                              onClick={() => handleProfileSelect(profile)}
                            >
                              <TableCell>
                                <div className="font-medium">{profile.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {profile.summary.substring(0, 80)}...
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant={profile.type === "consultant" ? "default" : "secondary"} className="text-xs">
                                    {profile.type === "consultant" ? "Consultant" : "Mega Influencer"}
                                  </Badge>
                                  {profile.transparency_score !== undefined && (
                                    <Badge variant={
                                      profile.transparency_score > 75 ? "outline" :
                                      profile.transparency_score > 50 ? "secondary" : "destructive"
                                    } className="text-xs">
                                      Score: {profile.transparency_score}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </div>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right panel - Profile Details & Actions */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            {!selectedProfile ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <ShieldIcon className="h-16 w-16 mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a profile to moderate</h3>
                <p className="text-center max-w-md">
                  Click on a profile from the list to review its details and take moderation actions
                </p>
              </div>
            ) : (
              <>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{selectedProfile.name}</CardTitle>
                      <CardDescription>
                        <Badge variant={selectedProfile.type === "consultant" ? "default" : "secondary"} className="mt-1">
                          {selectedProfile.type === "consultant" ? "Political Consultant" : "Mega Influencer"}
                        </Badge>
                        {selectedProfile.transparency_score !== undefined && (
                          <Badge variant={
                            selectedProfile.transparency_score > 75 ? "outline" :
                            selectedProfile.transparency_score > 50 ? "secondary" : "destructive"
                          } className="ml-2">
                            Transparency Score: {selectedProfile.transparency_score}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        selectedProfile.status === "approved" ? "success" :
                        selectedProfile.status === "rejected" ? "destructive" : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {selectedProfile.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    {/* Summary */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">SUMMARY</h3>
                      <p className="text-sm">{selectedProfile.summary}</p>
                    </div>

                    {/* Source URLs */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">SOURCE URLS</h3>
                      <ul className="text-sm space-y-1">
                        {selectedProfile.source_urls.map((url, index) => (
                          <li key={index} className="flex items-center">
                            <ExternalLinkIcon className="h-3 w-3 mr-2 flex-shrink-0" />
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Influence Topics */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">INFLUENCE TOPICS</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedProfile.influence_topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Consultant-specific fields */}
                    {selectedProfile.type === "consultant" && selectedProfile.firm && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">FIRM</h3>
                        <p className="text-sm">{selectedProfile.firm}</p>
                      </div>
                    )}

                    {selectedProfile.type === "consultant" && selectedProfile.clients && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">CLIENTS</h3>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {selectedProfile.clients.map((client, index) => (
                            <li key={index}>{client}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mega Influencer-specific fields */}
                    {selectedProfile.type === "mega_influencer" && selectedProfile.major_donations && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">MAJOR DONATIONS</h3>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {selectedProfile.major_donations.map((donation, index) => (
                            <li key={index}>{donation}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedProfile.type === "mega_influencer" && selectedProfile.political_connections && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">POLITICAL CONNECTIONS</h3>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {selectedProfile.political_connections.map((connection, index) => (
                            <li key={index}>{connection}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ethics Flags - for both types */}
                    {selectedProfile.ethics_flags && selectedProfile.ethics_flags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-red-500 mb-2">ETHICS FLAGS</h3>
                        <ul className="text-sm list-disc pl-5 space-y-1 text-red-600">
                          {selectedProfile.ethics_flags.map((flag, index) => (
                            <li key={index}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Submitted: {new Date(selectedProfile.submitted_at).toLocaleString()}</span>
                      <span>Updated: {new Date(selectedProfile.updated_at).toLocaleString()}</span>
                    </div>

                    {/* Moderation notes - Only for pending profiles */}
                    {selectedProfile.status === "pending" && (
                      <div className="pt-4">
                        <Label htmlFor="moderationNotes">Moderation Notes:</Label>
                        <Textarea
                          id="moderationNotes"
                          placeholder="Add your notes about this profile..."
                          value={moderationNotes}
                          onChange={(e) => setModerationNotes(e.target.value)}
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3 border-t pt-4">
                  {selectedProfile.status === "pending" ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={handleReject}
                        className="gap-1"
                      >
                        <ThumbsDownIcon className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        onClick={handleApprove}
                        className="gap-1"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </Button>
                    </>
                  ) : selectedProfile.status === "approved" ? (
                    <Button 
                      onClick={handlePublish}
                      className="gap-1"
                    >
                      <ArrowUpCircleIcon className="h-4 w-4" />
                      Publish to Live DB
                    </Button>
                  ) : null}
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}