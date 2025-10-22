import React from "react";
import { Users, MessageSquare, Shield, Activity, AlertTriangle, Database, RefreshCw, UserPlus, Sparkles, Wrench, ShieldAlert, User, Save, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { StatsCards } from "@/components/admin/StatsCards";
import { UserManagement } from "@/components/admin/UserManagement";
import { EnhancedUserList } from "@/components/admin/EnhancedUserList";
import { UserProfileViewer } from "@/components/admin/UserProfileViewer";
import { ModerationTools } from "@/components/admin/ModerationTools";
import { DataTools } from "@/components/admin/DataTools";
import { MessageAnalytics } from "@/components/admin/MessageAnalytics";
import { ConversationMonitor } from "@/components/admin/ConversationMonitor";
import { AuditLogs } from "@/components/admin/AuditLogs";
import { BackupManager } from "@/components/admin/BackupManager";
import { Trash } from "@/components/admin/Trash";
import { SystemMessageDialog } from "@/components/admin/SystemMessageDialog";
import { MessageTemplateDialog } from "@/components/admin/MessageTemplateDialog";
import { UserSelectionDialog } from "@/components/admin/UserSelectionDialog";
import { MessageHistory } from "@/components/admin/MessageHistory";
import { MessageModeration } from "@/components/admin/MessageModeration";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ImageUpload } from "@/components/ui/image-upload";

interface User {
  id: string;
  username: string;
  email: string;
  status: "active" | "suspended" | "banned";
  role: string;
  joinDate: string;
  lastActive: string;
  messageCount: number;
  reportCount: number;
  avatar?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

interface Conversation {
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

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface ModerationAction {
  type: "warn" | "suspend" | "ban";
  duration?: string;
  reason: string;
}

interface DataExportOptions {
  messages: boolean;
  profile: boolean;
  activity: boolean;
  connections: boolean;
}

interface AdminDashboardProps {
  users: User[];
  roles: Role[];
  conversations: Conversation[];
  messageTemplates: MessageTemplate[];
  user?: { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string };
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
  addUser?: (username: string, password: string, role: string) => void;
  updateUser?: (id: string, updates: Partial<User>) => void;
  addRole?: (name: string, description: string, permissions: string[]) => void;
  updateRole?: (id: string, updates: Partial<Role>) => void;
  deleteRole?: (id: string) => void;
  hasPermission?: (userId: string, permission: string) => boolean;
  sendSystemMessage?: (conversationId: string, content: string) => void;
  sendBulkMessage?: (userIds: string[], content: string) => void;
  addMessageTemplate?: (name: string, content: string, category: string) => void;
  deleteMessageTemplate?: (id: string) => void;
  forceLogoutUser?: (id: string) => void;
  deleteUser?: (id: string) => void;
  onMessageSent?: (content: string, type: "system" | "broadcast" | "targeted", priority: string, recipients: string[], recipientCount: number) => void;
  onLogout?: () => void;
  onTrashUser?: (userId: string) => void;
  onTrashMessage?: (message: any) => void;
}

const AdminDashboard = ({ users: propUsers, roles: propRoles, conversations: propConversations, messageTemplates: propMessageTemplates, user, approveUser, rejectUser, addUser, updateUser, addRole, updateRole, deleteRole, hasPermission, sendSystemMessage, sendBulkMessage, addMessageTemplate, deleteMessageTemplate, forceLogoutUser, deleteUser, onMessageSent, onLogout, onTrashUser }: AdminDashboardProps) => {
  // Local state for entities when props not provided
  const [localUsers, setLocalUsers] = React.useState<User[]>([
    {
      id: "1",
      username: "john_doe",
      email: "john@example.com",
      status: "active",
      role: "user",
      joinDate: "2024-01-15",
      lastActive: "2024-01-20",
      messageCount: 45,
      reportCount: 0,
      avatar: undefined
    },
    {
      id: "2",
      username: "jane_admin",
      email: "jane@example.com",
      status: "active",
      role: "admin",
      joinDate: "2024-01-10",
      lastActive: "2024-01-20",
      messageCount: 120,
      reportCount: 2,
      avatar: undefined
    },
    {
      id: "3",
      username: "bob_user",
      email: "bob@example.com",
      status: "suspended",
      role: "user",
      joinDate: "2024-01-18",
      lastActive: "2024-01-19",
      messageCount: 12,
      reportCount: 1,
      avatar: undefined
    }
  ]);

  const [localRoles, setLocalRoles] = React.useState<Role[]>([
    {
      id: "1",
      name: "User",
      description: "Standard user with basic permissions",
      permissions: ["send_messages", "manage_conversations"],
      isDefault: true,
      createdAt: "2024-01-01"
    },
    {
      id: "2",
      name: "Moderator",
      description: "User with moderation capabilities",
      permissions: ["send_messages", "manage_conversations", "moderate_content", "view_analytics"],
      isDefault: false,
      createdAt: "2024-01-01"
    },
    {
      id: "3",
      name: "Admin",
      description: "Full administrative access",
      permissions: ["user_management", "role_management", "send_messages", "manage_conversations", "message_monitoring", "system_settings", "audit_logs", "backup_management", "view_analytics", "moderate_content", "manage_templates"],
      isDefault: false,
      createdAt: "2024-01-01"
    }
  ]);

  const [localConversations, setLocalConversations] = React.useState<Conversation[]>([
    {
      id: "1",
      type: "private",
      title: "Private Chat",
      participants: ["1", "2"],
      messages: [
        { id: "1", content: "Hello!", sender: "1", timestamp: "2024-01-20T10:00:00Z", type: "text" },
        { id: "2", content: "Hi there!", sender: "2", timestamp: "2024-01-20T10:05:00Z", type: "text" }
      ],
      createdAt: "2024-01-15T09:00:00Z",
      isActive: true
    },
    {
      id: "2",
      type: "group",
      title: "Team Discussion",
      participants: ["1", "2", "3"],
      messages: [
        { id: "3", content: "Welcome to the team!", sender: "2", timestamp: "2024-01-18T14:00:00Z", type: "text" }
      ],
      createdAt: "2024-01-18T14:00:00Z",
      isActive: true
    }
  ]);

  const [localMessageTemplates, setLocalMessageTemplates] = React.useState<MessageTemplate[]>([
    {
      id: "1",
      name: "Welcome Message",
      content: "Welcome to our platform! We're glad to have you here.",
      category: "General"
    },
    {
      id: "2",
      name: "Maintenance Notice",
      content: "Scheduled maintenance will begin soon. Please save your work.",
      category: "System"
    }
  ]);

  // Use props if provided, otherwise use local state
  const users = propUsers || localUsers;
  const roles = propRoles || localRoles;
  const conversations = propConversations || localConversations;
  const messageTemplates = propMessageTemplates || localMessageTemplates;

  const [activeTab, setActiveTab] = React.useState("overview");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [showProfile, setShowProfile] = React.useState(false);
  const [showModeration, setShowModeration] = React.useState(false);
  const [showDataTools, setShowDataTools] = React.useState(false);
  const [showSystemMessageDialog, setShowSystemMessageDialog] = React.useState(false);
  const [messageDialogMode, setMessageDialogMode] = React.useState<"system" | "broadcast" | "targeted">("system");
  const [selectedUsersForMessage, setSelectedUsersForMessage] = React.useState<string[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = React.useState(false);
  const [templateDialogMode, setTemplateDialogMode] = React.useState<"add" | "edit">("add");
  const [selectedTemplate, setSelectedTemplate] = React.useState<MessageTemplate | null>(null);
  const [showUserSelectionDialog, setShowUserSelectionDialog] = React.useState(false);
  const [quickActionContent, setQuickActionContent] = React.useState<string>("");
  const [quickActionPriority, setQuickActionPriority] = React.useState<string>("normal");

  // Profile related state
  const [showEditProfileDialog, setShowEditProfileDialog] = React.useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = React.useState(false);
  const [showEnable2FADialog, setShowEnable2FADialog] = React.useState(false);
  const [showSessionDialog, setShowSessionDialog] = React.useState(false);
  const [showLoginHistoryDialog, setShowLoginHistoryDialog] = React.useState(false);
  const [editedAvatar, setEditedAvatar] = React.useState<string | undefined>(user?.avatar);

  // Permissions related state
  const [showAddRoleDialog, setShowAddRoleDialog] = React.useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = React.useState("");
  const [newRoleDescription, setNewRoleDescription] = React.useState("");
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);

  // Settings related state
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [userRegistration, setUserRegistration] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = React.useState<"disabled" | "optional" | "required">("optional");
  const [sessionTimeout, setSessionTimeout] = React.useState(30);
  const [maxFileSize, setMaxFileSize] = React.useState(10);
  const [backupFrequency, setBackupFrequency] = React.useState<"daily" | "weekly" | "monthly">("daily");

  // Trash related state
  const [trashedUsers, setTrashedUsers] = React.useState<User[]>([]);
  const [trashedConversations, setTrashedConversations] = React.useState<Conversation[]>([]);
  const [trashedMessageTemplates, setTrashedMessageTemplates] = React.useState<MessageTemplate[]>([]);
  const [trashedMessages, setTrashedMessages] = React.useState<any[]>([]);
  const [trashedRoles, setTrashedRoles] = React.useState<Role[]>([]);

  // Moderation related state
  const [moderationActions, setModerationActions] = React.useState<Array<{
    id: string;
    userId: string;
    username: string;
    action: "warn" | "suspend" | "ban";
    duration?: string;
    reason: string;
    timestamp: string;
    admin: string;
  }>>([]);

  // Load trash data from localStorage on mount
  React.useEffect(() => {
    const storedTrashedUsers = localStorage.getItem('offchat-trashed-users');
    const storedTrashedConversations = localStorage.getItem('offchat-trashed-conversations');
    const storedTrashedTemplates = localStorage.getItem('offchat-trashed-templates');
    const storedTrashedMessages = localStorage.getItem('offchat-trashed-messages');
    const storedTrashedRoles = localStorage.getItem('offchat-trashed-roles');

    if (storedTrashedUsers) {
      try {
        setTrashedUsers(JSON.parse(storedTrashedUsers));
      } catch (error) {
        console.error('Failed to parse stored trashed users:', error);
      }
    }

    if (storedTrashedConversations) {
      try {
        setTrashedConversations(JSON.parse(storedTrashedConversations));
      } catch (error) {
        console.error('Failed to parse stored trashed conversations:', error);
      }
    }

    if (storedTrashedTemplates) {
      try {
        setTrashedMessageTemplates(JSON.parse(storedTrashedTemplates));
      } catch (error) {
        console.error('Failed to parse stored trashed templates:', error);
      }
    }

    if (storedTrashedMessages) {
      try {
        setTrashedMessages(JSON.parse(storedTrashedMessages));
      } catch (error) {
        console.error('Failed to parse stored trashed messages:', error);
      }
    }

    if (storedTrashedRoles) {
      try {
        setTrashedRoles(JSON.parse(storedTrashedRoles));
      } catch (error) {
        console.error('Failed to parse stored trashed roles:', error);
      }
    }

    // Load settings
    const storedSettings = localStorage.getItem('offchat-admin-settings');
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        setMaintenanceMode(settings.maintenanceMode ?? false);
        setUserRegistration(settings.userRegistration ?? true);
        setEmailNotifications(settings.emailNotifications ?? false);
        setTwoFactorAuth(settings.twoFactorAuth ?? "optional");
        setSessionTimeout(settings.sessionTimeout ?? 30);
        setMaxFileSize(settings.maxFileSize ?? 10);
        setBackupFrequency(settings.backupFrequency ?? "daily");
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
      }
    }
  }, []);

  // Save trash data to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('offchat-trashed-users', JSON.stringify(trashedUsers));
  }, [trashedUsers]);

  React.useEffect(() => {
    localStorage.setItem('offchat-trashed-conversations', JSON.stringify(trashedConversations));
  }, [trashedConversations]);

  React.useEffect(() => {
    localStorage.setItem('offchat-trashed-templates', JSON.stringify(trashedMessageTemplates));
  }, [trashedMessageTemplates]);

  React.useEffect(() => {
    localStorage.setItem('offchat-trashed-messages', JSON.stringify(trashedMessages));
  }, [trashedMessages]);

  React.useEffect(() => {
    localStorage.setItem('offchat-trashed-roles', JSON.stringify(trashedRoles));
  }, [trashedRoles]);

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const handleModerate = (user: User) => {
    setSelectedUser(user);
    setShowModeration(true);
  };

  const handleDataManagement = (user: User) => {
    setSelectedUser(user);
    setShowDataTools(true);
  };

  const handleModerationAction = (userId: string, action: ModerationAction) => {
    // Update user status
    if (action.type === 'suspend') {
      updateUser(userId, { status: 'suspended' });
    } else if (action.type === 'ban') {
      updateUser(userId, { status: 'banned' });
    }
    // Add to moderation actions
    const user = users.find(u => u.id === userId);
    const newAction = {
      id: Date.now().toString(),
      userId,
      username: user?.username || userId,
      action: action.type,
      duration: action.duration,
      reason: action.reason,
      timestamp: new Date().toISOString(),
      admin: user?.username || 'admin'
    };
    setModerationActions(prev => [newAction, ...prev]);
  };

  const handleExportData = (userId: string, options: DataExportOptions) => {
    // Implement data export
  };

  const handleDeleteData = (userId: string, options: DataExportOptions) => {
    // Implement data deletion
  };

  const handleSendSystemMessage = async (content: string, priority?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real implementation, call the API
    if (sendSystemMessage) {
      // For now, send to a dummy conversation
      sendSystemMessage("system-conversation", content);
    }
    // Add to message history
    if (onMessageSent) {
      onMessageSent(content, "system", priority || "normal", ["system"], 1);
    }
  };

  const handleSendBulkMessage = async (content: string, priority?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real implementation, call the API
    if (sendBulkMessage) {
      sendBulkMessage(users.map(u => u.id), content);
    }
    // Add to message history
    if (onMessageSent) {
      onMessageSent(content, "broadcast", priority || "normal", ["all"], users.length);
    }
  };

  const handleSendTargetedMessage = async (content: string, priority?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real implementation, call the API
    // Add to message history
    if (onMessageSent) {
      onMessageSent(content, "targeted", priority || "normal", selectedUsersForMessage, selectedUsersForMessage.length);
    }
  };

  const handleOpenSystemMessageDialog = (mode: "system" | "broadcast" | "targeted" = "system") => {
    setMessageDialogMode(mode);
    setShowSystemMessageDialog(true);
  };

  const handleSendMessage = async (content: string, priority?: string) => {
    switch (messageDialogMode) {
      case "system":
        await handleSendSystemMessage(content, priority);
        break;
      case "broadcast":
        await handleSendBulkMessage(content, priority);
        break;
      case "targeted":
        await handleSendTargetedMessage(content, priority);
        break;
    }
  };

  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setTemplateDialogMode("add");
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setTemplateDialogMode("edit");
    setShowTemplateDialog(true);
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    // Pre-fill the system message dialog with template content
    setMessageDialogMode("system");
    setShowSystemMessageDialog(true);
    // Note: In a real implementation, you'd pass the template content to the dialog
  };

  const handleSaveTemplate = async (templateData: Omit<MessageTemplate, "id">) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // In real implementation, call API to save template
    if (addMessageTemplate) {
      addMessageTemplate(templateData.name, templateData.content, templateData.category);
    } else {
      // Use local state
      const newTemplate: MessageTemplate = {
        id: Date.now().toString(),
        ...templateData
      };
      setLocalMessageTemplates(prev => [...prev, newTemplate]);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    // Move to trash instead of permanent deletion
    await handleTrashMessageTemplate(templateId);
  };

  const handleOpenUserSelection = () => {
    setShowUserSelectionDialog(true);
  };

  const handleUserSelectionConfirm = (selectedUserIds: string[]) => {
    setSelectedUsersForMessage(selectedUserIds);
    setMessageDialogMode("targeted");
    setShowSystemMessageDialog(true);
  };

  // Profile handlers
  const handleEditProfile = () => {
    setEditedAvatar(user?.avatar);
    setShowEditProfileDialog(true);
  };

  const handleSaveProfile = () => {
    if (user && updateUser) {
      updateUser(user.id, { avatar: editedAvatar });
    }
    setShowEditProfileDialog(false);
  };

  const handleChangePassword = () => {
    setShowChangePasswordDialog(true);
  };

  const handleEnable2FA = () => {
    setShowEnable2FADialog(true);
  };

  const handleViewSessions = () => {
    setShowSessionDialog(true);
  };

  const handleViewLoginHistory = () => {
    setShowLoginHistoryDialog(true);
  };

  // Permissions handlers
  const handleAddRole = () => {
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedPermissions([]);
    setShowAddRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description);
    setSelectedPermissions([...role.permissions]);
    setShowEditRoleDialog(true);
  };

  const handleSaveRole = async () => {
    if (!newRoleName.trim() || !newRoleDescription.trim()) return;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRoleData = {
      id: selectedRole ? selectedRole.id : Date.now().toString(),
      name: newRoleName,
      description: newRoleDescription,
      permissions: selectedPermissions,
      isDefault: false,
      createdAt: selectedRole ? selectedRole.createdAt : new Date().toISOString()
    };

    if (selectedRole) {
      // Edit existing role
      if (updateRole) {
        updateRole(selectedRole.id, {
          name: newRoleName,
          description: newRoleDescription,
          permissions: selectedPermissions
        });
      } else {
        // Use local state
        setLocalRoles(prev => prev.map(role =>
          role.id === selectedRole.id ? { ...role, name: newRoleName, description: newRoleDescription, permissions: selectedPermissions } : role
        ));
      }
    } else {
      // Add new role
      if (addRole) {
        addRole(newRoleName, newRoleDescription, selectedPermissions);
      } else {
        // Use local state
        setLocalRoles(prev => [...prev, newRoleData]);
      }
    }

    setShowAddRoleDialog(false);
    setShowEditRoleDialog(false);
    setSelectedRole(null);
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedPermissions([]);
  };

  const handleDeleteRole = async (roleId: string) => {
    // Move to trash instead of permanent deletion
    await handleTrashRole(roleId);
  };

  // Local add/update functions for when props not provided
  const localAddUser = (username: string, password: string, role: string, avatar?: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      username,
      email: `${username}@example.com`,
      status: "active",
      role,
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString(),
      messageCount: 0,
      reportCount: 0,
      avatar
    };
    setLocalUsers(prev => [...prev, newUser]);
  };

  const localUpdateUser = (id: string, updates: Partial<User>) => {
    setLocalUsers(prev => prev.map(user =>
      user.id === id ? { ...user, ...updates } : user
    ));
  };

  const localDeleteUser = (id: string) => {
    setLocalUsers(prev => prev.filter(user => user.id !== id));
  };

  const localAddRole = (name: string, description: string, permissions: string[]) => {
    const newRole: Role = {
      id: Date.now().toString(),
      name,
      description,
      permissions,
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    setLocalRoles(prev => [...prev, newRole]);
  };

  const localUpdateRole = (id: string, updates: Partial<Role>) => {
    setLocalRoles(prev => prev.map(role =>
      role.id === id ? { ...role, ...updates } : role
    ));
  };

  const localDeleteRole = (id: string) => {
    setLocalRoles(prev => prev.filter(role => role.id !== id));
  };

  const localAddMessageTemplate = (name: string, content: string, category: string) => {
    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      name,
      content,
      category
    };
    setLocalMessageTemplates(prev => [...prev, newTemplate]);
  };

  const localDeleteMessageTemplate = (id: string) => {
    setLocalMessageTemplates(prev => prev.filter(template => template.id !== id));
  };

  // Trash management functions
  const handleTrashUser = async (userId: string) => {
    const userToTrash = users.find(u => u.id === userId);
    if (userToTrash) {
      setTrashedUsers(prev => [...prev, { ...userToTrash, deletedAt: new Date().toISOString() }]);
      // Remove from active users
      if (deleteUser) {
        deleteUser(userId);
      } else {
        // Use local state
        setLocalUsers(prev => prev.filter(u => u.id !== userId));
      }
    }
  };

  const handleTrashConversation = async (conversationId: string) => {
    const conversationToTrash = conversations.find(c => c.id === conversationId);
    if (conversationToTrash) {
      setTrashedConversations(prev => [...prev, { ...conversationToTrash, deletedAt: new Date().toISOString() }]);
      setLocalConversations(prev => prev.filter(c => c.id !== conversationId));
    }
  };

  const handleTrashMessageTemplate = async (templateId: string) => {
    const templateToTrash = messageTemplates.find(t => t.id === templateId);
    if (templateToTrash) {
      setTrashedMessageTemplates(prev => [...prev, { ...templateToTrash, deletedAt: new Date().toISOString() }]);
      // Remove from active templates
      if (deleteMessageTemplate) {
        deleteMessageTemplate(templateId);
      } else {
        // Use local state
        setLocalMessageTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    }
  };

  const handleTrashRole = async (roleId: string) => {
    const roleToTrash = roles.find(r => r.id === roleId);
    if (roleToTrash && !roleToTrash.isDefault) {
      setTrashedRoles(prev => [...prev, { ...roleToTrash, deletedAt: new Date().toISOString() }]);
      if (deleteRole) {
        deleteRole(roleId);
      } else {
        // Use local state
        setLocalRoles(prev => prev.filter(r => r.id !== roleId));
      }
    }
  };

  const handleRestoreUser = async (userId: string) => {
    const trashedUser = trashedUsers.find(u => u.id === userId);
    if (trashedUser) {
      if (addUser) {
        // Use prop function if available
        addUser(trashedUser.username, "restored_password", trashedUser.role || "user");
      } else {
        // Use local state
        setLocalUsers(prev => [...prev, trashedUser]);
      }
      // Remove from trash
      setTrashedUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleRestoreConversation = async (conversationId: string) => {
    const trashedConversation = trashedConversations.find(c => c.id === conversationId);
    if (trashedConversation) {
      setLocalConversations(prev => [...prev, trashedConversation]);
      setTrashedConversations(prev => prev.filter(c => c.id !== conversationId));
    }
  };

  const handleRestoreMessageTemplate = async (templateId: string) => {
    const trashedTemplate = trashedMessageTemplates.find(t => t.id === templateId);
    if (trashedTemplate) {
      if (addMessageTemplate) {
        // Use prop function if available
        addMessageTemplate(trashedTemplate.name, trashedTemplate.content, trashedTemplate.category);
      } else {
        // Use local state
        setLocalMessageTemplates(prev => [...prev, trashedTemplate]);
      }
      // Remove from trash
      setTrashedMessageTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleRestoreRole = async (role: Role) => {
    if (addRole) {
      // Use prop function if available
      addRole(role.name, role.description, role.permissions);
    } else {
      // Use local state
      setLocalRoles(prev => [...prev, role]);
    }
    // Remove from trash
    setTrashedRoles(prev => prev.filter(r => r.id !== role.id));
  };

  const handlePermanentDeleteUser = async (userId: string) => {
    setTrashedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handlePermanentDeleteConversation = async (conversationId: string) => {
    setTrashedConversations(prev => prev.filter(c => c.id !== conversationId));
  };

  const handlePermanentDeleteMessageTemplate = async (templateId: string) => {
    setTrashedMessageTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleRestoreMessage = async (message: any) => {
    // For messages, we need to restore them to MessageHistory's localStorage
    const stored = localStorage.getItem('offchat-message-history');
    let messages = [];
    if (stored) {
      try {
        messages = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored message history:', error);
        messages = [];
      }
    }
    // Add the message back
    messages.unshift(message);
    localStorage.setItem('offchat-message-history', JSON.stringify(messages));
    // Remove from trash
    setTrashedMessages(prev => prev.filter(m => m.id !== message.id));
  };

  const handlePermanentDeleteMessage = async (messageId: string) => {
    setTrashedMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handlePermanentDeleteRole = async (roleId: string) => {
    setTrashedRoles(prev => prev.filter(r => r.id !== roleId));
  };

  const handleTrashMessage = async (message: any) => {
    // Add message to trash
    setTrashedMessages(prev => [...prev, { ...message, deletedAt: new Date().toISOString() }]);
  };

  const availablePermissions = [
    "user_management",
    "role_management",
    "send_messages",
    "manage_conversations",
    "message_monitoring",
    "system_settings",
    "audit_logs",
    "backup_management",
    "view_analytics",
    "moderate_content",
    "manage_templates"
  ];

  // Settings handlers
  const handleSaveSettings = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const settings = {
      maintenanceMode,
      userRegistration,
      emailNotifications,
      twoFactorAuth,
      sessionTimeout,
      maxFileSize,
      backupFrequency
    };
    localStorage.setItem('offchat-admin-settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const handleQuickAction = (actionType: "welcome" | "maintenance" | "security") => {
    let content = "";
    let priority: string = "normal";

    switch (actionType) {
      case "welcome":
        content = `🎉 Welcome to OffChat!

Dear valued user,

Welcome to our offline messaging platform! We're excited to have you join our community.

Here are some quick tips to get started:
• Start conversations with other users
• Customize your profile settings
• Explore our features and stay connected

If you have any questions, feel free to reach out to our support team.

Happy chatting!
The OffChat Team`;
        priority = "normal";
        break;
      case "maintenance":
        content = `🔧 Scheduled Maintenance Notice

Dear users,

We will be performing scheduled maintenance on our system to improve performance and add new features.

**Maintenance Window:**
• Date: [Insert Date]
• Time: [Insert Time] (Duration: approximately 2 hours)
• Expected Completion: [Insert Time]

During this period:
• The platform may be temporarily unavailable
• All services will resume automatically after maintenance
• Your data and conversations are safe and secure

We apologize for any inconvenience this may cause. Thank you for your patience and understanding.

Best regards,
The OffChat Technical Team`;
        priority = "high";
        break;
      case "security":
        content = `🚨 Security Alert - Important Notice

Dear users,

We have detected unusual activity that may affect system security. As a precautionary measure, we recommend the following actions:

**Immediate Actions Required:**
• Change your password immediately
• Enable two-factor authentication if not already active
• Review your recent login activity
• Report any suspicious activity to support

**What we're doing:**
• Our security team is actively monitoring the situation
• Additional security measures are being implemented
• All user data remains protected

Your security is our top priority. If you experience any issues or have concerns, please contact our support team immediately.

Stay safe,
The OffChat Security Team`;
        priority = "urgent";
        break;
    }

    setQuickActionContent(content);
    setQuickActionPriority(priority);
    setMessageDialogMode("broadcast");
    setShowSystemMessageDialog(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between relative border-b border-border py-4 px-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">OffChat Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your offline messaging platform</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-admin-success/20 text-admin-success border-admin-success/30">
                System Online
              </Badge>
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsCards />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MessageAnalytics />
                <BackupManager />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Admin Profile</CardTitle>
                  <CardDescription>Manage your administrator profile and account settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'admin'}`} />
                        <AvatarFallback className="bg-admin-primary text-primary-foreground text-xl">
                          {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold">{user?.username || 'Admin'}</h3>
                        <p className="text-muted-foreground">{user?.username ? `${user.username}@offchat.com` : 'admin@offchat.com'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="default" className="bg-admin-primary">Administrator</Badge>
                          <Badge variant={user?.status === "online" ? "default" : "secondary"}>
                            {user?.status || "online"}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleEditProfile}>
                        <User className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>

                    <Separator />

                    {/* Profile Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Account Information</h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Username</Label>
                            <p className="text-sm text-muted-foreground">{user?.username || 'admin'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-sm text-muted-foreground">{user?.username ? `${user.username}@offchat.com` : 'admin@offchat.com'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Role</Label>
                            <p className="text-sm text-muted-foreground">Administrator</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <p className="text-sm text-muted-foreground">{user?.status || 'online'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Activity Summary</h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Total Users Managed</Label>
                            <p className="text-sm text-muted-foreground">{users.length} users</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Active Conversations</Label>
                            <p className="text-sm text-muted-foreground">{conversations.length} conversations</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Message Templates</Label>
                            <p className="text-sm text-muted-foreground">{messageTemplates.length} templates</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">System Uptime</Label>
                            <p className="text-sm text-muted-foreground">99.9%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Security Settings */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">Security & Preferences</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Password</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">Last changed: Never</p>
                            <Button variant="outline" size="sm" onClick={handleChangePassword}>Change Password</Button>
                          </CardContent>
                        </Card>


                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Session Management</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">Current session active</p>
                            <Button variant="outline" size="sm" onClick={handleViewSessions}>View Sessions</Button>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Login History</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">Last login: Today</p>
                            <Button variant="outline" size="sm" onClick={handleViewLoginHistory}>View History</Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-6">
                <UserManagement
                  users={users}
                  approveUser={approveUser}
                  rejectUser={rejectUser}
                  addUser={addUser || localAddUser}
                  updateUser={updateUser || localUpdateUser}
                  forceLogoutUser={forceLogoutUser}
                  deleteUser={handleTrashUser}
                />
                <EnhancedUserList
                  users={users}
                  onViewProfile={handleViewProfile}
                  onModerate={handleModerate}
                  onDataManagement={handleDataManagement}
                />
              </div>
            </TabsContent>

            <TabsContent value="moderation">
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Moderation Overview</CardTitle>
                    <CardDescription>Recent moderation actions and pending reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Recent Moderation Actions</h4>
                        <div className="space-y-3">
                          {moderationActions.slice(0, 5).map((action) => (
                            <div key={action.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{action.username}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {action.action.charAt(0).toUpperCase() + action.action.slice(1)} - {action.reason}
                                  </p>
                                </div>
                                <Badge variant={action.action === 'ban' ? 'destructive' : action.action === 'suspend' ? 'secondary' : 'outline'}>
                                  {action.action}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(action.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                          {moderationActions.length === 0 && (
                            <p className="text-muted-foreground text-sm">No recent moderation actions</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Pending Reports</h4>
                        <div className="space-y-3">
                          {users.filter(u => u.reportCount > 0).map((user) => (
                            <div key={user.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.reportCount} report{user.reportCount > 1 ? 's' : ''}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleModerate(user)}
                                >
                                  Review
                                </Button>
                              </div>
                            </div>
                          ))}
                          {users.filter(u => u.reportCount > 0).length === 0 && (
                            <p className="text-muted-foreground text-sm">No pending reports</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messages">
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Admin Messaging</CardTitle>
                        <CardDescription>Send system messages and announcements</CardDescription>
                      </div>
                      <Button
                        className="bg-admin-primary hover:bg-admin-primary/90"
                        onClick={() => handleOpenSystemMessageDialog("system")}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send System Message
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Quick Actions</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickAction("welcome")}
                                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Welcome New Users
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Send a friendly welcome message to new users</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickAction("maintenance")}
                                  className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 hover:text-orange-800"
                                >
                                  <Wrench className="w-4 h-4 mr-2" />
                                  Maintenance Notice
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Notify users about scheduled maintenance</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickAction("security")}
                                  className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700"
                                >
                                  <ShieldAlert className="w-4 h-4 mr-2" />
                                  Security Alert
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Send urgent security notifications to all users</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Broadcast to All Users</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Send a message to all active users in the system
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleOpenSystemMessageDialog("broadcast")}
                          >
                            Broadcast Message
                          </Button>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Targeted Messaging</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Send messages to specific user groups or individuals
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={handleOpenUserSelection}
                          >
                            Select Recipients
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle>Message Templates</CardTitle>
                      <CardDescription>Manage reusable message templates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {messageTemplates.map((template) => (
                          <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h5 className="font-medium">{template.name}</h5>
                              <p className="text-sm text-muted-foreground">{template.category}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUseTemplate(template)}
                              >
                                Use
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTemplate(template)}
                              >
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the template "{template.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full" onClick={handleAddTemplate}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <MessageAnalytics detailed />
                </div>

                <MessageHistory onMessageSent={onMessageSent} onTrashMessage={handleTrashMessage} />

                <MessageModeration />
              </div>
            </TabsContent>

            <TabsContent value="conversations">
              <ConversationMonitor onTrashConversation={handleTrashConversation} />
            </TabsContent>

            <TabsContent value="audit">
              <AuditLogs />
            </TabsContent>

            <TabsContent value="permissions">
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Role Management</CardTitle>
                        <CardDescription>Manage user roles and their permissions</CardDescription>
                      </div>
                      <Button
                        className="bg-admin-primary hover:bg-admin-primary/90"
                        onClick={handleAddRole}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Role
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roles.map((role) => (
                        <Card key={role.id} className="border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              {role.isDefault && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <CardDescription>{role.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">Permissions:</h5>
                              <div className="flex flex-wrap gap-1">
                                {role.permissions.map((permission) => (
                                  <Badge key={permission} variant="outline" className="text-xs">
                                    {permission.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleEditRole(role)}
                              >
                                Edit
                              </Button>
                              {!role.isDefault && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="flex-1">
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the role "{role.name}"? This action cannot be undone and may affect users assigned to this role.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete Role
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Permission Matrix</CardTitle>
                    <CardDescription>Overview of all available permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">User Management</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-success rounded-full"></div>
                            user_management - Create, edit, delete users
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-success rounded-full"></div>
                            role_management - Manage user roles
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Messaging</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-primary rounded-full"></div>
                            send_messages - Send messages
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-primary rounded-full"></div>
                            manage_conversations - Manage conversations
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-warning rounded-full"></div>
                            message_monitoring - Monitor messages
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">System</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-error rounded-full"></div>
                            system_settings - System configuration
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-error rounded-full"></div>
                            audit_logs - View audit logs
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-error rounded-full"></div>
                            backup_management - Manage backups
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Analytics</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-admin-secondary rounded-full"></div>
                            view_analytics - View system analytics
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <SettingsIcon className="w-5 h-5" />
                          <span>System Settings</span>
                        </CardTitle>
                        <CardDescription>Configure system-wide settings and preferences</CardDescription>
                      </div>
                      <Button onClick={handleSaveSettings} className="bg-admin-primary hover:bg-admin-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* General Settings */}
                      <div>
                        <h4 className="font-medium mb-4 flex items-center space-x-2">
                          <Database className="w-4 h-4" />
                          <span>General Settings</span>
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Maintenance Mode</Label>
                              <p className="text-xs text-muted-foreground">Put the system in maintenance mode</p>
                            </div>
                            <Switch
                              checked={maintenanceMode}
                              onCheckedChange={setMaintenanceMode}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">User Registration</Label>
                              <p className="text-xs text-muted-foreground">Allow new users to register</p>
                            </div>
                            <Switch
                              checked={userRegistration}
                              onCheckedChange={setUserRegistration}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Email Notifications</Label>
                              <p className="text-xs text-muted-foreground">Send email notifications</p>
                            </div>
                            <Switch
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Security Settings */}
                      <div>
                        <h4 className="font-medium mb-4 flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>Security Settings</span>
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                            <Select value={twoFactorAuth} onValueChange={(value: any) => setTwoFactorAuth(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="disabled">Disabled</SelectItem>
                                <SelectItem value="optional">Optional</SelectItem>
                                <SelectItem value="required">Required</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Session Timeout (minutes)</Label>
                            <Select value={sessionTimeout.toString()} onValueChange={(value) => setSessionTimeout(parseInt(value))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                                <SelectItem value="480">8 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* File & Storage Settings */}
                      <div>
                        <h4 className="font-medium mb-4 flex items-center space-x-2">
                          <Database className="w-4 h-4" />
                          <span>File & Storage Settings</span>
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Maximum File Size (MB)</Label>
                            <Select value={maxFileSize.toString()} onValueChange={(value) => setMaxFileSize(parseInt(value))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 MB</SelectItem>
                                <SelectItem value="10">10 MB</SelectItem>
                                <SelectItem value="25">25 MB</SelectItem>
                                <SelectItem value="50">50 MB</SelectItem>
                                <SelectItem value="100">100 MB</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Backup Frequency</Label>
                            <Select value={backupFrequency} onValueChange={(value: any) => setBackupFrequency(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>System Status</span>
                    </CardTitle>
                    <CardDescription>Current system health and statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-admin-success">99.9%</div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-admin-primary">{users.length}</div>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-admin-secondary">{conversations.length}</div>
                        <p className="text-sm text-muted-foreground">Active Conversations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trash">
              <Trash
                trashedUsers={trashedUsers}
                trashedConversations={trashedConversations}
                trashedMessageTemplates={trashedMessageTemplates}
                trashedMessages={trashedMessages}
                trashedRoles={trashedRoles}
                onRestoreUser={handleRestoreUser}
                onRestoreConversation={handleRestoreConversation}
                onRestoreMessageTemplate={handleRestoreMessageTemplate}
                onRestoreMessage={handleRestoreMessage}
                onRestoreRole={handleRestoreRole}
                onPermanentDeleteUser={handlePermanentDeleteUser}
                onPermanentDeleteConversation={handlePermanentDeleteConversation}
                onPermanentDeleteMessageTemplate={handlePermanentDeleteMessageTemplate}
                onPermanentDeleteMessage={handlePermanentDeleteMessage}
                onPermanentDeleteRole={handlePermanentDeleteRole}
              />
            </TabsContent>

          </Tabs>
        </div>
      </main>
      
      {/* Modals */}
      {selectedUser && (
        <>
          <UserProfileViewer
            user={selectedUser}
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            onExportData={(userId) => handleExportData(userId, { messages: true, profile: true, activity: false, connections: false })}
            onDeleteData={(userId) => handleDeleteData(userId, { messages: true, profile: true, activity: false, connections: false })}
          />
          <ModerationTools
            userId={selectedUser.id}
            username={selectedUser.username}
            isOpen={showModeration}
            onClose={() => setShowModeration(false)}
            onModerate={handleModerationAction}
          />
          <DataTools
            userId={selectedUser.id}
            username={selectedUser.username}
            isOpen={showDataTools}
            onClose={() => setShowDataTools(false)}
            onExportData={handleExportData}
            onDeleteData={handleDeleteData}
          />
        </>
      )}

      <SystemMessageDialog
        isOpen={showSystemMessageDialog}
        onClose={() => {
          setShowSystemMessageDialog(false);
          setQuickActionContent("");
          setQuickActionPriority("normal");
        }}
        onSendMessage={handleSendMessage}
        mode={messageDialogMode}
        selectedUsers={selectedUsersForMessage}
        totalUsers={users.length}
        initialContent={quickActionContent}
        initialPriority={quickActionPriority}
      />

      <MessageTemplateDialog
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSave={handleSaveTemplate}
        template={selectedTemplate}
        mode={templateDialogMode}
      />

      <UserSelectionDialog
        isOpen={showUserSelectionDialog}
        onClose={() => setShowUserSelectionDialog(false)}
        onConfirm={handleUserSelectionConfirm}
        users={users}
        preSelectedUsers={selectedUsersForMessage}
      />

      {/* Profile Dialogs */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your administrator profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Profile Image</Label>
              <ImageUpload
                value={editedAvatar}
                onChange={setEditedAvatar}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue={user?.username || 'admin'} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user?.username ? `${user.username}@offchat.com` : 'admin@offchat.com'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your account password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowChangePasswordDialog(false)}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEnable2FADialog} onOpenChange={setShowEnable2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Add an extra layer of security to your account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security to your account by requiring a second form of verification.
            </p>
            <div className="p-4 border rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Setup Instructions:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code or enter the setup key</li>
                <li>Enter the verification code to complete setup</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnable2FADialog(false)}>Cancel</Button>
            <Button onClick={() => setShowEnable2FADialog(false)}>Enable 2FA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Active Sessions</DialogTitle>
            <DialogDescription>Manage your active login sessions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-sm text-muted-foreground">Chrome on Windows • Active now</p>
                </div>
                <Badge variant="default">Current</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginHistoryDialog} onOpenChange={setShowLoginHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login History</DialogTitle>
            <DialogDescription>View your recent login activity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Today</p>
                  <p className="text-sm text-muted-foreground">Chrome on Windows • Kabul, Afghanistan</p>
                </div>
                <Badge variant="default">Successful</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialogs */}
      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Create a new user role with specific permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="Enter role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                placeholder="Enter role description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={permission}
                      checked={selectedPermissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, permission]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={permission} className="text-sm">
                      {permission.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={!newRoleName.trim() || !newRoleDescription.trim()}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Modify role permissions and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input
                id="edit-role-name"
                placeholder="Enter role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Input
                id="edit-role-description"
                placeholder="Enter role description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-${permission}`}
                      checked={selectedPermissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, permission]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`edit-${permission}`} className="text-sm">
                      {permission.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={!newRoleName.trim() || !newRoleDescription.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;