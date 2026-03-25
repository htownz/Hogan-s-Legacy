import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PointOfOrder {
  id: string;
  billId: string;
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
  ruleReference: string;
  textLocation: string;
  suggestedFix: string;
  status: string;
  validationStatus: "pending" | "validated" | "rejected";
  bill: {
    id: string;
    title: string;
    chamber: string;
  };
}

interface PointOfOrderResponse {
  data: {
    pointsOfOrder: PointOfOrder[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  }
}

export function PointOfOrderValidationQueue() {
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [validationNotes, setValidationNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for fetching points of order
  const { data, isLoading, error } = useQuery<PointOfOrderResponse>({
    queryKey: ['/api/points-of-order', { aiDetected: true, validationStatus: activeTab }],
    retry: 1,
  });
  
  // Mutation for validating/rejecting a point of order
  const validateMutation = useMutation({
    mutationFn: async ({ id, validationStatus, notes }: { id: string; validationStatus: string; notes?: string }) => {
      return apiRequest(`/api/points-of-order/${id}/validate`, 'POST', {
        validationStatus, 
        notes
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['/api/points-of-order'] });
      toast({
        title: "Success",
        description: "Point of order validation status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update validation status: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleValidationChange = (id: string, status: "validated" | "rejected") => {
    validateMutation.mutate({
      id,
      validationStatus: status,
      notes: validationNotes[id] || undefined
    });
    
    // Clear notes after submission
    setValidationNotes(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading points of order...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
        <p className="text-red-600">Failed to load points of order for validation.</p>
      </div>
    );
  }
  
  const pointsOfOrder = data?.data?.pointsOfOrder || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Points of Order Validation Queue</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={activeTab === "pending" ? "default" : "outline"} className="px-3 py-1">
            Pending: {data?.data?.pagination?.total || 0}
          </Badge>
          <Badge variant={activeTab === "validated" ? "success" : "outline"} className="px-3 py-1">
            Validated
          </Badge>
          <Badge variant={activeTab === "rejected" ? "destructive" : "outline"} className="px-3 py-1">
            Rejected
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="validated">Validated</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        {["pending", "validated", "rejected"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
            {pointsOfOrder.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No points of order found with status: {tab}</p>
              </div>
            ) : (
              pointsOfOrder.map((poo: PointOfOrder) => (
                <Card key={poo.id} className="mb-4">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {poo.bill.title}
                          <Badge className="ml-2" variant={poo.severity === "high" ? "destructive" : poo.severity === "medium" ? "default" : "outline"}>
                            {poo.severity}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Bill ID: {poo.billId} | Type: {poo.type} | Rule: {poo.ruleReference}
                        </CardDescription>
                      </div>
                      {tab === "validated" && (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                      {tab === "rejected" && (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      {tab === "pending" && (
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Description</h4>
                      <p className="text-sm">{poo.description}</p>
                    </div>
                    
                    {poo.textLocation && (
                      <div>
                        <h4 className="font-medium mb-1">Location in Text</h4>
                        <p className="text-sm">{poo.textLocation}</p>
                      </div>
                    )}
                    
                    {poo.suggestedFix && (
                      <div>
                        <h4 className="font-medium mb-1">Suggested Fix</h4>
                        <p className="text-sm">{poo.suggestedFix}</p>
                      </div>
                    )}
                    
                    {tab === "pending" && (
                      <div>
                        <h4 className="font-medium mb-1">Validation Notes</h4>
                        <Textarea
                          placeholder="Add notes about your validation decision..."
                          value={validationNotes[poo.id] || ""}
                          onChange={(e) => setValidationNotes({
                            ...validationNotes,
                            [poo.id]: e.target.value
                          })}
                          className="min-h-[100px]"
                        />
                      </div>
                    )}
                  </CardContent>
                  
                  {tab === "pending" && (
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleValidationChange(poo.id, "rejected")}
                        disabled={validateMutation.isPending}
                      >
                        {validateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Reject
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-green-300 text-green-600 hover:bg-green-50"
                        onClick={() => handleValidationChange(poo.id, "validated")}
                        disabled={validateMutation.isPending}
                      >
                        {validateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Validate
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}