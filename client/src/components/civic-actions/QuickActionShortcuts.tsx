import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { AlertTriangle, CheckCircle, PhoneCall, Mail, MessageSquare, BadgeInfo, Users, MessageCircle, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Type definitions
export interface QuickActionShortcut {
  id: number;
  actionTypeId: number;
  displayText: string;
  icon: string;
  buttonColor: string;
  location: string;
  priority: number;
}

export interface CivicActionType {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  impact_level: number;
}

interface QuickActionShortcutsProps {
  location: string; // e.g., "bill_detail", "dashboard", "legislation_list"
  billId?: string; // Optional bill ID for bill-specific actions
  className?: string;
}

const QuickActionShortcuts = ({ location, billId, className = '' }: QuickActionShortcutsProps) => {
  const [selectedAction, setSelectedAction] = useState<{shortcut: QuickActionShortcut, actionType: CivicActionType} | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch quick action shortcuts for the current location
  const { data: shortcuts, isLoading, error } = useQuery<any>({
    queryKey: [`/api/civic-actions/shortcuts/${location}`],
    queryFn: async () => {
      const response = await apiRequest(`/api/civic-actions/shortcuts/${location}`);
      return response.json();
    },
  });
  
  // Fetch action types to get more details about each action
  const { data: actionTypes, isLoading: isLoadingActionTypes } = useQuery<any>({
    queryKey: ['/api/civic-actions/types'],
    queryFn: async () => {
      const response = await apiRequest('/api/civic-actions/types');
      return response.json();
    },
    enabled: !!shortcuts && shortcuts.length > 0,
  });
  
  // Initialize a new civic action
  const handleInitiateAction = async (shortcut: QuickActionShortcut) => {
    try {
      // Find the corresponding action type
      const actionType = actionTypes?.find((type: CivicActionType) => type.id === shortcut.actionTypeId);
      
      if (!actionType) {
        toast({
          title: "Error",
          description: "Could not find details for this action",
          variant: "destructive",
        });
        return;
      }
      
      // Record interaction
      try {
        await apiRequest('/api/civic-actions/shortcuts/interaction', {
          method: 'POST',
          data: {
            shortcutId: shortcut.id,
            interactionType: 'click',
            context: location + (billId ? ` - Bill: ${billId}` : ''),
          },
        });
      } catch (error) {
        // Don't block the main flow if interaction recording fails
        console.error("Failed to record interaction:", error);
      }
      
      // Set the selected action and open the dialog
      setSelectedAction({ shortcut, actionType });
      setDialogOpen(true);
    } catch (error) {
      console.error("Error initiating civic action:", error);
      toast({
        title: "Error",
        description: "Failed to initiate the action. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle completing an action
  const handleCompleteAction = async () => {
    if (!selectedAction) return;
    
    try {
      // Create a civic action record
      const response = await apiRequest('/api/civic-actions', {
        method: 'POST',
        data: {
          actionTypeId: selectedAction.actionType.id,
          billId: billId,
          description: `Quick action: ${selectedAction.actionType.name}`,
        },
      });
      
      if (response.ok) {
        // Complete the action immediately
        const actionData = await response.json();
        await apiRequest(`/api/civic-actions/${actionData.id}/complete`, {
          method: 'POST',
          data: {
            result: 'Completed via quick action',
          },
        });
        
        // Record interaction for completion
        await apiRequest('/api/civic-actions/shortcuts/interaction', {
          method: 'POST',
          data: {
            shortcutId: selectedAction.shortcut.id,
            interactionType: 'complete',
            context: location + (billId ? ` - Bill: ${billId}` : ''),
          },
        });
        
        toast({
          title: "Success!",
          description: "Your civic action has been recorded.",
        });
        
        // Close the dialog
        setDialogOpen(false);
        setSelectedAction(null);
      } else {
        throw new Error("Failed to create action");
      }
    } catch (error) {
      console.error("Error completing civic action:", error);
      toast({
        title: "Error",
        description: "Failed to complete the action. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Get the icon component for a given icon name
  const getIconComponent = (iconName: string, size = 16) => {
    switch (iconName) {
      case 'phone':
        return <PhoneCall size={size} />;
      case 'mail':
        return <Mail size={size} />;
      case 'message':
        return <MessageSquare size={size} />;
      case 'info':
        return <BadgeInfo size={size} />;
      case 'group':
        return <Users size={size} />;
      case 'comment':
        return <MessageCircle size={size} />;
      case 'alert':
        return <AlertTriangle size={size} />;
      default:
        return <ArrowRight size={size} />;
    }
  };
  
  // If loading, show skeleton UI
  if (isLoading || isLoadingActionTypes) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-md" />
        ))}
      </div>
    );
  }
  
  // If error or no shortcuts, don't render anything
  if (error || !shortcuts || shortcuts.length === 0) {
    return null;
  }
  
  // Render the quick action shortcuts
  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <TooltipProvider>
          {shortcuts.map((shortcut: QuickActionShortcut) => {
            const actionType = actionTypes?.find((type: CivicActionType) => type.id === shortcut.actionTypeId);
            
            // Skip if we can't find the action type
            if (!actionType) return null;
            
            // Get the background color or use a default
            const bgColor = shortcut.buttonColor || '#1D2D44';
            
            return (
              <Tooltip key={shortcut.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{ 
                      borderColor: bgColor,
                      color: bgColor,
                    }}
                    onClick={() => handleInitiateAction(shortcut)}
                  >
                    {getIconComponent(shortcut.icon || actionType.icon || 'default')}
                    {shortcut.displayText || actionType.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{actionType.description || `Take action: ${actionType.name}`}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
      
      {/* Action Dialog */}
      {selectedAction && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getIconComponent(selectedAction.shortcut.icon || selectedAction.actionType.icon || 'default', 20)}
                {selectedAction.actionType.name}
              </DialogTitle>
              <DialogDescription>
                {selectedAction.actionType.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm">
                This will record your civic action in your profile. You can view and manage all your actions in your dashboard.
              </p>
              
              {billId && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Related to bill: {billId}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCompleteAction}
                className="gap-2"
              >
                <CheckCircle size={16} />
                Complete Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default QuickActionShortcuts;