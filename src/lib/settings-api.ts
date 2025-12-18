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

export const settingsApi = {
  async getAll(category?: string) {
    const url = new URL(`${API_BASE_URL}/admin/settings/`);
    if (category) url.searchParams.append('category', category);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json() as Promise<Setting[]>;
  },

  async getByKey(key: string) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}/`);
    if (!response.ok) throw new Error('Failed to fetch setting');
    return response.json() as Promise<Setting>;
  },

  async update(key: string, data: Partial<Setting>) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}/update/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update setting');
    return response.json() as Promise<Setting>;
  },

  async bulkUpdate(settings: Array<{ key: string; value: string }>) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/bulk/update/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error('Failed to bulk update settings');
    return response.json();
  },

  async delete(key: string) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}/`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete setting');
    return response.json();
  },

  async reset(category?: string) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    if (!response.ok) throw new Error('Failed to reset settings');
    return response.json();
  },
};
