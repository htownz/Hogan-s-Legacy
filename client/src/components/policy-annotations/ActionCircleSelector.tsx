import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Plus } from "lucide-react";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateCircleForm from "./CreateCircleForm";

interface ActionCircle {
  id: number;
  name: string;
  description: string;
  memberCount?: number;
  isPublic: boolean;
}

interface ActionCircleSelectorProps {
  onValueChange: (value: string) => void;
  selectedValue?: string;
  isRequired?: boolean;
}

export default function ActionCircleSelector({ onValueChange, selectedValue, isRequired = false }: ActionCircleSelectorProps) {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Fetch user's action circles
  const { 
    data: circles = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<any>({
    queryKey: ['/api/action-circles'],
    queryFn: async () => {
      const response = await apiRequest('/api/action-circles?mine=true');
      if (!response.ok) {
        throw new Error('Failed to fetch action circles');
      }
      return response.json();
    },
    enabled: !!user // Only fetch if user is authenticated
  });

  // Handle circle creation success
  const handleCircleCreated = () => {
    setShowCreateDialog(false);
    refetch();
  };

  if (!user) {
    return (
      <FormItem>
        <FormLabel>Select Circle</FormLabel>
        <FormControl>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Please sign in first" />
            </SelectTrigger>
          </Select>
        </FormControl>
        <FormMessage>You need to be signed in to share with action circles</FormMessage>
      </FormItem>
    );
  }

  return (
    <FormItem>
      <div className="flex justify-between items-center">
        <FormLabel>Select Circle</FormLabel>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              New Circle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Action Circle</DialogTitle>
            </DialogHeader>
            <CreateCircleForm onSuccess={handleCircleCreated} />
          </DialogContent>
        </Dialog>
      </div>
      <FormControl>
        <Select onValueChange={onValueChange} value={selectedValue}>
          <SelectTrigger>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading circles...
              </div>
            ) : (
              <SelectValue placeholder="Select a circle" />
            )}
          </SelectTrigger>
          <SelectContent>
            {circles.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                <Users className="h-5 w-5 mx-auto mb-1 opacity-50" />
                <p>You don't have any circles yet</p>
                <p className="text-xs mt-1">Create one to share annotations with your group</p>
              </div>
            ) : (
              circles.map((circle: ActionCircle) => (
                <SelectItem key={circle.id} value={circle.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{circle.name}</span>
                    {!circle.isPublic && (
                      <Badge variant="outline" className="ml-2 text-xs">Private</Badge>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}