import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { VoiceNarratorControls } from './VoiceNarratorControls';

export interface LegislativeContentNarratorProps {
  title: string;
  billId?: string;
  sections?: {
    id: string;
    title: string;
    content: string;
  }[];
  summaryText?: string;
  fullText?: string;
  className?: string;
}

/**
 * Legislative Content Narrator Component
 * Provides narration controls for different sections of legislative content
 */
export function LegislativeContentNarrator({
  title,
  billId,
  sections = [],
  summaryText,
  fullText,
  className = ''
}: LegislativeContentNarratorProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Get the current text to narrate based on selection
  const getCurrentText = useCallback(() => {
    if (selectedSection === 'summary') {
      return summaryText || '';
    } else if (selectedSection === 'full') {
      return fullText || '';
    } else if (selectedSection) {
      const section = sections.find(s => s.id === selectedSection);
      return section?.content || '';
    }
    return '';
  }, [selectedSection, summaryText, fullText, sections]);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(sectionId === selectedSection ? null : sectionId);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Voice Narrator</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleExpand}
            aria-label={expanded ? 'Collapse narrator' : 'Expand narrator'}
          >
            {expanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Listen to legislative content read aloud
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <VoiceNarratorControls 
          text={getCurrentText()}
          simplified={!expanded}
        />
        
        {expanded && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Available Content</h4>
              <div className="flex flex-wrap gap-2">
                {summaryText && (
                  <Badge
                    variant={selectedSection === 'summary' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleSelectSection('summary')}
                  >
                    Bill Summary
                  </Badge>
                )}
                
                {fullText && (
                  <Badge
                    variant={selectedSection === 'full' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleSelectSection('full')}
                  >
                    Full Text
                  </Badge>
                )}
                
                {sections.map((section) => (
                  <Badge
                    key={section.id}
                    variant={selectedSection === section.id ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleSelectSection(section.id)}
                  >
                    {section.title}
                  </Badge>
                ))}
              </div>
            </div>
            
            {selectedSection && (
              <div className="rounded-md bg-muted p-3">
                <h4 className="mb-2 text-sm font-medium">
                  {selectedSection === 'summary'
                    ? 'Bill Summary'
                    : selectedSection === 'full'
                    ? 'Full Bill Text'
                    : sections.find(s => s.id === selectedSection)?.title || ''}
                </h4>
                <p className="text-sm text-muted-foreground max-h-24 overflow-y-auto">
                  {getCurrentText().substring(0, 300)}
                  {getCurrentText().length > 300 && '...'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LegislativeContentNarrator;