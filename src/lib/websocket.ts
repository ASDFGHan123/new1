/**
 * WebSocket Client Service for OffChat Real-time Features
 * Handles connection management, authentication, reconnection, and event handling
 */

import { apiService } from './api';
import type { IndividualMessage, GroupMessage, User } from '@/types/chat';

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

// Connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// WebSocket message types
export interface ChatMessage {
  type: 'new_message';
  message: {
    id: string;
    content: string;
    sender: {
      id: string;
      username: string;
    };
    timestamp: string;
    message_type: string;
    conversation_id?: string;
    group_id?: string;
  };
}

export interface TypingEvent {
  type: 'typing' | 'stop_typing';
  user_id: string;
  username?: string;
  conversation_id?: string;
  group_id?: string;
}

export interface UserStatusEvent {
  type: 'user_online' | 'user_offline';
  user_id: string;
  username?: string;
}

export interface DeliveryConfirmation {
  type: 'message_delivered' | 'message_failed';
  message_id: string;
  conversation_id?: string;
  group_id?: string;
  error?: string;
}

export type IncomingEvent = ChatMessage | TypingEvent | UserStatusEvent | DeliveryConfirmation;

// WebSocket client class
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private pendingConnections: Map<string, () => Promise<void>> = new Map();

  // WebSocket URLs
  private get wsBaseUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const host = apiUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
    return `${wsProtocol}://${host}/ws`;
  }

  // Event listeners management
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Connection state management
  getState(): ConnectionState {
    return this.connectionState;
  }

  // Connection status listeners
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    return this.on('connection_state_change', callback);
  }

  // Message sending
  async sendMessage(data: any): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  // General WebSocket connection
  async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.connectionState = 'connecting';
    this.emit('connection_state_change', this.connectionState);

    try {
      const token = apiService.getAuthToken();
      const wsUrl = `${this.wsBaseUrl}/?token=${token}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.connectionState = 'error';
      this.emit('connection_state_change', this.connectionState);
      throw error;
    }
  }

  // General disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.cleanup();
  }

  // Connection event handlers
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.emit('connection_state_change', this.connectionState);
    this.startHeartbeat();
    this.connectPending();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.processMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.connectionState = 'disconnected';
    this.emit('connection_state_change', this.connectionState);
    this.cleanup();
    
    // Auto-reconnect unless it's a clean disconnect
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.connectionState = 'error';
    this.emit('connection_state_change', this.connectionState);
  }

  // Reconnection logic
  private scheduleReconnect(): void {
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    this.emit('connection_state_change', this.connectionState);

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.connectionState = 'error';
          this.emit('connection_state_change', this.connectionState);
        }
      });
    }, delay);
  }

  // Message processing
  private processMessage(data: IncomingEvent): void {
    switch (data.type) {
      case 'new_message':
        this.handleNewMessage(data);
        break;
      case 'typing':
      case 'stop_typing':
        this.handleTyping(data);
        break;
      case 'user_online':
      case 'user_offline':
        this.handleUserStatus(data);
        break;
      case 'message_delivered':
      case 'message_failed':
        this.handleDeliveryConfirmation(data);
        break;
      default:
        this.emit(data.type, data);
    }
  }

  private handleNewMessage(data: ChatMessage): void {
    this.emit('new_message', data.message);
  }

  private handleTyping(data: TypingEvent): void {
    this.emit('typing', data);
  }

  private handleUserStatus(data: UserStatusEvent): void {
    this.emit('user_status', data);
  }

  private handleDeliveryConfirmation(data: DeliveryConfirmation): void {
    this.emit('message_delivery', data);
  }

  // Heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private cleanup(): void {
    this.stopHeartbeat();
    this.ws = null;
    this.connectionState = 'disconnected';
  }

  // Pending connections management (for room-based connections)
  private connectPending(): void {
    this.pendingConnections.forEach(async (connectFn) => {
      try {
        await connectFn();
      } catch (error) {
        console.error('Failed to connect pending:', error);
      }
    });
  }

  // Specific room connections
  async connectToConversation(conversationId: string): Promise<void> {
    const token = apiService.getAuthToken();
    const wsUrl = `${this.wsBaseUrl}/chat/${conversationId}/?token=${token}`;
    
    const connectFn = async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'join_conversation',
          conversation_id: conversationId
        }));
      }
    };

    if (this.connectionState === 'connected') {
      await connectFn();
    } else {
      this.pendingConnections.set(`conversation_${conversationId}`, connectFn);
    }
  }

  async connectToIndividualChat(userId: string): Promise<void> {
    const token = apiService.getAuthToken();
    const wsUrl = `${this.wsBaseUrl}/chat/individual/${userId}/?token=${token}`;
    
    const connectFn = async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'join_individual_chat',
          user_id: userId
        }));
      }
    };

    if (this.connectionState === 'connected') {
      await connectFn();
    } else {
      this.pendingConnections.set(`individual_${userId}`, connectFn);
    }
  }

  async connectToGroupChat(groupId: string): Promise<void> {
    const token = apiService.getAuthToken();
    const wsUrl = `${this.wsBaseUrl}/chat/group/${groupId}/?token=${token}`;
    
    const connectFn = async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'join_group_chat',
          group_id: groupId
        }));
      }
    };

    if (this.connectionState === 'connected') {
      await connectFn();
    } else {
      this.pendingConnections.set(`group_${groupId}`, connectFn);
    }
  }

  async connectToUserStatus(): Promise<void> {
    const token = apiService.getAuthToken();
    const wsUrl = `${this.wsBaseUrl}/user/status/?token=${token}`;
    
    const connectFn = async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'join_user_status'
        }));
      }
    };

    if (this.connectionState === 'connected') {
      await connectFn();
    } else {
      this.pendingConnections.set('user_status', connectFn);
    }
  }

  async connectToAdminMonitor(): Promise<void> {
    const token = apiService.getAuthToken();
    const wsUrl = `${this.wsBaseUrl}/admin/monitor/?token=${token}`;
    
    const connectFn = async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'join_admin_monitor'
        }));
      }
    };

    if (this.connectionState === 'connected') {
      await connectFn();
    } else {
      this.pendingConnections.set('admin_monitor', connectFn);
    }
  }

  // Disconnect from specific rooms
  disconnectFromConversation(conversationId: string): void {
    this.pendingConnections.delete(`conversation_${conversationId}`);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_conversation',
        conversation_id: conversationId
      }));
    }
  }

  disconnectFromIndividualChat(userId: string): void {
    this.pendingConnections.delete(`individual_${userId}`);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_individual_chat',
        user_id: userId
      }));
    }
  }

  disconnectFromGroupChat(groupId: string): void {
    this.pendingConnections.delete(`group_${groupId}`);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_group_chat',
        group_id: groupId
      }));
    }
  }

  disconnectFromUserStatus(): void {
    this.pendingConnections.delete('user_status');
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_user_status'
      }));
    }
  }

  disconnectFromAdminMonitor(): void {
    this.pendingConnections.delete('admin_monitor');
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_admin_monitor'
      }));
    }
  }
}

// Create singleton instance
export const webSocketClient = new WebSocketClient();