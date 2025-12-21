import { apiService } from './api';

export interface FlaggedMessage {
  id: string;
  message_id: string;
  message_content: string;
  sender_id: string;
  sender_username: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  reported_by: string;
  reported_by_username: string;
  reviewed_by?: string;
  reviewed_by_username?: string;
  review_notes: string;
  reported_at: string;
  reviewed_at?: string;
}

export interface UserModeration {
  id: string;
  user: string;
  user_username: string;
  action_type: 'suspend' | 'ban' | 'warn' | 'mute';
  reason: string;
  status: 'active' | 'expired' | 'lifted';
  duration_days?: number;
  moderator: string;
  moderator_username: string;
  created_at: string;
  expires_at?: string;
  lifted_at?: string;
}

export interface ContentReview {
  id: string;
  content_type: 'message' | 'user_profile' | 'group';
  content_id: string;
  content_data: Record<string, any>;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  priority: number;
  submitted_by?: string;
  submitted_by_username?: string;
  reviewed_by?: string;
  reviewed_by_username?: string;
  review_notes: string;
  created_at: string;
  reviewed_at?: string;
}

export const moderationApi = {
  getFlaggedMessages: async (filters?: { status?: string; reason?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reason) params.append('reason', filters.reason);
    return apiService.httpRequest(`/admin/flagged-messages/?${params}`);
  },

  getFlaggedMessageStats: async () => {
    return apiService.httpRequest('/admin/flagged-messages/stats/');
  },

  approveFlaggedMessage: async (id: string, notes: string = '') => {
    return apiService.httpRequest(`/admin/flagged-messages/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  rejectFlaggedMessage: async (id: string, notes: string = '') => {
    return apiService.httpRequest(`/admin/flagged-messages/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  removeFlaggedMessage: async (id: string, notes: string = '') => {
    return apiService.httpRequest(`/admin/flagged-messages/${id}/remove/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  getUserModerations: async (filters?: { action_type?: string; status?: string; user_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.action_type) params.append('action_type', filters.action_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    return apiService.httpRequest(`/admin/user-moderation/?${params}`);
  },

  getActiveModerations: async () => {
    return apiService.httpRequest('/admin/user-moderation/active/');
  },

  getUserModerationStats: async () => {
    return apiService.httpRequest('/admin/user-moderation/stats/');
  },

  createUserModeration: async (data: {
    user: string;
    action_type: string;
    reason: string;
    duration_days?: number;
  }) => {
    return apiService.httpRequest('/admin/user-moderation/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  liftUserModeration: async (id: string) => {
    return apiService.httpRequest(`/admin/user-moderation/${id}/lift/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getContentReviews: async (filters?: { status?: string; content_type?: string; priority?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.content_type) params.append('content_type', filters.content_type);
    if (filters?.priority) params.append('priority', filters.priority);
    return apiService.httpRequest(`/admin/content-reviews/?${params}`);
  },

  getPendingReviews: async () => {
    return apiService.httpRequest('/admin/content-reviews/pending/');
  },

  getContentReviewStats: async () => {
    return apiService.httpRequest('/admin/content-reviews/stats/');
  },

  createContentReview: async (data: {
    content_type: string;
    content_id: string;
    content_data: Record<string, any>;
    priority?: number;
  }) => {
    return apiService.httpRequest('/admin/content-reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approveContentReview: async (id: string, notes: string = '') => {
    return apiService.httpRequest(`/admin/content-reviews/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  rejectContentReview: async (id: string, notes: string = '') => {
    return apiService.httpRequest(`/admin/content-reviews/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  startContentReview: async (id: string) => {
    return apiService.httpRequest(`/admin/content-reviews/${id}/start-review/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getPendingUsers: async () => {
    return apiService.httpRequest('/admin/pending-users/');
  },

  approvePendingUser: async (id: string) => {
    return apiService.httpRequest(`/admin/pending-users/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  rejectPendingUser: async (id: string) => {
    return apiService.httpRequest(`/admin/pending-users/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getPendingUsersStats: async () => {
    return apiService.httpRequest('/admin/pending-users/stats/');
  },
};
