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
  first_name?: string;
  last_name?: string;
  avatar?: string;
  bio?: string;
  status: "active" | "suspended" | "banned" | "pending";
  role: "admin" | "user" | "moderator";
  online_status: "online" | "away" | "offline";
  last_seen: string;
  join_date: string;
  message_count: number;
  report_count: number;
  email_verified: boolean;
  is_staff: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  private isInitialized = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // Minimum 1000ms between requests to prevent rate limiting
  
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
    // Initialize auth tokens from localStorage on first instantiation
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.initializeAuth();
      this.isInitialized = true;
    }
  }

  // No mock data - using real Django backend

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

  // Throttle requests to prevent rate limiting
  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
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
      
      // Don't retry on 429 (rate limit) - fail immediately
      if (response.status === 429) {
        return response;
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
      // Always use real HTTP requests for Django backend integration
      return this.httpRequest<T>(endpoint, options);
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
    // Throttle requests to prevent rate limiting
    await this.throttleRequest();
    
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ensure tokens are loaded from localStorage if not already set
    if (!this.authToken && typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        this.authToken = accessToken;
      }
    }

    // Add authorization header if token exists
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else {
      console.warn(`No auth token available for ${endpoint}`);
    }

    try {
      console.log(`Sending request to ${url} with headers:`, headers);
      const response = await this.fetchWithRetry(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Backend error response:', data);
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (response.status === 404) {
          throw new Error('Resource not found');
        } else if (response.status === 400) {
          const errorMessage = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ') || 'Bad request';
          throw new Error(errorMessage);
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

  // All requests now use real HTTP backend

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; access: string; refresh: string }>> {
    try {
      const response = await this.request<{ user: User; tokens: { access: string; refresh: string } }>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.success && response.data) {
        // Extract tokens from the nested structure
        const accessToken = response.data.tokens.access;
        const refreshToken = response.data.tokens.refresh;
        
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
      }
      
      return {
        success: false,
        data: null as any,
        error: response.error || 'Login failed'
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async signup(data: SignupData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.request<{ user: User; tokens: { access: string; refresh: string } }>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (response.success && response.data) {
        // Store tokens
        this.authToken = response.data.tokens.access;
        this.refreshToken = response.data.tokens.refresh;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', response.data.tokens.access);
          localStorage.setItem('refresh_token', response.data.tokens.refresh);
        }
        
        return {
          success: true,
          data: {
            user: response.data.user,
            token: response.data.tokens.access
          }
        };
      }
      
      return response as any;
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
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
        console.log('Auth token loaded from localStorage');
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
      const filteredUpdates = { ...updates };
      if (filteredUpdates.avatar && typeof filteredUpdates.avatar === 'string') {
        delete filteredUpdates.avatar;
      }
      return this.request(`/users/admin/users/${userId}/`, {
        method: 'PUT',
        body: JSON.stringify(filteredUpdates),
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

  async createGroup(groupData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        name: groupData.name,
        description: groupData.description || '',
        avatar: groupData.avatar || null,
        group_type: groupData.group_type || 'public',
        member_ids: (groupData.member_ids || []).map((id: any) => String(id))
      };
      return this.request('/chat/groups/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create group'
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
      return this.request(`/chat/conversations/${conversationId}/messages/`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      return {
        data: null as Message,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
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
      return this.request('/analytics/data/');
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

  async uploadProfileImage(file: File): Promise<ApiResponse<{avatar_url: string}>> {
    try {
      const formData = new FormData();
      formData.append('image', file, file.name);
      
      const url = `${this.baseURL}/users/profile/upload-image/`;
      const headers: HeadersInit = {};
      
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed! status: ${response.status}`);
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload profile image'
      };
    }
  }

  async updateProfile(data: {current_password?: string; new_password?: string}): Promise<ApiResponse<User>> {
    try {
      return this.request('/users/profile/update/', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return {
        data: null as User,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  }

  async createUser(userData: {username: string; email: string; password: string; first_name?: string; last_name?: string; role?: string; status?: string}): Promise<ApiResponse<User>> {
    try {
      return this.request('/admin/users/create/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      return {
        data: null as User,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }
}

export const apiService = new ApiService();
