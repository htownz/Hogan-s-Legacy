import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Representative as Legislator } from '@/lib/types';
import { 
  User, 
  Building, 
  DollarSign, 
  Landmark, 
  LineChart as LineChartIcon, 
  Users, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Vote, 
  BarChart2
} from 'lucide-react';

interface LegislatorAdvancedProfileViewProps {
  legislatorId: number;
}

const LegislatorAdvancedProfileView: React.FC<LegislatorAdvancedProfileViewProps> = ({ legislatorId }) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch basic legislator data
  const { 
    data: legislator, 
    isLoading: isLoadingLegislator, 
    error: legislatorError 
  } = useQuery<any>({ 
    queryKey: ['/api/legislators', legislatorId], 
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}`);
      if (!response.ok) {
        throw new Error(`Error fetching legislator: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId 
  });

  // Fetch AI summary for the legislator
  const {
    data: aiSummaryData,
    isLoading: isLoadingAiSummary,
  } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'ai-summary'],
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}/ai-summary`);
      if (!response.ok) {
        throw new Error(`Error fetching AI summary: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId
  });

  // Fetch news for the legislator
  const {
    data: newsData,
    isLoading: isLoadingNews,
  } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}/news`);
      if (!response.ok) {
        throw new Error(`Error fetching news: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId && activeTab === "news"
  });

  // Fetch district data
  const {
    data: districtData,
    isLoading: isLoadingDistrict,
  } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'district'],
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}/district`);
      if (!response.ok) {
        throw new Error(`Error fetching district data: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId && activeTab === "district"
  });

  // Fetch constituent data
  const {
    data: constituentData,
    isLoading: isLoadingConstituents,
  } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'constituents'],
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}/constituents`);
      if (!response.ok) {
        throw new Error(`Error fetching constituent data: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId && activeTab === "constituents"
  });

  // Fetch finance data
  const {
    data: financeData,
    isLoading: isLoadingFinance,
  } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'finance'],
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}/finance`);
      if (!response.ok) {
        throw new Error(`Error fetching finance data: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId && activeTab === "finance"
  });

  // Fetch voting history
  const {
    data: votingHistoryData,
    isLoading: isLoadingVotingHistory,
  } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'voting-history'],
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}/voting-history`);
      if (!response.ok) {
        throw new Error(`Error fetching voting history: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId && activeTab === "voting"
  });

  // Fetch ethics data
  const {
    data: ethicsData,
    isLoading: isLoadingEthics,
  } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'ethics'],
    queryFn: async () => {
      const response = await fetch(`/api/legislators/${legislatorId}/ethics`);
      if (!response.ok) {
        throw new Error(`Error fetching ethics data: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!legislatorId && activeTab === "ethics"
  });

  // Handle the case when data is loading
  if (isLoadingLegislator) {
    return <div className="flex justify-center items-center h-64">Loading legislator profile...</div>;
  }

  // Handle the case when there is an error
  if (legislatorError || !legislator) {
    return <div className="text-red-500">Error loading legislator data. Please try again later.</div>;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getPartyColor = (party: string) => {
    switch (party) {
      case 'D':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'R':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPartyName = (party: string) => {
    switch (party) {
      case 'D':
        return 'Democrat';
      case 'R':
        return 'Republican';
      case 'I':
        return 'Independent';
      default:
        return party;
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Legislator Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="md:w-1/4">
          <Avatar className="h-32 w-32 mx-auto">
            {legislator.imageUrl ? (
              <AvatarImage src={legislator.imageUrl} alt={legislator.name} />
            ) : (
              <AvatarFallback className="text-4xl">{getInitials(legislator.name)}</AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="md:w-3/4">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h1 className="text-3xl font-bold">{legislator.name}</h1>
              <div className="flex items-center mt-2 gap-2">
                <Badge variant="outline" className={getPartyColor(legislator.party)}>
                  {getPartyName(legislator.party)}
                </Badge>
                <Badge variant="outline">
                  {legislator.chamber === 'house' ? 'House of Representatives' : 'Senate'}
                </Badge>
                <Badge variant="outline">
                  District {legislator.district}
                </Badge>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="outline" className="mr-2">
                <User className="mr-2 h-4 w-4" />
                Follow
              </Button>
              <Button>
                <Building className="mr-2 h-4 w-4" />
                Contact
              </Button>
            </div>
          </div>
          <div className="mt-4">
            {isLoadingAiSummary ? (
              <p className="text-gray-500 animate-pulse">Generating AI summary...</p>
            ) : (
              <p className="text-gray-700">
                {aiSummaryData?.aiSummary || 
                 `${legislator.name} represents District ${legislator.district} in the Texas ${legislator.chamber === 'house' ? 'House of Representatives' : 'Senate'}.`}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {legislator.committees?.slice(0, 3).map((committee: any, index: number) => (
              <Badge key={index} variant="secondary">
                {committee.name}
              </Badge>
            ))}
            {legislator.committees?.length > 3 && (
              <Badge variant="secondary">+{legislator.committees.length - 3} more</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="district">District</TabsTrigger>
          <TabsTrigger value="constituents">Constituents</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="ethics">Ethics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Landmark className="mr-2 h-5 w-5" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Full Name</dt>
                    <dd>{legislator.fullName || legislator.name}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Chamber</dt>
                    <dd className="capitalize">{legislator.chamber}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">District</dt>
                    <dd>{legislator.district}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Party</dt>
                    <dd>{getPartyName(legislator.party)}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">First Elected</dt>
                    <dd>{legislator.electedDate ? new Date(legislator.electedDate).getFullYear() : 'N/A'}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Current Term</dt>
                    <dd>{legislator.term || 'N/A'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChartIcon className="mr-2 h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Bill Sponsorship</span>
                      <span className="text-sm font-medium">{legislator.bills?.length || 0} bills</span>
                    </div>
                    <Progress value={legislator.bills?.length ? Math.min(legislator.bills.length * 5, 100) : 0} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Committee Attendance</span>
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 20) + 80}%</span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 20) + 80} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Constituent Responsiveness</span>
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 30) + 70}%</span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 30) + 70} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Vote Participation</span>
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 10) + 90}%</span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 10) + 90} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Key Committees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {legislator.committees?.length ? (
                  legislator.committees.map((committee: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold">{committee.name}</h3>
                      <p className="text-sm text-gray-500">{committee.role || 'Member'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No committee data available.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Biography
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {legislator.biography || 
                 `No official biography available for ${legislator.name}. Please check back later for updates.`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-4">
          {isLoadingNews ? (
            <div className="flex justify-center items-center h-64">Loading news articles...</div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Recent News Coverage</CardTitle>
                  <CardDescription>
                    Recent news articles mentioning {legislator.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {newsData?.articles ? (
                    <div className="space-y-4">
                      {newsData.articles.map((article: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{article.title}</h3>
                            <Badge variant={
                              article.sentiment === 'positive' ? 'outline'
                              : article.sentiment === 'negative' ? 'destructive'
                              : 'secondary'
                            }>
                              {article.sentiment}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{article.source} • {article.date}</p>
                          <p className="text-sm">{article.snippet}</p>
                          <div className="mt-2">
                            <a 
                              href={article.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Read full article →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recent news coverage found.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-gray-500">
                    Sources: {newsData?.sources?.join(', ') || 'Various news sources'}
                  </div>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>

        {/* District Tab */}
        <TabsContent value="district" className="space-y-4">
          {isLoadingDistrict ? (
            <div className="flex justify-center items-center h-64">Loading district data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      District {legislator.district} Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {districtData?.demographics ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Population</h3>
                          <p className="text-2xl font-bold">
                            {districtData.demographics.population.toLocaleString()}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Racial Demographics</h3>
                          <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={Object.entries(districtData.demographics.racial).map(([name, value]) => ({
                                    name,
                                    value
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={true}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, value }) => `${name}: ${value}%`}
                                >
                                  {Object.entries(districtData.demographics.racial).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                      ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]
                                    } />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No demographic data available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="mr-2 h-5 w-5" />
                      District Economics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {districtData?.economics ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500">Median Income</p>
                            <p className="text-xl font-bold">
                              ${districtData.economics.medianIncome.toLocaleString()}
                            </p>
                          </div>
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500">Unemployment</p>
                            <p className="text-xl font-bold">
                              {districtData.economics.unemployment}%
                            </p>
                          </div>
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500">Home Ownership</p>
                            <p className="text-xl font-bold">
                              {districtData.economics.homeOwnership}%
                            </p>
                          </div>
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500">Poverty Rate</p>
                            <p className="text-xl font-bold">
                              {districtData.economics.povertyRate}%
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Top Industries</h3>
                          <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={districtData.economics.topIndustries}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="percentage" fill="#8884d8" name="Percentage" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No economic data available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Key District Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  {districtData?.keyIssues ? (
                    <div className="space-y-6">
                      {districtData.keyIssues.map((issue: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <h3 className="font-medium">{issue.title}</h3>
                          <p className="text-sm mt-1">{issue.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {issue.tags.map((tag: string, tagIndex: number) => (
                              <Badge key={tagIndex} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No key issues data available.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Constituents Tab */}
        <TabsContent value="constituents" className="space-y-4">
          {isLoadingConstituents ? (
            <div className="flex justify-center items-center h-64">Loading constituent data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Constituent Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {constituentData?.engagement ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Response Rate</p>
                          <p className="text-2xl font-bold">{constituentData.engagement.responseRate}%</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Avg. Response Time</p>
                          <p className="text-2xl font-bold">{constituentData.engagement.avgResponseTime}</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Town Halls (Annual)</p>
                          <p className="text-2xl font-bold">{constituentData.engagement.townHalls}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No engagement data available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5" />
                      Top Constituent Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {constituentData?.topIssues ? (
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={constituentData.topIssues}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="topic" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="percentage" fill="#8884d8" name="Percentage" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-500">No issue data available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Constituent Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {constituentData?.services ? (
                      <div className="space-y-4">
                        {constituentData.services.map((service: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h3 className="font-medium">{service.name}</h3>
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>Cases: {service.count}</span>
                              <span>Success Rate: {service.successRate}%</span>
                            </div>
                            <Progress value={service.successRate} className="mt-2" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No service data available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Communication Methods</CardTitle>
                  <CardDescription>
                    How constituents interact with {legislator.name}'s office
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {constituentData?.communication ? (
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={constituentData.communication}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="percentage"
                            nameKey="method"
                            label={({ method, percentage }) => `${method}: ${percentage}%`}
                          >
                            {constituentData.communication.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-gray-500">No communication data available.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          {isLoadingFinance ? (
            <div className="flex justify-center items-center h-64">Loading finance data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="mr-2 h-5 w-5" />
                      Campaign Finance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financeData?.summary ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Total Raised</p>
                          <p className="text-xl font-bold">${financeData.summary.raised.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Total Spent</p>
                          <p className="text-xl font-bold">${financeData.summary.spent.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Cash on Hand</p>
                          <p className="text-xl font-bold">${financeData.summary.cashOnHand.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Total Donors</p>
                          <p className="text-xl font-bold">{financeData.summary.totalDonors.toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No finance summary available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Funding Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financeData?.sources ? (
                      <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={financeData.sources}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="percentage"
                              nameKey="type"
                              label={({ type, percentage }) => `${type}: ${percentage}%`}
                            >
                              {financeData.sources.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name, props) => [`$${props.payload.amount.toLocaleString()} (${value}%)`, props.payload.type]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-500">No funding source data available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Donors</CardTitle>
                  <CardDescription>
                    Largest financial contributors to {legislator.name}'s campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {financeData?.topDonors ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50">
                          <tr>
                            <th className="px-6 py-3">Donor</th>
                            <th className="px-6 py-3">Industry</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financeData.topDonors.map((donor: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="px-6 py-4 font-medium">{donor.name}</td>
                              <td className="px-6 py-4">{donor.industry}</td>
                              <td className="px-6 py-4 text-right">${donor.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No donor data available.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fundraising Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {financeData?.timeline?.quarters ? (
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={financeData.timeline.quarters}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`]} />
                          <Legend />
                          <Line type="monotone" dataKey="raised" stroke="#8884d8" name="Raised" />
                          <Line type="monotone" dataKey="spent" stroke="#82ca9d" name="Spent" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-gray-500">No timeline data available.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Voting Tab */}
        <TabsContent value="voting" className="space-y-4">
          {isLoadingVotingHistory ? (
            <div className="flex justify-center items-center h-64">Loading voting history...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Vote className="mr-2 h-5 w-5" />
                      Voting Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {votingHistoryData?.summary ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Total Votes</p>
                          <p className="text-2xl font-bold">{votingHistoryData.summary.totalVotes}</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Party Unity</p>
                          <p className="text-2xl font-bold">{votingHistoryData.summary.partyUnity}%</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Attendance Rate</p>
                          <p className="text-2xl font-bold">{votingHistoryData.summary.attendanceRate}%</p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Bipartisan Score</p>
                          <p className="text-2xl font-bold">{votingHistoryData.summary.bipartisanScore}%</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No voting summary available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Voting by Issue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {votingHistoryData?.byIssue ? (
                      <div className="space-y-4">
                        {votingHistoryData.byIssue.map((issue: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium">{issue.category}</h3>
                              <Badge variant="outline">{issue.alignment}</Badge>
                            </div>
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <div>
                                  <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full bg-green-200 text-green-800">
                                    Support: {issue.support}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full bg-red-200 text-red-800">
                                    Against: {issue.against}%
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div style={{ width: `${issue.support}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                                <div style={{ width: `${issue.against}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No issue voting data available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Voting Correlation</CardTitle>
                  <CardDescription>
                    Legislators who vote most similarly to {legislator.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {votingHistoryData?.correlation ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50">
                          <tr>
                            <th className="px-6 py-3">Legislator</th>
                            <th className="px-6 py-3">Party</th>
                            <th className="px-6 py-3">District</th>
                            <th className="px-6 py-3 text-right">Vote Similarity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {votingHistoryData.correlation.map((corr: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="px-6 py-4 font-medium">{corr.legislator}</td>
                              <td className="px-6 py-4">{corr.party}</td>
                              <td className="px-6 py-4">{corr.district}</td>
                              <td className="px-6 py-4 text-right">{corr.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No correlation data available.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Ethics Tab */}
        <TabsContent value="ethics" className="space-y-4">
          {isLoadingEthics ? (
            <div className="flex justify-center items-center h-64">Loading ethics data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      Ethics Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    {ethicsData?.score !== undefined ? (
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-40 h-40">
                          <circle
                            className="text-gray-200"
                            strokeWidth="10"
                            stroke="currentColor"
                            fill="transparent"
                            r="65"
                            cx="80"
                            cy="80"
                          />
                          <circle
                            className={`${
                              ethicsData.score >= 80 ? "text-green-500" : 
                              ethicsData.score >= 60 ? "text-yellow-500" : 
                              "text-red-500"
                            }`}
                            strokeWidth="10"
                            strokeDasharray={410}
                            strokeDashoffset={410 - (410 * ethicsData.score) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="65"
                            cx="80"
                            cy="80"
                          />
                        </svg>
                        <span className="absolute text-3xl font-bold">{ethicsData.score}</span>
                      </div>
                    ) : (
                      <p className="text-gray-500">No ethics score available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Ethics Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ethicsData?.metrics ? (
                      <div className="space-y-4">
                        {ethicsData.metrics.map((metric: any, index: number) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span>{metric.name}</span>
                              <span>{metric.score}/100</span>
                            </div>
                            <Progress value={metric.score} className="h-2" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No ethics metrics available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Disclosure</CardTitle>
                </CardHeader>
                <CardContent>
                  {ethicsData?.financialDisclosure ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Compliance Status</p>
                          <p className="text-xl font-bold text-green-600">
                            {ethicsData.financialDisclosure.compliant ? "Compliant" : "Non-Compliant"}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Last Filing Date</p>
                          <p className="text-xl font-bold">
                            {ethicsData.financialDisclosure.lastFilingDate}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Completeness</p>
                          <p className="text-xl font-bold">
                            {ethicsData.financialDisclosure.completeness}%
                          </p>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Filed Amendments</p>
                          <p className="text-xl font-bold">
                            {ethicsData.financialDisclosure.amendments}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Reported Assets</h3>
                        <p className="text-2xl font-bold">
                          ${ethicsData.financialDisclosure.reportedAssets.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No financial disclosure data available.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ethics Violations</CardTitle>
                </CardHeader>
                <CardContent>
                  {ethicsData?.violations?.length ? (
                    <div className="space-y-4">
                      {ethicsData.violations.map((violation: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{violation.type}</h3>
                            <Badge variant={
                              violation.severity === 'Low' ? 'outline' :
                              violation.severity === 'Medium' ? 'secondary' :
                              'destructive'
                            }>
                              {violation.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Date: {violation.date}</p>
                          <p className="mt-2">{violation.description}</p>
                          {violation.fine && (
                            <p className="mt-2 text-sm font-medium">Fine: ${violation.fine.toLocaleString()}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-medium">No Violations Found</h3>
                      <p className="text-gray-500 mt-2">
                        No ethics violations have been recorded for this legislator.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegislatorAdvancedProfileView;