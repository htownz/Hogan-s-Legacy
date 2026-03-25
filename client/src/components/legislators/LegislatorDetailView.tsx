import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Calendar, 
  Check, 
  DollarSign, 
  FileText, 
  Info, 
  Mail, 
  MapPin, 
  Phone, 
  Users, 
  Vote,
  X,
  ExternalLink,
  BarChart
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface LegislatorDetailViewProps {
  legislatorId: number;
}

export function LegislatorDetailView({ legislatorId }: LegislatorDetailViewProps) {
  // Fetch legislator data
  const { data: legislator, isLoading, error } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId],
    enabled: !!legislatorId
  });

  // Fetch legislator votes
  const { data: votes, isLoading: votesLoading } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'votes'],
    enabled: !!legislatorId
  });

  // Fetch legislator accessories (for cartoon avatar)
  const { data: accessories, isLoading: accessoriesLoading } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'accessories'],
    enabled: !!legislatorId
  });

  // Fetch legislator ratings
  const { data: ratings, isLoading: ratingsLoading } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'ratings'],
    enabled: !!legislatorId
  });

  // Fetch bills sponsored by legislator
  const { data: bills, isLoading: billsLoading } = useQuery<any>({
    queryKey: ['/api/legislators', legislatorId, 'bills'],
    enabled: !!legislatorId
  });

  if (isLoading) {
    return <LegislatorDetailSkeleton />;
  }

  if (error || !legislator) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load legislator information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Function to get party color
  const getPartyColor = (party: string) => {
    switch (party) {
      case "D":
        return "bg-blue-600";
      case "R":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  // Function to get chamber label
  const getChamberLabel = (chamber: string) => {
    return chamber === "house" ? "House" : chamber === "senate" ? "Senate" : chamber;
  };

  return (
    <div className="space-y-6">
      {/* Legislator Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary">
                {legislator.cartoonAvatarUrl ? (
                  <img
                    src={legislator.cartoonAvatarUrl}
                    alt={legislator.name}
                    className="object-cover"
                  />
                ) : legislator.imageUrl ? (
                  <img
                    src={legislator.imageUrl}
                    alt={legislator.name}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-700 text-3xl font-bold">
                    {legislator.name.substring(0, 2)}
                  </div>
                )}
              </Avatar>
              {legislator.ideologyScore !== undefined && (
                <div 
                  className={`absolute bottom-0 right-0 h-10 w-10 rounded-full border-2 border-white flex items-center justify-center 
                    ${legislator.ideologyScore < 30 ? 'bg-blue-500 text-white' : 
                      legislator.ideologyScore > 70 ? 'bg-red-500 text-white' : 
                      'bg-purple-500 text-white'}`}
                >
                  <span className="font-bold">{legislator.ideologyScore}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <CardTitle className="text-2xl">{legislator.fullName || legislator.name}</CardTitle>
                <div className="flex mt-2 space-x-2 flex-wrap gap-y-2">
                  <Badge
                    className={`${getPartyColor(
                      legislator.party
                    )} hover:${getPartyColor(legislator.party)}`}
                  >
                    {legislator.party === "D" ? "Democrat" : 
                     legislator.party === "R" ? "Republican" : 
                     legislator.party === "I" ? "Independent" : legislator.party}
                  </Badge>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    District {legislator.district}
                  </Badge>
                  <Badge variant="secondary">
                    {getChamberLabel(legislator.chamber)}
                  </Badge>
                  {legislator.term && (
                    <Badge variant="outline" className="border-dashed">
                      <Calendar className="h-3 w-3 mr-1" />
                      Term: {legislator.term}
                    </Badge>
                  )}
                </div>
              </div>
              
              {legislator.biography && (
                <p className="text-gray-600 max-w-2xl">{legislator.biography}</p>
              )}
              
              <div className="flex flex-wrap gap-4 mt-2">
                {(legislator.email || legislator.phone) && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    {legislator.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-500" />
                        <a href={`mailto:${legislator.email}`} className="hover:underline">
                          {legislator.email}
                        </a>
                      </div>
                    )}
                    {legislator.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-500" />
                        <a href={`tel:${legislator.phone}`} className="hover:underline">
                          {legislator.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <Link href={`/legislator-advanced-profile/${legislatorId}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    <BarChart className="h-4 w-4 mr-1" />
                    <span>Advanced Profile</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Legislator Detail Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="votes">Voting Record</TabsTrigger>
          <TabsTrigger value="committees">Committees</TabsTrigger>
          <TabsTrigger value="donors">Top Donors</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Statistics</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Bills Sponsored</span>
                    <span className="text-2xl font-bold">
                      {billsLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        bills?.length || 0
                      )}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Committees</span>
                    <span className="text-2xl font-bold">
                      {legislator.committees?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Votes Cast</span>
                    <span className="text-2xl font-bold">
                      {votesLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        votes?.length || 0
                      )}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Ideology Score</span>
                    <span className="text-2xl font-bold">
                      {legislator.ideologyScore || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interest Group Ratings</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                {ratingsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : ratings && ratings.length > 0 ? (
                  <div className="space-y-3">
                    {ratings.map((rating: any) => (
                      <div key={rating.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium">{rating.organization}</div>
                          <div className="text-sm text-gray-500">{rating.category}</div>
                        </div>
                        <Badge variant={rating.score > 70 ? "default" : rating.score > 40 ? "secondary" : "outline"}>
                          {rating.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-6">
                    <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No ratings available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sponsored Bills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Bills Sponsored</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {billsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : bills && bills.length > 0 ? (
                <div className="space-y-3">
                  {bills.slice(0, 5).map((bill: any) => (
                    <div key={bill.id} className="border rounded-md p-3 hover:bg-gray-50">
                      <div className="font-medium">{bill.number}: {bill.title}</div>
                      <div className="flex justify-between mt-1">
                        <div className="text-sm text-gray-500">Filed: {bill.filedDate}</div>
                        <Badge variant={bill.status === "Passed" ? "default" : bill.status === "Failed" ? "destructive" : "outline"}>
                          {bill.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-6">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No bills sponsored by this legislator</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Votes Tab */}
        <TabsContent value="votes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voting Record</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {votesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : votes && votes.length > 0 ? (
                <div className="space-y-3">
                  {votes.map((vote: any) => (
                    <div key={vote.id} className="border rounded-md p-3 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div className="font-medium">{vote.billNumber}</div>
                        <Badge variant={vote.vote === "Yea" ? "default" : vote.vote === "Nay" ? "destructive" : "outline"}>
                          {vote.vote === "Yea" ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : vote.vote === "Nay" ? (
                            <X className="h-3 w-3 mr-1" />
                          ) : null}
                          {vote.vote}
                        </Badge>
                      </div>
                      <div className="text-sm mt-1">{vote.billTitle}</div>
                      <div className="text-xs text-gray-500 mt-1">Voted on: {vote.date}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-6">
                  <Vote className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No voting record available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Committees Tab */}
        <TabsContent value="committees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Committee Memberships</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {legislator.committees && legislator.committees.length > 0 ? (
                <div className="space-y-3">
                  {legislator.committees.map((committee: any, index: any) => (
                    <div key={index} className="border rounded-md p-3 hover:bg-gray-50">
                      <div className="font-medium">{committee.name}</div>
                      <div className="flex justify-between mt-1">
                        <div className="text-sm text-gray-500">{committee.role || "Member"}</div>
                        {committee.isChair && (
                          <Badge>Chair</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-6">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No committee memberships available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Donors Tab */}
        <TabsContent value="donors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Campaign Contributors</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {legislator.topDonors && legislator.topDonors.length > 0 ? (
                <div className="space-y-3">
                  {legislator.topDonors.map((donor: any, index: any) => (
                    <div key={index} className="border rounded-md p-3 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div className="font-medium">{donor.name}</div>
                        <div className="font-medium text-green-600">${donor.amount.toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{donor.industry}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-6">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No donor information available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {legislator.donorCategories && legislator.donorCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Donations by Category</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {legislator.donorCategories.map((category: any, index: any) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm font-medium">${category.amount.toLocaleString()}</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">{category.percentage}% of total donations</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Skeleton loader for the detail view
function LegislatorDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}