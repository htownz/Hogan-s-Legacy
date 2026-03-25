import { ArrowRight, Lightbulb } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { useQuery } from "@tanstack/react-query";
import { cn, formatPercentage } from "@/lib/utils";
import { Link } from "wouter";

export function TippingPointCard() {
  const { superUser } = useUser();
  
  const { data: districtProgress, isLoading } = useQuery<any>({
    queryKey: ['/api/district-progress/District 5'],
    enabled: !!superUser
  });
  
  if (!superUser) return null;

  // Fallback data when API data isn't available yet
  const fallbackData = {
    district: "District 5",
    engagementPercentage: 128, // 12.8%
    totalUsers: 8742,
    superSpreaders: 243,
    consistentActions: 3526,
    weeklyGrowthRate: 32, // 3.2%
  };
  
  const progress = districtProgress || fallbackData;

  return (
    <Card>
      <CardHeader className="p-5 border-b border-gray-200">
        <h3 className="font-heading font-semibold text-lg text-dark">Tipping Point Progress</h3>
        <p className="text-sm text-gray-600">Our path to 25% civic engagement</p>
      </CardHeader>
      <CardContent className="p-5">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{progress.district} Progress</span>
            <span className="text-sm font-semibold text-dark">{formatPercentage(progress.engagementPercentage)}</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-amplifier rounded-full"
              style={{ width: `${progress.engagementPercentage / 250 * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>25% Goal</span>
          </div>
        </div>
        
        <div className="space-y-4 mt-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">Total Users Engaged</span>
              <span className="text-xs font-medium text-gray-900">{progress.totalUsers.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "14.5%" }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">Super Spreaders</span>
              <span className="text-xs font-medium text-gray-900">{progress.superSpreaders.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amplifier rounded-full" style={{ width: "8.1%" }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">Consistent Actions</span>
              <span className="text-xs font-medium text-gray-900">{progress.consistentActions.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: "11.8%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">Weekly Growth Rate</span>
              <span className="text-xs font-medium text-green-600">+{formatPercentage(progress.weeklyGrowthRate)}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: "32%" }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">{superUser.role.charAt(0).toUpperCase() + superUser.role.slice(1)} Impact</h4>
              <p className="mt-1 text-xs text-blue-700">Your district is growing 1.3x faster than average thanks to super spreaders like you!</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <Link href="/dashboard/impact">
          <a className="text-sm font-medium text-primary hover:text-primary-dark inline-flex items-center">
            Explore district impact data
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
