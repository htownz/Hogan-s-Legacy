// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { AlertCircle, RefreshCw, Search, CheckCircle, ExternalLink } from "lucide-react";

// Types
interface LegislativeUpdate {
  id: string;
  title: string;
  description: string;
  link: string;
  sourceType: string;
  sourceName: string;
  category: string;
  billId: string | null;
  publicationDate: string;
  createdAt: string;
  isRead: boolean;
}

interface LegislativeUpdateResponse {
  data: LegislativeUpdate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filterOptions: {
    categories: string[];
  };
}

interface LegislativeUpdateStats {
  unreadCount: number;
  categoryStats: {
    category: string;
    count: number;
    unreadCount: number;
  }[];
  billStats: {
    billId: string;
    count: number;
  }[];
}

export default function LegislativeUpdates() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

  // Query for legislative updates
  const {
    data: updates,
    isLoading: updatesLoading,
    isError: updatesError,
    refetch: refetchUpdates,
  } = useQuery<LegislativeUpdateResponse>({
    queryKey: [
      "/api/legislative-updates",
      currentPage,
      searchQuery,
      selectedCategory,
      showUnreadOnly,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "20");
      
      if (searchQuery) {
        params.append("q", searchQuery);
      }
      
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }
      
      if (showUnreadOnly) {
        params.append("unreadOnly", "true");
      }
      
      const response = await fetch(`/api/legislative-updates?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch legislative updates");
      }
      return response.json();
    },
  });

  // Query for update statistics
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery<LegislativeUpdateStats>({
    queryKey: ["/api/legislative-updates/stats"],
    queryFn: async () => {
      const response = await fetch("/api/legislative-updates/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch legislative update statistics");
      }
      return response.json();
    },
  });

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await fetch("/api/legislative-updates/refresh", {
        method: "POST",
      });
      refetchUpdates();
      refetchStats();
    } catch (error) {
      console.error("Error refreshing updates:", error);
    }
  };

  // Handle marking as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/legislative-updates/${id}/read`, {
        method: "POST",
      });
      refetchUpdates();
      refetchStats();
    } catch (error) {
      console.error("Error marking update as read:", error);
    }
  };

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }
      
      await fetch(`/api/legislative-updates/mark-all-read?${params.toString()}`, {
        method: "POST",
      });
      refetchUpdates();
      refetchStats();
    } catch (error) {
      console.error("Error marking all updates as read:", error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setShowUnreadOnly(false);
    setCurrentPage(1);
  };

  // Format description text (remove HTML tags)
  const formatDescription = (description: string) => {
    return description.replace(/<[^>]*>?/gm, '').trim();
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "unread") {
      setShowUnreadOnly(true);
    } else {
      setShowUnreadOnly(false);
    }
    
    if (value !== "all" && value !== "unread") {
      setSelectedCategory(value);
    } else {
      setSelectedCategory(null);
    }
    
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Legislative Updates</h2>
          <Button onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Stats Overview</CardTitle>
            <CardDescription>
              Quick overview of legislative activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-24 w-60" />
                <Skeleton className="h-24 w-60" />
                <Skeleton className="h-24 w-60" />
              </div>
            ) : statsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load statistics. Please try again.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-lg">Unread Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.unreadCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-lg">Top Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {stats?.categoryStats
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 4)
                        .map((cat) => (
                          <Badge
                            key={cat.category}
                            className="cursor-pointer"
                            onClick={() => handleTabChange(cat.category)}
                          >
                            {cat.category} ({cat.count})
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-lg">Active Bills</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {stats?.billStats
                        .slice(0, 4)
                        .map((bill) => (
                          <Badge
                            key={bill.billId}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setSearchQuery(bill.billId)}
                          >
                            {bill.billId} ({bill.count})
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search updates..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setCurrentPage(1);
                      refetchUpdates();
                    }
                  }}
                />
              </div>
              {(searchQuery || selectedCategory || showUnreadOnly) && (
                <Button variant="ghost" onClick={resetFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark All as Read
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All Updates</TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({stats?.unreadCount || 0})
              </TabsTrigger>
              {stats?.categoryStats
                .sort((a, b) => b.count - a.count)
                .map((cat) => (
                  <TabsTrigger key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </TabsTrigger>
                ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {updatesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-full max-w-md" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : updatesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load updates. Please try again.
                  </AlertDescription>
                </Alert>
              ) : updates?.data.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No updates found</AlertTitle>
                  <AlertDescription>
                    No legislative updates match the current filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {updates?.data.map((update) => (
                    <Card
                      key={update.id}
                      className={update.isRead ? "opacity-80" : ""}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="flex flex-col">
                            <CardTitle className="flex items-center gap-2">
                              {!update.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                              {update.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {update.category}
                              </Badge>
                              {update.billId && (
                                <Badge variant="outline">{update.billId}</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(
                                  new Date(update.publicationDate),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </span>
                            </CardDescription>
                          </div>
                          <div>
                            <Badge variant="outline">{update.sourceName}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-24">
                          <div className="text-sm">
                            {formatDescription(update.description)}
                          </div>
                        </ScrollArea>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={update.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            View Source <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                        {!update.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(update.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {updates?.pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm">
                          Page {currentPage} of {updates.pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            currentPage === updates.pagination.totalPages
                          }
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}