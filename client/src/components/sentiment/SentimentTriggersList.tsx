import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  FileText, 
  MessageCircle, 
  Mic, 
  Newspaper, 
  Video, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface SentimentTrigger {
  id: number;
  billId: string;
  triggerType: string;
  triggerDescription: string;
  triggerDate: string;
  sentimentImpact: number;
  source: string;
  sourceUrl?: string;
  mediaType?: string;
}

interface SentimentTriggersListProps {
  triggers: SentimentTrigger[];
}

export const SentimentTriggersList: React.FC<SentimentTriggersListProps> = ({ triggers }) => {
  // Sort triggers by date (newest first)
  const sortedTriggers = [...triggers].sort((a, b) => 
    new Date(b.triggerDate).getTime() - new Date(a.triggerDate).getTime()
  );
  
  // Get icon based on trigger type
  const getTriggerIcon = (triggerType: string, mediaType?: string) => {
    switch (triggerType) {
      case 'media_coverage':
        if (mediaType === 'video') return Video;
        if (mediaType === 'audio') return Mic;
        return Newspaper;
      case 'legislative_action':
        return FileText;
      case 'social_media':
        return MessageCircle;
      case 'public_event':
        return Calendar;
      case 'committee_action':
        return Clock;
      case 'controversy':
        return AlertTriangle;
      default:
        return FileText;
    }
  };
  
  // Get badge color based on trigger type
  const getBadgeVariant = (triggerType: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (triggerType) {
      case 'media_coverage':
        return 'default';
      case 'legislative_action':
        return 'secondary';
      case 'social_media':
        return 'outline';
      case 'public_event':
        return 'default';
      case 'committee_action':
        return 'secondary';
      case 'controversy':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Format trigger type for display
  const formatTriggerType = (triggerType: string): string => {
    return triggerType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="space-y-4">
      {sortedTriggers.map((trigger, index) => {
        const TriggerIcon = getTriggerIcon(trigger.triggerType, trigger.mediaType);
        const badgeVariant = getBadgeVariant(trigger.triggerType);
        const formattedDate = format(new Date(trigger.triggerDate), 'MMM d, yyyy');
        
        return (
          <Card key={trigger.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="bg-muted rounded-full p-2 mt-1">
                  <TriggerIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-base">{trigger.triggerDescription}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={badgeVariant}>
                          {formatTriggerType(trigger.triggerType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formattedDate}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {trigger.sentimentImpact > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`font-medium ${
                        trigger.sentimentImpact > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trigger.sentimentImpact > 0 ? '+' : ''}
                        {trigger.sentimentImpact.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  {trigger.source && (
                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">Source:</span>{' '}
                      {trigger.sourceUrl ? (
                        <a 
                          href={trigger.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {trigger.source}
                        </a>
                      ) : (
                        <span>{trigger.source}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {sortedTriggers.length === 0 && (
        <div className="text-center p-6">
          <p className="text-muted-foreground">No sentiment triggers found for this period</p>
        </div>
      )}
    </div>
  );
};