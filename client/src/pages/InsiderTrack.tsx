import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle,
  CheckCircle2, 
  Clock, 
  FileText, 
  Info, 
  Loader2, 
  MessageCircle, 
  PencilRuler, 
  Shield, 
  Star, 
  ThumbsUp, 
  Users, 
  XCircle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const UpdateTypeIcons: Record<string, React.ReactNode> = {
  'legislation_update': <FileText className="h-4 w-4" />,
  'committee_insider': <Users className="h-4 w-4" />,
  'political_dynamic': <Shield className="h-4 w-4" />,
  'voting_prediction': <ThumbsUp className="h-4 w-4" />,
  'floor_action': <MessageCircle className="h-4 w-4" />,
  'behind_scenes': <Info className="h-4 w-4" />,
  'policy_analysis': <PencilRuler className="h-4 w-4" />,
};

const VerificationStatusIcons: Record<string, React.ReactNode> = {
  'pending': <Clock className="h-4 w-4 text-yellow-500" />,
  'verified': <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'disputed': <AlertCircle className="h-4 w-4 text-red-500" />,
  'unverified': <XCircle className="h-4 w-4 text-gray-500" />,
  'confirmed_by_multiple': <Star className="h-4 w-4 text-blue-500" />,
};

// Form schema for creating an insider update
const createUpdateSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  updateType: z.enum([
    'legislation_update', 
    'committee_insider', 
    'political_dynamic', 
    'voting_prediction', 
    'floor_action', 
    'behind_scenes', 
    'policy_analysis'
  ]),
  billId: z.string().optional(),
  sourceType: z.string().optional(),
  tags: z.string().optional(),
  visibility: z.enum(['public', 'verified_only', 'private']),
  importance: z.enum(['low', 'medium', 'high', 'critical']),
  confidenceLevel: z.enum(['low', 'medium', 'high', 'very_high']),
});

// Form schema for applying to be a verifier
const verifierApplicationSchema = z.object({
  credentials: z.string().min(10, { message: "Credentials must be at least 10 characters" }),
  expertise: z.string().min(5, { message: "Expertise must be at least 5 characters" }),
});

const InsiderTrack: React.FC = () => {
  const [activeTab, setActiveTab] = useState('latest');
  const [createUpdateOpen, setCreateUpdateOpen] = useState(false);
  const [verifierApplicationOpen, setVerifierApplicationOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch updates based on active tab
  const { data: updates, isLoading: isLoadingUpdates } = useQuery<any>({
    queryKey: ['/api/insider/updates', activeTab, filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      
      if (activeTab === 'legislation') {
        params.append('type', 'legislation_update');
      } else if (activeTab === 'committee') {
        params.append('type', 'committee_insider');
      } else if (activeTab === 'political') {
        params.append('type', 'political_dynamic');
      } else if (activeTab === 'voting') {
        params.append('type', 'voting_prediction');
      }
      
      if (filterType) {
        params.append('verificationStatus', filterType);
      }
      
      return apiRequest(`/api/insider/updates?${params.toString()}`);
    },
    enabled: !!user
  });
  
  // Fetch specific update
  const { data: updateDetails, isLoading: isLoadingUpdateDetails } = useQuery<any>({
    queryKey: ['/api/insider/updates', selectedUpdate],
    queryFn: () => apiRequest(`/api/insider/updates/${selectedUpdate}`),
    enabled: !!selectedUpdate
  });
  
  // Fetch popular tags
  const { data: popularTags } = useQuery<any>({
    queryKey: ['/api/insider/tags/popular'],
    queryFn: () => apiRequest('/api/insider/tags/popular'),
    enabled: !!user
  });
  
  // Fetch user verifier status
  const { data: verifierStatus } = useQuery<any>({
    queryKey: ['/api/insider/verifiers/me'],
    queryFn: () => apiRequest(`/api/insider/verifiers?userId=${user?.id}`),
    enabled: !!user?.id
  });
  
  // Create update mutation
  const createUpdateMutation = useMutation({
    mutationFn: (data: z.infer<typeof createUpdateSchema>) => {
      // Process tags into an array if provided
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()) : undefined;
      
      const payload = {
        ...data,
        tags: tags,
      };
      
      return apiRequest('/api/insider/updates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insider/updates'] });
      toast({
        title: "Update created",
        description: "Your insider update has been created successfully.",
      });
      setCreateUpdateOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error creating the update.",
        variant: "destructive",
      });
    }
  });
  
  // Apply to be a verifier mutation
  const applyVerifierMutation = useMutation({
    mutationFn: (data: z.infer<typeof verifierApplicationSchema>) => {
      // Convert expertise string to array
      const expertise = data.expertise.split(',').map(item => item.trim());
      
      return apiRequest('/api/insider/verifiers', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          expertise
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insider/verifiers/me'] });
      toast({
        title: "Application submitted",
        description: "Your application to become a verifier has been submitted.",
      });
      setVerifierApplicationOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error submitting your application.",
        variant: "destructive",
      });
    }
  });
  
  // React to update mutation
  const reactToUpdateMutation = useMutation({
    mutationFn: ({ updateId, reactionType }: { updateId: number, reactionType: string }) => {
      return apiRequest('/api/insider/reactions', {
        method: 'POST',
        body: JSON.stringify({
          updateId,
          reactionType
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insider/updates', selectedUpdate] });
      toast({
        title: "Reaction added",
        description: "Your reaction has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error adding your reaction.",
        variant: "destructive",
      });
    }
  });
  
  // Verify update mutation
  const verifyUpdateMutation = useMutation({
    mutationFn: ({ updateId, status, notes }: { updateId: number, status: string, notes?: string }) => {
      return apiRequest(`/api/insider/updates/${updateId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          notes
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insider/updates', selectedUpdate] });
      toast({
        title: "Update verified",
        description: "You have verified this update.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error verifying the update.",
        variant: "destructive",
      });
    }
  });
  
  // Create update form
  const createUpdateForm = useForm<z.infer<typeof createUpdateSchema>>({
    resolver: zodResolver(createUpdateSchema),
    defaultValues: {
      title: '',
      content: '',
      updateType: 'legislation_update',
      visibility: 'public',
      importance: 'medium',
      confidenceLevel: 'medium',
    },
  });
  
  // Verifier application form
  const verifierApplicationForm = useForm<z.infer<typeof verifierApplicationSchema>>({
    resolver: zodResolver(verifierApplicationSchema),
    defaultValues: {
      credentials: '',
      expertise: '',
    },
  });
  
  // Handle update creation
  const onCreateUpdate = (values: z.infer<typeof createUpdateSchema>) => {
    createUpdateMutation.mutate(values);
  };
  
  // Handle verifier application
  const onApplyVerifier = (values: z.infer<typeof verifierApplicationSchema>) => {
    applyVerifierMutation.mutate(values);
  };
  
  // Filter updates based on search query
  const filteredUpdates = React.useMemo(() => {
    if (!updates) return [];
    
    if (!searchQuery) return updates;
    
    return updates.filter((update: any) => 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [updates, searchQuery]);
  
  // Reset form when opening dialog
  useEffect(() => {
    if (createUpdateOpen) {
      createUpdateForm.reset({
        title: '',
        content: '',
        updateType: 'legislation_update',
        visibility: 'public',
        importance: 'medium',
        confidenceLevel: 'medium',
      });
    }
  }, [createUpdateOpen, createUpdateForm]);
  
  // Check if user is a verifier
  const isVerifier = React.useMemo(() => {
    return verifierStatus && verifierStatus.length > 0 && verifierStatus[0].isActive;
  }, [verifierStatus]);
  
  // Check if user has a pending verifier application
  const hasPendingApplication = React.useMemo(() => {
    return verifierStatus && verifierStatus.length > 0 && !verifierStatus[0].isActive;
  }, [verifierStatus]);
  
  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inside Track</h1>
            <p className="text-muted-foreground">
              Verified insights on legislation and political dynamics from trusted sources
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCreateUpdateOpen(true)}>
              Share Intelligence
            </Button>
            {!isVerifier && !hasPendingApplication && (
              <Button variant="outline" onClick={() => setVerifierApplicationOpen(true)}>
                Become a Verifier
              </Button>
            )}
            {hasPendingApplication && (
              <Button variant="outline" disabled>
                Application Pending
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-[250px_1fr]">
          {/* Left sidebar with filters */}
          <div className="flex flex-col gap-4">
            <div className="sticky top-4">
              <Tabs defaultValue="latest" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="latest">Latest</TabsTrigger>
                  <TabsTrigger value="legislation">Bills</TabsTrigger>
                  <TabsTrigger value="committee">Committees</TabsTrigger>
                  <TabsTrigger value="political">Political</TabsTrigger>
                  <TabsTrigger value="voting">Voting</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="my-4">
                <Input
                  placeholder="Search updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 mt-4">
                <h3 className="font-medium">Filter by Status</h3>
                <div className="space-y-1">
                  <Button 
                    variant={filterType === null ? "secondary" : "ghost"} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setFilterType(null)}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filterType === 'verified' ? "secondary" : "ghost"} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setFilterType('verified')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Verified
                  </Button>
                  <Button 
                    variant={filterType === 'confirmed_by_multiple' ? "secondary" : "ghost"} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setFilterType('confirmed_by_multiple')}
                  >
                    <Star className="mr-2 h-4 w-4 text-blue-500" />
                    Confirmed
                  </Button>
                  <Button 
                    variant={filterType === 'pending' ? "secondary" : "ghost"} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setFilterType('pending')}
                  >
                    <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                    Pending
                  </Button>
                </div>
              </div>
              
              {popularTags && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Popular Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {popularTags.map((tag: any) => (
                      <Badge key={tag.name} variant="outline" className="cursor-pointer">
                        {tag.name} ({tag.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Main content area */}
          <div>
            {selectedUpdate ? (
              // Update details view
              isLoadingUpdateDetails ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : updateDetails ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setSelectedUpdate(null)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      ← Back to all updates
                    </button>
                    
                    {isVerifier && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => verifyUpdateMutation.mutate({
                            updateId: updateDetails.id,
                            status: 'verified',
                            notes: 'Information verified'
                          })}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Verify
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => verifyUpdateMutation.mutate({
                            updateId: updateDetails.id,
                            status: 'disputed',
                            notes: 'Information disputed'
                          })}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Dispute
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          {UpdateTypeIcons[updateDetails.updateType] || <Info className="h-4 w-4" />}
                          <Badge variant="outline">
                            {updateDetails.updateType.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={
                            updateDetails.importance === 'critical' ? 'bg-red-500' :
                            updateDetails.importance === 'high' ? 'bg-amber-500' :
                            updateDetails.importance === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                          }>
                            {updateDetails.importance}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {VerificationStatusIcons[updateDetails.verificationStatus] || <Clock className="h-4 w-4" />}
                          <span className="text-sm font-medium capitalize">
                            {updateDetails.verificationStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-xl">{updateDetails.title}</CardTitle>
                      <CardDescription>
                        Posted by {updateDetails.userId} • {format(new Date(updateDetails.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{updateDetails.content}</p>
                      </div>
                      
                      {updateDetails.billId && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                          <h4 className="font-medium">Related Bill</h4>
                          <Link href={`/bills/${updateDetails.billId}`} className="text-primary hover:underline">
                            {updateDetails.billId}
                          </Link>
                        </div>
                      )}
                      
                      {updateDetails.tags && updateDetails.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
                          {updateDetails.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Verifications</h4>
                        {updateDetails.verifications && updateDetails.verifications.length > 0 ? (
                          <div className="space-y-2">
                            {updateDetails.verifications.map((v: any) => (
                              <div key={v.id} className="flex items-start p-3 bg-muted rounded-md">
                                <div className={`mr-2 ${
                                  v.status === 'verified' ? 'text-green-500' : 
                                  v.status === 'disputed' ? 'text-red-500' : 'text-yellow-500'
                                }`}>
                                  {v.status === 'verified' ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : v.status === 'disputed' ? (
                                    <AlertCircle className="h-5 w-5" />
                                  ) : (
                                    <Clock className="h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    Verifier #{v.verifierId} - {format(new Date(v.createdAt), 'MMM d, yyyy')}
                                  </div>
                                  {v.notes && <p className="text-sm mt-1">{v.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No verifications yet</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => reactToUpdateMutation.mutate({ 
                            updateId: updateDetails.id, 
                            reactionType: 'valuable' 
                          })}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Valuable
                          {updateDetails.reactions && updateDetails.reactions.valuable > 0 && 
                            <span className="ml-1">({updateDetails.reactions.valuable})</span>
                          }
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => reactToUpdateMutation.mutate({ 
                            updateId: updateDetails.id, 
                            reactionType: 'insightful' 
                          })}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Insightful
                          {updateDetails.reactions && updateDetails.reactions.insightful > 0 && 
                            <span className="ml-1">({updateDetails.reactions.insightful})</span>
                          }
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence Level: 
                        <span className="font-medium ml-1 capitalize">
                          {updateDetails.confidenceLevel.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="text-center p-8">
                  <h3 className="text-lg font-medium">Update not found</h3>
                </div>
              )
            ) : (
              // Updates list view
              <div className="space-y-4">
                {isLoadingUpdates ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredUpdates && filteredUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {filteredUpdates.map((update: any) => (
                      <Card 
                        key={update.id} 
                        className="hover:bg-accent/50 cursor-pointer"
                        onClick={() => setSelectedUpdate(update.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              {UpdateTypeIcons[update.updateType] || <Info className="h-4 w-4" />}
                              <Badge variant="outline">
                                {update.updateType.replace(/_/g, ' ')}
                              </Badge>
                              <Badge className={
                                update.importance === 'critical' ? 'bg-red-500' :
                                update.importance === 'high' ? 'bg-amber-500' :
                                update.importance === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                              }>
                                {update.importance}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {VerificationStatusIcons[update.verificationStatus] || <Clock className="h-4 w-4" />}
                              <span className="text-sm font-medium capitalize">
                                {update.verificationStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                          <CardTitle className="text-lg">{update.title}</CardTitle>
                          <CardDescription>
                            Posted {format(new Date(update.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="line-clamp-2">{update.content}</p>
                          
                          {update.tags && update.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {update.tags.map((tag: string) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {update.reactions && (
                              <>
                                {update.reactions.valuable > 0 && (
                                  <span className="flex items-center">
                                    <ThumbsUp className="mr-1 h-3 w-3" />
                                    {update.reactions.valuable}
                                  </span>
                                )}
                                {update.reactions.insightful > 0 && (
                                  <span className="flex items-center">
                                    <Star className="mr-1 h-3 w-3" />
                                    {update.reactions.insightful}
                                  </span>
                                )}
                              </>
                            )}
                            {update.verifications > 0 && (
                              <span className="flex items-center">
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                                {update.verifications}
                              </span>
                            )}
                          </div>
                          {update.billId && (
                            <Badge variant="outline">Bill: {update.billId}</Badge>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <h3 className="text-lg font-medium">No updates found</h3>
                    <p className="text-muted-foreground mt-2">
                      {filterType ? 'Try changing your filters or' : 'Be the first to'} share some insider intelligence.
                    </p>
                    <Button onClick={() => setCreateUpdateOpen(true)} className="mt-4">
                      Share Intelligence
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Update Dialog */}
      <Dialog open={createUpdateOpen} onOpenChange={setCreateUpdateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Share Intelligence</DialogTitle>
          </DialogHeader>
          <Form {...createUpdateForm}>
            <form onSubmit={createUpdateForm.handleSubmit(onCreateUpdate)} className="space-y-4">
              <FormField
                control={createUpdateForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title for your update" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUpdateForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide detailed information about your insider knowledge" 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUpdateForm.control}
                  name="updateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Update Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select update type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="legislation_update">Legislation Update</SelectItem>
                          <SelectItem value="committee_insider">Committee Insider</SelectItem>
                          <SelectItem value="political_dynamic">Political Dynamic</SelectItem>
                          <SelectItem value="voting_prediction">Voting Prediction</SelectItem>
                          <SelectItem value="floor_action">Floor Action</SelectItem>
                          <SelectItem value="behind_scenes">Behind the Scenes</SelectItem>
                          <SelectItem value="policy_analysis">Policy Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUpdateForm.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="verified_only">Verified Users Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUpdateForm.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUpdateForm.control}
                  name="confidenceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidence Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select confidence level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="very_high">Very High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createUpdateForm.control}
                name="billId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Bill ID (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HR123 or SB456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUpdateForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. healthcare, budget, bipartisan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert>
                <AlertTitle>Verification Process</AlertTitle>
                <AlertDescription>
                  Your update will be marked as 'pending' until reviewed by verified contributors. 
                  Please ensure your information is accurate and from reliable sources.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateUpdateOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUpdateMutation.isPending}
                >
                  {createUpdateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Update
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Verifier Application Dialog */}
      <Dialog open={verifierApplicationOpen} onOpenChange={setVerifierApplicationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply to Become a Verifier</DialogTitle>
          </DialogHeader>
          <Form {...verifierApplicationForm}>
            <form onSubmit={verifierApplicationForm.handleSubmit(onApplyVerifier)} className="space-y-4">
              <FormField
                control={verifierApplicationForm.control}
                name="credentials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credentials</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your professional background, experience, and qualifications" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={verifierApplicationForm.control}
                name="expertise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areas of Expertise (comma separated)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. healthcare policy, environmental law, budget process" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert>
                <AlertTitle>Verification Process</AlertTitle>
                <AlertDescription>
                  Your application will be reviewed by our team. Verifiers are expected to maintain
                  high standards of accuracy and integrity when reviewing information.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVerifierApplicationOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={applyVerifierMutation.isPending}
                >
                  {applyVerifierMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Application
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InsiderTrack;