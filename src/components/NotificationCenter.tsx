import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { apiService } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      apiService.initializeAuth();
      const response = await apiService.httpRequest<any>('/users/notifications/');
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiService.httpRequest(`/users/notifications/${id}/mark_as_read/`, {
        method: 'POST',
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.httpRequest('/users/notifications/mark_all_as_read/', {
        method: 'POST',
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (notifications.some(n => !n.is_read)) {
      markAllAsRead();
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user_approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'user_rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'system': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-950 rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900 flex-shrink-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex-1 flex items-center justify-center">
              No notifications
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 space-y-1 p-2">
              {notifications.map(notif => (
                <Card
                  key={notif.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    !notif.is_read 
                      ? 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900' 
                      : 'bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900'
                  } border border-gray-200 dark:border-slate-800`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">{notif.title}</h4>
                        <Badge className={`text-xs whitespace-nowrap ${getNotificationColor(notif.notification_type)}`}>
                          {notif.notification_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">{notif.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
