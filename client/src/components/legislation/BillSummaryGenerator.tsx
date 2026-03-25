import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BillSummaryGeneratorProps {
  billId: string;
  onComplete?: () => void;
}

export default function BillSummaryGenerator({ billId, onComplete }: BillSummaryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  
  // Mutation for generating bill summary
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await apiRequest<{ processingStatus: string, message: string }>(
        `/api/bills/${billId}/summary`,
        "POST",
        { force: true }
      );
      
      if (response.processingStatus === 'processing' || response.processingStatus === 'completed') {
        // Poll for the summary to be ready
        await pollForSummary();
      }
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Summary generation initiated",
        description: "Your bill summary is being generated. This may take a minute.",
        variant: "default",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/bills", billId, "summary"] });
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error generating summary",
        description: err.message || "Failed to generate bill summary. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });
  
  // Function to poll for the summary to be ready
  const pollForSummary = async (): Promise<void> => {
    let attempts = 0;
    const maxAttempts = 20; // Try for about 20 seconds (20 attempts * 1 second interval)
    
    const checkStatus = async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/bills/${billId}/summary`);
        const data = await response.json();
        
        if (data.processingStatus === 'completed') {
          setIsGenerating(false);
          toast({
            title: "Summary ready",
            description: "Your bill summary has been generated and is ready to view.",
            variant: "default",
          });
          
          // Invalidate the query to get the latest data
          queryClient.invalidateQueries({ queryKey: ["/api/bills", billId, "summary"] });
          return true;
        }
        
        if (data.processingStatus === 'failed') {
          setIsGenerating(false);
          toast({
            title: "Summary generation failed",
            description: "There was an error generating the summary. Please try again.",
            variant: "destructive",
          });
          return true;
        }
        
        return false;
      } catch (error) {
        // If there's an error checking the status, continue polling
        return false;
      }
    };
    
    // Initial check before starting the interval
    if (await checkStatus()) {
      return;
    }
    
    const intervalId = setInterval(async () => {
      attempts++;
      
      if (await checkStatus() || attempts >= maxAttempts) {
        clearInterval(intervalId);
        
        if (attempts >= maxAttempts) {
          // If we've reached the maximum number of attempts, assume it's still processing
          // but stop actively polling
          toast({
            title: "Still processing",
            description: "Your summary is taking longer than expected. You can check back later.",
            variant: "default",
          });
        }
      }
    }, 1000);
  };
  
  const handleGenerateSummary = () => {
    mutate();
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <Sparkles className="mr-2 text-amber-500" size={18} />
          Generate AI Summary
        </CardTitle>
        <CardDescription>
          Get an AI-powered analysis of this bill's content, impact, and key points
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError && (
          <div className="bg-destructive/10 p-3 rounded-md mb-4 flex items-start">
            <AlertTriangle className="text-destructive shrink-0 mr-2 mt-0.5" size={16} />
            <div className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to generate bill summary. Please try again."}
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          {isPending || isGenerating ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin">
                <RefreshCw className="text-primary" size={32} />
              </div>
              <p className="text-muted-foreground">
                Generating your bill summary...
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                We're using advanced AI to analyze the bill's content, legal implications,
                impact on Texans, and key stakeholder considerations.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-primary/10 rounded-full p-4">
                <Sparkles className="text-amber-500" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Generate AI Bill Summary</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Our AI will analyze the bill and create a comprehensive summary with key takeaways,
                  stakeholder analysis, legal implications, and potential impacts.
                </p>
              </div>
              <Button 
                className="mt-2"
                onClick={handleGenerateSummary}
              >
                Generate Summary
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}