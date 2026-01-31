import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { moderationApi } from '@/lib/moderation-api';
import { useToast } from '@/hooks/useNotifications';

export function ModerationPanel() {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingUsersStats, setPendingUsersStats] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await moderationApi.getPendingUsers();
        if (res?.success && res.data) {
          const users = Array.isArray(res.data) ? res.data : res.data.results || [];
          setPendingUsers(users);
          setPendingUsersStats({ total: users.length });
        }
      } catch (err) {
        console.error('Error:', err);
      }
      setLoading(false);
    };
    
    load();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await moderationApi.approvePendingUser(id);
      success(t('moderation.userApproved'));
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setPendingUsersStats({ total: Math.max(0, pendingUsersStats.total - 1) });
    } catch (err) {
      showError(t('moderation.failedToApproveUser'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await moderationApi.rejectPendingUser(id);
      success(t('moderation.userRejected'));
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setPendingUsersStats({ total: Math.max(0, pendingUsersStats.total - 1) });
    } catch (err) {
      showError(t('moderation.failedToRejectUser'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('moderation.contentModeration')}</h1>
        <p className="text-muted-foreground mt-2">{t('moderation.pendingUsers')}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t('moderation.pendingReview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingUsersStats.total}</div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">{t('common.loading')}</div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t('users.noUsersFound')}</div>
        ) : (
          pendingUsers.map(user => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{user.username}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">{t('users.pending')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>{t('users.joinDate')}: {new Date(user.created_at).toLocaleDateString()}</div>
                  {user.first_name && <div>{t('common.name')}: {user.first_name} {user.last_name}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleApprove(user.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> {t('moderation.approve')}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(user.id)}>
                    <XCircle className="w-4 h-4 mr-1" /> {t('moderation.reject')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
