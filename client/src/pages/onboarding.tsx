import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import CivicInterestsForm from '@/components/onboarding/CivicInterestsForm';
import EngagementPreferencesForm from '@/components/onboarding/EngagementPreferencesForm';
import TutorialSteps from '@/components/onboarding/TutorialSteps';
import OnboardingCompletion from '@/components/onboarding/OnboardingCompletion';

type OnboardingStep = {
  id: string;
  name: string;
  description: string;
  completed: boolean;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Introduction to Act Up',
    completed: false,
  },
  {
    id: 'interests',
    name: 'Civic Interests',
    description: 'Tell us what issues you care about',
    completed: false,
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description: 'Set up your notification preferences',
    completed: false,
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Learn how to use Act Up',
    completed: false,
  },
  {
    id: 'completion',
    name: 'Completion',
    description: 'You\'re all set!',
    completed: false,
  },
];

const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [progress, setProgress] = useState<number>(0);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's onboarding progress
  const { data: onboardingProgress, isLoading } = useQuery<any>({
    queryKey: ['/api/onboarding/progress'],
    select: (data) => data || [],
  });

  // Mark step as completed
  const completeStepMutation = useMutation({
    mutationFn: (step: string) => apiRequest(`/api/onboarding/progress/${step}/complete`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/progress'] });
    },
  });

  useEffect(() => {
    if (onboardingProgress) {
      // Calculate progress percentage based on completed steps
      const completedCount = onboardingProgress.filter((step: any) => step.completed).length;
      const totalSteps = onboardingSteps.length;
      const percentage = Math.floor((completedCount / totalSteps) * 100);
      setProgress(percentage);

      // Set current step based on progress
      const lastIncompleteStep = onboardingSteps.find(
        (step) => !onboardingProgress.some((p: any) => p.step === step.id && p.completed)
      );
      if (lastIncompleteStep) {
        setCurrentStep(lastIncompleteStep.id);
      }
    }
  }, [onboardingProgress]);

  const handleNextStep = async () => {
    // Mark current step as completed
    await completeStepMutation.mutateAsync(currentStep);

    // Find index of current step
    const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
    
    // Move to next step if it exists
    if (currentIndex < onboardingSteps.length - 1) {
      setCurrentStep(onboardingSteps[currentIndex + 1].id);
    } else {
      // Onboarding completed, redirect to dashboard
      toast({
        title: 'Onboarding completed!',
        description: 'Welcome to Act Up - you\'re all set to start making an impact.',
      });
      setLocation('/dashboard');
    }
  };

  const handleTabChange = (value: string) => {
    setCurrentStep(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Loading your personalized experience...</h3>
          <Progress value={45} className="w-[60vw] max-w-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Act Up</CardTitle>
          <CardDescription className="text-center">
            Let's set up your account to start making a civic impact. Your progress: {progress}%
          </CardDescription>
          <Progress value={progress} className="w-full mt-2" />
        </CardHeader>
        
        <CardContent>
          <Tabs value={currentStep} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-5 mb-8">
              {onboardingSteps.map((step) => (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  disabled={!onboardingProgress?.some((p: any) => p.step === step.id)}
                >
                  {step.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="welcome">
              <OnboardingWelcome />
            </TabsContent>
            
            <TabsContent value="interests">
              <CivicInterestsForm />
            </TabsContent>
            
            <TabsContent value="preferences">
              <EngagementPreferencesForm />
            </TabsContent>
            
            <TabsContent value="tutorial">
              <TutorialSteps />
            </TabsContent>
            
            <TabsContent value="completion">
              <OnboardingCompletion />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/dashboard')}
            disabled={completeStepMutation.isPending}
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleNextStep}
            disabled={completeStepMutation.isPending}
          >
            {currentStep === 'completion' ? 'Finish' : 'Continue'}
            {completeStepMutation.isPending && '...'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingPage;