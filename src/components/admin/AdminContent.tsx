import React, { Suspense, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { DepartmentPanel } from './DepartmentPanel';
import { UserAssignmentPanel } from './UserAssignmentPanel';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
}

export function AdminContent({ user }: AdminContentProps = {}) {
  const { t } = useTranslation();
  const { state } = useAdmin();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const trashManagerRef = useRef<{ refresh: () => Promise<void> }>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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

  useEffect(() => {
    if (state.activeTab !== 'profile') {
      return;
    }

    let intervalId: number | undefined;
    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const resp = await apiService.httpRequest<ProfileUser>('/users/profile/');
        if (!cancelled && resp.success && resp.data) {
          setProfileUser(resp.data);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();
    intervalId = window.setInterval(loadProfile, 30000);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [state.activeTab]);

  const renderContent = () => {
    switch (state.activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <StatsCards />
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
        const dataUser = profileUser || (user as any);
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
        const effectiveUser = profileUser || (user as any);
        const onlineStatus = (effectiveUser?.online_status || effectiveUser?.status || 'offline') as string;
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
                    <p className="text-lg">{profileLoading ? t('common.loading') : lastSeenText}</p>
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
              user={effectiveUser}
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
