import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Users, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Clock,
  Share2,
  Bookmark,
  AlertCircle,
  CheckCircle,
  Building,
  Gavel,
  DollarSign,
  Target
} from "lucide-react";
import { format } from "date-fns";

export default function BillDetail() {
  const [, params] = useRoute("/bills/:id");
  const billId = params?.id;
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch bill data
  const { data: bill, isLoading } = useQuery<any>({
    queryKey: ["/api/bills", billId],
    enabled: !!billId,
  });

  // Fetch related bills
  const { data: relatedBills } = useQuery<any>({
    queryKey: ["/api/bills/related", billId],
    enabled: !!billId,
  });

  // Fetch bill sponsor/author data
  const { data: sponsors } = useQuery<any>({
    queryKey: ["/api/legislators/by-names", bill?.sponsors],
    enabled: !!bill?.sponsors,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Bill Not Found</h2>
            <p className="text-gray-600">The requested bill could not be found in our Texas legislative database.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate bill progress
  const getStatusProgress = (status: string) => {
    const statusMap: Record<string, number> = {
      'Filed': 10,
      'Referred': 25,
      'Committee': 40,
      'Reported': 55,
      'Calendars': 70,
      'Passed': 85,
      'Enrolled': 100
    };
    return statusMap[status] || 0;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Filed': 'bg-blue-500',
      'Referred': 'bg-yellow-500',
      'Committee': 'bg-orange-500',
      'Reported': 'bg-purple-500',
      'Calendars': 'bg-indigo-500',
      'Passed': 'bg-green-500',
      'Enrolled': 'bg-emerald-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {bill.chamber} Bill
                </Badge>
                <Badge variant="outline">{bill.billNumber || bill.id}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {bill.title}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {bill.description || 'A bill relating to Texas legislative matters.'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Status Progress */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Legislative Progress</span>
              <Badge className={getStatusColor(bill.status)} variant="secondary">
                {bill.status}
              </Badge>
            </div>
            <Progress value={getStatusProgress(bill.status)} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Filed</span>
              <span>Committee</span>
              <span>Floor</span>
              <span>Passed</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="summary" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Bill Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {bill.summary || 
                         `This ${bill.chamber} bill, ${bill.title}, addresses important legislative matters for the state of Texas. 
                          The legislation was introduced to the ${bill.chamber} and is currently in ${bill.status} status.`
                        }
                      </p>
                    </div>

                    {/* Key Points */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Key Points
                      </h4>
                      <ul className="space-y-2 text-blue-800">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                          <span>Introduced in the Texas {bill.chamber}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                          <span>Current status: {bill.status}</span>
                        </li>
                        {bill.sponsors && (
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                            <span>Primary sponsor: {bill.sponsors}</span>
                          </li>
                        )}
                        {bill.subjects && bill.subjects.length > 0 && (
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                            <span>Subject areas: {bill.subjects.join(', ')}</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Impact Assessment */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Potential Impact
                      </h4>
                      <p className="text-green-800">
                        This legislation may affect Texas residents through changes to state law and policy. 
                        The specific impact will depend on the bill's progress through the legislative process 
                        and any amendments made during committee review.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Legislative Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Chamber:</span>
                          <span>{bill.chamber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gavel className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Status:</span>
                          <Badge variant="outline">{bill.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Introduced:</span>
                          <span>{bill.introducedAt ? format(new Date(bill.introducedAt), 'PPP') : 'Date unavailable'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Sponsors:</span>
                          <span>{bill.sponsors || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Last Action:</span>
                          <span>{bill.lastActionAt ? format(new Date(bill.lastActionAt), 'PPP') : 'No recent action'}</span>
                        </div>
                      </div>
                    </div>

                    {bill.subjects && bill.subjects.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Subject Areas</h5>
                        <div className="flex flex-wrap gap-2">
                          {bill.subjects.map((subject: any, index: any) => (
                            <Badge key={index} variant="secondary">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions">
                <Card>
                  <CardHeader>
                    <CardTitle>Legislative Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bill.actions && bill.actions.length > 0 ? (
                        bill.actions.map((action: any, index: any) => (
                          <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="font-medium">{action.action}</div>
                              <div className="text-sm text-gray-600">
                                {action.date && format(new Date(action.date), 'PPP')} - {action.chamber}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No legislative actions recorded yet</p>
                          <p className="text-sm">Actions will appear here as the bill progresses</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis">
                <Card>
                  <CardHeader>
                    <CardTitle>Bill Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-900 mb-2">Complexity Level</h5>
                        <div className="flex items-center gap-2">
                          <Progress value={65} className="flex-1" />
                          <span className="text-sm text-blue-700">Moderate</span>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-semibold text-green-900 mb-2">Public Interest</h5>
                        <div className="flex items-center gap-2">
                          <Progress value={45} className="flex-1" />
                          <span className="text-sm text-green-700">Moderate</span>
                        </div>
                      </div>
                    </div>

                    <div className="prose max-w-none">
                      <p className="text-gray-700">
                        This bill represents standard legislative activity in the Texas {bill.chamber}. 
                        Based on similar legislation, bills of this type typically have a moderate passage rate 
                        and may undergo committee review and potential amendments before final consideration.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sponsor Information */}
            {sponsors && sponsors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bill Sponsors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sponsors.map((sponsor: any, index: any) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{sponsor.name}</div>
                          <div className="text-sm text-gray-600">
                            {sponsor.party} - District {sponsor.district}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Bills */}
            {relatedBills && relatedBills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedBills.slice(0, 5).map((relatedBill: any) => (
                      <div key={relatedBill.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm mb-1">
                          {relatedBill.title.substring(0, 60)}...
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {relatedBill.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {relatedBill.chamber}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Take Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Contact Your Representative
                </Button>
                <Button className="w-full" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share This Bill
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Read Full Text
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}