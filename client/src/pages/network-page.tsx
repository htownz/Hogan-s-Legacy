// @ts-nocheck
import React from "react";
import { NetworkImpactDashboard } from "@/components/social/NetworkImpactDashboard";
import { ConnectionNetwork } from "@/components/social/ConnectionNetwork";
import { InvitationForm } from "@/components/social/InvitationForm";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  LineChart, 
  Users, 
  Mail,
  Link2
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function NetworkPage() {
  useDocumentTitle("Social Network | Act Up");
  const { user } = useAuth();

  return (
    <div className="container py-8 max-w-7xl">
      <PageHeader
        title="Your Social Network"
        description="Track your impact and grow your network of civic activists"
        actions={
          <Button variant="default" className="gap-2">
            <Share2 className="h-4 w-4" />
            <span>Share Act Up</span>
          </Button>
        }
      />

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex mb-6">
          <TabsTrigger value="dashboard" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden md:inline">Impact Dashboard</span>
            <span className="inline md:hidden">Impact</span>
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Connections</span>
            <span className="inline md:hidden">People</span>
          </TabsTrigger>
          <TabsTrigger value="invite" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden md:inline">Invite People</span>
            <span className="inline md:hidden">Invite</span>
          </TabsTrigger>
          <TabsTrigger value="viral" className="gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden md:inline">Viral Spread</span>
            <span className="inline md:hidden">Viral</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Your Impact Metrics</h2>
            <p className="text-muted-foreground mb-6">
              See how your civic engagement is creating a ripple effect. Act Up's viral 
              spread model shows your influence in the movement.
            </p>
            <NetworkImpactDashboard />
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Your Connections</h2>
            <p className="text-muted-foreground mb-6">
              View and manage your connections with other Act Up members. Strong connections
              help grow your influence and reach.
            </p>
            <ConnectionNetwork />
          </div>
        </TabsContent>

        <TabsContent value="invite">
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Invite Someone to Act Up</h2>
                <p className="text-muted-foreground mb-6">
                  Help grow the movement by inviting people who care about civic engagement and 
                  legislative transparency. Each person you invite increases your impact.
                </p>
                
                <div className="bg-muted/40 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-lg mb-2">Why Your Invitations Matter:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2 items-start">
                      <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs mt-0.5">
                        1
                      </div>
                      <div>
                        <span className="font-medium">Increased Network Reach</span> - 
                        Each person you invite extends your influence further
                      </div>
                    </li>
                    <li className="flex gap-2 items-start">
                      <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs mt-0.5">
                        2
                      </div>
                      <div>
                        <span className="font-medium">Higher R₀ Value</span> - 
                        Your civic reproduction number grows when invitees become active
                      </div>
                    </li>
                    <li className="flex gap-2 items-start">
                      <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs mt-0.5">
                        3
                      </div>
                      <div>
                        <span className="font-medium">Progression in Super User Program</span> - 
                        Invitations help you advance to higher levels
                      </div>
                    </li>
                    <li className="flex gap-2 items-start">
                      <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs mt-0.5">
                        4
                      </div>
                      <div>
                        <span className="font-medium">Tipping Point Acceleration</span> - 
                        We reach 25% of Texans faster with your help
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div>
                <InvitationForm />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="viral">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Viral Spread Mechanics</h2>
            <p className="text-muted-foreground mb-6">
              Act Up uses the concept of "civic epidemiology" to track the spread of transparency 
              and accountability. Your role as a super-spreader is critical to our success.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold mb-4">Understanding R₀ Value</h3>
                <p className="mb-4">
                  In epidemiology, R₀ (R-naught) is the basic reproduction number - how many new 
                  cases each existing case generates. For Act Up, it measures how many new active 
                  users each existing user brings in.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 text-red-600 font-semibold rounded-full w-10 h-10 flex items-center justify-center">
                      0.5
                    </div>
                    <div>
                      <h4 className="font-medium">Low Impact</h4>
                      <p className="text-sm text-muted-foreground">
                        Each person brings in less than one new active user
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-600 font-semibold rounded-full w-10 h-10 flex items-center justify-center">
                      1.0
                    </div>
                    <div>
                      <h4 className="font-medium">Stable Growth</h4>
                      <p className="text-sm text-muted-foreground">
                        Each person brings in exactly one new active user
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 font-semibold rounded-full w-10 h-10 flex items-center justify-center">
                      2.0+
                    </div>
                    <div>
                      <h4 className="font-medium">Viral Growth</h4>
                      <p className="text-sm text-muted-foreground">
                        Each person brings in two or more new active users
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold mb-4">The 25% Tipping Point</h3>
                <p className="mb-4">
                  Social science research shows that when 25% of a population adopts a new norm, 
                  a tipping point occurs where rapid change becomes inevitable. For Act Up, this means:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/10 text-primary p-1 rounded mt-0.5">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Critical Mass:</span> When 25% of Texans are Act Up users,
                      a cultural shift in expectations of elected officials will occur
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/10 text-primary p-1 rounded mt-0.5">
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Acceleration:</span> Growth becomes exponential 
                      as the movement approaches the tipping point
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/10 text-primary p-1 rounded mt-0.5">
                      <LineChart className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">The Goal:</span> Act Up needs to reach approximately 
                      5.25 million Texans to achieve the tipping point
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}