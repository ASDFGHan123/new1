import { apiService } from './api';

export interface SuspiciousActivity {
  id: string;
  ip_address: string;
  user?: { id: string; username: string };
  activity_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  timestamp: string;
}

export interface UserForModeration {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'suspended' | 'banned' | 'pending';
  report_count: number;
  last_seen: string;
}

export const moderationApi = {
  async getSuspiciousActivities(): Promise<SuspiciousActivity[]> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/admin/suspicious-activities/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Response status:', response.status);
        return [];
      }
      
      const data = await response.json();
      return data.results || data || [];
    } catch (error) {
      console.error('Failed to fetch suspicious activities:', error);
      return [];
    }
  },

  async getReportedUsers(): Promise<UserForModeration[]> {
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        return response.data
          .filter((u: any) => u.report_count > 0)
          .map((u: any) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            status: u.status,
            report_count: u.report_count,
            last_seen: u.last_seen,
          }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch reported users:', error);
      return [];
    }
  },

  async warnUser(userId: string, reason: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/users/admin/users/${userId}/warn/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to warn user:', error);
      return false;
    }
  },

  async suspendUser(userId: string, duration: string, reason: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/users/admin/users/${userId}/suspend/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration, reason }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to suspend user:', error);
      return false;
    }
  },

  async banUser(userId: string, reason: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/users/admin/users/${userId}/ban/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to ban user:', error);
      return false;
    }
  },

  async resolveSuspiciousActivity(activityId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/admin/suspicious-activities/${activityId}/resolve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to resolve activity:', error);
      return false;
    }
  },
};
