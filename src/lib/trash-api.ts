import { apiService } from './api';

export const trashApi = {
  async getTrash() {
    return apiService.request('/trash/');
  },

  async restoreFromTrash(itemId: string, itemType: string) {
    return apiService.request('/trash/restore/', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, item_type: itemType }),
    });
  },

  async permanentlyDeleteFromTrash(itemId: string) {
    return apiService.request(`/trash/${itemId}/`, {
      method: 'DELETE',
    });
  },

  async emptyTrash() {
    return apiService.request('/trash/empty_trash/', {
      method: 'POST',
    });
  },
};
