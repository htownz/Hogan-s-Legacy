import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Check, X, Clock } from "lucide-react";

type PendingProfile = {
  id: string;
  name: string;
  firm: string | null;
  status: 'pending' | 'approved' | 'rejected';
  source: string;
  submitted_at: string;
  updated_at: string;
};

export default function NameProcessorPage() {
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const { toast } = useToast();

  // Query for pending profiles
  const { data: pendingProfiles, isLoading } = useQuery<any>({
    queryKey: ['/api/scout-bot/pending-profiles'],
    enabled: true
  });

  // Mutation for submitting a new name
  const submitNameMutation = useMutation({
    mutationFn: async (data: { name: string; firm?: string }) => {
      const response = await fetch('/api/scout-bot/names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit name');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset form fields
      setName("");
      setFirm("");
      
      // Show success toast
      toast({
        title: "Name Submitted",
        description: "The name has been queued for processing.",
        variant: "default",
      });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/pending-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating profile status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'approved' | 'rejected' }) => {
      const response = await fetch(`/api/scout-bot/pending-profiles/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Status Updated",
        description: "The profile status has been updated.",
        variant: "default",
      });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/pending-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting a profile
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scout-bot/pending-profiles/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Profile Deleted",
        description: "The profile has been removed from the queue.",
        variant: "default",
      });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/scout-bot/pending-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    
    submitNameMutation.mutate({ 
      name: name.trim(), 
      firm: firm.trim() || undefined 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1"><Check className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Scout Bot Name Processor</h1>

      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="submit">Submit Name</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Names
            {pendingProfiles?.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingProfiles.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Submit New Name</CardTitle>
              <CardDescription>
                Add a consultant or influencer to the Scout Bot processing queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input 
                      id="name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="firm">Firm/Organization (Optional)</Label>
                    <Input 
                      id="firm" 
                      value={firm}
                      onChange={(e) => setFirm(e.target.value)}
                      placeholder="Enter firm or organization name"
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => {
                setName("");
                setFirm("");
              }}>
                Reset
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={submitNameMutation.isPending || !name.trim()}
              >
                {submitNameMutation.isPending ? "Submitting..." : "Submit Name"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Names Queue</CardTitle>
              <CardDescription>
                Review and manage names awaiting processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingProfiles?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Firm/Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProfiles.map((profile: PendingProfile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>{profile.firm || "—"}</TableCell>
                        <TableCell>{getStatusBadge(profile.status)}</TableCell>
                        <TableCell>{profile.source}</TableCell>
                        <TableCell>{formatDate(profile.submitted_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {profile.status !== 'approved' && (
                                <DropdownMenuItem 
                                  onClick={() => updateStatusMutation.mutate({ id: profile.id, status: 'approved' })}
                                  className="text-green-600"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {profile.status !== 'rejected' && (
                                <DropdownMenuItem 
                                  onClick={() => updateStatusMutation.mutate({ id: profile.id, status: 'rejected' })}
                                  className="text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                              {profile.status !== 'pending' && (
                                <DropdownMenuItem 
                                  onClick={() => updateStatusMutation.mutate({ id: profile.id, status: 'pending' })}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Mark as Pending
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this entry?")) {
                                    deleteProfileMutation.mutate(profile.id);
                                  }
                                }}
                                className="text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending names found in the queue.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}