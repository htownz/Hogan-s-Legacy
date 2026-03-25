import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ExternalLink, Link as LinkIcon, User } from 'lucide-react';
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  reviewed_by: string | null;
  review_notes: string | null;
}

interface Affiliation {
  id: string;
  profile_id: string;
  organization: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaMention {
  id: string;
  profile_id: string;
  headline: string;
  source: string;
  url: string;
  date: string | null;
  snippet: string | null;
  sentiment: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileDetails {
  profile: ScoutBotProfile;
  affiliations: Affiliation[];
  mediaMentions: MediaMention[];
}

export default function ScoutBotProfilePage() {
  const { id } = useParams();
  
  // Fetch profile details
  const { data, isLoading, error } = useQuery<ProfileDetails>({
    queryKey: ['/api/scout-bot/profiles', id],
    enabled: !!id,
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center mb-8">
          <Link href="/scout-bot">
            <Button variant="outline" size="sm" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Loading profile...</h1>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center mb-8">
          <Link href="/scout-bot">
            <Button variant="outline" size="sm" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile not found</h1>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load profile. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const { profile, affiliations, mediaMentions } = data;
  
  return (
    <div className="container mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center mb-8">
        <Link href="/scout-bot">
          <Button variant="outline" size="sm" className="mr-4 mb-4 md:mb-0">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to List
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <div className="flex flex-wrap items-center mt-2 gap-2">
            <Badge variant={profile.type === "consultant" ? "default" : "secondary"}>
              {profile.type === "consultant" ? "Consultant" : "Mega Influencer"}
            </Badge>
            <Badge variant={
              profile.status === "approved" 
                ? "success" 
                : profile.status === "rejected"
                ? "destructive"
                : "secondary"
            }>
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{profile.summary}</p>
            
            {profile.influence_topics.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Topics of Influence</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.influence_topics.map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {profile.review_notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-semibold mb-1">Review Notes</h3>
                <p className="text-gray-600 text-sm">{profile.review_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Profile Type</h3>
                <p>{profile.type === "consultant" ? "Consultant" : "Mega Influencer"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Status</h3>
                <p>{profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Submission Date</h3>
                <p>{new Date(profile.submitted_at).toLocaleDateString()}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Last Updated</h3>
                <p>{new Date(profile.updated_at).toLocaleDateString()}</p>
              </div>
              
              {profile.reviewed_by && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Reviewed By</h3>
                  <p>{profile.reviewed_by}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for Affiliations & Media Mentions */}
      <Tabs defaultValue="media" className="mb-8">
        <TabsList>
          <TabsTrigger value="media">Media Mentions ({mediaMentions.length})</TabsTrigger>
          <TabsTrigger value="affiliations">Affiliations ({affiliations.length})</TabsTrigger>
          <TabsTrigger value="sources">Source URLs ({profile.source_urls.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Mentions</CardTitle>
              <CardDescription>
                {mediaMentions.length > 0 
                  ? `Showing ${mediaMentions.length} media mentions for ${profile.name}` 
                  : "No media mentions found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mediaMentions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No media mentions available for this profile
                </div>
              ) : (
                <div className="space-y-4">
                  {mediaMentions.map((mention) => (
                    <Card key={mention.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">{mention.headline}</CardTitle>
                        <CardDescription className="flex items-center">
                          <span>{mention.source}</span>
                          {mention.date && (
                            <span className="ml-2 text-xs">
                              • {new Date(mention.date).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        {mention.snippet && <p className="text-sm text-gray-600">{mention.snippet}</p>}
                      </CardContent>
                      <CardFooter className="border-t pt-2 pb-3 flex justify-end">
                        <a 
                          href={mention.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 flex items-center hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> View Source
                        </a>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affiliations">
          <Card>
            <CardHeader>
              <CardTitle>Affiliations</CardTitle>
              <CardDescription>
                {affiliations.length > 0 
                  ? `Showing ${affiliations.length} affiliations for ${profile.name}` 
                  : "No affiliations found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {affiliations.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No affiliations available for this profile
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliations.map((affiliation) => (
                      <TableRow key={affiliation.id}>
                        <TableCell className="font-medium">{affiliation.organization}</TableCell>
                        <TableCell>{affiliation.role}</TableCell>
                        <TableCell>
                          {affiliation.start_date && (
                            <span>
                              {new Date(affiliation.start_date).toLocaleDateString()} 
                              {affiliation.end_date ? ` - ${new Date(affiliation.end_date).toLocaleDateString()}` : ''}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {affiliation.is_current ? (
                            <Badge variant="outline" className="bg-green-50">Current</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50">Past</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Source URLs</CardTitle>
              <CardDescription>
                Original sources used to create this profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {profile.source_urls.map((url, index) => (
                  <li key={index} className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}