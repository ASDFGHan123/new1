import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useState, useEffect } from "react";
import { LoadingPage } from "@/components/ui/loading";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDemo = lazy(() => import("./pages/AdminDemo"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginForm = lazy(() => import("@/components/auth/LoginForm").then(module => ({ default: module.LoginForm })));
const SignupForm = lazy(() => import("@/components/auth/SignupForm").then(module => ({ default: module.SignupForm })));
const ChatInterface = lazy(() => import("@/components/chat/ChatInterface").then(module => ({ default: module.ChatInterface })));

const queryClient = new QueryClient();



const App = () => {
  // Admin force logout user
  const handleForceLogoutUser = (id: string) => {
    // Always remove from localStorage, regardless of current state
    const stored = localStorage.getItem("offchat-current-user");
    let username = id;
    const userObj = users.find(u => u.id === id);
    if (userObj) username = userObj.username;
    if (stored) {
      const current = JSON.parse(stored);
      if (current && current.id === id) {
        setUser(null);
        localStorage.removeItem("offchat-current-user");
        alert("You have been logged out by an admin.");
      }
    }
    // Show message to admin
    alert(`User '${username}' has been forcefully logged out.`);
  };

  // Admin delete user
  const handleDeleteUser = (id: string) => {
    if (id === "admin") {
      alert("Cannot delete the admin user.");
      return;
    }
    const userObj = users.find(u => u.id === id);
    const username = userObj ? userObj.username : id;
    setUsers(prev => prev.filter(u => u.id !== id));
    // If the deleted user is currently logged in, log them out
    if (user && user.id === id) {
      setUser(null);
    }
    alert(`User '${username}' has been deleted.`);
  };
  // Demo authentication state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>("login");
  const [user, setUser] = useState<null | { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string }>(() => {
    const stored = localStorage.getItem("offchat-current-user");
    if (stored) return JSON.parse(stored);
    return null;
  });
  // Messages and conversations
  const [conversations, setConversations] = useState(() => {
    const stored = localStorage.getItem("offchat-conversations");
    if (stored) return JSON.parse(stored);
    return [
      {
        id: "general",
        type: "group",
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
    ];
  });

  const [messageTemplates, setMessageTemplates] = useState(() => {
    const stored = localStorage.getItem("offchat-templates");
    if (stored) return JSON.parse(stored);
    return [
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
    ];
  });

  // Roles and permissions
  const [roles, setRoles] = useState(() => {
    const stored = localStorage.getItem("offchat-roles");
    if (stored) return JSON.parse(stored);
    return [
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
    ];
  });

  // Enhanced user list with full profile data
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem("offchat-users");
    const initialUsers = stored ? JSON.parse(stored) : [
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
    // Always ensure admin user exists
    if (!initialUsers.find(u => u.id === "admin")) {
      initialUsers.unshift({
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
      });
    }
    return initialUsers;
  });

  // Persist conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("offchat-conversations", JSON.stringify(conversations));
  }, [conversations]);

  // Persist message templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("offchat-templates", JSON.stringify(messageTemplates));
  }, [messageTemplates]);

  // Persist roles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("offchat-roles", JSON.stringify(roles));
  }, [roles]);

  // Persist users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("offchat-users", JSON.stringify(users));
  }, [users]);

  // Persist current user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("offchat-current-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("offchat-current-user");
    }
  }, [user]);

  // Ensure admin user exists
  useEffect(() => {
    setUsers(prev => {
      if (!prev.find(u => u.id === "admin")) {
        const updated = [{
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
        }, ...prev];
        localStorage.setItem("offchat-users", JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  // Update current user
  const handleUpdateUser = (updates: Partial<typeof user>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  // Admin add user (approved by default)
  const handleAddUser = (username: string, password: string, role: string, avatar?: string) => {
    if (users.some(u => u.username === username)) {
      alert("Username already exists.");
      return;
    }
    const newUser = {
      id: username,
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
    alert("User added and approved.");
  };

  // Only allow login for approved users, with specific error messages
  const handleLogin = (identifier: string, password: string) => {
    const userObj = users.find(u => u.username === identifier || u.email === identifier);
    if (!userObj) {
      alert("User does not exist.");
      return;
    }
    if (userObj.status === "pending") {
      alert("Your account is not approved yet.");
      return;
    }
    if (userObj.status === "banned") {
      alert("Your account was banned by admin.");
      return;
    }
    if (userObj.status === "suspended") {
      alert("Your account is suspended.");
      return;
    }
    if (userObj.password !== password) {
      alert("Incorrect password.");
      return;
    }
    // Active and password matches
    setUser({ id: userObj.id, username: userObj.username, status: "online", role: userObj.role });
  };
  // Signup always creates a pending user
  const handleSignup = (username: string, password: string) => {
    if (users.some(u => u.username === username)) {
      alert("Username already exists.");
      return;
    }
    const newUser = {
      id: username,
      username,
      email: `${username}@example.com`,
      password,
      status: "pending" as const,
      role: "user",
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: "Never",
      messageCount: 0,
      reportCount: 0
    };
    setUsers(prev => [...prev, newUser]);
    alert("Account created! Waiting for admin approval.");
  };
  const handleLogout = () => {
    setUser(null);
  };

  // Admin login handler
  const handleAdminLogin = (identifier: string, password: string): boolean => {
    const userObj = users.find(u => u.username === identifier || u.email === identifier);
    if (!userObj || userObj.password !== password) {
      return false;
    }
    if (userObj.role !== "admin") {
      return false;
    }
    if (userObj.status !== "active") {
      return false;
    }
    setUser({ id: userObj.id, username: userObj.username, status: "online", role: userObj.role });
    return true;
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
      alert("Cannot delete default roles");
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                element={
                  user ? (
                    <ChatInterface user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
                  ) : (
                    <LoginForm
                      onToggleMode={() => setAuthMode("signup")}
                      onLogin={handleLogin}
                    />
                  )
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
             </Routes>
           </Suspense>
         </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
