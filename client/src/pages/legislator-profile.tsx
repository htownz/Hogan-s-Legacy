import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Users, 
  FileText,
  Calendar,
  Award,
  TrendingUp,
  Share2,
  ExternalLink,
  Vote,
  Gavel
} from "lucide-react";

export default function LegislatorProfile() {
  const [, params] = useRoute("/legislators/:id");
  const legislatorId = params?.id;

  // Fetch legislator data
  const { data: legislator, isLoading } = useQuery<any>({
    queryKey: ["/api/legislators", legislatorId],
    enabled: !!legislatorId,
  });

  // Fetch legislator's bills
  const { data: sponsoredBills } = useQuery<any>({
    queryKey: ["/api/legislators", legislatorId, "bills"],
    enabled: !!legislatorId,
  });

  // Fetch committee memberships
  const { data: committees } = useQuery<any>({
    queryKey: ["/api/legislators", legislatorId, "committees"],
    enabled: !!legislatorId,
  });

  // Fetch voting record
  const { data: votingRecord } = useQuery<any>({
    queryKey: ["/api/legislators", legislatorId, "votes"],
    enabled: !!legislatorId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!legislator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Legislator Not Found</h2>
            <p className="text-gray-600">The requested legislator could not be found in our Texas legislative database.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPartyColor = (party: string) => {
    const colorMap: Record<string, string> = {
      'Republican': 'bg-red-100 text-red-800',
      'Democratic': 'bg-blue-100 text-blue-800',
      'Independent': 'bg-purple-100 text-purple-800'
    };
    return colorMap[party] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={legislator.imageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {legislator.name?.split(' ').map((n: any) => n[0]).join('') || 'TX'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {legislator.name}
                  </h1>
                  <Badge className={getPartyColor(legislator.party)}>
                    {legislator.party}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Texas {legislator.chamber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>District {legislator.district}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {legislator.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${legislator.email}`} className="hover:text-blue-600">
                        {legislator.email}
                      </a>
                    </div>
                  )}
                  {legislator.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${legislator.phone}`} className="hover:text-blue-600">
                        {legislator.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-1" />
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bills">Bills</TabsTrigger>
                <TabsTrigger value="committees">Committees</TabsTrigger>
                <TabsTrigger value="voting">Voting</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Legislative Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Legislative Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {legislator.name} represents District {legislator.district} in the Texas {legislator.chamber}. 
                          As a {legislator.party} member of the legislature, they work on behalf of their constituents 
                          to advance important policy initiatives and legislative priorities for Texas.
                        </p>
                        
                        {legislator.biography && (
                          <p className="text-gray-700 leading-relaxed">
                            {legislator.biography}
                          </p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {sponsoredBills?.length || 0}
                          </div>
                          <div className="text-sm text-blue-700">Bills Sponsored</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {committees?.length || 0}
                          </div>
                          <div className="text-sm text-green-700">Committee Memberships</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {legislator.chamber}
                          </div>
                          <div className="text-sm text-purple-700">Chamber</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Accomplishments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Key Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium">Legislative Leadership</h4>
                            <p className="text-sm text-gray-600">
                              Active participation in {legislator.chamber} proceedings and committee work
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium">Constituent Services</h4>
                            <p className="text-sm text-gray-600">
                              Representing the interests of District {legislator.district} residents
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium">Policy Development</h4>
                            <p className="text-sm text-gray-600">
                              Contributing to Texas legislation through bill sponsorship and committee work
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="bills">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Sponsored Legislation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sponsoredBills && sponsoredBills.length > 0 ? (
                      <div className="space-y-4">
                        {sponsoredBills.map((bill: any, index: any) => (
                          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">{bill.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {bill.description?.substring(0, 120)}...
                                </p>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="text-xs">
                                    {bill.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {bill.chamber}
                                  </span>
                                  {bill.introducedAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(bill.introducedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No sponsored bills found</p>
                        <p className="text-sm">Bill sponsorship data will appear here when available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="committees">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Committee Memberships
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {committees && committees.length > 0 ? (
                      <div className="space-y-4">
                        {committees.map((committee: any, index: any) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">{committee.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {committee.description || 'Committee focused on legislative oversight and policy development.'}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {committee.chamber} Committee
                              </Badge>
                              {committee.role && (
                                <Badge variant="outline" className="text-xs">
                                  {committee.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No committee memberships found</p>
                        <p className="text-sm">Committee assignment data will appear here when available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="voting">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="w-5 h-5" />
                      Voting Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {votingRecord && votingRecord.length > 0 ? (
                      <div className="space-y-4">
                        {votingRecord.map((vote: any, index: any) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">{vote.billTitle}</h4>
                                <p className="text-sm text-gray-600 mb-2">{vote.description}</p>
                                <div className="flex items-center gap-3">
                                  <Badge 
                                    variant={vote.position === 'Yes' ? 'default' : vote.position === 'No' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    Voted {vote.position}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(vote.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Vote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No voting record available</p>
                        <p className="text-sm">Voting history will appear here when available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {legislator.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">Email</div>
                      <a href={`mailto:${legislator.email}`} className="text-sm text-blue-600 hover:underline">
                        {legislator.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {legislator.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <a href={`tel:${legislator.phone}`} className="text-sm text-blue-600 hover:underline">
                        {legislator.phone}
                      </a>
                    </div>
                  </div>
                )}

                {legislator.officeAddress && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Office</div>
                      <div className="text-sm text-gray-600">
                        {legislator.officeAddress}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* District Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">District Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">District {legislator.district}</div>
                      <div className="text-sm text-gray-600">Texas {legislator.chamber}</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <div className="text-sm text-blue-800">
                      <strong>Representing:</strong> Constituents in District {legislator.district} 
                      of the Texas {legislator.chamber}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Take Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  View All Bills
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}