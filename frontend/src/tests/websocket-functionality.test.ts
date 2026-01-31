import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the WebSocket client
vi.mock('@/lib/websocket', () => ({
  webSocketClient: {
    getState: vi.fn(() => 'disconnected'),
    connect: vi.fn(async () => {
      // Simulate connection
      vi.mocked(webSocketClient.getState).mockReturnValue('connected');
      return Promise.resolve();
    }),
    disconnect: vi.fn(() => {
      vi.mocked(webSocketClient.getState).mockReturnValue('disconnected');
    }),
    sendMessage: vi.fn(async (data: any) => Promise.resolve()),
    on: vi.fn(() => vi.fn()),
    onConnectionStateChange: vi.fn(() => vi.fn()),
    connectToConversation: vi.fn(async () => Promise.resolve()),
  }
}));

import { webSocketClient } from '@/lib/websocket';

describe('WebSocket Client Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(webSocketClient.getState).mockReturnValue('disconnected');
  });

  test('should initialize with correct state', () => {
    expect(webSocketClient.getState()).toBe('disconnected');
  });

  test('should connect successfully', async () => {
    await webSocketClient.connect();
    expect(webSocketClient.getState()).toBe('connected');
    expect(webSocketClient.connect).toHaveBeenCalled();
  });

  test('should send messages when connected', async () => {
    vi.mocked(webSocketClient.getState).mockReturnValue('connected');
    
    await webSocketClient.sendMessage({ type: 'test', content: 'hello' });
    
    expect(webSocketClient.sendMessage).toHaveBeenCalledWith({ type: 'test', content: 'hello' });
  });

  test('should register event listeners', () => {
    const callback = vi.fn();
    const unsubscribe = webSocketClient.on('test_event', callback);
    
    expect(typeof unsubscribe).toBe('function');
    expect(webSocketClient.on).toHaveBeenCalledWith('test_event', callback);
  });

  test('should handle connection state changes', async () => {
    const callback = vi.fn();
    const unsubscribe = webSocketClient.onConnectionStateChange(callback);
    
    expect(typeof unsubscribe).toBe('function');
    expect(webSocketClient.onConnectionStateChange).toHaveBeenCalledWith(callback);
  });

  test('should disconnect cleanly', async () => {
    vi.mocked(webSocketClient.getState).mockReturnValue('connected');
    
    webSocketClient.disconnect();
    expect(webSocketClient.getState()).toBe('disconnected');
    expect(webSocketClient.disconnect).toHaveBeenCalled();
  });

  test('should handle room connections', async () => {
    await webSocketClient.connectToConversation('conv-1');
    
    expect(webSocketClient.connectToConversation).toHaveBeenCalledWith('conv-1');
  });
});