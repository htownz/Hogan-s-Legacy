import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ChevronLeftIcon,
  BuildingIcon,
  DollarSignIcon,
  UserIcon,
  FileTextIcon,
  ExternalLinkIcon,
  FlagIcon,
  TargetIcon,
  ClipboardCheckIcon,
  CircleAlertIcon,
  CalendarIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Import the types we defined in the index.tsx file
type CharacterProfile = {
  id: string;
  name: string;
  type: "consultant" | "influencer" | "strategist" | "corporate";
  photo_url?: string;
  known_aliases?: string[];
  associated_firms?: {
    name: string;
    role: string;
    years_active: string;
  }[];
  known_clients_or_affiliations?: {
    entity_name: string;
    type: string;
    timeframe: string;
    notes?: string;
  }[];
  donations?: {
    total_amount: number;
    top_recipients: {
      legislator_name: string;
      amount: number;
      date: string;
      district: string;
    }[];
  };
  influence_map?: {
    key_issues: string[];
    committee_targets: string[];
    linked_legislation: {
      bill_id: string;
      bill_title: string;
      action: "support" | "oppose" | "neutral";
      year: number;
    }[];
  };
  public_statements_or_quotes?: {
    source: string;
    quote: string;
    date: string;
  }[];
  media_mentions?: {
    source: string;
    headline: string;
    date: string;
    url: string;
  }[];
  transparency_score?: number;
  flag_count?: number;
  last_updated: string;
};

// Flags information (in a real app, this would come from the API)
type Flag = {
  id: string;
  type: string;
  description: string;
  severity: number;
  date: string;
  status: "active" | "reviewed" | "resolved";
};

// Mock data for our detailed view
const mockCharacterProfiles: Record<string, CharacterProfile> = {
  "82e6f3c1-112a-4d80-a4e2-cb0eab88acdf": {
    id: "82e6f3c1-112a-4d80-a4e2-cb0eab88acdf",
    name: "Alan Blackmore",
    type: "consultant",
    photo_url: "https://example.com/blackmore.jpg",
    known_aliases: ["A. Blackmore", "Alan B"],
    associated_firms: [
      {
        name: "Blackmore Strategies",
        role: "founder",
        years_active: "2008–present"
      }
    ],
    known_clients_or_affiliations: [
      {
        entity_name: "Texans for Business Growth PAC",
        type: "PAC",
        timeframe: "2015–2024",
        notes: "Handled campaign strategy, ad placement, and opposition research."
      },
      {
        entity_name: "Rep. Laura Martinez (HD-115)",
        type: "Campaign",
        timeframe: "2020–2022",
        notes: "Senior consultant during re-election campaign."
      }
    ],
    donations: {
      total_amount: 124000,
      top_recipients: [
        {
          legislator_name: "Laura Martinez",
          amount: 25000,
          date: "2022-10-14",
          district: "HD-115"
        },
        {
          legislator_name: "Mark Ellison",
          amount: 12000,
          date: "2023-03-21",
          district: "HD-47"
        }
      ]
    },
    influence_map: {
      key_issues: ["economic development", "campaign finance reform"],
      committee_targets: ["House Elections", "Senate Business & Commerce"],
      linked_legislation: [
        {
          bill_id: "HB2134",
          bill_title: "Disclosure of Political Consulting Relationships",
          action: "oppose",
          year: 2023
        }
      ]
    },
    public_statements_or_quotes: [
      {
        source: "Capitol Insider Interview",
        quote: "Transparency should never get in the way of strategy.",
        date: "2021-07-09"
      }
    ],
    media_mentions: [
      {
        source: "Texas Tribune",
        headline: "Alan Blackmore's Shadow Network",
        date: "2022-04-11",
        url: "https://www.texastribune.org/articles/blackmore-shadow"
      }
    ],
    transparency_score: 45,
    flag_count: 3,
    last_updated: "2025-04-06T13:00:00Z"
  },
  "f2e1497b-553c-44d2-bbd0-349ef23d6b94": {
    id: "f2e1497b-553c-44d2-bbd0-349ef23d6b94",
    name: "Tillman Fertitta",
    type: "influencer",
    photo_url: "https://example.com/fertitta.jpg",
    known_aliases: ["King of Hospitality"],
    associated_firms: [
      {
        name: "Landry's Inc.",
        role: "CEO",
        years_active: "1986–present"
      },
      {
        name: "Fertitta Entertainment",
        role: "Chairman",
        years_active: "2005–present"
      }
    ],
    known_clients_or_affiliations: [
      {
        entity_name: "Fertitta PAC",
        type: "PAC",
        timeframe: "2018–2025",
        notes: "Main political vehicle for strategic donations."
      }
    ],
    donations: {
      total_amount: 875000,
      top_recipients: [
        {
          legislator_name: "Sen. Charles Young",
          amount: 100000,
          date: "2024-05-02",
          district: "SD-7"
        },
        {
          legislator_name: "Gov. Taylor Quinn",
          amount: 150000,
          date: "2023-11-17",
          district: "TX"
        }
      ]
    },
    influence_map: {
      key_issues: ["casino legalization", "real estate incentives", "hospitality industry tax breaks"],
      committee_targets: ["Senate State Affairs", "House Ways & Means"],
      linked_legislation: [
        {
          bill_id: "SB1220",
          bill_title: "Casino Legalization Act",
          action: "support",
          year: 2023
        }
      ]
    },
    public_statements_or_quotes: [
      {
        source: "Forbes",
        quote: "Every law impacts business. If you're not influencing, you're being influenced.",
        date: "2023-10-03"
      }
    ],
    media_mentions: [
      {
        source: "Houston Chronicle",
        headline: "Fertitta's Political Machine: How Money Talks in Austin",
        date: "2023-12-15",
        url: "https://www.houstonchronicle.com/news/fertitta-pac"
      }
    ],
    transparency_score: 35,
    flag_count: 5,
    last_updated: "2025-04-06T13:05:00Z"
  }
};

// Mock flags data (in a real app, this would come from the API)
const mockFlags: Record<string, Flag[]> = {
  "82e6f3c1-112a-4d80-a4e2-cb0eab88acdf": [
    {
      id: "1",
      type: "late_filing",
      description: "Filed Q2 2023 lobbying report 45 days after deadline",
      severity: 3,
      date: "2023-08-15",
      status: "active"
    },
    {
      id: "2",
      type: "correction",
      description: "Amended campaign donation report for Martinez campaign",
      severity: 2,
      date: "2022-11-30",
      status: "reviewed"
    },
    {
      id: "3",
      type: "multi_dataset_match",
      description: "Name appears as both PAC consultant and bill testimony presenter on same day",
      severity: 4,
      date: "2023-03-15",
      status: "active"
    }
  ],
  "f2e1497b-553c-44d2-bbd0-349ef23d6b94": [
    {
      id: "4",
      type: "conflict_of_interest",
      description: "Donated to legislator who sponsored bill benefiting his business interests",
      severity: 5,
      date: "2023-02-10",
      status: "active"
    },
    {
      id: "5",
      type: "pac_firm_connection",
      description: "Connected to both Fertitta PAC and lobbying firm representing gaming interests",
      severity: 3,
      date: "2023-06-22",
      status: "active"
    },
    {
      id: "6",
      type: "family_connection",
      description: "Spouse appointed to state gaming commission",
      severity: 4,
      date: "2022-09-05",
      status: "active"
    },
    {
      id: "7",
      type: "late_filing",
      description: "Filed late contribution report 35 days after deadline",
      severity: 3,
      date: "2024-01-15",
      status: "reviewed"
    },
    {
      id: "8",
      type: "correction",
      description: "Corrected PAC expenditure report after audit",
      severity: 2,
      date: "2023-11-12",
      status: "resolved"
    }
  ]
};

// Function to calculate transparency color based on score
const getTransparencyColor = (score?: number) => {
  if (!score) return "bg-gray-500";
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

// Function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

// Function to get flag severity label and color
const getFlagSeverity = (severity: number) => {
  switch (severity) {
    case 1:
      return { label: "Low", color: "bg-blue-500" };
    case 2:
      return { label: "Moderate", color: "bg-yellow-500" };
    case 3:
      return { label: "Significant", color: "bg-orange-500" };
    case 4:
      return { label: "High", color: "bg-red-500" };
    case 5:
      return { label: "Critical", color: "bg-purple-700" };
    default:
      return { label: "Unknown", color: "bg-gray-500" };
  }
};

// Function to get flag type readable name
const getFlagTypeName = (type: string) => {
  const types: Record<string, string> = {
    late_filing: "Late Filing",
    correction: "Record Correction",
    conflict_of_interest: "Conflict of Interest",
    multi_dataset_match: "Multiple Dataset Match",
    family_connection: "Family Connection",
    pac_firm_connection: "PAC & Firm Connection"
  };
  return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function CharacterProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  
  // In a real app, we would fetch this data from the API
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: [`/api/scout-bot/character-profiles/${params.id}`],
    queryFn: async () => {
      // Simulate API call
      return new Promise<CharacterProfile | undefined>((resolve) => {
        setTimeout(() => resolve(mockCharacterProfiles[params.id]), 1000);
      });
    }
  });
  
  // In a real app, we would fetch this data from the API
  const { data: flags } = useQuery<any>({
    queryKey: [`/api/scout-bot/character-profiles/${params.id}/flags`],
    queryFn: async () => {
      // Simulate API call
      return new Promise<Flag[]>((resolve) => {
        setTimeout(() => resolve(mockFlags[params.id] || []), 800);
      });
    },
    enabled: !!profile
  });
  
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/scout-bot/character-profiles">
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-60" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/scout-bot/character-profiles">
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Profile Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CircleAlertIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h2 className="text-xl font-medium mb-2">Profile Not Found</h2>
              <p className="text-gray-500 mb-6">The character profile you're looking for doesn't exist or has been removed.</p>
              <Button asChild>
                <Link href="/scout-bot/character-profiles">Back to Profiles</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/scout-bot/character-profiles">
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <Badge variant={profile.type === 'consultant' ? 'default' : 'secondary'}>
          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}
        </Badge>
        {profile.flag_count && profile.flag_count > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <FlagIcon size={12} />
            {profile.flag_count} Flag{profile.flag_count !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Summary */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border">
                  {profile.photo_url ? (
                    <AvatarImage src={profile.photo_url} alt={profile.name} />
                  ) : (
                    <AvatarFallback>
                      {profile.name.split(' ').map((n: any) => n[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                {profile.transparency_score !== undefined && (
                  <div className="flex flex-col items-center">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-bold ${getTransparencyColor(profile.transparency_score)}`}>
                      {profile.transparency_score}
                    </div>
                    <span className="text-xs mt-1">Transparency</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.known_aliases && profile.known_aliases.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Also Known As</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.known_aliases.map((alias: any, index: any) => (
                        <Badge key={index} variant="outline">{alias}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.associated_firms && profile.associated_firms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Primary Affiliations</h3>
                    <div className="space-y-2 mt-1">
                      {profile.associated_firms.map((firm: any, index: any) => (
                        <div key={index} className="flex items-center gap-2">
                          <BuildingIcon size={16} className="text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{firm.name}</div>
                            <div className="text-sm text-gray-500">{firm.role}, {firm.years_active}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.influence_map?.key_issues && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Key Issue Areas</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.influence_map.key_issues.map((issue: any, index: any) => (
                        <Badge key={index} variant="outline">{issue}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.influence_map?.committee_targets && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Committee Targets</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.influence_map.committee_targets.map((committee: any, index: any) => (
                        <Badge key={index} variant="secondary">{committee}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.donations && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Political Donations</h3>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {formatCurrency(profile.donations.total_amount)}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <div className="text-sm mt-1 flex items-center gap-1">
                    <CalendarIcon size={14} className="text-gray-400" />
                    {new Date(profile.last_updated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Detailed Information */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="affiliations">Connections</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="flags" className="relative">
                    Flags
                    {profile.flag_count && profile.flag_count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {profile.flag_count}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-6">
                  {/* Key Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Influence Score</h3>
                            <div className="text-2xl font-bold">{70 - (profile.transparency_score || 0)}</div>
                          </div>
                          <TargetIcon size={28} className="text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Total Donations</h3>
                            <div className="text-2xl font-bold">{profile.donations ? formatCurrency(profile.donations.total_amount) : "$0"}</div>
                          </div>
                          <DollarSignIcon size={28} className="text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Bills Influenced</h3>
                            <div className="text-2xl font-bold">{profile.influence_map?.linked_legislation?.length || 0}</div>
                          </div>
                          <ClipboardCheckIcon size={28} className="text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Profile Summary */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Profile Summary</h3>
                    <p className="text-gray-600">
                      {profile.type === "consultant" ? (
                        `${profile.name} is a political consultant who has worked with various campaigns and PACs in Texas. 
                        With strong connections to ${profile.known_clients_or_affiliations?.[0]?.entity_name || "multiple organizations"}, 
                        ${profile.gender === "female" ? "she" : "he"} has become influential in ${profile.influence_map?.key_issues?.join(", ") || "multiple policy areas"}.`
                      ) : profile.type === "influencer" ? (
                        `${profile.name} is a prominent business influencer with significant political connections. 
                        As the ${profile.associated_firms?.[0]?.role || "leader"} of ${profile.associated_firms?.[0]?.name || "multiple organizations"}, 
                        ${profile.gender === "female" ? "she" : "he"} has leveraged ${profile.gender === "female" ? "her" : "his"} position to shape policy around ${profile.influence_map?.key_issues?.join(", ") || "various issues"}.`
                      ) : (
                        `${profile.name} has established ${profile.gender === "female" ? "herself" : "himself"} as a key player in Texas politics, 
                        with connections to ${profile.known_clients_or_affiliations?.length || 0} organizations and significant influence in 
                        ${profile.influence_map?.committee_targets?.join(", ") || "various committees"}.`
                      )}
                    </p>
                  </div>
                  
                  {/* Notable Quotes */}
                  {profile.public_statements_or_quotes && profile.public_statements_or_quotes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Notable Quotes</h3>
                      <div className="space-y-3">
                        {profile.public_statements_or_quotes.map((quote: any, index: any) => (
                          <div key={index} className="border-l-4 border-primary pl-3 py-1">
                            <div className="italic">{quote.quote}</div>
                            <div className="text-sm text-gray-500 mt-1">{quote.source}, {new Date(quote.date).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Media Coverage */}
                  {profile.media_mentions && profile.media_mentions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Recent Media Coverage</h3>
                      <div className="space-y-3">
                        {profile.media_mentions.map((mention: any, index: any) => (
                          <div key={index} className="flex items-start gap-2">
                            <FileTextIcon size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <a href={mention.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline flex items-center gap-1">
                                {mention.headline}
                                <ExternalLinkIcon size={14} />
                              </a>
                              <div className="text-sm text-gray-500">{mention.source}, {new Date(mention.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="affiliations" className="mt-0">
                <div className="space-y-6">
                  {/* Firms & Organizations */}
                  {profile.associated_firms && profile.associated_firms.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Firms & Organizations</h3>
                      <div className="space-y-4">
                        {profile.associated_firms.map((firm: any, index: any) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <BuildingIcon size={20} className="text-primary mt-1 flex-shrink-0" />
                                <div>
                                  <h4 className="font-medium">{firm.name}</h4>
                                  <div className="text-sm text-gray-500">{firm.role}</div>
                                  <div className="text-sm mt-1">Active: {firm.years_active}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Clients & Affiliations */}
                  {profile.known_clients_or_affiliations && profile.known_clients_or_affiliations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Clients & Affiliations</h3>
                      <div className="space-y-4">
                        {profile.known_clients_or_affiliations.map((client: any, index: any) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <UserIcon size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{client.entity_name}</h4>
                                    <Badge variant="outline" className="text-xs">{client.type}</Badge>
                                  </div>
                                  <div className="text-sm text-gray-500">Timeframe: {client.timeframe}</div>
                                  {client.notes && <div className="text-sm mt-1">{client.notes}</div>}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Donation Recipients */}
                  {profile.donations?.top_recipients && profile.donations.top_recipients.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Top Donation Recipients</h3>
                      <div className="space-y-4">
                        {profile.donations.top_recipients.map((recipient: any, index: any) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <DollarSignIcon size={20} className="text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                  <h4 className="font-medium">{recipient.legislator_name}</h4>
                                  <div className="text-sm text-gray-500">{recipient.district}</div>
                                  <div className="text-sm mt-1">
                                    <span className="font-medium">{formatCurrency(recipient.amount)}</span> on {new Date(recipient.date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-0">
                <div className="space-y-6">
                  {/* Legislation Involvement */}
                  {profile.influence_map?.linked_legislation && profile.influence_map.linked_legislation.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Legislation Involvement</h3>
                      <div className="space-y-4">
                        {profile.influence_map.linked_legislation.map((legislation: any, index: any) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <ClipboardCheckIcon size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{legislation.bill_id}</h4>
                                      <Badge className={
                                        legislation.action === 'support' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                                        legislation.action === 'oppose' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 
                                        'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                      }>
                                        {legislation.action}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-500">{legislation.year}</div>
                                  </div>
                                  <div className="text-sm mt-1">{legislation.bill_title}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Committee Focus */}
                  {profile.influence_map?.committee_targets && profile.influence_map.committee_targets.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Committee Focus</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.influence_map.committee_targets.map((committee: any, index: any) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2">
                                <TargetIcon size={18} className="text-primary" />
                                <div className="font-medium">{committee}</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="flags" className="mt-0">
                {flags && flags.length > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Transparency Flags</h3>
                      <p className="text-sm text-gray-500 mb-4">Issues that may indicate conflicts of interest or reporting irregularities</p>
                      
                      <div className="space-y-4">
                        {flags.map((flag: any) => {
                          const severity = getFlagSeverity(flag.severity);
                          return (
                            <Card key={flag.id} className="border-l-4" style={{ borderLeftColor: severity.color.replace('bg-', '') }}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <FlagIcon size={20} className="text-red-500 mt-1 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium">{getFlagTypeName(flag.type)}</div>
                                      <Badge className={`${severity.color} text-white`}>
                                        {severity.label}
                                      </Badge>
                                    </div>
                                    <div className="text-sm mt-1">{flag.description}</div>
                                    <div className="flex justify-between items-center mt-2">
                                      <div className="text-xs text-gray-500">Detected: {new Date(flag.date).toLocaleDateString()}</div>
                                      <Badge variant={flag.status === "active" ? "outline" : flag.status === "reviewed" ? "secondary" : "default"}>
                                        {flag.status.charAt(0).toUpperCase() + flag.status.slice(1)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Transparency Metrics</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="text-sm font-medium">Filing Compliance</div>
                            <div className="text-sm text-gray-500">60%</div>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="text-sm font-medium">Disclosure Completeness</div>
                            <div className="text-sm text-gray-500">45%</div>
                          </div>
                          <Progress value={45} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="text-sm font-medium">Consistency Across Sources</div>
                            <div className="text-sm text-gray-500">30%</div>
                          </div>
                          <Progress value={30} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Transparency Flags</h3>
                    <p className="text-gray-500">This profile has no known transparency or ethics issues flagged in our system.</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// CheckIcon component (used in the "no flags" view)
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}