import React from 'react';
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
}

export function AdminDashboardLayout({ user, onLogout }: AdminDashboardLayoutProps) {
  const { state, dispatch } = useAdmin();

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar 
        user={user}
        activeTab={state.activeTab}
        onTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} onLogout={onLogout} />
        <AdminContent user={user} />
      </div>
    </div>
  );
}
