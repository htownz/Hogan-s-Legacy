import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, DollarSign, FileText, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

// Define what a legislator object should look like
interface LegislatorCardProps {
  legislator: {
    id: number;
    name: string;
    fullName?: string;
    party: string;
    district: string;
    chamber: string;
    biography?: string;
    imageUrl?: string;
    cartoonAvatarUrl?: string;
    committeesCount?: number;
    billsCount?: number;
    ideologyScore?: number;
    donorCount?: number;
  };
  showDetails?: boolean;
}

export function LegislatorCard({ legislator, showDetails = true }: LegislatorCardProps) {
  // Function to get party color
  const getPartyColor = (party: string) => {
    switch (party) {
      case "D":
        return "bg-blue-600";
      case "R":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  // Function to get chamber label
  const getChamberLabel = (chamber: string) => {
    return chamber === "house" ? "House" : chamber === "senate" ? "Senate" : chamber;
  };

  return (
    <Card className="w-full h-full hover:shadow-md transition-shadow duration-200 relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-16 w-16 border-2 border-primary">
              {legislator.cartoonAvatarUrl ? (
                <img
                  src={legislator.cartoonAvatarUrl}
                  alt={legislator.name}
                  className="object-cover"
                />
              ) : legislator.imageUrl ? (
                <img
                  src={legislator.imageUrl}
                  alt={legislator.name}
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-700 text-xl font-bold">
                  {legislator.name.substring(0, 2)}
                </div>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-lg">{legislator.fullName || legislator.name}</CardTitle>
              <div className="flex mt-1 space-x-2">
                <Badge
                  className={`${getPartyColor(
                    legislator.party
                  )} hover:${getPartyColor(legislator.party)}`}
                >
                  {legislator.party}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {legislator.district}
                </Badge>
                <Badge variant="secondary">
                  {getChamberLabel(legislator.chamber)}
                </Badge>
              </div>
            </div>
          </div>
          {legislator.ideologyScore !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center 
                    ${legislator.ideologyScore < 30 ? 'bg-blue-100 text-blue-700' : 
                      legislator.ideologyScore > 70 ? 'bg-red-100 text-red-700' : 
                      'bg-purple-100 text-purple-700'}`}>
                    <span className="font-bold">{legislator.ideologyScore}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ideology Score: {legislator.ideologyScore}/100</p>
                  <p className="text-xs mt-1">
                    {legislator.ideologyScore < 30 
                      ? 'More Progressive' 
                      : legislator.ideologyScore > 70 
                        ? 'More Conservative' 
                        : 'Moderate'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      {showDetails && (
        <>
          <Separator />
          <CardContent className="pt-4">
            {legislator.biography && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{legislator.biography}</p>
            )}
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {legislator.committeesCount !== undefined && (
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{legislator.committeesCount} Committees</span>
                </div>
              )}
              
              {legislator.billsCount !== undefined && (
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{legislator.billsCount} Bills</span>
                </div>
              )}
              
              {legislator.donorCount !== undefined && (
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{legislator.donorCount} Donors</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/legislators/${legislator.id}`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                >
                  <span>Basic Profile</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/legislator-advanced-profile/${legislator.id}`}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full mt-2"
                >
                  <span>Advanced</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}