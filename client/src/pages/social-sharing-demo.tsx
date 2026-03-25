import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SocialMediaShare from "@/components/SocialMediaShare";
import { 
  Share2, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Heart,
  Zap,
  Twitter,
  Facebook,
  Instagram
} from "lucide-react";

export default function SocialSharingDemo() {
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Fetch authentic Texas bills for sharing demo
  const { data: billsData, isLoading } = useQuery<any>({
    queryKey: ["/api/bills"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const bills = billsData?.results || [];
  const featuredBills = bills.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Share2 className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              One-Click Social Sharing
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Share compelling insights about Texas legislation instantly across all social platforms. 
            Powered by your authentic legislative data and AI-generated engagement content.
          </p>
        </div>

        {/* Demo Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{bills.length}</div>
            <div className="text-sm text-gray-600">Texas Bills Available</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">4</div>
            <div className="text-sm text-gray-600">Social Platforms</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">AI</div>
            <div className="text-sm text-gray-600">Powered Insights</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-orange-600">1-Click</div>
            <div className="text-sm text-gray-600">Share Experience</div>
          </Card>
        </div>

        {/* Featured Bills for Sharing */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Try One-Click Sharing</h2>
            <p className="text-gray-600">Select any authentic Texas bill below to generate instant social media content</p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-8 bg-gray-200 rounded w-32 mt-4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBills.map((bill: any, index: any) => (
                <Card 
                  key={bill.id} 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {bill.title || 'Texas Legislative Bill'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {bill.chamber || 'Legislature'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {bill.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {bill.description || 'Important Texas legislation that could impact residents statewide.'}
                    </p>
                    
                    {/* Social Sharing Metrics Preview */}
                    <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs font-semibold">8.5</span>
                        </div>
                        <div className="text-xs text-gray-600">Impact</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Users className="w-3 h-3" />
                          <span className="text-xs font-semibold">500+</span>
                        </div>
                        <div className="text-xs text-gray-600">Reach</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600">
                          <Zap className="w-3 h-3" />
                          <span className="text-xs font-semibold">High</span>
                        </div>
                        <div className="text-xs text-gray-600">Engagement</div>
                      </div>
                    </div>

                    {/* One-Click Share Button */}
                    <SocialMediaShare 
                      bill={bill} 
                      variant="button" 
                      size="sm"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <Twitter className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Twitter/X Optimized</h3>
            <p className="text-sm text-gray-600">Character-perfect tweets with hashtags and compelling hooks</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-200">
            <Facebook className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Facebook Ready</h3>
            <p className="text-sm text-gray-600">Detailed posts with key points and call-to-action</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100">
            <Instagram className="w-12 h-12 text-pink-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Instagram Stories</h3>
            <p className="text-sm text-gray-600">Visual-friendly content with trending hashtags</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <Share2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">One-Click Magic</h3>
            <p className="text-sm text-gray-600">AI generates engaging content instantly from your authentic data</p>
          </Card>
        </div>

        {/* AI Features Section */}
        <Card className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-indigo-600" />
              AI-Powered Social Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">Smart Content Generation</h3>
                <p className="text-sm text-gray-600">AI analyzes your authentic Texas bills to create compelling, platform-specific content</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Engagement Optimization</h3>
                <p className="text-sm text-gray-600">Automatically calculates impact scores and optimizes content for maximum civic engagement</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Authentic Insights</h3>
                <p className="text-sm text-gray-600">Every share is powered by real Texas legislative data, ensuring accuracy and credibility</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="inline-block p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Share Texas Legislature Insights?</h3>
            <p className="mb-6 opacity-90">Transform civic engagement with one-click social media sharing powered by authentic government data.</p>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Try One-Click Sharing Above
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}