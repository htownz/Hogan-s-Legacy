import React from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { AlertCircle, Info } from 'lucide-react';

const OnboardingWelcome: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome to Act Up!</h2>
        <p className="text-muted-foreground text-lg">
          Your platform for meaningful civic engagement and legislative impact
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-xl mb-2">What is Act Up?</CardTitle>
          <CardDescription className="text-base">
            Act Up is a 100% free, open-source platform that empowers citizens to engage with 
            their local government more effectively. We provide tools to track legislation, 
            understand civic processes, and take meaningful action on issues that matter to you.
          </CardDescription>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-xl mb-2">Track Legislation</CardTitle>
            <CardDescription className="text-base">
              Follow bills as they move through the legislative process with real-time updates, 
              plain language summaries, and impact assessments.
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-xl mb-2">Understand Impact</CardTitle>
            <CardDescription className="text-base">
              See how proposed legislation could affect your community with AI-powered analysis 
              and contextual insights.
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-xl mb-2">Take Action</CardTitle>
            <CardDescription className="text-base">
              Connect with advocacy groups, contact elected officials, and coordinate with others 
              who share your civic interests.
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-xl mb-2">Build Community</CardTitle>
            <CardDescription className="text-base">
              Join a network of engaged citizens working together to create positive change through 
              informed civic participation.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      
      <Alert variant="default" className="bg-primary/10 border-primary/30">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Your Privacy Matters</AlertTitle>
        <AlertDescription>
          Act Up is committed to protecting your personal information. We'll never sell your data, 
          and you have complete control over what you share and who you connect with.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center mt-4">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Complete this onboarding to personalize your experience</span>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;