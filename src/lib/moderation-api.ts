import { apiService } from './api';

export const moderationApi = {
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
