import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ChevronRight, 
  ArrowRight, 
  SearchIcon, 
  BarChart3, 
  PieChart,
  LineChart,
  Layers,
  Users,
  Building,
  Home,
  DollarSign,
  Book,
  AlertTriangle,
  Check,
  BookOpen,
  Map,
  Scale,
  Activity,
  Calendar,
  FileText,
  RefreshCw,
  Download,
  CheckSquare,
  Clipboard,
  Filter,
  Share2
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// Type definition for legislative impact analysis
interface LegislativeImpactAnalysis {
  billId: string;
  title: string;
  executiveSummary: string;
  impactScores: {
    overall: number;
    economic: number;
    social: number;
    environmental: number;
    legal: number;
    governance: number;
  };
  keyStakeholders: {
    beneficiaries: string[];
    adverselyAffected: string[];
    neutralParties: string[];
  };
  regionalImpacts: {
    region: string;
    impact: string;
    severityScore: number;
  }[];
  implementationAnalysis: {
    timeframe: string;
    feasibility: number;
    resourceRequirements: string;
    potentialChallenges: string[];
  };
  complianceRequirements: string[];
  budgetaryImplications: {
    estimatedCost: string;
    fundingSources: string[];
    fiscalImpact: string;
  };
  comparativeContext: {
    similarLegislation: string[];
    historicalContext: string;
  };
  recommendations: string[];
  technicalDetails: {
    aiConfidence: number;
    dataSourcesUsed: string[];
    analysisDate: string;
  };
}

// Type definition for bill comparison
interface BillComparison {
  comparisonSummary: string;
  impactScoreComparison: {
    overall: {
      difference: number;
      analysis: string;
    };
    economic: {
      difference: number;
      analysis: string;
    };
    social: {
      difference: number;
      analysis: string;
    };
    environmental: {
      difference: number;
      analysis: string;
    };
    legal: {
      difference: number;
      analysis: string;
    };
    governance: {
      difference: number;
      analysis: string;
    };
  };
  stakeholderComparison: {
    commonBeneficiaries: string[];
    commonAdverselyAffected: string[];
    divergentImpacts: string;
  };
  implementationComparison: {
    timeframeComparison: string;
    feasibilityComparison: string;
    resourceComparison: string;
  };
  budgetaryComparison: {
    costDifference: string;
    fiscalImpactComparison: string;
  };
  recommendationSynthesis: string[];
  conclusionStatement: string;
}

// Type definition for personalized impact assessment
interface PersonalizedImpact {
  personalSummary: string;
  relevanceScore: number;
  keyImpacts: {
    area: string;
    description: string;
    severity: number;
    timeline: string;
  }[];
  householdImpact: string;
  financialImpact: {
    description: string;
    estimatedChange: string;
  };
  recommendedActions: {
    action: string;
    benefit: string;
  }[];
  sentiment: "positive" | "negative" | "neutral" | "mixed";
}

// Type definition for category impact statistics
interface CategoryImpactStat {
  category: string;
  totalBills: number;
  avgOverall: number;
  avgEconomic: number;
  avgSocial: number;
  avgEnvironmental: number;
  avgLegal: number;
  avgGovernance: number;
}

// Type definition for user demographics
interface UserDemographics {
  age: string;
  income: string;
  location: string;
  occupation: string;
  familySize: string;
  propertyOwner: boolean;
  businessOwner: boolean;
  interests: string[];
  taxBracket: string;
  education: string;
  sector: string;
  politicalLeaning: string;
}

// Convert impact score (1-10) to color
const getImpactColor = (score: number) => {
  if (score >= 8) return "bg-red-500 text-white";
  if (score >= 6) return "bg-orange-500 text-white";
  if (score >= 4) return "bg-yellow-500 text-black";
  return "bg-green-500 text-white";
};

// Convert impact score (1-10) to text
const getImpactText = (score: number) => {
  if (score >= 8) return "Major Impact";
  if (score >= 6) return "Significant Impact";
  if (score >= 4) return "Moderate Impact";
  if (score >= 2) return "Minor Impact";
  return "Minimal Impact";
};

// Format dates
const formatAnalysisDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
};

// Impact Score Visualization Component
const ImpactScoresChart = ({ impactScores }: { impactScores: LegislativeImpactAnalysis["impactScores"] }) => {
  const data = [
    { name: "Overall", value: impactScores.overall },
    { name: "Economic", value: impactScores.economic },
    { name: "Social", value: impactScores.social },
    { name: "Environmental", value: impactScores.environmental },
    { name: "Legal", value: impactScores.legal },
    { name: "Governance", value: impactScores.governance },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 10]} tickCount={11} />
        <YAxis type="category" dataKey="name" />
        <Tooltip
          formatter={(value: number) => [`${value}/10`, "Impact Score"]}
          labelFormatter={(label) => `${label} Impact`}
        />
        <Bar 
          dataKey="value" 
          fill="var(--primary)" 
          radius={[0, 4, 4, 0]}
          label={{ position: 'right', formatter: (value: number) => `${value}/10` }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Regional Impact Map
const RegionalImpactMap = ({ regionalImpacts }: { regionalImpacts: LegislativeImpactAnalysis["regionalImpacts"] }) => {
  const data = regionalImpacts.map(r => ({
    name: r.region,
    value: r.severityScore,
    impact: r.impact
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 10]} tickCount={6} />
        <Tooltip
          formatter={(value: number, name, props) => {
            const impact = props.payload.impact;
            return [`${value}/10 - ${impact}`, "Severity"];
          }}
          labelFormatter={(label) => `${label} Region`}
        />
        <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Stakeholder Analysis Component
const StakeholderAnalysis = ({ keyStakeholders }: { keyStakeholders: LegislativeImpactAnalysis["keyStakeholders"] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Beneficiaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {keyStakeholders.beneficiaries.map((group, i) => (
              <li key={i} className="text-sm flex items-start">
                <CheckSquare className="h-3 w-3 mr-2 mt-1 text-green-600" />
                {group}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
            Adversely Affected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {keyStakeholders.adverselyAffected.map((group, i) => (
              <li key={i} className="text-sm flex items-start">
                <AlertTriangle className="h-3 w-3 mr-2 mt-1 text-red-600" />
                {group}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-600" />
            Neutral Parties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {keyStakeholders.neutralParties.map((group, i) => (
              <li key={i} className="text-sm flex items-start">
                <Users className="h-3 w-3 mr-2 mt-1 text-gray-600" />
                {group}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

// Implementation Analysis Component
const ImplementationAnalysisCard = ({ implementationAnalysis }: { implementationAnalysis: LegislativeImpactAnalysis["implementationAnalysis"] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Implementation Analysis</CardTitle>
        <CardDescription>Feasibility and timeline considerations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Feasibility Score:</span>
          <div className="flex items-center">
            <span className="mr-2 font-bold">{implementationAnalysis.feasibility}/10</span>
            <Progress value={implementationAnalysis.feasibility * 10} className="w-24 h-2" />
          </div>
        </div>
        
        <div>
          <span className="text-sm font-medium">Timeframe:</span>
          <p className="text-sm mt-1">{implementationAnalysis.timeframe}</p>
        </div>
        
        <div>
          <span className="text-sm font-medium">Resource Requirements:</span>
          <p className="text-sm mt-1">{implementationAnalysis.resourceRequirements}</p>
        </div>
        
        <div>
          <span className="text-sm font-medium">Potential Challenges:</span>
          <ul className="mt-1 space-y-1">
            {implementationAnalysis.potentialChallenges.map((challenge, i) => (
              <li key={i} className="text-sm flex items-start">
                <AlertTriangle className="h-3 w-3 mr-2 mt-1 text-amber-500" />
                {challenge}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// Budgetary Implications Component
const BudgetaryImplicationsCard = ({ budgetaryImplications }: { budgetaryImplications: LegislativeImpactAnalysis["budgetaryImplications"] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Budgetary Implications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm font-medium">Estimated Cost:</span>
          <p className="text-sm mt-1">{budgetaryImplications.estimatedCost}</p>
        </div>
        
        <div>
          <span className="text-sm font-medium">Fiscal Impact:</span>
          <p className="text-sm mt-1">{budgetaryImplications.fiscalImpact}</p>
        </div>
        
        <div>
          <span className="text-sm font-medium">Funding Sources:</span>
          <ul className="mt-1 space-y-1">
            {budgetaryImplications.fundingSources.map((source, i) => (
              <li key={i} className="text-sm flex items-start">
                <DollarSign className="h-3 w-3 mr-2 mt-1" />
                {source}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// Compliance Requirements Component
const ComplianceRequirementsCard = ({ requirements }: { requirements: LegislativeImpactAnalysis["complianceRequirements"] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Compliance Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {requirements.map((req, i) => (
            <li key={i} className="text-sm flex items-start">
              <Clipboard className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
              {req}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

// Bill Comparison Component
const BillComparisonView = ({ 
  billId1, 
  billId2, 
  comparison 
}: { 
  billId1: string;
  billId2: string;
  comparison: BillComparison;
}) => {
  // Chart data for impact scores comparison
  const impactScoreData = [
    { 
      name: "Overall", 
      bill1: 5, // Placeholder, real values would be populated from LegislativeImpactAnalysis
      bill2: 5 + comparison.impactScoreComparison.overall.difference
    },
    { 
      name: "Economic", 
      bill1: 5, // Placeholder
      bill2: 5 + comparison.impactScoreComparison.economic.difference
    },
    { 
      name: "Social", 
      bill1: 5, // Placeholder
      bill2: 5 + comparison.impactScoreComparison.social.difference
    },
    { 
      name: "Environmental", 
      bill1: 5, // Placeholder
      bill2: 5 + comparison.impactScoreComparison.environmental.difference
    },
    { 
      name: "Legal", 
      bill1: 5, // Placeholder
      bill2: 5 + comparison.impactScoreComparison.legal.difference
    },
    { 
      name: "Governance", 
      bill1: 5, // Placeholder
      bill2: 5 + comparison.impactScoreComparison.governance.difference
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bill Comparison: {billId1} vs. {billId2}</CardTitle>
          <CardDescription>{comparison.comparisonSummary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Impact Score Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={impactScoreData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} tickCount={6} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bill1" name={billId1} fill="#8884d8" />
                <Bar dataKey="bill2" name={billId2} fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="stakeholders">
              <AccordionTrigger>Stakeholder Comparison</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Common Beneficiaries:</h4>
                    <ul className="mt-1">
                      {comparison.stakeholderComparison.commonBeneficiaries.map((group, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <Check className="h-3 w-3 mr-2 mt-1 text-green-600" />
                          {group}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Common Adversely Affected:</h4>
                    <ul className="mt-1">
                      {comparison.stakeholderComparison.commonAdverselyAffected.map((group, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <AlertTriangle className="h-3 w-3 mr-2 mt-1 text-red-600" />
                          {group}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Divergent Impacts:</h4>
                    <p className="text-sm mt-1">{comparison.stakeholderComparison.divergentImpacts}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="implementation">
              <AccordionTrigger>Implementation Comparison</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Timeframe Comparison:</h4>
                    <p className="text-sm mt-1">{comparison.implementationComparison.timeframeComparison}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Feasibility Comparison:</h4>
                    <p className="text-sm mt-1">{comparison.implementationComparison.feasibilityComparison}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Resource Comparison:</h4>
                    <p className="text-sm mt-1">{comparison.implementationComparison.resourceComparison}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="budgetary">
              <AccordionTrigger>Budgetary Comparison</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Cost Difference:</h4>
                    <p className="text-sm mt-1">{comparison.budgetaryComparison.costDifference}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Fiscal Impact Comparison:</h4>
                    <p className="text-sm mt-1">{comparison.budgetaryComparison.fiscalImpactComparison}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="recommendations">
              <AccordionTrigger>Recommendations</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {comparison.recommendationSynthesis.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start">
                      <Check className="h-3 w-3 mr-2 mt-1 text-primary" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 rounded-b-lg">
          <div className="text-sm">
            <h4 className="font-medium">Conclusion:</h4>
            <p>{comparison.conclusionStatement}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// Personalized Impact Component
const PersonalizedImpactView = ({ personalizedImpact }: { personalizedImpact: PersonalizedImpact }) => {
  const sentimentColor = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
    mixed: "text-amber-600"
  }[personalizedImpact.sentiment];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Your Personalized Impact Assessment</span>
            <Badge className={sentimentColor}>
              {personalizedImpact.sentiment.charAt(0).toUpperCase() + personalizedImpact.sentiment.slice(1)}
            </Badge>
          </CardTitle>
          <CardDescription>{personalizedImpact.personalSummary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Relevance to You</h3>
            <div className="relative h-32 w-32 mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{personalizedImpact.relevanceScore}%</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="60%" 
                  outerRadius="100%" 
                  data={[{ name: "relevance", value: personalizedImpact.relevanceScore }]} 
                  startAngle={90} 
                  endAngle={-270}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    fill="var(--primary)"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium mb-3">Key Impacts</h3>
            <div className="space-y-4">
              {personalizedImpact.keyImpacts.map((impact, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        {impact.area}
                      </span>
                      <Badge variant={impact.severity >= 7 ? "destructive" : impact.severity >= 4 ? "default" : "outline"}>
                        Severity: {impact.severity}/10
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm pt-0">
                    <p>{impact.description}</p>
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Timeline: {impact.timeline}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Household Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{personalizedImpact.householdImpact}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Financial Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>{personalizedImpact.financialImpact.description}</p>
                {personalizedImpact.financialImpact.estimatedChange && (
                  <div className="bg-muted p-2 rounded-md text-sm font-medium">
                    Estimated change: {personalizedImpact.financialImpact.estimatedChange}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-md font-medium mb-3">Recommended Actions</h3>
            <div className="space-y-2">
              {personalizedImpact.recommendedActions.map((rec, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium">
                      {rec.action}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs pt-0">
                    <p>{rec.benefit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Demographics Form Component
const DemographicsForm = ({ 
  onSubmit 
}: { 
  onSubmit: (demographics: UserDemographics) => void 
}) => {
  const [demographics, setDemographics] = useState<UserDemographics>({
    age: "",
    income: "",
    location: "",
    occupation: "",
    familySize: "",
    propertyOwner: false,
    businessOwner: false,
    interests: [],
    taxBracket: "",
    education: "",
    sector: "",
    politicalLeaning: ""
  });

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setDemographics(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(demographics);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Demographics</CardTitle>
        <CardDescription>
          Customize the impact analysis based on your specific situation.
          This information is used only for this analysis and is not stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age Range</Label>
              <Select 
                value={demographics.age} 
                onValueChange={(value) => handleChange("age", value)}
              >
                <SelectTrigger id="age">
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-24">18-24</SelectItem>
                  <SelectItem value="25-34">25-34</SelectItem>
                  <SelectItem value="35-44">35-44</SelectItem>
                  <SelectItem value="45-54">45-54</SelectItem>
                  <SelectItem value="55-64">55-64</SelectItem>
                  <SelectItem value="65+">65+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="income">Annual Household Income</Label>
              <Select 
                value={demographics.income} 
                onValueChange={(value) => handleChange("income", value)}
              >
                <SelectTrigger id="income">
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-25k">Under $25,000</SelectItem>
                  <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                  <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                  <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                  <SelectItem value="100k-150k">$100,000 - $150,000</SelectItem>
                  <SelectItem value="150k+">Over $150,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location in Texas</Label>
              <Select 
                value={demographics.location} 
                onValueChange={(value) => handleChange("location", value)}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban-major">Major Urban City</SelectItem>
                  <SelectItem value="urban-medium">Medium City</SelectItem>
                  <SelectItem value="suburban">Suburban</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                  <SelectItem value="border">Border Region</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="familySize">Household Size</Label>
              <Select 
                value={demographics.familySize} 
                onValueChange={(value) => handleChange("familySize", value)}
              >
                <SelectTrigger id="familySize">
                  <SelectValue placeholder="Select household size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 person</SelectItem>
                  <SelectItem value="2">2 people</SelectItem>
                  <SelectItem value="3">3 people</SelectItem>
                  <SelectItem value="4">4 people</SelectItem>
                  <SelectItem value="5+">5+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="Your occupation or field"
                value={demographics.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Industry Sector</Label>
              <Select 
                value={demographics.sector} 
                onValueChange={(value) => handleChange("sector", value)}
              >
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="propertyOwner"
                checked={demographics.propertyOwner}
                onCheckedChange={(checked) => handleChange("propertyOwner", checked)}
              />
              <Label htmlFor="propertyOwner">I own property in Texas</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="businessOwner"
                checked={demographics.businessOwner}
                onCheckedChange={(checked) => handleChange("businessOwner", checked)}
              />
              <Label htmlFor="businessOwner">I own a business in Texas</Label>
            </div>
          </div>

          <div className="text-center mt-4">
            <Button type="submit" className="w-full md:w-auto">
              Generate Personalized Analysis
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Category Impact Stats Component
const CategoryImpactStats = ({ 
  categoryStats 
}: { 
  categoryStats: CategoryImpactStat[] 
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legislative Impact by Category</CardTitle>
          <CardDescription>
            Average impact scores across all analyzed bills by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Overall Impact Score by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis domain={[0, 10]} tickCount={6} />
                <Tooltip />
                <Bar dataKey="avgOverall" name="Average Overall Impact" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Detailed Impact by Category</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart outerRadius={150} width={500} height={400} data={categoryStats}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Economic" dataKey="avgEconomic" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Social" dataKey="avgSocial" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Radar name="Environmental" dataKey="avgEnvironmental" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-center py-2 px-3">Bills</th>
                  <th className="text-center py-2 px-3">Economic</th>
                  <th className="text-center py-2 px-3">Social</th>
                  <th className="text-center py-2 px-3">Legal</th>
                  <th className="text-center py-2 px-3">Environmental</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((cat, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-3 font-medium">{cat.category}</td>
                    <td className="text-center py-2 px-3">{cat.totalBills}</td>
                    <td className="text-center py-2 px-3">{cat.avgEconomic.toFixed(1)}</td>
                    <td className="text-center py-2 px-3">{cat.avgSocial.toFixed(1)}</td>
                    <td className="text-center py-2 px-3">{cat.avgLegal.toFixed(1)}</td>
                    <td className="text-center py-2 px-3">{cat.avgEnvironmental.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Legislative Impact Analysis Page
export default function LegislativeImpactPage() {
  const [match, params] = useRoute("/legislative-impact/:billId");
  const billId = match ? params.billId : null;
  
  const [compareMode, setCompareMode] = useState(false);
  const [compareBillId, setCompareBillId] = useState("");
  const [personalizeMode, setPersonalizeMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch legislative impact analysis for the current bill
  const { data: impactAnalysis, isLoading: isAnalysisLoading, isError: isAnalysisError } = useQuery<LegislativeImpactAnalysis>({
    queryKey: ["/api/legislative-impact", billId],
    enabled: !!billId,
  });

  // Fetch bill comparison if in compare mode
  const { data: billComparison, isLoading: isComparisonLoading } = useQuery<BillComparison>({
    queryKey: ["/api/legislative-impact/compare", billId, compareBillId],
    enabled: !!billId && !!compareBillId && compareMode,
  });

  // Fetch personalized impact if in personalize mode
  const [demographics, setDemographics] = useState<UserDemographics | null>(null);
  const { data: personalizedImpact, isLoading: isPersonalizedLoading } = useQuery<PersonalizedImpact>({
    queryKey: ["/api/legislative-impact", billId, "personalized", demographics],
    enabled: !!billId && !!demographics && personalizeMode,
  });

  // Fetch category impact statistics
  const { data: categoryStats, isLoading: isStatsLoading } = useQuery<CategoryImpactStat[]>({
    queryKey: ["/api/legislative-impact/stats/by-category"],
  });

  // Fetch top bills by impact
  const { data: topBills, isLoading: isTopBillsLoading } = useQuery<any>({
    queryKey: ["/api/legislative-impact/top-bills"],
  });

  const handleBillSelect = (selectedBillId: string) => {
    window.location.href = `/legislative-impact/${selectedBillId}`;
  };

  const handleCompareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (compareBillId) {
      setCompareMode(true);
      setPersonalizeMode(false);
      setSelectedTab("comparison");
    }
  };

  const handleDemographicsSubmit = (data: UserDemographics) => {
    setDemographics(data);
    setPersonalizeMode(true);
    setCompareMode(false);
    setSelectedTab("personalized");
  };

  // If no bill is selected, show the main dashboard
  if (!billId) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Legislative Impact Analysis</h1>
            <p className="text-muted-foreground">
              Understand how legislation affects Texas citizens and communities
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Search Legislation</CardTitle>
              <CardDescription>
                Find bills to analyze their potential impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by bill ID, topic, or keywords..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button>
                  Search
                </Button>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Popular Searches:</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("education")}>
                    Education
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("healthcare")}>
                    Healthcare
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("taxes")}>
                    Taxes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("property")}>
                    Property
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("environment")}>
                    Environment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis Tools</CardTitle>
              <CardDescription>
                Specialized legislative analysis tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/advanced-search">
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Advanced Search
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/legislative-impact/stats">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Impact Statistics
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/points-of-order-dashboard">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Points of Order
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/vote-dashboard">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Voting Records
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Bills with Highest Impact</CardTitle>
              <CardDescription>
                Legislation with the most significant potential impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTopBillsLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* This would be populated with real data from the topBills query */}
                  <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={() => handleBillSelect("TX-HB1234")}>
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">9.2</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">TX-HB1234</h3>
                        <Badge>Education</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Relating to public school finance and property tax relief</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={() => handleBillSelect("TX-SB789")}>
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">8.7</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">TX-SB789</h3>
                        <Badge>Healthcare</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Relating to healthcare access and insurance coverage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={() => handleBillSelect("TX-HB456")}>
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">8.5</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">TX-HB456</h3>
                        <Badge>Environment</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Relating to environmental regulations and renewable energy</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/advanced-search">
                    View All Analyzed Bills
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact by Category</CardTitle>
              <CardDescription>
                Average impact scores by policy area
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={categoryStats?.slice(0, 7) || []}
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 10]} />
                    <YAxis type="category" dataKey="category" />
                    <Tooltip />
                    <Bar dataKey="avgOverall" name="Impact Score" fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/legislative-impact/stats">
                    View Detailed Statistics
                    <BarChart3 className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Understanding Legislative Impact Analysis</CardTitle>
            <CardDescription>
              How to use this tool to evaluate how legislation affects you and your community
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              The Act Up Legislative Impact Analysis tool helps you understand how pending or passed legislation might affect you, your family, and your community. Our analysis covers various dimensions:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Impact Dimensions
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-start gap-1">
                    <DollarSign className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Economic impact on businesses and individuals</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <Users className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Social impact on communities and groups</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <Scale className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Legal and governance implications</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-500" />
                  Stakeholder Analysis
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-start gap-1">
                    <Check className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Identify who benefits from legislation</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Recognize groups potentially adversely affected</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <Map className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Regional impact across different parts of Texas</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <Home className="h-5 w-5 text-purple-500" />
                  Personalized Assessment
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-start gap-1">
                    <DollarSign className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Estimate personal financial implications</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <Home className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Evaluate impact on your household</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <CheckSquare className="h-3 w-3 mt-1 flex-shrink-0" />
                    <span>Get recommended actions tailored to your situation</span>
                  </li>
                </ul>
              </div>
            </div>

            <h3 className="mt-6">How to Use This Tool</h3>
            <ol>
              <li><strong>Search for Bills:</strong> Use the search bar above to find bills by ID, topic, or keywords.</li>
              <li><strong>Review the Analysis:</strong> Examine the comprehensive impact analysis across multiple dimensions.</li>
              <li><strong>Personalize:</strong> Enter your demographics to see how the bill specifically affects you.</li>
              <li><strong>Compare Bills:</strong> Compare similar bills to understand their different implications.</li>
              <li><strong>Track Over Time:</strong> Return to monitor how the legislation's impact evolves.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a bill is selected, show its impact analysis
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-2">
        <Link href="/legislative-impact" className="text-muted-foreground hover:text-foreground flex items-center">
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Back to All Bills
        </Link>
      </div>

      {isAnalysisLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : isAnalysisError ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analysis</CardTitle>
            <CardDescription>
              We couldn't load the legislative impact analysis for this bill. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/legislative-impact">
                Return to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{impactAnalysis?.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline">{billId}</Badge>
              <Badge className={getImpactColor(impactAnalysis?.impactScores.overall || 0)}>
                Overall Impact: {impactAnalysis?.impactScores.overall}/10
              </Badge>
              <p className="text-sm text-muted-foreground">
                Analysis Date: {formatAnalysisDate(impactAnalysis?.technicalDetails.analysisDate || "")}
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{impactAnalysis?.executiveSummary}</p>
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/50 pt-4">
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export as PDF</TooltipContent>
                  </UITooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => {navigator.clipboard.writeText(window.location.href)}}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy link</TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>

            <div className="lg:w-96">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCompareSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="compareBill">Compare with Another Bill</Label>
                      <div className="flex gap-2">
                        <Input
                          id="compareBill"
                          placeholder="Enter Bill ID (e.g., TX-SB123)"
                          value={compareBillId}
                          onChange={(e) => setCompareBillId(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={!compareBillId}>
                          Compare
                        </Button>
                      </div>
                    </div>
                  </form>

                  <Separator />

                  <div>
                    <Label className="mb-2 block">Personalize Impact Analysis</Label>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        setSelectedTab("personalized");
                        setPersonalizeMode(!personalizeMode);
                        setCompareMode(false);
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {personalizeMode ? "Hide" : "Show"} Personalized Impact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="h-10">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Impact Overview</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center">
                <Layers className="mr-2 h-4 w-4" />
                <span>Detailed Analysis</span>
              </TabsTrigger>
              {compareMode && (
                <TabsTrigger value="comparison" className="flex items-center">
                  <PieChart className="mr-2 h-4 w-4" />
                  <span>Bill Comparison</span>
                </TabsTrigger>
              )}
              {personalizeMode && (
                <TabsTrigger value="personalized" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Personalized Impact</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Impact Scores</CardTitle>
                    <CardDescription>
                      Severity of impact across different dimensions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImpactScoresChart impactScores={impactAnalysis?.impactScores || {
                      overall: 0,
                      economic: 0,
                      social: 0,
                      environmental: 0,
                      legal: 0,
                      governance: 0
                    }} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stakeholder Analysis</CardTitle>
                    <CardDescription>
                      Groups affected by this legislation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StakeholderAnalysis keyStakeholders={impactAnalysis?.keyStakeholders || {
                      beneficiaries: [],
                      adverselyAffected: [],
                      neutralParties: []
                    }} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Regional Impact</CardTitle>
                  <CardDescription>
                    How this bill affects different regions of Texas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RegionalImpactMap regionalImpacts={impactAnalysis?.regionalImpacts || []} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ImplementationAnalysisCard implementationAnalysis={impactAnalysis?.implementationAnalysis || {
                  timeframe: "",
                  feasibility: 0,
                  resourceRequirements: "",
                  potentialChallenges: []
                }} />

                <BudgetaryImplicationsCard budgetaryImplications={impactAnalysis?.budgetaryImplications || {
                  estimatedCost: "",
                  fundingSources: [],
                  fiscalImpact: ""
                }} />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Recommendations</CardTitle>
                    <CardDescription>
                      Suggested actions based on this analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {impactAnalysis?.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                          <p>{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <ComplianceRequirementsCard requirements={impactAnalysis?.complianceRequirements || []} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Legislation & Historical Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Similar Legislation:</h3>
                    <ul className="space-y-2">
                      {impactAnalysis?.comparativeContext.similarLegislation.map((leg, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <FileText className="h-4 w-4 mr-2 mt-0.5" />
                          {leg}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Historical Context:</h3>
                    <p className="text-sm">{impactAnalysis?.comparativeContext.historicalContext}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Details</CardTitle>
                  <CardDescription>
                    Information about this analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Confidence:</span>
                    <div className="flex items-center">
                      <span className="mr-2 font-bold">{impactAnalysis?.technicalDetails.aiConfidence}/10</span>
                      <Progress value={impactAnalysis?.technicalDetails.aiConfidence ? impactAnalysis?.technicalDetails.aiConfidence * 10 : 0} className="w-24 h-2" />
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Data Sources:</span>
                    <ul className="mt-1 space-y-1">
                      {impactAnalysis?.technicalDetails.dataSourcesUsed.map((source, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <BookOpen className="h-3 w-3 mr-2 mt-1" />
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Analysis Date:</span>
                    <p className="text-sm mt-1">{formatAnalysisDate(impactAnalysis?.technicalDetails.analysisDate || "")}</p>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="comparison">
              {isComparisonLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : billComparison ? (
                <BillComparisonView 
                  billId1={billId} 
                  billId2={compareBillId}
                  comparison={billComparison}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Not Available</CardTitle>
                    <CardDescription>
                      We couldn't generate a comparison between these bills at this time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setCompareMode(false)}>
                      Return to Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="personalized">
              {!demographics ? (
                <DemographicsForm onSubmit={handleDemographicsSubmit} />
              ) : isPersonalizedLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : personalizedImpact ? (
                <PersonalizedImpactView personalizedImpact={personalizedImpact} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Personalized Analysis Not Available</CardTitle>
                    <CardDescription>
                      We couldn't generate a personalized analysis based on your demographics at this time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setDemographics(null)}>
                      Try Different Demographics
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}