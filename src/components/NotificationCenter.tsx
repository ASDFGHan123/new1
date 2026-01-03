import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/users/notifications/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : data.results || []);
        const unread = (Array.isArray(data) ? data : data.results || []).filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/users/notifications/${id}/mark_as_read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      await fetch('http://localhost:8000/api/users/notifications/mark_all_as_read/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json'
        }
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
      case 'message': return 'bg-blue-100 text-blue-800';
      case 'user_approved': return 'bg-green-100 text-green-800';
      case 'user_rejected': return 'bg-red-100 text-red-800';
      case 'system': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No notifications</div>
          ) : (
            <div className="space-y-2 p-2">
              {notifications.map(notif => (
                <Card
                  key={notif.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{notif.title}</h4>
                        <Badge className={`text-xs ${getNotificationColor(notif.notification_type)}`}>
                          {notif.notification_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
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
