import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

const MultimodalDemo = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sentiment');
  
  // Sentiment Analysis
  const [sentimentText, setSentimentText] = useState('');
  const [sentimentResult, setSentimentResult] = useState<any>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  
  // Image Analysis
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Image Generation
  const [genImagePrompt, setGenImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [genImageLoading, setGenImageLoading] = useState(false);
  
  // Document Analysis
  const [docText, setDocText] = useState('');
  const [docContext, setDocContext] = useState('');
  const [docAnalysisResult, setDocAnalysisResult] = useState<any>(null);
  const [docLoading, setDocLoading] = useState(false);
  
  // Political Bias Analysis
  const [biasText, setBiasText] = useState('');
  const [biasResult, setBiasResult] = useState<any>(null);
  const [biasLoading, setBiasLoading] = useState(false);

  // Sentiment Analysis Handler
  const analyzeSentiment = async () => {
    if (!sentimentText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSentimentLoading(true);
      const response = await fetch('/api/multimodal/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentimentText })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setSentimentResult(result.data);
      toast({
        title: "Success",
        description: "Sentiment analysis completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze sentiment",
        variant: "destructive"
      });
    } finally {
      setSentimentLoading(false);
    }
  };

  // Image Analysis Handler
  const analyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: "Error",
        description: "Please select an image to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setImageLoading(true);
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (imagePrompt) formData.append('prompt', imagePrompt);
      
      const response = await fetch('/api/multimodal/analyze-image', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setImageAnalysisResult(result.data.analysis);
      toast({
        title: "Success",
        description: "Image analysis completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze image",
        variant: "destructive"
      });
    } finally {
      setImageLoading(false);
    }
  };

  // Image Generation Handler
  const generateImage = async () => {
    if (!genImagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGenImageLoading(true);
      const response = await fetch('/api/multimodal/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: genImagePrompt })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setGeneratedImage(result.data.url);
      toast({
        title: "Success",
        description: "Image generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive"
      });
    } finally {
      setGenImageLoading(false);
    }
  };

  // Document Analysis Handler
  const analyzeDocument = async () => {
    if (!docText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setDocLoading(true);
      const response = await fetch('/api/multimodal/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: docText,
          context: docContext || undefined
        })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setDocAnalysisResult(result.data);
      toast({
        title: "Success",
        description: "Document analysis completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze document",
        variant: "destructive"
      });
    } finally {
      setDocLoading(false);
    }
  };

  // Political Bias Analysis Handler
  const analyzeBias = async () => {
    if (!biasText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setBiasLoading(true);
      const response = await fetch('/api/multimodal/political-bias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: biasText })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setBiasResult(result.data);
      toast({
        title: "Success",
        description: "Political bias analysis completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze political bias",
        variant: "destructive"
      });
    } finally {
      setBiasLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Multimodal AI Assistant</h1>
      <p className="text-lg mb-6">Explore the power of GPT-4o multimodal capabilities with these interactive demos.</p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-8">
          <TabsTrigger 
            value="sentiment" 
            className="flex-1 min-w-[130px] text-center px-2 whitespace-nowrap"
          >
            Sentiment Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="image-analysis" 
            className="flex-1 min-w-[130px] text-center px-2 whitespace-nowrap"
          >
            Image Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="image-gen" 
            className="flex-1 min-w-[130px] text-center px-2 whitespace-nowrap"
          >
            Image Generation
          </TabsTrigger>
          <TabsTrigger 
            value="document" 
            className="flex-1 min-w-[130px] text-center px-2 whitespace-nowrap"
          >
            Document Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="bias" 
            className="flex-1 min-w-[130px] text-center px-2 whitespace-nowrap"
          >
            Political Bias
          </TabsTrigger>
        </TabsList>
        
        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>
                Analyze the sentiment of any text to understand its emotional tone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sentiment-text">Text to analyze</Label>
                  <Textarea
                    id="sentiment-text"
                    placeholder="Enter text for sentiment analysis..."
                    value={sentimentText}
                    onChange={(e) => setSentimentText(e.target.value)}
                    rows={5}
                  />
                </div>
                
                {sentimentResult && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-semibold mb-2">Results:</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Rating:</span> {sentimentResult.rating}/5</p>
                      <p><span className="font-medium">Confidence:</span> {(sentimentResult.confidence * 100).toFixed(2)}%</p>
                      <p><span className="font-medium">Explanation:</span> {sentimentResult.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={analyzeSentiment} disabled={sentimentLoading}>
                {sentimentLoading ? "Analyzing..." : "Analyze Sentiment"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Image Analysis Tab */}
        <TabsContent value="image-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Image Analysis</CardTitle>
              <CardDescription>
                Upload an image and get an AI-powered description and analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-upload">Upload an image</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setSelectedImage(files[0]);
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image-prompt">Custom prompt (optional)</Label>
                  <Input
                    id="image-prompt"
                    placeholder="E.g., Describe what's happening in this image..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                  />
                </div>
                
                {selectedImage && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Selected image:</p>
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected image preview"
                      className="max-h-48 rounded-md object-contain"
                    />
                  </div>
                )}
                
                {imageAnalysisResult && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-semibold mb-2">Image Analysis:</h3>
                    <p className="whitespace-pre-line">{imageAnalysisResult}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={analyzeImage} disabled={imageLoading || !selectedImage}>
                {imageLoading ? "Analyzing..." : "Analyze Image"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Image Generation Tab */}
        <TabsContent value="image-gen">
          <Card>
            <CardHeader>
              <CardTitle>Image Generation</CardTitle>
              <CardDescription>
                Generate an image based on your text prompt using DALL-E.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-image-prompt">Image generation prompt</Label>
                  <Textarea
                    id="gen-image-prompt"
                    placeholder="E.g., A photorealistic image of a futuristic city with flying cars..."
                    value={genImagePrompt}
                    onChange={(e) => setGenImagePrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {generatedImage && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Generated image:</p>
                    <img
                      src={generatedImage}
                      alt="AI-generated image"
                      className="max-h-96 rounded-md object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={generateImage} disabled={genImageLoading}>
                {genImageLoading ? "Generating..." : "Generate Image"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Document Analysis Tab */}
        <TabsContent value="document">
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
              <CardDescription>
                Get key themes, summary, sentiment, and suggested actions from your document.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-text">Document text</Label>
                  <Textarea
                    id="doc-text"
                    placeholder="Paste document text here..."
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    rows={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doc-context">Context (optional)</Label>
                  <Input
                    id="doc-context"
                    placeholder="E.g., legislative bill, news article, research paper..."
                    value={docContext}
                    onChange={(e) => setDocContext(e.target.value)}
                  />
                </div>
                
                {docAnalysisResult && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-semibold mb-2">Document Analysis:</h3>
                    
                    <div className="mb-3">
                      <h4 className="font-medium">Key Themes:</h4>
                      <ul className="list-disc pl-5">
                        {docAnalysisResult.keyThemes.map((theme: string, i: number) => (
                          <li key={i}>{theme}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium">Summary:</h4>
                      <p>{docAnalysisResult.summary}</p>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium">Sentiment:</h4>
                      <p>
                        <span className="font-semibold">{docAnalysisResult.sentiment.rating}/5</span> - {docAnalysisResult.sentiment.description}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Suggested Actions:</h4>
                      <ul className="list-disc pl-5">
                        {docAnalysisResult.suggestedActions.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={analyzeDocument} disabled={docLoading}>
                {docLoading ? "Analyzing..." : "Analyze Document"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Political Bias Analysis Tab */}
        <TabsContent value="bias">
          <Card>
            <CardHeader>
              <CardTitle>Political Bias Analysis</CardTitle>
              <CardDescription>
                Analyze text for potential political bias and get detailed insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bias-text">Text to analyze</Label>
                  <Textarea
                    id="bias-text"
                    placeholder="Enter text to analyze for political bias..."
                    value={biasText}
                    onChange={(e) => setBiasText(e.target.value)}
                    rows={5}
                  />
                </div>
                
                {biasResult && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-semibold mb-2">Bias Analysis:</h3>
                    
                    <div className="mb-3 flex items-center">
                      <div className="w-full bg-muted rounded-full h-4 mr-2">
                        <div 
                          className={`h-full rounded-full ${
                            biasResult.biasScore < 0 ? 'bg-blue-500' : biasResult.biasScore > 0 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.abs(biasResult.biasScore) * 10}%`,
                            marginLeft: biasResult.biasScore < 0 ? 'auto' : '50%',
                            marginRight: biasResult.biasScore < 0 ? '50%' : 'auto',
                          }}
                        ></div>
                      </div>
                      <span className="font-bold">{biasResult.biasScore}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 text-center text-xs mb-3">
                      <span>Left-leaning</span>
                      <span>Neutral</span>
                      <span>Right-leaning</span>
                    </div>
                    
                    <div className="mb-3">
                      <p><span className="font-medium">Bias Level:</span> {biasResult.biasLevel}</p>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium">Explanation:</h4>
                      <p>{biasResult.explanation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Perspectives Omitted:</h4>
                      <ul className="list-disc pl-5">
                        {biasResult.perspectivesOmitted.map((perspective: string, i: number) => (
                          <li key={i}>{perspective}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={analyzeBias} disabled={biasLoading}>
                {biasLoading ? "Analyzing..." : "Analyze Political Bias"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultimodalDemo;