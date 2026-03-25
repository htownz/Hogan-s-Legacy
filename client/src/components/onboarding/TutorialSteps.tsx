import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, ArrowRight, Search, ListTodo, Users, MessageSquare, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TutorialStep = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  hasInteractiveExample: boolean;
};

const TutorialSteps: React.FC = () => {
  const [currentTutorial, setCurrentTutorial] = useState<string>('findBills');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tutorial progress
  const { data: tutorialProgress, isLoading } = useQuery<any>({
    queryKey: ['/api/onboarding/tutorial'],
    select: (data) => data || [],
  });

  // Complete tutorial step
  const completeTutorialStepMutation = useMutation({
    mutationFn: (tutorialId: string) => apiRequest(`/api/onboarding/tutorial/${tutorialId}/complete`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/tutorial'] });
      toast({
        title: 'Tutorial step completed',
        description: 'Your progress has been saved.',
      });
    },
  });

  // Check if a tutorial step is completed
  const isStepCompleted = (tutorialId: string) => {
    return tutorialProgress?.some((step: any) => step.tutorialId === tutorialId && step.completed);
  };

  // Handle completing a tutorial step
  const handleCompleteStep = async (tutorialId: string) => {
    if (!isStepCompleted(tutorialId)) {
      await completeTutorialStepMutation.mutateAsync(tutorialId);
    }
  };

  // Move to the next tutorial step
  const handleNextStep = (currentId: string) => {
    const currentIndex = tutorialSteps.findIndex(step => step.id === currentId);
    if (currentIndex < tutorialSteps.length - 1) {
      setCurrentTutorial(tutorialSteps[currentIndex + 1].id);
    }
  };

  // Tutorial steps definition
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'findBills',
      title: 'Finding Relevant Bills',
      icon: <Search className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>
            The bill search system in Act Up helps you find legislation that matters to you. 
            You can search by:
          </p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>Keywords in bill text or title</li>
            <li>Bill number (e.g., HB1234, SB789)</li>
            <li>Topic areas (e.g., Education, Healthcare)</li>
            <li>Sponsor name (the legislator who authored the bill)</li>
          </ul>
          
          <p>
            When viewing search results, you'll see a brief summary of each bill, its current
            status in the legislative process, and key information such as sponsors and committees.
          </p>
          
          <p>
            <strong>Pro tip:</strong> Use the advanced filters to narrow down results by date introduced,
            committee assignment, or legislative session.
          </p>
        </div>
      ),
      hasInteractiveExample: true,
    },
    {
      id: 'trackBills',
      title: 'Tracking Bills',
      icon: <ListTodo className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>
            Once you find bills that interest you, you can track them to receive updates on their progress.
            To track a bill:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>Click the "Track" button on any bill detail page</li>
            <li>Choose your notification preferences for this specific bill</li>
            <li>Optionally add a personal note about why you're tracking this bill</li>
          </ol>
          
          <p>
            Your tracked bills appear on your dashboard for easy access. When a tracked bill has an update
            (like a committee hearing, amendment, or vote), you'll be notified based on your preferences.
          </p>
          
          <p>
            <strong>Pro tip:</strong> Create custom bill collections to organize related legislation
            (e.g., "Education Bills 2023" or "My District's Bills").
          </p>
        </div>
      ),
      hasInteractiveExample: true,
    },
    {
      id: 'takeAction',
      title: 'Taking Civic Action',
      icon: <Sparkles className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>
            Act Up makes it easy to take meaningful action on the issues you care about:
          </p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Contact Officials:</strong> Quickly send messages to your representatives about specific bills
            </li>
            <li>
              <strong>Join Action Circles:</strong> Connect with other citizens who share your concerns
            </li>
            <li>
              <strong>Attend Events:</strong> Find hearings, town halls, and advocacy events
            </li>
            <li>
              <strong>Share Impact Cards:</strong> Post informative graphics about bills to social media
            </li>
          </ul>
          
          <p>
            The platform suggests relevant actions based on the bills you track and your interests.
            You can also set goals for your civic engagement and track your impact over time.
          </p>
          
          <p>
            <strong>Pro tip:</strong> The "Action History" section shows your previous civic actions
            and their outcomes, helping you see your personal impact.
          </p>
        </div>
      ),
      hasInteractiveExample: false,
    },
    {
      id: 'collaborate',
      title: 'Collaborating with Others',
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>
            Civic engagement is more effective when people work together. Act Up provides several
            ways to collaborate with other citizens:
          </p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Action Circles:</strong> Join or create groups focused on specific issues
            </li>
            <li>
              <strong>Bill Annotations:</strong> Add insights and comments to legislation that others can see
            </li>
            <li>
              <strong>Discussion Threads:</strong> Participate in thoughtful conversations about bills
            </li>
            <li>
              <strong>Shared Collections:</strong> Create and share curated lists of related bills
            </li>
          </ul>
          
          <p>
            You control your privacy settings for all collaborative features, deciding what you
            share and with whom.
          </p>
          
          <p>
            <strong>Pro tip:</strong> Look for the "Community Insights" badge on bills to see 
            annotations and analysis from trusted community members and subject matter experts.
          </p>
        </div>
      ),
      hasInteractiveExample: false,
    },
    {
      id: 'understandBills',
      title: 'Understanding Legislation',
      icon: <FileText className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>
            Legislative text can be complex and difficult to understand. Act Up provides several
            tools to help you make sense of bills:
          </p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Plain Language Summaries:</strong> Easy-to-understand explanations of what a bill does
            </li>
            <li>
              <strong>Impact Analysis:</strong> How the bill might affect different communities
            </li>
            <li>
              <strong>Legislative Context:</strong> Related laws, previous versions, and similar bills
            </li>
            <li>
              <strong>Key Terms:</strong> Definitions of legal and policy terminology used in the bill
            </li>
          </ul>
          
          <p>
            When viewing a bill, you can toggle between the official text and various explanation tools
            to gain a comprehensive understanding.
          </p>
          
          <p>
            <strong>Pro tip:</strong> Use the "Bill Comparison" feature to see side-by-side differences
            between different versions of a bill or between competing bills on the same topic.
          </p>
        </div>
      ),
      hasInteractiveExample: true,
    },
  ];

  if (isLoading) {
    return <div className="text-center py-8">Loading tutorial content...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Learn How to Use Act Up</h2>
        <p className="text-muted-foreground">
          Follow this quick tutorial to master the key features of the platform
        </p>
      </div>

      <Tabs value={currentTutorial} onValueChange={setCurrentTutorial} className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-6">
          {tutorialSteps.map((step) => (
            <TabsTrigger 
              key={step.id} 
              value={step.id}
              className="relative"
            >
              {isStepCompleted(step.id) && (
                <CheckCircle2 className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
              )}
              <span className="sr-only">{step.title}</span>
              {step.icon}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tutorialSteps.map((step) => (
          <TabsContent key={step.id} value={step.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {step.icon}
                    <span>{step.title}</span>
                  </CardTitle>
                  {isStepCompleted(step.id) && (
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Step {tutorialSteps.findIndex(s => s.id === step.id) + 1} of {tutorialSteps.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step.content}
              </CardContent>
              {step.hasInteractiveExample && (
                <div className="px-6 py-4 bg-muted/50 border-t">
                  <h4 className="font-medium mb-2">Interactive Example</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click the button below to see this feature in action with a guided walkthrough.
                  </p>
                  <Button variant="secondary" className="w-full">
                    Try Interactive Example
                  </Button>
                </div>
              )}
              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => handleCompleteStep(step.id)}
                  disabled={completeTutorialStepMutation.isPending || isStepCompleted(step.id)}
                >
                  {isStepCompleted(step.id) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completed
                    </>
                  ) : completeTutorialStepMutation.isPending ? (
                    'Marking complete...'
                  ) : (
                    'Mark as Complete'
                  )}
                </Button>
                
                <Button
                  onClick={() => handleNextStep(step.id)}
                  disabled={tutorialSteps.findIndex(s => s.id === step.id) === tutorialSteps.length - 1}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TutorialSteps;