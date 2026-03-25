import { useQuery } from "@tanstack/react-query";
import CommitteeCard from "./CommitteeCard";
import { type Committee } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommitteeList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: committees, isLoading } = useQuery<Committee[]>({
    queryKey: ["/api/committees"],
  });

  // Filter committees based on search and tab
  const filteredCommittees = committees?.filter((committee) => {
    const matchesSearch = !searchQuery || 
      committee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (committee.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "house" && committee.chamber === "House") || 
      (activeTab === "senate" && committee.chamber === "Senate");
    
    return matchesSearch && matchesTab;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <Input
          placeholder="Search committees..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="house">House</TabsTrigger>
            <TabsTrigger value="senate">Senate</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-[200px] w-full rounded-md" />
            </div>
          ))
        )}

        {!isLoading && filteredCommittees?.length === 0 && (
          <div className="col-span-3 text-center py-8">
            <p className="text-muted-foreground">No committees found matching your criteria.</p>
          </div>
        )}

        {filteredCommittees?.map((committee) => (
          <CommitteeCard 
            key={committee.id} 
            committee={committee}
            upcomingMeetingsCount={0} // This would be populated from a separate query
          />
        ))}
      </div>
    </div>
  );
}