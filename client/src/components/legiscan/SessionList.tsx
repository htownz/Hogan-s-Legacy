import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Session {
  session_id: number;
  session_name: string;
  year_start: number;
  year_end: number;
  special: number;
  session_hash: string;
  state_id: string;
}

/**
 * SessionList component displays a list of legislative sessions from LegiScan
 */
export function SessionList() {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  
  interface SessionResponse {
    success: boolean;
    data: Session[];
  }

  // Fetch sessions from LegiScan API
  const { data, isLoading, isError } = useQuery<SessionResponse>({
    queryKey: ['/api/legiscan/sessions'],
    retry: 1,
  });

  // Handle session selection
  const handleSessionSelect = (sessionId: number) => {
    setSelectedSession(sessionId);
    toast({
      title: 'Session Selected',
      description: `Selected session ID: ${sessionId}`,
    });
    // This will be expanded later to load bills for the selected session
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle><Skeleton className="h-4 w-40" /></CardTitle>
          <CardDescription><Skeleton className="h-3 w-60" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error Loading Sessions</CardTitle>
          <CardDescription>
            Unable to load legislative sessions. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sessions: Session[] = data?.data || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Legislative Sessions</CardTitle>
        <CardDescription>
          Select a legislative session to view bills and activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-center text-muted-foreground">No sessions available</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedSession === session.session_id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
                onClick={() => handleSessionSelect(session.session_id)}
              >
                <div className="font-medium">{session.session_name}</div>
                <div className="text-sm">
                  {session.year_start}-{session.year_end}
                  {session.special === 1 && ' • Special Session'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}