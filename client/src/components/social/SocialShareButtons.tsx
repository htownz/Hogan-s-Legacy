import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Link as LinkIcon, 
  Share2,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  showLabel?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  platforms?: ('twitter' | 'facebook' | 'linkedin' | 'email' | 'copy')[];
  onShare?: (platform: string) => void;
}

export default function SocialShareButtons({
  url,
  title,
  description = '',
  image = '',
  showLabel = false,
  className = '',
  variant = 'outline',
  size = 'icon',
  platforms = ['twitter', 'facebook', 'linkedin', 'email', 'copy'],
  onShare
}: SocialShareButtonsProps) {
  const { toast } = useToast();
  
  // Ensure we have the full URL for sharing
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  const shareLinks: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${fullUrl}`)}`,
  };

  const platformLabels: Record<string, string> = {
    twitter: 'Twitter',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    email: 'Email',
    copy: 'Copy Link'
  };

  const platformIcons: Record<string, React.ReactNode> = {
    twitter: <Twitter className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    copy: <Copy className="h-4 w-4" />
  };

  const platformColors: Record<string, string> = {
    twitter: 'hover:text-blue-400 focus:text-blue-400',
    facebook: 'hover:text-blue-600 focus:text-blue-600',
    linkedin: 'hover:text-blue-700 focus:text-blue-700',
    email: 'hover:text-green-600 focus:text-green-600',
    copy: 'hover:text-purple-500 focus:text-purple-500'
  };

  const handleShare = (platform: string, e: React.MouseEvent) => {
    if (platform === 'copy') {
      e.preventDefault();
      navigator.clipboard.writeText(fullUrl).then(() => {
        toast({
          title: 'Link copied!',
          description: 'The link has been copied to your clipboard.'
        });
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        toast({
          title: 'Copying failed',
          description: 'Failed to copy the link to clipboard.',
          variant: 'destructive'
        });
      });
    } else {
      // For other platforms, open in a new window
      window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    }

    // Callback for tracking or custom actions
    if (onShare) {
      onShare(platform);
    }
  };

  const visiblePlatforms = platforms.filter(platform => 
    platform === 'copy' || Object.keys(shareLinks).includes(platform)
  );

  // If there's a single platform, show a more descriptive button
  if (visiblePlatforms.length === 1) {
    const platform = visiblePlatforms[0];
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(platformColors[platform], className)}
        onClick={(e) => handleShare(platform, e)}
      >
        {platformIcons[platform]}
        {showLabel && <span className="ml-2">{platformLabels[platform]}</span>}
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {visiblePlatforms.map(platform => (
        <TooltipProvider key={platform}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={variant}
                size={size}
                className={cn("transition-colors", platformColors[platform])}
                onClick={(e) => handleShare(platform, e)}
              >
                {platformIcons[platform]}
                {showLabel && <span className="ml-2">{platformLabels[platform]}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share on {platformLabels[platform]}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// Simplified share button that expands to show all options
export function ShareButton({
  url,
  title,
  description,
  image,
  platforms,
  className,
  onShare,
  label = "Share"
}: SocialShareButtonsProps & { label?: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={toggleExpanded}
      >
        <Share2 className="h-4 w-4" />
        {label}
      </Button>
      
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border z-50 animate-in fade-in-50 slide-in-from-top-5">
          <div className="mb-2 text-sm font-medium">Share via</div>
          <SocialShareButtons
            url={url}
            title={title}
            description={description}
            image={image}
            platforms={platforms}
            showLabel={true}
            size="sm"
            variant="ghost"
            onShare={(platform) => {
              if (onShare) onShare(platform);
              setIsExpanded(false);
            }}
          />
        </div>
      )}
    </div>
  );
}