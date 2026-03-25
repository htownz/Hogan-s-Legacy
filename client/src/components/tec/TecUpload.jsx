import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Upload, FileUp, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * TEC File Upload Component
 * Provides drag-and-drop functionality for Texas Ethics Commission data files
 */
const TecUpload = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const { toast } = useToast();

  // Handle file drop
  const onDrop = useCallback(acceptedFiles => {
    // Only accept the first file
    if (acceptedFiles.length) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  // Upload file to server
  const uploadFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      toast({
        title: 'Upload Started',
        description: 'Uploading your TEC file to the server...',
      });

      const formData = new FormData();
      formData.append('tecFile', file);

      const response = await fetch('/api/tec/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      toast({
        title: 'Upload Successful',
        description: 'File uploaded and queued for processing.',
      });

      setProcessingId(data.processingId);
      setProcessingStatus('pending');
      startPolling(data.processingId);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'An error occurred during the upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Start polling for processing status
  const startPolling = (id) => {
    const interval = setInterval(() => {
      checkProcessingStatus(id);
    }, 3000); // Check every 3 seconds
    
    setPollingInterval(interval);
  };

  // Check processing status
  const checkProcessingStatus = async (id) => {
    try {
      const response = await fetch(`/api/tec/status/${id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get processing status');
      }

      setProcessingStatus(data.job.status);

      // If processing is complete or failed, stop polling
      if (data.job.status === 'completed' || data.job.status === 'failed') {
        clearInterval(pollingInterval);
        setPollingInterval(null);
        
        if (data.job.status === 'completed') {
          toast({
            title: 'Processing Complete',
            description: `Successfully processed ${file.name}`,
          });
          
          // Call callback with results
          if (onUploadComplete) {
            onUploadComplete({
              processingId: id,
              status: 'completed',
              results: data.job.results
            });
          }
        } else {
          toast({
            title: 'Processing Failed',
            description: data.job.error || 'An error occurred during processing',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
      toast({
        title: 'Status Check Failed',
        description: error.message || 'Failed to check processing status',
        variant: 'destructive',
      });
      
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setProcessingId(null);
    setProcessingStatus(null);
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Render progress indicator based on status
  const renderProgress = () => {
    if (!processingStatus) return null;
    
    let progressValue = 0;
    let statusLabel = '';
    let color = '';
    let icon = null;
    
    switch (processingStatus) {
      case 'pending':
        progressValue = 25;
        statusLabel = 'Pending';
        color = 'bg-yellow-500';
        icon = <Clock className="w-5 h-5 text-yellow-500" />;
        break;
      
      case 'processing':
        progressValue = 65;
        statusLabel = 'Processing';
        color = 'bg-blue-500';
        icon = <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
        break;
      
      case 'completed':
        progressValue = 100;
        statusLabel = 'Completed';
        color = 'bg-green-500';
        icon = <CheckCircle className="w-5 h-5 text-green-500" />;
        break;
      
      case 'failed':
        progressValue = 100;
        statusLabel = 'Failed';
        color = 'bg-red-500';
        icon = <XCircle className="w-5 h-5 text-red-500" />;
        break;
      
      default:
        progressValue = 0;
        statusLabel = 'Unknown';
        color = 'bg-gray-500';
        icon = <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{statusLabel}</span>
          </div>
          <Badge variant={
            processingStatus === 'completed' ? 'success' : 
            processingStatus === 'failed' ? 'destructive' :
            'secondary'
          }>
            {processingStatus}
          </Badge>
        </div>
        <Progress 
          value={progressValue} 
          className={processingStatus === 'failed' ? 'bg-red-200' : ''} 
        />
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Texas Ethics Commission File Upload
        </CardTitle>
        <CardDescription>
          Upload campaign finance reports, lobbyist registrations, and other TEC data files
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!file ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
              ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center justify-center gap-4">
              <Upload className="h-10 w-10 text-gray-400" />
              
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : isDragReject ? (
                <p className="text-red-500">Only CSV files are accepted</p>
              ) : (
                <>
                  <p className="text-lg font-medium">Drag & drop a TEC file here, or click to select</p>
                  <p className="text-sm text-gray-500">
                    Only CSV files are supported (max 20MB)
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFile(null)}
                  disabled={uploading || processingStatus}
                >
                  Change
                </Button>
              </div>
            </div>
            
            {renderProgress()}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={resetForm}
          disabled={uploading || (!file && !processingStatus)}
        >
          Reset
        </Button>
        
        <Button 
          onClick={uploadFile} 
          disabled={!file || uploading || processingStatus}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload & Process
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TecUpload;