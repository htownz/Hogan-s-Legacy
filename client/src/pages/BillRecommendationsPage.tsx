import React from 'react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from '@/layouts/MainLayout';
import PersonalizedBillRecommendations from '@/components/recommendations/PersonalizedBillRecommendations';
import UserInterestsManager from '@/components/recommendations/UserInterestsManager';

const BillRecommendationsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">Bill Recommendations</h1>
        <p className="text-gray-600 mb-6">
          Discover bills that matter to you based on your interests and AI-powered analysis
        </p>
        
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Personalized Bill Discovery</AlertTitle>
          <AlertDescription>
            Act Up uses advanced AI to find bills that align with your interests and could impact you personally.
            Add your interests to get started or let us analyze bills you've tracked to make recommendations.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="recommended" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="recommended">Bill Recommendations</TabsTrigger>
            <TabsTrigger value="interests">Manage Interests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommended">
            <div className="grid gap-6">
              <PersonalizedBillRecommendations />
            </div>
          </TabsContent>
          
          <TabsContent value="interests">
            <div className="grid gap-6">
              <UserInterestsManager />
              
              <Card>
                <CardHeader>
                  <CardTitle>How Recommendations Work</CardTitle>
                  <CardDescription>
                    Understanding how Act Up recommends bills personalized to you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg mb-1">Interest Matching</h3>
                      <p className="text-gray-700">
                        We match your interests with bill topics and content to find relevant legislation.
                        The more specific your interests, the better our recommendations will be.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-1">Personal Impact Analysis</h3>
                      <p className="text-gray-700">
                        Our AI analyzes how each bill might affect you personally, 
                        your family, and your community based on your interests and past interactions.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-1">Interest Inference</h3>
                      <p className="text-gray-700">
                        We can automatically detect your interests by analyzing bills you've tracked or interacted with.
                        This helps us provide better recommendations even if you haven't explicitly set your interests.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default BillRecommendationsPage;