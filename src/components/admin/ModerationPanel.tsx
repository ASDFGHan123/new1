import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Trash2, Clock } from 'lucide-react';
import { moderationApi, FlaggedMessage, UserModeration, ContentReview } from '@/lib/moderation-api';
import { useToast } from '@/hooks/useNotifications';

export function ModerationPanel() {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('pending-users');
  
  // Pending Users State
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingUsersStats, setPendingUsersStats] = useState({ total: 0 });
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(false);
  
  // Message Moderation State
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [messageStats, setMessageStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, removed: 0 });
  const [messageFilter, setMessageFilter] = useState('pending');
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // User Moderation State
  const [userModerations, setUserModerations] = useState<UserModeration[]>([]);
  const [moderationStats, setModerationStats] = useState({ total: 0, active: 0, suspended: 0, banned: 0 });
  const [moderationFilter, setModerationFilter] = useState('active');
  const [loadingModerations, setLoadingModerations] = useState(false);
  
  // Content Review State
  const [contentReviews, setContentReviews] = useState<ContentReview[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 });
  const [reviewFilter, setReviewFilter] = useState('pending');
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Review notes state
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Load pending users
  useEffect(() => {
    if (activeTab === 'pending-users') {
      loadPendingUsers();
      loadPendingUsersStats();
    }
  }, [activeTab]);

  const loadPendingUsers = async () => {
    setLoadingPendingUsers(true);
    try {
      const response = await moderationApi.getPendingUsers();
      if (response?.success) {
        const data = response.data || [];
        setPendingUsers(Array.isArray(data) ? data : []);
      } else {
        setPendingUsers([]);
      }
    } catch (err) {
      console.error('Error loading pending users:', err);
      setPendingUsers([]);
    } finally {
      setLoadingPendingUsers(false);
    }
  };

  const loadPendingUsersStats = async () => {
    try {
      const response = await moderationApi.getPendingUsersStats();
      if (response?.success) {
        setPendingUsersStats(response.data || { total: 0 });
      }
    } catch (err) {
      console.error('Error loading pending users stats:', err);
    }
  };

  // Load flagged messages
  useEffect(() => {
    if (activeTab === 'messages') {
      loadFlaggedMessages();
      loadMessageStats();
    }
  }, [activeTab, messageFilter]);

  const loadFlaggedMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await moderationApi.getFlaggedMessages({ status: messageFilter });
      if (response?.success) {
        const data = response.data || [];
        setFlaggedMessages(Array.isArray(data) ? data : []);
      } else {
        setFlaggedMessages([]);
      }
    } catch (err) {
      console.error('Error loading flagged messages:', err);
      setFlaggedMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMessageStats = async () => {
    try {
      const response = await moderationApi.getFlaggedMessageStats();
      if (response?.success) {
        setMessageStats(response.data || { total: 0, pending: 0, approved: 0, rejected: 0, removed: 0 });
      }
    } catch (err) {
      console.error('Error loading message stats:', err);
    }
  };

  // Load user moderations
  useEffect(() => {
    if (activeTab === 'users') {
      loadUserModerations();
      loadModerationStats();
    }
  }, [activeTab, moderationFilter]);

  const loadUserModerations = async () => {
    setLoadingModerations(true);
    try {
      const response = await moderationApi.getUserModerations({ status: moderationFilter });
      if (response?.success) {
        const data = response.data || [];
        setUserModerations(Array.isArray(data) ? data : []);
      } else {
        setUserModerations([]);
      }
    } catch (err) {
      console.error('Error loading user moderations:', err);
      setUserModerations([]);
    } finally {
      setLoadingModerations(false);
    }
  };

  const loadModerationStats = async () => {
    try {
      const response = await moderationApi.getUserModerationStats();
      if (response?.success) {
        setModerationStats(response.data || { total: 0, active: 0, suspended: 0, banned: 0 });
      }
    } catch (err) {
      console.error('Error loading moderation stats:', err);
    }
  };

  // Load content reviews
  useEffect(() => {
    if (activeTab === 'reviews') {
      loadContentReviews();
      loadReviewStats();
    }
  }, [activeTab, reviewFilter]);

  const loadContentReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await moderationApi.getContentReviews({ status: reviewFilter });
      if (response?.success) {
        const data = response.data || [];
        setContentReviews(Array.isArray(data) ? data : []);
      } else {
        setContentReviews([]);
      }
    } catch (err) {
      console.error('Error loading content reviews:', err);
      setContentReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadReviewStats = async () => {
    try {
      const response = await moderationApi.getContentReviewStats();
      if (response?.success) {
        setReviewStats(response.data || { total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 });
      }
    } catch (err) {
      console.error('Error loading review stats:', err);
    }
  };

  // Pending users actions
  const handleApprovePendingUser = async (id: string) => {
    try {
      await moderationApi.approvePendingUser(id);
      success(t('moderation.userApproved'));
      loadPendingUsers();
      loadPendingUsersStats();
    } catch (err) {
      console.error('Error approving user:', err);
      showError(t('moderation.failedToApproveUser'));
    }
  };

  const handleRejectPendingUser = async (id: string) => {
    try {
      await moderationApi.rejectPendingUser(id);
      success(t('moderation.userRejected'));
      loadPendingUsers();
      loadPendingUsersStats();
    } catch (err) {
      console.error('Error rejecting user:', err);
      showError(t('moderation.failedToRejectUser'));
    }
  };

  // Message moderation actions
  const handleApproveFlaggedMessage = async (id: string) => {
    try {
      const notes = reviewNotes[id] || '';
      await moderationApi.approveFlaggedMessage(id, notes);
      success('Message approved');
      loadFlaggedMessages();
      setReviewNotes({ ...reviewNotes, [id]: '' });
    } catch (err) {
      console.error('Error approving message:', err);
    }
  };

  const handleRejectFlaggedMessage = async (id: string) => {
    try {
      const notes = reviewNotes[id] || '';
      await moderationApi.rejectFlaggedMessage(id, notes);
      success('Message rejected');
      loadFlaggedMessages();
      setReviewNotes({ ...reviewNotes, [id]: '' });
    } catch (err) {
      console.error('Error rejecting message:', err);
    }
  };

  const handleRemoveFlaggedMessage = async (id: string) => {
    try {
      const notes = reviewNotes[id] || '';
      await moderationApi.removeFlaggedMessage(id, notes);
      success('Message removed');
      loadFlaggedMessages();
      setReviewNotes({ ...reviewNotes, [id]: '' });
    } catch (err) {
      console.error('Error removing message:', err);
    }
  };

  // User moderation actions
  const handleLiftModeration = async (id: string) => {
    try {
      await moderationApi.liftUserModeration(id);
      success('Moderation lifted');
      loadUserModerations();
    } catch (err) {
      console.error('Error lifting moderation:', err);
    }
  };

  // Content review actions
  const handleApproveReview = async (id: string) => {
    try {
      const notes = reviewNotes[id] || '';
      await moderationApi.approveContentReview(id, notes);
      success('Content approved');
      loadContentReviews();
      setReviewNotes({ ...reviewNotes, [id]: '' });
    } catch (err) {
      console.error('Error approving content:', err);
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      const notes = reviewNotes[id] || '';
      await moderationApi.rejectContentReview(id, notes);
      success('Content rejected');
      loadContentReviews();
      setReviewNotes({ ...reviewNotes, [id]: '' });
    } catch (err) {
      console.error('Error rejecting content:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'removed':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'lifted':
        return 'bg-green-100 text-green-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('moderation.contentModeration')}</h1>
        <p className="text-muted-foreground mt-2">{t('moderation.pendingUsers')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="pending-users">
            {t('moderation.pendingUsers')}
            {pendingUsersStats.total > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingUsersStats.total}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Users Tab */}
        <TabsContent value="pending-users" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('moderation.pendingReview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingUsersStats.total}</div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loadingPendingUsers ? (
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
                        <CardDescription>{user.email}</CardDescription>
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
                      <Button size="sm" variant="outline" onClick={() => handleApprovePendingUser(user.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> {t('moderation.approve')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectPendingUser(user.id)}>
                        <XCircle className="w-4 h-4 mr-1" /> {t('moderation.reject')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>






      </Tabs>
    </div>
  );
}
