import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Users, Database, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportStats {
  totalFiles: number;
  billFiles: number;
  legislatorFiles: number;
  lastImport: string | null;
}

interface ImportResult {
  success: boolean;
  billsImported: number;
  legislatorsImported: number;
  errors: string[];
}

export default function DataImport() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const jsonFiles = selectedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.json')
    );
    
    if (jsonFiles.length !== selectedFiles.length) {
      toast({
        title: "Invalid files detected",
        description: "Only JSON files are supported",
        variant: "destructive"
      });
    }
    
    setFiles(jsonFiles);
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select JSON files to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/legiscan/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Files uploaded successfully",
          description: `Uploaded ${result.files.filter((f: any) => f.success).length} files`,
        });
        setUploadProgress(100);
        loadStats();
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const importData = async () => {
    setImporting(true);

    try {
      const response = await fetch('/api/legiscan/import', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setLastImport(result.data);
        toast({
          title: "Data imported successfully",
          description: `Imported ${result.data.billsImported} bills and ${result.data.legislatorsImported} legislators`,
        });
        loadStats();
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/legiscan/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load stats on component mount
  useState(() => {
    loadStats();
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Legislative Data Import</h1>
          <p className="text-muted-foreground">
            Upload authentic Texas legislative data from LegiScan to power your Act Up platform
          </p>
        </div>

        <div className="grid gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload LegiScan Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  multiple
                  accept=".json"
                  onChange={handleFileSelect}
                  className="mb-4"
                />
                
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Selected files ({files.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, index) => (
                        <Badge key={index} variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          {file.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground">Uploading files...</p>
                </div>
              )}

              <Button 
                onClick={uploadFiles} 
                disabled={uploading || files.length === 0}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Import Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Process uploaded files and import legislative data into your platform
              </p>

              <Button 
                onClick={importData} 
                disabled={importing || !stats || stats.totalFiles === 0}
                className="w-full"
              >
                {importing ? 'Importing...' : 'Import Legislative Data'}
              </Button>

              {lastImport && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Import Completed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bills:</span>
                      <span className="ml-2 font-medium">{lastImport.billsImported}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Legislators:</span>
                      <span className="ml-2 font-medium">{lastImport.legislatorsImported}</span>
                    </div>
                  </div>
                  {lastImport.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-amber-600">Warnings:</p>
                      {lastImport.errors.map((error, index) => (
                        <p key={index} className="text-xs text-amber-600">{error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Section */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
                    <div className="text-sm text-muted-foreground">Total Files</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.billFiles}</div>
                    <div className="text-sm text-muted-foreground">Bill Files</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.legislatorFiles}</div>
                    <div className="text-sm text-muted-foreground">Legislator Files</div>
                  </div>
                </div>
                
                {stats.lastImport && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Last import: {new Date(parseInt(stats.lastImport)).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">1</span>
                </div>
                <div>
                  <p className="font-medium">Download LegiScan Data</p>
                  <p className="text-sm text-muted-foreground">
                    Visit <a href="https://legiscan.com/datasets" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">legiscan.com/datasets</a> and download Texas legislative data
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">2</span>
                </div>
                <div>
                  <p className="font-medium">Extract JSON Files</p>
                  <p className="text-sm text-muted-foreground">
                    Extract the ZIP archive and locate the JSON files containing bill and legislator data
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">3</span>
                </div>
                <div>
                  <p className="font-medium">Upload & Import</p>
                  <p className="text-sm text-muted-foreground">
                    Select the JSON files above, upload them, then click "Import Legislative Data"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}