import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import { Search, Building, Users, MapPin, Phone, Mail, ExternalLink, DollarSign, Shield, Star } from "lucide-react";

export default function LegislatorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChamber, setSelectedChamber] = useState("all");

  // Fetch all Texas legislators with authentic government data
  const { data: legislators, isLoading } = useQuery<any>({
    queryKey: ['/api/legislators'],
    enabled: true
  });

  // Debug: Log the authentic Texas legislative data
  console.log('Authentic Texas legislators loaded:', Array.isArray(legislators) ? legislators.length : 0, Array.isArray(legislators) ? legislators[0] : null);

  // Filter legislators based on search and chamber selection
  const filteredLegislators = Array.isArray(legislators) ? legislators.filter((legislator: any) => {
    const matchesSearch = !searchTerm || 
      legislator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      legislator.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      legislator.party?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChamber = selectedChamber === "all" || 
      (selectedChamber === "senate" && legislator.chamber === "Senate") ||
      (selectedChamber === "house" && legislator.chamber === "House") ||
      (selectedChamber === "governor" && legislator.office === "Governor");
    
    return matchesSearch && matchesChamber;
  }) : [];

  const chamberCounts = {
    total: Array.isArray(legislators) ? legislators.length : 0,
    senate: Array.isArray(legislators) ? legislators.filter((l: any) => l.chamber === "Senate").length : 0,
    house: Array.isArray(legislators) ? legislators.filter((l: any) => l.chamber === "House").length : 0,
    governor: Array.isArray(legislators) ? legislators.filter((l: any) => l.office === "Governor").length : 0
  };

  return (
    <>
      <Helmet>
        <title>Legislators and Elected Officials | Act Up</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Legislators and Elected Officials</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete directory of Texas state senators, representatives, and governor with authentic government data, 
            transparency scores, and comprehensive profiles.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{chamberCounts.total}</div>
              <div className="text-sm text-blue-600">Total Officials</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{chamberCounts.senate}</div>
              <div className="text-sm text-purple-600">State Senators</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{chamberCounts.house}</div>
              <div className="text-sm text-green-600">Representatives</div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">{chamberCounts.governor}</div>
              <div className="text-sm text-orange-600">Governor</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, district, or party..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={selectedChamber === "all" ? "default" : "outline"}
                  onClick={() => setSelectedChamber("all")}
                  size="sm"
                >
                  All ({chamberCounts.total})
                </Button>
                <Button 
                  variant={selectedChamber === "senate" ? "default" : "outline"}
                  onClick={() => setSelectedChamber("senate")}
                  size="sm"
                >
                  Senate ({chamberCounts.senate})
                </Button>
                <Button 
                  variant={selectedChamber === "house" ? "default" : "outline"}
                  onClick={() => setSelectedChamber("house")}
                  size="sm"
                >
                  House ({chamberCounts.house})
                </Button>
                <Button 
                  variant={selectedChamber === "governor" ? "default" : "outline"}
                  onClick={() => setSelectedChamber("governor")}
                  size="sm"
                >
                  Governor ({chamberCounts.governor})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legislators Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLegislators.map((legislator: any) => (
              <Card key={legislator.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{legislator.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {legislator.chamber} {legislator.district ? `District ${legislator.district}` : ''}
                        {legislator.office && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                            {legislator.office}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={legislator.party === 'Republican' ? 'destructive' : 'default'}>
                      {legislator.party}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Contact Information */}
                    {(legislator.phone || legislator.email) && (
                      <div className="space-y-1">
                        {legislator.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {legislator.phone}
                          </div>
                        )}
                        {legislator.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {legislator.email}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Address */}
                    {legislator.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        <span>{legislator.address}</span>
                      </div>
                    )}

                    {/* Transparency Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">
                            ${(legislator.campaignTotal || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">Campaign</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Shield className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">
                            {legislator.ethicsScore || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">Ethics</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-orange-600" />
                          <span className="text-xs font-medium text-orange-700">
                            {legislator.transparencyScore || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">Transparency</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Profile
                      </Button>
                      {legislator.website && (
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredLegislators.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No legislators found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}