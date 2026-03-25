import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, BarChart2, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Bill } from "@shared/schema";

type TrendingBill = {
  bill: Bill;
  trackCount: number;
};

type ContentiousBill = Bill & {
  contention_score: number;
  assessment_count: number;
};

export function TrendingBillsDashboard() {
  const [activeTab, setActiveTab] = useState("most-watched");

  // Query most watched bills
  const { 
    data: mostWatchedBills,
    isLoading: isLoadingMostWatched,
    error: mostWatchedError
  } = useQuery<any>({
    queryKey: ['/api/trending/most-watched'],
    enabled: activeTab === "most-watched"
  });

  // Query most contentious bills
  const {
    data: mostContentiousBills,
    isLoading: isLoadingContentious,
    error: contentiousError
  } = useQuery<any>({
    queryKey: ['/api/trending/most-contentious'],
    enabled: activeTab === "most-contentious"
  });

  // Query bills with recent activity
  const {
    data: recentActivityBills,
    isLoading: isLoadingRecent,
    error: recentError
  } = useQuery<any>({
    queryKey: ['/api/trending/recent-activity'],
    enabled: activeTab === "recent-activity"
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const renderBillCards = (type: string) => {
    let bills: any[] = [];
    let isLoading = false;
    let error: any = null;

    switch (type) {
      case "most-watched":
        bills = mostWatchedBills || [];
        isLoading = isLoadingMostWatched;
        error = mostWatchedError;
        break;
      case "most-contentious":
        bills = mostContentiousBills || [];
        isLoading = isLoadingContentious;
        error = contentiousError;
        break;
      case "recent-activity":
        bills = recentActivityBills || [];
        isLoading = isLoadingRecent;
        error = recentError;
        break;
    }

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium">Error loading bills</h3>
          <p className="text-sm text-gray-500 mt-2">
            There was a problem fetching the trending bills.
          </p>
        </div>
      );
    }

    if (bills.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-gray-500">No bills found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {type === "most-watched" && 
          (bills as TrendingBill[]).map(({ bill, trackCount }) => (
            <BillCard 
              key={bill.id}
              bill={bill} 
              metric={trackCount}
              metricLabel="watchers"
              metricIcon={<Eye className="h-4 w-4 text-primary" />}
            />
          ))}

        {type === "most-contentious" && 
          (bills as ContentiousBill[]).map((bill) => (
            <BillCard 
              key={bill.id} 
              bill={bill}
              metric={parseFloat(bill.contention_score.toFixed(2))}
              metricLabel="contention score"
              metricIcon={<BarChart2 className="h-4 w-4 text-primary" />}
            />
          ))}

        {type === "recent-activity" && 
          (bills as Bill[]).map((bill) => (
            <BillCard 
              key={bill.id} 
              bill={bill}
              metric={null}
              metricLabel={`Updated ${formatDistanceToNow(new Date(bill.lastActionAt), { addSuffix: true })}`}
              metricIcon={<Clock className="h-4 w-4 text-primary" />}
            />
          ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trending Legislation</h1>
        <p className="text-gray-600">
          Stay informed about the most impactful bills in the Texas Legislature
        </p>
      </div>

      <Tabs defaultValue="most-watched" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="most-watched" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden md:inline">Most Watched</span>
            <span className="md:hidden">Watched</span>
          </TabsTrigger>
          <TabsTrigger value="most-contentious" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden md:inline">Most Contentious</span>
            <span className="md:hidden">Contentious</span>
          </TabsTrigger>
          <TabsTrigger value="recent-activity" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Recent Activity</span>
            <span className="md:hidden">Recent</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="most-watched">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Most Watched Bills</h2>
            <p className="text-sm text-gray-500">Bills being tracked by the most users</p>
          </div>
          {renderBillCards("most-watched")}
        </TabsContent>
        
        <TabsContent value="most-contentious">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Most Contentious Bills</h2>
            <p className="text-sm text-gray-500">Bills with the most divided sentiment across users</p>
          </div>
          {renderBillCards("most-contentious")}
        </TabsContent>
        
        <TabsContent value="recent-activity">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Recent Legislative Activity</h2>
            <p className="text-sm text-gray-500">Bills with the most recent updates or movement</p>
          </div>
          {renderBillCards("recent-activity")}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BillCardProps {
  bill: Bill;
  metric: number | null;
  metricLabel: string;
  metricIcon: React.ReactNode;
}

function BillCard({ bill, metric, metricLabel, metricIcon }: BillCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            <Link href={`/legislation/${bill.id}`} className="hover:text-primary hover:underline">
              {bill.id}
            </Link>
          </CardTitle>
          <Badge variant={getBillStatusVariant(bill.status)}>
            {bill.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-1">
          {bill.chamber} • {bill.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm line-clamp-3 text-gray-600">
          {bill.description}
        </p>
      </CardContent>
      <CardFooter className="bg-slate-50 flex items-center gap-2 text-sm">
        {metricIcon}
        <span>
          {metric !== null ? (
            <>
              <span className="font-semibold">{metric}</span> {metricLabel}
            </>
          ) : (
            metricLabel
          )}
        </span>
      </CardFooter>
    </Card>
  );
}

function getBillStatusVariant(status: string): "default" | "outline" | "secondary" | "destructive" | "success" {
  switch (status.toLowerCase()) {
    case "passed":
    case "enacted":
      return "success";
    case "filed":
    case "introduced":
      return "default";
    case "in committee":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}