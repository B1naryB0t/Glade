// frontend/src/services/notificationService.js
import { apiClient } from "./apiClient";

export const notificationService = {
  /**
   * Get notifications
   * @param {Object} params - {unread_only, page, limit}
   * @returns {Promise<Array>}
   */
  async getNotifications(params = {}) {
    const response = await apiClient.get("/notifications/", { params });
    return response.data.results || response.data;
  },

  /**
   * Get unread notifications
   * @returns {Promise<Array>}
   */
  async getUnread() {
    const response = await apiClient.get("/notifications/unread/");
    return response.data.results || response.data;
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>}
   */
  async getUnreadCount() {
    const response = await apiClient.get("/notifications/count/");
    return response.data.unread_count;
  },

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId) {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/`,
      {
        read: true,
      },
    );
    return response.data;
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   */
  async markAllAsRead() {
    const response = await apiClient.post("/notifications/mark-all-read/");
    return response.data;
  },

  /**
   * Delete notification
   * @param {string} notificationId
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId) {
    await apiClient.delete(`/notifications/${notificationId}/`);
  },

  /**
   * Get notification preferences
   * @returns {Promise<Object>}
   */
  async getPreferences() {
    const response = await apiClient.get("/notifications/preferences/");
    return response.data;
  },

  /**
   * Update notification preferences
   * @param {Object} preferences
   * @returns {Promise<Object>}
   */
  async updatePreferences(preferences) {
    const response = await apiClient.put(
      "/notifications/preferences/",
      preferences,
    );
    return response.data;
  },
};
