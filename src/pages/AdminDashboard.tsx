import React, { useEffect } from 'react';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
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
  onProfileUpdate?: (updatedUser?: { avatar?: string }) => void;
}

function AdminDashboardContent({ user, onLogout, onProfileUpdate }: AdminDashboardProps) {
  const { dispatch } = useAdmin();
  console.log('[AdminDashboard] Rendering with user:', user?.username, user?.role);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResponse = await apiService.getUsers();
        if (usersResponse.success && usersResponse.data) {
          dispatch({ type: 'SET_USERS', payload: usersResponse.data });
        }

        const rolesResponse = await apiService.httpRequest<any>('/users/groups/');
        if (rolesResponse.success && rolesResponse.data) {
          const rawRoles = (rolesResponse.data.results || rolesResponse.data) as any[];
          const roles: Role[] = rawRoles.map((r: any) => ({
            id: String(r.id),
            name: r.name,
            description: '',
            permissions: (r.permissions || []).map((p: any) => String(p)),
            isDefault: false,
            createdAt: new Date().toISOString(),
          }));
          dispatch({ type: 'SET_ROLES', payload: roles });
        }

        const conversationsResponse = await apiService.httpRequest<any>('/admin/conversations/');
        if (conversationsResponse.success && conversationsResponse.data) {
          const rawConversations = (conversationsResponse.data.conversations || []) as any[];
          const conversations: Conversation[] = rawConversations.map((c: any) => ({
            id: String(c.id),
            type: (c.type === 'group' ? 'group' : 'private'),
            title: c.title || 'Conversation',
            participants: (c.participant_list || []).map((p: any) => String(p.id)),
            messages: [],
            createdAt: c.created_at || new Date().toISOString(),
            isActive: Boolean(c.is_active),
          }));
          dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
        }

        const templatesResponse = await apiService.getMessageTemplates();
        if (templatesResponse.success && templatesResponse.data) {
          dispatch({ type: 'SET_MESSAGE_TEMPLATES', payload: templatesResponse.data as any });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    
    fetchData();
  }, [dispatch]);

  return <AdminDashboardLayout user={user} onLogout={onLogout} onProfileUpdate={onProfileUpdate} />;
}

const AdminDashboard = (props: AdminDashboardProps) => {
  return (
    <AdminProvider>
      <PermissionsProvider>
        <AdminDashboardContent {...props} />
      </PermissionsProvider>
    </AdminProvider>
  );
};

export default AdminDashboard;
