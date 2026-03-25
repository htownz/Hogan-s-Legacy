import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Bell, X, ArrowRight, CheckCircle } from 'lucide-react';
import { markNotificationRead, useUser } from '../../context/UserContext';

interface NotificationBannerProps {
  onClose?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onClose }) => {
  const { userData, setUserData } = useUser();
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  
  // Filter only unread notifications
  const unreadNotifications = userData.notifications.filter(n => !n.read);
  
  // Auto-rotate through notifications
  useEffect(() => {
    if (unreadNotifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentNotificationIndex(prev => 
          prev === unreadNotifications.length - 1 ? 0 : prev + 1
        );
      }, 8000); // Rotate every 8 seconds
      
      return () => clearInterval(interval);
    }
  }, [unreadNotifications.length]);
  
  // If there are no unread notifications, don't render the banner
  if (unreadNotifications.length === 0) {
    return null;
  }
  
  const currentNotification = unreadNotifications[currentNotificationIndex];
  
  // Handle dismissing a notification
  const handleDismiss = () => {
    markNotificationRead(setUserData, currentNotification.id);
    if (onClose) onClose();
  };
  
  // Handle clicking "Take Action" button
  const handleAction = () => {
    markNotificationRead(setUserData, currentNotification.id);
  };
  
  // Determine background color based on notification type
  const getBgColor = (type: string) => {
    switch (type) {
      case 'status_change':
        return 'bg-blue-600';
      case 'action_required':
        return 'bg-orange-600';
      case 'deadline':
        return 'bg-red-600';
      case 'info':
      default:
        return 'bg-green-600';
    }
  };

  // Get the icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <Bell className="h-5 w-5 text-white" />;
      case 'action_required':
        return <ArrowRight className="h-5 w-5 text-white" />;
      case 'deadline':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'info':
      default:
        return <Bell className="h-5 w-5 text-white" />;
    }
  };
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-3 ${getBgColor(currentNotification.type)} shadow-md transition-all duration-300 ease-in-out`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-white bg-opacity-20 p-1">
              {getIcon(currentNotification.type)}
            </div>
            <div className="text-white font-medium">{currentNotification.message}</div>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentNotification.actionUrl && (
              <Link 
                to={currentNotification.actionUrl} 
                onClick={handleAction}
                className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md px-3 py-1 text-sm font-medium"
              >
                Take Action
              </Link>
            )}
            
            <button 
              onClick={handleDismiss} 
              className="text-white hover:text-gray-200"
              aria-label="Dismiss notification"
            >
              <X className="h-5 w-5" />
            </button>
            
            {unreadNotifications.length > 1 && (
              <span className="text-xs text-white bg-white bg-opacity-20 rounded-full px-2 py-0.5">
                {currentNotificationIndex + 1}/{unreadNotifications.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;