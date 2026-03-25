import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import ShareableCard from './ShareableCard';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  billTitle: string;
  summary: string;
  status?: string;
  impactSummary?: string;
  zipCode?: string;
  tags?: string[];
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  billId,
  billTitle,
  summary,
  status,
  impactSummary,
  zipCode,
  tags
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Generate the share URL with parameters
  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const path = `/bills/${billId}`;
    
    const params = new URLSearchParams();
    if (zipCode) params.append('zip', zipCode);
    if (tags && tags.length > 0) params.append('tags', tags.join(','));
    
    const paramString = params.toString();
    return `${baseUrl}${path}${paramString ? `?${paramString}` : ''}`;
  };
  
  const shareUrl = generateShareUrl();
  
  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);
  
  // Close dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Close on ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        ref={dialogRef}
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-xl transform transition-transform ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold">Share this Bill</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <ShareableCard
            billId={billId}
            billTitle={billTitle}
            summary={summary}
            impactSummary={impactSummary}
            status={status}
            shareUrl={shareUrl}
          />
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Share URL
            </h3>
            <div className="flex">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-l-md text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;