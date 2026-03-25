import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AnimatedCounter,
  PulsingAlert,
  BillProgressAnimation,
  VotingResultsAnimation,
  ImpactScoreAnimation,
  TrendingInsight,
  CommitteeMeetingCountdown,
  LegislativeAlert,
  EngagementMetrics
} from "@/components/animations/legislative-insights-animations";
import { 
  RefreshCwIcon, 
  PlayIcon, 
  PauseIcon,
  ZapIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  ClockIcon
} from "lucide-react";

export default function LegislativeInsightsDemoPage() {
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentVotes, setCurrentVotes] = useState({ yes: 76, no: 54 });
  const [billStage, setBillStage] = useState(4);
  const [impactScore, setImpactScore] = useState(85);
  const [alerts, setAlerts] = useState([
    {
      id: "1",
      type: "vote" as const,
      title: "HB 2847 Floor Vote Starting",
      description: "Mental Health Services funding bill is now being voted on",
      timestamp: "2 minutes ago",
      isNew: true
    },
    {
      id: "2", 
      type: "deadline" as const,
      title: "Committee Deadline Approaching",
      description: "Education Reform bill deadline in 6 hours",
      timestamp: "5 minutes ago"
    }
  ]);

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const simulateVoteChange = () => {
    setCurrentVotes({
      yes: Math.floor(Math.random() * 30) + 70,
      no: Math.floor(Math.random() * 30) + 45
    });
  };

  const advanceBillStage = () => {
    setBillStage(prev => (prev < 7 ? prev + 1 : 1));
  };

  const changeImpactScore = () => {
    setImpactScore(Math.floor(Math.random() * 40) + 60);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Legislative Insights Micro Animations
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience how dynamic animations bring legislative data to life, making complex civic information 
          engaging and instantly understandable for every citizen.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setIsAnimating(!isAnimating)}
            variant={isAnimating ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {isAnimating ? (
              <>
                <PauseIcon className="w-4 h-4" />
                Pause Animations
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                Resume Animations
              </>
            )}
          </Button>
          
          <Button onClick={() => window.location.reload()} variant="outline" className="flex items-center gap-2">
            <RefreshCwIcon className="w-4 h-4" />
            Reset Demo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="counters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="counters">Counters</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="counters" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ZapIcon className="w-5 h-5 text-blue-600" />
                  Animated Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Active Bills This Session</p>
                  <div className="text-3xl font-bold text-blue-600">
                    <AnimatedCounter value={2847} duration={2000} />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Citizens Engaged</p>
                  <div className="text-3xl font-bold text-green-600">
                    <AnimatedCounter value={45678} duration={2500} />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Bills Passed</p>
                  <div className="text-3xl font-bold text-purple-600">
                    <AnimatedCounter value={127} duration={1500} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <EngagementMetrics 
                  views={12547}
                  likes={3892}
                  comments={567}
                  shares={234}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <ImpactScoreAnimation
                  score={impactScore}
                  label="Community Impact"
                  description="Based on citizen engagement, expert analysis, and projected outcomes"
                />
                <Button 
                  onClick={changeImpactScore}
                  className="w-full mt-4"
                  variant="outline"
                >
                  Update Score
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bill Progress Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <BillProgressAnimation
                  currentStage={billStage}
                  billTitle="HB 2847 - Mental Health Services Funding"
                />
                <Button 
                  onClick={advanceBillStage}
                  className="w-full mt-4"
                  variant="outline"
                >
                  Advance to Next Stage
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Committee Countdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CommitteeMeetingCountdown
                  meetingTitle="Education Committee Review"
                  timeRemaining="2 hours 15 minutes"
                  isUrgent={false}
                />
                
                <CommitteeMeetingCountdown
                  meetingTitle="Budget Committee Final Vote"
                  timeRemaining="45 minutes"
                  isUrgent={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Voting Results</CardTitle>
              </CardHeader>
              <CardContent>
                <VotingResultsAnimation
                  yesVotes={currentVotes.yes}
                  noVotes={currentVotes.no}
                  abstentions={5}
                  billTitle="HB 2847 - Mental Health Funding"
                  isLive={true}
                />
                <Button 
                  onClick={simulateVoteChange}
                  className="w-full mt-4"
                  variant="outline"
                >
                  Simulate Vote Change
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Final Vote Results</CardTitle>
              </CardHeader>
              <CardContent>
                <VotingResultsAnimation
                  yesVotes={89}
                  noVotes={42}
                  abstentions={0}
                  billTitle="SB 1456 - Education Reform"
                  isLive={false}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trending Legislative Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TrendingInsight
                  topic="Mental Health Services Expansion"
                  momentum="rising"
                  change={34}
                  mentions={2847}
                  category="Healthcare"
                />
                
                <TrendingInsight
                  topic="Public School Funding Reform"
                  momentum="stable"
                  change={2}
                  mentions={1956}
                  category="Education"
                />
                
                <TrendingInsight
                  topic="Infrastructure Investment"
                  momentum="falling"
                  change={-12}
                  mentions={1234}
                  category="Transportation"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Urgent Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PulsingAlert variant="urgent">
                  <div className="flex items-center gap-3">
                    <AlertTriangleIcon className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">Committee Vote Deadline</h4>
                      <p className="text-sm">HB 2847 must be voted on before midnight</p>
                    </div>
                  </div>
                </PulsingAlert>

                <PulsingAlert variant="important">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">Public Comment Period Ending</h4>
                      <p className="text-sm">Education reform bill - 2 hours remaining</p>
                    </div>
                  </div>
                </PulsingAlert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Legislative Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map(alert => (
                <LegislativeAlert
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismissAlert}
                />
              ))}
              
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active alerts - all dismissed!</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-4"
                    variant="outline"
                  >
                    Reset Alerts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Making Democracy More Engaging
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These micro animations transform complex legislative data into intuitive, 
              engaging experiences that help every citizen understand and participate in democracy.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  <AnimatedCounter value={15} suffix="%" />
                </div>
                <p className="text-sm text-gray-600">More Engagement</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  <AnimatedCounter value={40} suffix="%" />
                </div>
                <p className="text-sm text-gray-600">Better Understanding</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  <AnimatedCounter value={25} suffix="%" />
                </div>
                <p className="text-sm text-gray-600">Increased Participation</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  <AnimatedCounter value={60} suffix="%" />
                </div>
                <p className="text-sm text-gray-600">Faster Comprehension</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}