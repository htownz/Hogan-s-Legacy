import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, FileText, Video, ChevronRight, Briefcase } from "lucide-react";
import { type CommitteeMeeting } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";

interface CommitteeMeetingCardProps {
  meeting: CommitteeMeeting;
  committeeName?: string;
}

export default function CommitteeMeetingCard({ meeting, committeeName }: CommitteeMeetingCardProps) {
  const { id, date, location, status, billsDiscussed, videoUrl, transcriptUrl } = meeting;
  
  // Format date and time
  const meetingDate = new Date(date);
  const formattedDate = format(meetingDate, "MMMM d, yyyy");
  const formattedTime = format(meetingDate, "h:mm a");
  
  const getStatusBadgeProps = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return { variant: "outline" as const, text: "Scheduled" };
      case "in_progress":
        return { variant: "default" as const, text: "In Progress" };
      case "completed":
        return { variant: "secondary" as const, text: "Completed" };
      case "cancelled":
        return { variant: "destructive" as const, text: "Cancelled" };
      case "postponed":
        return { variant: "destructive" as const, text: "Postponed" };
      default:
        return { variant: "outline" as const, text: status };
    }
  };
  
  const statusProps = getStatusBadgeProps(status);

  return (
    <Card className="h-full flex flex-col transition-transform hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          {committeeName ? (
            <CardTitle className="text-lg font-bold">{committeeName}</CardTitle>
          ) : (
            <CardTitle className="text-lg font-bold">Committee Meeting</CardTitle>
          )}
          <Badge variant={statusProps.variant}>{statusProps.text}</Badge>
        </div>
        <CardDescription>
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{location}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          {billsDiscussed && billsDiscussed.length > 0 && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{billsDiscussed.length} {billsDiscussed.length === 1 ? 'bill' : 'bills'} to be discussed</span>
            </div>
          )}
          {videoUrl && (
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span>Video available</span>
            </div>
          )}
          {transcriptUrl && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Transcript available</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild variant="ghost" className="w-full justify-between">
          <Link to={`/committee-meetings/${id}`}>
            <span>View Details</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}