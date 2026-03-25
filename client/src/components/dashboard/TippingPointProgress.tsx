// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users, ArrowUp, Heart } from "lucide-react";
import { TippingPointMetric } from "@/lib/types";
import { TIPPING_POINT_THRESHOLD } from "@/lib/constants";

interface TippingPointProgressProps {
  metrics?: TippingPointMetric;
  isLoading: boolean;
}

export default function TippingPointProgress({ metrics, isLoading }: TippingPointProgressProps) {
  if (isLoading) {
    return (
      <Card className="shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-6 w-full rounded-full mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  // Default values if metrics aren't available
  const percentReached = metrics?.percentReached || 0;
  const activeUsers = metrics?.activeUsers || 0;
  const superSpreaders = metrics?.superSpreaders || 0;
  const actionsTaken = metrics?.actionsTaken || 0;
  const policyImpacts = metrics?.policyImpacts || 0;

  return (
    <Card className="shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800">Movement Tipping Point</h2>
        <p className="text-sm text-neutral-500 mt-1">Track our progress toward 25% civic engagement and systemic change</p>
      </div>
      
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <h3 className="text-base font-medium text-neutral-800">Progress Toward 25% Tipping Point</h3>
            <div className="text-sm font-medium text-primary-600">{percentReached}% Achieved</div>
          </div>
          
          <div className="w-full h-6 bg-neutral-100 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-primary-500 rounded-full" 
              style={{ width: `${percentReached}%` }}
            />
            <div 
              className="absolute top-0 left-1/4 h-full w-0.5 border-l-2 border-dashed border-primary-600 flex items-center justify-center"
              style={{ left: `${TIPPING_POINT_THRESHOLD}%` }}
            >
              <div className="absolute -ml-4 bg-white px-2 py-0.5 rounded text-xs font-medium text-primary-600">
                {TIPPING_POINT_THRESHOLD}%
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-neutral-500">
            When {TIPPING_POINT_THRESHOLD}% of citizens actively engage, government accountability becomes a social norm
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="rounded-full bg-primary-100 p-2 mr-3">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Active Users</div>
            </div>
            <div className="pl-10">
              <div className="text-2xl font-bold text-neutral-800">{formatNumber(activeUsers)}</div>
              <div className="text-xs text-secondary-600">+12.4% this month</div>
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="rounded-full bg-secondary-100 p-2 mr-3">
                <svg className="h-5 w-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div className="text-sm font-medium text-neutral-800">Super Spreaders</div>
            </div>
            <div className="pl-10">
              <div className="text-2xl font-bold text-neutral-800">{formatNumber(superSpreaders)}</div>
              <div className="text-xs text-secondary-600">+22.7% this month</div>
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="rounded-full bg-alert-100 p-2 mr-3">
                <ArrowUp className="h-5 w-5 text-alert-600" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Actions Taken</div>
            </div>
            <div className="pl-10">
              <div className="text-2xl font-bold text-neutral-800">{formatNumber(actionsTaken)}</div>
              <div className="text-xs text-secondary-600">+32.1% this month</div>
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="rounded-full bg-primary-100 p-2 mr-3">
                <Heart className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Policy Impacts</div>
            </div>
            <div className="pl-10">
              <div className="text-2xl font-bold text-neutral-800">{policyImpacts}</div>
              <div className="text-xs text-secondary-600">+8 this month</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-primary-50 rounded-lg p-4">
          <h3 className="text-base font-medium text-primary-800 mb-2">Movement Builder Challenge</h3>
          <p className="text-sm text-primary-600 mb-3">Help us reach the tipping point by completing these high-impact actions:</p>
          
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="h-4 w-4 text-primary-500" />
              </div>
              <div className="ml-2">
                <p className="text-sm text-primary-800">Create 3 Action Circles in your district</p>
                <p className="text-xs text-primary-600">1/3 completed</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="h-4 w-4 text-primary-500" />
              </div>
              <div className="ml-2">
                <p className="text-sm text-primary-800">Recruit 10 new users who complete their first action</p>
                <p className="text-xs text-primary-600">7/10 completed</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="h-4 w-4 text-neutral-300" />
              </div>
              <div className="ml-2">
                <p className="text-sm text-primary-800">Organize a community action event with at least 15 participants</p>
                <p className="text-xs text-primary-600">0/1 completed</p>
              </div>
            </li>
          </ul>
          
          <Button className="w-full mt-4">
            Join Movement Builder Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
