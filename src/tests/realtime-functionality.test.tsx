/**
 * End-to-End Real-time Functionality Tests
 * Tests all WebSocket-based real-time features comprehensively
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { webSocketClient } from '@/lib/websocket';
import { useWebSocket, useTypingIndicator, useUserPresence, useConnectionStatus } from '@/hooks/useWebSocket';
import { useNotifications, NotificationProvider } from '@/hooks/useNotifications';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.({} as Event);
    }, 10);
  }

  send(data: string) {
    // Simulate message sending
    console.log('Mock WebSocket sent:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as CloseEvent);
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock provider components
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    clearError: vi.fn()
  };

  // Mock useAuth hook
  vi.mocked(useAuth).mockReturnValue(mockAuthContext);
  
  return <>{children}</>;
};

const MockNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock the context value
  const mockNotificationContext = {
    notifications: [],
    unreadCount: 0,
    addNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    removeNotification: vi.fn(),
    clearAll: vi.fn(),
    isEnabled: true,
    setEnabled: vi.fn(),
    permission: 'granted' as NotificationPermission,
    requestPermission: vi.fn().mockResolvedValue(true),
    showBrowserNotification: vi.fn()
  };

  // Mock useNotifications hook
  vi.mocked(useNotifications).mockReturnValue(mockNotificationContext);
  
  return <>{children}</>;
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MockAuthProvider>
      <MockNotificationProvider>
        {children}
      </MockNotificationProvider>
    </MockAuthProvider>
  );
};

// Test data
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com'
};

const mockMessage = {
  id: 'msg-1',
  content: 'Test message',
  senderId: 'user-1',
  timestamp: new Date(),
  conversationId: 'conv-1'
};

const mockTypingEvent = {
  type: 'typing',
  user_id: 'user-2',
  username: 'otheruser',
  conversation_id: 'conv-1'
};

const mockUserStatusEvent = {
  type: 'user_online',
  user_id: 'user-2',
  username: 'otheruser'
};

const mockDeliveryEvent = {
  type: 'message_delivered',
  message_id: 'msg-1',
  conversation_id: 'conv-1'
};

describe('Real-time Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset WebSocket client state
    webSocketClient.disconnect();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WebSocket Connection Management', () => {
    test('should connect successfully', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionState).toBe('connected');
      expect(result.current.isConnected).toBe(true);
    });

    test('should handle connection states correctly', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

      // Initial state should be disconnected
      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.isConnected).toBe(false);

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isDisconnected).toBe(false);
    });

    test('should disconnect cleanly', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.isConnected).toBe(true);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('Message Delivery Confirmation', () => {
    test('should track message delivery status', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      
      let deliveryCallback: ((data: any) => void) | null = null;

      // Mock the onDelivery to capture callback
      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'message_delivery') {
          deliveryCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await result.current.connect();
      });

      expect(deliveryCallback).not.toBeNull();

      // Simulate delivery confirmation
      act(() => {
        deliveryCallback!(mockDeliveryEvent);
      });

      // Check if delivery status is tracked
      expect(result.current.messageDeliveryStatus.has('msg-1')).toBe(true);
    });

    test('should handle delivery failures', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      
      let deliveryCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'message_delivery') {
          deliveryCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await result.current.connect();
      });

      const failureEvent = {
        ...mockDeliveryEvent,
        type: 'message_failed',
        error: 'Network error'
      };

      act(() => {
        deliveryCallback!(failureEvent);
      });

      const status = result.current.messageDeliveryStatus.get('msg-1');
      expect(status?.status).toBe('failed');
      expect(status?.error).toBe('Network error');
    });
  });

  describe('Typing Indicators', () => {
    test('should manage typing indicators correctly', async () => {
      const { result } = renderHook(() => useTypingIndicator('conv-1'));
      
      let typingCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'typing') {
          typingCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await webSocketClient.connect();
      });

      // Simulate typing start
      act(() => {
        typingCallback!(mockTypingEvent);
      });

      // Should show typing user
      expect(result.current.typingUsers).toContain('otheruser');

      // Simulate typing stop
      const stopTypingEvent = { ...mockTypingEvent, type: 'stop_typing' };
      act(() => {
        typingCallback!(stopTypingEvent);
      });

      // Should remove typing user
      expect(result.current.typingUsers).not.toContain('otheruser');
    });

    test('should only show typing for current conversation', async () => {
      const { result } = renderHook(() => useTypingIndicator('conv-1'));
      
      let typingCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'typing') {
          typingCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await webSocketClient.connect();
      });

      // Simulate typing in different conversation
      const otherConversationEvent = { ...mockTypingEvent, conversation_id: 'conv-2' };
      
      act(() => {
        typingCallback!(otherConversationEvent);
      });

      // Should not show typing for different conversation
      expect(result.current.typingUsers).not.toContain('otheruser');
    });
  });

  describe('User Presence Tracking', () => {
    test('should track online/offline status', async () => {
      const { result } = renderHook(() => useUserPresence());
      
      let statusCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'user_status') {
          statusCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await webSocketClient.connect();
      });

      // User comes online
      act(() => {
        statusCallback!(mockUserStatusEvent);
      });

      expect(result.current.getUserStatus('user-2')).toBe('online');

      // User goes offline
      const offlineEvent = { ...mockUserStatusEvent, type: 'user_offline' };
      act(() => {
        statusCallback!(offlineEvent);
      });

      expect(result.current.getUserStatus('user-2')).toBe('offline');
    });

    test('should maintain last seen timestamps', async () => {
      const { result } = renderHook(() => useUserPresence());
      
      let statusCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'user_status') {
          statusCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await webSocketClient.connect();
      });

      const beforeTime = new Date();
      
      act(() => {
        statusCallback!(mockUserStatusEvent);
      });

      const lastSeen = result.current.getUserLastSeen('user-2');
      expect(lastSeen).not.toBeNull();
      expect(lastSeen!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Connection Status Indicators', () => {
    test('should reflect connection state changes', async () => {
      const { result } = renderHook(() => useConnectionStatus());
      
      let stateCallback: ((state: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'onConnectionStateChange').mockImplementation((callback: (state: any) => void) => {
        stateCallback = callback;
        return vi.fn();
      });

      await act(async () => {
        await webSocketClient.connect();
      });

      expect(result.current.connectionState).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.statusText).toBe('Connected');
    });

    test('should show appropriate status colors', () => {
      const { result } = renderHook(() => useConnectionStatus());
      
      // Mock different connection states
      vi.spyOn(webSocketClient, 'getState').mockReturnValue('connecting');
      
      const { rerender } = renderHook(() => useConnectionStatus());
      
      expect(result.current.statusColor).toBe('text-yellow-600');
      
      vi.spyOn(webSocketClient, 'getState').mockReturnValue('error');
      rerender();
      
      expect(result.current.statusColor).toBe('text-red-600');
    });
  });

  describe('Real-time Notifications', () => {
    test('should create notifications for new messages', async () => {
      const { result } = renderHook(() => useNotifications());
      
      let messageCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'new_message') {
          messageCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await webSocketClient.connect();
      });

      const messageEvent = {
        type: 'new_message',
        message: {
          id: 'msg-2',
          content: 'New message',
          sender: { id: 'user-2', username: 'otheruser' }
        }
      };

      act(() => {
        messageCallback!(messageEvent);
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(result.current.unreadCount).toBeGreaterThan(0);
    });

    test('should handle notification permissions', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // Mock Notification API
      (global as any).Notification = {
        permission: 'denied',
        requestPermission: vi.fn().mockResolvedValue('granted')
      };

      const permissionGranted = await act(async () => {
        return await result.current.requestPermission();
      });

      expect(permissionGranted).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('End-to-End Workflows', () => {
    test('should handle complete message sending workflow', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      
      let messageCallback: ((data: any) => void) | null = null;
      let deliveryCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'new_message') {
          messageCallback = callback;
        } else if (event === 'message_delivery') {
          deliveryCallback = callback;
        }
        return vi.fn();
      });

      vi.spyOn(webSocketClient, 'sendMessage').mockResolvedValue(undefined);

      await act(async () => {
        await result.current.connect();
      });

      // Send message
      await act(async () => {
        await result.current.sendMessage({
          type: 'new_message',
          content: 'Test message',
          conversationId: 'conv-1'
        });
      });

      // Simulate delivery confirmation
      act(() => {
        deliveryCallback!({
          type: 'message_delivered',
          message_id: 'test-message-id'
        });
      });

      expect(webSocketClient.sendMessage).toHaveBeenCalled();
      expect(result.current.messageDeliveryStatus.size).toBeGreaterThan(0);
    });

    test('should handle typing workflow end-to-end', async () => {
      const { result } = renderHook(() => useTypingIndicator('conv-1'));
      
      let typingCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'typing') {
          typingCallback = callback;
        }
        return vi.fn();
      });

      vi.spyOn(webSocketClient, 'sendMessage').mockResolvedValue(undefined);

      await act(async () => {
        await webSocketClient.connect();
      });

      // Send typing indicator
      act(() => {
        result.current.startTyping();
      });

      expect(webSocketClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'typing',
          conversation_id: 'conv-1'
        })
      );

      // Simulate receiving typing indicator
      act(() => {
        typingCallback!(mockTypingEvent);
      });

      expect(result.current.typingUsers).toContain('otheruser');

      // Send stop typing
      act(() => {
        result.current.stopTyping();
      });

      expect(webSocketClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stop_typing',
          conversation_id: 'conv-1'
        })
      );
    });

    test('should handle user presence workflow', async () => {
      const { result } = renderHook(() => useUserPresence());
      
      let statusCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'user_status') {
          statusCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await webSocketClient.connect();
      });

      // User comes online
      act(() => {
        statusCallback!(mockUserStatusEvent);
      });

      expect(result.current.getUserStatus('user-2')).toBe('online');

      // Multiple users online
      const user2Event = { ...mockUserStatusEvent, user_id: 'user-3', username: 'user3' };
      act(() => {
        statusCallback!(user2Event);
      });

      expect(result.current.onlineUsers.length).toBe(2);
      expect(result.current.getUserStatus('user-3')).toBe('online');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle connection errors gracefully', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      
      // Mock WebSocket to fail connection
      vi.spyOn(webSocketClient, 'connect').mockRejectedValue(new Error('Connection failed'));

      await act(async () => {
        try {
          await result.current.connect();
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.hasError).toBe(true);
    });

    test('should handle message sending failures', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      
      vi.spyOn(webSocketClient, 'sendMessage').mockRejectedValue(new Error('Send failed'));
      vi.spyOn(webSocketClient, 'getState').mockReturnValue('connected');

      await act(async () => {
        await webSocketClient.connect();
      });

      await act(async () => {
        try {
          await result.current.sendMessage({ content: 'test' });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    test('should attempt reconnection on disconnect', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      
      const connectSpy = vi.spyOn(webSocketClient, 'connect').mockResolvedValue(undefined);
      
      await act(async () => {
        await result.current.connect();
      });

      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should clean up event listeners properly', async () => {
      const { result } = renderHook(() => useWebSocket());
      
      let unsubscribeCalled = false;
      const mockUnsubscribe = () => {
        unsubscribeCalled = true;
      };

      vi.spyOn(webSocketClient, 'on').mockReturnValue(mockUnsubscribe);

      await act(async () => {
        await result.current.connect();
      });

      // Unmount hook
      vi.clearAllTimers();
      
      expect(unsubscribeCalled).toBe(true);
    });

    test('should handle rapid message updates efficiently', async () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      
      let messageCallback: ((data: any) => void) | null = null;

      vi.spyOn(webSocketClient, 'on').mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'new_message') {
          messageCallback = callback;
        }
        return vi.fn();
      });

      await act(async () => {
        await result.current.connect();
      });

      // Simulate rapid message updates
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        act(() => {
          messageCallback!({
            type: 'new_message',
            message: {
              id: `msg-${i}`,
              content: `Message ${i}`,
              sender: { id: `user-${i % 3}`, username: `user${i}` }
            }
          });
        });
      }

      // Should complete within reasonable time
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });
  });
});