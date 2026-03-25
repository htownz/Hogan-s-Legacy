import { useState, useRef, useEffect, MouseEvent } from "react";
import { useUser } from "@/hooks/use-user";
import { 
  useUserBillHighlights, 
  useBillHighlights, 
  useCreateBillHighlight,
  useUpdateBillHighlight,
  useDeleteBillHighlight
} from "@/hooks/use-bill-interactions";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Edit, 
  Trash2, 
  Globe, 
  Lock, 
  Highlighter,
  Check, 
  X,
  Pen,
  SquareUser
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BillHighlight } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BillHighlighterProps {
  billId: string;
  billContent: string; // HTML content of the bill
  contentContainerId: string; // ID of the container element with the bill text
}

type TextPosition = {
  startIndex: number;
  endIndex: number;
  section: string;
};

const HIGHLIGHT_COLORS = {
  "yellow": "bg-yellow-200 dark:bg-yellow-900/60",
  "green": "bg-green-200 dark:bg-green-900/60",
  "blue": "bg-blue-200 dark:bg-blue-900/60",
  "pink": "bg-pink-200 dark:bg-pink-900/60",
  "purple": "bg-purple-200 dark:bg-purple-900/60",
  "red": "bg-red-200 dark:bg-red-900/60",
};

export function BillHighlighter({ billId, billContent, contentContainerId }: BillHighlighterProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [selection, setSelection] = useState<TextPosition | null>(null);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<keyof typeof HIGHLIGHT_COLORS>("yellow");
  const [highlightComment, setHighlightComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const contentRef = useRef<HTMLDivElement | null>(null);
  
  const { data: userHighlights = [] } = useUserBillHighlights(billId);
  const { data: publicHighlights = [] } = useBillHighlights(billId);
  
  const createHighlightMutation = useCreateBillHighlight(billId);
  const updateHighlightMutation = useUpdateBillHighlight(billId);
  const deleteHighlightMutation = useDeleteBillHighlight(billId);
  
  // Set content reference on mount
  useEffect(() => {
    contentRef.current = document.getElementById(contentContainerId) as HTMLDivElement;
  }, [contentContainerId]);
  
  // Handle text selection in the bill content
  const handleSelection = () => {
    if (!contentRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelection(null);
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    // Only allow selections within the content container
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }
    
    // Calculate indices relative to the content
    const content = contentRef.current.textContent || "";
    const selectedText = selection.toString().trim();
    
    // Simplistic approach: find the text's position
    // In a real app, you might need a more robust solution
    const startIndex = content.indexOf(selectedText);
    if (startIndex === -1) {
      setSelection(null);
      return;
    }
    
    setSelection({
      startIndex,
      endIndex: startIndex + selectedText.length,
      section: "main" // Default section, could be more specific
    });
    
    // Turn on highlighting mode
    setIsHighlighting(true);
  };
  
  // Apply highlight to the selected text
  const applyHighlight = async () => {
    if (!selection || !user) return;
    
    const selectedText = billContent.substring(selection.startIndex, selection.endIndex);
    
    try {
      await createHighlightMutation.mutateAsync({
        userId: user.id,
        textContent: selectedText,
        textPosition: selection,
        color: selectedColor,
        comment: highlightComment,
        isPrivate
      });
      
      // Reset state
      setIsHighlighting(false);
      setSelection(null);
      setHighlightComment("");
      window.getSelection()?.removeAllRanges();
      
    } catch (error) {
      console.error("Failed to create highlight:", error);
      toast({
        title: "Failed to create highlight",
        description: "There was an error saving your highlight.",
        variant: "destructive",
      });
    }
  };
  
  // Cancel highlighting
  const cancelHighlight = () => {
    setIsHighlighting(false);
    setSelection(null);
    setHighlightComment("");
    window.getSelection()?.removeAllRanges();
  };
  
  // Handle updating a highlight
  const handleUpdateHighlight = async (highlight: BillHighlight, comment: string, isPrivate: boolean) => {
    try {
      await updateHighlightMutation.mutateAsync({
        highlightId: highlight.id,
        data: {
          comment,
          isPrivate
        }
      });
      
      toast({
        title: "Highlight updated",
        description: "Your highlight has been updated successfully.",
      });
      
    } catch (error) {
      console.error("Failed to update highlight:", error);
      toast({
        title: "Failed to update highlight",
        description: "There was an error updating your highlight.",
        variant: "destructive",
      });
    }
  };
  
  // Handle deleting a highlight
  const handleDeleteHighlight = async (highlightId: number) => {
    if (confirm("Are you sure you want to delete this highlight?")) {
      try {
        await deleteHighlightMutation.mutateAsync(highlightId);
        
        toast({
          title: "Highlight deleted",
          description: "Your highlight has been deleted successfully.",
        });
        
      } catch (error) {
        console.error("Failed to delete highlight:", error);
        toast({
          title: "Failed to delete highlight",
          description: "There was an error deleting your highlight.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Function to render highlights in the bill content
  const renderHighlightedContent = () => {
    if (!billContent) return <div>No content to display</div>;
    
    let result = billContent;
    const allHighlights = [...userHighlights, ...publicHighlights.filter((h: any) => 
      !userHighlights.some((uh: any) => uh.id === h.id)
    )];
    
    // Sort by startIndex descending to avoid position shifting issues
    allHighlights.sort((a, b) => {
      const posA = a.textPosition as TextPosition;
      const posB = b.textPosition as TextPosition;
      return posB.startIndex - posA.startIndex;
    });
    
    // Apply highlights
    allHighlights.forEach(highlight => {
      const position = highlight.textPosition as TextPosition;
      const colorClass = HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS] || HIGHLIGHT_COLORS.yellow;
      
      const highlightId = `highlight-${highlight.id}`;
      const isUserHighlight = highlight.userId === user?.id;
      
      // Create HTML with highlight
      const before = result.substring(0, position.startIndex);
      const text = result.substring(position.startIndex, position.endIndex);
      const after = result.substring(position.endIndex);
      
      result = `${before}<span id="${highlightId}" class="${colorClass} cursor-pointer rounded px-1 highlight-span" 
        data-highlight-id="${highlight.id}" 
        data-user-highlight="${isUserHighlight}">${text}</span>${after}`;
    });
    
    return <div dangerouslySetInnerHTML={{ __html: result }} />;
  };
  
  // Set up event listeners for text selection
  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
    };
  }, []);
  
  // Set up highlight span click handlers
  useEffect(() => {
    const handleHighlightClick = (e: MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('highlight-span')) {
        const highlightId = parseInt(target.dataset.highlightId || "0");
        const isUserHighlight = target.dataset.userHighlight === "true";
        
        const highlight = isUserHighlight
          ? userHighlights.find((h: any) => h.id === highlightId)
          : publicHighlights.find((h: any) => h.id === highlightId);
        
        if (highlight) {
          // Open some context menu or tooltip for the highlight
          console.log("Clicked highlight:", highlight);
        }
      }
    };
    
    const container = document.getElementById(contentContainerId);
    if (container) {
      container.addEventListener("click", handleHighlightClick as any);
      return () => {
        container.removeEventListener("click", handleHighlightClick as any);
      };
    }
  }, [userHighlights, publicHighlights, contentContainerId]);
  
  // If no user, don't render the highlighting tool
  if (!user) return null;
  
  return (
    <>
      {/* Highlighter Tool */}
      <div className="fixed bottom-4 right-4 z-50">
        <Popover open={isHighlighting} onOpenChange={setIsHighlighting}>
          <PopoverTrigger asChild>
            <Button 
              size="icon" 
              className={cn(
                "h-12 w-12 rounded-full shadow-lg", 
                isHighlighting ? "bg-primary text-primary-foreground" : ""
              )}
            >
              <Highlighter className="h-6 w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            {selection ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Selected Text</h4>
                  <div className="text-sm p-2 bg-muted rounded">
                    {billContent.substring(selection.startIndex, selection.endIndex)}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Highlight Color</h4>
                  <Select 
                    value={selectedColor} 
                    onValueChange={(value) => setSelectedColor(value as keyof typeof HIGHLIGHT_COLORS)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(HIGHLIGHT_COLORS).map(([color, _]) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center">
                            <div 
                              className={`w-4 h-4 rounded ${HIGHLIGHT_COLORS[color as keyof typeof HIGHLIGHT_COLORS]} mr-2`}
                            />
                            <span className="capitalize">{color}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Add a Comment (Optional)</h4>
                  <Textarea
                    placeholder="Add a comment about this highlight..."
                    value={highlightComment}
                    onChange={(e) => setHighlightComment(e.target.value)}
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="highlight-privacy" 
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="highlight-privacy" className="cursor-pointer">
                    {isPrivate ? 
                      <span className="flex items-center"><Lock className="h-4 w-4 mr-1" /> Private</span> : 
                      <span className="flex items-center"><Globe className="h-4 w-4 mr-1" /> Public</span>
                    }
                  </Label>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={cancelHighlight}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button onClick={applyHighlight} disabled={createHighlightMutation.isPending}>
                    <Check className="h-4 w-4 mr-1" />
                    Apply Highlight
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-2">
                <p className="text-sm text-muted-foreground">
                  Select text in the bill content to highlight it.
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Highlighted Content Rendering */}
      {renderHighlightedContent()}
      
      {/* User Highlights List */}
      {userHighlights.length > 0 && (
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold mb-3">Your Highlights</h3>
          <div className="space-y-3">
            {userHighlights.map((highlight: any) => (
              <HighlightItem
                key={highlight.id}
                highlight={highlight}
                onUpdate={handleUpdateHighlight}
                onDelete={handleDeleteHighlight}
              />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

// Component to display a highlight item in the list
interface HighlightItemProps {
  highlight: BillHighlight;
  onUpdate: (highlight: BillHighlight, comment: string, isPrivate: boolean) => Promise<void>;
  onDelete: (highlightId: number) => Promise<void>;
}

function HighlightItem({ highlight, onUpdate, onDelete }: HighlightItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(highlight.comment || "");
  const [isPrivate, setIsPrivate] = useState(highlight.isPrivate);
  const colorClass = HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS] || HIGHLIGHT_COLORS.yellow;
  
  const handleUpdate = async () => {
    await onUpdate(highlight, comment, isPrivate);
    setIsEditing(false);
  };
  
  return (
    <div className="border rounded-md p-3">
      <div className={`${colorClass} rounded-sm p-2 mb-2 text-sm`}>
        {highlight.textContent}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="text-sm"
          />
          
          <div className="flex items-center space-x-2">
            <Switch 
              id={`highlight-privacy-${highlight.id}`} 
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor={`highlight-privacy-${highlight.id}`} className="cursor-pointer text-sm">
              {isPrivate ? 
                <span className="flex items-center"><Lock className="h-3 w-3 mr-1" /> Private</span> : 
                <span className="flex items-center"><Globe className="h-3 w-3 mr-1" /> Public</span>
              }
            </Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm mb-2">
            {highlight.comment ? highlight.comment : <span className="text-muted-foreground italic">No comment</span>}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-muted-foreground">
              {highlight.isPrivate ? (
                <span className="flex items-center"><Lock className="h-3 w-3 mr-1" /> Private</span>
              ) : (
                <span className="flex items-center"><Globe className="h-3 w-3 mr-1" /> Public</span>
              )}
            </div>
            
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Pen className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(highlight.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}