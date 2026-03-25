import { useQuery } from "@tanstack/react-query";
import CommitteeMeetingCard from "./CommitteeMeetingCard";
import { type CommitteeMeeting, type Committee } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isAfter, isBefore, startOfDay, endOfDay, addDays } from "date-fns";

export default function CommitteeMeetingList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframeTab, setTimeframeTab] = useState("upcoming");

  const { data: meetings, isLoading: meetingsLoading } = useQuery<CommitteeMeeting[]>({
    queryKey: ["/api/committee-meetings"],
  });

  const { data: committees } = useQuery<Committee[]>({
    queryKey: ["/api/committees"],
  });

  // Get committee name by ID
  const getCommitteeName = (committeeId: number) => {
    const committee = committees?.find(c => c.id === committeeId);
    return committee?.name || "Committee";
  };

  // Filter meetings based on search and timeframe
  const filteredMeetings = meetings?.filter((meeting) => {
    const meetingDate = new Date(meeting.date);
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);
    
    const matchesSearch = !searchQuery || 
      getCommitteeName(meeting.committeeId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTimeframe = true;
    if (timeframeTab === "upcoming") {
      matchesTimeframe = isAfter(meetingDate, today);
    } else if (timeframeTab === "thisWeek") {
      matchesTimeframe = isAfter(meetingDate, today) && isBefore(meetingDate, nextWeek);
    } else if (timeframeTab === "past") {
      matchesTimeframe = isBefore(meetingDate, today);
    }
    
    return matchesSearch && matchesTimeframe;
  });

  // Sort meetings chronologically
  const sortedMeetings = filteredMeetings?.sort((a, b) => {
    // If timeframe is "past", sort in descending order (newest first)
    // Otherwise, sort in ascending order (earliest first)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (timeframeTab === "past") {
      return dateB.getTime() - dateA.getTime();
    }
    return dateA.getTime() - dateB.getTime();
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTimeframeChange = (value: string) => {
    setTimeframeTab(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <Input
          placeholder="Search committee meetings..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Tabs value={timeframeTab} onValueChange={handleTimeframeChange} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="upcoming">All Upcoming</TabsTrigger>
            <TabsTrigger value="thisWeek">This Week</TabsTrigger>
            <TabsTrigger value="past">Past Meetings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetingsLoading && (
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-[200px] w-full rounded-md" />
            </div>
          ))
        )}

        {!meetingsLoading && sortedMeetings?.length === 0 && (
          <div className="col-span-3 text-center py-8">
            <p className="text-muted-foreground">No committee meetings found matching your criteria.</p>
          </div>
        )}

        {sortedMeetings?.map((meeting) => (
          <CommitteeMeetingCard 
            key={meeting.id} 
            meeting={meeting}
            committeeName={getCommitteeName(meeting.committeeId)}
          />
        ))}
      </div>
    </div>
  );
}