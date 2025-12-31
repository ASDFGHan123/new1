import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LoadingPage } from "@/components/ui/loading";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/hooks/useNotifications";
import { useRTL } from "@/hooks/useRTL";
import { apiService, User, Conversation, MessageTemplate, Role } from "@/lib/api";

// Initialize auth tokens from localStorage on app start
apiService.initializeAuth();

// Type definitions to match AdminDashboard interfaces
interface AppUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  status: "active" | "suspended" | "banned";
  role: string;
  joinDate: string;
  lastActive: string;
  messageCount: number;
  reportCount: number;
  avatar?: string;
}

interface AppConversation {
  id: string;
  type: "private" | "group";
  title: string;
  participants: string[];
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string;
    type?: string;
  }>;
  createdAt: string;
  isActive: boolean;
}

interface AppMessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface AppRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDemo = lazy(() => import("./pages/AdminDemo"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnifiedChatPage = lazy(() => import("./pages/UnifiedChatPage").then(module => ({ default: module.UnifiedChatPage })));
const LoginForm = lazy(() => import("@/components/auth/LoginForm").then(module => ({ default: module.LoginForm })));
const SignupForm = lazy(() => import("@/components/auth/SignupForm").then(module => ({ default: module.SignupForm })));

const queryClient = new QueryClient();

  const AppContent = () => {
    const { t } = useTranslation();
    useRTL();
  // Admin force logout user
  const handleForceLogoutUser = (id: string) => {
    let username = id;
    const userObj = users.find(u => u.id === id);
    if (userObj) username = userObj.username;
    
    // If the user is currently logged in, log them out
    if (user && user.id === id) {
      setUser(null);
      alert(t('auth.loggedOutByAdmin'));
    }
    
    // Show message to admin
    alert(t('users.userForcefullyLoggedOut', { username }));
  };

  // Admin delete user
  const handleDeleteUser = (id: string) => {
    if (id === "admin") {
      alert(t('users.cannotDeleteAdmin'));
      return;
    }
    const userObj = users.find(u => u.id === id);
    const username = userObj ? userObj.username : id;
    setUsers(prev => prev.filter(u => u.id !== id));
    
    // If the deleted user is currently logged in, log them out
    if (user && user.id === id) {
      setUser(null);
    }
    alert(t('users.userDeleted', { username }));
  };

  // Demo authentication state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>("login");
  const [user, setUser] = useState<null | { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string }>(() => {
    // Try to restore user from localStorage on app start
    try {
      const savedUser = localStorage.getItem('offchat_user');
      const accessToken = localStorage.getItem('access_token');
      // Only restore user if we have a valid token
      return (savedUser && accessToken) ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  // Messages and conversations
  const [conversations, setConversations] = useState<AppConversation[]>([
    {
      id: "general",
      type: "group" as const,
      title: "General Chat",
      participants: ["admin", "user1", "user2"],
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
  ]);

  const [messageTemplates, setMessageTemplates] = useState<AppMessageTemplate[]>([
    {
      id: "welcome",
      name: "Welcome Message",
      content: "Welcome to OffChat! We're excited to have you here.",
      category: "system"
    },
    {
      id: "maintenance",
      name: "Maintenance Notice",
      content: "The system will be undergoing maintenance from {start_time} to {end_time}.",
      category: "announcement"
    }
  ]);

  // Roles and permissions
  const [roles, setRoles] = useState<AppRole[]>([
    {
      id: "admin",
      name: "Administrator",
      description: "Full system access",
      permissions: [
        "user_management", "role_management", "system_settings",
        "message_monitoring", "audit_logs", "backup_management",
        "send_messages", "manage_conversations", "view_analytics"
      ],
      isDefault: true,
      createdAt: "2024-01-01"
    },
    {
      id: "moderator",
      name: "Moderator",
      description: "Content moderation and user management",
      permissions: [
        "user_management", "message_monitoring", "manage_conversations",
        "send_messages", "view_analytics"
      ],
      isDefault: true,
      createdAt: "2024-01-01"
    },
    {
      id: "user",
      name: "User",
      description: "Basic user access",
      permissions: ["send_messages", "manage_conversations"],
      isDefault: true,
      createdAt: "2024-01-01"
    }
  ]);

  // Real data from API
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users from API (only after authentication)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have an auth token and are authenticated
        const authToken = apiService.getAuthToken();
        if (!authToken) {
          // Not authenticated yet, no data
          setUsers([]);
          setLoading(false);
          return;
        }

        const response = await apiService.getUsers();
        if (response.success && response.data) {
          setUsers(response.data as AppUser[]);
        } else if (response.error === 'Authentication failed. Please log in again.') {
          // Authentication expired, clear tokens
          apiService.logout();
          setUsers([]);
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to load users: ' + (response.error || 'Unknown error'));
          setUsers([]);
        }
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to connect to server');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Only load users if we have a logged in admin user
    if (user && user.role === 'admin') {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Update current user
  const handleUpdateUser = (updates: Partial<typeof user>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  // Admin add user (approved by default)
  const handleAddUser = (username: string, password: string, role: string, avatar?: string) => {
    if (users.some(u => u.username === username)) {
      alert(t('users.usernameExists'));
      return;
    }
    const newUser = {
      id: String(Date.now()),
      username,
      email: `${username}@example.com`,
      password,
      status: "active" as const,
      role,
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: "Just now",
      messageCount: 0,
      reportCount: 0,
      avatar: avatar || undefined
    };
    setUsers(prev => [...prev, newUser]);
    alert(t('users.userAddedApproved'));
  };

  // Only allow login for approved users, with specific error messages
  const handleLogin = async (identifier: string, password: string) => {
    try {
      const response = await apiService.login({ username: identifier, password });
      
      if (response.success && response.data) {
        const userData = response.data;
        localStorage.setItem('access_token', userData.access);
        localStorage.setItem('refresh_token', userData.refresh);
        apiService.setAuthToken(userData.access);
        
        const userObj = { 
          id: String(userData.user.id), 
          username: userData.user.username, 
          status: "online" as const, 
          role: userData.user.role,
          avatar: userData.user.avatar 
        };
        setUser(userObj);
        localStorage.setItem('offchat_user', JSON.stringify(userObj));
        return true;
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Login failed";
      throw new Error(errorMsg);
    }
  };

  // Signup always creates a pending user
  const handleSignup = async (username: string, email: string, password: string) => {
    try {
      const response = await apiService.signup({ username, email, password });
      
      if (response.success && response.data) {
        alert(t('auth.accountCreatedAdminApproval'));
        setAuthMode('login');
        return true;
      } else {
        alert(response.error || t('auth.signupFailed'));
        return false;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Signup failed");
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('offchat_user');
    setUser(null);
  };

  // Admin login handler
  const handleAdminLogin = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ username: identifier, password });
      
      if (response.success && response.data) {
        const userData = response.data;
        console.log('Login response user:', userData.user);
        
        if (userData.user.role !== "admin" && !userData.user.is_staff) {
          throw new Error("Access denied. Admin privileges required.");
        }
        
        localStorage.setItem('access_token', userData.access);
        localStorage.setItem('refresh_token', userData.refresh);
        apiService.setAuthToken(userData.access);
        
        const userObj = { 
          id: String(userData.user.id), 
          username: userData.user.username, 
          status: "online" as const, 
          role: userData.user.role,
          avatar: userData.user.avatar 
        };
        setUser(userObj);
        localStorage.setItem('offchat_user', JSON.stringify(userObj));
        
        const usersResponse = await apiService.getUsers();
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data as AppUser[]);
        }
        
        return true;
      } else {
        throw new Error(response.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Admin actions
  const approveUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "active" } : u));
  };
  const rejectUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "banned" } : u));
  };
  const updateUser = (id: string, updates: Partial<typeof users[0]>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  // Role management functions
  const addRole = (name: string, description: string, permissions: string[]) => {
    const newRole = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      permissions,
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = (id: string, updates: Partial<typeof roles[0]>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRole = (id: string) => {
    // Don't allow deleting default roles
    const role = roles.find(r => r.id === id);
    if (role?.isDefault) {
      alert(t('roles.cannotDeleteDefault'));
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== id));
    // Update users with this role to default user role
    setUsers(prev => prev.map(u => u.role === id ? { ...u, role: "user" } : u));
  };

  // Check if user has permission
  const hasPermission = (userId: string, permission: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    const userRole = roles.find(r => r.id === user.role);
    if (!userRole) return false;
    return userRole.permissions.includes(permission);
  };

  // Messaging functions
  const sendSystemMessage = (conversationId: string, content: string) => {
    const message = {
      id: Date.now().toString(),
      content,
      sender: "system",
      timestamp: new Date().toISOString(),
      type: "system"
    };
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: [...conv.messages, message] }
        : conv
    ));
  };

  const sendBulkMessage = (userIds: string[], content: string) => {
    userIds.forEach(userId => {
      // Create individual conversations if they don't exist
      const existingConv = conversations.find(c => c.type === "private" && c.participants.includes(userId));
      if (existingConv) {
        sendSystemMessage(existingConv.id, content);
      } else {
        // Create new conversation
        const newConv = {
          id: `private_${userId}_${Date.now()}`,
          type: "private" as const,
          title: `Admin to ${users.find(u => u.id === userId)?.username || userId}`,
          participants: ["admin", userId],
          messages: [{
            id: Date.now().toString(),
            content,
            sender: "admin",
            timestamp: new Date().toISOString(),
            type: "admin"
          }],
          createdAt: new Date().toISOString(),
          isActive: true
        };
        setConversations(prev => [...prev, newConv]);
      }
    });
  };

  const addMessageTemplate = (name: string, content: string, category: string) => {
    const template = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      content,
      category
    };
    setMessageTemplates(prev => [...prev, template]);
  };

  const deleteMessageTemplate = (id: string) => {
    setMessageTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Suspense fallback={<LoadingPage message="Loading page..." />}>
      <Routes>
        <Route path="/" element={<AdminLogin onLogin={handleAdminLogin} />} />
        <Route path="/admin-login" element={<AdminLogin onLogin={handleAdminLogin} />} />
        <Route 
          path="/admin" 
          element={
            user && user.role === "admin" ? (
              <AdminDashboard
                users={users}
                roles={roles}
                conversations={conversations}
                messageTemplates={messageTemplates}
                user={user}
                approveUser={approveUser}
                rejectUser={rejectUser}
                addUser={handleAddUser}
                updateUser={updateUser}
                addRole={addRole}
                updateRole={updateRole}
                deleteRole={deleteRole}
                hasPermission={hasPermission}
                sendSystemMessage={sendSystemMessage}
                sendBulkMessage={sendBulkMessage}
                addMessageTemplate={addMessageTemplate}
                deleteMessageTemplate={deleteMessageTemplate}
                forceLogoutUser={handleForceLogoutUser}
                deleteUser={handleDeleteUser}
                onLogout={handleLogout}
              />
            ) : (
              <AdminLogin onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/login"
          element={
            <LoginForm
              onToggleMode={() => setAuthMode("signup")}
              onLogin={handleLogin}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignupForm
              onToggleMode={() => setAuthMode("login")}
              onSignup={handleSignup}
            />
          }
        />

        <Route
          path="/chat"
          element={<UnifiedChatPage />}
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <NotificationProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </NotificationProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
