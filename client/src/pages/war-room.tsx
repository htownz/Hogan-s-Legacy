import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from "wouter";
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  Clock,
  FileText,
  MessageCircle,
  Plus,
  Users,
  X,
  AlertTriangle,
  CalendarDays,
  Download,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  Layers,
  Target,
  Award,
  RefreshCw,
  BookOpen,
  Share2,
  Briefcase,
  PieChart,
  ArrowUpRight,
  Sparkles,
  Archive,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from "@/components/ui/progress";
import MainLayout from '@/layouts/MainLayout';

// Types for war room data
interface WarRoomCampaign {
  id: number;
  title: string;
  description: string;
  creatorId: number;
  billId?: string; // Optional reference to a bill
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Analytics data for campaigns
interface CampaignAnalytics {
  totalActionItems: number;
  completedActionItems: number;
  totalResources: number;
  totalDownloads: number;
  totalDiscussions: number;
  totalMembers: number;
  progressPercentage: number;
  activeDays: number;
}

interface WarRoomDiscussion {
  id: number;
  campaignId: number;
  userId: number;
  message: string;
  createdAt: string;
}

interface WarRoomMember {
  id: number;
  campaignId: number;
  userId: number;
  role: string;
  joinedAt: string;
}

interface WarRoomResource {
  id: number;
  campaignId: number;
  uploadedById: number;
  title: string;
  type: string;
  url: string;
  description: string;
  downloads: number;
  createdAt: string;
}

interface WarRoomActionItem {
  id: number;
  campaignId: number;
  createdById: number;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const campaignFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  billId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

const discussionFormSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

const resourceFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.string().min(1, "Type is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string(),
});

const actionItemFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

// Helper function to format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
  planned: "bg-purple-100 text-purple-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  blocked: "bg-red-100 text-red-800"
};

const WarRoom: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discussions");
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [billFilter, setBillFilter] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Campaign analytics calculation
  const calculateCampaignAnalytics = (): CampaignAnalytics | null => {
    if (!actionItems || !resources || !discussions || !members || !selectedCampaign) {
      return null;
    }
    
    const completedItems = actionItems.filter((item: WarRoomActionItem) => item.status === 'completed').length;
    const totalDownloads = resources.reduce((sum: number, res: WarRoomResource) => sum + res.downloads, 0);
    const createdDate = new Date(selectedCampaign.createdAt);
    const now = new Date();
    const activeDays = Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const progressPercentage = actionItems.length > 0 
      ? Math.round((completedItems / actionItems.length) * 100) 
      : 0;
    
    return {
      totalActionItems: actionItems.length,
      completedActionItems: completedItems,
      totalResources: resources.length,
      totalDownloads,
      totalDiscussions: discussions.length,
      totalMembers: members.length,
      progressPercentage,
      activeDays
    };
  };

  // Fetch user's campaigns
  const { data: campaigns, isLoading: isLoadingCampaigns, error: campaignsError } = useQuery<any>({
    queryKey: ['/api/war-room/user/campaigns'],
    retry: 1,
  });

  // Fetch campaign details when a campaign is selected
  const { data: selectedCampaign, isLoading: isLoadingCampaign } = useQuery<any>({
    queryKey: ['/api/war-room/campaigns', selectedCampaignId],
    enabled: !!selectedCampaignId,
  });

  // Fetch discussions for selected campaign
  const { data: discussions, isLoading: isLoadingDiscussions } = useQuery<any>({
    queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'discussions'],
    enabled: !!selectedCampaignId,
  });

  // Fetch members for selected campaign
  const { data: members, isLoading: isLoadingMembers } = useQuery<any>({
    queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'members'],
    enabled: !!selectedCampaignId,
  });

  // Fetch resources for selected campaign
  const { data: resources, isLoading: isLoadingResources } = useQuery<any>({
    queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'resources'],
    enabled: !!selectedCampaignId,
  });

  // Fetch action items for selected campaign
  const { data: actionItems, isLoading: isLoadingActionItems } = useQuery<any>({
    queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'action-items'],
    enabled: !!selectedCampaignId,
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: z.infer<typeof campaignFormSchema>) => {
      return apiRequest('/api/war-room/campaigns', {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/war-room/user/campaigns'] });
      setCreateDialogOpen(false);
      toast({
        title: "Campaign created",
        description: "Your war room campaign has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create campaign",
        description: "There was an error creating your campaign.",
        variant: "destructive",
      });
    }
  });

  // Add discussion mutation
  const addDiscussionMutation = useMutation({
    mutationFn: (data: z.infer<typeof discussionFormSchema>) => {
      if (!selectedCampaignId) throw new Error("No campaign selected");
      return apiRequest(`/api/war-room/campaigns/${selectedCampaignId}/discussions`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'discussions'] });
      discussionForm.reset({ message: "" });
    },
    onError: (error) => {
      toast({
        title: "Failed to add discussion",
        description: "There was an error adding your message.",
        variant: "destructive",
      });
    }
  });

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: (data: z.infer<typeof resourceFormSchema>) => {
      if (!selectedCampaignId) throw new Error("No campaign selected");
      return apiRequest(`/api/war-room/campaigns/${selectedCampaignId}/resources`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'resources'] });
      resourceForm.reset();
      setAddResourceDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add resource",
        description: "There was an error adding your resource.",
        variant: "destructive",
      });
    }
  });

  // Add action item mutation
  const addActionItemMutation = useMutation({
    mutationFn: (data: z.infer<typeof actionItemFormSchema>) => {
      if (!selectedCampaignId) throw new Error("No campaign selected");
      return apiRequest(`/api/war-room/campaigns/${selectedCampaignId}/action-items`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'action-items'] });
      actionItemForm.reset();
      setAddActionItemDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add action item",
        description: "There was an error adding your action item.",
        variant: "destructive",
      });
    }
  });

  // Register forms using react-hook-form and zod validation
  const campaignForm = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      description: "",
      billId: undefined,
      priority: "medium"
    }
  });

  const discussionForm = useForm<z.infer<typeof discussionFormSchema>>({
    resolver: zodResolver(discussionFormSchema),
    defaultValues: {
      message: ""
    }
  });

  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);
  const resourceForm = useForm<z.infer<typeof resourceFormSchema>>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      type: "document",
      url: "",
      description: ""
    }
  });

  const [addActionItemDialogOpen, setAddActionItemDialogOpen] = useState(false);
  const actionItemForm = useForm<z.infer<typeof actionItemFormSchema>>({
    resolver: zodResolver(actionItemFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "medium"
    }
  });

  // Handle campaign creation
  const onSubmitCampaign = (data: z.infer<typeof campaignFormSchema>) => {
    createCampaignMutation.mutate(data);
  };

  // Handle adding a discussion message
  const onSubmitDiscussion = (data: z.infer<typeof discussionFormSchema>) => {
    addDiscussionMutation.mutate(data);
  };

  // Handle adding a resource
  const onSubmitResource = (data: z.infer<typeof resourceFormSchema>) => {
    addResourceMutation.mutate(data);
  };

  // Handle adding an action item
  const onSubmitActionItem = (data: z.infer<typeof actionItemFormSchema>) => {
    addActionItemMutation.mutate(data);
  };

  // Handle selecting a campaign
  const handleCampaignSelect = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
  };

  // Increment resource download count
  const handleResourceDownload = async (resourceId: number, url: string) => {
    try {
      await apiRequest(`/api/war-room/resources/${resourceId}/download`, {
        method: 'POST'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/war-room/campaigns', selectedCampaignId, 'resources'] });
      
      // Open the URL in a new tab
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Failed to track download",
        description: "There was an error tracking your download.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingCampaigns) {
    return (
      <MainLayout>
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">War Room</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading campaigns...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (campaignsError) {
    return (
      <MainLayout>
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">War Room</h1>
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle />
                <div>
                  <h3 className="font-semibold text-lg">Failed to load campaigns</h3>
                  <p>There was an error loading your campaigns. Please try again later.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">War Room</h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create a new War Room Campaign</DialogTitle>
                <DialogDescription>
                  Create a campaign to coordinate efforts around a specific issue or initiative.
                </DialogDescription>
              </DialogHeader>
              <Form {...campaignForm}>
                <form onSubmit={campaignForm.handleSubmit(onSubmitCampaign)} className="space-y-4">
                  <FormField
                    control={campaignForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Campaign title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={campaignForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the purpose of this campaign" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={campaignForm.control}
                    name="billId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Associated Bill (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Bill ID or leave empty" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value || undefined);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Associate this campaign with a specific legislative bill
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={campaignForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createCampaignMutation.isPending}>
                      {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Campaign List - Sidebar */}
          <div className="md:col-span-3">
            <div className="bg-slate-50 rounded-lg p-4 h-[calc(100vh-180px)] flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Your Campaigns</h2>
              
              {/* Search and filter */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search campaigns..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter(null);
                    setBillFilter(null);
                  }} className="h-8">
                    <RefreshCw className="h-3 w-3 mr-1" /> Reset
                  </Button>
                </div>
              </div>
              
              <div className="flex-grow overflow-auto">
                {campaigns && campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {campaigns
                      .filter((campaign: WarRoomCampaign) => {
                        // Apply search filter
                        const matchesSearch = searchTerm === '' || 
                          campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
                        
                        // Apply status filter
                        const matchesStatus = statusFilter === null || campaign.status === statusFilter;
                        
                        // Apply bill filter (if needed)
                        const matchesBill = billFilter === null || 
                          (campaign.billId && campaign.billId === billFilter);
                        
                        return matchesSearch && matchesStatus && matchesBill;
                      })
                      .map((campaign: WarRoomCampaign) => (
                        <div 
                          key={campaign.id}
                          className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-slate-100 ${selectedCampaignId === campaign.id ? 'bg-slate-200' : 'bg-white'}`}
                          onClick={() => handleCampaignSelect(campaign.id)}
                        >
                          <h3 className="font-medium line-clamp-1">{campaign.title}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <Badge className={priorityColors[campaign.priority as keyof typeof priorityColors]}>
                              {campaign.priority}
                            </Badge>
                            <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                              {campaign.status}
                            </Badge>
                          </div>
                          {campaign.billId && (
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <BookOpen className="h-3 w-3 mr-1" /> 
                              <span className="truncate">Bill: {campaign.billId}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    {campaigns.filter((campaign: WarRoomCampaign) => {
                      const matchesSearch = searchTerm === '' || 
                        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === null || campaign.status === statusFilter;
                      const matchesBill = billFilter === null || 
                        (campaign.billId && campaign.billId === billFilter);
                      return matchesSearch && matchesStatus && matchesBill;
                    }).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>No campaigns match your filters</p>
                        <Button variant="link" size="sm" onClick={() => {
                          setSearchTerm('');
                          setStatusFilter(null);
                          setBillFilter(null);
                        }}>
                          Clear filters
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <p className="text-center mb-4">You don't have any campaigns yet.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(true)}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Create your first campaign
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign Detail View */}
          <div className="md:col-span-9">
            {selectedCampaignId ? (
              isLoadingCampaign ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading campaign details...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Campaign Header */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{selectedCampaign?.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Created {formatDate(selectedCampaign?.createdAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={priorityColors[selectedCampaign?.priority as keyof typeof priorityColors]}>
                            {selectedCampaign?.priority}
                          </Badge>
                          <Badge className={statusColors[selectedCampaign?.status as keyof typeof statusColors]}>
                            {selectedCampaign?.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{selectedCampaign?.description}</p>
                      
                      {selectedCampaign?.billId && (
                        <div className="mt-3 flex items-center text-sm">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-600" /> 
                          <span className="font-medium">Associated Bill: </span>
                          <span className="ml-1 text-blue-600 hover:underline cursor-pointer" 
                                onClick={() => setLocation(`/bills/${selectedCampaign.billId}`)}>
                            {selectedCampaign.billId}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Campaign Analytics Dashboard */}
                  {!isLoadingActionItems && !isLoadingResources && !isLoadingDiscussions && !isLoadingMembers && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Analytics Card 1: Progress */}
                      <Card className="bg-white border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Campaign Progress</p>
                              <h4 className="text-2xl font-bold mt-1">
                                {calculateCampaignAnalytics()?.progressPercentage || 0}%
                              </h4>
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-500" />
                          </div>
                          <Progress className="h-2 mt-3" value={calculateCampaignAnalytics()?.progressPercentage || 0} />
                        </CardContent>
                      </Card>
                      
                      {/* Analytics Card 2: Action Items */}
                      <Card className="bg-white border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Action Items</p>
                              <h4 className="text-2xl font-bold mt-1">
                                {calculateCampaignAnalytics()?.completedActionItems || 0}/
                                {calculateCampaignAnalytics()?.totalActionItems || 0}
                              </h4>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                          <div className="mt-2 grid grid-cols-4 gap-1">
                            <div className="text-center">
                              <div className="text-xs font-medium mb-1">Planned</div>
                              <div className="text-lg font-semibold">
                                {actionItems?.filter((item: WarRoomActionItem) => item.status === 'planned').length || 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-medium mb-1">In Progress</div>
                              <div className="text-lg font-semibold">
                                {actionItems?.filter((item: WarRoomActionItem) => item.status === 'in-progress').length || 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-medium mb-1">Completed</div>
                              <div className="text-lg font-semibold">
                                {actionItems?.filter((item: WarRoomActionItem) => item.status === 'completed').length || 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-medium mb-1">Blocked</div>
                              <div className="text-lg font-semibold">
                                {actionItems?.filter((item: WarRoomActionItem) => item.status === 'blocked').length || 0}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Analytics Card 3: Engagement */}
                      <Card className="bg-white border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Campaign Engagement</p>
                              <h4 className="text-2xl font-bold mt-1">
                                {calculateCampaignAnalytics()?.totalMembers || 0} members
                              </h4>
                            </div>
                            <Users className="h-8 w-8 text-purple-500" />
                          </div>
                          <div className="flex justify-between mt-3">
                            <div className="text-center">
                              <div className="text-xs font-medium mb-1">Discussions</div>
                              <div className="text-lg font-semibold flex items-center justify-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {calculateCampaignAnalytics()?.totalDiscussions || 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-medium mb-1">Resources</div>
                              <div className="text-lg font-semibold flex items-center justify-center">
                                <FileText className="h-3 w-3 mr-1" />
                                {calculateCampaignAnalytics()?.totalResources || 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-medium mb-1">Downloads</div>
                              <div className="text-lg font-semibold flex items-center justify-center">
                                <Download className="h-3 w-3 mr-1" />
                                {calculateCampaignAnalytics()?.totalDownloads || 0}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Analytics Card 4: Duration */}
                      <Card className="bg-white border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Campaign Duration</p>
                              <h4 className="text-2xl font-bold mt-1">
                                {calculateCampaignAnalytics()?.activeDays || 0} days
                              </h4>
                            </div>
                            <CalendarDays className="h-8 w-8 text-amber-500" />
                          </div>
                          <div className="mt-3 text-sm">
                            {selectedCampaign?.status === 'active' ? (
                              <p className="flex items-center text-green-600">
                                <Sparkles className="h-4 w-4 mr-1" /> Campaign ongoing
                              </p>
                            ) : selectedCampaign?.status === 'completed' ? (
                              <p className="flex items-center text-blue-600">
                                <Award className="h-4 w-4 mr-1" /> Campaign completed
                              </p>
                            ) : (
                              <p className="flex items-center text-gray-600">
                                <Archive className="h-4 w-4 mr-1" /> Campaign archived
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Campaign Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="discussions" className="flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 mr-2" /> Discussions
                      </TabsTrigger>
                      <TabsTrigger value="action-items" className="flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 mr-2" /> Action Items
                      </TabsTrigger>
                      <TabsTrigger value="resources" className="flex items-center justify-center">
                        <FileText className="h-4 w-4 mr-2" /> Resources
                      </TabsTrigger>
                      <TabsTrigger value="members" className="flex items-center justify-center">
                        <Users className="h-4 w-4 mr-2" /> Members
                      </TabsTrigger>
                    </TabsList>

                    {/* Discussions Tab */}
                    <TabsContent value="discussions" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Campaign Discussions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[calc(50vh-160px)] flex flex-col">
                            <ScrollArea className="flex-grow pr-4 mb-4">
                              {isLoadingDiscussions ? (
                                <div className="flex items-center justify-center h-32">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                                </div>
                              ) : discussions && discussions.length > 0 ? (
                                <div className="space-y-4">
                                  {discussions.map((discussion: WarRoomDiscussion) => (
                                    <div key={discussion.id} className="p-3 bg-slate-50 rounded-md">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium">User {discussion.userId}</span>
                                        <span className="text-xs text-gray-500">{formatDate(discussion.createdAt)}</span>
                                      </div>
                                      <p className="text-sm">{discussion.message}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                                  <MessageCircle className="h-8 w-8 mb-2" />
                                  <p>No discussions yet. Start the conversation!</p>
                                </div>
                              )}
                            </ScrollArea>

                            <Form {...discussionForm}>
                              <form onSubmit={discussionForm.handleSubmit(onSubmitDiscussion)} className="flex gap-2">
                                <FormField
                                  control={discussionForm.control}
                                  name="message"
                                  render={({ field }) => (
                                    <FormItem className="flex-grow">
                                      <FormControl>
                                        <Input placeholder="Add to the discussion..." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button type="submit" disabled={addDiscussionMutation.isPending}>
                                  {addDiscussionMutation.isPending ? "Sending..." : "Send"}
                                </Button>
                              </form>
                            </Form>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Action Items Tab */}
                    <TabsContent value="action-items" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Action Items</h3>
                        <Dialog open={addActionItemDialogOpen} onOpenChange={setAddActionItemDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Action Item
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Action Item</DialogTitle>
                              <DialogDescription>
                                Create a new action item for this campaign.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...actionItemForm}>
                              <form onSubmit={actionItemForm.handleSubmit(onSubmitActionItem)} className="space-y-4">
                                <FormField
                                  control={actionItemForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Title</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Action item title" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={actionItemForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Details about this action item" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={actionItemForm.control}
                                  name="dueDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Due Date (Optional)</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={actionItemForm.control}
                                  name="priority"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Priority</FormLabel>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select priority level" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit" disabled={addActionItemMutation.isPending}>
                                    {addActionItemMutation.isPending ? "Adding..." : "Add Action Item"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {isLoadingActionItems ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : actionItems && actionItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {actionItems.map((item: WarRoomActionItem) => (
                            <Card key={item.id} className="overflow-hidden">
                              <div className={`h-2 ${priorityColors[item.priority as keyof typeof priorityColors].split(' ')[0]}`}></div>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                                  <Badge className={statusColors[item.status as keyof typeof statusColors]}>{item.status}</Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="pb-4">
                                <p className="text-sm mb-3">{item.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  {item.dueDate && (
                                    <div className="flex items-center">
                                      <CalendarDays className="h-3 w-3 mr-1" />
                                      <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>Created: {formatDate(item.createdAt)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="bg-slate-50">
                          <CardContent className="flex flex-col items-center justify-center py-10">
                            <CheckCircle className="h-12 w-12 text-slate-400 mb-4" />
                            <h3 className="font-medium text-center mb-2">No action items yet</h3>
                            <p className="text-sm text-center text-slate-500 mb-4">
                              Create action items to track tasks that need to be completed.
                            </p>
                            <Button onClick={() => setAddActionItemDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" /> Add First Action Item
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Resources Tab */}
                    <TabsContent value="resources" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Campaign Resources</h3>
                        <Dialog open={addResourceDialogOpen} onOpenChange={setAddResourceDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Resource
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Resource</DialogTitle>
                              <DialogDescription>
                                Share important documents, links, and resources with your team.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...resourceForm}>
                              <form onSubmit={resourceForm.handleSubmit(onSubmitResource)} className="space-y-4">
                                <FormField
                                  control={resourceForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Title</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Resource title" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={resourceForm.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Type</FormLabel>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select resource type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="document">Document</SelectItem>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="article">Article</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={resourceForm.control}
                                  name="url"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>URL</FormLabel>
                                      <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                      </FormControl>
                                      <FormDescription>Link to the resource (document, image, article, etc.)</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={resourceForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description (Optional)</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Brief description of this resource" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit" disabled={addResourceMutation.isPending}>
                                    {addResourceMutation.isPending ? "Adding..." : "Add Resource"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {isLoadingResources ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : resources && resources.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {resources.map((resource: WarRoomResource) => (
                            <Card key={resource.id}>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">{resource.title}</CardTitle>
                                  <Badge>{resource.type}</Badge>
                                </div>
                                <CardDescription className="mt-1">
                                  Added {formatDate(resource.createdAt)}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                {resource.description && <p className="text-sm mb-2">{resource.description}</p>}
                              </CardContent>
                              <CardFooter className="flex justify-between items-center">
                                <div className="text-xs text-slate-500">
                                  Downloads: {resource.downloads}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResourceDownload(resource.id, resource.url)}
                                >
                                  <Download className="h-4 w-4 mr-1" /> Download
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="bg-slate-50">
                          <CardContent className="flex flex-col items-center justify-center py-10">
                            <FileText className="h-12 w-12 text-slate-400 mb-4" />
                            <h3 className="font-medium text-center mb-2">No resources yet</h3>
                            <p className="text-sm text-center text-slate-500 mb-4">
                              Add documents, links, and other resources to share with your team.
                            </p>
                            <Button onClick={() => setAddResourceDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" /> Add First Resource
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Campaign Members</h3>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" /> Invite Member
                        </Button>
                      </div>

                      {isLoadingMembers ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : members && members.length > 0 ? (
                        <div className="bg-white rounded-md overflow-hidden border">
                          <table className="w-full">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User ID</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Role</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Joined</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {members.map((member: WarRoomMember) => (
                                <tr key={member.id}>
                                  <td className="px-4 py-3 text-sm">User {member.userId}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <Badge variant="outline">{member.role}</Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {formatDate(member.joinedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <Card className="bg-slate-50">
                          <CardContent className="flex flex-col items-center justify-center py-10">
                            <Users className="h-12 w-12 text-slate-400 mb-4" />
                            <h3 className="font-medium text-center mb-2">No other members yet</h3>
                            <p className="text-sm text-center text-slate-500 mb-4">
                              You're the only member of this campaign. Invite others to collaborate.
                            </p>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" /> Invite Members
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] text-center p-8 bg-slate-50 rounded-lg">
                <div className="mb-6 p-4 rounded-full bg-slate-100">
                  <MessageCircle className="h-10 w-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to War Room</h2>
                <p className="text-slate-600 mb-6 max-w-md">
                  Your command center for coordinated civic action. Create or select a campaign to get started.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Campaign
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WarRoom;