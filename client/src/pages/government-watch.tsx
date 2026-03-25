import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Clock, CheckCircle, AlertTriangle, X } from "lucide-react";

// Mock data for government officials
const MOCK_OFFICIALS = [
  {
    id: 1,
    name: "Jane Smith",
    position: "State Representative",
    district: "District 21",
    party: "Independent",
    responseTime: 72, // hours
    promisesFulfilled: 68, // percentage
    transparencyScore: 82, // percentage
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
  },
  {
    id: 2,
    name: "Robert Johnson",
    position: "State Senator",
    district: "District 5",
    party: "Independent",
    responseTime: 48, // hours
    promisesFulfilled: 75, // percentage
    transparencyScore: 91, // percentage
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    position: "County Commissioner",
    district: "Precinct 3",
    party: "Independent",
    responseTime: 96, // hours
    promisesFulfilled: 52, // percentage
    transparencyScore: 78, // percentage
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
  }
];

// Mock data for bills
const MOCK_BILLS = [
  {
    id: 1,
    title: "Water Conservation Act",
    number: "HB234",
    status: "In Committee",
    lastAction: "Referred to Natural Resources Committee",
    date: "2023-06-15",
    supportLevel: 62, // percentage
    factChecks: 12, // number of fact checks
    verifiedClaims: 8, // number of verified claims
    misleadingClaims: 4 // number of misleading claims
  },
  {
    id: 2,
    title: "Education Funding Reform",
    number: "SB112",
    status: "Passed House",
    lastAction: "Sent to Governor's desk",
    date: "2023-07-02",
    supportLevel: 54, // percentage
    factChecks: 18, // number of fact checks
    verifiedClaims: 12, // number of verified claims
    misleadingClaims: 6 // number of misleading claims
  },
  {
    id: 3,
    title: "Transportation Infrastructure Bill",
    number: "HB456",
    status: "Introduced",
    lastAction: "First reading in House",
    date: "2023-07-10",
    supportLevel: 48, // percentage
    factChecks: 7, // number of fact checks
    verifiedClaims: 5, // number of verified claims
    misleadingClaims: 2 // number of misleading claims
  }
];

interface OfficialCardProps {
  official: typeof MOCK_OFFICIALS[0];
}

function OfficialCard({ official }: OfficialCardProps) {
  // Calculate color based on metrics
  const getResponseTimeColor = (hours: number) => {
    if (hours <= 48) return "text-success";
    if (hours <= 72) return "text-amber-500";
    return "text-error";
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return "text-success";
    if (percentage >= 50) return "text-amber-500";
    return "text-error";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <img 
          src={official.image} 
          alt={official.name} 
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <CardTitle>{official.name}</CardTitle>
          <CardDescription>{official.position}, {official.district}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" /> Response Time
            </span>
            <span className={getResponseTimeColor(official.responseTime)}>
              {official.responseTime} hours
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Promises Fulfilled</span>
              <span className={getPercentageColor(official.promisesFulfilled)}>
                {official.promisesFulfilled}%
              </span>
            </div>
            <Progress value={official.promisesFulfilled} className="h-2" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transparency Score</span>
              <span className={getPercentageColor(official.transparencyScore)}>
                {official.transparencyScore}%
              </span>
            </div>
            <Progress value={official.transparencyScore} className="h-2" />
          </div>
          
          <Button variant="outline" className="w-full mt-2">View Full Record</Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface BillCardProps {
  bill: typeof MOCK_BILLS[0];
}

function BillCard({ bill }: BillCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{bill.title}</CardTitle>
            <CardDescription>{bill.number} - {bill.status}</CardDescription>
          </div>
          <span className="text-xs bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full">
            {bill.date}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">{bill.lastAction}</p>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Community Support</span>
              <span>{bill.supportLevel}%</span>
            </div>
            <Progress value={bill.supportLevel} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm py-1 border-t border-gray-100">
            <span className="text-gray-500">Fact Checks</span>
            <span>{bill.factChecks}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-gray-600">
              {bill.verifiedClaims} verified claims
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600">
              {bill.misleadingClaims} misleading claims
            </span>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button variant="default" size="sm" className="flex-1 bg-primary">
              View Details
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Fact Check
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GovernmentWatch() {
  const [officials, setOfficials] = useState(MOCK_OFFICIALS);
  const [bills, setBills] = useState(MOCK_BILLS);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter officials and bills based on search query
  useEffect(() => {
    if (!searchQuery) {
      setOfficials(MOCK_OFFICIALS);
      setBills(MOCK_BILLS);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    const filteredOfficials = MOCK_OFFICIALS.filter(
      official => 
        official.name.toLowerCase().includes(query) ||
        official.position.toLowerCase().includes(query) ||
        official.district.toLowerCase().includes(query)
    );
    
    const filteredBills = MOCK_BILLS.filter(
      bill => 
        bill.title.toLowerCase().includes(query) ||
        bill.number.toLowerCase().includes(query) ||
        bill.status.toLowerCase().includes(query)
    );
    
    setOfficials(filteredOfficials);
    setBills(filteredBills);
  }, [searchQuery]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Government Watch</h1>
        
        <div className="relative w-full sm:w-auto max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search officials or legislation..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-2.5 top-2.5"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="officials" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="officials">Elected Officials</TabsTrigger>
          <TabsTrigger value="legislation">Legislation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="officials">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officials.length > 0 ? (
              officials.map(official => (
                <OfficialCard key={official.id} official={official} />
              ))
            ) : (
              <div className="col-span-full text-center py-6">
                <p className="text-gray-500">No officials found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="legislation">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.length > 0 ? (
              bills.map(bill => (
                <BillCard key={bill.id} bill={bill} />
              ))
            ) : (
              <div className="col-span-full text-center py-6">
                <p className="text-gray-500">No legislation found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
