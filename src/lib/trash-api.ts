import { apiService } from './api';

export const trashApi = {
  async getTrash() {
    try {
      const response = await apiService.httpRequest('/admin/trash/');
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch trash');
    } catch (error) {
      console.error('Error fetching trash:', error);
      throw error;
    }
  },

  async restoreItem(trashId: string) {
    try {
      const response = await apiService.httpRequest(`/admin/trash/${trashId}/restore/`, {
        method: 'POST'
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to restore item');
    } catch (error) {
      console.error('Error restoring item:', error);
      throw error;
    }
  },

  async permanentlyDeleteItem(trashId: string) {
    try {
      const response = await apiService.httpRequest(`/admin/trash/${trashId}/`, {
        method: 'DELETE'
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to delete item');
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  async emptyTrash() {
    try {
      const response = await apiService.httpRequest('/admin/trash/empty/', {
        method: 'POST'
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to empty trash');
    } catch (error) {
      console.error('Error emptying trash:', error);
      throw error;
    }
  }
};
