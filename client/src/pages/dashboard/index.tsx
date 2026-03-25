// @ts-nocheck
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import SuperUserProgress from "@/components/dashboard/SuperUserProgress";
import RoleSpecificDashboard from "@/components/dashboard/RoleSpecificDashboard";
import ChallengesSection from "@/components/dashboard/ChallengesSection";
import LegislativeTracking from "@/components/dashboard/LegislativeTracking";
import TippingPointProgress from "@/components/dashboard/TippingPointProgress";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { user, userRole, loading } = useUser();

  const { data: milestones, isLoading: milestonesLoading } = useQuery<any>({
    queryKey: ['/api/users/me/milestones'],
    enabled: !!user,
  });

  const { data: networkImpact, isLoading: networkImpactLoading } = useQuery<any>({
    queryKey: ['/api/users/me/network-impact'],
    enabled: !!user,
  });

  const { data: userChallenges, isLoading: challengesLoading } = useQuery<any>({
    queryKey: ['/api/users/me/challenges'],
    enabled: !!user,
  });

  const { data: actionCircles, isLoading: circlesLoading } = useQuery<any>({
    queryKey: ['/api/action-circles'],
    enabled: !!user,
  });

  const { data: representatives, isLoading: repsLoading } = useQuery<any>({
    queryKey: ['/api/representatives'],
    enabled: !!user,
  });

  const { data: tippingPointMetrics, isLoading: tippingPointLoading } = useQuery<any>({
    queryKey: ['/api/tipping-point'],
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-[300px] w-full mb-8 rounded-lg" />
        <Skeleton className="h-[400px] w-full mb-8 rounded-lg" />
        <Skeleton className="h-[300px] w-full mb-8 rounded-lg" />
        <Skeleton className="h-[400px] w-full mb-8 rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Please Log In</h1>
            <p className="text-neutral-600 mb-6">You need to be logged in to view your dashboard.</p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" href="/login">
                Log In
              </Button>
              <Button href="/register">
                Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:leading-9 sm:truncate">
              Your Impact Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Track your influence, progress, and impact as you drive civic change
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button variant="outline" className="mr-3">
              <UserPlus className="-ml-1 mr-2 h-5 w-5 text-neutral-500" />
              Invite Others
            </Button>
            <Button>
              Take Action
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Super User Progress Section */}
      <SuperUserProgress 
        userRole={userRole}
        milestones={milestones}
        isLoading={milestonesLoading}
      />

      {/* Role Specific Dashboard */}
      <RoleSpecificDashboard 
        userRole={userRole}
        networkImpact={networkImpact}
        actionCircles={actionCircles}
        isLoading={networkImpactLoading || circlesLoading}
      />

      {/* Challenges Section */}
      <ChallengesSection 
        userRole={userRole}
        userChallenges={userChallenges}
        isLoading={challengesLoading}
      />

      {/* Legislative Tracking */}
      <LegislativeTracking 
        representatives={representatives}
        userDistrict={user?.district}
        isLoading={repsLoading}
      />

      {/* Tipping Point Progress */}
      <TippingPointProgress 
        metrics={tippingPointMetrics}
        isLoading={tippingPointLoading}
      />
    </div>
  );
}
