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

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type?: "system" | "admin" | "user";
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
  identifier: string; // username or email
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
  private baseURL = process.env.REACT_APP_API_URL || '/api';
  private isDevelopment = process.env.NODE_ENV === 'development';

  // Generic request method with error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // In development, simulate API calls with localStorage
      if (this.isDevelopment) {
        return this.mockRequest<T>(endpoint, options);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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

    try {
      switch (endpoint) {
        case '/auth/login':
          return this.mockLogin(options.body) as ApiResponse<T>;
        case '/auth/signup':
          return this.mockSignup(options.body) as ApiResponse<T>;
        case '/auth/logout':
          return this.mockLogout() as ApiResponse<T>;
        case '/users':
          return this.mockGetUsers() as ApiResponse<T>;
        case '/users/profile':
          return this.mockGetUserProfile() as ApiResponse<T>;
        case '/conversations':
          return this.mockGetConversations() as ApiResponse<T>;
        case '/messages':
          return this.mockGetMessages() as ApiResponse<T>;
        default:
          if (endpoint.startsWith('/users/') && method === 'PUT') {
            return this.mockUpdateUser(endpoint.split('/')[2], options.body) as ApiResponse<T>;
          }
          if (endpoint.startsWith('/users/') && method === 'DELETE') {
            return this.mockDeleteUser(endpoint.split('/')[2]) as ApiResponse<T>;
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
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(data: SignupData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User management
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/users');
  }

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request('/users/profile');
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Conversations and messages
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.request('/conversations');
  }

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return this.request(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    return this.request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Admin actions
  async moderateUser(userId: string, action: ModerationAction): Promise<ApiResponse<void>> {
    return this.request(`/admin/users/${userId}/moderate`, {
      method: 'POST',
      body: JSON.stringify(action),
    });
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

  // Mock implementations
  private mockLogin(body: string): ApiResponse<{ user: User; token: string }> {
    const { identifier, password } = JSON.parse(body);
    const users = this.getStoredUsers();

    const user = users.find(u =>
      (u.username === identifier || u.email === identifier) &&
      u.password === password &&
      u.status === 'active'
    );

    if (!user) {
      throw new Error('Invalid credentials or account not approved');
    }

    const token = `mock-jwt-${user.id}-${Date.now()}`;
    localStorage.setItem('auth-token', token);

    const { password: _, ...userWithoutPassword } = user;
    return {
      data: { user: userWithoutPassword, token },
      success: true,
    };
  }

  private mockSignup(body: BodyInit | null | undefined): ApiResponse<{ user: User; token: string }> {
    if (!body || typeof body !== 'string') {
      throw new Error('Invalid request body');
    }
    const { username, email, password } = JSON.parse(body);
    const users = this.getStoredUsers();

    if (users.some(u => u.username === username || u.email === email)) {
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

    users.push(newUser);
    localStorage.setItem('offchat-users', JSON.stringify(users));

    const token = `mock-jwt-${newUser.id}-${Date.now()}`;
    localStorage.setItem('auth-token', token);

    const { password: _, ...userWithoutPassword } = newUser;
    return {
      data: { user: userWithoutPassword, token },
      success: true,
    };
  }

  private mockLogout(): ApiResponse<void> {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('offchat-current-user');
    return { data: undefined, success: true };
  }

  private mockGetUsers(): ApiResponse<User[]> {
    const users = this.getStoredUsers().map(({ password, ...user }) => user);
    return { data: users, success: true };
  }

  private mockGetUserProfile(): ApiResponse<User> {
    const currentUser = localStorage.getItem('offchat-current-user');
    if (!currentUser) throw new Error('Not authenticated');

    const user = JSON.parse(currentUser);
    return { data: user, success: true };
  }

  private mockUpdateUser(userId: string, body: BodyInit | null | undefined): ApiResponse<User> {
    if (!body || typeof body !== 'string') {
      throw new Error('Invalid request body');
    }
    const updates = JSON.parse(body);
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) throw new Error('User not found');

    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem('offchat-users', JSON.stringify(users));

    const { password, ...userWithoutPassword } = users[userIndex];
    return { data: userWithoutPassword, success: true };
  }

  private mockDeleteUser(userId: string): ApiResponse<void> {
    const users = this.getStoredUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('offchat-users', JSON.stringify(filteredUsers));
    return { data: undefined, success: true };
  }

  private mockGetConversations(): ApiResponse<Conversation[]> {
    const conversations = JSON.parse(localStorage.getItem('offchat-conversations') || '[]');
    return { data: conversations, success: true };
  }

  private mockGetMessages(): ApiResponse<Message[]> {
    // Simplified - would need conversationId parameter
    return { data: [], success: true };
  }

  private getStoredUsers(): User[] {
    return JSON.parse(localStorage.getItem('offchat-users') || '[]');
  }
}

export const apiService = new ApiService();