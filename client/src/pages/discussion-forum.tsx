import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Loader2, MessageCircle, PlusCircle, Shield, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ForumTypeIcons: Record<string, React.ReactNode> = {
  'general': <MessageCircle className="mr-2 h-4 w-4" />,
  'legislation': <Shield className="mr-2 h-4 w-4" />,
  'action': <PlusCircle className="mr-2 h-4 w-4" />,
  'feedback': <MessageCircle className="mr-2 h-4 w-4" />,
  'question': <MessageCircle className="mr-2 h-4 w-4" />,
  'announcement': <MessageCircle className="mr-2 h-4 w-4" />,
};

// Form schema for creating a forum
const createForumSchema = z.object({
  name: z.string().min(3, { message: "Forum name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.enum(['general', 'legislation', 'action', 'feedback', 'question', 'announcement']),
  visibility: z.enum(['public', 'private', 'circle']),
  circleId: z.number().optional(),
  billId: z.string().optional(),
});

// Form schema for creating a thread
const createThreadSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
});

const DiscussionForum: React.FC = () => {
  const [activeTab, setActiveTab] = useState('public');
  const [createForumOpen, setCreateForumOpen] = useState(false);
  const [selectedForum, setSelectedForum] = useState<number | null>(null);
  const [createThreadOpen, setCreateThreadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch forums based on active tab
  const { data: forums, isLoading: isLoadingForums } = useQuery<any>({
    queryKey: ['/api/discussions/forums', activeTab],
    queryFn: () => {
      const params = new URLSearchParams();
      
      if (activeTab === 'mine' && user?.id) {
        params.append('userId', user.id.toString());
      } else if (activeTab === 'circles' && user?.id) {
        params.append('visibility', 'circle');
      } else {
        params.append('visibility', 'public');
      }
      
      return apiRequest(`/api/discussions/forums?${params.toString()}`);
    },
    enabled: !!user
  });
  
  // Fetch circles for the user
  const { data: actionCircles } = useQuery<any>({
    queryKey: ['/api/action-circles'],
    queryFn: () => apiRequest('/api/action-circles'),
    enabled: !!user
  });
  
  // Fetch user moderator status
  const { data: moderatorStatus } = useQuery<any>({
    queryKey: ['/api/discussions/moderators'],
    queryFn: () => apiRequest(`/api/discussions/moderators?userId=${user?.id}`),
    enabled: !!user?.id
  });
  
  // Fetch threads for selected forum
  const { data: threads, isLoading: isLoadingThreads } = useQuery<any>({
    queryKey: ['/api/discussions/forums', selectedForum, 'threads'],
    queryFn: () => apiRequest(`/api/discussions/forums/${selectedForum}/threads`),
    enabled: !!selectedForum
  });
  
  // Create forum mutation
  const createForumMutation = useMutation({
    mutationFn: (data: z.infer<typeof createForumSchema>) => {
      return apiRequest('/api/discussions/forums', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/forums'] });
      toast({
        title: "Forum created",
        description: "Your forum has been created successfully.",
      });
      setCreateForumOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error creating the forum.",
        variant: "destructive",
      });
    }
  });
  
  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: (data: z.infer<typeof createThreadSchema>) => {
      return apiRequest(`/api/discussions/forums/${selectedForum}/threads`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/forums', selectedForum, 'threads'] });
      toast({
        title: "Thread created",
        description: "Your thread has been created successfully.",
      });
      setCreateThreadOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error creating the thread.",
        variant: "destructive",
      });
    }
  });
  
  // Forum creation form
  const createForumForm = useForm<z.infer<typeof createForumSchema>>({
    resolver: zodResolver(createForumSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'general',
      visibility: 'public',
    },
  });
  
  // Thread creation form
  const createThreadForm = useForm<z.infer<typeof createThreadSchema>>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });
  
  // Handle forum creation
  const onCreateForum = (values: z.infer<typeof createForumSchema>) => {
    createForumMutation.mutate(values);
  };
  
  // Handle thread creation
  const onCreateThread = (values: z.infer<typeof createThreadSchema>) => {
    createThreadMutation.mutate(values);
  };
  
  // Filter forums based on search query
  const filteredForums = React.useMemo(() => {
    if (!forums) return [];
    
    if (!searchQuery) return forums;
    
    return forums.filter((forum: any) => 
      forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forum.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [forums, searchQuery]);
  
  // Reset selected forum when changing tabs
  useEffect(() => {
    setSelectedForum(null);
  }, [activeTab]);
  
  // Reset thread form when opening dialog
  useEffect(() => {
    if (createThreadOpen) {
      createThreadForm.reset({
        title: '',
        content: '',
      });
    }
  }, [createThreadOpen, createThreadForm]);
  
  // Reset forum form when opening dialog
  useEffect(() => {
    if (createForumOpen) {
      createForumForm.reset({
        name: '',
        description: '',
        category: 'general',
        visibility: 'public',
      });
    }
  }, [createForumOpen, createForumForm]);
  
  // Check if user is a moderator
  const isModerator = React.useMemo(() => {
    return moderatorStatus && moderatorStatus.length > 0;
  }, [moderatorStatus]);
  
  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discussion Forums</h1>
            <p className="text-muted-foreground">
              Connect with others, share ideas, and discuss legislation and civic actions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCreateForumOpen(true)}>
              Create Forum
            </Button>
            {isModerator && (
              <Button variant="outline">
                <Link href="/discussions/moderation">Moderation Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-[250px_1fr]">
          {/* Left sidebar with forums list */}
          <div className="flex flex-col gap-4">
            <div className="sticky top-4">
              <Tabs defaultValue="public" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="public">Public</TabsTrigger>
                  <TabsTrigger value="circles">Circles</TabsTrigger>
                  <TabsTrigger value="mine">My Forums</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="my-4">
                <Input
                  placeholder="Search forums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 mt-4">
                {isLoadingForums ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredForums && filteredForums.length > 0 ? (
                  filteredForums.map((forum: any) => (
                    <div
                      key={forum.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-accent ${
                        selectedForum === forum.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedForum(forum.id)}
                    >
                      <div className="flex items-center">
                        {ForumTypeIcons[forum.category] || <MessageCircle className="mr-2 h-4 w-4" />}
                        <span className="font-medium">{forum.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {forum.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{forum.category}</Badge>
                        <Badge variant="secondary">{forum.totalThreads} threads</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No forums found
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div>
            {selectedForum ? (
              <div className="space-y-4">
                {forums && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {forums.find((f: any) => f.id === selectedForum)?.name}
                      </h2>
                      <p className="text-muted-foreground">
                        {forums.find((f: any) => f.id === selectedForum)?.description}
                      </p>
                    </div>
                    <Button onClick={() => setCreateThreadOpen(true)}>
                      New Thread
                    </Button>
                  </div>
                )}
                
                <Separator />
                
                {isLoadingThreads ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : threads && threads.length > 0 ? (
                  <div className="space-y-4">
                    {threads.map((thread: any) => (
                      <Card key={thread.id}>
                        <CardHeader>
                          <CardTitle>
                            <Link href={`/discussions/thread/${thread.id}`}>
                              {thread.title}
                            </Link>
                          </CardTitle>
                          <CardDescription>
                            Posted by {thread.userId} • {format(new Date(thread.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="line-clamp-3">{thread.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{thread.totalReplies} replies</Badge>
                            {thread.isPinned && <Badge>Pinned</Badge>}
                            {thread.isLocked && <Badge variant="destructive">Locked</Badge>}
                          </div>
                          <Button variant="ghost" size="sm">
                            <Link href={`/discussions/thread/${thread.id}`}>
                              View Thread
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <h3 className="text-lg font-medium">No threads yet</h3>
                    <p className="text-muted-foreground mt-2">
                      Be the first to start a discussion in this forum.
                    </p>
                    <Button onClick={() => setCreateThreadOpen(true)} className="mt-4">
                      Start a Thread
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px]">
                <h2 className="text-2xl font-bold">Select a Forum</h2>
                <p className="text-muted-foreground mt-2">
                  Choose a forum from the list to see its threads
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Forum Dialog */}
      <Dialog open={createForumOpen} onOpenChange={setCreateForumOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create a New Forum</DialogTitle>
          </DialogHeader>
          <Form {...createForumForm}>
            <form onSubmit={createForumForm.handleSubmit(onCreateForum)} className="space-y-4">
              <FormField
                control={createForumForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forum Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name for your forum" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForumForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this forum is about" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForumForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General Discussion</SelectItem>
                        <SelectItem value="legislation">Legislation</SelectItem>
                        <SelectItem value="action">Civic Action</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="question">Questions</SelectItem>
                        <SelectItem value="announcement">Announcements</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForumForm.control}
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
                        <SelectItem value="public">Public (Everyone can see)</SelectItem>
                        <SelectItem value="private">Private (Only invited users)</SelectItem>
                        <SelectItem value="circle">Action Circle (Only circle members)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {createForumForm.watch('visibility') === 'circle' && (
                <FormField
                  control={createForumForm.control}
                  name="circleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Action Circle</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an action circle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {actionCircles && actionCircles.map((circle: any) => (
                            <SelectItem key={circle.id} value={circle.id.toString()}>
                              {circle.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {createForumForm.watch('category') === 'legislation' && (
                <FormField
                  control={createForumForm.control}
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
              )}
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createForumMutation.isPending}>
                  {createForumMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Forum
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create Thread Dialog */}
      <Dialog open={createThreadOpen} onOpenChange={setCreateThreadOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create a New Thread</DialogTitle>
          </DialogHeader>
          <Form {...createThreadForm}>
            <form onSubmit={createThreadForm.handleSubmit(onCreateThread)} className="space-y-4">
              <FormField
                control={createThreadForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thread Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Title of your thread" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createThreadForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your post here" 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createThreadMutation.isPending}>
                  {createThreadMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Thread
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscussionForum;