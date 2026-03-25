import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, MessageCircle, Copy, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface BillInsight {
  billTitle: string;
  billNumber: string;
  keyInsight: string;
  impactSummary: string;
  callToAction: string;
  url?: string;
}

interface SocialShareButtonProps {
  billInsight: BillInsight;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function SocialShareButton({ billInsight, className, variant = 'outline' }: SocialShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = billInsight.url || window.location.href;
  
  // Generate compelling social media content
  const generateShareContent = (platform: 'twitter' | 'facebook' | 'general') => {
    const baseContent = `🏛️ ${billInsight.billTitle} (${billInsight.billNumber})\n\n${billInsight.keyInsight}\n\n💡 ${billInsight.impactSummary}\n\n${billInsight.callToAction}`;
    
    switch (platform) {
      case 'twitter':
        // Optimize for Twitter's character limit
        return `🏛️ ${billInsight.billNumber}: ${billInsight.keyInsight}\n\n💡 Impact: ${billInsight.impactSummary}\n\n${billInsight.callToAction}\n\n#TexasLegislature #CivicEngagement #ActUp`;
      case 'facebook':
        return `${baseContent}\n\nStay informed about Texas legislation with Act Up! 🏛️\n\n#TexasLegislature #CivicEngagement #ActUp`;
      default:
        return baseContent;
    }
  };

  const handleTwitterShare = () => {
    const text = generateShareContent('twitter');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    
    toast({
      title: "Shared to Twitter!",
      description: "Opening Twitter to share your bill insight.",
    });
  };

  const handleFacebookShare = () => {
    const text = generateShareContent('facebook');
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
    
    toast({
      title: "Shared to Facebook!",
      description: "Opening Facebook to share your bill insight.",
    });
  };

  const handleWhatsAppShare = () => {
    const text = generateShareContent('general');
    const url = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
    window.open(url, '_blank');
    
    toast({
      title: "Shared to WhatsApp!",
      description: "Opening WhatsApp to share your bill insight.",
    });
  };

  const handleCopyLink = async () => {
    try {
      const shareText = generateShareContent('general') + '\n\n' + shareUrl;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied to clipboard!",
        description: "Bill insight and link copied successfully.",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy failed",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Insight
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleTwitterShare} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}