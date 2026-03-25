// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AnimatedBillTracker from "@/components/AnimatedBillTracker";
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Settings,
  Zap
} from "lucide-react";

export default function AnimatedBillDemo() {
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [bills, setBills] = useState([
    {
      id: 'HB-2023',
      title: 'Texas Education Funding Reform Act',
      description: 'Comprehensive reform of public school funding formulas to ensure equitable distribution of resources across all Texas school districts.',
      status: 'active',
      chamber: 'House',
      progress: 45,
      lastAction: 'Passed committee review with amendments',
      sponsor: 'Rep. Maria Gonzalez',
      votes: { for: 23, against: 12 },
      isTracked: false,
      priority: 'high' as const
    },
    {
      id: 'SB-890',
      title: 'Healthcare Access Expansion',
      description: 'Legislation to expand healthcare access in rural Texas communities through telemedicine initiatives and mobile health clinics.',
      status: 'active',
      chamber: 'Senate',
      progress: 75,
      lastAction: 'Scheduled for floor vote next week',
      sponsor: 'Sen. John Davis',
      votes: { for: 18, against: 7 },
      isTracked: true,
      priority: 'medium' as const
    },
    {
      id: 'HB-1456',
      title: 'Infrastructure Modernization Bill',
      description: 'Multi-billion dollar investment in Texas infrastructure including roads, bridges, broadband, and water systems.',
      status: 'active',
      chamber: 'House',
      progress: 20,
      lastAction: 'Introduced and referred to Transportation Committee',
      sponsor: 'Rep. Sarah Johnson',
      isTracked: false,
      priority: 'high' as const
    }
  ]);

  const handleTrackBill = (billId: string) => {
    setBills(prevBills => 
      prevBills.map(bill => 
        bill.id === billId 
          ? { ...bill, isTracked: !bill.isTracked }
          : bill
      )
    );
  };

  const handleViewDetails = (billId: string) => {
    console.log(`Viewing details for bill: ${billId}`);
    // In a real app, this would navigate to bill details page
  };

  const runProgressSimulation = () => {
    setSimulationRunning(true);
    
    const intervals = bills.map((_, index) => {
      return setInterval(() => {
        setBills(prevBills => 
          prevBills.map((bill, billIndex) => {
            if (billIndex === index && bill.progress < 100) {
              const newProgress = Math.min(bill.progress + Math.random() * 15, 100);
              const newVotes = bill.votes ? {
                for: bill.votes.for + Math.floor(Math.random() * 3),
                against: bill.votes.against + Math.floor(Math.random() * 2)
              } : undefined;
              
              return {
                ...bill,
                progress: newProgress,
                votes: newVotes,
                lastAction: newProgress >= 100 ? 'Bill signed into law!' : 
                           newProgress >= 80 ? 'Sent to second chamber' :
                           newProgress >= 60 ? 'Passed floor vote' :
                           newProgress >= 40 ? 'Committee approved with amendments' :
                           'Under committee review'
              };
            }
            return bill;
          })
        );
      }, 2000 + index * 1000);
    });

    // Stop simulation after 15 seconds
    setTimeout(() => {
      intervals.forEach(interval => clearInterval(interval));
      setSimulationRunning(false);
    }, 15000);
  };

  const resetDemo = () => {
    setBills([
      {
        id: 'HB-2023',
        title: 'Texas Education Funding Reform Act',
        description: 'Comprehensive reform of public school funding formulas to ensure equitable distribution of resources across all Texas school districts.',
        status: 'active',
        chamber: 'House',
        progress: 45,
        lastAction: 'Passed committee review with amendments',
        sponsor: 'Rep. Maria Gonzalez',
        votes: { for: 23, against: 12 },
        isTracked: false,
        priority: 'high' as const
      },
      {
        id: 'SB-890',
        title: 'Healthcare Access Expansion',
        description: 'Legislation to expand healthcare access in rural Texas communities through telemedicine initiatives and mobile health clinics.',
        status: 'active',
        chamber: 'Senate',
        progress: 75,
        lastAction: 'Scheduled for floor vote next week',
        sponsor: 'Sen. John Davis',
        votes: { for: 18, against: 7 },
        isTracked: true,
        priority: 'medium' as const
      },
      {
        id: 'HB-1456',
        title: 'Infrastructure Modernization Bill',
        description: 'Multi-billion dollar investment in Texas infrastructure including roads, bridges, broadband, and water systems.',
        status: 'active',
        chamber: 'House',
        progress: 20,
        lastAction: 'Introduced and referred to Transportation Committee',
        sponsor: 'Rep. Sarah Johnson',
        isTracked: false,
        priority: 'high' as const
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">
              ✨ Animated Bill Tracking Demo
            </span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
            Interactive Bill Tracking
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience smooth micro-interactions and animations that bring bill tracking to life. 
            Watch progress bars animate, status changes pulse, and interactive elements respond to your actions.
          </p>

          {/* Demo Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              onClick={runProgressSimulation}
              disabled={simulationRunning}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            >
              {simulationRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Simulating Progress...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Progress Simulation
                </>
              )}
            </Button>
            
            <Button 
              onClick={resetDemo}
              variant="outline"
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Demo
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-1">Smooth Animations</h3>
                <p className="text-sm text-gray-600">Progress bars and status indicators animate smoothly</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-1">Interactive Elements</h3>
                <p className="text-sm text-gray-600">Hover effects and click animations provide feedback</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900 mb-1">Real-time Updates</h3>
                <p className="text-sm text-gray-600">Live vote counts and status changes pulse to draw attention</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bill Trackers */}
        <div className="space-y-6">
          {bills.map((bill, index) => (
            <div 
              key={bill.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <AnimatedBillTracker
                bill={bill}
                onTrack={handleTrackBill}
                onViewDetails={handleViewDetails}
              />
            </div>
          ))}
        </div>

        {/* Animation Features Documentation */}
        <Card className="mt-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Animation Features Included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Micro-Interactions</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-green-500 border-green-500" />
                    Hover animations with scale and glow effects
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-blue-500 border-blue-500" />
                    Animated progress bars with smooth transitions
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-purple-500 border-purple-500" />
                    Status change animations with pulse effects
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-orange-500 border-orange-500" />
                    Interactive button states with loading spinners
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Visual Feedback</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-red-500 border-red-500" />
                    Priority indicators with color-coded borders
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-green-500 border-green-500" />
                    Step progression with animated checkmarks
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-blue-500 border-blue-500" />
                    Live vote count updates with pulse animations
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="w-3 h-3 rounded-full bg-purple-500 border-purple-500" />
                    Gradient backgrounds and glassmorphism effects
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add CSS animations
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
    opacity: 0;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}