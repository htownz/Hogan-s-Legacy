import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MoveRight, 
  Users,
  MessageSquareText,
  Phone, 
  Mail, 
  FileText, 
  Calendar,
  PlusCircle, 
  BarChart3,
  Target,
  Award,
  Check,
  Clock,
  Building2,
  UserCog2,
  User2,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types for Team Lobbying Dashboard
interface TeamGoal {
  id: number;
  title: string;
  description: string;
  circleId: number;
  circleName: string;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
}

interface ActionCircle {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  owner: {
    id: number;
    username: string;
    displayName: string | null;
  };
}

interface CircleMember {
  id: number;
  userId: number;
  username: string;
  displayName: string | null;
  role: string;
  status: string;
  joinedAt: string;
  avatarUrl?: string | null;
}

interface TeamAssignment {
  id: number;
  userId: number;
  teamGoalId: number;
  role: string;
  status: string;
  notes: string | null;
  assignedAt: string;
  completedAt: string | null;
}

interface LobbyingActivity {
  id: number;
  userId: number;
  username: string;
  displayName: string | null;
  billId: string;
  billTitle: string;
  type: string;
  contactMethod: string;
  contactName: string | null;
  outcome: string;
  notes: string | null;
  date: string;
  teamGoalId: number | null;
}

// Form interfaces
interface ActivityFormData {
  teamGoalId: number | null;
  billId: string;
  type: string;
  contactMethod: string;
  contactName: string;
  outcome: string;
  notes: string;
  date: string;
}

interface AssignmentFormData {
  userId: number;
  teamGoalId: number;
  role: string;
  notes: string | null;
}

const TeamLobbyingDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedCircle, setSelectedCircle] = useState<ActionCircle | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<TeamGoal | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  // Form state
  const [activityForm, setActivityForm] = useState<ActivityFormData>({
    teamGoalId: null,
    billId: '',
    type: '',
    contactMethod: '',
    contactName: '',
    outcome: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormData>({
    userId: 0,
    teamGoalId: 0,
    role: '',
    notes: null
  });
  
  // Queries
  const { data: actionCircles, isLoading: loadingCircles } = useQuery<any>({
    queryKey: ['/api/action-circles']
  });
  
  const { data: teamGoals, isLoading: loadingGoals } = useQuery<any>({
    queryKey: ['/api/action-circles', selectedCircle?.id, 'goals'],
    enabled: !!selectedCircle?.id
  });
  
  const { data: circleMembers, isLoading: loadingMembers } = useQuery<any>({
    queryKey: ['/api/action-circles', selectedCircle?.id, 'members'],
    enabled: !!selectedCircle?.id
  });
  
  const { data: goalAssignments, isLoading: loadingAssignments } = useQuery<any>({
    queryKey: ['/api/action-circles/goals', selectedGoal?.id, 'assignments'],
    enabled: !!selectedGoal?.id
  });
  
  const { data: lobbyingActivities, isLoading: loadingActivities } = useQuery<any>({
    queryKey: ['/api/lobbying/activities', { teamGoalId: selectedGoal?.id }],
    enabled: !!selectedGoal?.id
  });
  
  const { data: trackableBills, isLoading: loadingBills } = useQuery<any>({
    queryKey: ['/api/bills', { limit: 20 }]
  });
  
  // Mutations
  const createActivityMutation = useMutation({
    mutationFn: (activity: ActivityFormData) => 
      apiRequest('/api/lobbying/activities', 'POST', activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lobbying/activities'] });
      setActivityDialogOpen(false);
      resetActivityForm();
    }
  });
  
  const createAssignmentMutation = useMutation({
    mutationFn: (assignment: AssignmentFormData) => 
      apiRequest(`/api/action-circles/goals/${assignment.teamGoalId}/assignments`, 'POST', assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/action-circles/goals', selectedGoal?.id, 'assignments'] });
      setAssignDialogOpen(false);
      resetAssignmentForm();
    }
  });
  
  const completeAssignmentMutation = useMutation({
    mutationFn: (assignmentId: number) => 
      apiRequest(`/api/action-circles/assignments/${assignmentId}`, 'PATCH', { status: 'completed', completedAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/action-circles/goals', selectedGoal?.id, 'assignments'] });
    }
  });
  
  // Helpers
  const resetActivityForm = () => {
    setActivityForm({
      teamGoalId: selectedGoal?.id || null,
      billId: '',
      type: '',
      contactMethod: '',
      contactName: '',
      outcome: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };
  
  const resetAssignmentForm = () => {
    setAssignmentForm({
      userId: 0,
      teamGoalId: selectedGoal?.id || 0,
      role: '',
      notes: null
    });
  };
  
  const handleCreateActivity = () => {
    createActivityMutation.mutate(activityForm);
  };
  
  const handleCreateAssignment = () => {
    createAssignmentMutation.mutate(assignmentForm);
  };
  
  const handleCompleteAssignment = (assignmentId: number) => {
    completeAssignmentMutation.mutate(assignmentId);
  };
  
  const handleOpenActivityDialog = () => {
    setActivityForm({
      ...activityForm,
      teamGoalId: selectedGoal?.id || null
    });
    setActivityDialogOpen(true);
  };
  
  const handleOpenAssignDialog = () => {
    setAssignmentForm({
      ...assignmentForm,
      teamGoalId: selectedGoal?.id || 0,
    });
    setAssignDialogOpen(true);
  };
  
  // Render functions
  const renderCircleCard = (circle: ActionCircle) => {
    const isSelected = selectedCircle?.id === circle.id;
    
    return (
      <Card 
        key={circle.id} 
        className={`mb-4 cursor-pointer ${isSelected ? 'border-primary' : ''}`}
        onClick={() => {
          setSelectedCircle(circle);
          setSelectedGoal(null);
        }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            {circle.name}
          </CardTitle>
          <CardDescription className="text-sm line-clamp-2">
            {circle.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            {circle.memberCount} members
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center text-sm">
            <UserCog2 className="mr-2 h-4 w-4" />
            Lead: {circle.owner.displayName || circle.owner.username}
          </div>
        </CardFooter>
      </Card>
    );
  };
  
  const renderGoalCard = (goal: TeamGoal) => {
    const isSelected = selectedGoal?.id === goal.id;
    
    return (
      <Card 
        key={goal.id} 
        className={`mb-4 cursor-pointer ${isSelected ? 'border-primary' : ''}`}
        onClick={() => setSelectedGoal(goal)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <CardTitle className="text-base">{goal.title}</CardTitle>
            <Badge variant={
              goal.status === 'completed' ? 'default' : 
              goal.status === 'abandoned' ? 'destructive' : 'secondary'
            }>
              {goal.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2" 
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {goal.description}
          </p>
        </CardContent>
      </Card>
    );
  };
  
  const renderAssignmentCard = (assignment: TeamAssignment, member?: CircleMember) => {
    return (
      <Card key={assignment.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={member?.avatarUrl || ''} alt={member?.displayName || member?.username || ''} />
                <AvatarFallback>
                  {(member?.displayName || member?.username || '?').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">
                  {member?.displayName || member?.username || 'Unknown User'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {assignment.role}
                </div>
              </div>
            </div>
            <Badge variant={
              assignment.status === 'completed' ? 'default' : 
              assignment.status === 'in-progress' ? 'secondary' : 'outline'
            }>
              {assignment.status}
            </Badge>
          </div>
        </CardHeader>
        {assignment.notes && (
          <CardContent className="py-0">
            <p className="text-xs text-muted-foreground">{assignment.notes}</p>
          </CardContent>
        )}
        <CardFooter className="pt-2 flex justify-between">
          <div className="text-xs text-muted-foreground">
            <Calendar className="inline mr-1 h-3 w-3" />
            {new Date(assignment.assignedAt).toLocaleDateString()}
          </div>
          {assignment.status !== 'completed' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleCompleteAssignment(assignment.id)}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Complete
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  const renderActivityCard = (activity: LobbyingActivity) => {
    return (
      <Card key={activity.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">{activity.billTitle}</CardTitle>
            <Badge>
              {activity.outcome}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {activity.type} via {activity.contactMethod}
            {activity.contactName && ` with ${activity.contactName}`}
          </CardDescription>
        </CardHeader>
        {activity.notes && (
          <CardContent className="py-0">
            <p className="text-xs text-muted-foreground">{activity.notes}</p>
          </CardContent>
        )}
        <CardFooter className="pt-2 flex justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <User2 className="mr-1 h-3 w-3" />
            {activity.displayName || activity.username}
          </div>
          <div className="text-xs text-muted-foreground">
            <Calendar className="inline mr-1 h-3 w-3" />
            {new Date(activity.date).toLocaleDateString()}
          </div>
        </CardFooter>
      </Card>
    );
  };
  
  const getActivityIcon = (contactMethod: string) => {
    switch (contactMethod) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'in-person':
        return <Users className="h-4 w-4" />;
      case 'written':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquareText className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div className="col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Action Circles</CardTitle>
            <CardDescription>
              Coordinate efforts with your teams
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3">
            <ScrollArea className="h-[550px] px-3">
              {loadingCircles ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading action circles...</p>
                </div>
              ) : actionCircles && actionCircles.length > 0 ? (
                actionCircles.map((circle: ActionCircle) => renderCircleCard(circle))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">You're not part of any action circles yet.</p>
                  <Button size="sm">
                    Create Circle
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <div className="col-span-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Goals</CardTitle>
              {selectedCircle && (
                <Button size="sm" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Goal
                </Button>
              )}
            </div>
            <CardDescription>
              {selectedCircle 
                ? `Goals for ${selectedCircle.name}`
                : 'Select an action circle'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3">
            <ScrollArea className="h-[550px] px-3">
              {!selectedCircle ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Select an action circle to view team goals
                  </p>
                </div>
              ) : loadingGoals ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading team goals...</p>
                </div>
              ) : teamGoals && teamGoals.length > 0 ? (
                teamGoals.map((goal: TeamGoal) => renderGoalCard(goal))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Target className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">No team goals created yet.</p>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Goal
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <div className="col-span-3">
        {selectedGoal ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedGoal.title}</CardTitle>
                  <CardDescription>
                    {selectedGoal.description}
                  </CardDescription>
                </div>
                <Badge variant={
                  selectedGoal.status === 'completed' ? 'default' : 
                  selectedGoal.status === 'abandoned' ? 'destructive' : 'secondary'
                }>
                  {selectedGoal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center mb-1 text-sm">
                  <h3 className="font-semibold">Team Progress</h3>
                  <span>{selectedGoal.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary rounded-full h-2.5" 
                    style={{ width: `${selectedGoal.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Member Assignments</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleOpenAssignDialog}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Assign Member
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[350px] pr-4">
                    {loadingAssignments ? (
                      <div className="flex justify-center items-center h-32">
                        <p>Loading assignments...</p>
                      </div>
                    ) : goalAssignments && goalAssignments.length > 0 ? (
                      goalAssignments.map((assignment: TeamAssignment) => {
                        const member = circleMembers?.find(
                          (m: CircleMember) => m.userId === assignment.userId
                        );
                        return renderAssignmentCard(assignment, member);
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <UserCog2 className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground mb-4">No members assigned yet.</p>
                        <Button 
                          size="sm"
                          onClick={handleOpenAssignDialog}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Assign First Member
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Lobbying Activities</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleOpenActivityDialog}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Log Activity
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[350px] pr-4">
                    {loadingActivities ? (
                      <div className="flex justify-center items-center h-32">
                        <p>Loading activities...</p>
                      </div>
                    ) : lobbyingActivities && lobbyingActivities.length > 0 ? (
                      lobbyingActivities.map((activity: LobbyingActivity) => renderActivityCard(activity))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <MessageSquareText className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground mb-4">No lobbying activities recorded yet.</p>
                        <Button 
                          size="sm"
                          onClick={handleOpenActivityDialog}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Log First Activity
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Impact Statistics</h3>
                  <Badge variant="outline" className="font-normal">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Activity Metrics
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center space-y-1">
                      <MessageSquareText className="h-5 w-5 text-primary mb-1" />
                      <div className="text-2xl font-bold">
                        {lobbyingActivities?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Total Activities
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center space-y-1">
                      <Check className="h-5 w-5 text-green-500 mb-1" />
                      <div className="text-2xl font-bold">
                        {lobbyingActivities?.filter((a: any) => a.outcome === 'successful')?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Successful Contacts
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center space-y-1">
                      <Award className="h-5 w-5 text-amber-500 mb-1" />
                      <div className="text-2xl font-bold">
                        {goalAssignments?.filter((a: any) => a.status === 'completed')?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Completed Assignments
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Team Goal</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Choose a team goal to view assignments, track lobbying activities, and measure impact.
              </p>
              {selectedCircle ? (
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Team Goal
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  First, select an action circle from the left panel
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
      
      {/* Log Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Lobbying Activity</DialogTitle>
            <DialogDescription>
              Record details about your contact with a representative or official.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activity-bill">Related Bill</Label>
              <Select 
                onValueChange={(value) => setActivityForm({...activityForm, billId: value})}
                value={activityForm.billId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bill" />
                </SelectTrigger>
                <SelectContent>
                  {loadingBills ? (
                    <SelectItem value="loading" disabled>Loading bills...</SelectItem>
                  ) : trackableBills && trackableBills.length > 0 ? (
                    trackableBills.map((bill: any) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No bills available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select 
                onValueChange={(value) => setActivityForm({...activityForm, type: value})}
                value={activityForm.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advocacy">Advocacy/Lobbying</SelectItem>
                  <SelectItem value="testimony">Public Testimony</SelectItem>
                  <SelectItem value="meeting">Meeting/Discussion</SelectItem>
                  <SelectItem value="comment">Formal Comment</SelectItem>
                  <SelectItem value="townhall">Town Hall Participation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity-contact-method">Contact Method</Label>
              <Select 
                onValueChange={(value) => setActivityForm({...activityForm, contactMethod: value})}
                value={activityForm.contactMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did you make contact?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="in-person">In Person</SelectItem>
                  <SelectItem value="written">Written Letter</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity-contact-name">Contact Name (Optional)</Label>
              <Input 
                id="activity-contact-name" 
                placeholder="Who did you contact?"
                value={activityForm.contactName}
                onChange={(e) => setActivityForm({...activityForm, contactName: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity-outcome">Outcome</Label>
              <Select 
                onValueChange={(value) => setActivityForm({...activityForm, outcome: value})}
                value={activityForm.outcome}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What was the result?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="neutral">Neutral/Informational</SelectItem>
                  <SelectItem value="pending">Response Pending</SelectItem>
                  <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity-date">Date</Label>
              <Input 
                id="activity-date" 
                type="date"
                value={activityForm.date}
                onChange={(e) => setActivityForm({...activityForm, date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity-notes">Notes (Optional)</Label>
              <Textarea 
                id="activity-notes" 
                placeholder="Any details about the interaction"
                value={activityForm.notes}
                onChange={(e) => setActivityForm({...activityForm, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateActivity}
              disabled={!activityForm.billId || !activityForm.type || !activityForm.contactMethod || !activityForm.outcome}
            >
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Member Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
            <DialogDescription>
              Assign a member to this team goal with a specific role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-member">Team Member</Label>
              <Select 
                onValueChange={(value) => setAssignmentForm({...assignmentForm, userId: parseInt(value)})}
                value={assignmentForm.userId.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {loadingMembers ? (
                    <SelectItem value="loading" disabled>Loading members...</SelectItem>
                  ) : circleMembers && circleMembers.length > 0 ? (
                    circleMembers
                      .filter((member: CircleMember) => 
                        // Filter out members already assigned to this goal
                        !goalAssignments?.some((a: TeamAssignment) => a.userId === member.userId)
                      )
                      .map((member: CircleMember) => (
                        <SelectItem key={member.userId} value={member.userId.toString()}>
                          {member.displayName || member.username}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="none" disabled>No members available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignment-role">Role</Label>
              <Select 
                onValueChange={(value) => setAssignmentForm({...assignmentForm, role: value})}
                value={assignmentForm.role}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="researcher">Researcher</SelectItem>
                  <SelectItem value="advocate">Advocate</SelectItem>
                  <SelectItem value="outreach">Outreach</SelectItem>
                  <SelectItem value="social-media">Social Media</SelectItem>
                  <SelectItem value="policy-writer">Policy Writer</SelectItem>
                  <SelectItem value="supporter">Supporter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignment-notes">Notes (Optional)</Label>
              <Textarea 
                id="assignment-notes" 
                placeholder="Any additional details about this assignment"
                value={assignmentForm.notes || ''}
                onChange={(e) => setAssignmentForm({...assignmentForm, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateAssignment}
              disabled={!assignmentForm.userId || !assignmentForm.role}
            >
              Assign Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamLobbyingDashboard;