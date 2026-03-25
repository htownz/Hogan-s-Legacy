import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Search,
  UserRoundPlus,
  ShieldAlert,
  FileText,
  UserRound,
  Network,
  Users,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Types
interface ScoutBotProfile {
  id: string;
  name: string;
  type: 'consultant' | 'mega_influencer';
  summary: string;
  source_urls: string[];
  status: 'pending' | 'approved' | 'rejected';
  influence_topics: string[];
  submitted_at: string;
  updated_at: string;
}

interface ScoutBotStatistics {
  totalProfiles: number;
  pendingProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  profilesByType: {
    consultant?: number;
    mega_influencer?: number;
  };
}

export default function ScoutBotPage() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch scout bot statistics
  const { data: statsData, isLoading: statsLoading } = useQuery<ScoutBotStatistics>({
    queryKey: ['/api/scout-bot/stats'],
  });

  // Fetch live profiles for display 
  const { data: profilesData, isLoading: profilesLoading } = useQuery<{
    profiles: ScoutBotProfile[];
  }>({
    queryKey: ['/api/scout-bot/profiles/live'],
  });

  // Filter profiles based on search term
  const filteredProfiles = profilesData?.profiles
    ? profilesData.profiles.filter(
        (profile) =>
          profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.influence_topics.some((topic) =>
            topic.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    : [];

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scout Bot Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Texas politics transparency engine
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Link href="/scout-bot/moderator">
            <Button variant="outline" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Moderation Panel
            </Button>
          </Link>
          <Button variant="default" className="gap-2">
            <UserRoundPlus className="h-4 w-4" />
            Add New Profile
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsData?.totalProfiles || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Political influencers in database
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consultants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsData?.profilesByType?.consultant || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Political consultants with client tracking
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mega Influencers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsData?.profilesByType?.mega_influencer || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              High-impact political donors and power players
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsData?.pendingProfiles || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Profiles awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              <span>Character Profiles</span>
            </CardTitle>
            <CardDescription>
              Browse consultants and mega-influencers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Detailed profiles of political consultants and mega-influencers with transparency scores, 
              client lists, and ethics flags.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View Profiles</Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              <span>Influence Network</span>
            </CardTitle>
            <CardDescription>
              Explore political connection graphs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Interactive visualization of connections between consultants, donors, 
              PACs, and elected officials in Texas politics.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Explore Network</Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Ethics Reports</span>
            </CardTitle>
            <CardDescription>
              TEC filings and campaign finance data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Search and browse ethics commission filings, campaign finance reports, and ethics
              violations by consultants and legislators.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View Reports</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Profile Listings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Character Profiles</h2>
          <div className="mt-2 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search profiles by name or topic..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="p-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Profiles</TabsTrigger>
            <TabsTrigger value="consultants">Consultants</TabsTrigger>
            <TabsTrigger value="mega-influencers">Mega Influencers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {profilesLoading ? (
              <div className="text-center py-8">Loading profiles...</div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-8">
                {searchTerm ? "No profiles match your search" : "No profiles available"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Influence Topics</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>
                          <Badge variant={profile.type === "consultant" ? "default" : "secondary"}>
                            {profile.type === "consultant" ? "Consultant" : "Mega Influencer"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {profile.influence_topics.slice(0, 3).map((topic, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                            {profile.influence_topics.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{profile.influence_topics.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {profile.summary.length > 100
                            ? `${profile.summary.substring(0, 100)}...`
                            : profile.summary}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="consultants">
            {profilesLoading ? (
              <div className="text-center py-8">Loading profiles...</div>
            ) : filteredProfiles.filter(p => p.type === 'consultant').length === 0 ? (
              <div className="text-center py-8">
                {searchTerm ? "No consultant profiles match your search" : "No consultant profiles available"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Influence Topics</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles
                      .filter(p => p.type === 'consultant')
                      .map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {profile.influence_topics.slice(0, 3).map((topic, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                              {profile.influence_topics.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{profile.influence_topics.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {profile.summary.length > 100
                              ? `${profile.summary.substring(0, 100)}...`
                              : profile.summary}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mega-influencers">
            {profilesLoading ? (
              <div className="text-center py-8">Loading profiles...</div>
            ) : filteredProfiles.filter(p => p.type === 'mega_influencer').length === 0 ? (
              <div className="text-center py-8">
                {searchTerm ? "No mega influencer profiles match your search" : "No mega influencer profiles available"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Influence Topics</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles
                      .filter(p => p.type === 'mega_influencer')
                      .map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {profile.influence_topics.slice(0, 3).map((topic, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                              {profile.influence_topics.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{profile.influence_topics.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {profile.summary.length > 100
                              ? `${profile.summary.substring(0, 100)}...`
                              : profile.summary}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}