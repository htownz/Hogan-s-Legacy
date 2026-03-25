import { useState, useRef } from "react";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, Image, FileText, BarChart, PresentationIcon, AlertTriangle } from "lucide-react";
import { Navigation } from "../components/shared/navigation";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function MultimodalAnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>("general");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [extractedText, setExtractedText] = useState<string>("");
  const [contextInfo, setContextInfo] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Add context info if provided
      if (contextInfo) {
        formData.append('context', JSON.stringify({ userContext: contextInfo }));
      }
      
      // Add analysis type
      formData.append('analysisType', analysisType);
      
      // Send to appropriate endpoint based on analysis type
      let endpoint = '/api/multimodal/analyze-image';
      if (analysisType === 'chart') {
        endpoint = '/api/multimodal/analyze-chart';
      } else if (analysisType === 'testimony') {
        endpoint = '/api/multimodal/analyze-testimony';
      }
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setResult(response.data.data);
        toast({
          title: "Analysis complete",
          description: "The image has been successfully analyzed.",
        });
      } else {
        throw new Error(response.data.error || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlAnalysis = async () => {
    if (!imageUrl) {
      toast({
        title: "No URL provided",
        description: "Please enter an image URL to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare context if provided
      const context = contextInfo ? { userContext: contextInfo } : {};
      
      // Send to appropriate endpoint
      let endpoint = '/api/multimodal/analyze-image-url';
      
      const response = await axios.post(endpoint, {
        imageUrl,
        context,
        analysisType
      });
      
      if (response.data.success) {
        setResult(response.data.data);
        toast({
          title: "Analysis complete",
          description: "The image has been successfully analyzed.",
        });
      } else {
        throw new Error(response.data.error || 'Failed to analyze image URL');
      }
    } catch (error) {
      console.error('Error analyzing image URL:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractText = async () => {
    if (activeTab === 'upload' && fileInputRef.current?.files?.length === 0) {
      toast({
        title: "No file selected",
        description: "Please select an image file to extract text from.",
        variant: "destructive"
      });
      return;
    }
    
    if (activeTab === 'url' && !imageUrl) {
      toast({
        title: "No URL provided",
        description: "Please enter an image URL to extract text from.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let response;
      
      if (activeTab === 'upload' && fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append('image', fileInputRef.current.files[0]);
        
        response = await axios.post('/api/multimodal/extract-text', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axios.post('/api/multimodal/extract-text-url', {
          imageUrl
        });
      }
      
      if (response.data.success) {
        setExtractedText(response.data.data.text);
        toast({
          title: "Text extraction complete",
          description: "Text has been successfully extracted from the image.",
        });
      } else {
        throw new Error(response.data.error || 'Failed to extract text');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Text extraction failed",
        description: error instanceof Error ? error.message : "An error occurred during text extraction.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisTypeChange = (value: string) => {
    setAnalysisType(value);
    // Reset results when changing analysis type
    setResult(null);
  };

  const renderAnalysisResults = () => {
    if (!result) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            {result.visualType && `Detected content type: ${result.visualType}`}
            {result.confidence && ` (Confidence: ${result.confidence})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.summary && (
              <div>
                <h3 className="text-lg font-semibold">Summary</h3>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </div>
            )}
            
            {result.billReferences && result.billReferences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Bill References</h3>
                <ul className="list-disc pl-5">
                  {result.billReferences.map((bill: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{bill.billNumber}</span>: {bill.context}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.committeeReferences && result.committeeReferences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Committee References</h3>
                <ul className="list-disc pl-5">
                  {result.committeeReferences.map((committee: string, index: number) => (
                    <li key={index} className="text-sm">{committee}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.dataPoints && result.dataPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Key Data Points</h3>
                <ul className="list-disc pl-5">
                  {result.dataPoints.map((dataPoint: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{dataPoint.metric}</span>: {dataPoint.value} 
                      {dataPoint.context && <span className="text-muted-foreground"> ({dataPoint.context})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.speakers && result.speakers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Speakers</h3>
                <ul className="list-disc pl-5">
                  {result.speakers.map((speaker: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{speaker.name}</span>
                      {speaker.role && <span className="text-muted-foreground"> ({speaker.role})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6 space-y-6">
        <div className="grid gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Multimodal Analysis</h1>
            <p className="text-muted-foreground">
              Analyze visual content from legislative hearings, committee meetings, and supporting documents.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Visual Content Analysis</CardTitle>
              <CardDescription>
                Upload images or provide URLs to extract legislative information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="image">Upload Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      className="mt-2"
                      onClick={handleUrlAnalysis}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Image className="mr-2 h-4 w-4" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              <Separator className="my-4" />
              
              <div className="grid gap-4">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="analysisType">Analysis Type</Label>
                  <Select value={analysisType} onValueChange={handleAnalysisTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>General Legislative Analysis</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="detailed">
                        <div className="flex items-center">
                          <PresentationIcon className="mr-2 h-4 w-4" />
                          <span>Detailed Legislative Analysis</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="chart">
                        <div className="flex items-center">
                          <BarChart className="mr-2 h-4 w-4" />
                          <span>Chart/Graph Analysis</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="testimony">
                        <div className="flex items-center">
                          <Image className="mr-2 h-4 w-4" />
                          <span>Testimony Analysis</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="contextInfo">Additional Context (Optional)</Label>
                  <Textarea
                    id="contextInfo"
                    placeholder="Provide additional context about the image, e.g., bill number, committee name, hearing date, etc."
                    value={contextInfo}
                    onChange={(e) => setContextInfo(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  variant="secondary" 
                  className="mt-2" 
                  onClick={handleExtractText}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Extract Text Only
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-muted-foreground">
                <AlertTriangle className="inline-block mr-1 h-3 w-3" />
                Images are analyzed using AI. Results may not always be accurate.
              </div>
            </CardFooter>
          </Card>
          
          {renderAnalysisResults()}
          
          {extractedText && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Text</CardTitle>
                <CardDescription>
                  Text content extracted from the image using OCR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-[200px]"
                  value={extractedText}
                  readOnly
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}