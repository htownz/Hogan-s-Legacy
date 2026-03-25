import React from 'react';
import { Link } from 'wouter';
import { Bell, X, Check, CheckCircle2, Calendar, Info, Clock } from 'lucide-react';
import { useUser, markNotificationRead, markAllNotificationsRead, removeNotification } from '../../context/UserContext';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { userData, setUserData } = useUser();
  
  // Sort notifications by date (newest first)
  const sortedNotifications = [...userData.notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Mark a notification as read when clicked
  const handleNotificationClick = (id: string) => {
    markNotificationRead(setUserData, id);
  };
  
  // Remove a notification
  const handleRemoveNotification = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeNotification(setUserData, id);
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    markAllNotificationsRead(setUserData);
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'action_required':
        return <Check className="h-5 w-5 text-orange-500" />;
      case 'deadline':
        return <Calendar className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-green-500" />;
    }
  };
  
  // Get time ago text
  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end">
      <div className="w-full h-full max-w-md bg-white dark:bg-gray-900 shadow-lg flex flex-col">
        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-blue-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Notifications</h2>
          </div>
          <div className="flex items-center space-x-4">
            {userData.notifications.some(n => !n.read) && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark all as read
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close notification center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sortedNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No notifications yet.</p>
              <p className="text-sm mt-2">When there are updates on bills you're tracking, they'll appear here.</p>
            </div>
          ) : (
            <ul className="divide-y dark:divide-gray-800">
              {sortedNotifications.map(notification => (
                <li 
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    notification.read ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800/50'
                  }`}
                >
                  <Link 
                    to={notification.actionUrl || '/dashboard'}
                    onClick={() => handleNotificationClick(notification.id)}
                    className="block"
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="pt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                          <p className={`${notification.read ? 'text-gray-800 dark:text-gray-300' : 'text-black dark:text-white font-medium'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{getTimeAgo(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleRemoveNotification(e, notification.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label="Remove notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;