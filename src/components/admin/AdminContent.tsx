import React, { Suspense, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '@/contexts/AdminContext';
import { usePermissions } from '@/contexts/PermissionsContext';
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
import { DepartmentPanel } from './DepartmentPanel';
import { UserAssignmentPanel } from './UserAssignmentPanel';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api';

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

interface ProfileUser {
  id: string;
  username: string;
  avatar?: string;
  role?: string;
  online_status?: string;
  last_seen?: string;
  status?: "online" | "away" | "offline";
}

export function AdminContent({ user }: AdminContentProps) {
  const { t } = useTranslation();
  const { state, dispatch } = useAdmin();
  const { can, loading: permsLoading } = usePermissions();
  console.log('[AdminContent] Permissions:', { can: can('view_users'), loading: permsLoading });

  // Debug: manual fetch button
  const handleFetchPermissions = async () => {
    console.log('[AdminContent] Manual permissions fetch...');
    try {
      const resp = await apiService.httpRequest('/admin/my-permissions/');
      console.log('[AdminContent] Manual response:', resp);
    } catch (err) {
      console.error('[AdminContent] Manual fetch error:', err);
    }
  };

  // Debug: force refresh permissions
  const handleRefreshPermissions = async () => {
    window.location.reload();
  };

  // Always show debug button for moderators
  const DebugButton = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleFetchPermissions}
        className="px-3 py-2 bg-orange-600 text-white rounded text-sm shadow-lg"
      >
        Debug Permissions
      </button>
    </div>
  );
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const trashManagerRef = useRef<{ refresh: () => Promise<void> }>(null);

  const exportUserData = async (userId: string, options: any) => {
    await apiService.httpRequest('/users/data/export/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, options }),
    });
  };

  const deleteUserData = async (userId: string, options: any) => {
    await apiService.httpRequest('/users/data/delete/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, options }),
    });
  };

  const handleUserDeleted = async () => {
    if (trashManagerRef.current) {
      await trashManagerRef.current.refresh();
    }
  };

  // Fetch full profile for the profile tab
  useEffect(() => {
    if (state.activeTab === 'profile' && user?.id && !profileUser) {
      apiService.httpRequest<ProfileUser>(`/users/profile/`)
        .then(resp => {
          if (resp.success && resp.data) {
            setProfileUser(resp.data);
          }
        })
        .catch(err => {
          console.error('Failed to load profile:', err);
        });
    }
  }, [state.activeTab, user?.id, profileUser]);

  const renderContent = () => {
    // Show access denied if permissions are still loading or user has none
    if (permsLoading) {
      return <Loading />;
    }
    if (!can('view_users') && !can('view_conversations') && !can('view_settings') && !can('view_backups') && !can('view_audit_logs')) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don’t have permission to access any admin features. Contact an administrator if you believe this is an error.
            </p>
            <button onClick={handleFetchPermissions} className="px-4 py-2 bg-blue-600 text-white rounded mr-2">
              Debug: Fetch Permissions
            </button>
            <button onClick={handleRefreshPermissions} className="px-4 py-2 bg-orange-600 text-white rounded">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    switch (state.activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <StatsCards />
            <DebugButton />
            <MessageAnalytics />
          </div>
        );
      case 'users':
        return <UserManagement onUserDeleted={handleUserDeleted} />;
      case 'analytics':
        return <MessageAnalytics />;
      case 'departments':
        return (
          <ErrorBoundary>
            <DepartmentPanel />
          </ErrorBoundary>
        );
      case 'assignments':
        return (
          <ErrorBoundary>
            <UserAssignmentPanel />
          </ErrorBoundary>
        );
      case 'data':
        const dataUser = user as any;
        const dataUserId = String(dataUser?.id || '');
        const dataUsername = String(dataUser?.username || '');
        return (
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <DataTools
                userId={dataUserId}
                username={dataUsername}
                isOpen={true}
                onClose={() => null}
                onExportData={exportUserData}
                onDeleteData={deleteUserData}
              />
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
              <ConversationMonitor />
            </Suspense>
          </ErrorBoundary>
        );
      case 'moderation':
        return <ModerationPanel />;
      case 'permissions':
        return <PermissionsManager />;
      case 'settings':
        return <SettingsManager />;
      case 'trash':
        return <TrashManager ref={trashManagerRef} />;
      case 'profile':
        // Use fetched profileUser if available, otherwise fall back to prop user
        const effectiveUser = (profileUser || user) as ProfileUser;
        const onlineStatus = effectiveUser?.online_status || effectiveUser?.status || 'offline';
        const statusText =
          onlineStatus === 'online'
            ? t('users.online')
            : onlineStatus === 'away'
              ? t('users.away')
              : t('users.offline');
        const statusClass =
          onlineStatus === 'online'
            ? 'text-green-600'
            : onlineStatus === 'away'
              ? 'text-yellow-600'
              : 'text-muted-foreground';

        const lastSeenText = effectiveUser?.last_seen
          ? new Date(effectiveUser.last_seen).toLocaleString()
          : t('common.noData');

        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-card border border-border/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">{t('admin.profile')}</h2>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <ProfileImageUpload 
                    currentImage={effectiveUser?.avatar}
                    username={effectiveUser?.username || t('users.admin')}
                    key={effectiveUser?.avatar}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('common.username')}</label>
                    <p className="text-lg">{effectiveUser?.username || t('users.admin')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('users.role')}</label>
                    <p className="text-lg capitalize">{effectiveUser?.role || t('users.administrator')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('common.status')}</label>
                    <p className={`text-lg ${statusClass}`}>{statusText}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('users.lastActive')}</label>
                    <p className="text-lg">{lastSeenText}</p>
                  </div>
                  <Button onClick={() => setShowEditProfile(true)} className="mt-4">
                    {t('common.edit')}
                  </Button>
                </div>
              </div>
            </div>
            <EditProfileDialog
              isOpen={showEditProfile}
              onClose={() => setShowEditProfile(false)}
              user={effectiveUser as any}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">{t('common.loading')}</p>
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
