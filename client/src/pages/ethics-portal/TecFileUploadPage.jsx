import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUp, Download, Trash2, RefreshCcw, Info, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import TecUpload from '../../components/tec/TecUpload.jsx';

const TecFileUploadPage = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshCount, setRefreshCount] = useState(0);

  // Fetch upload history
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tec/uploads');
        const data = await response.json();
        
        if (data.success) {
          setUploads(data.uploads || []);
        }
      } catch (error) {
        console.error('Error fetching upload history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, [refreshCount]);

  // Handle file deletion
  const handleDeleteFile = async (filename) => {
    try {
      const response = await fetch(`/api/tec/uploads/${filename}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted file from the state
        setUploads(uploads.filter(upload => upload.filename !== filename));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Handle download
  const handleDownload = (filename) => {
    window.open(`/api/tec/uploads/${filename}`, '_blank');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'completed':
        return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'processing':
        return <Badge variant="default" className="gap-1"><Clock className="w-3 h-3" /> Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Info className="w-3 h-3" /> {status}</Badge>;
    }
  };

  // Handle upload completion
  const handleUploadComplete = (result) => {
    // Update upload history and switch to history tab
    setRefreshCount(prev => prev + 1);
    setActiveTab('history');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Texas Ethics Commission Data Portal</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileUp className="h-5 w-5" />
              TEC Data Management
            </CardTitle>
            <CardDescription>
              Upload, process, and manage Texas Ethics Commission data files for campaign finance and lobbying transparency
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="upload">File Upload</TabsTrigger>
                <TabsTrigger value="history">Upload History</TabsTrigger>
                <TabsTrigger value="help">Help & Guide</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <TecUpload onUploadComplete={handleUploadComplete} />
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Upload History</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setRefreshCount(prev => prev + 1)}
                        className="gap-1"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                    <CardDescription>
                      View and manage your previously uploaded TEC files
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin">
                            <RefreshCcw className="h-8 w-8 text-primary/70" />
                          </div>
                          <p className="text-sm text-muted-foreground">Loading upload history...</p>
                        </div>
                      </div>
                    ) : uploads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <FileUp className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No uploads found</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          You haven't uploaded any TEC files yet. Go to the File Upload tab to upload your first file.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setActiveTab('upload')}
                        >
                          Upload a file
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Filename</TableHead>
                              <TableHead>Upload Date</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploads.map((upload) => (
                              <TableRow key={upload.filename}>
                                <TableCell className="font-medium">{upload.originalName}</TableCell>
                                <TableCell>{formatDate(upload.uploadedAt)}</TableCell>
                                <TableCell>{formatFileSize(upload.size)}</TableCell>
                                <TableCell>
                                  <StatusBadge status={upload.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDownload(upload.filename)}
                                      title="Download file"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDeleteFile(upload.filename)}
                                      title="Delete file"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="help">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Help & Usage Guide</CardTitle>
                    <CardDescription>
                      Learn how to prepare, upload, and process TEC data files
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-base font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Preparing Your Files
                      </h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Download campaign finance reports or lobbyist registrations from the TEC website in CSV format</li>
                        <li>Make sure the file headers are intact and the data is properly formatted</li>
                        <li>For large files, consider splitting them into smaller batches (under 20MB each)</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-base font-medium flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        Supported File Types
                      </h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li><strong>Campaign Expenditure Reports</strong> - Files containing FILER_NAME and EXPENDITURE_AMOUNT fields</li>
                        <li><strong>Campaign Contribution Reports</strong> - Files containing FILER_NAME and CONTRIBUTION_AMOUNT fields</li>
                        <li><strong>Lobbyist Registration Reports</strong> - Files containing LOBBYIST_NAME and CLIENT_NAME fields</li>
                        <li><strong>Firm Registration Reports</strong> - Files containing FIRM_NAME and REGISTRATION_DATE fields</li>
                        <li><strong>Ethics Violation Reports</strong> - Files containing VIOLATION_TYPE or PENALTY_AMOUNT fields</li>
                        <li><strong>Corrected Filing Reports</strong> - Files containing ORIGINAL_REPORT_ID and FILING_DATE fields</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-base font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Processing Results
                      </h3>
                      <p className="text-sm">
                        After processing, the system extracts entities (individuals, organizations, PACs), 
                        financial transactions, and relationships. Each upload generates:
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>A moderation queue of significant entities for review</li>
                        <li>A relationship graph showing connections between entities</li>
                        <li>Detailed transaction records for financial activity</li>
                        <li>AI-enriched profiles for high-profile entities</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TecFileUploadPage;