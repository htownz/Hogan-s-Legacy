import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface PopulateTimelineButtonProps {
  billId: string;
  onSuccess?: () => void;
}

export function PopulateTimelineButton({ billId, onSuccess }: PopulateTimelineButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const populateTimeline = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bills/${billId}/timeline/populate`, {
        method: 'POST' as const,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Timeline populated successfully",
          description: `Created ${data.stages.length} default timeline stages for this bill.`,
          variant: "default",
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: "Timeline already exists",
            description: `This bill already has ${errorData.count} timeline stages.`,
            variant: "default",
          });
          if (onSuccess) {
            onSuccess();
          }
        } else {
          throw new Error(errorData.error || 'Failed to populate timeline');
        }
      }
    } catch (error) {
      console.error('Error populating timeline:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to populate timeline',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={populateTimeline} 
      disabled={isLoading}
      className="w-full sm:w-auto"
      variant="default"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Populating Timeline...
        </>
      ) : (
        'Populate Timeline with Sample Data'
      )}
    </Button>
  );
}