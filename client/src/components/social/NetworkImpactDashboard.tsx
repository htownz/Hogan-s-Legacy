import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useSocialNetwork } from "@/hooks/use-social-network";
import { Loader2, Users, Award, Share2, TrendingUp } from "lucide-react";
import { InvitationForm } from "./InvitationForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/**
 * A dashboard component displaying the user's social network impact statistics
 * with visualizations and actions to grow their network
 */
export function NetworkImpactDashboard() {
  const {
    networkImpact,
    isLoadingNetworkImpact,
    sentInvitations,
    isLoadingSentInvitations,
  } = useSocialNetwork();

  const [showInviteDialog, setShowInviteDialog] = React.useState(false);

  if (isLoadingNetworkImpact || isLoadingSentInvitations) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format R0 value (basic reproduction number) for display
  const formattedR0 = networkImpact?.r0Value.toFixed(2) || "0.00";
  
  // Calculate percentage to tipping point (25%)
  // In epidemiology, an R0 of 1.0 means the epidemic is stable
  // An R0 > 1.0 means the epidemic is growing
  // For viral civic engagement, we're targeting an R0 of 2.0 as ideal
  const r0Progress = networkImpact ? Math.min((networkImpact.r0Value / 2) * 100, 100) : 0;
  
  // Calculate network reach as percentage of goal (25% of voting age Texans)
  // This is an aspirational metric - total voting age population of Texas is ~21M
  // So 25% would be ~5.25M people, but we'll use a more manageable initial goal
  const reachGoal = 10000; // Initial goal of 10,000 people reached
  const reachProgress = networkImpact 
    ? Math.min((networkImpact.totalReach / reachGoal) * 100, 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* R0 Value Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              R₀ Value
            </CardTitle>
            <CardDescription>
              Your civic reproduction number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">{formattedR0}</div>
            <Progress value={r0Progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Goal: 2.0 (each person you invite brings in 2 more)
            </p>
          </CardContent>
        </Card>

        {/* Invitations Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Invitations
            </CardTitle>
            <CardDescription>
              People you've invited to Act Up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{networkImpact?.usersInvited || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {networkImpact?.activeUsers || 0} active users
            </div>
            <div className="mt-4">
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Invite More People
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <InvitationForm onSuccess={() => setShowInviteDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Network Reach Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Network Reach
            </CardTitle>
            <CardDescription>
              Total people in your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{networkImpact?.totalReach.toLocaleString() || 0}</div>
            <Progress value={reachProgress} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {reachProgress.toFixed(1)}% of initial goal ({reachGoal.toLocaleString()} people)
            </p>
          </CardContent>
        </Card>

        {/* Actions Inspired Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Actions Inspired
            </CardTitle>
            <CardDescription>
              Civic actions you've encouraged
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{networkImpact?.actionsInspired || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Through your network influence
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                Share Impact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {sentInvitations && sentInvitations.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
            <CardDescription>
              People you've invited but haven't joined yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentInvitations
                .filter(invitation => invitation.status === 'pending')
                .map(invitation => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <div className="font-medium">{invitation.name}</div>
                      <div className="text-sm text-muted-foreground">{invitation.email}</div>
                      <div className="text-xs mt-1">
                        Sent: {new Date(invitation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Implement resend functionality here
                      }}
                    >
                      Resend
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}