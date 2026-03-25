import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
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
                      className="font-medium text-primary flex items-center"
                    >
                      ← Back to updates
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {updateDetails.updateType && (
                        <Badge variant="outline">
                          {UpdateTypeIcons[updateDetails.updateType]} 
                          <span className="ml-1">{updateDetails.updateType.replace('_', ' ')}</span>
                        </Badge>
                      )}
                      
                      {updateDetails.importance && (
                        <Badge 
                          variant={
                            updateDetails.importance === 'critical' ? 'destructive' : 
                            updateDetails.importance === 'high' ? 'default' :
                            updateDetails.importance === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {updateDetails.importance}
                        </Badge>
                      )}
                      
                      {updateDetails.verificationStatus && (
                        <Badge variant="outline" className="flex items-center">
                          {VerificationStatusIcons[updateDetails.verificationStatus]} 
                          <span className="ml-1">{updateDetails.verificationStatus.replace('_', ' ')}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{updateDetails.title}</CardTitle>
                      <CardDescription>
                        Posted by {updateDetails.userId} on {format(new Date(updateDetails.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{updateDetails.content}</p>
                      </div>
                      
                      {updateDetails.billId && (
                        <div className="mt-4">
                          <h4 className="font-medium">Related Bill</h4>
                          <Button variant="link" className="p-0" asChild>
                            <Link href={`/legislation/${updateDetails.billId}`}>
                              View {updateDetails.billId}
                            </Link>
                          </Button>
                        </div>
                      )}
                      
                      {updateDetails.tags && updateDetails.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1">
                          {updateDetails.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {updateDetails.verifications && updateDetails.verifications.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-2">Verifications</h4>
                          <div className="space-y-2">
                            {updateDetails.verifications.map((v: any) => (
                              <div key={v.id} className="flex items-start p-2 bg-muted rounded-md">
                                <div className="mr-2">
                                  {v.status === 'verified' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : v.status === 'disputed' ? (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-yellow-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {v.verifierName || `Verifier #${v.verifierId}`} - {format(new Date(v.createdAt), 'MMM d, yyyy')}
                                  </p>
                                  {v.notes && <p className="text-sm text-muted-foreground mt-1">{v.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col items-start space-y-4">
                      <div className="flex justify-between w-full">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => reactToUpdateMutation.mutate({ 
                              updateId: updateDetails.id, 
                              reactionType: 'insightful' 
                            })}
                            className="flex items-center"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Insightful {updateDetails.reactions?.insightful ? `(${updateDetails.reactions.insightful})` : ''}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => reactToUpdateMutation.mutate({ 
                              updateId: updateDetails.id, 
                              reactionType: 'thanks' 
                            })}
                            className="flex items-center"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Thanks {updateDetails.reactions?.thanks ? `(${updateDetails.reactions.thanks})` : ''}
                          </Button>
                        </div>
                        
                        {isVerifier && (
                          <Button 
                            variant="secondary"
                            onClick={() => verifyUpdateMutation.mutate({ 
                              updateId: updateDetails.id, 
                              status: 'verified',
                              notes: 'Verified based on my knowledge' 
                            })}
                          >
                            Verify This Update
                          </Button>
                        )}
                      </div>
                      
                      <div className="w-full">
                        <Alert className={`mt-2 ${updateDetails.confidenceLevel === 'high' || updateDetails.confidenceLevel === 'very_high' ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'}`}>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Confidence Level</AlertTitle>
                          <AlertDescription>
                            The source has {updateDetails.confidenceLevel.replace('_', ' ')} confidence in this information.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="text-center p-8">
                  <h3>Update not found</h3>
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
                  filteredUpdates.map((update: any) => (
                    <Card key={update.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedUpdate(update.id)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle>{update.title}</CardTitle>
                          <div className="flex space-x-1">
                            {update.updateType && (
                              <Badge variant="outline" className="flex items-center">
                                {UpdateTypeIcons[update.updateType]}
                              </Badge>
                            )}
                            {update.importance === 'critical' && (
                              <Badge variant="destructive">Critical</Badge>
                            )}
                            {update.importance === 'high' && (
                              <Badge>High</Badge>
                            )}
                            {update.verificationStatus && (
                              <Badge variant="outline" className="flex items-center">
                                {VerificationStatusIcons[update.verificationStatus]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="flex items-center mt-1">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback>{update.userId?.toString().charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          Posted on {format(new Date(update.createdAt), 'MMM d, yyyy')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm line-clamp-2">{update.content}</p>
                        
                        {update.billId && (
                          <div className="mt-2">
                            <Badge variant="outline">Bill {update.billId}</Badge>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                            {update.verifications?.verified || 0} verifications
                          </div>
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {update.reactions?.thanks || 0}
                          </div>
                        </div>
                        
                        <Badge 
                          variant={
                            update.confidenceLevel === 'very_high' ? 'default' : 
                            update.confidenceLevel === 'high' ? 'secondary' : 
                            'outline'
                          }
                          className="text-xs"
                        >
                          {update.confidenceLevel?.replace('_', ' ')} confidence
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center p-8">
                    <h3 className="text-lg font-medium">No updates found</h3>
                    <p className="text-muted-foreground mt-2">
                      Be the first to share inside information.
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
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Share Inside Intelligence</DialogTitle>
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
                      <Input placeholder="Concise title for your update" {...field} />
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
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="legislation_update">Bill Update</SelectItem>
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
                            <SelectValue placeholder="Select importance" />
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
              </div>
              
              <FormField
                control={createUpdateForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your inside information here" 
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
                  name="billId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Bill ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., TX-HB0001" {...field} />
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
                        <Input placeholder="e.g., healthcare, vote, committee" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="verified_only">Verified Users Only</SelectItem>
                          <SelectItem value="private">Private (Only you)</SelectItem>
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
                      <FormLabel>Your Confidence Level</FormLabel>
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
                          <SelectItem value="low">Low - Rumor/Unconfirmed</SelectItem>
                          <SelectItem value="medium">Medium - Likely</SelectItem>
                          <SelectItem value="high">High - Reliable</SelectItem>
                          <SelectItem value="very_high">Very High - Certain</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createUpdateForm.control}
                name="sourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Type (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="staff">Legislative Staff</SelectItem>
                        <SelectItem value="legislator">Legislator</SelectItem>
                        <SelectItem value="committee">Committee Member</SelectItem>
                        <SelectItem value="lobbyist">Lobbyist</SelectItem>
                        <SelectItem value="journalist">Journalist</SelectItem>
                        <SelectItem value="expert">Subject Matter Expert</SelectItem>
                        <SelectItem value="advocacy">Advocacy Group</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createUpdateMutation.isPending}>
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Apply to Become a Verifier</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Verifier Role</AlertTitle>
              <AlertDescription>
                Verifiers help validate information shared on Inside Track. This role requires expertise in legislative processes, government operations, or specific policy areas.
              </AlertDescription>
            </Alert>
          </div>
          <Form {...verifierApplicationForm}>
            <form onSubmit={verifierApplicationForm.handleSubmit(onApplyVerifier)} className="space-y-4">
              <FormField
                control={verifierApplicationForm.control}
                name="credentials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Credentials</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your professional background and experience that qualifies you to verify legislative information" 
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
                      <Input placeholder="e.g., healthcare policy, tax legislation, committee procedures" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={applyVerifierMutation.isPending}>
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