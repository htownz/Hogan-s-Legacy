import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BillComparisonSliderProps {
  comparison: any;
  onSliderChange?: (position: number) => void;
}

export function BillComparisonSlider({ comparison, onSliderChange }: BillComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100, 50 is center
  const [isDragging, setIsDragging] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    setSliderPosition(percentage);
    onSliderChange?.(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderMove(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'complementary': return 'text-green-600 bg-green-50 border-green-200';
      case 'competing': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'conflicting': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCurrentFocus = () => {
    if (sliderPosition < 25) return 'bill1';
    if (sliderPosition > 75) return 'bill2';
    return 'both';
  };

  const currentFocus = getCurrentFocus();

  return (
    <div className="space-y-6">
      {/* Header with relationship indicator */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <h3 className="font-semibold text-primary">{comparison.bill1.number}</h3>
            <p className="text-xs text-muted-foreground">vs</p>
          </div>
          <GitCompare className="h-6 w-6 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold text-primary">{comparison.bill2.number}</h3>
          </div>
        </div>
        
        <Badge className={`${getRelationshipColor(comparison.comparison.overallRelationship)} border px-3 py-1`}>
          {comparison.comparison.overallRelationship} bills
        </Badge>
      </div>

      {/* Interactive Slider */}
      <div className="relative">
        <div 
          ref={sliderRef}
          className="relative h-4 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 rounded-full cursor-pointer shadow-inner"
          onMouseDown={handleMouseDown}
        >
          {/* Slider handle */}
          <div 
            className={cn(
              "absolute top-1/2 w-8 h-8 bg-white border-2 border-primary rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-transform",
              isDragging ? "scale-110" : "hover:scale-105"
            )}
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-primary/80" />
          </div>
          
          {/* Position indicators */}
          <div className="absolute -bottom-8 left-0 text-xs text-muted-foreground">
            Focus: {comparison.bill1.number}
          </div>
          <div className="absolute -bottom-8 right-0 text-xs text-muted-foreground">
            Focus: {comparison.bill2.number}
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
            Both Bills
          </div>
        </div>
      </div>

      {/* Content based on slider position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill 1 Content */}
        <Card className={cn(
          "transition-all duration-300",
          currentFocus === 'bill1' ? "ring-2 ring-blue-500 shadow-lg" : currentFocus === 'both' ? "opacity-100" : "opacity-60"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-blue-600">{comparison.bill1.number}</span>
              {currentFocus === 'bill1' && <ChevronLeft className="h-4 w-4 text-blue-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium mb-2">{comparison.bill1.title}</h4>
            <p className="text-sm text-muted-foreground mb-4">{comparison.bill1.summary}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant="outline">{comparison.bill1.status}</Badge>
              </div>
              {comparison.bill1.lastAction && (
                <div className="text-xs text-muted-foreground">
                  Last action: {comparison.bill1.lastAction}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bill 2 Content */}
        <Card className={cn(
          "transition-all duration-300",
          currentFocus === 'bill2' ? "ring-2 ring-green-500 shadow-lg" : currentFocus === 'both' ? "opacity-100" : "opacity-60"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-green-600">{comparison.bill2.number}</span>
              {currentFocus === 'bill2' && <ChevronRight className="h-4 w-4 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium mb-2">{comparison.bill2.title}</h4>
            <p className="text-sm text-muted-foreground mb-4">{comparison.bill2.summary}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant="outline">{comparison.bill2.status}</Badge>
              </div>
              {comparison.bill2.lastAction && (
                <div className="text-xs text-muted-foreground">
                  Last action: {comparison.bill2.lastAction}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison Charts */}
      {comparison.visualData?.categories && comparison.visualData.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparison.visualData.categories.map((category: any, index: number) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    activeCategory === index ? "bg-primary/5 border-primary" : "hover:bg-gray-50"
                  )}
                  onClick={() => setActiveCategory(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{category.name}</h5>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="text-blue-600">{category.bill1Score}%</span>
                      <span>vs</span>
                      <span className="text-green-600">{category.bill2Score}%</span>
                    </div>
                  </div>
                  
                  {/* Visual comparison bars */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs w-16 text-blue-600">{comparison.bill1.number}</span>
                      <div className="flex-1">
                        <Progress value={category.bill1Score} className="h-2" />
                      </div>
                      <span className="text-xs w-8 text-right">{category.bill1Score}%</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs w-16 text-green-600">{comparison.bill2.number}</span>
                      <div className="flex-1">
                        <Progress value={category.bill2Score} className="h-2" />
                      </div>
                      <span className="text-xs w-8 text-right">{category.bill2Score}%</span>
                    </div>
                  </div>
                  
                  {activeCategory === index && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                      {category.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Navigation Buttons */}
      <div className="flex justify-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSliderPosition(10)}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Focus {comparison.bill1.number}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSliderPosition(50)}
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <Minus className="h-4 w-4 mr-1" />
          Compare Both
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSliderPosition(90)}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          Focus {comparison.bill2.number}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}