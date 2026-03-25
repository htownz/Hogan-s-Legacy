import { useState } from "react";
import { Share, Twitter, Facebook, Linkedin, Mail, MessageCircle, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface SocialShareProps {
  billNumber: string;
  billTitle: string;
  keyInsight: string;
  impactScore?: number;
  className?: string;
}

interface ShareData {
  billNumber: string;
  billTitle: string;
  keyInsight: string;
  impactScore?: number;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'email';
  customMessage?: string;
}

export function SocialShare({ billNumber, billTitle, keyInsight, impactScore, className }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [shareContent, setShareContent] = useState<any>(null);
  const { toast } = useToast();

  // Generate share content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: ShareData) => {
      const response = await fetch('/api/social/generate-share-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate content');
      return response.json();
    },
    onSuccess: (data) => {
      setShareContent(data);
    }
  });

  // Generate card mutation
  const generateCardMutation = useMutation({
    mutationFn: async (data: ShareData) => {
      const response = await fetch('/api/social/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate card');
      return response.json();
    }
  });

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'email') => {
    const shareData: ShareData = {
      billNumber,
      billTitle,
      keyInsight,
      impactScore,
      platform,
      customMessage: customMessage || undefined
    };

    // Generate content for the platform
    await generateContentMutation.mutateAsync(shareData);
    
    const content = shareContent?.content || {};
    const shareUrl = shareContent?.shareUrl || '';

    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.text || '')}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        break;
        
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(content.text || '')}`;
        window.open(facebookUrl, '_blank', 'width=580,height=296');
        break;
        
      case 'linkedin':
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(content.text || '')}`;
        window.open(linkedinUrl, '_blank', 'width=520,height=570');
        break;
        
      case 'reddit':
        const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(content.title || billTitle)}`;
        window.open(redditUrl, '_blank');
        break;
        
      case 'email':
        const emailUrl = `mailto:?subject=${encodeURIComponent(content.subject || '')}&body=${encodeURIComponent(content.body || '')}`;
        window.location.href = emailUrl;
        break;
    }

    toast({
      title: "Shared successfully!",
      description: `Bill insight shared to ${platform}`
    });
  };

  const copyToClipboard = async () => {
    if (!shareContent) {
      await generateContentMutation.mutateAsync({
        billNumber,
        billTitle,
        keyInsight,
        impactScore,
        platform: 'twitter'
      });
    }
    
    const textToCopy = shareContent?.shareUrl || '';
    await navigator.clipboard.writeText(textToCopy);
    
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard"
    });
  };

  const downloadCard = async () => {
    const cardData = await generateCardMutation.mutateAsync({
      billNumber,
      billTitle,
      keyInsight,
      impactScore,
      platform: 'twitter'
    });
    
    if (cardData.success) {
      // Download the SVG card
      const link = document.createElement('a');
      link.href = cardData.imageUrl;
      link.download = `${billNumber}-share-card.svg`;
      link.click();
      
      toast({
        title: "Card downloaded!",
        description: "Shareable card saved to your device"
      });
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={className}
      >
        <Share className="h-4 w-4 mr-2" />
        Share Insight
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Share Bill Insight</h3>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            ×
          </Button>
        </div>

        {/* Bill Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{billNumber}</Badge>
            {impactScore && (
              <Badge variant={impactScore >= 70 ? "destructive" : impactScore >= 40 ? "default" : "secondary"}>
                {impactScore}% Impact
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{billTitle}</p>
          <p className="text-xs text-gray-600">{keyInsight}</p>
        </div>

        {/* Custom Message */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Add your message (optional)
          </label>
          <Textarea
            placeholder="Share your thoughts about this bill..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="text-sm"
            rows={2}
          />
        </div>

        {/* Social Platform Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            onClick={() => handleShare('twitter')}
            variant="outline"
            size="sm"
            className="text-blue-500 border-blue-200 hover:bg-blue-50"
            disabled={generateContentMutation.isPending}
          >
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </Button>
          
          <Button
            onClick={() => handleShare('facebook')}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            disabled={generateContentMutation.isPending}
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          
          <Button
            onClick={() => handleShare('linkedin')}
            variant="outline"
            size="sm"
            className="text-blue-700 border-blue-200 hover:bg-blue-50"
            disabled={generateContentMutation.isPending}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
          
          <Button
            onClick={() => handleShare('reddit')}
            variant="outline"
            size="sm"
            className="text-orange-500 border-orange-200 hover:bg-orange-50"
            disabled={generateContentMutation.isPending}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Reddit
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleShare('email')}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={generateContentMutation.isPending}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            disabled={generateContentMutation.isPending}
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={downloadCard}
            variant="outline"
            size="sm"
            disabled={generateCardMutation.isPending}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading state */}
        {(generateContentMutation.isPending || generateCardMutation.isPending) && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">Generating share content...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}