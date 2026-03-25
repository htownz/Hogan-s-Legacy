import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface Participant {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  color: string;
  lastActiveAt: string;
}

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hr ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-1" />
          {participants.length} {participants.length === 1 ? 'User' : 'Users'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Active Participants</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {participants.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                No active participants
              </div>
            ) : (
              participants.map(participant => (
                <div key={participant.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                  <div className="relative">
                    <Avatar>
                      {participant.avatarUrl ? (
                        <AvatarImage src={participant.avatarUrl} alt={participant.displayName || participant.username} />
                      ) : (
                        <AvatarFallback style={{ backgroundColor: participant.color }}>
                          {(participant.displayName || participant.username).charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div 
                      className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">
                      {participant.displayName || participant.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last active: {formatLastActive(participant.lastActiveAt)}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="ml-auto">
                    Active
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}