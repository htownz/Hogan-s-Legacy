import { AppLayout } from "@/components/layout/app-layout";
import { useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  PlayCircle,
  Users,
  MessageSquare,
  Lightbulb,
  Megaphone,
  ArrowRight,
  CheckCircle,
  Clock,
  Lock
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getRoleDisplayName, getRoleBgLightColor, getRoleColor } from "@/lib/utils";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  role: string;
  level: number;
  icon: React.ReactNode;
}

export default function Training() {
  const { superUser } = useUser();
  
  if (!superUser) return null;
  
  const roleColorText = getRoleColor(superUser.role);
  const roleBgLight = getRoleBgLightColor(superUser.role);
  
  const trainingModules: TrainingModule[] = [
    {
      id: "catalyst-1",
      title: "Research Fundamentals",
      description: "Learn how to research and verify information about legislation and officials.",
      duration: "45 min",
      progress: 100,
      status: 'completed',
      role: 'catalyst',
      level: 1,
      icon: <BookOpen className="h-6 w-6" />
    },
    {
      id: "catalyst-2",
      title: "Fact-Checking Methods",
      description: "Master techniques to separate fact from fiction in political claims.",
      duration: "60 min",
      progress: 75,
      status: 'in_progress',
      role: 'catalyst',
      level: 1,
      icon: <Lightbulb className="h-6 w-6" />
    },
    {
      id: "catalyst-3",
      title: "Advanced Data Analysis",
      description: "Analyze voting records and identify patterns in legislative behavior.",
      duration: "90 min",
      progress: 0,
      status: 'not_started',
      role: 'catalyst',
      level: 2,
      icon: <BookOpen className="h-6 w-6" />
    },
    {
      id: "amplifier-1",
      title: "Network Building Basics",
      description: "Learn strategies for building and activating your civic network.",
      duration: "45 min",
      progress: 100,
      status: 'completed',
      role: 'amplifier',
      level: 1,
      icon: <Users className="h-6 w-6" />
    },
    {
      id: "amplifier-2",
      title: "Action Circle Leadership",
      description: "Organize and lead effective action circles for collective impact.",
      duration: "60 min",
      progress: 65,
      status: 'in_progress',
      role: 'amplifier',
      level: 1,
      icon: <Users className="h-6 w-6" />
    },
    {
      id: "amplifier-3",
      title: "Influence Expansion Strategies",
      description: "Advanced techniques for growing your network's reach and impact.",
      duration: "75 min",
      progress: 0,
      status: 'not_started',
      role: 'amplifier',
      level: 2,
      icon: <Users className="h-6 w-6" />
    },
    {
      id: "convincer-1",
      title: "Storytelling for Change",
      description: "Craft compelling narratives that motivate civic action.",
      duration: "50 min",
      progress: 100,
      status: 'completed',
      role: 'convincer',
      level: 1,
      icon: <MessageSquare className="h-6 w-6" />
    },
    {
      id: "convincer-2",
      title: "Persuasive Communication",
      description: "Master the art of persuasion to move others toward civic engagement.",
      duration: "55 min",
      progress: 40,
      status: 'in_progress',
      role: 'convincer',
      level: 1,
      icon: <Megaphone className="h-6 w-6" />
    },
    {
      id: "convincer-3",
      title: "Community Conversation Facilitation",
      description: "Learn to facilitate productive civic discussions that lead to action.",
      duration: "65 min",
      progress: 0,
      status: 'not_started',
      role: 'convincer',
      level: 2,
      icon: <MessageSquare className="h-6 w-6" />
    }
  ];
  
  // Filter training modules based on role and required level
  const roleSpecificModules = trainingModules.filter(module => 
    module.role === superUser.role && module.level <= superUser.level
  );
  
  const otherModules = trainingModules.filter(module => 
    module.role !== superUser.role && module.level <= superUser.level
  );
  
  const lockedModules = trainingModules.filter(module => 
    module.level > superUser.level
  );
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'not_started':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            Not Started
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const calculateOverallProgress = (modules: TrainingModule[]) => {
    if (modules.length === 0) return 0;
    const totalProgress = modules.reduce((sum, module) => sum + module.progress, 0);
    return Math.round(totalProgress / modules.length);
  };
  
  const roleSpecificProgress = calculateOverallProgress(roleSpecificModules);
  
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-heading">Training Center</h1>
            <p className="text-gray-600">Develop your skills as a {getRoleDisplayName(superUser.role)}</p>
          </div>
        </div>
        
        {/* Training Progress Overview */}
        <Card className="mb-6">
          <CardHeader className="border-b pb-3">
            <h2 className="font-heading font-semibold text-lg text-dark">Your Training Progress</h2>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="md:w-1/3">
                <div className={`p-6 rounded-lg ${roleBgLight}`}>
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-full bg-${superUser.role} text-white`}>
                      {superUser.role === 'catalyst' ? (
                        <Lightbulb className="h-6 w-6" />
                      ) : superUser.role === 'amplifier' ? (
                        <Users className="h-6 w-6" />
                      ) : (
                        <Megaphone className="h-6 w-6" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium">{getRoleDisplayName(superUser.role)} Pathway</h3>
                      <p className="text-sm text-gray-600">{roleSpecificProgress}% complete</p>
                    </div>
                  </div>
                  <Progress value={roleSpecificProgress} className="h-2" />
                  <div className="mt-4 text-sm">
                    <p>Level {superUser.level} modules: {roleSpecificModules.filter(m => m.status === 'completed').length} of {roleSpecificModules.length} completed</p>
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-medium">Completed</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {roleSpecificModules.filter(m => m.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">modules</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <h3 className="font-medium">In Progress</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {roleSpecificModules.filter(m => m.status === 'in_progress').length}
                    </p>
                    <p className="text-sm text-gray-600">modules</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Lock className="h-5 w-5 text-gray-600 mr-2" />
                      <h3 className="font-medium">Locked</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {trainingModules.filter(m => m.role === superUser.role && m.level > superUser.level).length}
                    </p>
                    <p className="text-sm text-gray-600">advanced modules</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Training Modules */}
        <Tabs defaultValue="role-specific">
          <TabsList className="mb-4">
            <TabsTrigger value="role-specific">{getRoleDisplayName(superUser.role)} Modules</TabsTrigger>
            <TabsTrigger value="other-roles">Other Roles</TabsTrigger>
            <TabsTrigger value="locked">Advanced (Locked)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="role-specific" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roleSpecificModules.map((module) => (
                <Card key={module.id} className="overflow-hidden flex flex-col">
                  <CardHeader className={`border-b pb-3 ${module.status === 'completed' ? 'bg-green-50' : ''}`}>
                    <div className="flex justify-between">
                      <div className={`p-2 rounded-lg bg-${superUser.role} bg-opacity-10`}>
                        {module.icon}
                      </div>
                      {getStatusBadge(module.status)}
                    </div>
                    <h3 className="font-semibold text-lg mt-2">{module.title}</h3>
                    <p className="text-sm text-gray-500">{module.duration}</p>
                  </CardHeader>
                  <CardContent className="py-4 flex-grow">
                    <p className="text-sm text-gray-600">{module.description}</p>
                    
                    {module.status === 'in_progress' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 pb-4">
                    <Button 
                      variant={module.status === 'completed' ? 'outline' : 'default'}
                      className={`w-full ${module.status !== 'completed' ? `bg-${superUser.role}` : ''}`}
                    >
                      {module.status === 'completed' ? 'Review Again' : 
                       module.status === 'in_progress' ? 'Continue' : 'Start Module'}
                      <PlayCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="other-roles" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherModules.map((module) => (
                <Card key={module.id} className="overflow-hidden flex flex-col">
                  <CardHeader className={`border-b pb-3 ${module.status === 'completed' ? 'bg-green-50' : ''}`}>
                    <div className="flex justify-between">
                      <div className={`p-2 rounded-lg bg-${module.role} bg-opacity-10`}>
                        {module.icon}
                      </div>
                      {getStatusBadge(module.status)}
                    </div>
                    <h3 className="font-semibold text-lg mt-2">{module.title}</h3>
                    <p className="text-sm text-gray-500">{module.duration} • {getRoleDisplayName(module.role)} Path</p>
                  </CardHeader>
                  <CardContent className="py-4 flex-grow">
                    <p className="text-sm text-gray-600">{module.description}</p>
                    
                    {module.status === 'in_progress' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 pb-4">
                    <Button 
                      variant={module.status === 'completed' ? 'outline' : 'default'}
                      className={`w-full ${module.status !== 'completed' ? `bg-${module.role}` : ''}`}
                    >
                      {module.status === 'completed' ? 'Review Again' : 
                       module.status === 'in_progress' ? 'Continue' : 'Start Module'}
                      <PlayCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="locked" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedModules.filter(m => m.role === superUser.role).map((module) => (
                <Card key={module.id} className="overflow-hidden flex flex-col bg-gray-50">
                  <CardHeader className="border-b pb-3 bg-gray-100">
                    <div className="flex justify-between">
                      <div className="p-2 rounded-lg bg-gray-200">
                        {module.icon}
                      </div>
                      <Badge className="bg-gray-200 text-gray-700">
                        <Lock className="mr-1 h-3 w-3" />
                        Level {module.level} Required
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mt-2 text-gray-600">{module.title}</h3>
                    <p className="text-sm text-gray-500">{module.duration}</p>
                  </CardHeader>
                  <CardContent className="py-4 flex-grow">
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4">
                    <Button variant="outline" className="w-full" disabled>
                      Locked
                      <Lock className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="font-medium text-blue-800">How to Unlock Advanced Modules</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Complete your current level modules and earn enough impact points to progress to Level {superUser.level + 1} ({getRoleDisplayName(superUser.role)}).
                    <Button variant="link" className={`text-${superUser.role} p-0 h-auto text-sm font-medium mt-1`}>
                      View progression requirements
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
