import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BadgeInfo, 
  FileText, 
  FileSearch, 
  Sparkles, 
  Upload, 
  Search,
  Split,
  BarChart2,
} from 'lucide-react';

export default function EnhancedAIPage() {
  const { toast } = useToast();
  
  // RAG query state
  const [ragQuery, setRagQuery] = useState('');
  const [ragResponse, setRagResponse] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  
  // Bill summary state
  const [billText, setBillText] = useState('');
  const [billId, setBillId] = useState('');
  const [billSummary, setBillSummary] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // Bill comparison state
  const [bill1Text, setBill1Text] = useState('');
  const [bill1Id, setBill1Id] = useState('');
  const [bill2Text, setBill2Text] = useState('');
  const [bill2Id, setBill2Id] = useState('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  // Legislative impact state
  const [impactBillText, setImpactBillText] = useState('');
  const [impactBillId, setImpactBillId] = useState('');
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Document ingestion state
  const [documents, setDocuments] = useState<{ id: string; text: string; metadata?: Record<string, any> }[]>([
    { id: '', text: '' }
  ]);
  const [isIngesting, setIsIngesting] = useState(false);
  
  // Handle RAG query submission
  const handleRagQuery = async () => {
    if (ragQuery.trim().length < 5) {
      toast({
        title: "Query too short",
        description: "Please enter a more detailed query",
        variant: "destructive"
      });
      return;
    }
    
    setIsQuerying(true);
    
    try {
      const response = await fetch('/api/enhanced-ai/rag-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process query');
      }
      
      const data = await response.json();
      setRagResponse(data);
      
      toast({
        title: "Query processed",
        description: "Successfully retrieved information",
      });
    } catch (error: any) {
      console.error('Error processing RAG query:', error);
      toast({
        title: "Query failed",
        description: error.message || "An error occurred processing your query",
        variant: "destructive"
      });
    } finally {
      setIsQuerying(false);
    }
  };
  
  // Handle bill summary generation
  const handleBillSummary = async () => {
    if (billText.trim().length < 50) {
      toast({
        title: "Bill text too short",
        description: "Please enter more comprehensive bill text",
        variant: "destructive"
      });
      return;
    }
    
    if (!billId.trim()) {
      toast({
        title: "Missing bill ID",
        description: "Please enter a bill identifier",
        variant: "destructive"
      });
      return;
    }
    
    setIsSummarizing(true);
    
    try {
      const response = await fetch('/api/enhanced-ai/structured-bill-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billText, billId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate summary');
      }
      
      const data = await response.json();
      setBillSummary(data);
      
      toast({
        title: "Summary generated",
        description: "Bill summary has been created successfully",
      });
    } catch (error: any) {
      console.error('Error generating bill summary:', error);
      toast({
        title: "Summary generation failed",
        description: error.message || "An error occurred generating the summary",
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
  };
  
  // Handle bill comparison
  const handleBillComparison = async () => {
    if (bill1Text.trim().length < 50 || bill2Text.trim().length < 50) {
      toast({
        title: "Bill text too short",
        description: "Please enter more comprehensive bill text for both bills",
        variant: "destructive"
      });
      return;
    }
    
    if (!bill1Id.trim() || !bill2Id.trim()) {
      toast({
        title: "Missing bill IDs",
        description: "Please enter identifiers for both bills",
        variant: "destructive"
      });
      return;
    }
    
    setIsComparing(true);
    
    try {
      const response = await fetch('/api/enhanced-ai/structured-bill-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bill1Text, 
          bill1Id, 
          bill2Text, 
          bill2Id 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to compare bills');
      }
      
      const data = await response.json();
      setComparisonResult(data);
      
      toast({
        title: "Comparison complete",
        description: "Bill comparison has been generated successfully",
      });
    } catch (error: any) {
      console.error('Error comparing bills:', error);
      toast({
        title: "Comparison failed",
        description: error.message || "An error occurred comparing the bills",
        variant: "destructive"
      });
    } finally {
      setIsComparing(false);
    }
  };
  
  // Handle legislative impact analysis
  const handleImpactAnalysis = async () => {
    if (impactBillText.trim().length < 50) {
      toast({
        title: "Bill text too short",
        description: "Please enter more comprehensive bill text",
        variant: "destructive"
      });
      return;
    }
    
    if (!impactBillId.trim()) {
      toast({
        title: "Missing bill ID",
        description: "Please enter a bill identifier",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/enhanced-ai/structured-legislative-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          billText: impactBillText, 
          billId: impactBillId 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze impact');
      }
      
      const data = await response.json();
      setImpactAnalysis(data);
      
      toast({
        title: "Impact analysis complete",
        description: "Legislative impact has been analyzed successfully",
      });
    } catch (error: any) {
      console.error('Error analyzing legislative impact:', error);
      toast({
        title: "Impact analysis failed",
        description: error.message || "An error occurred analyzing the impact",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle document field changes
  const handleDocumentChange = (index: number, field: 'id' | 'text', value: string) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index] = {
      ...updatedDocuments[index],
      [field]: value
    };
    setDocuments(updatedDocuments);
  };
  
  // Add new document field
  const addDocumentField = () => {
    setDocuments([...documents, { id: '', text: '' }]);
  };
  
  // Remove document field
  const removeDocumentField = (index: number) => {
    if (documents.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one document is required",
        variant: "destructive"
      });
      return;
    }
    
    const updatedDocuments = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocuments);
  };
  
  // Handle document ingestion
  const handleDocumentIngestion = async () => {
    // Validate documents
    const invalidDocuments = documents.filter(doc => !doc.id || doc.text.length < 10);
    if (invalidDocuments.length > 0) {
      toast({
        title: "Invalid documents",
        description: "All documents must have an ID and substantial text content",
        variant: "destructive"
      });
      return;
    }
    
    setIsIngesting(true);
    
    try {
      const response = await fetch('/api/enhanced-ai/add-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to ingest documents');
      }
      
      const data = await response.json();
      
      toast({
        title: "Documents ingested",
        description: `Successfully processed ${data.documentsProcessed} documents`,
      });
      
      // Reset form after successful ingestion
      setDocuments([{ id: '', text: '' }]);
    } catch (error: any) {
      console.error('Error ingesting documents:', error);
      toast({
        title: "Ingestion failed",
        description: error.message || "An error occurred ingesting documents",
        variant: "destructive"
      });
    } finally {
      setIsIngesting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Enhanced AI Capabilities</h1>
      <p className="text-muted-foreground mb-6">
        Explore our advanced AI features powered by RAG and function calling
      </p>
      
      <Tabs defaultValue="rag" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="rag" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>RAG Query</span>
          </TabsTrigger>
          <TabsTrigger value="ingest" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Add Documents</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            <span>Bill Summary</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Split className="h-4 w-4" />
            <span>Bill Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Legislative Impact</span>
          </TabsTrigger>
        </TabsList>
        
        {/* RAG Query Tab */}
        <TabsContent value="rag">
          <Card>
            <CardHeader>
              <CardTitle>Retrieval Augmented Generation (RAG)</CardTitle>
              <CardDescription>
                Ask questions about legislation with enhanced context from our document database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Query</label>
                  <Textarea
                    placeholder="e.g., What provisions does House Bill 1101 contain regarding water conservation?"
                    className="min-h-[100px]"
                    value={ragQuery}
                    onChange={e => setRagQuery(e.target.value)}
                  />
                </div>
                
                {ragResponse && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Response</h3>
                    <div className="bg-card p-4 rounded-md border">
                      <p className="whitespace-pre-wrap">{ragResponse.response}</p>
                    </div>
                    
                    {ragResponse.keyFindings && ragResponse.keyFindings.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium mb-2">Key Findings</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {ragResponse.keyFindings.map((finding: string, index: number) => (
                            <li key={index}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {ragResponse.sourceDocs && ragResponse.sourceDocs.length > 0 && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="sources">
                          <AccordionTrigger>
                            <span className="flex items-center gap-2">
                              <BadgeInfo className="h-4 w-4" />
                              Source Documents ({ragResponse.sourceDocs.length})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {ragResponse.sourceDocs.map((doc: any, index: number) => (
                                <div key={index} className="bg-muted p-3 rounded-md text-sm">
                                  <p className="font-medium mb-1">Document ID: {doc.id}</p>
                                  <p className="text-muted-foreground">Relevance Score: {doc.score?.toFixed(2) || 'N/A'}</p>
                                  {doc.title && <p className="mt-1">Title: {doc.title}</p>}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    
                    {ragResponse.confidenceLevel && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Confidence Level:</span>
                        <span className={`font-medium ${
                          ragResponse.confidenceLevel === 'high' ? 'text-green-500' :
                          ragResponse.confidenceLevel === 'medium' ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {ragResponse.confidenceLevel.charAt(0).toUpperCase() + ragResponse.confidenceLevel.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleRagQuery} 
                disabled={isQuerying || ragQuery.trim().length < 5}
                className="gap-2"
              >
                {isQuerying ? 'Processing...' : 'Submit Query'} 
                {!isQuerying && <Search className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Document Ingestion Tab */}
        <TabsContent value="ingest">
          <Card>
            <CardHeader>
              <CardTitle>Add Documents to Knowledge Base</CardTitle>
              <CardDescription>
                Ingest legislative documents to enhance AI response capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((document, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium">Document {index + 1}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeDocumentField(index)}
                        disabled={documents.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Document ID</label>
                      <Input
                        placeholder="e.g., HB1101-2025"
                        value={document.id}
                        onChange={e => handleDocumentChange(index, 'id', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Document Text</label>
                      <Textarea
                        placeholder="Paste the full text of the document here..."
                        className="min-h-[150px]"
                        value={document.text}
                        onChange={e => handleDocumentChange(index, 'text', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={addDocumentField}
                  className="w-full"
                >
                  Add Another Document
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleDocumentIngestion} 
                disabled={isIngesting || documents.some(doc => !doc.id || doc.text.length < 10)}
                className="gap-2"
              >
                {isIngesting ? 'Processing...' : 'Ingest Documents'} 
                {!isIngesting && <Upload className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Bill Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Structured Bill Summary</CardTitle>
              <CardDescription>
                Generate a comprehensive structured summary of a bill
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Bill ID</label>
                  <Input
                    placeholder="e.g., HB 1101"
                    value={billId}
                    onChange={e => setBillId(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Bill Text</label>
                  <Textarea
                    placeholder="Paste the full text of the bill here..."
                    className="min-h-[200px]"
                    value={billText}
                    onChange={e => setBillText(e.target.value)}
                  />
                </div>
                
                {billSummary && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Summary for {billSummary.billId}</h3>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Executive Summary</h4>
                      <div className="bg-card p-4 rounded-md border">
                        <p className="whitespace-pre-wrap">{billSummary.executiveSummary}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Key Points</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {billSummary.keyPoints.map((point: string, index: number) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Impact Analysis</h4>
                      <div className="bg-card p-4 rounded-md border">
                        <p className="whitespace-pre-wrap">{billSummary.impactAnalysis}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Legal Implications</h4>
                      <div className="bg-card p-4 rounded-md border">
                        <p className="whitespace-pre-wrap">{billSummary.legalImplications}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Stakeholder Analysis</h4>
                      <div className="bg-card p-4 rounded-md border space-y-2">
                        <div>
                          <p className="font-semibold">Supporters:</p>
                          <ul className="list-disc pl-5">
                            {billSummary.stakeholderAnalysis.supporters.map((supporter: string, index: number) => (
                              <li key={index}>{supporter}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-semibold">Opponents:</p>
                          <ul className="list-disc pl-5">
                            {billSummary.stakeholderAnalysis.opponents.map((opponent: string, index: number) => (
                              <li key={index}>{opponent}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {billSummary.stakeholderAnalysis.neutral && billSummary.stakeholderAnalysis.neutral.length > 0 && (
                          <div>
                            <p className="font-semibold">Neutral Parties:</p>
                            <ul className="list-disc pl-5">
                              {billSummary.stakeholderAnalysis.neutral.map((party: string, index: number) => (
                                <li key={index}>{party}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleBillSummary} 
                disabled={isSummarizing || billText.trim().length < 50 || !billId.trim()}
                className="gap-2"
              >
                {isSummarizing ? 'Processing...' : 'Generate Summary'} 
                {!isSummarizing && <FileSearch className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Bill Comparison Tab */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Structured Bill Comparison</CardTitle>
              <CardDescription>
                Compare two bills and analyze their similarities and differences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">First Bill</h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill ID</label>
                      <Input
                        placeholder="e.g., HB 1101"
                        value={bill1Id}
                        onChange={e => setBill1Id(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill Text</label>
                      <Textarea
                        placeholder="Paste the full text of the first bill here..."
                        className="min-h-[200px]"
                        value={bill1Text}
                        onChange={e => setBill1Text(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Second Bill</h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill ID</label>
                      <Input
                        placeholder="e.g., SB 2023"
                        value={bill2Id}
                        onChange={e => setBill2Id(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill Text</label>
                      <Textarea
                        placeholder="Paste the full text of the second bill here..."
                        className="min-h-[200px]"
                        value={bill2Text}
                        onChange={e => setBill2Text(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {comparisonResult && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Comparison Results</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-md font-medium mb-2">Similarities</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {comparisonResult.similarities.map((similarity: string, index: number) => (
                            <li key={index}>{similarity}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium mb-2">Differences</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {comparisonResult.differences.map((difference: string, index: number) => (
                            <li key={index}>{difference}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Alignment Score</h4>
                      <div className="bg-card p-4 rounded-md border">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold">{comparisonResult.alignmentScore}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${comparisonResult.alignmentScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Key Issues Addressed</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {comparisonResult.keyIssues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Recommendation</h4>
                      <div className="bg-card p-4 rounded-md border">
                        <p className="whitespace-pre-wrap">{comparisonResult.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleBillComparison} 
                disabled={
                  isComparing || 
                  bill1Text.trim().length < 50 || 
                  bill2Text.trim().length < 50 ||
                  !bill1Id.trim() ||
                  !bill2Id.trim()
                }
                className="gap-2"
              >
                {isComparing ? 'Processing...' : 'Compare Bills'} 
                {!isComparing && <Split className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Legislative Impact Tab */}
        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle>Legislative Impact Analysis</CardTitle>
              <CardDescription>
                Analyze the potential impact of legislation on various constituencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Bill ID</label>
                  <Input
                    placeholder="e.g., HB 1101"
                    value={impactBillId}
                    onChange={e => setImpactBillId(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Bill Text</label>
                  <Textarea
                    placeholder="Paste the full text of the bill here..."
                    className="min-h-[200px]"
                    value={impactBillText}
                    onChange={e => setImpactBillText(e.target.value)}
                  />
                </div>
                
                {impactAnalysis && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Impact Analysis for {impactAnalysis.billId}</h3>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Economic Impact</h4>
                      <div className="bg-card p-4 rounded-md border">
                        <p className="whitespace-pre-wrap">{impactAnalysis.economicImpact}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Social Impact</h4>
                      <div className="bg-card p-4 rounded-md border">
                        <p className="whitespace-pre-wrap">{impactAnalysis.socialImpact}</p>
                      </div>
                    </div>
                    
                    {impactAnalysis.environmentalImpact && (
                      <div>
                        <h4 className="text-md font-medium mb-2">Environmental Impact</h4>
                        <div className="bg-card p-4 rounded-md border">
                          <p className="whitespace-pre-wrap">{impactAnalysis.environmentalImpact}</p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Implementation Challenges</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {impactAnalysis.implementationChallenges.map((challenge: string, index: number) => (
                          <li key={index}>{challenge}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Affected Constituencies</h4>
                      <div className="space-y-3">
                        {impactAnalysis.constituencies.map((constituency: any, index: number) => (
                          <div key={index} className="bg-card p-4 rounded-md border">
                            <h5 className="font-medium text-md">{constituency.group}</h5>
                            <p className="mt-1">{constituency.impact}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs">Impact Severity:</span>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                constituency.severity === 'High' ? 'bg-red-100 text-red-800' :
                                constituency.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {constituency.severity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleImpactAnalysis} 
                disabled={isAnalyzing || impactBillText.trim().length < 50 || !impactBillId.trim()}
                className="gap-2"
              >
                {isAnalyzing ? 'Processing...' : 'Analyze Impact'} 
                {!isAnalyzing && <BarChart2 className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}