// API Service Layer
// This provides a clean interface for all API calls
// Can be easily switched between mock and real implementations

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  status: "active" | "suspended" | "banned" | "pending";
  role: string;
  joinDate: string;
  lastActive: string;
  messageCount: number;
  reportCount: number;
  avatar?: string;
}

export interface Conversation {
  id: string;
  type: "private" | "group";
  title: string;
  participants: string[];
  messages: Message[];
  createdAt: string;
  isActive: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  duration?: number; // For audio/video attachments
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type?: "system" | "admin" | "user";
  attachments?: Attachment[];
  edited?: boolean;
  editedAt?: Date;
  forwarded?: boolean;
  originalSender?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

export interface LoginCredentials {
  username: string; // Django expects username
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface ModerationAction {
  type: "warn" | "suspend" | "ban";
  duration?: string;
  reason: string;
}

export interface DataExportOptions {
  messages: boolean;
  profile: boolean;
  activity: boolean;
  connections: boolean;
}

class ApiService {
  private baseURL = this.getApiBaseUrl();
  private isDevelopment = import.meta.env.DEV;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  
  // Get API base URL dynamically based on current host
  private getApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl;
    }
    
    // Auto-detect based on current window location
    const hostname = window.location.hostname;
    const port = '8000';
    
    // If accessing from localhost or same machine, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}/api`;
    }
    
    // If accessing from network, use the current host
    return `http://${hostname}:${port}/api`;
  }
  
  // Get auth token for WebSocket connections
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private failedRequests: Array<{url: string, options: RequestInit, resolve: Function, reject: Function}> = [];

  constructor() {
    // Initialize auth tokens from localStorage
    this.initializeAuth();
  }

  // In-memory data storage (no localStorage)
  private mockUsers: User[] = [
    {
      id: "admin",
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      status: "active",
      role: "admin",
      joinDate: "2024-01-01",
      lastActive: "2 minutes ago",
      messageCount: 0,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "testuser_1764652403",
      username: "testuser_1764652403",
      email: "testuser_1764652403@example.com",
      password: "password",
      status: "pending",
      role: "user",
      joinDate: "2024-12-01",
      lastActive: "Never",
      messageCount: 0,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "testuser123",
      username: "testuser123",
      email: "testuser123@example.com",
      password: "password",
      status: "pending",
      role: "user",
      joinDate: "2024-12-01",
      lastActive: "Never",
      messageCount: 0,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "suspended_user",
      username: "suspended_user",
      email: "suspended@example.com",
      password: "password",
      status: "suspended",
      role: "user",
      joinDate: "2024-11-15",
      lastActive: "5 days ago",
      messageCount: 0,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "bob_wilson",
      username: "bob_wilson",
      email: "bob@example.com",
      password: "password",
      status: "active",
      role: "moderator",
      joinDate: "2024-10-20",
      lastActive: "1 hour ago",
      messageCount: 0,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "jane_smith",
      username: "jane_smith",
      email: "jane@example.com",
      password: "password",
      status: "active",
      role: "user",
      joinDate: "2024-09-10",
      lastActive: "30 minutes ago",
      messageCount: 0,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "john_doe",
      username: "john_doe",
      email: "john@example.com",
      password: "password",
      status: "active",
      role: "user",
      joinDate: "2024-08-15",
      lastActive: "2 hours ago",
      messageCount: 0,
      reportCount: 0,
      avatar: undefined
    }
  ];

  private mockCurrentUser: User | null = null;
  private mockToken: string | null = null;

  // Refresh token mechanism
  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = fetch(`${this.baseURL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: this.refreshToken }),
    })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      this.authToken = data.access;
      this.refreshToken = data.refresh;
      this.refreshPromise = null;
      return data.access;
    })
    .catch((error) => {
      this.refreshPromise = null;
      throw error;
    });

    return this.refreshPromise;
  }

  // Retry mechanism for failed requests
  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retries: number = 3
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      // If we get a 401 and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken && !options.headers?.['Authorization']?.includes('refresh')) {
        try {
          const newToken = await this.refreshAccessToken();
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          };
          return this.fetchWithRetry(url, newOptions, retries - 1);
        } catch (refreshError) {
          // If refresh fails, clear tokens and return a specific error
          this.authToken = null;
          this.refreshToken = null;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw new Error('AUTHENTICATION_EXPIRED');
        }
      }
      
      if (!response.ok && retries > 0) {
        // Exponential backoff
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      return response;
    } catch (error) {
      if (retries > 0 && error.message !== 'AUTHENTICATION_EXPIRED') {
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  // Enhanced request method with error handling and retry logic
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Check if real data usage is explicitly enabled
      const useRealData = import.meta.env.VITE_USE_REAL_DATA === 'true';
      
      // For authentication endpoints, always use real HTTP requests if enabled
      // For other endpoints, use real HTTP requests only if we have a valid token
      const isAuthEndpoint = endpoint.startsWith('/auth/');
      
      if (useRealData && (isAuthEndpoint || this.authToken)) {
        return this.httpRequest<T>(endpoint, options);
      } else {
        return this.mockRequest<T>(endpoint, options);
      }
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Real HTTP request implementation with retry logic
  private async httpRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (response.status === 404) {
          throw new Error('Resource not found');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        const errorMessage = data.detail || data.message || data.error || 
          (typeof data === 'string' ? data : `HTTP error! status: ${response.status}`);
        throw new Error(errorMessage);
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // Check if it's a network error (no internet, server down, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          data: null as T,
          success: false,
          error: 'Network error. Please check your internet connection and try again.',
        };
      }

      // Check if authentication expired
      if (error.message === 'AUTHENTICATION_EXPIRED') {
        return {
          data: null as T,
          success: false,
          error: 'Authentication failed. Please log in again.',
        };
      }
      
      // Return structured error response
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Mock implementation for development
  private async mockRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const method = options.method || 'GET';
    
    // Convert body to string if it exists
    const bodyString = options.body ?
      (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) :
      null;

    try {
      switch (endpoint) {
        case '/auth/login':
          return this.mockLogin(bodyString!) as ApiResponse<T>;
        case '/auth/signup':
          return this.mockSignup(bodyString!) as ApiResponse<T>;
        case '/auth/logout':
          return this.mockLogout() as ApiResponse<T>;
        case '/users':
        case '/users/admin/users/':
          return this.mockGetUsers() as ApiResponse<T>;
        case '/users/profile':
          return this.mockGetUserProfile() as ApiResponse<T>;
        case '/conversations':
          return this.mockGetConversations() as ApiResponse<T>;
        case '/messages':
          return this.mockGetMessages() as ApiResponse<T>;
        default:
          if (endpoint.startsWith('/users/') && method === 'PUT') {
            return this.mockUpdateUser(endpoint.split('/')[2], bodyString!) as ApiResponse<T>;
          }
          if (endpoint.startsWith('/users/') && method === 'DELETE') {
            return this.mockDeleteUser(endpoint.split('/')[2]) as ApiResponse<T>;
          }
          if (endpoint.includes('/admin/users/') && method === 'PUT') {
            const userId = endpoint.split('/admin/users/')[1].replace('/', '');
            return this.mockUpdateUser(userId, bodyString!) as ApiResponse<T>;
          }
          if (endpoint.includes('/admin/users/') && method === 'DELETE') {
            const userId = endpoint.split('/admin/users/')[1].replace('/', '');
            return this.mockDeleteUser(userId) as ApiResponse<T>;
          }
          if (endpoint.includes('/admin/users/') && method === 'POST') {
            if (endpoint.includes('/approve/')) {
              const userId = endpoint.split('/admin/users/')[1].split('/')[0];
              return this.mockApproveUser(userId) as ApiResponse<T>;
            }
            if (endpoint.includes('/force-logout/')) {
              const userId = endpoint.split('/admin/users/')[1].split('/')[0];
              return this.mockForceLogoutUser(userId) as ApiResponse<T>;
            }
          }
          throw new Error(`Mock endpoint not implemented: ${endpoint}`);
      }
    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Mock error',
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; access: string; refresh: string }>> {
    try {
      console.log('=== API SERVICE LOGIN DEBUG ===');
      console.log('Credentials:', credentials);
      console.log('Base URL:', this.baseURL);
      
      const response = await this.request<{ user: User; tokens: { access: string; refresh: string } }>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        console.log('=== SUCCESSFUL LOGIN ===');
        console.log('Response data:', response.data);
        
        // Extract tokens from the nested structure
        const accessToken = response.data.tokens.access;
        const refreshToken = response.data.tokens.refresh;
        
        console.log('Access token:', accessToken);
        console.log('Refresh token:', refreshToken);
        
        // Store both tokens
        this.authToken = accessToken;
        this.refreshToken = refreshToken;
        
        // Store tokens in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }
        
        // Return data in the expected format
        return {
          success: true,
          data: {
            user: response.data.user,
            access: accessToken,
            refresh: refreshToken
          }
        };
      } else {
        console.log('=== LOGIN FAILED ===');
        console.log('Error:', response.error);
      }
      
      // If the request failed, return a properly structured error response
      return {
        success: false,
        data: null as any,
        error: response.error || 'Login failed'
      };
    } catch (error) {
      console.log('=== LOGIN EXCEPTION ===');
      console.error('Exception:', error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async signup(data: SignupData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      // Try to logout on server
      await this.request('/auth/logout/', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Server logout failed, clearing tokens locally:', error);
    } finally {
      // Clear tokens regardless of request success
      this.authToken = null;
      this.refreshToken = null;
      this.refreshPromise = null;
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    
    return { data: undefined, success: true };
  }

  // Initialize tokens from localStorage (call on app start)
  initializeAuth() {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken) {
        this.authToken = accessToken;
      }
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }
    }
  }

  // Helper method to set auth token manually
  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  // Helper method to get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // Verify token validity
  async verifyToken(): Promise<boolean> {
    if (!this.authToken) return false;
    
    try {
      const response = await this.request('/auth/verify/', {
        method: 'POST',
        body: JSON.stringify({ token: this.authToken }),
      });
      
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // User management
  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.request<{count: number; next: string | null; previous: string | null; results: User[]}>('/users/admin/users/');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.results
        };
      }
      
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to load users'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to load users'
      };
    }
  }

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request('/auth/profile/');
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      return this.request(`/users/admin/users/${userId}/`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      return {
        data: null as User,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/users/admin/users/${userId}/`, {
        method: 'DELETE',
      });
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }

  async approveUser(userId: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/users/admin/users/${userId}/approve/`, {
        method: 'POST',
      });
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve user'
      };
    }
  }

  async suspendUser(userId: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/users/admin/users/${userId}/suspend/`, {
        method: 'POST',
      });
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suspend user'
      };
    }
  }

  async banUser(userId: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/users/admin/users/${userId}/ban/`, {
        method: 'POST',
      });
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ban user'
      };
    }
  }

  async forceLogoutUser(userId: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/users/admin/users/${userId}/force-logout/`, {
        method: 'POST',
      });
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to force logout user'
      };
    }
  }

  // Chat and conversations
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await this.request<{count: number; next: string | null; previous: string | null; results: Conversation[]}>('/chat/conversations/');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.results
        };
      }
      
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to load conversations'
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load conversations'
      };
    }
  }

  async createConversation(participants: string[]): Promise<ApiResponse<Conversation>> {
    try {
      return this.request('/chat/conversations/', {
        method: 'POST',
        body: JSON.stringify({ participants }),
      });
    } catch (error) {
      return {
        data: null as Conversation,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation'
      };
    }
  }

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    try {
      const response = await this.request<{count: number; next: string | null; previous: string | null; results: Message[]}>(`/chat/conversations/${conversationId}/messages/`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.results
        };
      }
      
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to load messages'
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      };
    }
  }

  async sendMessage(conversationId: string, content: string, attachments?: File[]): Promise<ApiResponse<Message>> {
    try {
      // If there are attachments, we need to upload them first
      let uploadedAttachments: Attachment[] = [];
      
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(file => this.uploadAttachment(file));
        const uploadResults = await Promise.all(uploadPromises);
        uploadedAttachments = uploadResults
          .filter(result => result.success)
          .map(result => result.data);
      }

      return this.request(`/chat/conversations/${conversationId}/messages/`, {
        method: 'POST',
        body: JSON.stringify({ 
          content, 
          attachments: uploadedAttachments 
        }),
      });
    } catch (error) {
      return {
        data: null as Message,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  async uploadAttachment(file: File): Promise<ApiResponse<Attachment>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const url = `${this.baseURL}/chat/upload/`;
      const headers: HeadersInit = {};
      
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || `Upload failed! status: ${response.status}`);
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as Attachment,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }

  // Admin dashboard methods
  async getDashboardStats(): Promise<ApiResponse<any>> {
    try {
      return this.request('/admin/dashboard/stats/');
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard stats'
      };
    }
  }

  async getAuditLogs(): Promise<ApiResponse<any[]>> {
    try {
      return this.request('/admin/audit-logs/');
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load audit logs'
      };
    }
  }

  async exportUserData(userId: string, options: DataExportOptions): Promise<ApiResponse<Blob>> {
    return this.request(`/admin/users/${userId}/export`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async deleteUserData(userId: string, options: DataExportOptions): Promise<ApiResponse<void>> {
    return this.request(`/admin/users/${userId}/data`, {
      method: 'DELETE',
      body: JSON.stringify(options),
    });
  }

  async getAnalytics(): Promise<ApiResponse<any>> {
    try {
      return this.request('/admin/analytics/');
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics data'
      };
    }
  }

  // Message Templates
  async getMessageTemplates(): Promise<ApiResponse<MessageTemplate[]>> {
    try {
      const response = await this.request<MessageTemplate[]>('/admin/message-templates/');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to load message templates'
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load message templates'
      };
    }
  }

  async createMessageTemplate(template: Omit<MessageTemplate, 'id'>): Promise<ApiResponse<MessageTemplate>> {
    try {
      return this.request('/admin/message-templates/', {
        method: 'POST',
        body: JSON.stringify(template),
      });
    } catch (error) {
      return {
        data: null as MessageTemplate,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create message template'
      };
    }
  }

  async updateMessageTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<ApiResponse<MessageTemplate>> {
    try {
      return this.request(`/admin/message-templates/${templateId}/`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      return {
        data: null as MessageTemplate,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update message template'
      };
    }
  }

  async deleteMessageTemplate(templateId: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/admin/message-templates/${templateId}/`, {
        method: 'DELETE',
      });
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete message template'
      };
    }
  }

  async useMessageTemplate(templateId: string): Promise<ApiResponse<{usage_count: number}>> {
    try {
      return this.request(`/admin/message-templates/${templateId}/use/`, {
        method: 'POST',
      });
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record template usage'
      };
    }
  }

  // Mock implementations
  private mockLogin(body: string): ApiResponse<{ user: User; token: string }> {
    const { username, password } = JSON.parse(body);

    const user = this.mockUsers.find(u =>
      (u.username === username || u.email === username) &&
      u.password === password &&
      u.status === 'active'
    );

    if (!user) {
      throw new Error('Invalid credentials or account not approved');
    }

    const token = `mock-jwt-${user.id}-${Date.now()}`;
    this.mockToken = token;
    this.mockCurrentUser = { ...user };

    const { password: _, ...userWithoutPassword } = user;
    return {
      data: { user: userWithoutPassword, token },
      success: true,
    };
  }

  private mockSignup(body: string): ApiResponse<{ user: User; token: string }> {
    const { username, email, password } = JSON.parse(body);

    if (this.mockUsers.some(u => u.username === username || u.email === email)) {
      throw new Error('Username or email already exists');
    }

    const newUser: User = {
      id: username,
      username,
      email,
      password,
      status: 'pending',
      role: 'user',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: 'Never',
      messageCount: 0,
      reportCount: 0,
    };

    this.mockUsers.push(newUser);

    const token = `mock-jwt-${newUser.id}-${Date.now()}`;
    this.mockToken = token;
    this.mockCurrentUser = null; // New users need approval

    const { password: _, ...userWithoutPassword } = newUser;
    return {
      data: { user: userWithoutPassword, token },
      success: true,
    };
  }

  private mockLogout(): ApiResponse<void> {
    this.mockToken = null;
    this.mockCurrentUser = null;
    return { data: undefined, success: true };
  }

  private mockGetUsers(): ApiResponse<User[]> {
    const users = this.mockUsers.map(({ password, ...user }) => user);
    return { data: users, success: true };
  }

  private mockGetUserProfile(): ApiResponse<User> {
    if (!this.mockCurrentUser) {
      throw new Error('Not authenticated');
    }

    const { password, ...userWithoutPassword } = this.mockCurrentUser;
    return { data: userWithoutPassword, success: true };
  }

  private mockUpdateUser(userId: string, body: string): ApiResponse<User> {
    const updates = JSON.parse(body);
    const userIndex = this.mockUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) throw new Error('User not found');

    this.mockUsers[userIndex] = { ...this.mockUsers[userIndex], ...updates };

    const { password, ...userWithoutPassword } = this.mockUsers[userIndex];
    return { data: userWithoutPassword, success: true };
  }

  private mockDeleteUser(userId: string): ApiResponse<void> {
    this.mockUsers = this.mockUsers.filter(u => u.id !== userId);
    return { data: undefined, success: true };
  }

  private mockApproveUser(userId: string): ApiResponse<void> {
    const userIndex = this.mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    this.mockUsers[userIndex] = { ...this.mockUsers[userIndex], status: 'active' };
    return { data: undefined, success: true };
  }

  private mockForceLogoutUser(userId: string): ApiResponse<void> {
    // Mock force logout - just return success
    return { data: undefined, success: true };
  }

  private mockGetConversations(): ApiResponse<Conversation[]> {
    // Return mock conversations
    return {
      data: [
        {
          id: "general",
          type: "group",
          title: "General Chat",
          participants: ["admin", "user1"],
          messages: [
            {
              id: "1",
              content: "Welcome to OffChat!",
              sender: "system",
              timestamp: new Date().toISOString(),
              type: "system"
            }
          ],
          createdAt: new Date().toISOString(),
          isActive: true
        }
      ],
      success: true
    };
  }

  private mockGetMessages(): ApiResponse<Message[]> {
    return { data: [], success: true };
  }
}

export const apiService = new ApiService();