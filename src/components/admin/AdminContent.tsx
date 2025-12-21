import React, { Suspense, useState, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { StatsCards } from './StatsCards';
import { UserManagement } from './UserManagement';
import { MessageAnalytics } from './MessageAnalytics';
import { AuditLogs } from './AuditLogs';
import { BackupManager } from './BackupManager';
import { ProfileImageUpload } from './ProfileImageUpload';
import { EditProfileDialog } from './EditProfileDialog';
import { TrashManager } from './TrashManager';
import { SettingsManager } from './SettingsManager';
import { PermissionsManager } from './PermissionsManager';
import { ModerationPanel } from './ModerationPanel';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load heavy components
const ConversationMonitor = React.lazy(() => import('./ConversationMonitor').then(m => ({ default: m.ConversationMonitor })));
const DataTools = React.lazy(() => import('./DataTools').then(m => ({ default: m.DataTools })));

interface AdminContentProps {
  user?: { 
    id: string; 
    username: string; 
    avatar?: string; 
    status: "online" | "away" | "offline"; 
    role?: string; 
  };
}

export function AdminContent({ user }: AdminContentProps = {}) {
  const { state } = useAdmin();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const trashManagerRef = useRef<{ refresh: () => Promise<void> }>(null);

  const handleUserDeleted = async () => {
    if (trashManagerRef.current) {
      await trashManagerRef.current.refresh();
    }
  };

  const renderContent = () => {
    switch (state.activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <StatsCards users={state.users} />
            <MessageAnalytics />
          </div>
        );
      case 'users':
        return <UserManagement onUserDeleted={handleUserDeleted} />;
      case 'analytics':
        return <MessageAnalytics />;
      case 'moderation':
        return (
          <ErrorBoundary>
            <ModerationPanel />
          </ErrorBoundary>
        );
      case 'data':
        return (
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <DataTools />
            </Suspense>
          </ErrorBoundary>
        );
      case 'audit':
        return <AuditLogs />;
      case 'backup':
        return <BackupManager />;
      case 'messages':
        return <MessageAnalytics />;
      case 'conversations':
        return (
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <ConversationMonitor conversations={state.conversations} />
            </Suspense>
          </ErrorBoundary>
        );
      case 'permissions':
        return <PermissionsManager />;
      case 'settings':
        return <SettingsManager />;
      case 'trash':
        return <TrashManager ref={trashManagerRef} />;
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-card border border-border/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Admin Profile</h2>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <ProfileImageUpload 
                    currentImage={user?.avatar}
                    username={user?.username || 'admin'}
                    key={user?.avatar}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <p className="text-lg">{user?.username || 'admin'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-lg capitalize">{user?.role || 'Administrator'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-lg text-green-600">Online</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-lg">{new Date().toLocaleDateString()}</p>
                  </div>
                  <Button onClick={() => setShowEditProfile(true)} className="mt-4">
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
            <EditProfileDialog
              isOpen={showEditProfile}
              onClose={() => setShowEditProfile(false)}
              user={user}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a tab to view content</p>
          </div>
        );
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <ErrorBoundary>
        {renderContent()}
      </ErrorBoundary>
    </main>
  );
}
