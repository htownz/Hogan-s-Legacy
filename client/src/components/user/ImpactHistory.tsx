import { useUser, UserAction } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  Eye, 
  Star, 
  Share2, 
  Check, 
  Calendar,
  FileText, 
  BarChart
} from "lucide-react";

export const ImpactHistory = () => {
  const { userData } = useUser();
  const { actions = [] } = userData;
  
  // Count metrics
  const metrics = {
    viewed: actions.filter(action => action.type === "view").length,
    tracked: actions.filter(action => action.type === "track").length,
    shared: actions.filter(action => action.type === "share").length,
    completed: actions.filter(action => action.type === "complete").length,
  };
  
  const totalActions = Object.values(metrics).reduce((sum, count) => sum + count, 0);
  
  // Get the most recent actions for display (limited to last 5)
  const recentActions = [...actions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
  
  // Helper function to get icon for action type
  const getActionIcon = (type: string) => {
    switch(type) {
      case "view": return <Eye className="h-4 w-4 text-blue-400" />;
      case "track": return <Star className="h-4 w-4 text-yellow-400" />; 
      case "share": return <Share2 className="h-4 w-4 text-green-400" />;
      case "complete": return <Check className="h-4 w-4 text-purple-400" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Helper function to format action description
  const getActionDescription = (action: UserAction) => {
    switch(action.type) {
      case "view":
        return `Viewed bill ${action.billId}`;
      case "track":
        return `Started tracking ${action.billId}`;
      case "share": 
        return `Shared ${action.billId}`;
      case "complete":
        return action.actionId 
          ? `Completed "${action.actionId}" for ${action.billId || "a bill"}`
          : `Completed an action for ${action.billId || "a bill"}`;
      default:
        return "Unknown action";
    }
  };
  
  // Format time since action
  const getTimeSince = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };
  
  return (
    <Card className="bg-[#1e2334] border-gray-700 text-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <BarChart className="mr-2 h-5 w-5 text-[#f05a28]" />
          Your Impact History
        </CardTitle>
        <CardDescription className="text-gray-400">
          Track your engagement and influence
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#171d2d] rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Eye className="h-5 w-5 text-blue-400 mr-2" />
              <span className="text-sm text-gray-300">Bills Viewed</span>
            </div>
            <span className="text-2xl font-bold text-white">{metrics.viewed}</span>
          </div>
          
          <div className="bg-[#171d2d] rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Star className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-sm text-gray-300">Bills Tracked</span>
            </div>
            <span className="text-2xl font-bold text-white">{metrics.tracked}</span>
          </div>
          
          <div className="bg-[#171d2d] rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Share2 className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-sm text-gray-300">Shares</span>
            </div>
            <span className="text-2xl font-bold text-white">{metrics.shared}</span>
          </div>
          
          <div className="bg-[#171d2d] rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-sm text-gray-300">Actions Taken</span>
            </div>
            <span className="text-2xl font-bold text-white">{metrics.completed}</span>
          </div>
        </div>
        
        {/* Recent Activity Timeline */}
        {recentActions.length > 0 ? (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" /> Recent Activity
            </h3>
            
            <div className="space-y-3">
              {recentActions.map((action, index) => (
                <div key={index} className="flex items-start bg-[#171d2d] rounded-md p-2">
                  <div className="mr-3 mt-1">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{getActionDescription(action)}</p>
                    <p className="text-xs text-gray-400">{getTimeSince(action.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-[#171d2d] rounded-lg text-center text-gray-400">
            <p className="text-sm">No activity recorded yet</p>
            <p className="text-xs mt-1">As you engage with bills, your actions will show here</p>
          </div>
        )}
        
        {/* Overall summary */}
        <div className="mt-4 pt-3 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            {totalActions > 0 
              ? `You've taken ${totalActions} civic actions so far!` 
              : "Start engaging with bills to track your impact!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImpactHistory;