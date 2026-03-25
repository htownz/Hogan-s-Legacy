// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuperUser } from "@/contexts/SuperUserContext";
import { SuperUserRoleType } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/constants";
import { CheckCircle, Clock, Users, Megaphone, FileText, AlertCircle } from "lucide-react";

// Mock data for actions
const AVAILABLE_ACTIONS = [
  {
    id: 1,
    title: "Verify Claims About Water Conservation Act",
    description: "Research and verify claims made about the impact of HB234 on local water rights.",
    type: "catalyst",
    impact: "high",
    timeEstimate: "30 min",
    deadline: "2 days",
    participants: 12,
    location: "Austin"
  },
  {
    id: 2,
    title: "Share Education Funding Facts",
    description: "Amplify verified information about the new education funding proposal.",
    type: "amplifier",
    impact: "medium",
    timeEstimate: "15 min",
    deadline: "5 days",
    participants: 28,
    location: "Statewide"
  },
  {
    id: 3,
    title: "Contact Your Representative About Transit Bill",
    description: "Call or email your representative about the upcoming transit infrastructure vote.",
    type: "convincer",
    impact: "high",
    timeEstimate: "10 min",
    deadline: "Tomorrow",
    participants: 56,
    location: "Travis County"
  },
  {
    id: 4,
    title: "Attend Public Hearing on Education Funding",
    description: "Speak at or observe the upcoming public hearing on education funding reforms.",
    type: "community",
    impact: "high",
    timeEstimate: "2 hours",
    deadline: "July 25",
    participants: 34,
    location: "City Hall"
  },
  {
    id: 5,
    title: "Share Verified Water Bill Facts With Your Network",
    description: "Use our pre-written, fact-checked message to inform your network about water bill changes.",
    type: "amplifier",
    impact: "medium",
    timeEstimate: "5 min",
    deadline: "This week",
    participants: 42,
    location: "Online"
  }
];

// Mock data for completed actions
const COMPLETED_ACTIONS = [
  {
    id: 101,
    title: "Verified Claims About Property Tax Bill",
    description: "Researched and verified 3 claims about the property tax reform proposal.",
    type: "catalyst",
    impact: "high",
    completedDate: "2 days ago",
    peopleReached: 87,
  },
  {
    id: 102,
    title: "Testimony at City Council",
    description: "Provided testimony at city council meeting on transportation funding.",
    type: "convincer",
    impact: "high",
    completedDate: "Last week",
    peopleReached: 120,
  }
];

interface ActionCardProps {
  action: typeof AVAILABLE_ACTIONS[0] | typeof COMPLETED_ACTIONS[0];
  isCompleted?: boolean;
  onActionClick: (id: number) => void;
}

function ActionCard({ action, isCompleted = false, onActionClick }: ActionCardProps) {
  // Get styling based on action type
  const getTypeStyles = (type: string): { color: string, bgColor: string, icon: JSX.Element } => {
    switch (type) {
      case "catalyst":
        return {
          color: "text-success",
          bgColor: "bg-success bg-opacity-10",
          icon: <CheckCircle className="w-4 h-4" />
        };
      case "amplifier":
        return {
          color: "text-primary",
          bgColor: "bg-primary bg-opacity-10",
          icon: <Megaphone className="w-4 h-4" />
        };
      case "convincer":
        return {
          color: "text-accent",
          bgColor: "bg-accent bg-opacity-10",
          icon: <Users className="w-4 h-4" />
        };
      default:
        return {
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          icon: <FileText className="w-4 h-4" />
        };
    }
  };

  const typeStyles = getTypeStyles(action.type);
  
  // Get impact color
  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case "high":
        return "bg-success text-success-foreground";
      case "medium":
        return "bg-amber-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles.bgColor} ${typeStyles.color}`}>
              <span className="mr-1">{typeStyles.icon}</span>
              {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
            </span>
            <Badge variant="outline" className={getImpactColor(action.impact)}>
              {action.impact.toUpperCase()} IMPACT
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{action.title}</CardTitle>
        <CardDescription>{action.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {!isCompleted ? (
            <>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{action.timeEstimate}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{action.deadline}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{action.participants} people</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700">{action.location}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{(action as typeof COMPLETED_ACTIONS[0]).completedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{(action as typeof COMPLETED_ACTIONS[0]).peopleReached} reached</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={isCompleted ? "outline" : "default"}
          className={`w-full ${!isCompleted && action.type === 'catalyst' ? 'bg-success hover:bg-success-dark' : 
            !isCompleted && action.type === 'amplifier' ? 'bg-primary hover:bg-primary-dark' : 
            !isCompleted && action.type === 'convincer' ? 'bg-accent hover:bg-accent-dark' : ''}`}
          onClick={() => onActionClick(action.id)}
        >
          {isCompleted ? "View Impact" : "Take Action"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ActionCenter() {
  const { mainRole } = useSuperUser();
  const [filter, setFilter] = useState("all");
  const [location, setLocation] = useState("all");
  const [actionTab, setActionTab] = useState("available");
  const [filteredActions, setFilteredActions] = useState(AVAILABLE_ACTIONS);
  
  const handleFilterChange = (value: string) => {
    setFilter(value);
    filterActions(value, location, actionTab);
  };
  
  const handleLocationChange = (value: string) => {
    setLocation(value);
    filterActions(filter, value, actionTab);
  };
  
  const handleTabChange = (value: string) => {
    setActionTab(value);
    filterActions(filter, location, value);
  };
  
  const filterActions = (typeFilter: string, locationFilter: string, tab: string) => {
    const actionsToFilter = tab === "available" ? AVAILABLE_ACTIONS : COMPLETED_ACTIONS;
    
    let filtered = [...actionsToFilter];
    
    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(action => action.type === typeFilter);
    }
    
    // Filter by location if available
    if (locationFilter !== "all" && "location" in filtered[0]) {
      filtered = filtered.filter(action => 
        "location" in action && action.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    setFilteredActions(filtered);
  };
  
  const handleActionClick = (id: number) => {
    console.log(`Action clicked: ${id}`);
    // In a real app, navigate to action details or open a modal
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Action Center</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="catalyst">Catalyst Actions</SelectItem>
              <SelectItem value="amplifier">Amplifier Actions</SelectItem>
              <SelectItem value="convincer">Convincer Actions</SelectItem>
              <SelectItem value="community">Community Actions</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={location} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="austin">Austin</SelectItem>
              <SelectItem value="travis">Travis County</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="statewide">Statewide</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={actionTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="available">Available Actions</TabsTrigger>
          <TabsTrigger value="completed">Completed Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionTab === "available" && filteredActions.length > 0 ? (
              filteredActions.map(action => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  onActionClick={handleActionClick} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No available actions match your filters.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setFilter("all");
                    setLocation("all");
                    filterActions("all", "all", actionTab);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionTab === "completed" && COMPLETED_ACTIONS.length > 0 ? (
              COMPLETED_ACTIONS.map(action => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  isCompleted={true}
                  onActionClick={handleActionClick} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">You haven't completed any actions yet.</p>
                <Button 
                  variant="default" 
                  className="mt-4 bg-primary"
                  onClick={() => handleTabChange("available")}
                >
                  Find Available Actions
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Suggested action for your role */}
      {mainRole && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Recommended for Your Role</h2>
          <p className="text-gray-600 mb-4">
            As a {mainRole.role}, you can make a big impact with these specialized actions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_ACTIONS.filter(a => a.type === mainRole.role).slice(0, 2).map(action => (
              <Card key={action.id} className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="default" 
                    size="sm"
                    className={`${mainRole.role === 'catalyst' ? 'bg-success hover:bg-success-dark' : 
                      mainRole.role === 'amplifier' ? 'bg-primary hover:bg-primary-dark' : 
                      'bg-accent hover:bg-accent-dark'}`}
                    onClick={() => handleActionClick(action.id)}
                  >
                    Take Action
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
