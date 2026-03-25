import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronRightIcon, 
  AlertTriangleIcon, 
  SearchIcon, 
  UserIcon, 
  BuildingIcon, 
  DollarSignIcon, 
  FileTextIcon,
  FlagIcon
} from "lucide-react";

// Character card type based on the sample structure
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

// Mock data for demonstration
const mockCharacterProfiles: CharacterProfile[] = [
  {
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
  {
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
];

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

// Character Profile Card Component
const CharacterProfileCard = ({ profile }: { profile: CharacterProfile }) => {
  return (
    <Card className="w-full mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <Avatar className="h-16 w-16 border">
              {profile.photo_url ? (
                <AvatarImage src={profile.photo_url} alt={profile.name} />
              ) : (
                <AvatarFallback>
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-xl">{profile.name}</CardTitle>
              <div className="flex gap-2 mt-1">
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
            </div>
          </div>
          {profile.transparency_score !== undefined && (
            <div className="flex flex-col items-center">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${getTransparencyColor(profile.transparency_score)}`}>
                {profile.transparency_score}
              </div>
              <span className="text-xs mt-1">Transparency</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Tabs defaultValue="influence">
          <TabsList className="w-full">
            <TabsTrigger value="influence" className="flex-1">Influence</TabsTrigger>
            <TabsTrigger value="affiliations" className="flex-1">Connections</TabsTrigger>
            <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
          </TabsList>
          
          <TabsContent value="influence" className="mt-4">
            {profile.influence_map && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Key Issues</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.influence_map.key_issues.map((issue, i) => (
                      <Badge variant="outline" key={i}>{issue}</Badge>
                    ))}
                  </div>
                </div>
                {profile.donations && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Total Political Donations</h4>
                    <div className="text-lg font-semibold text-primary">
                      {formatCurrency(profile.donations.total_amount)}
                    </div>
                  </div>
                )}
                {profile.influence_map.linked_legislation && profile.influence_map.linked_legislation.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Legislation Activity</h4>
                    <div className="text-sm">
                      {profile.influence_map.linked_legislation.map((leg, i) => (
                        <div key={i} className="mb-1 flex items-center gap-1">
                          <Badge className={leg.action === 'support' ? 'bg-green-100 text-green-800 hover:bg-green-200' : leg.action === 'oppose' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}>
                            {leg.action}
                          </Badge>
                          <span className="font-medium">{leg.bill_id}</span>
                          <span className="truncate">{leg.bill_title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="affiliations" className="mt-4">
            <div className="space-y-3">
              {profile.associated_firms && profile.associated_firms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Affiliated With</h4>
                  <div className="space-y-1">
                    {profile.associated_firms.map((firm, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <BuildingIcon size={16} className="text-gray-500" />
                        <div>
                          <span className="font-medium">{firm.name}</span>
                          <span className="text-sm text-gray-500"> • {firm.role}, {firm.years_active}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.known_clients_or_affiliations && profile.known_clients_or_affiliations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Clients & Affiliations</h4>
                  <div className="space-y-1">
                    {profile.known_clients_or_affiliations.map((client, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{client.type}</Badge>
                          <span className="font-medium">{client.entity_name}</span>
                        </div>
                        <div className="text-gray-500 text-xs ml-10">{client.timeframe} • {client.notes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.donations && profile.donations.top_recipients && profile.donations.top_recipients.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Top Recipients</h4>
                  <div className="space-y-1">
                    {profile.donations.top_recipients.map((recipient, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <DollarSignIcon size={16} className="text-green-500" />
                        <div>
                          <span className="font-medium">{recipient.legislator_name}</span>
                          <span className="text-sm text-gray-500"> • {formatCurrency(recipient.amount)}, {recipient.district}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="media" className="mt-4">
            <div className="space-y-3">
              {profile.public_statements_or_quotes && profile.public_statements_or_quotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Quotes & Statements</h4>
                  <div className="space-y-2">
                    {profile.public_statements_or_quotes.map((quote, i) => (
                      <div key={i} className="border-l-4 border-primary pl-3 py-1">
                        <div className="italic text-sm">"{quote.quote}"</div>
                        <div className="text-xs text-gray-500 mt-1">{quote.source}, {new Date(quote.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.media_mentions && profile.media_mentions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Media Coverage</h4>
                  <div className="space-y-2">
                    {profile.media_mentions.map((mention, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <FileTextIcon size={16} className="text-gray-500" />
                        <div>
                          <a href={mention.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                            {mention.headline}
                          </a>
                          <div className="text-xs text-gray-500">{mention.source}, {new Date(mention.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center text-sm text-gray-500">
        <div>Last updated: {new Date(profile.last_updated).toLocaleDateString()}</div>
        <Link href={`/scout-bot/character-profiles/${profile.id}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            Full Profile <ChevronRightIcon size={16} />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

// Character Profiles Page Component
export default function CharacterProfilesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  
  // In a real implementation, this would fetch data from the API
  const { data: profiles, isLoading } = useQuery<any>({
    queryKey: ['/api/scout-bot/character-profiles'],
    queryFn: async () => {
      // This would be replaced with a real API call
      return new Promise<CharacterProfile[]>((resolve) => {
        setTimeout(() => resolve(mockCharacterProfiles), 1000);
      });
    }
  });
  
  // Filter the profiles based on search and filter type
  const filteredProfiles = profiles?.filter((profile: any) => {
    const matchesSearch = searchTerm === "" || 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.known_aliases?.some((alias: any) => alias.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesType = !filterType || profile.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  return (
    <div className="container max-w-5xl py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Power Players</h1>
          <p className="text-gray-500 mt-1">
            Track influence patterns in Texas politics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilterType(null)} 
                  className={!filterType ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}>
            All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterType("consultant")}
                  className={filterType === "consultant" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}>
            Consultants
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterType("influencer")}
                  className={filterType === "influencer" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}>
            Influencers
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterType("strategist")}
                  className={filterType === "strategist" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}>
            Strategists
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="relative w-full max-w-lg">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by name or alias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="w-full mb-4">
              <CardHeader>
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredProfiles && filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile: any) => (
            <CharacterProfileCard key={profile.id} profile={profile} />
          ))
        ) : (
          <div className="text-center py-12">
            <AlertTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No profiles found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}