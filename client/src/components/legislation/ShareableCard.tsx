import React from 'react';
import { Link } from 'wouter';
import { Share2, ExternalLink, Download } from 'lucide-react';

interface ShareableCardProps {
  billId: string;
  billTitle: string;
  summary: string;
  impactSummary?: string;
  status?: string;
  shareUrl: string;
}

export const ShareableCard: React.FC<ShareableCardProps> = ({
  billId,
  billTitle,
  summary,
  impactSummary,
  status = 'Filed',
  shareUrl
}) => {
  // Function to copy share URL to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch((error) => {
        console.error('Failed to copy link: ', error);
      });
  };
  
  // Generate shareable image (simulated)
  const handleDownloadImage = () => {
    // In a real implementation, this would generate an image
    // For now, we'll just show an alert
    alert('This would download a social media-ready image of the bill card.');
  };
  
  // Share on social media
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `ActUp: ${billTitle}`,
        text: `Check out this bill I'm tracking: ${billTitle}`,
        url: shareUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this bill I'm tracking with ActUp: ${billTitle} ${shareUrl}`)}`, '_blank');
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">ActUp Bill Tracker</h3>
          <div className="text-xs px-2 py-1 bg-white bg-opacity-20 rounded-full">
            {status}
          </div>
        </div>
        <p className="mt-2 text-xl font-semibold">{billTitle}</p>
      </div>
      
      {/* Bill content */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">SUMMARY</h4>
        <p className="mt-1 text-gray-800 dark:text-gray-200">{summary}</p>
        
        {impactSummary && (
          <>
            <h4 className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">PERSONAL IMPACT</h4>
            <p className="mt-1 text-gray-800 dark:text-gray-200">{impactSummary}</p>
          </>
        )}
        
        {/* Bill info and link */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Bill ID:</span>
              <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">{billId}</span>
            </div>
            <Link 
              to={`/bills/${billId}`} 
              className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center hover:underline"
            >
              View Details
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer with share options */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Shared via <span className="font-medium text-blue-600 dark:text-blue-400">ActUp</span>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={handleCopyLink}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            aria-label="Copy link"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
          
          <button 
            onClick={handleDownloadImage}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            aria-label="Download image"
          >
            <Download className="h-5 w-5" />
          </button>
          
          <button 
            onClick={handleShare}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareableCard;