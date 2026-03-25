// @ts-nocheck
import { useState, useEffect } from "react";
import { ActionCircle } from "@shared/schema";
import { ActionCircleWithMembers } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Users, Activity, Calendar, Clock, CheckCircle, FileText, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Mock circle actions
const MOCK_CIRCLE_ACTIONS = [
  {
    id: 1,
    circleId: 1,
    title: "Fact check water bill claims",
    description: "Research and verify claims about the impact of HB234 on local water rights.",
    type: "research",
    deadline: "July 25",
    assigned: ["Sarah Johnson"],
    status: "in-progress"
  },
  {
    id: 2,
    circleId: 1,
    title: "Draft community update on water rights",
    description: "Create summary of recent developments for community distribution.",
    type: "content",
    deadline: "July 28",
    assigned: ["Michael Davis"],
    status: "planned"
  },
  {
    id: 3,
    circleId: 1,
    title: "Attend city council hearing",
    description: "Represent the action circle at upcoming city council hearing on water rights.",
    type: "advocacy",
    deadline: "August 2",
    assigned: ["Sarah Johnson", "James Wilson"],
    status: "planned"
  }
];

// Circle detail component
interface CircleDetailProps {
  circle: ActionCircleWithMembers;
  onClose: () => void;
}

function CircleDetail({ circle, onClose }: CircleDetailProps) {
  const [activeTab, setActiveTab] = useState("actions");
  const { toast } = useToast();
  
  // Get circle actions
  const circleActions = MOCK_CIRCLE_ACTIONS.filter(action => action.circleId === circle.id);
  
  // Get icon based on icon type
  const getCircleIcon = (iconType: string | undefined) => {
    switch (iconType) {
      case "water":
        return (
          <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
          </svg>
        );
      case "education":
        return (
          <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        );
      case "transport":
        return (
          <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        );
    }
  };
  
  // Handle action status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-white";
      case "in-progress":
        return "bg-amber-500 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };
  
  const handleJoinAction = (actionId: number) => {
    toast({
      title: "Joined Action",
      description: "You've been added to this action task.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
          !circle.iconType ? 'bg-gray-100' : 
          circle.iconType === 'water' ? 'bg-blue-100' : 
          circle.iconType === 'education' ? 'bg-purple-100' : 
          circle.iconType === 'climate' ? 'bg-green-100' :
          circle.iconType === 'health' ? 'bg-red-100' :
          'bg-green-100'
        }`}>
          {getCircleIcon(circle.iconType)}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{circle.name}</h2>
          <p className="text-gray-600">{circle.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-gray-100">
              <Users className="w-3 h-3 mr-1" /> 
              {circle.memberCount} members
            </Badge>
            <Badge variant="outline" className="bg-gray-100">
              <Activity className="w-3 h-3 mr-1" /> 
              {circle.recentActions} recent actions
            </Badge>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="actions" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Current Actions</h3>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Action
            </Button>
          </div>
          
          {circleActions.length > 0 ? (
            <div className="space-y-3">
              {circleActions.map(action => (
                <Card key={action.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <Badge className={getStatusColor(action.status)}>
                        {action.status === "in-progress" ? "In Progress" : 
                         action.status === "completed" ? "Completed" : "Planned"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {action.deadline}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        {action.assigned.length} assigned
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button size="sm" onClick={() => handleJoinAction(action.id)}>Join Action</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No actions currently in progress.</p>
              <Button className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Create First Action
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Circle Members</h3>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Invite Member
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(circle.memberCount)].map((_, i) => {
              const member = circle.members[i] || { id: i, avatarUrl: undefined };
              return (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <img 
                      src={member.avatarUrl || `https://ui-avatars.com/api/?name=Member+${i + 1}&background=random`}
                      alt="Member"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{i === 0 ? "Sarah Johnson (You)" : `Member ${i + 1}`}</p>
                      <p className="text-xs text-gray-500">{i === 0 ? "Admin" : "Member"}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="resources" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Resource
            </Button>
          </div>
          
          <div className="space-y-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="flex-grow">
                  <p className="font-medium">{circle.name} Fact Sheet</p>
                  <p className="text-xs text-gray-500">PDF • Added 2 weeks ago</p>
                </div>
                <Button variant="outline" size="sm">Download</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="flex-grow">
                  <p className="font-medium">Meeting Notes - July 15</p>
                  <p className="text-xs text-gray-500">DOCX • Added 5 days ago</p>
                </div>
                <Button variant="outline" size="sm">Download</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// New circle dialog
function NewCircleDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconType, setIconType] = useState("community");
  const { toast } = useToast();
  
  // Create circle mutation
  const createCircleMutation = useMutation({
    mutationFn: (newCircle: { name: string; description?: string; isActive?: boolean }) => 
      apiRequest({
        url: '/api/action-circles',
        method: 'POST',
        data: newCircle,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/action-circles'] });
      toast({
        title: "Circle Created",
        description: `${name} has been created successfully.`,
      });
      setOpen(false);
      setName("");
      setDescription("");
      setIconType("community");
    },
    onError: (error) => {
      console.error("Error creating circle:", error);
      toast({
        title: "Error",
        description: "Failed to create circle. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCircleMutation.mutate({
      name,
      description,
      isActive: true
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Circle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Action Circle</DialogTitle>
            <DialogDescription>
              Create a group to collaborate with others on specific issues or initiatives.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Circle Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter circle name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="What is this circle's focus and purpose?"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Icon Type</Label>
              <Select value={iconType} onValueChange={setIconType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select icon type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Water Rights</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="transport">Transportation</SelectItem>
                  <SelectItem value="climate">Climate</SelectItem>
                  <SelectItem value="health">Healthcare</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Circle</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Circle card component
interface CircleCardProps {
  circle: ActionCircleWithMembers;
  isMember: boolean;
  onViewCircle: (circle: ActionCircleWithMembers) => void;
  onJoinCircle: (circleId: number) => void;
}

function CircleCard({ circle, isMember, onViewCircle, onJoinCircle }: CircleCardProps) {
  // Get icon based on icon type
  const getCircleIcon = (iconType: string | undefined) => {
    switch (iconType) {
      case "water":
        return (
          <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
          </svg>
        );
      case "education":
        return (
          <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        );
      case "climate":
        return (
          <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case "health":
        return (
          <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        );
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
            !circle.iconType ? 'bg-gray-100' : 
            circle.iconType === 'water' ? 'bg-blue-100' : 
            circle.iconType === 'education' ? 'bg-purple-100' : 
            circle.iconType === 'climate' ? 'bg-green-100' : 
            circle.iconType === 'health' ? 'bg-red-100' : 
            'bg-gray-100'
          }`}>
            {getCircleIcon(circle.iconType)}
          </div>
          <div>
            <CardTitle className="text-lg">{circle.name}</CardTitle>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Users className="w-3 h-3 mr-1" />
              {circle.memberCount} members
              <span className="mx-2">•</span>
              <Activity className="w-3 h-3 mr-1" />
              {circle.recentActions} recent actions
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-gray-600">{circle.description}</p>
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        {isMember ? (
          <Button 
            className="w-full" 
            onClick={() => onViewCircle(circle)}
          >
            View Circle
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onJoinCircle(circle.id)}
          >
            Join Circle
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function ActionCirclesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-circles");
  const [selectedCircle, setSelectedCircle] = useState<ActionCircleWithMembers | null>(null);
  const { toast } = useToast();
  // Use the queryClient directly for cache invalidation
  
  // Query for user's action circles
  const { 
    data: userCircles = [], 
    isLoading: isLoadingUserCircles,
    error: userCirclesError 
  } = useQuery<any>({
    queryKey: ['/api/action-circles'],
    queryFn: () => apiRequest({ url: '/api/action-circles' }),
  });
  
  // Convert API data to ActionCircleWithMembers format
  const enrichedUserCircles: ActionCircleWithMembers[] = userCircles.map((circle: ActionCircle) => {
    // Determine icon type based on name/description keywords
    let iconType = "community";
    if (circle.name?.toLowerCase().includes("water") || circle.description?.toLowerCase().includes("water")) {
      iconType = "water";
    } else if (circle.name?.toLowerCase().includes("education") || circle.description?.toLowerCase().includes("education")) {
      iconType = "education";
    } else if (circle.name?.toLowerCase().includes("transport") || circle.description?.toLowerCase().includes("transport")) {
      iconType = "transport";
    } else if (circle.name?.toLowerCase().includes("climate") || circle.description?.toLowerCase().includes("climate")) {
      iconType = "climate";
    } else if (circle.name?.toLowerCase().includes("health") || circle.description?.toLowerCase().includes("health")) {
      iconType = "health";
    }
    
    return {
      ...circle,
      iconType,
      members: [], // We'll populate this when viewing a specific circle
      recentActions: 0, // We'll populate this when viewing a specific circle
      active: circle.isActive
    };
  });
  
  // For demo purposes, we're creating a few popular circles that aren't the user's
  // In a real app, this would be a separate API endpoint
  const popularCircles: ActionCircleWithMembers[] = [
    {
      id: 101,
      name: "Climate Action Texas",
      description: "Tracking climate policy and advocating for sustainable solutions across Texas.",
      iconType: "climate",
      memberCount: 42,
      active: true,
      recentActions: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creatorId: 1,
      isActive: true,
      members: []
    },
    {
      id: 102,
      name: "Healthcare Access Initiative",
      description: "Working to improve healthcare access and affordability across communities.",
      iconType: "health",
      memberCount: 31,
      active: true,
      recentActions: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creatorId: 1,
      isActive: true,
      members: []
    }
  ];
  
  // Filter circles based on search query
  const filteredUserCircles = enrichedUserCircles.filter(
    (circle: ActionCircleWithMembers) => 
      circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (circle.description && circle.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredPopularCircles = popularCircles.filter(
    (circle: ActionCircleWithMembers) => 
      circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (circle.description && circle.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleViewCircle = (circle: ActionCircleWithMembers) => {
    setSelectedCircle(circle);
  };
  
  // Join circle mutation
  const joinCircleMutation = useMutation({
    mutationFn: (circleId: number) => 
      apiRequest({
        url: `/api/action-circles/${circleId}/members`,
        method: 'POST',
      }),
    onSuccess: (_, circleId) => {
      const circle = popularCircles.find(c => c.id === circleId);
      queryClient.invalidateQueries({ queryKey: ['/api/action-circles'] });
      toast({
        title: "Circle Joined",
        description: circle ? `You've joined ${circle.name}` : "You've joined the circle",
      });
    },
    onError: (error) => {
      console.error("Error joining circle:", error);
      toast({
        title: "Error",
        description: "Failed to join circle. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleJoinCircle = (circleId: number) => {
    joinCircleMutation.mutate(circleId);
  };
  
  return (
    <>
      {selectedCircle ? (
        <CircleDetail 
          circle={selectedCircle} 
          onClose={() => setSelectedCircle(null)} 
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Action Circles</h1>
            <NewCircleDialog />
          </div>
          
          <div className="flex items-center">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search action circles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs defaultValue="my-circles" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-circles">My Circles</TabsTrigger>
              <TabsTrigger value="discover">Discover Circles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-circles" className="pt-4">
              {filteredUserCircles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUserCircles.map(circle => (
                    <CircleCard
                      key={circle.id}
                      circle={circle}
                      isMember={true}
                      onViewCircle={handleViewCircle}
                      onJoinCircle={handleJoinCircle}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">No Circles Found</h3>
                  {searchQuery ? (
                    <p className="text-gray-500">No circles match your search. Try different keywords.</p>
                  ) : (
                    <>
                      <p className="text-gray-500 mb-4">You haven't joined any action circles yet.</p>
                      <Button onClick={() => setActiveTab("discover")}>
                        Discover Circles
                      </Button>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="discover" className="pt-4">
              {filteredPopularCircles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPopularCircles.map(circle => (
                    <CircleCard
                      key={circle.id}
                      circle={circle}
                      isMember={false}
                      onViewCircle={handleViewCircle}
                      onJoinCircle={handleJoinCircle}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">No Circles Found</h3>
                  {searchQuery ? (
                    <p className="text-gray-500">No circles match your search. Try different keywords.</p>
                  ) : (
                    <p className="text-gray-500">No available circles to join at the moment.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
