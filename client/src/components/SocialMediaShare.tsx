// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  Copy, 

  Eye,
  MessageCircle,
  Heart,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Bill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsors?: string;
  billNumber?: string;
  introducedAt?: string;
}

interface SocialMediaShareProps {
  bill: Bill;
  variant?: "button" | "icon" | "card";
  size?: "sm" | "md" | "lg";
}

export default function SocialMediaShare({ bill, variant = "button", size = "md" }: SocialMediaShareProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const { toast } = useToast();

  // Generate shareable content for the bill
  const generateShareContent = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/social-sharing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          billId: bill.id,
          type: "bill-insight"
        })
      });

      if (!response.ok) throw new Error("Failed to generate share content");
      
      const data = await response.json();
      setShareData(data);
      
      toast({
        title: "Share Content Generated!",
        description: "Your bill insight is ready to share across social platforms."
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate shareable content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard!",
      description: "Share link copied successfully."
    });
  };

  // Generate social media URLs
  const getSocialUrls = (content: any) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/bill/${bill.id}`;
    const hashtags = "ActUp,TexasLegislature,CivicEngagement";
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.twitterText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(content.facebookText)}`,
      instagram: shareUrl, // Instagram doesn't support direct sharing URLs
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(content.linkedinText)}`
    };
  };

  // Render based on variant
  const renderTrigger = () => {
    switch (variant) {
      case "icon":
        return (
          <Button variant="ghost" size={size} className="p-2">
            <Share2 className="w-4 h-4" />
          </Button>
        );
      case "card":
        return (
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4 text-center">
              <Share2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Share Bill</p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Button variant="outline" size={size} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Bill
          </Button>
        );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div onClick={generateShareContent}>
          {renderTrigger()}
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Bill Insight - {bill.billNumber || bill.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bill Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-lg">{bill.title}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{bill.chamber}</Badge>
                <Badge variant="outline">{bill.status}</Badge>
                {bill.sponsors && <Badge variant="outline">Sponsor: {bill.sponsors}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">{bill.description}</p>
            </CardContent>
          </Card>

          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Generating shareable content...</p>
            </div>
          ) : shareData ? (
            <div className="space-y-6">
              {/* Preview Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Twitter Preview */}
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Twitter className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Twitter/X Post</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-4 rounded-lg border space-y-3">
                      <p className="text-sm">{shareData.twitterText}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>12</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          <span>8</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>24</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Facebook Preview */}
                <Card className="border-blue-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Facebook Post</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-4 rounded-lg border space-y-3">
                      <p className="text-sm">{shareData.facebookText}</p>
                      <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-600">
                        <h4 className="font-medium text-sm">{bill.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{bill.description?.substring(0, 100)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Share Actions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Share on Social Media</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Twitter */}
                  <Button 
                    onClick={() => window.open(getSocialUrls(shareData).twitter, '_blank')}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>

                  {/* Facebook */}
                  <Button 
                    onClick={() => window.open(getSocialUrls(shareData).facebook, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>

                  {/* LinkedIn */}
                  <Button 
                    onClick={() => window.open(getSocialUrls(shareData).linkedin, '_blank')}
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>

                  {/* Copy Link */}
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard(getSocialUrls(shareData).instagram)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>

                {/* Instagram Note */}
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span className="font-medium text-pink-800">Instagram Sharing</span>
                  </div>
                  <p className="text-sm text-pink-700">
                    Copy the link above and paste it in your Instagram story or bio. 
                    You can also screenshot the preview cards to share as images!
                  </p>
                </div>

                {/* Analytics Preview */}
                {shareData.analytics && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Engagement Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-700">{shareData.analytics.estimated_reach}</div>
                          <div className="text-sm text-green-600">Estimated Reach</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-700">{shareData.analytics.engagement_score}%</div>
                          <div className="text-sm text-green-600">Engagement Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-700">{shareData.analytics.impact_level}</div>
                          <div className="text-sm text-green-600">Impact Level</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Click to generate shareable content for this bill</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}