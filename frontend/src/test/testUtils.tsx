import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/hooks/useNotifications';

// Mock user for tests
export const mockUser = {
  id: 'test-user-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  status: 'online' as const,
  avatar: null,
  isOnline: true,
  lastSeen: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock auth context
export const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn().mockResolvedValue(mockUser),
  signup: vi.fn().mockResolvedValue(mockUser),
  logout: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn(),
  clearError: vi.fn()
};

// Mock notification context
export const mockNotificationContext = {
  notifications: [],
  unreadCount: 0,
  addNotification: vi.fn().mockReturnValue('test-notification-id'),
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

// Mock WebSocket hooks
export const mockWebSocketHook = {
  connectionState: 'connected' as const,
  isConnected: true,
  isConnecting: false,
  isDisconnected: false,
  isReconnecting: false,
  hasError: false,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  joinConversation: vi.fn().mockResolvedValue(undefined),
  leaveConversation: vi.fn(),
  joinIndividualChat: vi.fn().mockResolvedValue(undefined),
  leaveIndividualChat: vi.fn(),
  joinGroupChat: vi.fn().mockResolvedValue(undefined),
  leaveGroupChat: vi.fn(),
  joinUserStatus: vi.fn().mockResolvedValue(undefined),
  leaveUserStatus: vi.fn(),
  joinAdminMonitor: vi.fn().mockResolvedValue(undefined),
  leaveAdminMonitor: vi.fn(),
  sendTyping: vi.fn(),
  sendStopTyping: vi.fn(),
  onMessage: vi.fn().mockReturnValue(vi.fn()),
  onTyping: vi.fn().mockReturnValue(vi.fn()),
  onUserStatus: vi.fn().mockReturnValue(vi.fn()),
  onDelivery: vi.fn().mockReturnValue(vi.fn()),
  onConnectionStateChange: vi.fn().mockReturnValue(vi.fn()),
  messageDeliveryStatus: new Map()
};

export const mockTypingIndicator = {
  typingUsers: [],
  startTyping: vi.fn(),
  stopTyping: vi.fn()
};

export const mockUserPresence = {
  onlineUsers: [],
  getUserStatus: vi.fn().mockReturnValue('offline'),
  getUserLastSeen: vi.fn().mockReturnValue(null)
};

export const mockConnectionStatus = {
  connectionState: 'connected' as const,
  isConnected: true,
  isConnecting: false,
  isDisconnected: false,
  isReconnecting: false,
  hasError: false,
  statusText: 'Connected',
  statusColor: 'text-green-600'
};

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
  authContext?: Partial<typeof mockAuthContext>;
  notificationContext?: Partial<typeof mockNotificationContext>;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  authContext = {},
  notificationContext = {}
}) => {
  // Mock the context hooks
  vi.doMock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ ...mockAuthContext, ...authContext }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  }));

  vi.doMock('@/hooks/useNotifications', () => ({
    useNotifications: () => ({ ...mockNotificationContext, ...notificationContext }),
    NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  }));

  vi.doMock('@/hooks/useWebSocket', () => ({
    useWebSocket: () => mockWebSocketHook,
    useTypingIndicator: () => mockTypingIndicator,
    useUserPresence: () => mockUserPresence,
    useConnectionStatus: () => mockConnectionStatus
  }));

  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
};

// Custom render function
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions & {
    authContext?: Partial<typeof mockAuthContext>;
    notificationContext?: Partial<typeof mockNotificationContext>;
  } = {}
) => {
  const { authContext, notificationContext, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper 
      authContext={authContext}
      notificationContext={notificationContext}
    >
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };