// @ts-nocheck
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Share2,
  Download,
  Search,
  Loader2,
  Palette,
  Sparkles,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Image,
  FileImage,
  Zap,
  Eye,
  Copy,
  CheckCircle2
} from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ShareableGraphicsPage() {
  const [activeTab, setActiveTab] = useState<string>("create");
  const [billId, setBillId] = useState<string>("");
  const [billSearchQuery, setBillSearchQuery] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("modern");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["social_media"]);
  const [generatedCard, setGeneratedCard] = useState<any>(null);
  const [generatedGraphics, setGeneratedGraphics] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [billSearchResults, setBillSearchResults] = useState<any[]>([]);
  const [copiedText, setCopiedText] = useState<string>("");
  const { toast } = useToast();

  // Mutation for generating complete graphics package
  const generatePackageMutation = useMutation({
    mutationFn: async (data: { billId: number; style: string; formats: string[] }) => {
      const response = await axios.post('/api/graphics/complete-package', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedCard(data.data.impactCard);
        setGeneratedGraphics(data.data.graphics);
        toast({
          title: "Graphics Generated!",
          description: `Created ${data.data.totalFormats} shareable graphics for your bill`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate graphics",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Error",
        description: error.message || "An error occurred while generating graphics",
        variant: "destructive",
      });
    },
  });

  const handleSearchBills = async () => {
    if (!billSearchQuery) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/legiscan/search?query=${encodeURIComponent(billSearchQuery)}`);
      if (response.data.success && response.data.data && response.data.data.bills) {
        setBillSearchResults(response.data.data.bills);
      } else {
        setBillSearchResults([]);
        toast({
          title: "Search Failed",
          description: "Failed to retrieve bills. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching bills:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for bills",
        variant: "destructive",
      });
      setBillSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBill = (selectedBillId: number) => {
    setBillId(selectedBillId.toString());
    setBillSearchResults([]);
    setBillSearchQuery("");
  };

  const handleGenerateGraphics = () => {
    if (!billId || isNaN(parseInt(billId, 10))) {
      toast({
        title: "Invalid Bill ID",
        description: "Please enter a valid bill ID or search for a bill",
        variant: "destructive",
      });
      return;
    }

    if (selectedFormats.length === 0) {
      toast({
        title: "No Formats Selected",
        description: "Please select at least one format to generate",
        variant: "destructive",
      });
      return;
    }

    generatePackageMutation.mutate({
      billId: parseInt(billId, 10),
      style: selectedStyle,
      formats: selectedFormats
    });
  };

  const handleFormatToggle = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(platform);
      toast({
        title: "Copied to Clipboard",
        description: `${platform} text copied successfully`,
      });
      setTimeout(() => setCopiedText(""), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadSVG = (graphic: any) => {
    const blob = new Blob([graphic.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-card-${graphic.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your graphic is being downloaded",
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'social_media': return <Share2 className="h-4 w-4" />;
      case 'story': return <Instagram className="h-4 w-4" />;
      case 'banner': return <Image className="h-4 w-4" />;
      case 'infographic': return <FileImage className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'social_media': return 'Social Media Post';
      case 'story': return 'Instagram Story';
      case 'banner': return 'Website Banner';
      case 'infographic': return 'Infographic';
      default: return format;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Shareable Graphics</h1>
              <p className="text-muted-foreground">
                Create beautiful, shareable impact cards for any bill to spread civic awareness
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Graphics</TabsTrigger>
            <TabsTrigger value="gallery">Your Graphics</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Creation Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Bill</CardTitle>
                    <CardDescription>
                      Choose a bill to create shareable graphics for
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Bill ID</Label>
                      <Input
                        value={billId}
                        onChange={(e) => setBillId(e.target.value)}
                        placeholder="Enter bill ID number"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="h-px flex-1 bg-border"></div>
                      <span className="text-xs text-muted-foreground">OR</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Search for Bill</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          value={billSearchQuery}
                          onChange={(e) => setBillSearchQuery(e.target.value)}
                          placeholder="Search by keyword or bill number"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchBills();
                          }}
                        />
                        <Button 
                          onClick={handleSearchBills} 
                          disabled={isSearching || !billSearchQuery}
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {billSearchResults.length > 0 && (
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {billSearchResults.map((bill) => (
                            <div 
                              key={bill.bill_id}
                              className="p-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleSelectBill(bill.bill_id)}
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">{bill.number}</span>
                                <span className="text-sm text-muted-foreground">{bill.state}</span>
                              </div>
                              <p className="text-sm truncate">{bill.title}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Design Options</CardTitle>
                    <CardDescription>
                      Customize the look and feel of your graphics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Style</Label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">
                            <div className="flex items-center">
                              <Zap className="mr-2 h-4 w-4" />
                              <span>Modern</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="classic">
                            <div className="flex items-center">
                              <Palette className="mr-2 h-4 w-4" />
                              <span>Classic</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bold">
                            <div className="flex items-center">
                              <Sparkles className="mr-2 h-4 w-4" />
                              <span>Bold</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="minimal">
                            <div className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Minimal</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Output Formats</Label>
                      <div className="space-y-3">
                        {[
                          { value: 'social_media', label: 'Social Media Post', desc: '1200x630 - Perfect for Facebook, Twitter' },
                          { value: 'story', label: 'Instagram Story', desc: '1080x1920 - Vertical format for stories' },
                          { value: 'banner', label: 'Website Banner', desc: '1500x500 - Great for websites and blogs' },
                          { value: 'infographic', label: 'Infographic', desc: '800x1200 - Detailed vertical layout' }
                        ].map((format) => (
                          <div key={format.value} className="flex items-start space-x-2">
                            <Checkbox 
                              id={format.value}
                              checked={selectedFormats.includes(format.value)}
                              onCheckedChange={() => handleFormatToggle(format.value)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor={format.value} className="text-sm font-medium flex items-center">
                                {getFormatIcon(format.value)}
                                <span className="ml-2">{format.label}</span>
                              </Label>
                              <p className="text-xs text-muted-foreground">{format.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={handleGenerateGraphics}
                      disabled={generatePackageMutation.isPending || !billId}
                    >
                      {generatePackageMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Graphics...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Graphics
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Panel */}
              <div className="space-y-6">
                {!generatedCard && !generatePackageMutation.isPending && (
                  <Card>
                    <CardContent className="pt-6 pb-6">
                      <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-medium">Shareable Graphics Generator</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Create beautiful, branded impact cards that make complex legislation easy to understand and share.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                          <div className="border rounded-md p-3 text-left">
                            <div className="font-medium flex items-center">
                              <Share2 className="h-4 w-4 mr-2" />
                              Social Ready
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Optimized for all major platforms
                            </p>
                          </div>
                          
                          <div className="border rounded-md p-3 text-left">
                            <div className="font-medium flex items-center">
                              <Zap className="h-4 w-4 mr-2" />
                              AI-Powered
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Smart impact analysis and design
                            </p>
                          </div>
                          
                          <div className="border rounded-md p-3 text-left">
                            <div className="font-medium flex items-center">
                              <Download className="h-4 w-4 mr-2" />
                              Multiple Formats
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              SVG, social media, and print ready
                            </p>
                          </div>
                          
                          <div className="border rounded-md p-3 text-left">
                            <div className="font-medium flex items-center">
                              <Palette className="h-4 w-4 mr-2" />
                              Brand Consistent
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Professional Act Up branding
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {generatePackageMutation.isPending && (
                  <Card>
                    <CardContent className="pt-6 pb-6">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="text-center">
                          <h3 className="text-lg font-medium">Creating Your Graphics</h3>
                          <p className="text-sm text-muted-foreground">
                            Analyzing bill impact and generating beautiful visuals...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {generatedCard && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                        Impact Card Generated
                        <Badge variant="outline" className="ml-2">
                          {generatedCard.billNumber}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Your shareable graphics are ready! Preview and download below.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Live Preview Section */}
                      <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                        <h5 className="font-medium mb-3 flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          Live Preview
                        </h5>
                        {generatedGraphics.length > 0 && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div 
                              className="w-full max-w-md mx-auto border rounded-lg overflow-hidden"
                              style={{ aspectRatio: '1200/630' }}
                            >
                              <div 
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{ 
                                  __html: generatedGraphics[0]?.svgContent || ''
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Impact Summary Card */}
                      <div className="p-4 border rounded-md bg-gradient-to-r from-green-50 to-blue-50">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Zap className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-2">{generatedCard.title}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{generatedCard.impactSummary}</p>
                          </div>
                        </div>
                      </div>

                      {generatedCard.keyStats && generatedCard.keyStats.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="font-medium flex items-center">
                            <BarChart className="mr-2 h-4 w-4" />
                            Key Statistics
                          </h5>
                          <div className="grid gap-3">
                            {generatedCard.keyStats.map((stat: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                <div className="flex items-center space-x-3">
                                  <div className="text-2xl">{stat.icon || '📊'}</div>
                                  <div>
                                    <div className="font-medium text-sm">{stat.label}</div>
                                    {stat.context && (
                                      <div className="text-xs text-muted-foreground">{stat.context}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-lg text-primary">{stat.value}</span>
                                  {stat.trend && (
                                    <span className="text-sm">
                                      {stat.trend === 'up' ? '↗️' : stat.trend === 'down' ? '↘️' : '➡️'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h5 className="font-medium">Generated Formats</h5>
                        <div className="grid gap-2">
                          {generatedGraphics.map((graphic: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-2">
                                {getFormatIcon(graphic.format)}
                                <span className="text-sm">{getFormatLabel(graphic.format)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {graphic.dimensions.width}x{graphic.dimensions.height}
                                </Badge>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => downloadSVG(graphic)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {generatedCard.socialText && (
                        <div className="space-y-2">
                          <h5 className="font-medium">Social Media Text</h5>
                          <div className="space-y-3">
                            {Object.entries(generatedCard.socialText).map(([platform, text]: [string, any]) => (
                              <div key={platform} className="p-3 border rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    {getPlatformIcon(platform)}
                                    <span className="text-sm font-medium capitalize">{platform}</span>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => copyToClipboard(text, platform)}
                                  >
                                    {copiedText === platform ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">{text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Graphics Gallery</CardTitle>
                <CardDescription>
                  Manage and download your previously created graphics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Graphics Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first shareable graphic to see it here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}