import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Home,
  Car,
  GraduationCap,
  Heart,
  Building,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Search,
  Filter,
  Clock,
  MapPin,
  Target,
  BarChart3,
  PieChart,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface PolicyImpact {
  category: string;
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  severity: number; // 1-10
  likelihood: number; // 1-10
  timeframe: string;
  financialImpact: number;
  affectedPopulation: number;
  details: string[];
}

interface UserProfile {
  income: number;
  dependents: number;
  homeowner: boolean;
  employment: string;
  education: string;
  age: number;
  district: string;
  interests: string[];
}

export default function PolicyImpactSimulator() {
  const [selectedBill, setSelectedBill] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    income: 50000,
    dependents: 0,
    homeowner: false,
    employment: "employed",
    education: "college",
    age: 35,
    district: "District 15",
    interests: []
  });
  const [simulationResults, setSimulationResults] = useState<PolicyImpact[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch authentic Texas bills from your government database
  const { data: billsResponse, isLoading: billsLoading } = useQuery<any>({
    queryKey: ['/api/texas-legislative-data/bills'],
    enabled: true
  });

  // Fetch authentic Texas legislators from your government database
  const { data: legislatorsResponse } = useQuery<any>({
    queryKey: ['/api/texas-legislative-data/legislators'],
    enabled: true
  });

  // Extract bills data from response
  const bills = billsResponse?.data || billsResponse;
  const legislators = legislatorsResponse?.data || legislatorsResponse;

  const runSimulation = async () => {
    if (!selectedBill) return;
    
    setIsSimulating(true);
    
    try {
      // Call the authentic policy impact simulation API
      const response = await fetch('/api/policy-impact/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billId: selectedBill,
          userProfile
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSimulationResults(data.data.impacts);
      } else {
        console.error('Simulation failed:', data.message);
        setSimulationResults([]);
      }
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive": return "text-green-400";
      case "negative": return "text-red-400";
      default: return "text-yellow-400";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "positive": return <TrendingUp className="h-5 w-5 text-green-400" />;
      case "negative": return <TrendingDown className="h-5 w-5 text-red-400" />;
      default: return <BarChart3 className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "financial impact": return <DollarSign className="h-5 w-5" />;
      case "education": return <GraduationCap className="h-5 w-5" />;
      case "healthcare": return <Heart className="h-5 w-5" />;
      case "transportation": return <Car className="h-5 w-5" />;
      case "housing": return <Home className="h-5 w-5" />;
      case "employment": return <Building className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const totalFinancialImpact = simulationResults.reduce((sum, result) => sum + result.financialImpact, 0);
  const averageLikelihood = simulationResults.length > 0 
    ? simulationResults.reduce((sum, result) => sum + result.likelihood, 0) / simulationResults.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Policy Impact Simulator</h1>
          </div>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Instantly discover how Texas legislation will personally affect you, your family, and your community using authentic government data.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Panel - User Profile & Bill Selection */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Profile Setup */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white text-sm">Annual Income</Label>
                    <Input
                      type="number"
                      value={userProfile.income}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, income: Number(e.target.value) }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm">Age</Label>
                    <Input
                      type="number"
                      value={userProfile.age}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, age: Number(e.target.value) }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      placeholder="35"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-white text-sm">Dependents</Label>
                  <Input
                    type="number"
                    value={userProfile.dependents}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, dependents: Number(e.target.value) }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="homeowner"
                    checked={userProfile.homeowner}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, homeowner: e.target.checked }))}
                    className="rounded border-white/20"
                  />
                  <Label htmlFor="homeowner" className="text-white text-sm">Homeowner</Label>
                </div>

                <div>
                  <Label className="text-white text-sm">District</Label>
                  <Input
                    value={userProfile.district}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, district: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                    placeholder="District 15"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bill Selection */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Select Texas Bill
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {billsLoading ? (
                  <div className="text-center py-4">
                    <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-blue-200 text-sm">Loading Texas bills...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bills && Array.isArray(bills) && bills.length > 0 ? (
                      bills.slice(0, 5).map((bill: any, index: number) => (
                      <div
                        key={bill.id || index}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedBill === bill.id 
                            ? "bg-blue-600/20 border-blue-400" 
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() => setSelectedBill(bill.id || `bill-${index}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
                              {bill.title || `Texas Legislative Bill ${bill.id || index + 1}`}
                            </h4>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="secondary" className="bg-white/10 text-blue-200">
                                {bill.chamber || 'House'}
                              </Badge>
                              <span className="text-blue-300">{bill.status || 'Active'}</span>
                            </div>
                          </div>
                          {selectedBill === (bill.id || `bill-${index}`) && (
                            <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-blue-200 text-sm">No bills available. Connect to your Texas government data sources.</p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={runSimulation}
                  disabled={!selectedBill || isSimulating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                  size="lg"
                >
                  {isSimulating ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Impact...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Run Impact Simulation
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Simulation Results */}
          <div className="lg:col-span-2">
            {simulationResults.length > 0 ? (
              <div className="space-y-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm">Financial Impact</p>
                          <p className={`text-2xl font-bold ${totalFinancialImpact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalFinancialImpact >= 0 ? '+' : ''}${totalFinancialImpact.toLocaleString()}
                          </p>
                        </div>
                        <DollarSign className={`h-8 w-8 ${totalFinancialImpact >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm">Likelihood</p>
                          <p className="text-2xl font-bold text-white">{Math.round(averageLikelihood)}/10</p>
                        </div>
                        <Target className="h-8 w-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm">Impact Areas</p>
                          <p className="text-2xl font-bold text-white">{simulationResults.length}</p>
                        </div>
                        <PieChart className="h-8 w-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Impact Analysis */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Detailed Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {simulationResults.map((result, index) => (
                        <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getCategoryIcon(result.category)}
                              <div>
                                <h3 className="text-white font-semibold">{result.title}</h3>
                                <p className="text-blue-200 text-sm">{result.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getImpactIcon(result.impact)}
                              <span className={`font-medium ${getImpactColor(result.impact)}`}>
                                {result.impact.charAt(0).toUpperCase() + result.impact.slice(1)}
                              </span>
                            </div>
                          </div>

                          <p className="text-blue-100 mb-4">{result.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-blue-200 text-xs">Severity</p>
                              <div className="flex items-center gap-2">
                                <Progress value={result.severity * 10} className="flex-1 h-2" />
                                <span className="text-white text-sm">{result.severity}/10</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-blue-200 text-xs">Likelihood</p>
                              <div className="flex items-center gap-2">
                                <Progress value={result.likelihood * 10} className="flex-1 h-2" />
                                <span className="text-white text-sm">{result.likelihood}/10</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-blue-200 text-xs">Timeframe</p>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blue-400" />
                                <span className="text-white text-sm">{result.timeframe}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-blue-200 text-xs">Affected</p>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-blue-400" />
                                <span className="text-white text-sm">{(result.affectedPopulation / 1000000).toFixed(1)}M</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-blue-200 text-sm font-medium">Key Details:</p>
                            <ul className="space-y-1">
                              {result.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start gap-2 text-blue-100 text-sm">
                                  <Info className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 h-96 flex items-center justify-center">
                <CardContent className="text-center">
                  <Calculator className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                  <p className="text-blue-200 mb-4">
                    Select a Texas bill and run the simulation to see personalized impact analysis based on your profile.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-blue-300">
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span>Instant Analysis</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>Personalized Results</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Authentic Data</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}