import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertTriangle, Clock, Search, Filter, Plus, Users, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSuperUser } from "@/contexts/SuperUserContext";

// Mock officials for Truth Index
const OFFICIALS = [
  {
    id: 1,
    name: "Jane Smith",
    position: "State Representative",
    district: "District 21",
    promisesFulfilled: 68,
    truthIndex: 82,
    consistencyScore: 78,
    recentActivity: [
      {
        id: 1,
        type: "promise",
        statement: "Will vote for increased education funding",
        actual: "Voted for education funding bill HB123",
        fulfilled: true,
        date: "June 15, 2023"
      },
      {
        id: 2,
        type: "statement",
        statement: "New transit bill will reduce commute times by 30%",
        rating: "misleading",
        explanation: "Studies show only a 5-10% reduction is likely",
        date: "May 28, 2023"
      },
      {
        id: 3,
        type: "promise",
        statement: "Will oppose new property tax increase",
        actual: "Abstained from voting on property tax bill",
        fulfilled: false,
        date: "May 12, 2023"
      }
    ],
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
  },
  {
    id: 2,
    name: "Robert Johnson",
    position: "State Senator",
    district: "District 5",
    promisesFulfilled: 75,
    truthIndex: 91,
    consistencyScore: 84,
    recentActivity: [
      {
        id: 1,
        type: "promise",
        statement: "Will introduce water conservation legislation",
        actual: "Introduced bill SB234 on water conservation",
        fulfilled: true,
        date: "July 2, 2023"
      },
      {
        id: 2,
        type: "statement",
        statement: "Healthcare bill will provide coverage to 20,000 uninsured residents",
        rating: "accurate",
        explanation: "State analysis confirms approximately 19,800 will gain coverage",
        date: "June 10, 2023"
      }
    ],
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    position: "County Commissioner",
    district: "Precinct 3",
    promisesFulfilled: 52,
    truthIndex: 78,
    consistencyScore: 63,
    recentActivity: [
      {
        id: 1,
        type: "promise",
        statement: "Will increase park funding by 10%",
        actual: "Park funding increased by 4% in new budget",
        fulfilled: false,
        date: "June 20, 2023"
      },
      {
        id: 2,
        type: "statement",
        statement: "County roads project will be completed under budget",
        rating: "unverified",
        explanation: "Project still in progress, final costs unknown",
        date: "July 5, 2023"
      }
    ],
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
  }
];

// Legislation claims for Truth Index
const LEGISLATION_CLAIMS = [
  {
    id: 1,
    billNumber: "HB234",
    billName: "Water Conservation Act",
    claim: "Bill will reduce water usage by 20% in drought-affected areas",
    source: "Bill sponsor press release",
    truthRating: "misleading",
    explanation: "Analysis shows likely reduction closer to 8-12% based on similar measures",
    verifications: 14,
    date: "June 28, 2023"
  },
  {
    id: 2,
    billNumber: "SB112",
    billName: "Education Funding Reform",
    claim: "Will increase teacher salaries by $5,000 on average",
    source: "Education Committee Report",
    truthRating: "accurate",
    explanation: "Budget analysis confirms average increase of $5,120 per teacher",
    verifications: 23,
    date: "July 3, 2023"
  },
  {
    id: 3,
    billNumber: "HB456",
    billName: "Transportation Infrastructure Bill",
    claim: "Will create 10,000 new jobs over 2 years",
    source: "Transportation Department Projection",
    truthRating: "partially accurate",
    explanation: "Likely to create 7,500-9,000 jobs based on similar projects",
    verifications: 8,
    date: "July 8, 2023"
  },
  {
    id: 4,
    billNumber: "SB78",
    billName: "Healthcare Access Expansion",
    claim: "Will reduce emergency room visits by 30%",
    source: "Health Secretary statement",
    truthRating: "unverified",
    explanation: "Awaiting more data and expert analysis",
    verifications: 5,
    date: "July 10, 2023"
  }
];

interface SubmissionModalProps {
  onSubmit: (data: any) => void;
  type: "claim" | "promise";
}

function SubmissionModal({ onSubmit, type }: SubmissionModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    official: "",
    billNumber: "",
    billName: "",
    statement: "",
    source: "",
    explanation: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
    setFormData({
      official: "",
      billNumber: "",
      billName: "",
      statement: "",
      source: "",
      explanation: ""
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Submit {type === "claim" ? "Claim" : "Promise"} for Verification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Submit {type === "claim" ? "Claim" : "Promise"} for Verification</DialogTitle>
          <DialogDescription>
            Add details about the {type === "claim" ? "claim" : "promise"} you want verified by the community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {type === "promise" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="official" className="text-right">Official</Label>
                <Select name="official" value={formData.official} onValueChange={(value) => setFormData(prev => ({ ...prev, official: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select official" />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFICIALS.map(official => (
                      <SelectItem key={official.id} value={official.id.toString()}>
                        {official.name} ({official.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {type === "claim" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="billNumber" className="text-right">Bill Number</Label>
                  <Input
                    id="billNumber"
                    name="billNumber"
                    value={formData.billNumber}
                    onChange={handleChange}
                    placeholder="e.g., HB123"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="billName" className="text-right">Bill Name</Label>
                  <Input
                    id="billName"
                    name="billName"
                    value={formData.billName}
                    onChange={handleChange}
                    placeholder="Full name of the bill"
                    className="col-span-3"
                  />
                </div>
              </>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statement" className="text-right">
                {type === "claim" ? "Claim" : "Promise"}
              </Label>
              <Textarea
                id="statement"
                name="statement"
                value={formData.statement}
                onChange={handleChange}
                placeholder={`What ${type === "claim" ? "claim" : "promise"} was made?`}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="source" className="text-right">Source</Label>
              <Input
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="Where was this stated? (provide URL if available)"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="explanation" className="text-right">Context</Label>
              <Textarea
                id="explanation"
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                placeholder="Provide any additional context"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Submit for Verification</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TruthRatingBadge({ rating }: { rating: string }) {
  let badgeClass = "";
  let icon = null;
  
  switch (rating) {
    case "accurate":
      badgeClass = "bg-success text-white";
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      break;
    case "partially accurate":
      badgeClass = "bg-amber-500 text-white";
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      break;
    case "misleading":
      badgeClass = "bg-error text-white";
      icon = <XCircle className="h-3 w-3 mr-1" />;
      break;
    case "unverified":
    default:
      badgeClass = "bg-gray-500 text-white";
      icon = <Clock className="h-3 w-3 mr-1" />;
      break;
  }
  
  return (
    <Badge className={badgeClass}>
      {icon}
      {rating.charAt(0).toUpperCase() + rating.slice(1)}
    </Badge>
  );
}

function PromiseCard({ promise }: { promise: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{promise.statement}</p>
              <p className="text-sm text-gray-500 mt-1">
                {promise.fulfilled ? "Action taken:" : "Actual outcome:"}
              </p>
              <p className="text-sm">{promise.actual}</p>
            </div>
            <Badge className={promise.fulfilled ? "bg-success text-white" : "bg-error text-white"}>
              {promise.fulfilled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {promise.fulfilled ? "Fulfilled" : "Not Fulfilled"}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <span>{promise.date}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatementCard({ statement }: { statement: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <p className="font-medium">{statement.statement}</p>
            <TruthRatingBadge rating={statement.rating} />
          </div>
          <p className="text-sm text-gray-600">{statement.explanation}</p>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <span>{statement.date}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OfficialCard({ official }: { official: any }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <img 
            src={official.image} 
            alt={official.name} 
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <CardTitle>{official.name}</CardTitle>
            <CardDescription>{official.position}, {official.district}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Truth Index</span>
            <span className={`font-medium ${official.truthIndex >= 80 ? 'text-success' : official.truthIndex >= 60 ? 'text-amber-500' : 'text-error'}`}>
              {official.truthIndex}%
            </span>
          </div>
          <Progress value={official.truthIndex} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Promises Fulfilled</span>
            <span className={`font-medium ${official.promisesFulfilled >= 80 ? 'text-success' : official.promisesFulfilled >= 60 ? 'text-amber-500' : 'text-error'}`}>
              {official.promisesFulfilled}%
            </span>
          </div>
          <Progress value={official.promisesFulfilled} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Consistency Score</span>
            <span className={`font-medium ${official.consistencyScore >= 80 ? 'text-success' : official.consistencyScore >= 60 ? 'text-amber-500' : 'text-error'}`}>
              {official.consistencyScore}%
            </span>
          </div>
          <Progress value={official.consistencyScore} className="h-2" />
        </div>
        
        <div className="pt-2">
          <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {official.recentActivity.slice(0, 2).map((activity: any) => (
              <div key={activity.id} className="text-xs border-l-2 border-gray-200 pl-2">
                {activity.type === "promise" ? (
                  <div>
                    <span className={`font-medium ${activity.fulfilled ? "text-success" : "text-error"}`}>
                      {activity.fulfilled ? "Fulfilled: " : "Not Fulfilled: "}
                    </span>
                    {activity.statement}
                  </div>
                ) : (
                  <div>
                    <span className={`font-medium ${
                      activity.rating === "accurate" ? "text-success" : 
                      activity.rating === "misleading" ? "text-error" : 
                      "text-amber-500"
                    }`}>
                      {activity.rating.charAt(0).toUpperCase() + activity.rating.slice(1)}: 
                    </span>
                    {" " + activity.statement}
                  </div>
                )}
                <div className="text-gray-500 mt-0.5">{activity.date}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-0">
        <Button variant="secondary" className="w-full">View Full Record</Button>
      </CardFooter>
    </Card>
  );
}

function LegislationClaimCard({ claim }: { claim: any }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{claim.billName}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              {claim.billNumber}
              <span className="mx-1">•</span>
              <Users className="h-3 w-3" />
              {claim.verifications} verifications
            </CardDescription>
          </div>
          <TruthRatingBadge rating={claim.truthRating} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <h4 className="text-sm font-medium mb-1">Claim:</h4>
        <p className="text-sm mb-2">{claim.claim}</p>
        <h4 className="text-sm font-medium mb-1">Analysis:</h4>
        <p className="text-sm mb-2">{claim.explanation}</p>
        <div className="text-xs text-gray-500 flex items-center justify-between mt-2">
          <div>Source: {claim.source}</div>
          <div>{claim.date}</div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1">Provide Evidence</Button>
          <Button size="sm" className="flex-1">Verify</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function TruthIndex() {
  const { mainRole } = useSuperUser();
  const [activeTab, setActiveTab] = useState("legislation");
  const [searchQuery, setSearchQuery] = useState("");
  const [officials, setOfficials] = useState(OFFICIALS);
  const [claims, setClaims] = useState(LEGISLATION_CLAIMS);
  const { toast } = useToast();
  
  // Filter based on search query
  const filteredOfficials = officials.filter(
    official => official.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                official.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                official.district.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredClaims = claims.filter(
    claim => claim.billName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            claim.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            claim.claim.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSubmitVerification = (data: any) => {
    toast({
      title: "Submission Received",
      description: "Your verification request has been submitted for community review.",
    });
    console.log("Verification submission:", data);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Truth Index</h1>
          <p className="text-gray-500 mt-1">Track promises, verify claims, and hold officials accountable</p>
        </div>
        
        {mainRole?.role === "catalyst" && (
          <Badge variant="secondary" className="bg-success bg-opacity-10 text-success border-success">
            <CheckCircle className="h-4 w-4 mr-1" />
            Catalyst Feature
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search officials, bills, or claims..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {activeTab === "legislation" ? (
          <SubmissionModal type="claim" onSubmit={handleSubmitVerification} />
        ) : (
          <SubmissionModal type="promise" onSubmit={handleSubmitVerification} />
        )}
      </div>
      
      <Tabs defaultValue="legislation" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="legislation">Legislation Claims</TabsTrigger>
          <TabsTrigger value="officials">Elected Officials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="legislation" className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredClaims.length > 0 ? (
              filteredClaims.map(claim => (
                <LegislationClaimCard key={claim.id} claim={claim} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">No Claims Found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? "No claims match your search criteria." : "No claims have been submitted yet."}
                </p>
                {searchQuery && (
                  <Button variant="ghost" className="mt-4" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="officials" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficials.length > 0 ? (
              filteredOfficials.map(official => (
                <OfficialCard key={official.id} official={official} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">No Officials Found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? "No officials match your search criteria." : "No officials have been added yet."}
                </p>
                {searchQuery && (
                  <Button variant="ghost" className="mt-4" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Featured verification module for Catalysts */}
      {mainRole?.role === "catalyst" && (
        <div className="bg-success bg-opacity-5 border border-success border-opacity-20 rounded-lg p-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Catalyst Feature: Community Verification Drive</h2>
              <p className="text-gray-600">Use your research skills to verify high-priority claims that need attention</p>
            </div>
            <Badge className="bg-success text-white">High Impact</Badge>
          </div>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium">Housing Affordability Bill (HB789)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    "Bill will create 5,000 new affordable housing units within 3 years"
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This claim needs verification from Catalysts with research skills
                  </p>
                </div>
                <Badge variant="outline" className="bg-gray-100">
                  <Clock className="h-3 w-3 mr-1" />
                  Priority Verification
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button className="bg-success hover:bg-success-dark">Start Verification</Button>
          </div>
        </div>
      )}
    </div>
  );
}
