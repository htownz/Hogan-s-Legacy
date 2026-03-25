// @ts-nocheck
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onUploadComplete?: (fileUrl: string, fileKey: string) => void;
  maxSizeMB?: number;
  allowedFileTypes?: string[];
  className?: string;
  buttonText?: string;
}

export function FileUploader({
  onUploadComplete,
  maxSizeMB = 5,
  allowedFileTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  className = "",
  buttonText = "Upload File"
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Validate file type
    if (!allowedFileTypes.includes(selectedFile.type)) {
      setUploadError(`Invalid file type. Allowed types: ${allowedFileTypes.join(", ")}`);
      return;
    }
    
    // Validate file size
    if (selectedFile.size > maxSize) {
      setUploadError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    
    setFile(selectedFile);
    setUploadComplete(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      const response = await apiRequest<{ url: string; key: string }>("/api/files/upload", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header when sending FormData
        headers: {},
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);
      
      if (onUploadComplete && response.url && response.key) {
        onUploadComplete(response.url, response.key);
      }
      
      toast({
        title: "Upload Complete",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      setUploadError("Upload failed. Please try again.");
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {!file ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <Upload className="w-10 h-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
            Click to select or drag and drop a file
          </p>
          <p className="text-xs text-gray-400 mb-4 dark:text-gray-500">
            Max size: {maxSizeMB}MB | Allowed types: {allowedFileTypes.map(type => type.split('/')[1]).join(', ')}
          </p>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            {buttonText}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={allowedFileTypes.join(",")}
          />
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {uploadError ? (
            <div className="text-xs text-red-500 mt-1">{uploadError}</div>
          ) : (
            <>
              {isUploading || uploadProgress > 0 ? (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              ) : null}
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {Math.round(file.size / 1024)} KB
                </span>
                
                {uploadComplete ? (
                  <span className="text-xs text-green-500 flex items-center">
                    <Check className="w-4 h-4 mr-1" /> Uploaded
                  </span>
                ) : (
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    size="sm"
                    className="ml-auto"
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}