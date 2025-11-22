// ============================================================================
// UNIFIED API SERVICE - frontend/src/services/api.js
// Complete API service with all endpoints consolidated
// ============================================================================

import { authService } from "./authService";
import { postService } from "./postService";
import { userService } from "./userService";
import { notificationService } from "./notificationService";
import { apiClient } from "./apiClient";

export const api = {
  // --------------------------------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------------------------------

  /**
   * Login user
   * @param {Object} credentials - {email, password}
   * @returns {Promise<{user: Object, token: string}>}
   */
  async login({ email, password }) {
    return await authService.login({ email, password });
  },

  /**
   * Register new user
   * @param {Object} userData - {username, email, password}
   * @returns {Promise<{user: Object, token: string}>}
   */
  async register({ username, email, password }) {
    return await authService.register({ username, email, password });
  },

  /**
   * Logout user
   */
  logout() {
    authService.logout();
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    return await authService.getCurrentUser();
  },

  /**
   * Request password reset
   * @param {string} email
   * @returns {Promise<{message: string}>}
   */
  async requestPasswordReset(email) {
    return await authService.requestPasswordReset(email);
  },

  /**
   * Reset password with token
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<{message: string}>}
   */
  async resetPassword(token, newPassword) {
    return await authService.resetPassword(token, newPassword);
  },

  /**
   * Delete account
   * @returns {Promise<Object>}
   */
  async deleteAccount() {
    return await authService.deleteAccount();
  },

  // --------------------------------------------------------------------------
  // POSTS
  // --------------------------------------------------------------------------

  /**
   * Get all posts (feed)
   * @param {Object} params - {page, limit, visibility}
   * @returns {Promise<Array|Object>}
   */
  async getPosts(params = {}) {
    return await postService.getPosts(params);
  },

  /**
   * Get posts by user
   * @param {string} username
   * @param {Object} params
   * @returns {Promise<Array|Object>}
   */
  async getUserPosts(username, params = {}) {
    return await postService.getUserPosts(username, params);
  },

  /**
   * Get single post
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async getPost(postId) {
    return await postService.getPost(postId);
  },

  /**
   * Create new post
   * @param {Object} postData - {content, visibility, location, content_warning}
   * @returns {Promise<Object>}
   */
  async createPost(postData) {
    return await postService.createPost(postData);
  },

  /**
   * Update post
   * @param {string} postId
   * @param {Object} postData
   * @returns {Promise<Object>}
   */
  async updatePost(postId, postData) {
    return await postService.updatePost(postId, postData);
  },

  /**
   * Delete post
   * @param {string} postId
   * @returns {Promise<void>}
   */
  async deletePost(postId) {
    return await postService.deletePost(postId);
  },

  /**
   * Get local posts (geographic)
   * @param {Object} location - {latitude, longitude}
   * @param {number} radius - Radius in meters
   * @returns {Promise<Array>}
   */
  async getLocalPosts(location, radius = 1000) {
    return await postService.getLocalPosts(location, radius);
  },

  /**
   * Toggle like on post
   * @param {string} postId
   * @returns {Promise<{liked_by_current_user: boolean, likes_count: number}>}
   */
  async toggleLike(postId) {
    return await postService.toggleLike(postId);
  },

  /**
   * Search posts
   * @param {string} query
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async searchPosts(query, params = {}) {
    return await postService.searchPosts(query, params);
  },

  // --------------------------------------------------------------------------
  // COMMENTS
  // --------------------------------------------------------------------------

  /**
   * Get comments for post
   * @param {string} postId
   * @returns {Promise<Array>}
   */
  async getComments(postId) {
    return await postService.getComments(postId);
  },

  /**
   * Add comment to post
   * @param {string} postId
   * @param {string} content
   * @returns {Promise<Object>}
   */
  async addComment(postId, content) {
    return await postService.addComment(postId, content);
  },

  /**
   * Delete comment
   * @param {string} commentId
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    return await postService.deleteComment(commentId);
  },

  // --------------------------------------------------------------------------
  // USERS
  // --------------------------------------------------------------------------

  /**
   * Get user profile
   * @param {string} username
   * @returns {Promise<Object>}
   */
  async getUserProfile(username) {
    return await userService.getUserProfile(username);
  },

  /**
   * Update user profile
   * @param {string} username
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async updateUserProfile(username, profileData) {
    return await userService.updateProfile(username, profileData);
  },

  /**
   * Get user settings
   * @returns {Promise<Object>}
   */
  async getUserSettings() {
    return await userService.getUserSettings();
  },

  /**
   * Update user settings
   * @param {Object} settings
   * @returns {Promise<Object>}
   */
  async updateUserSettings(settings) {
    return await userService.updateUserSettings(settings);
  },

  /**
   * Search users
   * @param {string} query
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async searchUsers(query, params = {}) {
    return await userService.searchUsers(query, params);
  },

  /**
   * Upload avatar
   * @param {string} username
   * @param {File} file
   * @returns {Promise<Object>}
   */
  async uploadAvatar(username, file) {
    return await userService.uploadAvatar(username, file);
  },

  // --------------------------------------------------------------------------
  // FOLLOW RELATIONSHIPS
  // --------------------------------------------------------------------------

  /**
   * Follow user
   * @param {string} username
   * @returns {Promise<{following: boolean}>}
   */
  async followUser(username) {
    return await userService.followUser(username);
  },

  /**
   * Unfollow user
   * @param {string} username
   * @returns {Promise<{following: boolean}>}
   */
  async unfollowUser(username) {
    return await userService.unfollowUser(username);
  },

  /**
   * Get user's followers
   * @param {string} username
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async getFollowers(username, params = {}) {
    return await userService.getFollowers(username, params);
  },

  /**
   * Get users that user is following
   * @param {string} username
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async getFollowing(username, params = {}) {
    return await userService.getFollowing(username, params);
  },

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------

  /**
   * Get notifications
   * @param {Object} params - {unread_only, page, limit}
   * @returns {Promise<Array>}
   */
  async getNotifications(params = {}) {
    return await notificationService.getNotifications(params);
  },

  /**
   * Get unread notifications
   * @returns {Promise<Array>}
   */
  async getUnreadNotifications() {
    return await notificationService.getUnread();
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>}
   */
  async getUnreadNotificationCount() {
    return await notificationService.getUnreadCount();
  },

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  async markNotificationRead(notificationId) {
    return await notificationService.markAsRead(notificationId);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   */
  async markAllNotificationsRead() {
    return await notificationService.markAllAsRead();
  },

  /**
   * Delete notification
   * @param {string} notificationId
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId) {
    return await notificationService.deleteNotification(notificationId);
  },

  /**
   * Get notification preferences
   * @returns {Promise<Object>}
   */
  async getNotificationPreferences() {
    return await notificationService.getPreferences();
  },

  /**
   * Update notification preferences
   * @param {Object} preferences
   * @returns {Promise<Object>}
   */
  async updateNotificationPreferences(preferences) {
    return await notificationService.updatePreferences(preferences);
  },

  // --------------------------------------------------------------------------
  // FILE UPLOADS
  // --------------------------------------------------------------------------

  /**
   * Upload image for post
   * @param {File} file
   * @returns {Promise<{url: string}>}
   */
  async uploadImage(file) {
    return await postService.uploadImage(file);
  },

  /**
   * Upload file (generic)
   * @param {File} file
   * @param {string} type - 'avatar' | 'post_image'
   * @returns {Promise<{url: string}>}
   */
  async uploadFile(file, type = "post_image") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await apiClient.post("/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // --------------------------------------------------------------------------
  // DISCOVERY
  // --------------------------------------------------------------------------

  /**
   * Discover nearby users
   * @param {Object} params - {lat, lng, radius}
   * @returns {Promise<Array>}
   */
  async discoverNearbyUsers(params) {
    return await userService.discoverNearbyUsers(params);
  },

  // --------------------------------------------------------------------------
  // MODERATION
  // --------------------------------------------------------------------------

  /**
   * Report content
   * @param {Object} reportData - {content_type, content_id, reason, description}
   * @returns {Promise<Object>}
   */
  async reportContent(reportData) {
    const response = await apiClient.post("/moderation/reports/", reportData);
    return response.data;
  },

  /**
   * Get user's reports
   * @returns {Promise<Array>}
   */
  async getUserReports() {
    const response = await apiClient.get("/moderation/reports/");
    return response.data;
  },
};

// Export apiClient for direct use if needed
export { apiClient };

export default api;
