import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CivicTerm } from "@shared/schema-civic-terms";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface BillCharacterProps {
  children: React.ReactNode;
  termName: string; // The civic term to explain
  characterPose?: "default" | "explaining" | "thinking" | "excited"; // Different character poses
}

const BillCharacter: React.FC<BillCharacterProps> = ({
  children,
  termName,
  characterPose = "default",
}) => {
  const [isTracked, setIsTracked] = useState(false);
  const [elementId] = useState(`bill-character-${Math.random().toString(36).substring(2, 9)}`);
  
  // Fetch the term info
  const { data: term, isLoading, error } = useQuery<CivicTerm>({
    queryKey: ["/api/civic-terms", termName],
    queryFn: async () => {
      const response = await fetch(`/api/civic-terms/search?q=${encodeURIComponent(termName)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch civic term");
      }
      const terms = await response.json();
      // Return the first matching term, or undefined if no matches
      return terms[0] || undefined;
    },
    enabled: !!termName,
  });
  
  // Track when this term appears in the UI
  useEffect(() => {
    if (term && !isTracked) {
      const trackAppearance = async () => {
        try {
          await fetch("/api/civic-terms/appearances", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              termId: term.id,
              pageLocation: window.location.pathname,
              elementId,
            }),
          });
          setIsTracked(true);
        } catch (error) {
          console.error("Failed to track term appearance:", error);
        }
      };
      
      trackAppearance();
    }
  }, [term, isTracked, elementId]);

  // Get character image path based on pose
  const getCharacterImagePath = () => {
    return `/assets/bill-character/bill-${characterPose}.svg`;
  };

  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        <span 
          id={elementId}
          className="border-b border-dotted border-primary cursor-help"
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <p>Loading term information...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-24">
            <p>Couldn't find information for this term.</p>
          </div>
        ) : term ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <img 
                src={getCharacterImagePath()} 
                alt="Bill Character" 
                className="w-20 h-20 object-contain"
              />
              <div>
                <h4 className="text-lg font-semibold">{term.term}</h4>
                <Badge variant="outline" className="mt-1">
                  {term.category.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm">{term.definition}</p>
            </div>
            
            {term.examples && term.examples.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-semibold">Example:</p>
                <p className="text-xs italic">{term.examples[0]}</p>
              </div>
            )}
            
            {term.funFact && (
              <div className="bg-muted p-2 rounded-md mt-2">
                <p className="text-xs font-semibold">Did you know?</p>
                <p className="text-xs">{term.funFact}</p>
              </div>
            )}
            
            {term.learnMoreUrl && (
              <div className="flex justify-end pt-2">
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <a 
                    href={term.learnMoreUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs"
                  >
                    Learn more <ExternalLink size={12} />
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
            <p>No information available for "{termName}"</p>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default BillCharacter;