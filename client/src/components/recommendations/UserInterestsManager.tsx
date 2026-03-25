import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, PlusCircle, X, Zap, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface UserInterests {
  id: number;
  userId: number;
  topics: string[];
  causes: string[];
  keywords: string[];
  settings: string;
  createdAt: string;
  updatedAt: string;
}

interface InferenceResponse {
  interests: UserInterests;
  inferred: boolean;
  source: string;
  billCount: number;
}

const UserInterestsManager: React.FC = () => {
  const [newTopic, setNewTopic] = useState('');
  const [newCause, setNewCause] = useState('');
  const [isInferring, setIsInferring] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch user interests
  const { data: interests, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['/api/interests'],
    queryFn: async () => {
      const response = await fetch('/api/interests');
      if (!response.ok) {
        throw new Error('Failed to fetch user interests');
      }
      return response.json() as Promise<UserInterests>;
    }
  });
  
  // State for tracking editable topics and causes
  const [editableTopics, setEditableTopics] = useState<string[]>([]);
  const [editableCauses, setEditableCauses] = useState<string[]>([]);
  
  // Initialize editable state when interests data loads
  useEffect(() => {
    if (interests) {
      setEditableTopics(interests.topics || []);
      setEditableCauses(interests.causes || []);
    }
  }, [interests]);
  
  // Handle authentication errors
  const handleAuthError = (response: Response) => {
    if (response.status === 401) {
      setIsAuthError(true);
      toast({
        title: 'Authentication Required',
        description: 'Please log in to manage your interests.',
        variant: 'destructive',
      });
      return true;
    }
    return false;
  };

  // Save updated interests
  const saveInterests = async () => {
    try {
      const response = await fetch('/api/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: editableTopics,
          causes: editableCauses,
          keywords: interests?.keywords || []
        }),
      });
      
      if (handleAuthError(response)) return;
      
      if (!response.ok) {
        throw new Error('Failed to update interests');
      }
      
      toast({
        title: 'Success!',
        description: 'Your interests have been updated.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/interests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your interests.',
        variant: 'destructive',
      });
    }
  };
  
  // Infer interests from bills
  const inferInterests = async () => {
    try {
      setIsInferring(true);
      
      const response = await fetch('/api/interests/infer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (handleAuthError(response)) {
        setIsInferring(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to infer interests');
      }
      
      const data = await response.json() as InferenceResponse;
      
      if (data.inferred) {
        toast({
          title: 'Success!',
          description: `Inferred ${data.interests.topics.length} interests from ${data.billCount} bills.`,
        });
        
        // Update editable state with new inferred interests
        setEditableTopics(data.interests.topics || []);
        setEditableCauses(data.interests.causes || []);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/interests'] });
        queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      } else {
        toast({
          title: 'No interests found',
          description: 'We couldn\'t infer any interests. Try tracking more bills first.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to infer interests. You may need to track some bills first.',
        variant: 'destructive',
      });
    } finally {
      setIsInferring(false);
    }
  };
  
  // Add a new topic
  const addTopic = () => {
    if (newTopic.trim() === '') return;
    if (editableTopics.includes(newTopic.trim())) {
      toast({
        description: 'This topic is already in your list.',
      });
      return;
    }
    
    setEditableTopics([...editableTopics, newTopic.trim()]);
    setNewTopic('');
  };
  
  // Add a new cause
  const addCause = () => {
    if (newCause.trim() === '') return;
    if (editableCauses.includes(newCause.trim())) {
      toast({
        description: 'This cause is already in your list.',
      });
      return;
    }
    
    setEditableCauses([...editableCauses, newCause.trim()]);
    setNewCause('');
  };
  
  // Remove a topic
  const removeTopic = (topic: string) => {
    setEditableTopics(editableTopics.filter(t => t !== topic));
  };
  
  // Remove a cause
  const removeCause = (cause: string) => {
    setEditableCauses(editableCauses.filter(c => c !== cause));
  };
  
  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!interests) return false;
    
    const originalTopics = interests.topics || [];
    const originalCauses = interests.causes || [];
    
    // Check if arrays have different lengths
    if (originalTopics.length !== editableTopics.length || originalCauses.length !== editableCauses.length) {
      return true;
    }
    
    // Check if arrays have different contents
    for (const topic of originalTopics) {
      if (!editableTopics.includes(topic)) return true;
    }
    
    for (const cause of originalCauses) {
      if (!editableCauses.includes(cause)) return true;
    }
    
    return false;
  };

  // Get popular topics to suggest
  const popularTopics = [
    'Education', 'Healthcare', 'Criminal Justice', 'Environment', 
    'Transportation', 'Taxes', 'Housing', 'Civil Rights',
    'Public Safety', 'Privacy', 'Technology'
  ];
  
  // If authentication error, show login prompt
  if (isAuthError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-blue-500" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">You need to be logged in to manage your interests and get personalized recommendations.</p>
          <Button 
            onClick={() => setLocation('/auth/login')} 
            className="w-full"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Log In to Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle general errors
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Loading Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load your interests. Please try again later.</p>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              refetch();
            }} 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Interests</CardTitle>
        <CardDescription>
          Manage your policy interests to get personalized bill recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            
            <Skeleton className="h-6 w-1/3 mt-4 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Topics</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {editableTopics.length === 0 ? (
                  <p className="text-sm text-gray-500">No topics added yet.</p>
                ) : (
                  editableTopics.map((topic, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      {topic}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeTopic(topic)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a policy topic..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTopic();
                    }
                  }}
                />
                <Button onClick={addTopic} size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {editableTopics.length === 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-2">Suggested topics:</p>
                  <div className="flex flex-wrap gap-1">
                    {popularTopics.map((topic, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setNewTopic(topic);
                          addTopic();
                        }}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Causes</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {editableCauses.length === 0 ? (
                  <p className="text-sm text-gray-500">No causes added yet.</p>
                ) : (
                  editableCauses.map((cause, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      {cause}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeCause(cause)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a cause you care about..."
                  value={newCause}
                  onChange={(e) => setNewCause(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCause();
                    }
                  }}
                />
                <Button onClick={addCause} size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="outline"
          onClick={inferInterests}
          disabled={isInferring}
        >
          {isInferring ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Inferring...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Infer from Tracked Bills
            </>
          )}
        </Button>
        
        <Button
          onClick={saveInterests}
          disabled={!hasChanges()}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserInterestsManager;