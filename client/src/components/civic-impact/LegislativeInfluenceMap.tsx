// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map as MapIcon } from 'lucide-react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";
import { Tooltip } from 'react-tooltip';

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E'  // Teal
};

// Texas GeoJSON is normally imported from a JSON file, but here's a simplified version for the component
const TEXAS_GEOURL = "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json";

interface RegionData {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  engagementScore: number;
  activeBills: number;
  activeUsers: number;
  topIssue: string;
}

interface LegislativeInfluenceMapProps {
  regions: RegionData[];
  userLocation?: [number, number];
  className?: string;
}

export default function LegislativeInfluenceMap({
  regions,
  userLocation,
  className = ''
}: LegislativeInfluenceMapProps) {
  const getMarkerSize = (score: number) => {
    const min = 4;
    const max = 18;
    return min + (score / 100) * (max - min);
  };

  const getMarkerColor = (score: number) => {
    if (score >= 80) return COLORS.OPTIONAL;
    if (score >= 60) return COLORS.ACCENT;
    if (score >= 40) return '#FFD700';
    if (score >= 20) return '#FFA500';
    return '#FF4500';
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapIcon className="mr-2 h-5 w-5" style={{ color: COLORS.ACCENT }} />
          Legislative Influence Map
        </CardTitle>
        <CardDescription>
          Geographic distribution of community engagement and impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{
              scale: 3000,
              center: [-99.9018, 31.9686] // Center on Texas
            }}
          >
            <ZoomableGroup center={[-99.9018, 31.9686]} zoom={1.5}>
              <Geographies geography={TEXAS_GEOURL}>
                {({ geographies }) => 
                  geographies
                    .filter((geo: any) => geo.properties.STATE === '48') // Filter for Texas (FIPS state code)
                    .map((geo: any) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#EEE"
                        stroke="#DDD"
                        style={{
                          default: { outline: 'none' },
                          hover: { fill: '#DDD', outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    ))
                }
              </Geographies>
              
              {/* Engagement Markers */}
              {regions.map((region) => (
                <Marker key={region.name} coordinates={region.coordinates}>
                  <circle
                    r={getMarkerSize(region.engagementScore)}
                    fill={getMarkerColor(region.engagementScore)}
                    fillOpacity={0.8}
                    stroke="#FFF"
                    strokeWidth={1}
                    data-tooltip-id="region-tooltip"
                    data-tooltip-content={`${region.name}: ${region.engagementScore}/100`}
                    data-tooltip-region={region.name}
                    data-tooltip-score={region.engagementScore}
                    data-tooltip-bills={region.activeBills}
                    data-tooltip-users={region.activeUsers}
                    data-tooltip-issue={region.topIssue}
                  />
                </Marker>
              ))}
              
              {/* User's location if provided */}
              {userLocation && (
                <Marker coordinates={userLocation}>
                  <circle
                    r={8}
                    fill={COLORS.PRIMARY}
                    stroke="#FFF"
                    strokeWidth={2}
                    data-tooltip-id="region-tooltip"
                    data-tooltip-content="Your location"
                  />
                </Marker>
              )}
            </ZoomableGroup>
          </ComposableMap>
          
          <Tooltip
            id="region-tooltip"
            render={({ actively, content, activeAnchor }) => (
              actively ? (
                <div className="p-2 bg-white shadow-md rounded-md border text-sm">
                  <div className="font-bold">{activeAnchor?.getAttribute('data-tooltip-region') || content}</div>
                  {activeAnchor?.getAttribute('data-tooltip-score') && (
                    <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                      <div className="text-gray-600">Impact Score:</div>
                      <div>{activeAnchor?.getAttribute('data-tooltip-score')}/100</div>
                      
                      <div className="text-gray-600">Active Bills:</div>
                      <div>{activeAnchor?.getAttribute('data-tooltip-bills')}</div>
                      
                      <div className="text-gray-600">Active Users:</div>
                      <div>{activeAnchor?.getAttribute('data-tooltip-users')}</div>
                      
                      <div className="text-gray-600">Top Issue:</div>
                      <div>{activeAnchor?.getAttribute('data-tooltip-issue')}</div>
                    </div>
                  )}
                </div>
              ) : null
            )}
          />
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#FF4500' }}></div>
              <span className="text-xs">Low Impact</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#FFA500' }}></div>
              <span className="text-xs">Moderate</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#FFD700' }}></div>
              <span className="text-xs">Good</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.ACCENT }}></div>
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.OPTIONAL }}></div>
              <span className="text-xs">Exceptional</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}