import { API_BASE_URL } from './api';

export interface Setting {
  id?: string;
  key: string;
  value: string;
  category: string;
  description: string;
  is_public: boolean;
  updated_by?: string;
  updated_at?: string;
}

const getAuthHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let token = localStorage.getItem('admin_access_token');
  if (!token) {
    token = localStorage.getItem('chat_access_token');
  }
  if (!token) {
    token = localStorage.getItem('access_token');
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const settingsApi = {
  async getAll(category?: string) {
    const url = new URL(`${API_BASE_URL}/admin/settings/`);
    if (category) url.searchParams.append('category', category);
    
    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json() as Promise<Setting[]>;
  },

  async getByKey(key: string) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}/`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch setting');
    return response.json() as Promise<Setting>;
  },

  async update(key: string, data: Partial<Setting>) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}/update/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update setting');
    return response.json() as Promise<Setting>;
  },

  async bulkUpdate(settings: Array<{ key: string; value: string }>) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/bulk/update/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error('Failed to bulk update settings');
    return response.json();
  },

  async delete(key: string) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete setting');
    return response.json();
  },

  async reset(category?: string) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/reset/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ category }),
    });
    if (!response.ok) throw new Error('Failed to reset settings');
    return response.json();
  },
};
