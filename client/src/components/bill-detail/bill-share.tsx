// @ts-nocheck
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useCreateBillShare, useDeleteBillShare } from "@/hooks/use-bill-interactions";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Share, 
  Copy, 
  Twitter, 
  Facebook, 
  Mail, 
  Link as LinkIcon, 
  Calendar, 
  AlertCircle 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

interface BillShareProps {
  billId: string;
  billTitle: string;
}

type ShareType = "social" | "email" | "link" | "embed";
type SocialPlatform = "twitter" | "facebook" | "linkedin" | undefined;

export function BillShare({ billId, billTitle }: BillShareProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [shareType, setShareType] = useState<ShareType>("link");
  const [platform, setPlatform] = useState<SocialPlatform>(undefined);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeHighlights, setIncludeHighlights] = useState(false);
  const [useAccessCode, setUseAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [useExpiration, setUseExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [generatedShareUrl, setGeneratedShareUrl] = useState("");
  
  const createShareMutation = useCreateBillShare(billId);
  
  const handleCreateShare = async () => {
    try {
      const shareData = {
        userId: user?.id || 0,
        shareType,
        platform,
        recipientEmails: recipientEmails.length > 0 ? recipientEmails : undefined,
        customMessage: customMessage || undefined,
        includeNotes,
        includeHighlights,
        accessCode: useAccessCode ? accessCode : undefined,
        expiresAt: useExpiration && expirationDate ? expirationDate : undefined
      };
      
      const result = await createShareMutation.mutateAsync(shareData);
      setGeneratedShareUrl(result.shareUrl);
      
      // If social share, redirect to the platform with the share URL
      if (shareType === "social" && platform) {
        const shareText = `Check out this bill: ${billTitle}`;
        const shareUrl = window.location.origin + result.shareUrl;
        
        let platformUrl = "";
        
        switch (platform) {
          case "twitter":
            platformUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            break;
          case "facebook":
            platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            break;
          case "linkedin":
            platformUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
            break;
        }
        
        if (platformUrl) {
          window.open(platformUrl, "_blank");
        }
      }
      
    } catch (error) {
      console.error("Failed to create share:", error);
      toast({
        title: "Failed to create share",
        description: "There was an error creating your share link.",
        variant: "destructive",
      });
    }
  };
  
  const copyShareUrl = () => {
    navigator.clipboard.writeText(window.location.origin + generatedShareUrl);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard.",
    });
  };
  
  // Function to handle adding email recipients
  const handleAddEmail = () => {
    if (emailInput && !recipientEmails.includes(emailInput)) {
      setRecipientEmails([...recipientEmails, emailInput]);
      setEmailInput("");
    }
  };
  
  // Function to handle removing email recipients
  const handleRemoveEmail = (email: string) => {
    setRecipientEmails(recipientEmails.filter(e => e !== email));
  };
  
  // Generate random access code
  const generateAccessCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setAccessCode(result);
  };
  
  if (!user) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Share Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">
              Please sign in to share this bill.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Share Bill</CardTitle>
        <CardDescription>
          Share this bill with others or on social media.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Share className="h-4 w-4 mr-2" />
              Share Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Bill</DialogTitle>
              <DialogDescription>
                {billTitle}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {/* Share Type Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Share Type</Label>
                <RadioGroup 
                  value={shareType} 
                  onValueChange={(value) => setShareType(value as ShareType)}
                  className="flex flex-wrap gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="link" id="link" />
                    <Label htmlFor="link" className="flex items-center">
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Link
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="social" id="social" />
                    <Label htmlFor="social" className="flex items-center">
                      <Twitter className="h-4 w-4 mr-1" />
                      Social
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Social Platform Selection (if social share) */}
              {shareType === "social" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Platform</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant={platform === "twitter" ? "default" : "outline"} 
                      onClick={() => setPlatform("twitter")}
                    >
                      <Twitter className="h-4 w-4 mr-1" />
                      Twitter
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant={platform === "facebook" ? "default" : "outline"} 
                      onClick={() => setPlatform("facebook")}
                    >
                      <Facebook className="h-4 w-4 mr-1" />
                      Facebook
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Email Recipients (if email share) */}
              {shareType === "email" && (
                <div>
                  <Label htmlFor="email-input" className="text-sm font-medium mb-2 block">
                    Recipients
                  </Label>
                  <div className="flex mb-2">
                    <Input
                      id="email-input"
                      placeholder="Email address"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1 mr-2"
                    />
                    <Button type="button" onClick={handleAddEmail}>Add</Button>
                  </div>
                  {recipientEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipientEmails.map(email => (
                        <div 
                          key={email} 
                          className="bg-muted px-2 py-1 rounded-md text-sm flex items-center"
                        >
                          {email}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveEmail(email)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Custom Message (for email or social) */}
              {(shareType === "email" || shareType === "social") && (
                <div>
                  <Label htmlFor="custom-message" className="text-sm font-medium mb-1 block">
                    Custom Message (Optional)
                  </Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Add a custom message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              
              {/* Include Notes/Highlights Options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-notes" 
                    checked={includeNotes}
                    onCheckedChange={(checked) => setIncludeNotes(checked === true)}
                  />
                  <Label htmlFor="include-notes">Include my notes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-highlights" 
                    checked={includeHighlights}
                    onCheckedChange={(checked) => setIncludeHighlights(checked === true)}
                  />
                  <Label htmlFor="include-highlights">Include my highlights</Label>
                </div>
              </div>
              
              {/* Advanced Options: Access Code & Expiration */}
              <div className="space-y-4 border-t pt-4 mt-4">
                <h4 className="text-sm font-medium">Advanced Options</h4>
                
                {/* Access Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="use-access-code" 
                        checked={useAccessCode}
                        onCheckedChange={setUseAccessCode}
                      />
                      <Label htmlFor="use-access-code">Require access code</Label>
                    </div>
                    {useAccessCode && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={generateAccessCode}
                      >
                        Generate
                      </Button>
                    )}
                  </div>
                  
                  {useAccessCode && (
                    <Input
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Enter access code"
                      maxLength={6}
                      className="uppercase"
                    />
                  )}
                </div>
                
                {/* Expiration Date */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="use-expiration" 
                      checked={useExpiration}
                      onCheckedChange={setUseExpiration}
                    />
                    <Label htmlFor="use-expiration">Set expiration date</Label>
                  </div>
                  
                  {useExpiration && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !expirationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expirationDate ? format(expirationDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={expirationDate}
                          onSelect={setExpirationDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          className="p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              
              {/* Generated Share URL (after sharing) */}
              {generatedShareUrl && (
                <div className="mt-4 bg-muted p-3 rounded-md">
                  <Label className="text-sm font-medium mb-1 block">Share URL</Label>
                  <div className="flex">
                    <Input 
                      value={window.location.origin + generatedShareUrl} 
                      readOnly 
                      className="flex-1 mr-2"
                    />
                    <Button type="button" size="icon" onClick={copyShareUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
              {!generatedShareUrl && (
                <Button 
                  type="button" 
                  onClick={handleCreateShare}
                  disabled={
                    (shareType === "social" && !platform) ||
                    (shareType === "email" && recipientEmails.length === 0) ||
                    (useAccessCode && !accessCode) ||
                    createShareMutation.isPending
                  }
                >
                  Create Share
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}