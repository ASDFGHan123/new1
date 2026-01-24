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
  duration?: number;
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
  username: string;
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

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8000/api`;
  }
  
  return `${protocol}//${hostname}:8000/api`;
};

export const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private baseURL = API_BASE_URL;
  private isDevelopment = import.meta.env.DEV;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private isInitialized = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1000;
  
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private failedRequests: Array<{url: string, options: RequestInit, resolve: Function, reject: Function}> = [];
  private authExpiredCallback: (() => void) | null = null;

  setAuthExpiredCallback(callback: () => void) {
    this.authExpiredCallback = callback;
  }

  private notifyAuthExpired() {
    if (this.authExpiredCallback) {
      this.authExpiredCallback();
    }
  }

  constructor() {
    if (this.isDevelopment) {
      this.minRequestInterval = 0;
    }
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.initializeAuth();
      this.isInitialized = true;
    }
  }

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

  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retries: number = 3
  ): Promise<Response> {
    try {
      console.log('[API] Fetching:', url.replace(this.baseURL, ''));
      const response = await fetch(url, options);
      console.log('[API] Response status:', response.status);
      
      const authHeader = typeof options.headers === 'object' ? (options.headers as Record<string, string>)?.['Authorization'] : '';
      if (response.status === 401 && this.refreshToken && !authHeader?.includes('refresh')) {
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
          this.authToken = null;
          this.refreshToken = null;
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('offchat_user');
          this.notifyAuthExpired();
          throw new Error('AUTHENTICATION_EXPIRED');
        }
      }
      
      if (response.status === 401 && !this.refreshToken) {
        this.authToken = null;
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('offchat_user');
        this.notifyAuthExpired();
      }
      
      if (response.status === 429) {
        return response;
      }
      
      if (response.status === 401) {
        this.authToken = null;
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('offchat_user');
        this.notifyAuthExpired();
      }
      
      if (!response.ok && retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      return response;
    } catch (error) {
      console.error('[API] Fetch error:', error instanceof Error ? error.message : 'Unknown error');
      if (retries > 0 && error.message !== 'AUTHENTICATION_EXPIRED') {
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
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

  public async httpRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    await this.throttleRequest();
    
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Always initialize auth to load tokens from storage
    if (!this.authToken && typeof window !== 'undefined') {
      this.initializeAuth();
    }

    if (typeof window !== 'undefined') {
      // For admin endpoints, use admin token
      if (endpoint.includes('/admin/') || endpoint.includes('/users/admin/')) {
        let accessToken = sessionStorage.getItem('admin_access_token') || localStorage.getItem('admin_access_token');
        if (!accessToken) {
          accessToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        }
        if (accessToken) {
          this.authToken = accessToken;
        }
      } else {
        // For chat endpoints, use chat token
        let accessToken = sessionStorage.getItem('chat_access_token') || localStorage.getItem('chat_access_token');
        if (!accessToken) {
          accessToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        }
        if (accessToken) {
          this.authToken = accessToken;
        }
      }
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      console.log('[API] Request:', options.method || 'GET', url.replace(this.baseURL, ''));
      const response = await this.fetchWithRetry(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));
      console.log('[API] Response:', response.status, data);

      if (!response.ok) {
        console.error('[API] Error', response.status, ':', data);
        
        if (response.status === 401) {
          const errorMessage = data.error || data.detail || 'Authentication required';
          throw new Error(errorMessage);
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
      console.error('[API] Request failed for', endpoint, ':', error);
      
      if (error instanceof TypeError) {
        console.error('[API] Network error:', error instanceof Error ? error.message : 'Unknown error');
        return {
          data: null as T,
          success: false,
          error: 'Network error. Check if backend is running at ' + this.baseURL,
        };
      }

      if (error.message === 'AUTHENTICATION_EXPIRED') {
        this.notifyAuthExpired();
        return {
          data: null as T,
          success: false,
          error: 'Authentication failed. Please log in again.',
        };
      }
      
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; access: string; refresh: string }>> {
    try {
      const response = await this.request<any>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.success && response.data) {
        const tokens = response.data.tokens || {};
        const accessToken = tokens.access || response.data.access;
        const refreshToken = tokens.refresh || response.data.refresh;
        
        if (!accessToken || !refreshToken) {
          console.error('Token response:', response.data);
          return {
            success: false,
            data: null as any,
            error: 'Invalid token response from server'
          };
        }
        
        this.authToken = accessToken;
        this.refreshToken = refreshToken;
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('access_token', accessToken);
          sessionStorage.setItem('refresh_token', refreshToken);
        }
        
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
      console.error('Login error:', error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async signup(data: SignupData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.request<any>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (response.success && response.data) {
        const tokens = response.data.tokens || {};
        const accessToken = tokens.access || response.data.access;
        const refreshToken = tokens.refresh || response.data.refresh;
        
        if (!accessToken || !refreshToken) {
          console.error('Token response:', response.data);
          return {
            success: false,
            data: null as any,
            error: 'Invalid token response from server'
          };
        }
        
        this.authToken = accessToken;
        this.refreshToken = refreshToken;
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('access_token', accessToken);
          sessionStorage.setItem('refresh_token', refreshToken);
        }
        
        return {
          success: true,
          data: {
            user: response.data.user,
            token: accessToken
          }
        };
      }
      
      return {
        success: false,
        data: null as any,
        error: response.error || 'Registration failed'
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Server logout failed, clearing tokens locally:', error);
    } finally {
      this.authToken = null;
      this.refreshToken = null;
      this.refreshPromise = null;
      
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('offchat_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('offchat_user');
      }
    }
    
    return { data: undefined, success: true };
  }

  initializeAuth() {
    if (typeof window !== 'undefined') {
      // Try chat token first (for chat app)
      let accessToken = localStorage.getItem('chat_access_token');
      let refreshToken = localStorage.getItem('chat_refresh_token');
      
      // Fallback to admin token (for admin dashboard)
      if (!accessToken) {
        accessToken = localStorage.getItem('admin_access_token');
        refreshToken = localStorage.getItem('admin_refresh_token');
      }
      
      // Fallback to old token format
      if (!accessToken) {
        accessToken = localStorage.getItem('access_token');
        refreshToken = localStorage.getItem('refresh_token');
      }
      
      if (accessToken) {
        this.authToken = accessToken;
        console.log('Auth token loaded from storage');
      }
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', token);
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

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

  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.httpRequest<any>('/users/all-users/');
      
      if (response.success && response.data) {
        const users = response.data.users || [];
        console.log('[API] Loaded users count:', users.length);
        return {
          success: true,
          data: users
        };
      }
      
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to load users'
      };
    } catch (error) {
      console.error('[API] Error loading users:', error instanceof Error ? error.message : 'Unknown error');
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

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await this.httpRequest<any>('/chat/conversations/');
      
      if (response.success && response.data) {
        let conversations = [];
        if (Array.isArray(response.data)) {
          conversations = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          conversations = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          conversations = response.data.data;
        }
        
        console.log('[API] Loaded conversations count:', conversations.length);
        return {
          success: true,
          data: conversations
        };
      }
      
      console.warn('[API] Failed to load conversations:', response.error);
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to load conversations'
      };
    } catch (error) {
      console.error('[API] Error loading conversations:', error instanceof Error ? error.message : 'Unknown error');
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
        body: JSON.stringify({ participant_ids: participants }),
      });
    } catch (error) {
      return {
        data: null as Conversation,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation'
      };
    }
  }

  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    try {
      const endpoint = `/chat/conversations/${conversationId}/`;
      return this.request(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete conversation'
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
      const response = await this.httpRequest<any>(`/chat/conversations/${conversationId}/messages/`);
      
      if (response.success && response.data) {
        let messages = [];
        if (Array.isArray(response.data)) {
          messages = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          messages = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          messages = response.data.data;
        }
        
        console.log('[API] Loaded messages count:', messages.length);
        return {
          success: true,
          data: messages
        };
      }
      
      console.warn('[API] Failed to load messages:', response.error);
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to load messages'
      };
    } catch (error) {
      console.error('[API] Error loading messages:', error instanceof Error ? error.message : 'Unknown error');
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      };
    }
  }

  async sendMessage(conversationId: string, content: string, attachments?: File[]): Promise<ApiResponse<Message>> {
    try {
      await this.throttleRequest();
      const url = `${this.baseURL}/chat/conversations/${conversationId}/messages/`;
      const formData = new FormData();
      formData.append('content', content);
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(file => formData.append('attachments', file));
      }
      
      const headers: HeadersInit = {};
      if (typeof window !== 'undefined') {
        // Try chat token first (for chat app)
        let accessToken = sessionStorage.getItem('chat_access_token');
        if (!accessToken) {
          accessToken = localStorage.getItem('chat_access_token');
        }
        
        // Fallback to admin token (for admin dashboard)
        if (!accessToken) {
          accessToken = sessionStorage.getItem('admin_access_token');
          if (!accessToken) {
            accessToken = localStorage.getItem('admin_access_token');
          }
        }
        
        // Fallback to old token format
        if (!accessToken) {
          accessToken = sessionStorage.getItem('access_token');
          if (!accessToken) {
            accessToken = localStorage.getItem('access_token');
          }
        }
        
        if (accessToken) {
          this.authToken = accessToken;
        }
      }
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
        throw new Error(data.detail || data.error || 'Failed to send message');
      }
      
      return { data, success: true };
    } catch (error) {
      return {
        data: null as Message,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

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
      
      if (typeof window !== 'undefined') {
        // Try chat token first (for chat app)
        let token = sessionStorage.getItem('chat_access_token');
        if (!token) {
          token = localStorage.getItem('chat_access_token');
        }
        
        // Fallback to admin token (for admin dashboard)
        if (!token) {
          token = sessionStorage.getItem('admin_access_token');
          if (!token) {
            token = localStorage.getItem('admin_access_token');
          }
        }
        
        // Fallback to old token format
        if (!token) {
          token = sessionStorage.getItem('access_token');
          if (!token) {
            token = localStorage.getItem('access_token');
          }
        }
        
        if (token) {
          this.authToken = token;
        }
      }
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
      return this.request('/users/profile/', {
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

  async createUser(userData: {username: string; email: string; password: string; first_name?: string; last_name?: string; role?: string; status?: string; father_name?: string; position?: string; phone_number?: string; id_card_number?: string; national_id_card_number?: string; description?: string}): Promise<ApiResponse<User>> {
    try {
      return this.request('/users/admin/users/', {
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
