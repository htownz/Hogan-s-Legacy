import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  FileSearch, 
  Upload, 
  Split,
  BarChart2,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Layers
} from 'lucide-react';

// Interfaces for batch operation types
interface BillItem {
  billId: string;
  billText: string;
}

interface BillComparison {
  bill1Id: string;
  bill1Text: string;
  bill2Id: string;
  bill2Text: string;
}

interface DocumentItem {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

interface BatchOperationStatus {
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  total: number;
  progressPercentage: number;
  resultCount: number;
  errorCount: number;
  startTime: string;
  endTime?: string;
  elapsedSeconds: number;
}

export default function BatchProcessingPage() {
  const { toast } = useToast();
  
  // Bill summaries state
  const [billSummaries, setBillSummaries] = useState<BillItem[]>([
    { billId: '', billText: '' }
  ]);
  
  // Bill comparisons state
  const [billComparisons, setBillComparisons] = useState<BillComparison[]>([
    { bill1Id: '', bill1Text: '', bill2Id: '', bill2Text: '' }
  ]);
  
  // Legislative impacts state
  const [legislativeImpacts, setLegislativeImpacts] = useState<BillItem[]>([
    { billId: '', billText: '' }
  ]);
  
  // Document ingestion state
  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: '', text: '' }
  ]);
  
  // Active batch operations
  const [activeBatchOperations, setActiveBatchOperations] = useState<Record<string, {
    type: 'summaries' | 'comparisons' | 'impacts' | 'documents';
    status: BatchOperationStatus | null;
    results: any[] | null;
    errors: any[] | null;
  }>>({});
  
  // State for interval ID to clear on unmount
  const [statusInterval, setStatusInterval] = useState<number | null>(null);
  
  // Cleanup status polling on unmount
  useEffect(() => {
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [statusInterval]);
  
  // Poll for batch operation status updates
  const startStatusPolling = (batchId: string, operationType: 'summaries' | 'comparisons' | 'impacts' | 'documents') => {
    // Update state with new batch operation
    setActiveBatchOperations(prev => ({
      ...prev,
      [batchId]: {
        type: operationType,
        status: null,
        results: null,
        errors: null
      }
    }));
    
    // Set up polling interval
    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/batch/status/${batchId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Error fetching status for batch ${batchId}:`, errorData);
          return;
        }
        
        const statusData = await response.json();
        
        // Update batch operation status
        setActiveBatchOperations(prev => ({
          ...prev,
          [batchId]: {
            ...prev[batchId],
            status: statusData
          }
        }));
        
        // If operation is completed, fetch results and clear interval
        if (statusData.status === 'completed') {
          clearInterval(intervalId);
          
          // Fetch results
          const resultsResponse = await fetch(`/api/batch/results/${batchId}`);
          
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            
            setActiveBatchOperations(prev => ({
              ...prev,
              [batchId]: {
                ...prev[batchId],
                results: resultsData.results,
                errors: resultsData.errors
              }
            }));
            
            // Notify user
            toast({
              title: "Batch processing complete",
              description: `Successfully processed ${resultsData.results.length} items with ${resultsData.errors.length} errors`,
            });
          }
        }
      } catch (error) {
        console.error(`Error polling status for batch ${batchId}:`, error);
      }
    }, 3000); // Poll every 3 seconds
    
    // Save interval ID for cleanup
    setStatusInterval(intervalId);
    
    return intervalId;
  };
  
  // Handle adding bill summary
  const addBillSummary = () => {
    setBillSummaries([...billSummaries, { billId: '', billText: '' }]);
  };
  
  // Handle removing bill summary
  const removeBillSummary = (index: number) => {
    if (billSummaries.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one bill is required",
        variant: "destructive"
      });
      return;
    }
    
    setBillSummaries(billSummaries.filter((_, i) => i !== index));
  };
  
  // Handle bill summary field change
  const handleBillSummaryChange = (index: number, field: 'billId' | 'billText', value: string) => {
    const updatedSummaries = [...billSummaries];
    updatedSummaries[index] = {
      ...updatedSummaries[index],
      [field]: value
    };
    setBillSummaries(updatedSummaries);
  };
  
  // Handle adding bill comparison
  const addBillComparison = () => {
    setBillComparisons([...billComparisons, { bill1Id: '', bill1Text: '', bill2Id: '', bill2Text: '' }]);
  };
  
  // Handle removing bill comparison
  const removeBillComparison = (index: number) => {
    if (billComparisons.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one comparison is required",
        variant: "destructive"
      });
      return;
    }
    
    setBillComparisons(billComparisons.filter((_, i) => i !== index));
  };
  
  // Handle bill comparison field change
  const handleBillComparisonChange = (
    index: number, 
    field: 'bill1Id' | 'bill1Text' | 'bill2Id' | 'bill2Text', 
    value: string
  ) => {
    const updatedComparisons = [...billComparisons];
    updatedComparisons[index] = {
      ...updatedComparisons[index],
      [field]: value
    };
    setBillComparisons(updatedComparisons);
  };
  
  // Handle adding legislative impact
  const addLegislativeImpact = () => {
    setLegislativeImpacts([...legislativeImpacts, { billId: '', billText: '' }]);
  };
  
  // Handle removing legislative impact
  const removeLegislativeImpact = (index: number) => {
    if (legislativeImpacts.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one bill is required",
        variant: "destructive"
      });
      return;
    }
    
    setLegislativeImpacts(legislativeImpacts.filter((_, i) => i !== index));
  };
  
  // Handle legislative impact field change
  const handleLegislativeImpactChange = (index: number, field: 'billId' | 'billText', value: string) => {
    const updatedImpacts = [...legislativeImpacts];
    updatedImpacts[index] = {
      ...updatedImpacts[index],
      [field]: value
    };
    setLegislativeImpacts(updatedImpacts);
  };
  
  // Handle adding document
  const addDocument = () => {
    setDocuments([...documents, { id: '', text: '' }]);
  };
  
  // Handle removing document
  const removeDocument = (index: number) => {
    if (documents.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one document is required",
        variant: "destructive"
      });
      return;
    }
    
    setDocuments(documents.filter((_, i) => i !== index));
  };
  
  // Handle document field change
  const handleDocumentChange = (index: number, field: 'id' | 'text', value: string) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index] = {
      ...updatedDocuments[index],
      [field]: value
    };
    setDocuments(updatedDocuments);
  };
  
  // Process batch bill summaries
  const processBatchBillSummaries = async () => {
    // Validate bill summaries
    const invalidBills = billSummaries.filter(bill => !bill.billId || bill.billText.length < 50);
    if (invalidBills.length > 0) {
      toast({
        title: "Invalid bills",
        description: "All bills must have an ID and substantial text content",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Submit batch request
      const response = await fetch('/api/batch/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bills: billSummaries })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start batch processing');
      }
      
      const data = await response.json();
      
      toast({
        title: "Batch processing started",
        description: `Processing ${billSummaries.length} bill summaries`,
      });
      
      // Start polling for status updates
      startStatusPolling(data.operationId, 'summaries');
      
      // Reset form
      setBillSummaries([{ billId: '', billText: '' }]);
    } catch (error: any) {
      console.error('Error starting batch bill summaries:', error);
      toast({
        title: "Failed to start batch processing",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Process batch bill comparisons
  const processBatchBillComparisons = async () => {
    // Validate bill comparisons
    const invalidComparisons = billComparisons.filter(
      comp => !comp.bill1Id || comp.bill1Text.length < 50 || !comp.bill2Id || comp.bill2Text.length < 50
    );
    if (invalidComparisons.length > 0) {
      toast({
        title: "Invalid comparisons",
        description: "All comparisons must have IDs and substantial text content for both bills",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Submit batch request
      const response = await fetch('/api/batch/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comparisons: billComparisons })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start batch processing');
      }
      
      const data = await response.json();
      
      toast({
        title: "Batch processing started",
        description: `Processing ${billComparisons.length} bill comparisons`,
      });
      
      // Start polling for status updates
      startStatusPolling(data.operationId, 'comparisons');
      
      // Reset form
      setBillComparisons([{ bill1Id: '', bill1Text: '', bill2Id: '', bill2Text: '' }]);
    } catch (error: any) {
      console.error('Error starting batch bill comparisons:', error);
      toast({
        title: "Failed to start batch processing",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Process batch legislative impacts
  const processBatchLegislativeImpacts = async () => {
    // Validate legislative impacts
    const invalidImpacts = legislativeImpacts.filter(impact => !impact.billId || impact.billText.length < 50);
    if (invalidImpacts.length > 0) {
      toast({
        title: "Invalid bills",
        description: "All bills must have an ID and substantial text content",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Submit batch request
      const response = await fetch('/api/batch/impacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bills: legislativeImpacts })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start batch processing');
      }
      
      const data = await response.json();
      
      toast({
        title: "Batch processing started",
        description: `Processing ${legislativeImpacts.length} legislative impact analyses`,
      });
      
      // Start polling for status updates
      startStatusPolling(data.operationId, 'impacts');
      
      // Reset form
      setLegislativeImpacts([{ billId: '', billText: '' }]);
    } catch (error: any) {
      console.error('Error starting batch legislative impacts:', error);
      toast({
        title: "Failed to start batch processing",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Process batch document ingestion
  const processBatchDocumentIngestion = async () => {
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
    
    try {
      // Submit batch request
      const response = await fetch('/api/batch/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start batch processing');
      }
      
      const data = await response.json();
      
      toast({
        title: "Batch processing started",
        description: `Processing ${documents.length} documents`,
      });
      
      // Start polling for status updates
      startStatusPolling(data.operationId, 'documents');
      
      // Reset form
      setDocuments([{ id: '', text: '' }]);
    } catch (error: any) {
      console.error('Error starting batch document ingestion:', error);
      toast({
        title: "Failed to start batch processing",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Refresh batch operation status
  const refreshBatchStatus = async (batchId: string) => {
    try {
      const response = await fetch(`/api/batch/status/${batchId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh status');
      }
      
      const statusData = await response.json();
      
      // Update batch operation status
      setActiveBatchOperations(prev => ({
        ...prev,
        [batchId]: {
          ...prev[batchId],
          status: statusData
        }
      }));
      
      // If operation is completed, fetch results
      if (statusData.status === 'completed') {
        const resultsResponse = await fetch(`/api/batch/results/${batchId}`);
        
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          
          setActiveBatchOperations(prev => ({
            ...prev,
            [batchId]: {
              ...prev[batchId],
              results: resultsData.results,
              errors: resultsData.errors
            }
          }));
        }
      }
    } catch (error: any) {
      console.error(`Error refreshing batch status for ${batchId}:`, error);
      toast({
        title: "Failed to refresh status",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} min ${remainingSeconds} sec`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hr ${minutes} min`;
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Batch Processing</h1>
      <p className="text-muted-foreground mb-6">
        Process multiple bills and documents in parallel for increased efficiency
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <span>Active Batch Operations</span>
            </CardTitle>
            <CardDescription>
              Monitor progress of parallel processing operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(activeBatchOperations).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No active batch operations</p>
                <p className="text-sm">Start a batch process to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(activeBatchOperations).map(([batchId, operation]) => (
                  <div key={batchId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {operation.type === 'summaries' ? 'Bill Summaries' : 
                           operation.type === 'comparisons' ? 'Bill Comparisons' :
                           operation.type === 'impacts' ? 'Legislative Impacts' : 'Document Ingestion'}
                        </h3>
                        <Badge variant={
                          !operation.status ? 'outline' :
                          operation.status.status === 'completed' ? 'success' :
                          operation.status.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {!operation.status ? 'Initializing' :
                           operation.status.status === 'in_progress' ? 'In Progress' :
                           operation.status.status === 'completed' ? 'Completed' : 'Failed'}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => refreshBatchStatus(batchId)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {operation.status && (
                      <>
                        <Progress 
                          value={operation.status.progressPercentage} 
                          className="h-2 mb-2" 
                        />
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Progress:</span>{' '}
                            <span className="font-medium">
                              {operation.status.progress} / {operation.status.total}
                              {' '}({operation.status.progressPercentage}%)
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Results:</span>{' '}
                            <span className="font-medium">
                              <span className="text-green-500">{operation.status.resultCount}</span>
                              {' / '}
                              <span className="text-red-500">{operation.status.errorCount}</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Elapsed:</span>{' '}
                            <span className="font-medium">{formatElapsedTime(operation.status.elapsedSeconds)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Started:</span>{' '}
                            <span className="font-medium">
                              {new Date(operation.status.startTime).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {operation.results && operation.errors && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{operation.results.length} items processed successfully</span>
                        </div>
                        
                        {operation.errors.length > 0 && (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span>{operation.errors.length} items failed processing</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Alert className="h-auto">
          <Clock className="h-4 w-4" />
          <AlertTitle>Parallel Processing</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Batch processing allows you to analyze multiple bills or ingest multiple documents in parallel, 
              efficiently utilizing available system resources.
            </p>
            <p className="mb-2">
              The system automatically manages concurrency based on available CPU cores to maximize throughput
              while preventing overload.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Bill summaries can process up to 100 bills at once</li>
              <li>Bill comparisons can handle up to 50 comparison pairs</li>
              <li>Legislative impact analyses run in parallel for each bill</li>
              <li>Document ingestion processes chunks of documents in parallel</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
      
      <Tabs defaultValue="summaries" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summaries" className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            <span>Bill Summaries</span>
          </TabsTrigger>
          <TabsTrigger value="comparisons" className="flex items-center gap-2">
            <Split className="h-4 w-4" />
            <span>Bill Comparisons</span>
          </TabsTrigger>
          <TabsTrigger value="impacts" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Legislative Impacts</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Document Ingestion</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Bill Summaries Tab */}
        <TabsContent value="summaries">
          <Card>
            <CardHeader>
              <CardTitle>Batch Process Bill Summaries</CardTitle>
              <CardDescription>
                Generate structured summaries for multiple bills in parallel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {billSummaries.map((bill, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium">Bill {index + 1}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeBillSummary(index)}
                        disabled={billSummaries.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill ID</label>
                      <Input
                        placeholder="e.g., HB 1101"
                        value={bill.billId}
                        onChange={e => handleBillSummaryChange(index, 'billId', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill Text</label>
                      <Textarea
                        placeholder="Paste the full text of the bill here..."
                        className="min-h-[150px]"
                        value={bill.billText}
                        onChange={e => handleBillSummaryChange(index, 'billText', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={addBillSummary}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Bill
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={processBatchBillSummaries} 
                disabled={billSummaries.some(bill => !bill.billId || bill.billText.length < 50)}
                className="gap-2"
              >
                Process {billSummaries.length} Bill{billSummaries.length !== 1 ? 's' : ''}
                <FileSearch className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Bill Comparisons Tab */}
        <TabsContent value="comparisons">
          <Card>
            <CardHeader>
              <CardTitle>Batch Process Bill Comparisons</CardTitle>
              <CardDescription>
                Compare multiple pairs of bills in parallel to identify similarities and differences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {billComparisons.map((comparison, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium">Comparison {index + 1}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeBillComparison(index)}
                        disabled={billComparisons.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">First Bill</h4>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Bill ID</label>
                        <Input
                          placeholder="e.g., HB 1101"
                          value={comparison.bill1Id}
                          onChange={e => handleBillComparisonChange(index, 'bill1Id', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Bill Text</label>
                        <Textarea
                          placeholder="Paste the full text of the first bill here..."
                          className="min-h-[100px]"
                          value={comparison.bill1Text}
                          onChange={e => handleBillComparisonChange(index, 'bill1Text', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Second Bill</h4>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Bill ID</label>
                        <Input
                          placeholder="e.g., SB 2023"
                          value={comparison.bill2Id}
                          onChange={e => handleBillComparisonChange(index, 'bill2Id', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Bill Text</label>
                        <Textarea
                          placeholder="Paste the full text of the second bill here..."
                          className="min-h-[100px]"
                          value={comparison.bill2Text}
                          onChange={e => handleBillComparisonChange(index, 'bill2Text', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={addBillComparison}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Comparison
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={processBatchBillComparisons} 
                disabled={billComparisons.some(
                  comp => !comp.bill1Id || comp.bill1Text.length < 50 || !comp.bill2Id || comp.bill2Text.length < 50
                )}
                className="gap-2"
              >
                Process {billComparisons.length} Comparison{billComparisons.length !== 1 ? 's' : ''}
                <Split className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Legislative Impacts Tab */}
        <TabsContent value="impacts">
          <Card>
            <CardHeader>
              <CardTitle>Batch Process Legislative Impacts</CardTitle>
              <CardDescription>
                Analyze the potential impact of multiple bills in parallel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {legislativeImpacts.map((impact, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium">Bill {index + 1}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeLegislativeImpact(index)}
                        disabled={legislativeImpacts.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill ID</label>
                      <Input
                        placeholder="e.g., HB 1101"
                        value={impact.billId}
                        onChange={e => handleLegislativeImpactChange(index, 'billId', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bill Text</label>
                      <Textarea
                        placeholder="Paste the full text of the bill here..."
                        className="min-h-[150px]"
                        value={impact.billText}
                        onChange={e => handleLegislativeImpactChange(index, 'billText', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={addLegislativeImpact}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Bill
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={processBatchLegislativeImpacts} 
                disabled={legislativeImpacts.some(impact => !impact.billId || impact.billText.length < 50)}
                className="gap-2"
              >
                Process {legislativeImpacts.length} Impact{legislativeImpacts.length !== 1 ? 's' : ''}
                <BarChart2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Document Ingestion Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Batch Process Document Ingestion</CardTitle>
              <CardDescription>
                Ingest multiple documents into the knowledge base in parallel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {documents.map((document, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium">Document {index + 1}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeDocument(index)}
                        disabled={documents.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
                  onClick={addDocument}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Document
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={processBatchDocumentIngestion} 
                disabled={documents.some(doc => !doc.id || doc.text.length < 10)}
                className="gap-2"
              >
                Process {documents.length} Document{documents.length !== 1 ? 's' : ''}
                <Upload className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}