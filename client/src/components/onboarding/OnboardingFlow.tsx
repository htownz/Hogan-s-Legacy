import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Check, X, ChevronRight, Bell, MapPin, Heart, Sparkles, UserPlus, Calendar, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";

interface UserInterests {
  categories: string[];
  zipCode: string;
  alertPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Define available interest categories for users
const interestCategories = [
  { id: "healthcare", label: "Healthcare access", icon: "🏥" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "gunlaws", label: "Gun laws", icon: "🔫" },
  { id: "lgbtq", label: "LGBTQ+ rights", icon: "🏳️‍🌈" },
  { id: "environment", label: "Environment", icon: "🌎" },
  { id: "taxes", label: "Taxes", icon: "💰" },
  { id: "immigration", label: "Immigration", icon: "🌐" },
  { id: "housing", label: "Housing", icon: "🏠" },
  { id: "criminal", label: "Criminal justice", icon: "⚖️" },
  { id: "voting", label: "Voting rights", icon: "🗳️" },
  { id: "transportation", label: "Transportation", icon: "🚗" },
  { id: "business", label: "Business regulation", icon: "💼" },
];

// Mock sample bill based on interests - would be replaced with real API call
const getSampleBill = (interests: string[], zipCode: string) => {
  // In a real implementation, this would fetch from the API based on interests and location
  return {
    id: "TX-HB1234",
    title: "Relating to public school finance and property tax relief",
    summary: "Comprehensive reform of school funding and property tax rates",
    impactSummary: "This bill may affect your local school district funding and potentially lower your property taxes if you're a homeowner in your ZIP code area.",
    category: "Education",
    relevance: 85,
  };
};

const OnboardingFlow: React.FC = () => {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [userInterests, setUserInterests] = useState<UserInterests>({
    categories: [],
    zipCode: "",
    alertPreferences: {
      email: true,
      push: true,
      sms: false,
    },
  });
  const [zipCodeError, setZipCodeError] = useState<string | null>(null);
  const [sampleBill, setSampleBill] = useState<any>(null);
  const totalSteps = 6;

  // Progress calculation
  const progress = (currentStep / totalSteps) * 100;

  // Handle interest selection/deselection
  const toggleInterest = (categoryId: string) => {
    setUserInterests((prev) => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: newCategories };
    });
  };

  // Handle ZIP code validation
  const validateZipCode = (zipCode: string) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    
    if (zipCode === "") {
      setZipCodeError(null);
      return true;
    }
    
    if (!zipRegex.test(zipCode)) {
      setZipCodeError("Please enter a valid 5-digit ZIP code");
      return false;
    }
    
    setZipCodeError(null);
    return true;
  };

  // Handle alert preferences
  const toggleAlertPreference = (type: 'email' | 'push' | 'sms') => {
    setUserInterests((prev) => ({
      ...prev,
      alertPreferences: {
        ...prev.alertPreferences,
        [type]: !prev.alertPreferences[type],
      },
    }));
  };

  // Move to next step if validation passes
  const handleNextStep = () => {
    if (currentStep === 2 && userInterests.categories.length < 2) {
      // Require at least 2 interests
      return;
    }

    if (currentStep === 3 && userInterests.zipCode !== "") {
      // Validate ZIP code if provided
      if (!validateZipCode(userInterests.zipCode)) {
        return;
      }
    }

    // If we're moving to the sample bill step, get a sample bill
    if (currentStep === 3) {
      const bill = getSampleBill(userInterests.categories, userInterests.zipCode);
      setSampleBill(bill);
    }

    // Proceed to next step
    setCurrentStep((prev) => prev + 1);
  };

  // Go back to previous step
  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Mutation for saving user preferences
  const savePreferencesMutation = useMutation({
    mutationFn: (data: UserInterests) => {
      return fetch("/api/users/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to save preferences");
        return res.json();
      });
    },
    onSuccess: () => {
      // Navigate to dashboard on success
      setLocation("/dashboard");
    },
    onError: (error) => {
      console.error("Failed to save preferences:", error);
    }
  });

  // Complete onboarding and save preferences
  const completeOnboarding = () => {
    savePreferencesMutation.mutate(userInterests);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      {/* Progress indicator */}
      <div className="w-full max-w-md mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>Step {currentStep} of {totalSteps}</span>
          <button 
            onClick={handlePreviousStep} 
            className="text-blue-500 hover:underline disabled:opacity-50 disabled:no-underline"
            disabled={currentStep === 1}
          >
            Back
          </button>
        </div>
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900">Welcome to Act Up</h1>
                <p className="text-center text-gray-600 mt-2">This isn't politics as usual.</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  We don't editorialize. We reveal. We don't tell you what matters—we help you see what does.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700 px-6">
                  Let's Go <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2: Choose interests */}
          {currentStep === 2 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900">What do you care about most?</h1>
                <p className="text-center text-gray-600 mt-2">Select at least 2 issues that matter to you.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {interestCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleInterest(category.id)}
                      className={`
                        flex items-center p-3 rounded-lg border transition-all
                        ${userInterests.categories.includes(category.id)
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}
                      `}
                    >
                      <span className="mr-2">{category.icon}</span>
                      <span className="text-sm">{category.label}</span>
                      {userInterests.categories.includes(category.id) && (
                        <Check className="ml-auto h-4 w-4 text-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
                {userInterests.categories.length < 2 && (
                  <p className="text-sm text-amber-600 mt-2">Please select at least 2 issues to continue.</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button 
                  onClick={handleNextStep} 
                  disabled={userInterests.categories.length < 2}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6 disabled:opacity-50"
                >
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3: ZIP Code */}
          {currentStep === 3 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900">What's your ZIP code?</h1>
                <p className="text-center text-gray-600 mt-2">
                  We'll show you how bills affect your life—right where you live.
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Enter ZIP code (optional)"
                    value={userInterests.zipCode}
                    onChange={(e) => {
                      setUserInterests({ ...userInterests, zipCode: e.target.value });
                      validateZipCode(e.target.value);
                    }}
                    className="text-center text-lg"
                  />
                  {zipCodeError && (
                    <p className="text-sm text-red-500 mt-2">{zipCodeError}</p>
                  )}
                  <p className="text-center text-gray-500 text-sm mt-3">
                    This helps us personalize your experience. You can skip this step.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button onClick={handleNextStep} className="bg-green-600 hover:bg-green-700 px-6">
                  {userInterests.zipCode ? "Continue" : "Skip for now"} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 4: Sample Impact Card */}
          {currentStep === 4 && sampleBill && (
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <h1 className="text-2xl font-bold text-center text-gray-900">Here's a bill that affects you</h1>
                <p className="text-center text-gray-600 mt-2">
                  Based on your interests{userInterests.zipCode ? ` and location` : ''}
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border p-4 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {sampleBill.category}
                    </Badge>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 mr-2">Relevance:</span>
                      <Badge className="bg-green-100 text-green-800 border-0">
                        {sampleBill.relevance}%
                      </Badge>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{sampleBill.id}: {sampleBill.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{sampleBill.summary}</p>
                  
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-amber-800 mb-2">How it affects you</h4>
                    <p className="text-amber-700 text-sm">{sampleBill.impactSummary}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Track This
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Get Alerts
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button onClick={handleNextStep} className="bg-purple-600 hover:bg-purple-700 px-6">
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 5: Alerts */}
          {currentStep === 5 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900">Want us to alert you when things happen?</h1>
                <p className="text-center text-gray-600 mt-2">
                  No spam. Just real-time changes that matter.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium">Email Alerts</h3>
                      <p className="text-sm text-gray-500">Daily summaries and important updates</p>
                    </div>
                    <Switch
                      checked={userInterests.alertPreferences.email}
                      onCheckedChange={() => toggleAlertPreference('email')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Immediate alerts for time-sensitive updates</p>
                    </div>
                    <Switch
                      checked={userInterests.alertPreferences.push}
                      onCheckedChange={() => toggleAlertPreference('push')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium">SMS Alerts</h3>
                      <p className="text-sm text-gray-500">Text message alerts for critical changes</p>
                    </div>
                    <Switch
                      checked={userInterests.alertPreferences.sms}
                      onCheckedChange={() => toggleAlertPreference('sms')}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button onClick={handleNextStep} className="bg-amber-600 hover:bg-amber-700 px-6">
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 6: Dashboard Intro */}
          {currentStep === 6 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-teal-600" />
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900">You're in. Welcome to your dashboard.</h1>
                <p className="text-center text-gray-600 mt-2">
                  Here's what you'll find and what to do next.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start p-3 bg-teal-50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <Heart className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-teal-900">My Issues</h3>
                      <p className="text-sm text-teal-700">Track the causes you care about</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Tracked Bills</h3>
                      <p className="text-sm text-blue-700">Bills you're following with updates</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-900">Timeline</h3>
                      <p className="text-sm text-purple-700">See what's happening and when</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-amber-50 rounded-lg">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-900">Impact Cards</h3>
                      <p className="text-sm text-amber-700">How legislation affects your life</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-gray-800 mb-2">Next Actions:</h3>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Check className="mr-2 h-4 w-4" /> Track more bills
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <UserPlus className="mr-2 h-4 w-4" /> Invite a friend
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Sparkles className="mr-2 h-4 w-4" /> Generate my story card
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button onClick={completeOnboarding} className="bg-teal-600 hover:bg-teal-700 px-6">
                  Go to Dashboard
                </Button>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingFlow;