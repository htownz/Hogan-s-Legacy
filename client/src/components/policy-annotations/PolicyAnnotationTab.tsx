import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle, 
  Eye, 
  Globe, 
  UserCircle2, 
  Users 
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import AnnotationList from "./AnnotationList";
import AnnotationForm from "./AnnotationForm";
import { PolicyAnnotationCircleTab } from "./PolicyAnnotationCircleTab";
import { useAuth } from "@/hooks/use-auth";

interface PolicyAnnotationTabProps {
  billId: string;
}

export default function PolicyAnnotationTab({ billId }: PolicyAnnotationTabProps) {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("public");
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  // Fetch public annotations with user details
  const { 
    data: publicAnnotations = [] as any[], 
    isLoading: isLoadingPublic,
    error: publicError
  } = useQuery<any>({
    queryKey: ['/api/annotations/bill', billId, 'details'],
    enabled: !!billId,
  });

  // Fetch user's annotations if authenticated
  const {
    data: userAnnotations = [] as any[],
    isLoading: isLoadingUser,
    error: userError
  } = useQuery<any>({
    queryKey: ['/api/annotations/user'],
    enabled: !!billId && isAuthenticated,
  });

  // Filter user annotations for this bill
  const userBillAnnotations = userAnnotations?.filter?.(
    (annotation: any) => annotation.billId === billId
  ) || [];

  if (!billId) return null;

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Globe size={16} />
            Public
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center gap-2" disabled={!isAuthenticated}>
            <UserCircle2 size={16} />
            My Notes
          </TabsTrigger>
          <TabsTrigger value="circles" className="flex items-center gap-2">
            <Users size={16} />
            Circles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="pt-4">
          {isLoadingPublic ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : publicError ? (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-muted-foreground">
                Failed to load annotations. Please try again later.
              </p>
            </div>
          ) : publicAnnotations?.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No public annotations for this bill yet.
              </p>
              {isAuthenticated && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("my")}
                >
                  Add the first annotation
                </Button>
              )}
            </div>
          ) : (
            <AnnotationList 
              annotations={publicAnnotations} 
              billId={billId}
              isUserTab={false}
            />
          )}
        </TabsContent>

        <TabsContent value="my" className="pt-4">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                You need to sign in to add annotations.
              </p>
            </div>
          ) : isLoadingUser ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userError ? (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-muted-foreground">
                Failed to load your annotations. Please try again later.
              </p>
            </div>
          ) : (
            <>
              <AnnotationForm billId={billId} />
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Your Annotations for this Bill</h3>
                {userBillAnnotations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>You haven't created any annotations for this bill yet.</p>
                  </div>
                ) : (
                  <AnnotationList 
                    annotations={userBillAnnotations} 
                    billId={billId}
                    isUserTab={true}
                  />
                )}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="circles" className="pt-4">
          <PolicyAnnotationCircleTab billId={billId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}