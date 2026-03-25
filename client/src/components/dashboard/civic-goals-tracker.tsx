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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  PlusCircle, 
  CheckCircle2, 
  AlarmClock, 
  MoreVertical, 
  Trash2, 
  Pencil,
  Calendar,
  Users,
  FileText,
  Target,
  Award,
  CheckSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Types for Civic Goals Tracker
interface Goal {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  isPublic: boolean;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
}

interface Milestone {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string | null;
  goalId: number;
}

interface TeamGoal {
  id: number;
  title: string;
  circleId: number;
  circleName: string;
  description: string;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
}

interface Assignment {
  id: number;
  status: string;
  role: string;
  teamGoalId: number;
  teamGoalTitle: string;
  circleName: string;
  assignedAt: string;
  completedAt: string | null;
}

// Form types
interface GoalFormData {
  title: string;
  description: string;
  targetDate: string;
  isPublic: boolean;
}

interface MilestoneFormData {
  title: string;
  dueDate: string;
  goalId: number;
}

const CivicGoalsTracker = () => {
  const queryClient = useQueryClient();
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form state
  const [goalForm, setGoalForm] = useState<GoalFormData>({
    title: '',
    description: '',
    targetDate: '',
    isPublic: false
  });
  
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
    title: '',
    dueDate: '',
    goalId: 0
  });
  
  // Queries
  const { data: personalGoals, isLoading: loadingPersonalGoals } = useQuery<any>({
    queryKey: ['/api/goals'],
    enabled: activeTab === 'personal' 
  });
  
  const { data: publicGoals, isLoading: loadingPublicGoals } = useQuery<any>({
    queryKey: ['/api/goals/public/list'],
    enabled: activeTab === 'inspiration'
  });
  
  const { data: teamAssignments, isLoading: loadingTeamAssignments } = useQuery<any>({
    queryKey: ['/api/users/me/assignments'],
    enabled: activeTab === 'team'
  });
  
  const { data: milestones, isLoading: loadingMilestones } = useQuery<any>({
    queryKey: ['/api/goals', activeGoal?.id, 'milestones'],
    enabled: !!activeGoal?.id,
  });
  
  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: (newGoal: GoalFormData) => 
      apiRequest('/api/goals', 'POST', newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setCreateDialogOpen(false);
      resetGoalForm();
    }
  });
  
  const createMilestoneMutation = useMutation({
    mutationFn: (newMilestone: MilestoneFormData) => 
      apiRequest(`/api/goals/${newMilestone.goalId}/milestones`, 'POST', newMilestone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', activeGoal?.id, 'milestones'] });
      setMilestoneDialogOpen(false);
      resetMilestoneForm();
    }
  });
  
  const completeMilestoneMutation = useMutation({
    mutationFn: (milestoneId: number) => 
      apiRequest(`/api/goals/milestones/${milestoneId}/complete`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', activeGoal?.id, 'milestones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    }
  });
  
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: number) => 
      apiRequest(`/api/goals/${goalId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setActiveGoal(null);
    }
  });
  
  // Helper functions
  const resetGoalForm = () => {
    setGoalForm({
      title: '',
      description: '',
      targetDate: '',
      isPublic: false
    });
  };
  
  const resetMilestoneForm = () => {
    setMilestoneForm({
      title: '',
      dueDate: '',
      goalId: 0
    });
  };
  
  const handleCreateGoal = () => {
    createGoalMutation.mutate(goalForm);
  };
  
  const handleCreateMilestone = () => {
    if (!activeGoal) return;
    
    createMilestoneMutation.mutate({
      ...milestoneForm,
      goalId: activeGoal.id
    });
  };
  
  const handleCompleteMilestone = (milestoneId: number) => {
    completeMilestoneMutation.mutate(milestoneId);
  };
  
  const handleDeleteGoal = (goalId: number) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      deleteGoalMutation.mutate(goalId);
    }
  };
  
  const handleOpenMilestoneDialog = (goalId: number) => {
    setMilestoneForm({
      ...milestoneForm,
      goalId
    });
    setMilestoneDialogOpen(true);
  };
  
  // Render functions
  const renderGoalCard = (goal: Goal) => {
    const isActive = activeGoal?.id === goal.id;
    
    return (
      <Card 
        key={goal.id} 
        className={`mb-4 cursor-pointer ${isActive ? 'border-primary' : ''}`}
        onClick={() => setActiveGoal(goal)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{goal.title}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleOpenMilestoneDialog(goal.id);
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Milestone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  // handleEditGoal(goal.id)
                }}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Goal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGoal(goal.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription className="text-sm">
            {goal.description.length > 120 
              ? goal.description.substring(0, 120) + '...' 
              : goal.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center">
                <Target className="mr-1 h-4 w-4" /> 
                Progress
              </span>
              <span>{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {new Date(goal.targetDate || goal.createdAt).toLocaleDateString()}
          </div>
          <Badge variant={goal.isPublic ? "default" : "outline"}>
            {goal.isPublic ? "Public" : "Private"}
          </Badge>
        </CardFooter>
      </Card>
    );
  };
  
  const renderTeamAssignment = (assignment: Assignment) => {
    return (
      <Card key={assignment.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{assignment.teamGoalTitle}</CardTitle>
            <Badge variant={
              assignment.status === 'completed' ? 'default' : 
              assignment.status === 'in-progress' ? 'secondary' : 'outline'
            }>
              {assignment.status}
            </Badge>
          </div>
          <CardDescription className="text-sm">
            Circle: {assignment.circleName} • Role: {assignment.role}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2 flex justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <AlarmClock className="mr-1 h-3 w-3" />
            Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
          </div>
          {assignment.status !== 'completed' && (
            <Button size="sm" variant="outline">
              <CheckCircle2 className="mr-2 h-3 w-3" />
              Mark Complete
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  const renderPublicGoal = (goal: Goal) => {
    return (
      <Card key={goal.id} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{goal.title}</CardTitle>
          <CardDescription className="text-sm">
            {goal.description.length > 150 
              ? goal.description.substring(0, 150) + '...' 
              : goal.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center">
                <Target className="mr-1 h-4 w-4" /> 
                Progress
              </span>
              <span>{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="pt-0 justify-end">
          <Button size="sm" variant="outline">
            Copy to My Goals
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  const renderMilestones = () => {
    if (!milestones || milestones.length === 0) {
      return (
        <div className="text-center p-4 text-muted-foreground">
          <p className="mb-4">No milestones created for this goal yet.</p>
          <Button 
            size="sm" 
            onClick={() => handleOpenMilestoneDialog(activeGoal!.id)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add First Milestone
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {milestones.map((milestone: Milestone) => (
          <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id={`milestone-${milestone.id}`}
                checked={milestone.status === 'completed'}
                onCheckedChange={() => {
                  if (milestone.status !== 'completed') {
                    handleCompleteMilestone(milestone.id);
                  }
                }}
              />
              <div>
                <Label 
                  htmlFor={`milestone-${milestone.id}`}
                  className={`font-medium ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}
                >
                  {milestone.title}
                </Label>
                {milestone.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={
              milestone.status === 'completed' ? 'default' : 
              milestone.status === 'in-progress' ? 'secondary' : 'outline'
            }>
              {milestone.status}
            </Badge>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Civic Goals</CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Civic Goal</DialogTitle>
                    <DialogDescription>
                      Define a civic action goal to track your progress towards legislative impact.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Goal Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Reduce plastic waste through local legislation"
                        value={goalForm.title}
                        onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Work with local representatives to introduce and support legislation that reduces single-use plastics in my community."
                        value={goalForm.description}
                        onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetDate">Target Date (Optional)</Label>
                      <Input 
                        id="targetDate" 
                        type="date"
                        value={goalForm.targetDate}
                        onChange={(e) => setGoalForm({...goalForm, targetDate: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isPublic" 
                        checked={goalForm.isPublic}
                        onCheckedChange={(checked) => 
                          setGoalForm({...goalForm, isPublic: checked === true})
                        }
                      />
                      <Label htmlFor="isPublic">
                        Make this goal public for community inspiration
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      onClick={handleCreateGoal}
                      disabled={!goalForm.title || !goalForm.description}
                    >
                      Create Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>
              Track your progress towards civic action goals
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="personal">
                    <Target className="mr-2 h-4 w-4" /> Personal
                  </TabsTrigger>
                  <TabsTrigger value="team">
                    <Users className="mr-2 h-4 w-4" /> Team
                  </TabsTrigger>
                  <TabsTrigger value="inspiration">
                    <Award className="mr-2 h-4 w-4" /> Inspiration
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="personal" className="m-0">
                <ScrollArea className="h-[450px] px-6 py-4">
                  {loadingPersonalGoals ? (
                    <div className="flex justify-center items-center h-40">
                      <p>Loading goals...</p>
                    </div>
                  ) : personalGoals && personalGoals.length > 0 ? (
                    personalGoals.map((goal: Goal) => renderGoalCard(goal))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">You haven't created any goals yet.</p>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First Goal
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="team" className="m-0">
                <ScrollArea className="h-[450px] px-6 py-4">
                  {loadingTeamAssignments ? (
                    <div className="flex justify-center items-center h-40">
                      <p>Loading team assignments...</p>
                    </div>
                  ) : teamAssignments && teamAssignments.length > 0 ? (
                    teamAssignments.map((assignment: Assignment) => renderTeamAssignment(assignment))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Users className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">You don't have any team assignments.</p>
                      <Button variant="outline">
                        Join an Action Circle
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="inspiration" className="m-0">
                <ScrollArea className="h-[450px] px-6 py-4">
                  {loadingPublicGoals ? (
                    <div className="flex justify-center items-center h-40">
                      <p>Loading community goals...</p>
                    </div>
                  ) : publicGoals && publicGoals.length > 0 ? (
                    publicGoals.map((goal: Goal) => renderPublicGoal(goal))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Award className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">No community goals available yet.</p>
                      <p className="text-sm text-muted-foreground">Make your goals public to inspire others.</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="col-span-1 md:col-span-2">
        <Card className="h-full">
          {activeGoal ? (
            <>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{activeGoal.title}</CardTitle>
                    <CardDescription>
                      {activeGoal.targetDate && `Target date: ${new Date(activeGoal.targetDate).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={activeGoal.isPublic ? "default" : "outline"}>
                      {activeGoal.isPublic ? "Public" : "Private"}
                    </Badge>
                    <Badge variant={
                      activeGoal.status === 'completed' ? 'success' : 
                      activeGoal.status === 'abandoned' ? 'destructive' : 'secondary'
                    }>
                      {activeGoal.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Progress</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall completion</span>
                    <span className="font-medium">{activeGoal.progress}%</span>
                  </div>
                  <Progress value={activeGoal.progress} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold">Description</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{activeGoal.description}</p>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Milestones</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOpenMilestoneDialog(activeGoal.id)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Milestone
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {loadingMilestones ? (
                      <div className="flex justify-center items-center h-32">
                        <p>Loading milestones...</p>
                      </div>
                    ) : (
                      renderMilestones()
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Related Bills</h3>
                    <Button size="sm" variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Bill
                    </Button>
                  </div>
                  
                  <div className="text-center p-4 text-muted-foreground">
                    <p className="mb-4">No bills linked to this goal yet.</p>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Link Relevant Legislation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Goal</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Choose a goal from the list to view details, track milestones, and manage related legislation.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Goal
              </Button>
            </div>
          )}
        </Card>
      </div>
      
      {/* Add Milestone Dialog */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Break down your goal into manageable steps.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-title">Milestone Title</Label>
              <Input 
                id="milestone-title" 
                placeholder="Research current plastic regulations"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-date">Due Date (Optional)</Label>
              <Input 
                id="milestone-date" 
                type="date"
                value={milestoneForm.dueDate}
                onChange={(e) => setMilestoneForm({...milestoneForm, dueDate: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMilestoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateMilestone}
              disabled={!milestoneForm.title}
            >
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CivicGoalsTracker;