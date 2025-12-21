import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Trash2, Clock } from 'lucide-react';
import { moderationApi, FlaggedMessage, UserModeration, ContentReview } from '@/lib/moderation-api';
import { useToast } from '@/hooks/useNotifications';

export function ModerationPanel() {
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
      success('User approved');
      loadPendingUsers();
      loadPendingUsersStats();
    } catch (err) {
      console.error('Error approving user:', err);
      showError('Failed to approve user');
    }
  };

  const handleRejectPendingUser = async (id: string) => {
    try {
      await moderationApi.rejectPendingUser(id);
      success('User rejected');
      loadPendingUsers();
      loadPendingUsersStats();
    } catch (err) {
      console.error('Error rejecting user:', err);
      showError('Failed to reject user');
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
        <h1 className="text-3xl font-bold">Moderation Center</h1>
        <p className="text-muted-foreground mt-2">Manage content, users, and review workflows</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending-users">
            Pending Users
            {pendingUsersStats.total > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingUsersStats.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages">
            Message Moderation
            {messageStats.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{messageStats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">
            User Moderation
            {moderationStats.active > 0 && (
              <Badge variant="destructive" className="ml-2">{moderationStats.active}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Content Review
            {reviewStats.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{reviewStats.pending}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Users Tab */}
        <TabsContent value="pending-users" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingUsersStats.total}</div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loadingPendingUsers ? (
              <div className="text-center py-8">Loading...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending users</div>
            ) : (
              pendingUsers.map(user => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{user.username}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                      {user.first_name && <div>Name: {user.first_name} {user.last_name}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleApprovePendingUser(user.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectPendingUser(user.id)}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Message Moderation Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messageStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{messageStats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{messageStats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{messageStats.rejected}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Removed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{messageStats.removed}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'removed'].map(status => (
              <Button
                key={status}
                variant={messageFilter === status ? 'default' : 'outline'}
                onClick={() => setMessageFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {loadingMessages ? (
              <div className="text-center py-8">Loading...</div>
            ) : flaggedMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No flagged messages</div>
            ) : (
              flaggedMessages.map(msg => (
                <Card key={msg.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">From: {msg.sender_username}</CardTitle>
                        <CardDescription>Reason: {msg.reason}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(msg.status)}>{msg.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded text-sm">{msg.message_content}</div>
                    <div className="text-xs text-muted-foreground">
                      Reported by: {msg.reported_by_username} • {new Date(msg.reported_at).toLocaleDateString()}
                    </div>
                    {msg.status === 'pending' && (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Review notes..."
                          value={reviewNotes[msg.id] || ''}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [msg.id]: e.target.value })}
                          className="w-full p-2 border rounded text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleApproveFlaggedMessage(msg.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectFlaggedMessage(msg.id)}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveFlaggedMessage(msg.id)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* User Moderation Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{moderationStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{moderationStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{moderationStats.suspended}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Banned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{moderationStats.banned}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            {['active', 'expired', 'lifted'].map(status => (
              <Button
                key={status}
                variant={moderationFilter === status ? 'default' : 'outline'}
                onClick={() => setModerationFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {loadingModerations ? (
              <div className="text-center py-8">Loading...</div>
            ) : userModerations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No user moderations</div>
            ) : (
              userModerations.map(mod => (
                <Card key={mod.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{mod.user_username}</CardTitle>
                        <CardDescription>{mod.action_type.toUpperCase()}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(mod.status)}>{mod.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded text-sm">{mod.reason}</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>By: {mod.moderator_username}</div>
                      <div>Created: {new Date(mod.created_at).toLocaleDateString()}</div>
                      {mod.expires_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {new Date(mod.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {mod.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => handleLiftModeration(mod.id)}>
                        Lift Moderation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Content Review Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reviewStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{reviewStats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{reviewStats.in_review}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reviewStats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{reviewStats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            {['pending', 'in_review', 'approved', 'rejected'].map(status => (
              <Button
                key={status}
                variant={reviewFilter === status ? 'default' : 'outline'}
                onClick={() => setReviewFilter(status)}
              >
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {loadingReviews ? (
              <div className="text-center py-8">Loading...</div>
            ) : contentReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No content reviews</div>
            ) : (
              contentReviews.map(review => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{review.content_type}</CardTitle>
                        <CardDescription>Priority: {review.priority}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded text-sm max-h-32 overflow-y-auto">
                      {JSON.stringify(review.content_data, null, 2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(review.created_at).toLocaleDateString()}
                    </div>
                    {review.status === 'pending' && (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Review notes..."
                          value={reviewNotes[review.id] || ''}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [review.id]: e.target.value })}
                          className="w-full p-2 border rounded text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleApproveReview(review.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectReview(review.id)}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
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
