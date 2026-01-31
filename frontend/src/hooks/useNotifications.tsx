/**
 * Notification System Hook
 * Manages real-time notifications for new messages, user activities, and system events
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Bell, MessageCircle, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Notification types
export interface Notification {
  id: string;
  type: 'message' | 'user_online' | 'user_offline' | 'system' | 'error' | 'success' | 'warning';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  persistent?: boolean;
}

// Notification context interface
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Real-time integration
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  
  // Browser notification permission
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  showBrowserNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Type guard for localStorage data validation
function isValidNotification(data: any): data is Notification {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.type === 'string' &&
    typeof data.title === 'string' &&
    typeof data.message === 'string' &&
    typeof data.read === 'boolean' &&
    typeof data.priority === 'string'
  );
}

// Sanitize notification content to prevent XSS
function sanitizeText(text: string): string {
  try {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  } catch {
    return '';
  }
}

// Notification provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  // Define handlers before using in hook
  const handleNewMessage = useCallback((data: any) => {
    try {
      if (!isEnabled || !isAuthenticated) return;
      
      const notification: Omit<Notification, 'id' | 'timestamp' | 'read'> = {
        type: 'message',
        title: `New message from ${data.sender?.username || 'Unknown'}`,
        message: data.content || 'You have received a new message',
        data,
        priority: 'medium'
      };
      
      addNotification(notification);
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }, [isEnabled, isAuthenticated]);
  
  const handleUserStatusChange = useCallback((data: any) => {
    try {
      if (!isEnabled || !isAuthenticated) return;
      
      const isOnline = data.type === 'user_online';
      const notification: Omit<Notification, 'id' | 'timestamp' | 'read'> = {
        type: isOnline ? 'success' : 'system',
        title: isOnline ? 'User Online' : 'User Offline',
        message: `${data.username || 'A user'} is now ${isOnline ? 'online' : 'offline'}`,
        data,
        priority: 'low',
        persistent: false
      };
      
      addNotification(notification);
      
      // Auto-remove status notifications after 3 seconds
      setTimeout(() => {
        removeNotification(notification.id || '');
      }, 3000);
    } catch (error) {
      console.error('Error handling user status change:', error);
    }
  }, [isEnabled, isAuthenticated]);
  
  const { onMessage, onUserStatus } = useWebSocket({
    onMessage: handleNewMessage,
    onUserStatus: handleUserStatusChange
  });
  
  // Initialize browser notification permission
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    } catch (error) {
      console.error('Error initializing notification permission:', error);
    }
  }, []);
  
  // Load persisted notifications on mount
  useEffect(() => {
    try {
      if (isAuthenticated && user) {
        const saved = localStorage.getItem(`offchat_notifications_${user.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const notificationsWithDates = parsed
              .filter(isValidNotification)
              .map((n: any) => ({
                ...n,
                timestamp: new Date(n.timestamp)
              }));
            setNotifications(notificationsWithDates);
          } catch (parseError) {
            console.error('Failed to parse notifications:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [isAuthenticated, user]);
  
  // Persist notifications when they change
  useEffect(() => {
    try {
      if (isAuthenticated && user) {
        localStorage.setItem(`offchat_notifications_${user.id}`, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Failed to persist notifications:', error);
    }
  }, [notifications, isAuthenticated, user]);
  
  // Add notification
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>): string => {
    try {
      const notification: Notification = {
        ...notificationData,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted and enabled
      if (permission === 'granted' && isEnabled) {
        showBrowserNotification(notification);
      }
      
      // Auto-remove low priority, non-persistent notifications after 5 seconds
      if (notification.priority === 'low' && !notification.persistent) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, 5000);
      }
      
      return notification.id;
    } catch (error) {
      console.error('Error adding notification:', error);
      return '';
    }
  }, [permission, isEnabled]);
  
  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);
  
  // Remove notification
  const removeNotification = useCallback((id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }, []);
  
  // Clear all notifications
  const clearAll = useCallback(() => {
    try {
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);
  
  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
      }
      
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);
  
  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    try {
      if (permission !== 'granted' || !isEnabled) return;
      
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });
      
      browserNotification.onclick = () => {
        try {
          if (notification.actionUrl) {
            window.open(notification.actionUrl, '_blank');
          } else {
            window.focus();
          }
          browserNotification.close();
          markAsRead(notification.id);
        } catch (error) {
          console.error('Error handling notification click:', error);
        }
      };
      
      // Auto-close after 10 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          try {
            browserNotification.close();
          } catch (error) {
            console.error('Error closing notification:', error);
          }
        }, 10000);
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [permission, isEnabled, markAsRead]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      isEnabled,
      setEnabled: setIsEnabled,
      permission,
      requestPermission,
      showBrowserNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification component
export const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { markAsRead, removeNotification } = useNotifications();
  
  const getIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'user_online':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'user_offline':
        return <Users className="h-5 w-5 text-gray-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };
  
  const handleClick = () => {
    try {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      if (notification.actionUrl) {
        window.open(notification.actionUrl, '_blank');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };
  
  return (
    <Card 
      className={cn(
        "p-4 border-l-4 cursor-pointer transition-colors",
        getPriorityStyles(),
        !notification.read && "shadow-md"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                "font-medium text-sm",
                !notification.read ? "text-gray-900" : "text-gray-600"
              )} title={notification.title}>
                {sanitizeText(notification.title)}
              </h4>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1" title={notification.message}>{sanitizeText(notification.message)}</p>
            <p className="text-xs text-gray-400 mt-2">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            try {
              e.stopPropagation();
              removeNotification(notification.id);
            } catch (error) {
              console.error('Error removing notification:', error);
            }
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};

// Notification list component
export const NotificationList: React.FC = () => {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">No notifications yet</p>
        <p className="text-sm text-gray-400 mt-1">
          You'll see notifications here when you receive messages or have system updates
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      </div>
      
      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
};

// Notification bell component for header
export const NotificationBell: React.FC = () => {
  const { unreadCount, notifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);
  
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-4">
            <NotificationList />
          </div>
        </div>
      )}
    </div>
  );
};

// Toast notification hook
export const useToast = () => {
  const { addNotification, removeNotification } = useNotifications();
  
  const showToast = useCallback(
    (
      type: Notification['type'],
      title: string,
      message: string,
      priority: Notification['priority'] = 'medium',
      duration: number = 5000
    ) => {
      try {
        const notificationId = addNotification({
          type,
          title,
          message,
          priority,
          persistent: false
        });
        
        // Auto-remove toast notifications
        if (duration > 0) {
          setTimeout(() => {
            removeNotification(notificationId);
          }, duration);
        }
        
        return notificationId;
      } catch (error) {
        console.error('Error showing toast:', error);
        return '';
      }
    },
    [addNotification, removeNotification]
  );
  
  return {
    success: (title: string, message: string) => showToast('success', title, message, 'medium'),
    error: (title: string, message: string) => showToast('error', title, message, 'high'),
    warning: (title: string, message: string) => showToast('warning', title, message, 'medium'),
    info: (title: string, message: string) => showToast('system', title, message, 'low'),
    show: showToast
  };
};
