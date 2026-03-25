import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { useUser } from "@/context/user-context";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, SendIcon, PlusIcon, MessageSquareIcon, GraduationCap, Sparkles, 
  Megaphone, Users, UserPlus, Trash2, CheckCircle, ArrowRight, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getRoleIcon, 
  getRoleColor, 
  getRoleBgLightColor, 
  getRoleDisplayName,
  getLevelDisplayName
} from "@/lib/utils";

interface Assistant {
  id: number;
  userId: number;
  role: string;
  lastConversationAt: string;
  conversationCount: number;
  createdAt: string;
  settings: Record<string, any>;
}

interface Conversation {
  id: number;
  assistantId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Message {
  id: number;
  conversationId: number;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  metadata: Record<string, any>;
}

interface SuperUserRole {
  id: number;
  userId: number;
  role: string;
  level: number;
  progressToNextLevel: number;
  createdAt: string;
  updatedAt: string;
}

interface Assessment {
  overallScore: number;
  strengths: string[];
  growthAreas: string[];
  nextSteps: string[];
  feedback: string;
}

interface TrainingPlan {
  title: string;
  overview: string;
  modules: {
    title: string;
    description: string;
    activities: string[];
    resources: string[];
  }[];
  expectedOutcomes: string[];
  timeframe: string;
}

// Role icon mapping
const roleIcons = {
  catalyst: <Sparkles className="w-5 h-5" />,
  amplifier: <Megaphone className="w-5 h-5" />,
  convincer: <Users className="w-5 h-5" />
};

const AiAssistantPage: React.FC = () => {
  const [activeRole, setActiveRole] = useState<string>("catalyst");
  const [activeSections, setActiveSections] = useState<{ [key: string]: string }>({
    catalyst: "chat",
    amplifier: "chat",
    convincer: "chat"
  });
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState<string>("");
  const [newConversationTitle, setNewConversationTitle] = useState<string>("");
  const [showNewConversationDialog, setShowNewConversationDialog] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [, setLocation] = useLocation();

  // Fetch assistants
  const { data: assistants, isLoading: assistantsLoading } = useQuery<any>({
    queryKey: ["/api/assistants"],
    queryFn: async () => {
      const res = await apiRequest("/api/assistants");
      return await res.json() as Assistant[];
    },
    enabled: !!user,
  });

  // Fetch current assistant's super user role
  const { data: superUserRole } = useQuery<any>({
    queryKey: ["/api/super-user/roles", activeRole],
    queryFn: async () => {
      const res = await apiRequest(`/api/super-user/roles/${activeRole}`);
      return await res.json() as SuperUserRole;
    },
    enabled: !!user && !!activeRole,
  });

  // Fetch conversations for the selected role
  const { data: conversations, isLoading: conversationsLoading } = useQuery<any>({
    queryKey: ["/api/assistants", activeRole, "conversations"],
    queryFn: async () => {
      const assistant = assistants?.find((a: any) => a.role === activeRole);
      if (!assistant) return [];
      
      const res = await apiRequest(`/api/assistants/${assistant.id}/conversations`);
      return await res.json() as Conversation[];
    },
    enabled: !!assistants && !!activeRole,
  });

  // Fetch messages for the selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<any>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      const res = await apiRequest(`/api/conversations/${selectedConversation}/messages`);
      return await res.json() as Message[];
    },
    enabled: !!selectedConversation,
  });

  // Fetch skill assessment for the active role
  const { data: assessment, isLoading: assessmentLoading } = useQuery<any>({
    queryKey: ["/api/assistants", activeRole, "assessment"],
    queryFn: async () => {
      const res = await apiRequest(`/api/assistants/${activeRole}/assessment`);
      return await res.json() as Assessment;
    },
    enabled: !!activeRole && activeSections[activeRole] === "assessment",
  });

  // Fetch training plan for the active role
  const { data: trainingPlan, isLoading: trainingPlanLoading } = useQuery<any>({
    queryKey: ["/api/assistants", activeRole, "training-plan"],
    queryFn: async () => {
      const res = await apiRequest(`/api/assistants/${activeRole}/training-plan`);
      return await res.json() as TrainingPlan;
    },
    enabled: !!activeRole && activeSections[activeRole] === "training",
  });

  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const assistant = assistants?.find((a: any) => a.role === activeRole);
      if (!assistant) throw new Error("Assistant not found");
      
      const res = await apiRequest("/api/conversations", {
        method: "POST",
        data: {
          assistantId: assistant.id,
          title
        }
      });
      return await res.json() as Conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants", activeRole, "conversations"] });
      setSelectedConversation(newConversation.id);
      setShowNewConversationDialog(false);
      setNewConversationTitle("");
      
      toast({
        title: "Conversation created",
        description: "Your new conversation has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not create conversation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const res = await apiRequest(`/api/conversations/${conversationId}`, {
        method: "DELETE"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants", activeRole, "conversations"] });
      setSelectedConversation(null);
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not delete conversation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      const res = await apiRequest(`/api/conversations/${selectedConversation}/messages`, {
        method: "POST",
        data: {
          content
        }
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      setMessageInput("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Effect to scroll to bottom of message list when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Effect to select the first conversation if none is selected and we have conversations
  useEffect(() => {
    if (conversations?.length && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateConversation = () => {
    if (!newConversationTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the conversation.",
        variant: "destructive",
      });
      return;
    }
    
    createConversationMutation.mutate(newConversationTitle);
  };

  const handleDeleteConversation = (conversationId: number) => {
    deleteConversationMutation.mutate(conversationId);
  };

  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    setSelectedConversation(null);
  };

  const handleSectionChange = (section: string) => {
    setActiveSections({
      ...activeSections,
      [activeRole]: section
    });
  };

  if (assistantsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const assistant = assistants?.find((a: any) => a.role === activeRole);
  const roleColor = getRoleColor(activeRole);
  const roleBgLight = getRoleBgLightColor(activeRole);
  const roleIcon = roleIcons[activeRole as keyof typeof roleIcons] || <MessageSquareIcon className="w-5 h-5" />;

  return (
    <MainLayout>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Role Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Get personalized guidance and training from your role-specific assistants
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Your Roles</CardTitle>
                <CardDescription>
                  Select a role to chat with its assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assistants?.map((assistant: any) => {
                    const color = getRoleColor(assistant.role);
                    const bgLight = getRoleBgLightColor(assistant.role);
                    const icon = roleIcons[assistant.role as keyof typeof roleIcons] || <MessageSquareIcon className="w-5 h-5" />;
                    
                    return (
                      <Button
                        key={assistant.role}
                        variant={activeRole === assistant.role ? "default" : "outline"}
                        className={`w-full justify-start ${activeRole === assistant.role ? `bg-${color} hover:bg-${color}/90` : ''}`}
                        onClick={() => handleRoleChange(assistant.role)}
                      >
                        <div className={`mr-2 p-1 rounded-full ${activeRole === assistant.role ? 'bg-white/20' : `bg-${bgLight}`}`}>
                          {icon}
                        </div>
                        <span>{getRoleDisplayName(assistant.role)}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {superUserRole && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Your Progress</CardTitle>
                  <CardDescription>
                    {getRoleDisplayName(activeRole)} - Level {superUserRole.level}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{getLevelDisplayName(superUserRole.level, activeRole)}</span>
                        <span>{`${superUserRole.progressToNextLevel}%`}</span>
                      </div>
                      <Progress 
                        value={superUserRole.progressToNextLevel} 
                        className="h-2 bg-gray-200"
                        indicatorClassName={`bg-${roleColor}`}
                      />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Next level: {getLevelDisplayName(Math.min(4, superUserRole.level + 1), activeRole)}</p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => handleSectionChange("assessment")}
                      >
                        View skill assessment →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <Card className="h-full">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`mr-3 p-2 rounded-full bg-${roleBgLight}`}>
                      {roleIcon}
                    </div>
                    <div>
                      <CardTitle>{getRoleDisplayName(activeRole)} Assistant</CardTitle>
                      <CardDescription>Your AI coach for {getRoleDisplayName(activeRole).toLowerCase()} skills</CardDescription>
                    </div>
                  </div>
                  
                  <Tabs value={activeSections[activeRole]} onValueChange={handleSectionChange} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="chat">Chat</TabsTrigger>
                      <TabsTrigger value="assessment">Assessment</TabsTrigger>
                      <TabsTrigger value="training">Training</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <TabsContent value="chat" className="m-0">
                  <div className="flex h-[calc(80vh-13rem)]">
                    {/* Conversation List */}
                    <div className="w-60 border-r h-full flex flex-col">
                      <div className="p-4 border-b">
                        <Button 
                          onClick={() => setShowNewConversationDialog(true)} 
                          className="w-full"
                          variant="outline"
                        >
                          <PlusIcon className="mr-2 h-4 w-4" />
                          New Chat
                        </Button>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                          {conversationsLoading ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : conversations?.length === 0 ? (
                            <div className="text-center p-4 text-sm text-muted-foreground">
                              No conversations yet
                            </div>
                          ) : (
                            conversations?.map((convo: any) => (
                              <div key={convo.id} className="group flex justify-between">
                                <Button
                                  variant={selectedConversation === convo.id ? "secondary" : "ghost"}
                                  className="w-full justify-start text-left h-auto py-2 truncate"
                                  onClick={() => setSelectedConversation(convo.id)}
                                >
                                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                                  <span className="truncate text-sm">{convo.title}</span>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="px-2 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete conversation</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this conversation. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteConversation(convo.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col h-full">
                      {!selectedConversation ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <div className={`p-4 rounded-full bg-${roleBgLight} mb-4`}>
                            {roleIcon}
                          </div>
                          <h3 className="text-lg font-medium mb-2">Start a new conversation</h3>
                          <p className="text-muted-foreground mb-6 max-w-md">
                            Chat with your {getRoleDisplayName(activeRole)} assistant to get guidance, 
                            training, and skill development for your civic engagement role.
                          </p>
                          <Button onClick={() => setShowNewConversationDialog(true)}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            New Conversation
                          </Button>
                        </div>
                      ) : (
                        <>
                          <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                              {messagesLoading ? (
                                <div className="flex justify-center p-4">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                              ) : messages?.length === 0 ? (
                                <div className="text-center p-4 text-sm text-muted-foreground">
                                  Start the conversation by sending a message
                                </div>
                              ) : (
                                messages?.map((message: any) => (
                                  <div 
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-3xl`}>
                                      <Avatar className={`${message.role === 'user' ? 'ml-3' : 'mr-3'} h-8 w-8`}>
                                        <AvatarFallback className={message.role === 'assistant' ? `bg-${roleColor} text-white` : ''}>
                                          {message.role === 'user' ? 'U' : roleIcon}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                              <div ref={messagesEndRef} />
                            </div>
                          </ScrollArea>
                          
                          <div className="p-4 border-t">
                            <div className="flex items-center gap-2">
                              <Input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1"
                                disabled={sendMessageMutation.isPending}
                              />
                              <Button 
                                onClick={handleSendMessage} 
                                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                              >
                                {sendMessageMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <SendIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assessment" className="m-0">
                  <div className="p-6 h-[calc(80vh-13rem)] overflow-auto">
                    {assessmentLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                      </div>
                    ) : assessment ? (
                      <div className="space-y-6">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-bold mb-2">Skill Assessment</h2>
                          <p className="text-muted-foreground">Your personalized {getRoleDisplayName(activeRole)} skill assessment</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Overall Score</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                              <div className={`inline-flex items-center justify-center rounded-full w-24 h-24 text-2xl font-bold text-white bg-${roleColor}`}>
                                {assessment.overallScore}
                              </div>
                              <p className="mt-4 text-sm text-muted-foreground">
                                {assessment.overallScore < 30 ? "Beginner" : 
                                assessment.overallScore < 60 ? "Intermediate" :
                                assessment.overallScore < 80 ? "Advanced" : "Expert"}
                              </p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle>Key Strengths</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {assessment.strengths.map((strength: any, index: any) => (
                                  <li key={index} className="flex items-start">
                                    <CheckCircle className="text-green-500 h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Areas for Growth</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {assessment.growthAreas.map((area: any, index: any) => (
                                <li key={index} className="flex items-start">
                                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mr-2 flex-shrink-0">
                                    {index + 1}
                                  </span>
                                  <span>{area}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Feedback</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {assessment.feedback}
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Recommended Next Steps</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {assessment.nextSteps.map((step: any, index: any) => (
                                <li key={index} className="flex items-start">
                                  <ArrowRight className={`text-${roleColor} h-5 w-5 mr-2 mt-0.5 flex-shrink-0`} />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter className="flex justify-end border-t pt-4">
                            <Button onClick={() => handleSectionChange("training")}>
                              View Training Plan
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">Assessment could not be loaded</p>
                        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/assistants", activeRole, "assessment"] })} className="mt-4">
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="training" className="m-0">
                  <div className="p-6 h-[calc(80vh-13rem)] overflow-auto">
                    {trainingPlanLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                      </div>
                    ) : trainingPlan ? (
                      <div className="space-y-6">
                        <div className="text-center mb-8">
                          <div className={`inline-flex items-center justify-center rounded-full p-3 mb-4 bg-${roleBgLight}`}>
                            <GraduationCap className={`h-8 w-8 text-${roleColor}`} />
                          </div>
                          <h2 className="text-2xl font-bold mb-2">{trainingPlan.title}</h2>
                          <p className="text-muted-foreground max-w-2xl mx-auto">
                            {trainingPlan.overview}
                          </p>
                          <div className="mt-4 inline-block">
                            <Badge variant="outline" className="text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              {trainingPlan.timeframe}
                            </Badge>
                          </div>
                        </div>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Expected Outcomes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {trainingPlan.expectedOutcomes.map((outcome: any, index: any) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className={`text-${roleColor} h-5 w-5 mr-2 mt-0.5 flex-shrink-0`} />
                                  <span>{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <div className="space-y-6">
                          <h3 className="text-xl font-bold">Training Modules</h3>
                          {trainingPlan.modules.map((module: any, index: any) => (
                            <Card key={index}>
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="secondary" className={`bg-${roleBgLight}`}>
                                        Module {index + 1}
                                      </Badge>
                                    </div>
                                    <CardTitle>{module.title}</CardTitle>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <p className="text-muted-foreground">
                                  {module.description}
                                </p>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Activities</h4>
                                  <ul className="space-y-2">
                                    {module.activities.map((activity: any, idx: any) => (
                                      <li key={idx} className="flex items-start">
                                        <span className={`w-6 h-6 rounded-full bg-${roleBgLight} text-${roleColor} flex items-center justify-center mr-2 flex-shrink-0`}>
                                          {idx + 1}
                                        </span>
                                        <span>{activity}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Resources</h4>
                                  <ul className="space-y-2">
                                    {module.resources.map((resource: any, idx: any) => (
                                      <li key={idx} className="flex items-start">
                                        <Sparkles className="h-5 w-5 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                                        <span>{resource}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </CardContent>
                              <CardFooter className="border-t">
                                <Button variant="secondary" className="w-full" onClick={() => handleSectionChange("chat")}>
                                  Discuss this module with your assistant
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">Training plan could not be loaded</p>
                        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/assistants", activeRole, "training-plan"] })} className="mt-4">
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a new conversation with your {getRoleDisplayName(activeRole)} assistant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="conversationTitle" className="text-sm font-medium">
                Conversation Title
              </label>
              <Input
                id="conversationTitle"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                placeholder="Enter a title for this conversation"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConversationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation} disabled={createConversationMutation.isPending}>
              {createConversationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusIcon className="h-4 w-4 mr-2" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AiAssistantPage;