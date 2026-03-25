import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageSquare, HelpCircle, AlertTriangle, Lightbulb } from 'lucide-react';

type AnnotationType = 'comment' | 'suggestion' | 'question' | 'issue';

interface AnnotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string, annotationType: AnnotationType }) => void;
  selectedText: string;
}

export function AnnotationDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedText 
}: AnnotationDialogProps) {
  const [content, setContent] = useState('');
  const [annotationType, setAnnotationType] = useState<AnnotationType>('comment');
  
  const handleSubmit = () => {
    if (content.trim() === '') return;
    
    onSubmit({
      content,
      annotationType
    });
    
    // Reset form
    setContent('');
    setAnnotationType('comment');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Annotation</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="selected-text">Selected Text</Label>
            <div 
              id="selected-text"
              className="p-2 bg-muted/50 rounded text-sm italic border border-border"
            >
              {selectedText.length > 100 
                ? `"${selectedText.substring(0, 100)}..."` 
                : `"${selectedText}"`}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="annotation-type">Annotation Type</Label>
            <RadioGroup 
              id="annotation-type" 
              value={annotationType} 
              onValueChange={(value) => setAnnotationType(value as AnnotationType)}
              className="flex flex-wrap gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comment" id="comment" />
                <Label htmlFor="comment" className="flex items-center cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-1 text-blue-500" />
                  Comment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suggestion" id="suggestion" />
                <Label htmlFor="suggestion" className="flex items-center cursor-pointer">
                  <Lightbulb className="h-4 w-4 mr-1 text-amber-500" />
                  Suggestion
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="question" id="question" />
                <Label htmlFor="question" className="flex items-center cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-1 text-purple-500" />
                  Question
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="issue" id="issue" />
                <Label htmlFor="issue" className="flex items-center cursor-pointer">
                  <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                  Issue
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="annotation-content">Your Annotation</Label>
            <Textarea 
              id="annotation-content"
              placeholder="Write your annotation here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={content.trim() === ''}
          >
            Add Annotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}