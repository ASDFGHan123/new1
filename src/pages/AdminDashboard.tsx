import React, { useEffect } from 'react';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { User as ApiUser, apiService } from '@/lib/api';
import type { Role, Conversation, MessageTemplate } from '@/contexts/AdminContext';

interface AdminDashboardProps {
  users?: ApiUser[];
  roles?: Role[];
  conversations?: Conversation[];
  messageTemplates?: MessageTemplate[];
  user?: { 
    id: string; 
    username: string; 
    avatar?: string; 
    status: "online" | "away" | "offline"; 
    role?: string; 
  };
  onLogout?: () => void;
}

function AdminDashboardContent({ user, onLogout }: AdminDashboardProps) {
  const { dispatch } = useAdmin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResponse = await apiService.getUsers();
        if (usersResponse.success && usersResponse.data) {
          dispatch({ type: 'SET_USERS', payload: usersResponse.data });
        }
        
        const defaultRoles: Role[] = [
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
        ];
        
        const defaultConversations: Conversation[] = [
          {
            id: "1",
            type: "group",
            title: "General Chat",
            participants: usersResponse.data?.slice(0, 3).map(u => u.id) || [],
            messages: [
              { id: "1", content: "Welcome to OffChat!", sender: "system", timestamp: new Date().toISOString(), type: "system" }
            ],
            createdAt: new Date().toISOString(),
            isActive: true
          }
        ];
        
        const defaultTemplates: MessageTemplate[] = [
          {
            id: "1",
            name: "Welcome Message",
            content: "Welcome to OffChat! We're glad to have you here.",
            category: "General"
          },
          {
            id: "2",
            name: "Maintenance Notice",
            content: "Scheduled maintenance will begin soon. Please save your work.",
            category: "System"
          }
        ];
        
        dispatch({ type: 'SET_ROLES', payload: defaultRoles });
        dispatch({ type: 'SET_CONVERSATIONS', payload: defaultConversations });
        dispatch({ type: 'SET_MESSAGE_TEMPLATES', payload: defaultTemplates });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    
    fetchData();
  }, [dispatch]);

  return <AdminDashboardLayout user={user} onLogout={onLogout} />;
}

const AdminDashboard = (props: AdminDashboardProps) => {
  return (
    <AdminProvider>
      <AdminDashboardContent {...props} />
    </AdminProvider>
  );
};

export default AdminDashboard;
