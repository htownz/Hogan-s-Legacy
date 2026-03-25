import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LegislatorCard } from "./LegislatorCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search } from "lucide-react";

export function LegislatorGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [chamberFilter, setChamberFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState("all");

  // Fetch all legislators with improved error handling
  const { 
    data: legislators, 
    isLoading, 
    error,
    isError,
    failureCount,
    refetch
  } = useQuery<any>({
    queryKey: ['/api/legislators'],
    queryFn: async () => {
      const response = await fetch('/api/legislators');
      if (!response.ok) {
        throw new Error(`Error fetching legislators: ${response.status}`);
      }
      return response.json();
    },
    retry: 3,
    retryDelay: 1000,
  });

  console.log("Legislators query state:", { 
    isLoading, 
    isError, 
    failureCount,
    hasData: !!legislators,
    dataLength: legislators ? legislators.length : 0,
    error: error ? (error as any).message : 'No error' 
  });

  if (isLoading) {
    return <LegislatorGridSkeleton />;
  }

  if (isError || !legislators) {
    const errorMessage = error ? (error as any).message : 'Unknown error';
    
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Legislators</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>Failed to load legislators. Error details: {errorMessage}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Log successful data loading
  console.log(`Successfully loaded ${legislators.length} legislators`);

  // Filter legislators based on search term and filters
  const filteredLegislators = legislators.filter((legislator: any) => {
    const matchesSearch = searchTerm === "" || 
      legislator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (legislator.fullName && legislator.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      legislator.district.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChamber = chamberFilter === "all" || legislator.chamber === chamberFilter;
    const matchesParty = partyFilter === "all" || legislator.party === partyFilter;
    
    return matchesSearch && matchesChamber && matchesParty;
  });

  // Group legislators by chamber
  const houseLegislators = filteredLegislators.filter((leg: any) => leg.chamber === "house");
  const senateLegislators = filteredLegislators.filter((leg: any) => leg.chamber === "senate");

  return (
    <div className="space-y-6">
      {/* Search and filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search legislators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={chamberFilter} onValueChange={setChamberFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by chamber" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chambers</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="senate">Senate</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={partyFilter} onValueChange={setPartyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by party" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parties</SelectItem>
            <SelectItem value="D">Democratic</SelectItem>
            <SelectItem value="R">Republican</SelectItem>
            <SelectItem value="I">Independent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredLegislators.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          <p className="text-lg font-medium">No legislators found</p>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All Legislators ({filteredLegislators.length})</TabsTrigger>
            <TabsTrigger value="house">House ({houseLegislators.length})</TabsTrigger>
            <TabsTrigger value="senate">Senate ({senateLegislators.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLegislators.map((legislator: any) => (
                <LegislatorCard key={legislator.id} legislator={legislator} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="house" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {houseLegislators.map((legislator: any) => (
                <LegislatorCard key={legislator.id} legislator={legislator} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="senate" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {senateLegislators.map((legislator: any) => (
                <LegislatorCard key={legislator.id} legislator={legislator} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Skeleton loader for the grid
function LegislatorGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(9).fill(0).map((_, index) => (
          <div key={index} className="h-64 border rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-9 w-full mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}