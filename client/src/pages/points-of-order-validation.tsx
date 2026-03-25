import { PageHeader } from "@/components/ui/page-header";
import { PointOfOrderValidationQueue } from "@/components/point-of-order/validation-queue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface ValidationStats {
  data: {
    byValidationStatus: {
      validation_status: string;
      count: number;
    }[];
    byType: {
      type: string;
      validation_status: string;
      count: number;
    }[];
  }
}

export default function PointsOfOrderValidationPage() {
  // Fetch validation statistics
  const { data: statsData, isLoading: statsLoading } = useQuery<ValidationStats>({
    queryKey: ['/api/points-of-order/validation/stats'],
    retry: 1,
  });
  
  // Extract statistics from data
  const pendingCount = statsData?.data?.byValidationStatus?.find((s) => s.validation_status === "pending")?.count || 0;
  const validatedCount = statsData?.data?.byValidationStatus?.find((s) => s.validation_status === "validated")?.count || 0;  
  const rejectedCount = statsData?.data?.byValidationStatus?.find((s) => s.validation_status === "rejected")?.count || 0;
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        heading="Points of Order Validation Dashboard"
        subheading="Review, validate, or reject AI-detected points of order"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-600 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Pending Review
            </CardTitle>
            <CardDescription>Points of order awaiting human validation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>{pendingCount}</>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Validated
            </CardTitle>
            <CardDescription>Points of order confirmed by human experts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>{validatedCount}</>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-red-600 flex items-center">
              <XCircle className="mr-2 h-5 w-5" />
              Rejected
            </CardTitle>
            <CardDescription>Points of order rejected as false positives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>{rejectedCount}</>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Type statistics */}
      {statsData?.data?.byType && statsData.data.byType.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Points of Order by Type</CardTitle>
            <CardDescription>
              Distribution of AI-detected points of order by type and validation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(new Set(statsData.data.byType.map((stat) => stat.type))).map((type: string) => {
                const typeStats = statsData.data.byType.filter((stat) => stat.type === type);
                const typePending = typeStats.find((s: any) => s.validation_status === "pending")?.count || 0;
                const typeValidated = typeStats.find((s: any) => s.validation_status === "validated")?.count || 0;
                const typeRejected = typeStats.find((s: any) => s.validation_status === "rejected")?.count || 0;
                const typeTotal = typePending + typeValidated + typeRejected;
                
                return (
                  <div key={type} className="p-3 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{type}</h4>
                    <div className="flex items-center mb-1">
                      <span className="w-24 text-sm text-muted-foreground">Pending:</span>
                      <Badge variant="outline" className="text-amber-600">{typePending}</Badge>
                    </div>
                    <div className="flex items-center mb-1">
                      <span className="w-24 text-sm text-muted-foreground">Validated:</span>
                      <Badge variant="outline" className="text-green-600">{typeValidated}</Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-sm text-muted-foreground">Rejected:</span>
                      <Badge variant="outline" className="text-red-600">{typeRejected}</Badge>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Total: </span>
                      <span className="font-semibold">{typeTotal}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Validation Queue */}
      <PointOfOrderValidationQueue />
    </div>
  );
}