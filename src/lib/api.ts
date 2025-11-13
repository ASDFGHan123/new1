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

  // In-memory data storage (no localStorage)
  private mockUsers: User[] = [
    {
      id: "admin",
      username: "admin",
      email: "admin@offchat.com",
      password: "12341234",
      status: "active",
      role: "admin",
      joinDate: "2024-01-01",
      lastActive: "2 minutes ago",
      messageCount: 1250,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "user1",
      username: "john_doe",
      email: "john@example.com",
      password: "password",
      status: "active",
      role: "user",
      joinDate: "2024-01-15",
      lastActive: "1 hour ago",
      messageCount: 89,
      reportCount: 1,
      avatar: undefined
    },
    {
      id: "user2",
      username: "jane_smith",
      email: "jane@example.com",
      password: "password",
      status: "suspended",
      role: "user",
      joinDate: "2024-01-10",
      lastActive: "3 days ago",
      messageCount: 156,
      reportCount: 3,
      avatar: undefined
    }
  ];

  private mockCurrentUser: User | null = null;
  private mockToken: string | null = null;

  // Generic request method with error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Always use mock implementation (no localStorage)
      return this.mockRequest<T>(endpoint, options);
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

    const user = this.mockUsers.find(u =>
      (u.username === identifier || u.email === identifier) &&
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