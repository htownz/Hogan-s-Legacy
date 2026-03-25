import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Map, 
  Users, 
  FileText, 
  MapPin, 
  Search,
  Filter,
  Eye,
  BarChart3,
  Globe
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Legislator {
  id: number;
  name: string;
  fullName: string;
  party: string;
  district: string;
  chamber: string;
  imageUrl?: string;
  city?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  bills?: any[];
  billCount?: number;
}

interface Bill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsors?: string;
  introducedAt: string;
  legislatorId?: number;
}

interface MapData {
  legislators: Legislator[];
  bills: Bill[];
  districts: any[];
}

export default function LegislativeMapVisualization() {
  const [selectedChamber, setSelectedChamber] = useState<'all' | 'house' | 'senate'>('all');
  const [selectedParty, setSelectedParty] = useState<'all' | 'Republican' | 'Democratic'>('all');
  const [mapView, setMapView] = useState<'legislators' | 'bills' | 'activity'>('legislators');
  const [selectedLegislator, setSelectedLegislator] = useState<Legislator | null>(null);

  // Fetch legislative data for mapping
  const { data: mapData, isLoading } = useQuery<MapData>({
    queryKey: ['/api/legislative-map-data'],
    retry: false,
  });

  const filteredLegislators = mapData?.legislators?.filter(leg => {
    const chamberMatch = selectedChamber === 'all' || leg.chamber.toLowerCase() === selectedChamber;
    const partyMatch = selectedParty === 'all' || leg.party === selectedParty;
    return chamberMatch && partyMatch && leg.latitude && leg.longitude;
  }) || [];

  const getMarkerColor = (legislator: Legislator) => {
    if (mapView === 'activity') {
      const billCount = legislator.billCount || 0;
      if (billCount > 10) return '#dc2626'; // High activity - red
      if (billCount > 5) return '#ea580c'; // Medium activity - orange  
      if (billCount > 0) return '#65a30d'; // Low activity - green
      return '#6b7280'; // No bills - gray
    }
    
    // Party colors
    return legislator.party === 'Republican' ? '#dc2626' : 
           legislator.party === 'Democratic' ? '#2563eb' : '#6b7280';
  };

  const getMarkerSize = (legislator: Legislator) => {
    if (mapView === 'activity') {
      const billCount = legislator.billCount || 0;
      return Math.max(8, Math.min(20, 8 + (billCount * 0.8)));
    }
    return 10;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Texas legislative map data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white">
              <Map className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Texas Legislative Map
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive visualization of Texas elected officials and their legislative activity across the state
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Map View Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Map View</label>
                <Tabs value={mapView} onValueChange={(value: any) => setMapView(value)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="legislators" className="text-xs">Officials</TabsTrigger>
                    <TabsTrigger value="bills" className="text-xs">Bills</TabsTrigger>
                    <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Chamber Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Chamber</label>
                <select 
                  value={selectedChamber}
                  onChange={(e) => setSelectedChamber(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Chambers</option>
                  <option value="house">House</option>
                  <option value="senate">Senate</option>
                </select>
              </div>

              {/* Party Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Party</label>
                <select 
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Parties</option>
                  <option value="Republican">Republican</option>
                  <option value="Democratic">Democratic</option>
                </select>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Showing</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filteredLegislators.length} Officials
                  </Badge>
                  <Badge variant="outline">
                    {mapData?.bills?.length || 0} Bills
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Texas Legislative Districts
                  {mapView === 'activity' && (
                    <Badge variant="secondary">
                      Bill Authorship Activity
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] w-full rounded-lg overflow-hidden">
                  <MapContainer
                    center={[31.0, -100.0]} // Texas center
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Legislator Markers */}
                    {filteredLegislators.map((legislator) => (
                      <CircleMarker
                        key={legislator.id}
                        center={[legislator.latitude!, legislator.longitude!]}
                        radius={getMarkerSize(legislator)}
                        fillColor={getMarkerColor(legislator)}
                        color="white"
                        weight={2}
                        opacity={1}
                        fillOpacity={0.8}
                        eventHandlers={{
                          click: () => setSelectedLegislator(legislator),
                        }}
                      >
                        <Popup>
                          <div className="p-2 space-y-2 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              {legislator.imageUrl && (
                                <img 
                                  src={legislator.imageUrl} 
                                  alt={legislator.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <h3 className="font-semibold">{legislator.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {legislator.party} • {legislator.chamber} District {legislator.district}
                                </p>
                              </div>
                            </div>
                            
                            {mapView === 'activity' && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Legislative Activity:</p>
                                <Badge variant="outline">
                                  {legislator.billCount || 0} Bills Authored
                                </Badge>
                              </div>
                            )}
                            
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedLegislator(legislator)}
                              className="w-full"
                            >
                              View Details
                            </Button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="space-y-6">
            
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Map Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mapView === 'activity' ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">Bill Authorship Activity:</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-600"></div>
                        <span className="text-sm">High Activity (10+ bills)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                        <span className="text-sm">Medium Activity (5-10 bills)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-600"></div>
                        <span className="text-sm">Low Activity (1-5 bills)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                        <span className="text-sm">No Bills</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-medium">Political Parties:</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-600"></div>
                        <span className="text-sm">Republican</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                        <span className="text-sm">Democratic</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                        <span className="text-sm">Other/Independent</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Legislator Details */}
            {selectedLegislator && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Legislator Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    {selectedLegislator.imageUrl && (
                      <img 
                        src={selectedLegislator.imageUrl} 
                        alt={selectedLegislator.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedLegislator.fullName}</h3>
                      <p className="text-gray-600">
                        {selectedLegislator.party} • {selectedLegislator.chamber} District {selectedLegislator.district}
                      </p>
                      {selectedLegislator.city && (
                        <p className="text-sm text-gray-500">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          {selectedLegislator.city}, Texas
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Legislative Activity
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bills Authored:</span>
                        <Badge variant="outline">
                          {selectedLegislator.billCount || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedLegislator.bills && selectedLegislator.bills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Bills:</h4>
                      <div className="space-y-2">
                        {selectedLegislator.bills.slice(0, 3).map((bill: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                            <p className="font-medium">{bill.title}</p>
                            <p className="text-gray-600 text-xs">{bill.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button className="w-full" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {mapData?.legislators?.filter(l => l.chamber === 'House').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">House Members</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {mapData?.legislators?.filter(l => l.chamber === 'Senate').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Senators</div>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {mapData?.bills?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Bills</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}