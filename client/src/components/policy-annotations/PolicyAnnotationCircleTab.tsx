import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnnotationList from "./AnnotationList";
import ActionCircleSelector from "./ActionCircleSelector";

interface ActionCircle {
  id: number;
  name: string;
  description: string;
  memberCount?: number;
  isPublic: boolean;
}

interface PolicyAnnotationCircleTabProps {
  billId: string;
}

export function PolicyAnnotationCircleTab({ billId }: PolicyAnnotationCircleTabProps) {
  const { user } = useAuth();
  const [selectedCircleId, setSelectedCircleId] = useState<string>("");
  const isAuthenticated = !!user;

  // Fetch user's action circles
  const {
    data: circles = [],
    isLoading: isLoadingCircles,
    error: circlesError,
  } = useQuery<any>({
    queryKey: ['/api/action-circles'],
    queryFn: async () => {
      const response = await apiRequest('/api/action-circles?mine=true');
      if (!response.ok) {
        throw new Error('Failed to fetch action circles');
      }
      return response.json();
    },
    enabled: isAuthenticated, // Only fetch if user is authenticated
  });

  // Fetch circle annotations when a circle is selected
  const {
    data: circleAnnotations = [],
    isLoading: isLoadingAnnotations,
    error: annotationsError,
  } = useQuery<any>({
    queryKey: ['/api/annotations/bill', billId, 'circle', selectedCircleId],
    queryFn: async () => {
      const response = await apiRequest(`/api/annotations/bill/${billId}/circle/${selectedCircleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch circle annotations');
      }
      return response.json();
    },
    enabled: !!selectedCircleId && !!billId && isAuthenticated, // Only fetch when a circle is selected
  });

  if (!isAuthenticated) {
    return (
      <Card className="p-6 text-center border-dashed">
        <div className="flex flex-col items-center justify-center py-4">
          <Users className="h-10 w-10 text-muted-foreground mb-2 opacity-70" />
          <h3 className="font-medium text-muted-foreground">
            Sign in to view your Action Circle annotations
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Collaborate with others in your Action Circles by sharing private annotations and insights.
          </p>
        </div>
      </Card>
    );
  }

  if (isLoadingCircles) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (circlesError) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-2" />
        <p className="text-muted-foreground">
          Failed to load action circles. Please try again later.
        </p>
      </div>
    );
  }

  if (circles.length === 0) {
    return (
      <Card className="p-6 text-center border-dashed">
        <div className="flex flex-col items-center justify-center py-4">
          <Users className="h-10 w-10 text-muted-foreground mb-2 opacity-70" />
          <h3 className="font-medium text-muted-foreground">
            You're not a member of any Action Circles yet
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Join or create an Action Circle to collaborate with others on annotations.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.href = "/action-circles"}
          >
            Explore Action Circles
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium mb-1">Select an Action Circle</label>
        <Select
          value={selectedCircleId}
          onValueChange={setSelectedCircleId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a circle to view annotations" />
          </SelectTrigger>
          <SelectContent>
            {circles.map((circle: ActionCircle) => (
              <SelectItem key={circle.id} value={circle.id.toString()}>
                {circle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCircleId ? (
        isLoadingAnnotations ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : annotationsError ? (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <p className="text-muted-foreground">
              Failed to load circle annotations. Please try again later.
            </p>
          </div>
        ) : circleAnnotations.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No annotations in this circle for this bill yet.
            </p>
          </div>
        ) : (
          <AnnotationList
            annotations={circleAnnotations}
            billId={billId}
            isUserTab={false}
          />
        )
      ) : (
        <Card className="p-6 text-center border-dashed">
          <p className="text-muted-foreground">
            Select a circle to view its annotations
          </p>
        </Card>
      )}
    </div>
  );
}