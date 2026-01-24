import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LoadingPage } from "@/components/ui/loading";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/hooks/useNotifications";
import { useRTL } from "@/hooks/useRTL";
import { usePresenceTracking } from "@/hooks/usePresenceTracking";
import { apiService, User, Conversation, MessageTemplate, Role } from "@/lib/api";

// Initialize auth tokens from localStorage on app start
apiService.initializeAuth();

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
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnifiedChatPage = lazy(() => import("./pages/UnifiedChatPage").then(module => ({ default: module.UnifiedChatPage })));
const LoginForm = lazy(() => import("@/components/auth/LoginForm").then(module => ({ default: module.LoginForm })));
const SignupForm = lazy(() => import("@/components/auth/SignupForm").then(module => ({ default: module.SignupForm })));

const queryClient = new QueryClient();

  const AppContent = () => {
    const { t } = useTranslation();
    useRTL();
    usePresenceTracking();
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
  // Admin force logout user
  const handleForceLogoutUser = async (id: string) => {
    let username = id;
    const userObj = users.find(u => u.id === id);
    if (userObj) username = userObj.username;

    const resp = await apiService.forceLogoutUser(id);
    if (!resp.success) {
      alert(resp.error || t('errors.failedToUpdate'));
      return;
    }

    await loadUsers();
    alert(t('users.userForcefullyLoggedOut', { username }));
  };

  // Admin delete user
  const handleDeleteUser = async (id: string) => {
    if (id === "admin") {
      alert(t('users.cannotDeleteAdmin'));
      return;
    }

    const userObj = users.find(u => u.id === id);
    const username = userObj ? userObj.username : id;

    const resp = await apiService.deleteUser(id);
    if (!resp.success) {
      alert(resp.error || t('errors.failedToDelete'));
      return;
    }

    await loadUsers();
    alert(t('users.userDeleted', { username }));
  };

  // Demo authentication state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>("login");
  const [user, setUser] = useState<null | { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string }>(() => {
    // Try to restore user from localStorage on app start
    try {
      const savedUser = localStorage.getItem('admin_user');
      const accessToken = localStorage.getItem('admin_access_token');
      // Only restore user if we have a valid token
      return (savedUser && accessToken) ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  // Messages and conversations
  const [conversations, setConversations] = useState<AppConversation[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<AppMessageTemplate[]>([]);

  // Roles and permissions (backed by Django auth groups)
  const [roles, setRoles] = useState<AppRole[]>([]);

  // Real data from API
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Heartbeat effect
  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token || !user) return;

    const sendHeartbeat = async () => {
      try {
        await apiService.httpRequest('/users/heartbeat/', { method: 'POST' });
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [user]);

  // Load users from API
  const loadUsers = async () => {
    try {
      const authToken = localStorage.getItem('admin_access_token');
      if (!authToken) {
        setUsers([]);
        return;
      }
      apiService.setAuthToken(authToken);

      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else if (response.error === 'Authentication failed. Please log in again.') {
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
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    if (user && user.role === 'admin') {
      setLoading(true);
      loadUsers().finally(() => setLoading(false));

      // Auto-refresh every 10 seconds
      refreshIntervalRef.current = setInterval(loadUsers, 10000);

      return () => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      };
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
  const handleAddUser = async (username: string, password: string, role: string, avatar?: string) => {
    try {
      const response = await apiService.createUser({
        username,
        email: `${username}@offchat.local`,
        password,
        role,
        status: 'active',
      });

      if (response.success) {
        await loadUsers();
        alert(t('users.userAddedApproved'));
      } else {
        alert(response.error || t('errors.failedToCreate'));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t('errors.failedToCreate'));
    }
  };

  // Only allow login for approved users, with specific error messages
  const handleLogin = async (identifier: string, password: string) => {
    try {
      const response = await apiService.login({ username: identifier, password });
      
      if (response.success && response.data) {
        const userData = response.data;
        localStorage.setItem('chat_access_token', userData.access);
        localStorage.setItem('chat_refresh_token', userData.refresh);
        
        const userObj = { 
          id: String(userData.user.id), 
          username: userData.user.username, 
          status: "online" as const, 
          role: userData.user.role,
          avatar: userData.user.avatar 
        };
        localStorage.setItem('chat_user', JSON.stringify(userObj));
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
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
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
        
        localStorage.setItem('admin_access_token', userData.access);
        localStorage.setItem('admin_refresh_token', userData.refresh);
        apiService.setAuthToken(userData.access);
        
        const userObj = { 
          id: String(userData.user.id), 
          username: userData.user.username, 
          status: "online" as const, 
          role: userData.user.role,
          avatar: userData.user.avatar 
        };
        setUser(userObj);
        localStorage.setItem('admin_user', JSON.stringify(userObj));
        
        const usersResponse = await apiService.getUsers();
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
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
  const approveUser = async (id: string) => {
    const resp = await apiService.approveUser(id);
    if (!resp.success) {
      alert(resp.error || t('errors.failedToUpdate'));
      return;
    }
    await loadUsers();
  };
  const rejectUser = async (id: string) => {
    const resp = await apiService.banUser(id);
    if (!resp.success) {
      alert(resp.error || t('errors.failedToUpdate'));
      return;
    }
    await loadUsers();
  };
  const updateUser = async (id: string, updates: Partial<typeof users[0]>) => {
    const resp = await apiService.updateUser(id, updates as any);
    if (!resp.success) {
      alert(resp.error || t('errors.failedToUpdate'));
      return;
    }
    await loadUsers();
  };

  // Role management functions
  const reloadRoles = async () => {
    const rolesResponse = await apiService.httpRequest<any>('/users/groups/');
    if (rolesResponse.success && rolesResponse.data) {
      const rawRoles = (rolesResponse.data.results || rolesResponse.data) as any[];
      const mapped: AppRole[] = rawRoles.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        description: '',
        permissions: (r.permissions || []).map((p: any) => String(p)),
        isDefault: false,
        createdAt: new Date().toISOString().split('T')[0],
      }));
      setRoles(mapped);
    }
  };

  const addRole = async (name: string, description: string, permissions: string[]) => {
    const resp = await apiService.httpRequest<any>('/users/groups/', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    });
    if (!resp.success) {
      alert(resp.error || t('errors.failedToCreate'));
      return;
    }
    await reloadRoles();
  };

  const updateRole = async (id: string, updates: Partial<typeof roles[0]>) => {
    const resp = await apiService.httpRequest<any>(`/users/groups/${id}/`, {
      method: 'PUT',
      body: JSON.stringify({
        name: (updates as any).name,
        permissions: (updates as any).permissions,
      }),
    });
    if (!resp.success) {
      alert(resp.error || t('errors.failedToUpdate'));
      return;
    }
    await reloadRoles();
  };

  const deleteRole = async (id: string) => {
    const resp = await apiService.httpRequest<any>(`/users/groups/${id}/`, {
      method: 'DELETE',
    });
    if (!resp.success) {
      alert(resp.error || t('errors.failedToDelete'));
      return;
    }
    await reloadRoles();
    await loadUsers();
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
    <Suspense fallback={<LoadingPage text="Loading page..." />}>
      <Routes>
        <Route path="/" element={<UnifiedChatPage />} />
        <Route path="/admin-login" element={<AdminLogin onLogin={handleAdminLogin} />} />
        <Route path="/admin" element={
          user && user.role === "admin" ? (
            <AdminDashboard
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <AdminLogin onLogin={handleAdminLogin} />
          )
        } />
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
