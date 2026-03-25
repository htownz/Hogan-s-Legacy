// @ts-nocheck
import { AppLayout } from "@/components/layout/app-layout";
import { useUser } from "@/context/user-context";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  Trophy, 
  Users, 
  ArrowRight,
  Filter,
  Search,
  Star,
  UserPlus,
  Megaphone,
  GraduationCap
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getChallengeStatusClass, getRoleBgLightColor, getRoleColor } from "@/lib/utils";
import { Challenge } from "@shared/schema";

interface UserChallenge extends Challenge {
  progress: number;
  completed: boolean;
  name?: string;
  targetRole?: string;
  goalType?: string;
  goalAmount?: number;
  reward?: string;
  startDate?: Date;
  endDate?: Date;
  [key: string]: any;
}

interface ExtendedChallenge extends Challenge {
  name?: string;
  targetRole?: string;
  goalType?: string;
  goalAmount?: number;
  reward?: string;
  startDate?: Date;
  endDate?: Date;
  [key: string]: any;
}

export default function Challenges() {
  const { superUser } = useUser();
  
  const { data: userChallenges, isLoading: userChallengesLoading } = useQuery<UserChallenge[]>({
    queryKey: ['/api/user-challenges/1'],
    enabled: !!superUser
  });
  
  const { data: availableChallenges, isLoading: availableChallengesLoading } = useQuery<ExtendedChallenge[]>({
    queryKey: ['/api/challenges', { role: superUser?.role }],
    enabled: !!superUser
  });
  
  if (!superUser) return null;
  
  const roleColorText = getRoleColor(superUser.role);
  const roleBgLight = getRoleBgLightColor(superUser.role);
  
  // Fallback challenges when API data isn't available yet
  const fallbackUserChallenges: UserChallenge[] = [
    {
      id: 1,
      name: 'Influence Wave Challenge',
      description: 'Activate 3 people who each take at least one action within 72 hours',
      targetRole: 'amplifier',
      requiredLevel: 2,
      goalAmount: 3,
      goalType: 'activations',
      reward: 'Action Circle Leader badge progress +40%',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(),
      progress: 66,
      completed: false
    },
    {
      id: 2,
      name: 'District Impact Challenge',
      description: 'Build a network of 10+ active citizens in your district by June 30',
      targetRole: 'amplifier',
      requiredLevel: 2,
      goalAmount: 10,
      goalType: 'network',
      reward: 'Community Mobilizer badge',
      startDate: new Date(),
      endDate: new Date(2023, 5, 30), // June 30
      createdAt: new Date(),
      progress: 60,
      completed: false
    }
  ];
  
  const fallbackAvailableChallenges: ExtendedChallenge[] = [
    {
      id: 3,
      name: 'Super Spreader Bootcamp',
      description: 'Complete the full training series to unlock advanced amplifier tools',
      targetRole: 'amplifier',
      requiredLevel: 2,
      goalAmount: 3,
      goalType: 'training',
      reward: 'Advanced Amplifier Tools & Level Progress +15%',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date()
    },
    {
      id: 4,
      name: 'Community Builder',
      description: 'Organize a local civic action event with at least 8 participants',
      targetRole: 'amplifier',
      requiredLevel: 2,
      goalAmount: 1,
      goalType: 'event',
      reward: 'Community Builder badge & Level Progress +10%',
      startDate: new Date(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      createdAt: new Date()
    },
    {
      id: 5,
      name: 'Fact Finder',
      description: 'Research and verify 5 legislative claims with reliable sources',
      targetRole: 'catalyst',
      requiredLevel: 1,
      goalAmount: 5,
      goalType: 'research',
      reward: 'Fact Finder badge & Level Progress +10%',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      createdAt: new Date()
    },
    {
      id: 6,
      name: 'Persuasion Master',
      description: 'Create 3 compelling stories that drive at least 15 actions',
      targetRole: 'convincer',
      requiredLevel: 1,
      goalAmount: 3,
      goalType: 'stories',
      reward: 'Storyteller badge & Level Progress +12%',
      startDate: new Date(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      createdAt: new Date()
    }
  ];
  
  const userChallengesList = userChallenges || fallbackUserChallenges;
  const availableChallengesList = availableChallenges || fallbackAvailableChallenges;
  
  const roleSpecificChallenges = availableChallengesList.filter(
    challenge => challenge.targetRole === superUser.role && !userChallengesList.some(uc => uc.id === challenge.id)
  );
  
  const otherRoleChallenges = availableChallengesList.filter(
    challenge => challenge.targetRole !== superUser.role && challenge.targetRole !== null
  );
  
  const getChallengeIcon = (challenge: Challenge) => {
    switch(challenge.goalType) {
      case 'activations':
        return <UserPlus className="h-5 w-5" />;
      case 'network':
        return <Users className="h-5 w-5" />;
      case 'training':
        return <GraduationCap className="h-5 w-5" />;
      case 'event':
        return <Users className="h-5 w-5" />;
      case 'research':
        return <Search className="h-5 w-5" />;
      case 'stories':
        return <Megaphone className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };
  
  const getChallengeBgColor = (targetRole: string | null) => {
    if (!targetRole) return 'bg-primary bg-opacity-10';
    return `bg-${targetRole} bg-opacity-10`;
  };
  
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-heading">Challenges</h1>
            <p className="text-gray-600">
              Complete challenges to earn recognition and boost your impact
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search challenges..."
                className="pl-8 w-60 mr-2"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Active Challenges */}
        <h2 className="text-xl font-bold mb-4">Your Active Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userChallengesList.map((challenge) => (
            <Card key={challenge.id} className="overflow-hidden">
              <CardHeader className={`pb-3 border-b ${roleBgLight}`}>
                <div className="flex justify-between">
                  <div className={`p-2 rounded-full bg-${superUser.role} text-white`}>
                    {getChallengeIcon(challenge)}
                  </div>
                  <Badge className={getChallengeStatusClass(challenge.completed ? 'completed' : 'in progress')}>
                    {challenge.completed ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Clock className="mr-1 h-3 w-3" />
                        In progress
                      </>
                    )}
                  </Badge>
                </div>
                <h3 className="mt-2 font-semibold text-lg">{challenge.name}</h3>
                <div className="text-sm text-gray-500">
                  Ends: {new Date(challenge.endDate).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>
                      {challenge.progress === 66 ? '2/3 completed' : 
                       challenge.progress === 60 ? '6/10 people' : 
                       `${challenge.progress}%`}
                    </span>
                  </div>
                  <Progress 
                    value={challenge.progress} 
                    className="h-2" 
                  />
                </div>
                
                <div className="flex items-start mb-4">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-2">
                    <p className="text-xs font-medium">Reward:</p>
                    <p className="text-xs text-gray-600">{challenge.reward}</p>
                  </div>
                </div>
                
                <Button 
                  className={`w-full bg-${superUser.role}`}
                >
                  Continue Challenge
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Available Challenges */}
        <h2 className="text-xl font-bold mb-4">Available Challenges</h2>
        
        <Tabs defaultValue="role-specific">
          <TabsList className="mb-4">
            <TabsTrigger value="role-specific">
              For {superUser.role.charAt(0).toUpperCase() + superUser.role.slice(1)}s
            </TabsTrigger>
            <TabsTrigger value="other-roles">Other Roles</TabsTrigger>
            <TabsTrigger value="all">All Challenges</TabsTrigger>
          </TabsList>
          
          <TabsContent value="role-specific" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roleSpecificChallenges.map((challenge) => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-gray-50">
                    <div className="flex justify-between">
                      <div className={`p-2 rounded-full bg-${superUser.role} text-white`}>
                        {getChallengeIcon(challenge)}
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        New Challenge
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-semibold text-lg">{challenge.name}</h3>
                    <div className="text-sm text-gray-500">
                      Ends: {new Date(challenge.endDate).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                    
                    <div className="flex items-start mb-4">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <p className="text-xs font-medium">Reward:</p>
                        <p className="text-xs text-gray-600">{challenge.reward}</p>
                      </div>
                    </div>
                    
                    <Button 
                      className={`w-full bg-${superUser.role}`}
                    >
                      Start Challenge
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {roleSpecificChallenges.length === 0 && (
                <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                  <Trophy className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-700">No More Challenges Available</h3>
                  <p className="text-gray-500 mt-1">You've taken on all challenges for your role and level.</p>
                  <p className="text-gray-500">Check back soon for new challenges!</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="other-roles" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherRoleChallenges.map((challenge) => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardHeader className={`pb-3 border-b ${getChallengeBgColor(challenge.targetRole)}`}>
                    <div className="flex justify-between">
                      <div className={`p-2 rounded-full bg-${challenge.targetRole} text-white`}>
                        {getChallengeIcon(challenge)}
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {challenge.targetRole?.charAt(0).toUpperCase() + (challenge.targetRole?.slice(1) || '')} Role
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-semibold text-lg">{challenge.name}</h3>
                    <div className="text-sm text-gray-500">
                      Ends: {new Date(challenge.endDate).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                    
                    <div className="flex items-start mb-4">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <p className="text-xs font-medium">Reward:</p>
                        <p className="text-xs text-gray-600">{challenge.reward}</p>
                      </div>
                    </div>
                    
                    <Button 
                      className={`w-full bg-${challenge.targetRole}`}
                    >
                      Start Challenge
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {otherRoleChallenges.length === 0 && (
                <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                  <Trophy className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-700">No Challenges Available</h3>
                  <p className="text-gray-500 mt-1">No challenges found for other roles at your level.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...roleSpecificChallenges, ...otherRoleChallenges].map((challenge) => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardHeader className={`pb-3 border-b ${getChallengeBgColor(challenge.targetRole)}`}>
                    <div className="flex justify-between">
                      <div className={`p-2 rounded-full bg-${challenge.targetRole} text-white`}>
                        {getChallengeIcon(challenge)}
                      </div>
                      {challenge.targetRole !== superUser.role ? (
                        <Badge className="bg-purple-100 text-purple-800">
                          {challenge.targetRole?.charAt(0).toUpperCase() + (challenge.targetRole?.slice(1) || '')} Role
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          New Challenge
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-lg">{challenge.name}</h3>
                    <div className="text-sm text-gray-500">
                      Ends: {new Date(challenge.endDate).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                    
                    <div className="flex items-start mb-4">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <p className="text-xs font-medium">Reward:</p>
                        <p className="text-xs text-gray-600">{challenge.reward}</p>
                      </div>
                    </div>
                    
                    <Button 
                      className={`w-full bg-${challenge.targetRole}`}
                    >
                      Start Challenge
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {roleSpecificChallenges.length === 0 && otherRoleChallenges.length === 0 && (
                <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                  <Trophy className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-700">No Challenges Available</h3>
                  <p className="text-gray-500 mt-1">No additional challenges found for your level.</p>
                  <p className="text-gray-500">Check back soon for new challenges!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
