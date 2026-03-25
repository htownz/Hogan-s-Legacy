import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import { useLocation } from 'wouter';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, MapPin, AlertTriangle, ChevronRight, FileText } from 'lucide-react';

// Import Leaflet icon workaround
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons in Leaflet with React
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Capitol coordinates
const TEXAS_CAPITOL_POSITION: [number, number] = [30.2746, -97.7404];

interface District {
  id: number;
  type: string;
  districtNumber: number;
  name: string;
  representativeName: string | null;
  partyAffiliation: string | null;
  geoJson: any;
}

interface DistrictImpact {
  id: number;
  billId: string;
  districtId: number;
  impactScore: number;
  impactDescription: string | null;
  isPositive: boolean | null;
  impactAreas: any;
  sourceData: any;
}

interface CommitteeMeetingLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string | null;
  latitude: number;
  longitude: number;
  building: string | null;
  room: string | null;
  description: string | null;
}

/**
 * Map Reset Control Component
 */
function MapReset() {
  const map = useMap();
  
  const resetView = () => {
    map.setView(TEXAS_CAPITOL_POSITION, 7);
  };
  
  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button 
          className="bg-white p-2 hover:bg-gray-100 border border-gray-300 rounded" 
          onClick={resetView}
          title="Reset map view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"></path>
            <path d="M12 8v4l3 3"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Legislative Map Page Component
 */
export default function LegislativeMapPage() {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('districts');
  const [districtType, setDistrictType] = useState<string>('senate');
  const [, setLocation] = useLocation();

  // Fetch districts data
  const { 
    data: districts, 
    isLoading: isLoadingDistricts,
    error: districtsError 
  } = useQuery<any>({
    queryKey: ['/api/legislative-map/districts', districtType],
    queryFn: async () => {
      const response = await fetch(`/api/legislative-map/districts?type=${districtType}`);
      if (!response.ok) throw new Error('Failed to fetch districts');
      return response.json();
    }
  });

  // Fetch committee locations
  const { 
    data: committeeLocations, 
    isLoading: isLoadingLocations,
    error: locationsError 
  } = useQuery<any>({
    queryKey: ['/api/legislative-map/committee-locations'],
    queryFn: async () => {
      const response = await fetch('/api/legislative-map/committee-locations');
      if (!response.ok) throw new Error('Failed to fetch committee locations');
      return response.json();
    }
  });

  // Fetch district impacts if bill is selected
  const { 
    data: districtImpacts, 
    isLoading: isLoadingImpacts,
    error: impactsError 
  } = useQuery<any>({
    queryKey: ['/api/legislative-map/bills', selectedBillId, 'impacts'],
    queryFn: async () => {
      if (!selectedBillId) return [];
      const response = await fetch(`/api/legislative-map/bills/${selectedBillId}/impacts`);
      if (!response.ok) throw new Error('Failed to fetch district impacts');
      return response.json();
    },
    enabled: !!selectedBillId
  });

  // Style function for GeoJSON layers
  const districtStyle = (feature: any) => {
    const districtId = feature.properties.id;
    
    // If no bill is selected, just show the district boundaries
    if (!selectedBillId || !districtImpacts || districtImpacts.length === 0) {
      return {
        color: '#1f2937',
        weight: 1,
        fillOpacity: 0.1,
        fillColor: districtType === 'senate' ? '#2563eb' : '#7c3aed'
      };
    }
    
    // Get impact data for this district
    const impact = districtImpacts.find((imp: DistrictImpact) => imp.districtId === districtId);
    
    if (!impact) {
      return {
        color: '#1f2937',
        weight: 1,
        fillOpacity: 0.1,
        fillColor: '#9ca3af'
      };
    }
    
    // Color based on impact
    let fillColor = '#9ca3af'; // gray default
    
    if (impact.isPositive === true) {
      // Green shades for positive impact
      if (impact.impactScore < 3) fillColor = '#10b981'; // light green
      else if (impact.impactScore < 7) fillColor = '#059669'; // medium green
      else fillColor = '#047857'; // dark green
    } else if (impact.isPositive === false) {
      // Red shades for negative impact
      if (impact.impactScore < 3) fillColor = '#f87171'; // light red
      else if (impact.impactScore < 7) fillColor = '#ef4444'; // medium red
      else fillColor = '#b91c1c'; // dark red
    }
    
    return {
      color: '#1f2937',
      weight: 1,
      fillOpacity: 0.7,
      fillColor
    };
  };

  // Handle district click
  const handleDistrictClick = (e: any) => {
    const districtId = e.target.feature.properties.id;
    setSelectedDistrictId(districtId);
  };

  // Handle bill selection
  const handleBillSelect = (billId: string) => {
    setSelectedBillId(billId);
    setActiveTab('impacts');
  };

  // Handle view bill details
  const handleViewBill = (billId: string) => {
    setLocation(`/bill/${billId}`);
  };
  
  // Handle district type change
  const handleDistrictTypeChange = (type: string) => {
    setDistrictType(type);
    setSelectedDistrictId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Texas Legislative Map</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                Explore Texas legislative districts and committee meeting locations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <Select value={districtType} onValueChange={handleDistrictTypeChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="District Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="senate">Senate Districts</SelectItem>
                      <SelectItem value="house">House Districts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="flex items-center mr-4">
                    <div className="w-4 h-4 mr-1 rounded-sm" 
                      style={{ background: districtType === 'senate' ? '#2563eb' : '#7c3aed' }} />
                    <span>{districtType === 'senate' ? 'Senate' : 'House'} District</span>
                  </div>
                  {selectedBillId && (
                    <>
                      <div className="flex items-center mr-4">
                        <div className="w-4 h-4 mr-1 rounded-sm bg-green-600" />
                        <span>Positive Impact</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 mr-1 rounded-sm bg-red-600" />
                        <span>Negative Impact</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="border rounded-md h-[500px] overflow-hidden">
                {isLoadingDistricts ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : districtsError ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                    <p className="text-red-500">Error loading map data</p>
                  </div>
                ) : (
                  <MapContainer
                    center={TEXAS_CAPITOL_POSITION}
                    zoom={7}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Render districts GeoJSON */}
                    {districts && districts.map((district: District) => (
                      <GeoJSON 
                        key={district.id}
                        data={district.geoJson}
                        style={districtStyle}
                        eventHandlers={{
                          click: handleDistrictClick
                        }}
                        // Add district id to properties for reference
                        onEachFeature={(feature, layer) => {
                          if (!feature.properties) feature.properties = {};
                          feature.properties.id = district.id;
                          feature.properties.number = district.districtNumber;
                          feature.properties.name = district.name;
                          feature.properties.representative = district.representativeName;
                          feature.properties.party = district.partyAffiliation;
                        }}
                      />
                    ))}
                    
                    {/* Committee locations markers */}
                    {activeTab === 'committees' && committeeLocations && committeeLocations.map((location: CommitteeMeetingLocation) => (
                      <Marker 
                        key={location.id} 
                        position={[location.latitude, location.longitude]}
                      >
                        <Popup>
                          <div className="text-sm">
                            <h3 className="font-bold">{location.name}</h3>
                            <p>{location.address}</p>
                            <p>{location.city}, {location.state} {location.zipCode}</p>
                            {location.building && location.room && (
                              <p>Building: {location.building}, Room: {location.room}</p>
                            )}
                            {location.description && (
                              <p className="mt-2">{location.description}</p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Texas Capitol marker */}
                    <Marker position={TEXAS_CAPITOL_POSITION}>
                      <Popup>
                        <div className="text-sm">
                          <h3 className="font-bold">Texas State Capitol</h3>
                          <p>1100 Congress Ave, Austin, TX 78701</p>
                        </div>
                      </Popup>
                    </Marker>
                    
                    <MapReset />
                  </MapContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Tabs defaultValue="districts" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="districts" className="flex-1">Districts</TabsTrigger>
              <TabsTrigger value="impacts" className="flex-1">Bill Impacts</TabsTrigger>
              <TabsTrigger value="committees" className="flex-1">Committees</TabsTrigger>
            </TabsList>
            
            <TabsContent value="districts" className="pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Texas Legislative Districts</CardTitle>
                  <CardDescription>
                    {districtType === 'senate' ? 'Senate' : 'House'} districts with representatives
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {isLoadingDistricts ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : districtsError ? (
                    <div className="text-red-500 py-4 text-center">
                      Error loading districts
                    </div>
                  ) : districts && districts.length > 0 ? (
                    <div className="max-h-[450px] overflow-y-auto pr-2">
                      {districts.map((district: District) => (
                        <div 
                          key={district.id}
                          className={`mb-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedDistrictId === district.id ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedDistrictId(district.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">
                                {district.type === 'senate' ? 'Senate' : 'House'} District {district.districtNumber}
                              </h3>
                              {district.representativeName && (
                                <p className="text-sm text-gray-600">
                                  Rep: {district.representativeName}
                                  {district.partyAffiliation && (
                                    <Badge variant={district.partyAffiliation === 'R' ? 'destructive' : 'default'} className="ml-2">
                                      {district.partyAffiliation}
                                    </Badge>
                                  )}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-gray-500">No districts available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="impacts" className="pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Bill Impact Analysis</CardTitle>
                  <CardDescription>
                    How bills affect different districts
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm pt-2">
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">Select a bill to view impact:</div>
                    <input
                      type="text"
                      placeholder="Enter bill ID (e.g., TX-HB0001)"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={selectedBillId || ''}
                      onChange={(e) => setSelectedBillId(e.target.value)}
                    />
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => selectedBillId && handleViewBill(selectedBillId)}
                        disabled={!selectedBillId}
                        className="flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Bill Details
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {selectedBillId ? (
                    isLoadingImpacts ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                      </div>
                    ) : impactsError ? (
                      <div className="text-red-500 py-4 text-center">
                        Error loading impact data
                      </div>
                    ) : districtImpacts && districtImpacts.length > 0 ? (
                      <div className="max-h-[320px] overflow-y-auto pr-2">
                        {districtImpacts.map((impact: DistrictImpact) => {
                          const district = districts?.find((d: District) => d.id === impact.districtId);
                          
                          return (
                            <div 
                              key={impact.id}
                              className="mb-3 p-3 border rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center mb-1">
                                    <h3 className="font-semibold">
                                      {district ? `${district.type === 'senate' ? 'Senate' : 'House'} District ${district.districtNumber}` : `District ID: ${impact.districtId}`}
                                    </h3>
                                    <Badge 
                                      variant={impact.isPositive ? 'outline' : 'destructive'} 
                                      className="ml-2"
                                    >
                                      {impact.isPositive === true ? 'Positive' : impact.isPositive === false ? 'Negative' : 'Neutral'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-sm">
                                    <div className="flex items-center mb-1">
                                      <span className="font-medium mr-2">Impact Score:</span>
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className={`h-2.5 rounded-full ${
                                            impact.isPositive ? 'bg-green-600' : 
                                            impact.isPositive === false ? 'bg-red-600' : 'bg-gray-500'
                                          }`}
                                          style={{ width: `${(impact.impactScore / 10) * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    {impact.impactDescription && (
                                      <p className="text-gray-700 mt-2">{impact.impactDescription}</p>
                                    )}
                                    
                                    {impact.impactAreas && Object.keys(impact.impactAreas).length > 0 && (
                                      <div className="mt-2">
                                        <span className="font-medium">Impact Areas:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.keys(impact.impactAreas).map(area => (
                                            <Badge key={area} variant="secondary" className="text-xs">
                                              {area}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Info className="h-4 w-4 text-gray-400 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-gray-500">
                        No impact data available for this bill
                      </div>
                    )
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      Select a bill to view district impact analysis
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="committees" className="pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Committee Meeting Locations</CardTitle>
                  <CardDescription>
                    Where legislative committees meet
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {isLoadingLocations ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : locationsError ? (
                    <div className="text-red-500 py-4 text-center">
                      Error loading committee locations
                    </div>
                  ) : committeeLocations && committeeLocations.length > 0 ? (
                    <div className="max-h-[450px] overflow-y-auto pr-2">
                      {committeeLocations.map((location: CommitteeMeetingLocation) => (
                        <div 
                          key={location.id}
                          className="mb-3 p-3 border rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gray-600 mr-2 shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-semibold">{location.name}</h3>
                              <p className="text-gray-600">{location.address}</p>
                              <p className="text-gray-600">{location.city}, {location.state} {location.zipCode}</p>
                              {location.building && location.room && (
                                <p className="text-gray-600">Building: {location.building}, Room: {location.room}</p>
                              )}
                              {location.description && (
                                <p className="text-gray-700 mt-1">{location.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-gray-500">No committee locations available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}