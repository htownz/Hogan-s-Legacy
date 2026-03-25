import { Loader2, AlertCircle, RefreshCw, Database, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  type: 'government-data' | 'legislators' | 'search' | 'analysis' | 'general';
  message?: string;
  progress?: number;
}

export function LoadingState({ type, message, progress }: LoadingStateProps) {
  const getLoadingConfig = () => {
    switch (type) {
      case 'government-data':
        return {
          icon: Database,
          title: 'Loading Government Data',
          description: 'Fetching authentic records from Texas Ethics Commission, FEC, and Legislature...',
          color: 'text-blue-600'
        };
      case 'legislators':
        return {
          icon: Loader2,
          title: 'Loading Legislators',
          description: 'Retrieving current Texas state senators, representatives, and governor information...',
          color: 'text-green-600'
        };
      case 'search':
        return {
          icon: RefreshCw,
          title: 'Searching Records',
          description: 'Searching through government transparency data...',
          color: 'text-purple-600'
        };
      case 'analysis':
        return {
          icon: Loader2,
          title: 'Analyzing Data',
          description: 'Processing transparency metrics and generating insights...',
          color: 'text-orange-600'
        };
      default:
        return {
          icon: Loader2,
          title: 'Loading',
          description: 'Please wait while we process your request...',
          color: 'text-gray-600'
        };
    }
  };

  const config = getLoadingConfig();
  const Icon = config.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <Icon className={`h-8 w-8 ${config.color} mx-auto mb-4 animate-spin`} />
        <h3 className="font-semibold text-gray-900 mb-2">{config.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message || config.description}</p>
        
        {progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${config.color.replace('text', 'bg')}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-center text-xs text-gray-500">
          <Wifi className="h-3 w-3 mr-1" />
          <span>Connected to government sources</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  type: 'api-error' | 'network-error' | 'data-error' | 'permission-error';
  title?: string;
  message?: string;
  onRetry?: () => void;
  onRefresh?: () => void;
}

export function ErrorState({ type, title, message, onRetry, onRefresh }: ErrorStateProps) {
  const getErrorConfig = () => {
    switch (type) {
      case 'api-error':
        return {
          icon: WifiOff,
          defaultTitle: 'Government API Temporarily Unavailable',
          defaultMessage: 'The government data source is temporarily unavailable. This is normal and the service will resume shortly.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'network-error':
        return {
          icon: WifiOff,
          defaultTitle: 'Connection Issue',
          defaultMessage: 'Unable to connect to government data sources. Please check your internet connection.',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'data-error':
        return {
          icon: AlertCircle,
          defaultTitle: 'Data Processing Error',
          defaultMessage: 'There was an issue processing the government data. Our team has been notified.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'permission-error':
        return {
          icon: AlertCircle,
          defaultTitle: 'Access Restricted',
          defaultMessage: 'You don\'t have permission to access this government data.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: AlertCircle,
          defaultTitle: 'Something went wrong',
          defaultMessage: 'An unexpected error occurred. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <Card className={`w-full max-w-md mx-auto ${config.bgColor} ${config.borderColor}`}>
      <CardContent className="p-6 text-center">
        <Icon className={`h-8 w-8 ${config.color} mx-auto mb-4`} />
        <h3 className="font-semibold text-gray-900 mb-2">{title || config.defaultTitle}</h3>
        <p className="text-sm text-gray-600 mb-4">{message || config.defaultMessage}</p>
        
        <div className="flex gap-2 justify-center">
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className={`${config.color} border-current hover:bg-current hover:text-white`}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          )}
          {onRefresh && (
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              size="sm"
              className={`${config.color} border-current hover:bg-current hover:text-white`}
            >
              <Database className="h-3 w-3 mr-2" />
              Refresh Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  type: 'no-data' | 'no-results' | 'no-legislators' | 'no-records';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ type, title, message, actionLabel, onAction }: EmptyStateProps) {
  const getEmptyConfig = () => {
    switch (type) {
      case 'no-data':
        return {
          icon: Database,
          defaultTitle: 'No Government Data Available',
          defaultMessage: 'Government data is being synchronized. Please check back in a few minutes.',
          color: 'text-gray-400'
        };
      case 'no-results':
        return {
          icon: AlertCircle,
          defaultTitle: 'No Results Found',
          defaultMessage: 'Try adjusting your search criteria or filters to find what you\'re looking for.',
          color: 'text-gray-400'
        };
      case 'no-legislators':
        return {
          icon: Database,
          defaultTitle: 'No Legislators Found',
          defaultMessage: 'Legislator data is being loaded from official government sources.',
          color: 'text-gray-400'
        };
      case 'no-records':
        return {
          icon: AlertCircle,
          defaultTitle: 'No Records Available',
          defaultMessage: 'There are currently no records matching your criteria.',
          color: 'text-gray-400'
        };
      default:
        return {
          icon: AlertCircle,
          defaultTitle: 'No Data',
          defaultMessage: 'No information is currently available.',
          color: 'text-gray-400'
        };
    }
  };

  const config = getEmptyConfig();
  const Icon = config.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <Icon className={`h-12 w-12 ${config.color} mx-auto mb-4`} />
        <h3 className="font-semibold text-gray-700 mb-2">{title || config.defaultTitle}</h3>
        <p className="text-sm text-gray-500 mb-4">{message || config.defaultMessage}</p>
        
        {onAction && actionLabel && (
          <Button onClick={onAction} variant="outline" size="sm">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}