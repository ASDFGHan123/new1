import React, { useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminContent } from './AdminContent';
import { useAdmin } from '@/contexts/AdminContext';

interface AdminDashboardLayoutProps {
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

export function AdminDashboardLayout({ user, onLogout, onProfileUpdate }: AdminDashboardLayoutProps) {
  const { state, dispatch } = useAdmin();

  // Debug: Log when user prop changes
  useEffect(() => {
    console.log('AdminDashboardLayout: User prop changed:', user?.username, user?.avatar);
  }, [user]);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar 
        user={user}
        activeTab={state.activeTab}
        onTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
        key={`header-${user?.avatar || 'no-avatar'}`} // Force re-render when avatar changes
        user={user} 
        onLogout={onLogout} 
        onProfileUpdate={onProfileUpdate} 
      />
        <AdminContent user={user} onProfileUpdate={onProfileUpdate} />
      </div>
    </div>
  );
}
