import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, User, Users, Home, Building } from "lucide-react";
import { BillRecommendation } from "@shared/schema-recommendations";

interface RecommendationCardProps {
  recommendation: any; // The recommendation object
  bill: any; // The bill object
  onView: (billId: string) => void;
  onSave: (billId: string) => void;
  onDismiss: (billId: string) => void;
}

const RecommendationCard = ({ 
  recommendation, 
  bill, 
  onView, 
  onSave, 
  onDismiss 
}: RecommendationCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeImpactTab, setActiveImpactTab] = useState<string>("personal");

  // Check if we have impact information
  const hasPersonalImpact = recommendation.personalImpact;
  const hasFamilyImpact = recommendation.familyImpact;
  const hasCommunityImpact = recommendation.communityImpact;
  const hasImpactAreas = recommendation.impactAreas && recommendation.impactAreas.length > 0;

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg line-clamp-2">
              {bill.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {bill.id} • {bill.chamber}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            Score: {recommendation.score}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {bill.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {recommendation.matchedInterests.map((interest: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground italic mb-3">
          {recommendation.reason}
        </p>

        {/* Impact Information */}
        {(hasPersonalImpact || hasFamilyImpact || hasCommunityImpact) && (
          <>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-between py-1 h-auto" 
              onClick={() => setExpanded(!expanded)}
            >
              <span className="font-medium">How this impacts you</span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            
            {expanded && (
              <div className="mt-2 pt-2 border-t">
                <Tabs value={activeImpactTab} onValueChange={setActiveImpactTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-9">
                    <TabsTrigger value="personal" className="text-xs">
                      <User size={14} className="mr-1" />You
                    </TabsTrigger>
                    <TabsTrigger value="family" className="text-xs">
                      <Users size={14} className="mr-1" />Family
                    </TabsTrigger>
                    <TabsTrigger value="community" className="text-xs">
                      <Building size={14} className="mr-1" />Community
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="personal" className="mt-2">
                    {hasPersonalImpact ? (
                      <p className="text-sm">{recommendation.personalImpact}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No personal impact information available.</p>
                    )}
                    
                    {hasImpactAreas && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Impact areas:</p>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.impactAreas.map((area: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="family" className="mt-2">
                    {hasFamilyImpact ? (
                      <p className="text-sm">{recommendation.familyImpact}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No family impact information available.</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="community" className="mt-2">
                    {hasCommunityImpact ? (
                      <p className="text-sm">{recommendation.communityImpact}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No community impact information available.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 gap-2 flex justify-between mt-auto">
        <Button 
          variant="default" 
          size="sm"
          onClick={() => onView(bill.id)}
        >
          View Bill
        </Button>
        <div className="space-x-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSave(bill.id)}
          >
            Save
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDismiss(bill.id)}
          >
            Dismiss
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;