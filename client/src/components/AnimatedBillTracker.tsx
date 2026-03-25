import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Eye,
  Star,
  Bell,
  TrendingUp,
  AlertCircle,
  Vote,
  Gavel,
  Building
} from "lucide-react";

interface BillStatus {
  id: string;
  step: number;
  title: string;
  date?: string;
  completed: boolean;
  active: boolean;
}

interface AnimatedBillProps {
  bill: {
    id: string;
    title: string;
    description: string;
    status: string;
    chamber: string;
    progress: number;
    lastAction: string;
    sponsor: string;
    votes?: { for: number; against: number; };
    isTracked?: boolean;
    priority?: 'high' | 'medium' | 'low';
  };
  onTrack?: (billId: string) => void;
  onViewDetails?: (billId: string) => void;
}

export default function AnimatedBillTracker({ bill, onTrack, onViewDetails }: AnimatedBillProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [statusChanging, setStatusChanging] = useState(false);
  const [pulseVotes, setPulseVotes] = useState(false);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue(bill.progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [bill.progress]);

  // Pulse votes when they change
  useEffect(() => {
    if (bill.votes) {
      setPulseVotes(true);
      const timer = setTimeout(() => setPulseVotes(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [bill.votes?.for, bill.votes?.against]);

  const billSteps: BillStatus[] = [
    { id: 'introduced', step: 1, title: 'Introduced', completed: bill.progress >= 20, active: bill.progress >= 20 && bill.progress < 40 },
    { id: 'committee', step: 2, title: 'Committee Review', completed: bill.progress >= 40, active: bill.progress >= 40 && bill.progress < 60 },
    { id: 'floor', step: 3, title: 'Floor Vote', completed: bill.progress >= 60, active: bill.progress >= 60 && bill.progress < 80 },
    { id: 'second', step: 4, title: 'Second Chamber', completed: bill.progress >= 80, active: bill.progress >= 80 && bill.progress < 100 },
    { id: 'signed', step: 5, title: 'Signed into Law', completed: bill.progress >= 100, active: bill.progress >= 100 }
  ];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-amber-200 bg-amber-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleTrackClick = () => {
    setStatusChanging(true);
    setTimeout(() => {
      onTrack?.(bill.id);
      setStatusChanging(false);
    }, 600);
  };

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer ${getPriorityColor(bill.priority)} ${isHovered ? 'ring-2 ring-blue-200' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/30 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      
      {/* Priority Indicator */}
      {bill.priority && (
        <div className={`absolute top-0 right-0 w-0 h-0 border-l-[20px] border-b-[20px] border-l-transparent transition-all duration-300 ${
          bill.priority === 'high' ? 'border-b-red-500' : 
          bill.priority === 'medium' ? 'border-b-amber-500' : 
          'border-b-green-500'
        }`} />
      )}

      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
              {getStatusIcon(bill.status)}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                {bill.title}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {bill.chamber}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {bill.sponsor}
                </span>
              </div>
            </div>
          </div>
          
          {/* Animated Track Button */}
          <Button
            variant={bill.isTracked ? "default" : "outline"}
            size="sm"
            onClick={handleTrackClick}
            className={`transition-all duration-300 ${
              bill.isTracked 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                : 'hover:bg-blue-50 hover:border-blue-300'
            } ${statusChanging ? 'scale-110' : ''}`}
          >
            {statusChanging ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : bill.isTracked ? (
              <>
                <Bell className="w-4 h-4 mr-1" />
                Tracking
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-1" />
                Track
              </>
            )}
          </Button>
        </div>

        {/* Bill Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
          {bill.description}
        </p>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Legislative Progress</span>
            <span className="text-blue-600 font-semibold">{bill.progress}%</span>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="relative">
            <Progress 
              value={progressValue} 
              className="h-2 bg-gray-100 transition-all duration-1000 ease-out"
            />
            <div className={`absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out ${isHovered ? 'shadow-lg' : ''}`} 
                 style={{ width: `${progressValue}%` }} />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mt-4">
            {billSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Connection Line */}
                {index < billSteps.length - 1 && (
                  <div className={`absolute top-4 left-6 w-12 h-0.5 transition-all duration-700 ${
                    step.completed ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
                
                {/* Step Circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                  step.completed 
                    ? 'bg-green-500 text-white shadow-lg scale-110' 
                    : step.active 
                      ? 'bg-blue-500 text-white shadow-lg animate-pulse' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{step.step}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <span className={`text-xs mt-1 transition-colors duration-300 ${
                  step.active ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vote Count with Animation */}
        {bill.votes && (
          <div className={`mt-4 p-3 bg-gray-50 rounded-lg transition-all duration-300 ${pulseVotes ? 'bg-blue-50 scale-105' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">For: {bill.votes.for}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Against: {bill.votes.against}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Live Votes
              </Badge>
            </div>
          </div>
        )}

        {/* Last Action */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-medium">Last Action:</span>
            <span className="text-blue-600">{bill.lastAction}</span>
          </div>
        </div>
      </CardHeader>

      {/* Animated Action Bar */}
      <CardContent className="relative z-10 pt-0">
        <div className={`flex items-center justify-between transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-75'}`}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="w-4 h-4" />
            <span>Activity Score: {Math.round(bill.progress * 0.8 + 20)}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onViewDetails?.(bill.id)}
            className="group/btn hover:bg-blue-50 hover:text-blue-700 transition-all duration-300"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </CardContent>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 rounded-lg transition-all duration-500 pointer-events-none ${
        isHovered ? 'ring-2 ring-blue-200 ring-opacity-50 shadow-blue-100' : ''
      }`} />
    </Card>
  );
}