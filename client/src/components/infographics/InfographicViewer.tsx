import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareIcon, DownloadIcon, ThumbsUpIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sanitizeHtml } from "@/lib/sanitize";

interface InfographicViewerProps {
  id: number;
  title: string;
  description?: string;
  svgContent: string;
  createdAt: string;
  viewCount: number;
  shareCount: number;
  creatorName?: string;
  onShare?: () => void;
  onDownload?: () => void;
}

export const InfographicViewer: React.FC<InfographicViewerProps> = ({
  id,
  title,
  description,
  svgContent,
  createdAt,
  viewCount,
  shareCount,
  creatorName,
  onShare,
  onDownload
}) => {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  
  const handleDownload = () => {
    // Create a Blob with the SVG content
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-infographic.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    if (onDownload) {
      onDownload();
    }
  };
  
  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="cursor-pointer" onClick={() => setFullscreenOpen(true)}>
          <div className="relative overflow-hidden rounded-md border border-gray-200" 
               dangerouslySetInnerHTML={{ __html: sanitizeHtml(svgContent) }} />
        </CardContent>
        <CardFooter className="flex justify-between pt-3">
          <div className="text-sm text-muted-foreground">
            {creatorName && <span>By {creatorName} • </span>}
            <span>Created {formatDate(createdAt)}</span>
            <div className="mt-1">
              <span className="mr-3">{viewCount} views</span>
              <span>{shareCount} shares</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <ShareIcon className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="source">SVG Source</TabsTrigger>
            </TabsList>
            <TabsContent value="view" className="mt-0">
              <div className="overflow-auto max-h-[70vh]"
                   dangerouslySetInnerHTML={{ __html: sanitizeHtml(svgContent) }} />
            </TabsContent>
            <TabsContent value="source" className="mt-0">
              <pre className="overflow-auto max-h-[70vh] bg-muted p-4 rounded-md text-xs">
                {svgContent}
              </pre>
            </TabsContent>
          </Tabs>
          <div className="flex justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              <span>Created {formatDate(createdAt)}</span>
              <div className="mt-1">
                <span className="mr-3">{viewCount} views</span>
                <span>{shareCount} shares</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <ShareIcon className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InfographicViewer;