// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  AlertTriangle, 
  CheckCircle2, 
  Flag, 
  Loader2, 
  MessageCircle, 
  Shield, 
  Users, 
  XCircle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Form schema for adding moderators
const addModeratorSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }).transform(val => parseInt(val)),
  forumId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  notes: z.string().optional(),
});

// Form schema for moderating content
const moderateContentSchema = z.object({
  status: z.enum(['approved', 'rejected', 'flagged']),
  notes: z.string().optional(),
});

const ModerationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [addModeratorOpen, setAddModeratorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [itemType, setItemType] = useState<'thread' | 'post' | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is a moderator
  const { data: moderatorStatus, isLoading: isLoadingModeratorStatus } = useQuery<any>({
    queryKey: ['/api/discussions/moderators'],
    queryFn: () => apiRequest(`/api/discussions/moderators?userId=${user?.id}`),
    enabled: !!user?.id
  });
  
  // Fetch forums
  const { data: forums } = useQuery<any>({
    queryKey: ['/api/discussions/forums'],
    queryFn: () => apiRequest('/api/discussions/forums'),
    enabled: !!user
  });
  
  // Fetch pending threads
  const { data: pendingThreads, isLoading: isLoadingPendingThreads } = useQuery<any>({
    queryKey: ['/api/discussions/moderation/threads', 'pending'],
    queryFn: () => apiRequest('/api/discussions/moderation/threads?status=pending'),
    enabled: !!user && activeTab === 'pending'
  });
  
  // Fetch pending posts
  const { data: pendingPosts, isLoading: isLoadingPendingPosts } = useQuery<any>({
    queryKey: ['/api/discussions/moderation/posts', 'pending'],
    queryFn: () => apiRequest('/api/discussions/moderation/posts?status=pending'),
    enabled: !!user && activeTab === 'pending'
  });
  
  // Fetch reported content
  const { data: reportedContent, isLoading: isLoadingReportedContent } = useQuery<any>({
    queryKey: ['/api/discussions/reports'],
    queryFn: () => apiRequest('/api/discussions/reports'),
    enabled: !!user && activeTab === 'reported'
  });
  
  // Fetch moderators
  const { data: moderators, isLoading: isLoadingModerators } = useQuery<any>({
    queryKey: ['/api/discussions/moderators/all'],
    queryFn: () => apiRequest('/api/discussions/moderators/all'),
    enabled: !!user && activeTab === 'moderators'
  });
  
  // Add moderator mutation
  const addModeratorMutation = useMutation({
    mutationFn: (data: z.infer<typeof addModeratorSchema>) => {
      return apiRequest('/api/discussions/moderators', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/moderators/all'] });
      toast({
        title: "Moderator added",
        description: "The user has been added as a moderator.",
      });
      setAddModeratorOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error adding the moderator.",
        variant: "destructive",
      });
    }
  });
  
  // Moderate thread mutation
  const moderateThreadMutation = useMutation({
    mutationFn: ({ threadId, data }: { threadId: number, data: z.infer<typeof moderateContentSchema> }) => {
      return apiRequest(`/api/discussions/threads/${threadId}/moderate`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/moderation/threads'] });
      toast({
        title: "Thread moderated",
        description: "The thread has been moderated successfully.",
      });
      setModerateDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error moderating the thread.",
        variant: "destructive",
      });
    }
  });
  
  // Moderate post mutation
  const moderatePostMutation = useMutation({
    mutationFn: ({ postId, data }: { postId: number, data: z.infer<typeof moderateContentSchema> }) => {
      return apiRequest(`/api/discussions/posts/${postId}/moderate`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/moderation/posts'] });
      toast({
        title: "Post moderated",
        description: "The post has been moderated successfully.",
      });
      setModerateDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error moderating the post.",
        variant: "destructive",
      });
    }
  });
  
  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: (reportId: number) => {
      return apiRequest(`/api/discussions/reports/${reportId}/resolve`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/reports'] });
      toast({
        title: "Report resolved",
        description: "The report has been marked as resolved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error resolving the report.",
        variant: "destructive",
      });
    }
  });
  
  // Add moderator form
  const addModeratorForm = useForm<z.infer<typeof addModeratorSchema>>({
    resolver: zodResolver(addModeratorSchema),
    defaultValues: {
      userId: '',
      notes: '',
    },
  });
  
  // Moderate content form
  const moderateContentForm = useForm<z.infer<typeof moderateContentSchema>>({
    resolver: zodResolver(moderateContentSchema),
    defaultValues: {
      status: 'approved',
      notes: '',
    },
  });
  
  // Handle add moderator
  const onAddModerator = (values: z.infer<typeof addModeratorSchema>) => {
    addModeratorMutation.mutate(values);
  };
  
  // Handle moderate content
  const onModerateContent = (values: z.infer<typeof moderateContentSchema>) => {
    if (itemType === 'thread' && selectedItem) {
      moderateThreadMutation.mutate({ threadId: selectedItem.id, data: values });
    } else if (itemType === 'post' && selectedItem) {
      moderatePostMutation.mutate({ postId: selectedItem.id, data: values });
    }
  };
  
  // Open moderate dialog
  const openModerateDialog = (item: any, type: 'thread' | 'post') => {
    setSelectedItem(item);
    setItemType(type);
    moderateContentForm.reset({
      status: 'approved',
      notes: '',
    });
    setModerateDialogOpen(true);
  };
  
  // Check if user is a super moderator (access to add other moderators)
  const isSuperModerator = React.useMemo(() => {
    if (!moderatorStatus || moderatorStatus.length === 0) return false;
    return moderatorStatus.some((mod: any) => mod.forumId === null);
  }, [moderatorStatus]);
  
  // If not a moderator, show access denied
  if (!isLoadingModeratorStatus && (!moderatorStatus || moderatorStatus.length === 0)) {
    return (
      <div className="container py-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-[400px]">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You do not have moderator privileges to access this dashboard.
          </p>
          <Button variant="outline">
            <Link href="/discussions">Return to Discussions</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moderation Dashboard</h1>
            <p className="text-muted-foreground">
              Review, approve, and moderate forum content
            </p>
          </div>
          {isSuperModerator && (
            <Button onClick={() => setAddModeratorOpen(true)}>
              Add Moderator
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="pending">Pending Content</TabsTrigger>
            <TabsTrigger value="reported">Reported</TabsTrigger>
            <TabsTrigger value="moderators">Moderators</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="pending">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Pending Threads</h2>
                  {isLoadingPendingThreads ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : pendingThreads && pendingThreads.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Forum</TableHead>
                          <TableHead>Posted By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingThreads.map((thread: any) => (
                          <TableRow key={thread.id}>
                            <TableCell className="font-medium">{thread.title}</TableCell>
                            <TableCell>{thread.forumName}</TableCell>
                            <TableCell>User #{thread.userId}</TableCell>
                            <TableCell>{format(new Date(thread.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openModerateDialog(thread, 'thread')}
                                >
                                  Review
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 border rounded-md bg-muted/50">
                      <p>No pending threads to review</p>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h2 className="text-xl font-bold mb-4">Pending Posts</h2>
                  {isLoadingPendingPosts ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : pendingPosts && pendingPosts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Thread</TableHead>
                          <TableHead>Posted By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingPosts.map((post: any) => (
                          <TableRow key={post.id}>
                            <TableCell className="max-w-xs">
                              <div className="line-clamp-2">{post.content}</div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="line-clamp-1">{post.threadTitle}</div>
                            </TableCell>
                            <TableCell>User #{post.userId}</TableCell>
                            <TableCell>{format(new Date(post.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openModerateDialog(post, 'post')}
                                >
                                  Review
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 border rounded-md bg-muted/50">
                      <p>No pending posts to review</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reported">
              <div>
                <h2 className="text-xl font-bold mb-4">Reported Content</h2>
                {isLoadingReportedContent ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reportedContent && reportedContent.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Reported By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportedContent.map((report: any) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {report.contentType === 'thread' ? 'Thread' : 'Post'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs line-clamp-2">
                              {report.reason}
                            </div>
                          </TableCell>
                          <TableCell>User #{report.reportedBy}</TableCell>
                          <TableCell>{format(new Date(report.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={report.resolved ? "success" : "destructive"}>
                              {report.resolved ? 'Resolved' : 'Open'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const itemToReview = report.contentType === 'thread' 
                                    ? { id: report.contentId, title: report.contentPreview } 
                                    : { id: report.contentId, content: report.contentPreview };
                                  
                                  openModerateDialog(itemToReview, report.contentType as 'thread' | 'post');
                                }}
                              >
                                Review
                              </Button>
                              {!report.resolved && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => resolveReportMutation.mutate(report.id)}
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 border rounded-md bg-muted/50">
                    <p>No reported content</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="moderators">
              <div>
                <h2 className="text-xl font-bold mb-4">Moderators</h2>
                {isLoadingModerators ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : moderators && moderators.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Forum</TableHead>
                        <TableHead>Added By</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {moderators.map((mod: any) => (
                        <TableRow key={mod.id}>
                          <TableCell>{mod.userId}</TableCell>
                          <TableCell>
                            {mod.forumId 
                              ? forums?.find((f: any) => f.id === mod.forumId)?.name || `Forum #${mod.forumId}` 
                              : 'All Forums (Super Moderator)'}
                          </TableCell>
                          <TableCell>{mod.addedBy}</TableCell>
                          <TableCell>{format(new Date(mod.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="max-w-xs line-clamp-2">
                              {mod.notes || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 border rounded-md bg-muted/50">
                    <p>No moderators found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* Add Moderator Dialog */}
      <Dialog open={addModeratorOpen} onOpenChange={setAddModeratorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Moderator</DialogTitle>
          </DialogHeader>
          <Form {...addModeratorForm}>
            <form onSubmit={addModeratorForm.handleSubmit(onAddModerator)} className="space-y-4">
              <FormField
                control={addModeratorForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter user ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addModeratorForm.control}
                name="forumId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forum (Optional - leave blank for all forums)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a forum (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {forums && forums.map((forum: any) => (
                          <SelectItem key={forum.id} value={forum.id.toString()}>
                            {forum.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addModeratorForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add notes about this moderator" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModeratorOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addModeratorMutation.isPending}
                >
                  {addModeratorMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Moderator
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Moderate Content Dialog */}
      <Dialog open={moderateDialogOpen} onOpenChange={setModerateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {itemType === 'thread' ? 'Moderate Thread' : 'Moderate Post'}
            </DialogTitle>
            <DialogDescription>
              Review the content and take moderation action
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="border rounded-md p-4 mb-4 bg-muted/30">
              {itemType === 'thread' ? (
                <div>
                  <h3 className="font-bold">{selectedItem.title}</h3>
                  <p className="mt-2">{selectedItem.content}</p>
                </div>
              ) : (
                <div>
                  <p>{selectedItem.content}</p>
                </div>
              )}
            </div>
          )}
          
          <Form {...moderateContentForm}>
            <form onSubmit={moderateContentForm.handleSubmit(onModerateContent)} className="space-y-4">
              <FormField
                control={moderateContentForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moderation Decision</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="approved">
                          <div className="flex items-center">
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Approve
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center">
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            Reject
                          </div>
                        </SelectItem>
                        <SelectItem value="flagged">
                          <div className="flex items-center">
                            <Flag className="mr-2 h-4 w-4 text-yellow-500" />
                            Flag for Review
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={moderateContentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moderation Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add notes about your moderation decision" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModerateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={
                    itemType === 'thread' 
                      ? moderateThreadMutation.isPending 
                      : moderatePostMutation.isPending
                  }
                >
                  {(itemType === 'thread' ? moderateThreadMutation.isPending : moderatePostMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Decision
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModerationDashboard;