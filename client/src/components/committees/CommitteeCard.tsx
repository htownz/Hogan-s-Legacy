import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CalendarDays, Users, ChevronRight } from "lucide-react";
import { type Committee } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface CommitteeCardProps {
  committee: Committee;
  upcomingMeetingsCount?: number;
}

export default function CommitteeCard({ committee, upcomingMeetingsCount = 0 }: CommitteeCardProps) {
  const { id, name, chamber, chair, members } = committee;

  return (
    <Card className="h-full flex flex-col transition-transform hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{name}</CardTitle>
          <Badge variant={chamber === "House" ? "default" : "secondary"}>
            {chamber}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {committee.description || `${chamber} committee handling various legislative matters.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          {chair && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Chair: {chair}</span>
            </div>
          )}
          {members && members.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{members.length} Members</span>
            </div>
          )}
          {upcomingMeetingsCount > 0 && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{upcomingMeetingsCount} upcoming {upcomingMeetingsCount === 1 ? 'meeting' : 'meetings'}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild variant="ghost" className="w-full justify-between">
          <Link to={`/committees/${id}`}>
            <span>View Details</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}