export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, Function[]> = new Map();
  private connectionStateHandlers: Set<(state: ConnectionState) => void> = new Set();
  private connectionState: ConnectionState = 'disconnected';

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState('connecting');
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.setConnectionState('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const type = data.type || 'message';
            const handlers = this.messageHandlers.get(type) || [];
            handlers.forEach(handler => handler(data));
          } catch (e) {
            console.error('[WebSocket] Parse error:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.setConnectionState('error');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.setConnectionState('disconnected');
          this.attemptReconnect();
        };
      } catch (e) {
        this.setConnectionState('error');
        reject(e);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setConnectionState('reconnecting');
      console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect().catch(console.error), this.reconnectDelay);
    }
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.connectionStateHandlers.forEach(handler => handler(state));
  }

  getState(): ConnectionState {
    return this.connectionState;
  }

  onConnectionStateChange(handler: (state: ConnectionState) => void): () => void {
    this.connectionStateHandlers.add(handler);
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  sendMessage(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(data));
          resolve();
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('WebSocket not connected'));
      }
    });
  }

  on(type: string, handler: Function): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
    
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  off(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connectToConversation(conversationId: string): Promise<void> {
    return this.sendMessage({ type: 'join_conversation', conversation_id: conversationId });
  }

  disconnectFromConversation(conversationId: string) {
    this.send('leave_conversation', { conversation_id: conversationId });
  }

  connectToIndividualChat(userId: string): Promise<void> {
    return this.sendMessage({ type: 'join_individual_chat', user_id: userId });
  }

  disconnectFromIndividualChat(userId: string) {
    this.send('leave_individual_chat', { user_id: userId });
  }

  connectToGroupChat(groupId: string): Promise<void> {
    return this.sendMessage({ type: 'join_group_chat', group_id: groupId });
  }

  disconnectFromGroupChat(groupId: string) {
    this.send('leave_group_chat', { group_id: groupId });
  }

  connectToUserStatus(): Promise<void> {
    return this.sendMessage({ type: 'join_user_status' });
  }

  disconnectFromUserStatus() {
    this.send('leave_user_status', {});
  }

  connectToAdminMonitor(): Promise<void> {
    return this.sendMessage({ type: 'join_admin_monitor' });
  }

  disconnectFromAdminMonitor() {
    this.send('leave_admin_monitor', {});
  }
}

let webSocketClientInstance: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient => {
  if (!webSocketClientInstance) {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';
    const url = `${protocol}//${host}/ws/chat/`;
    webSocketClientInstance = new WebSocketClient(url);
  }
  return webSocketClientInstance;
};

export const webSocketClient = getWebSocketClient();

export const createWebSocketClient = (token: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/ws/chat/?token=${token}`;
  return new WebSocketClient(url);
};
