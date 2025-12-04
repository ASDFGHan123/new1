/**
 * WebSocket Connection Management Hook
 * Manages WebSocket connections, authentication, and reconnection logic
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { webSocketClient, type ConnectionState } from '@/lib/websocket';
import { useAuth } from '@/contexts/AuthContext';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
  onMessage?: (data: any) => void;
  onTyping?: (data: any) => void;
  onUserStatus?: (data: any) => void;
  onDelivery?: (data: any) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

export interface WebSocketHookReturn {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  isReconnecting: boolean;
  hasError: boolean;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Message sending
  sendMessage: (data: any) => Promise<void>;
  
  // Room management
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => void;
  
  joinIndividualChat: (userId: string) => Promise<void>;
  leaveIndividualChat: (userId: string) => void;
  
  joinGroupChat: (groupId: string) => Promise<void>;
  leaveGroupChat: (groupId: string) => void;
  
  joinUserStatus: () => Promise<void>;
  leaveUserStatus: () => void;
  
  joinAdminMonitor: () => Promise<void>;
  leaveAdminMonitor: () => void;
  
  // Typing indicators
  sendTyping: (conversationId?: string, groupId?: string) => void;
  sendStopTyping: (conversationId?: string, groupId?: string) => void;
  
  // Event listeners
  onMessage: (callback: (data: any) => void) => () => void;
  onTyping: (callback: (data: any) => void) => () => void;
  onUserStatus: (callback: (data: any) => void) => () => void;
  onDelivery: (callback: (data: any) => void) => () => void;
  onConnectionStateChange: (callback: (state: ConnectionState) => void) => () => void;
  
  // Message delivery confirmation
  messageDeliveryStatus: Map<string, { status: 'pending' | 'delivered' | 'failed'; error?: string }>;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): WebSocketHookReturn => {
  const { user: authUser, isAuthenticated } = useAuth();
  
  const {
    autoConnect = true,
    reconnectAttempts,
    heartbeatInterval,
    onMessage: externalOnMessage,
    onTyping: externalOnTyping,
    onUserStatus: externalOnUserStatus,
    onDelivery: externalOnDelivery,
    onConnectionChange
  } = options;
  
  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>(webSocketClient.getState());
  const messageDeliveryStatus = useRef(new Map<string, { status: 'pending' | 'delivered' | 'failed'; error?: string }>());
  
  // Refs to store listeners
  const messageCallbacks = useRef<Set<(data: any) => void>>(new Set());
  const typingCallbacks = useRef<Set<(data: any) => void>>(new Set());
  const userStatusCallbacks = useRef<Set<(data: any) => void>>(new Set());
  const deliveryCallbacks = useRef<Set<(data: any) => void>>(new Set());
  const connectionStateCallbacks = useRef<Set<(state: ConnectionState) => void>>(new Set());
  
  // Connection state helpers
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected';
  const isReconnecting = connectionState === 'reconnecting';
  const hasError = connectionState === 'error';
  
  // Setup connection state listener
  useEffect(() => {
    const unsubscribe = webSocketClient.onConnectionStateChange((state: ConnectionState) => {
      setConnectionState(state);
      onConnectionChange?.(state);
      connectionStateCallbacks.current.forEach(callback => callback(state));
    });
    
    return unsubscribe;
  }, [onConnectionChange]);
  
  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && authUser) {
      connect();
    }
  }, [autoConnect, isAuthenticated, authUser]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, []);
  
  // Connect method
  const connect = useCallback(async () => {
    try {
      await webSocketClient.connect();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, []);
  
  // Disconnect method
  const disconnect = useCallback(() => {
    webSocketClient.disconnect();
  }, []);
  
  // Send message
  const sendMessage = useCallback(async (data: any): Promise<void> => {
    try {
      await webSocketClient.sendMessage(data);
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      throw error;
    }
  }, []);
  
  // Room management methods
  const joinConversation = useCallback(async (conversationId: string) => {
    try {
      await webSocketClient.connectToConversation(conversationId);
    } catch (error) {
      console.error('Failed to join conversation:', error);
    }
  }, []);
  
  const leaveConversation = useCallback((conversationId: string) => {
    webSocketClient.disconnectFromConversation(conversationId);
  }, []);
  
  const joinIndividualChat = useCallback(async (userId: string) => {
    try {
      await webSocketClient.connectToIndividualChat(userId);
    } catch (error) {
      console.error('Failed to join individual chat:', error);
    }
  }, []);
  
  const leaveIndividualChat = useCallback((userId: string) => {
    webSocketClient.disconnectFromIndividualChat(userId);
  }, []);
  
  const joinGroupChat = useCallback(async (groupId: string) => {
    try {
      await webSocketClient.connectToGroupChat(groupId);
    } catch (error) {
      console.error('Failed to join group chat:', error);
    }
  }, []);
  
  const leaveGroupChat = useCallback((groupId: string) => {
    webSocketClient.disconnectFromGroupChat(groupId);
  }, []);
  
  const joinUserStatus = useCallback(async () => {
    try {
      await webSocketClient.connectToUserStatus();
    } catch (error) {
      console.error('Failed to join user status:', error);
    }
  }, []);
  
  const leaveUserStatus = useCallback(() => {
    webSocketClient.disconnectFromUserStatus();
  }, []);
  
  const joinAdminMonitor = useCallback(async () => {
    try {
      await webSocketClient.connectToAdminMonitor();
    } catch (error) {
      console.error('Failed to join admin monitor:', error);
    }
  }, []);
  
  const leaveAdminMonitor = useCallback(() => {
    webSocketClient.disconnectFromAdminMonitor();
  }, []);
  
  // Typing indicator methods
  const sendTyping = useCallback((conversationId?: string, groupId?: string) => {
    const typingData = {
      type: 'typing',
      user_id: authUser?.id,
      username: authUser?.username,
      ...(conversationId && { conversation_id: conversationId }),
      ...(groupId && { group_id: groupId })
    };
    sendMessage(typingData);
  }, [sendMessage, authUser]);
  
  const sendStopTyping = useCallback((conversationId?: string, groupId?: string) => {
    const stopTypingData = {
      type: 'stop_typing',
      user_id: authUser?.id,
      ...(conversationId && { conversation_id: conversationId }),
      ...(groupId && { group_id: groupId })
    };
    sendMessage(stopTypingData);
  }, [sendMessage, authUser]);
  
  // Event listener management
  const handleOnMessage = useCallback((callback: (data: any) => void) => {
    const unsubscribe = webSocketClient.on('new_message', (data) => {
      callback(data);
      messageCallbacks.current.forEach(cb => cb(data));
      externalOnMessage?.(data);
    });
    messageCallbacks.current.add(callback);
    
    return () => {
      unsubscribe();
      messageCallbacks.current.delete(callback);
    };
  }, [externalOnMessage]);
  
  const handleOnTyping = useCallback((callback: (data: any) => void) => {
    const unsubscribe = webSocketClient.on('typing', (data) => {
      callback(data);
      typingCallbacks.current.forEach(cb => cb(data));
      externalOnTyping?.(data);
    });
    typingCallbacks.current.add(callback);
    
    return () => {
      unsubscribe();
      typingCallbacks.current.delete(callback);
    };
  }, [externalOnTyping]);
  
  const handleOnUserStatus = useCallback((callback: (data: any) => void) => {
    const unsubscribe = webSocketClient.on('user_status', (data) => {
      callback(data);
      userStatusCallbacks.current.forEach(cb => cb(data));
      externalOnUserStatus?.(data);
    });
    userStatusCallbacks.current.add(callback);
    
    return () => {
      unsubscribe();
      userStatusCallbacks.current.delete(callback);
    };
  }, [externalOnUserStatus]);
  
  const handleOnDelivery = useCallback((callback: (data: any) => void) => {
    const unsubscribe = webSocketClient.on('message_delivery', (data) => {
      // Update delivery status
      if (data.type === 'message_delivered') {
        messageDeliveryStatus.current.set(data.message_id, { status: 'delivered' });
      } else if (data.type === 'message_failed') {
        messageDeliveryStatus.current.set(data.message_id, { 
          status: 'failed', 
          error: data.error 
        });
      }
      
      callback(data);
      deliveryCallbacks.current.forEach(cb => cb(data));
      externalOnDelivery?.(data);
    });
    deliveryCallbacks.current.add(callback);
    
    return () => {
      unsubscribe();
      deliveryCallbacks.current.delete(callback);
    };
  }, [externalOnDelivery]);
  
  const onConnectionStateChange = useCallback((callback: (state: ConnectionState) => void) => {
    connectionStateCallbacks.current.add(callback);
    
    return () => {
      connectionStateCallbacks.current.delete(callback);
    };
  }, []);
  
  return {
    // Connection state
    connectionState,
    isConnected,
    isConnecting,
    isDisconnected,
    isReconnecting,
    hasError,
    
    // Connection methods
    connect,
    disconnect,
    
    // Message sending
    sendMessage,
    
    // Room management
    joinConversation,
    leaveConversation,
    joinIndividualChat,
    leaveIndividualChat,
    joinGroupChat,
    leaveGroupChat,
    joinUserStatus,
    leaveUserStatus,
    joinAdminMonitor,
    leaveAdminMonitor,
    
    // Typing indicators
    sendTyping,
    sendStopTyping,
    
    // Event listeners
    onMessage: handleOnMessage,
    onTyping: handleOnTyping,
    onUserStatus: handleOnUserStatus,
    onDelivery: handleOnDelivery,
    onConnectionStateChange,
    
    // Message delivery confirmation
    messageDeliveryStatus: messageDeliveryStatus.current
  };
};

// Hook for typing indicators management
export const useTypingIndicator = (conversationId?: string, groupId?: string) => {
  const { sendTyping, sendStopTyping, onTyping } = useWebSocket();
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for typing events
  useEffect(() => {
    const unsubscribe = onTyping((data) => {
      const { type, user_id, username } = data;
      
      // Only handle typing events for current conversation/group
      if (conversationId && data.conversation_id !== conversationId) return;
      if (groupId && data.group_id !== groupId) return;
      
      setTypingUsers(prev => {
        const updated = new Map(prev);
        
        if (type === 'typing') {
          updated.set(user_id, username);
        } else if (type === 'stop_typing') {
          updated.delete(user_id);
        }
        
        return updated;
      });
      
      // Clear old typing entries after 5 seconds
      if (type === 'typing' && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers(new Map());
      }, 5000);
    });
    
    return unsubscribe;
  }, [onTyping, conversationId, groupId]);
  
  // Send typing indicator
  const startTyping = useCallback(() => {
    sendTyping(conversationId, groupId);
  }, [sendTyping, conversationId, groupId]);
  
  // Send stop typing indicator
  const stopTyping = useCallback(() => {
    sendStopTyping(conversationId, groupId);
  }, [sendStopTyping, conversationId, groupId]);
  
  return {
    typingUsers: Array.from(typingUsers.values()),
    startTyping,
    stopTyping
  };
};

// Hook for user presence management
export const useUserPresence = () => {
  const { onUserStatus, joinUserStatus, leaveUserStatus } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { username: string; lastSeen?: Date }>>(new Map());
  
  // Listen for user status events
  useEffect(() => {
    const unsubscribe = onUserStatus((data) => {
      const { type, user_id, username } = data;
      
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        
        if (type === 'user_online') {
          updated.set(user_id, { username, lastSeen: new Date() });
        } else if (type === 'user_offline') {
          const existing = updated.get(user_id);
          if (existing) {
            updated.set(user_id, { 
              username: existing.username, 
              lastSeen: new Date() 
            });
          }
        }
        
        return updated;
      });
    });
    
    // Join user status on mount
    joinUserStatus();
    
    return () => {
      unsubscribe();
      leaveUserStatus();
    };
  }, [onUserStatus, joinUserStatus, leaveUserStatus]);
  
  const getUserStatus = useCallback((userId: string): 'online' | 'offline' => {
    return onlineUsers.has(userId) ? 'online' : 'offline';
  }, [onlineUsers]);
  
  const getUserLastSeen = useCallback((userId: string): Date | null => {
    return onlineUsers.get(userId)?.lastSeen || null;
  }, [onlineUsers]);
  
  return {
    onlineUsers: Array.from(onlineUsers.entries()).map(([id, data]) => ({
      id,
      ...data
    })),
    getUserStatus,
    getUserLastSeen
  };
};

// Hook for connection status display
export const useConnectionStatus = () => {
  const { connectionState, isConnected, isConnecting, isDisconnected, isReconnecting, hasError } = useWebSocket();
  
  const getStatusText = useCallback(() => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  }, [connectionState]);
  
  const getStatusColor = useCallback(() => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-600';
      case 'disconnected':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }, [connectionState]);
  
  return {
    connectionState,
    isConnected,
    isConnecting,
    isDisconnected,
    isReconnecting,
    hasError,
    statusText: getStatusText(),
    statusColor: getStatusColor()
  };
};