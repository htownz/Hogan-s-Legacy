import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Users, FileText, ListTodo, Lightbulb, MapPin, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';

const OnboardingCompletion: React.FC = () => {
  // Trigger confetti effect on component mount
  React.useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-3">You're All Set!</h2>
        <p className="text-muted-foreground text-lg">
          Your Act Up account is now personalized and ready to go
        </p>
      </div>
      
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-xl mb-4 flex items-center">
          <Check className="h-5 w-5 mr-2 text-primary" />
          What you've accomplished:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
            <span>Created your account and personalized your civic engagement experience</span>
          </li>
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
            <span>Identified the civic issues that matter most to you</span>
          </li>
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
            <span>Set up your notification preferences</span>
          </li>
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
            <span>Learned how to use key features of the Act Up platform</span>
          </li>
        </ul>
      </div>
      
      <h3 className="font-bold text-xl mb-4">Here's what you can do next:</h3>
      
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <ListTodo className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-semibold text-lg mb-1">Track Legislation</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking bills related to your interests and get updates on their progress
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/legislation">Find Bills</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Users className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-semibold text-lg mb-1">Join Action Circles</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with others who share your civic interests and work together
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/action-circles">Explore Circles</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Lightbulb className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-semibold text-lg mb-1">Take Civic Action</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Find opportunities to make an impact on the issues you care about
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/take-action">View Actions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mt-6">
        <h3 className="font-bold text-xl mb-4">Additional Resources</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-start">
            <Bell className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
            <div>
              <h4 className="font-medium mb-1">Set Up Alerts</h4>
              <p className="text-sm text-muted-foreground">Customize your notification settings for bills and events</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
            <div>
              <h4 className="font-medium mb-1">Find Your Representatives</h4>
              <p className="text-sm text-muted-foreground">See who represents you and their voting records</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <FileText className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
            <div>
              <h4 className="font-medium mb-1">Learn Civic Terms</h4>
              <p className="text-sm text-muted-foreground">Access our glossary of legislative and civic terms</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Users className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
            <div>
              <h4 className="font-medium mb-1">Invite Others</h4>
              <p className="text-sm text-muted-foreground">Share Act Up with friends and family</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <Button asChild size="lg">
          <Link href="/dashboard">Go to Your Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default OnboardingCompletion;