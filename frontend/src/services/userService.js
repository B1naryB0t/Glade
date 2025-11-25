// frontend/src/services/userService.js
import { apiClient } from "./apiClient";

export const userService = {
  /**
   * Get user profile
   * @param {string} username
   * @returns {Promise<Object>}
   */
  async getUserProfile(username) {
    const response = await apiClient.get(`/auth/profile/${username}/`);
    return response.data;
  },

  /**
   * Update user profile
   * @param {string} username
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async updateProfile(username, profileData) {
    const response = await apiClient.put(
      `/auth/profile/${username}/`,
      profileData,
    );
    return response.data;
  },

  /**
   * Upload avatar
   * @param {string} username
   * @param {File} file
   * @returns {Promise<Object>}
   */
  async uploadAvatar(username, file) {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.post(
      `/auth/profile/${username}/avatar/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  /**
   * Follow user
   * @param {string} username
   * @returns {Promise<{following: boolean}>}
   */
  async followUser(username) {
    const response = await apiClient.post(`/auth/follow/${username}/`);
    return response.data;
  },

  /**
   * Unfollow user
   * @param {string} username
   * @returns {Promise<{following: boolean}>}
   */
  async unfollowUser(username) {
    const response = await apiClient.delete(`/auth/follow/${username}/`);
    return response.data;
  },

  /**
   * Get user's followers
   * @param {string} username
   * @returns {Promise<Array>}
   */
  async getFollowers(username) {
    const response = await apiClient.get(
      `/auth/profile/${username}/followers/`,
    );
    return response.data;
  },

  /**
   * Get users that user is following
   * @param {string} username
   * @returns {Promise<Array>}
   */
  async getFollowing(username) {
    const response = await apiClient.get(
      `/auth/profile/${username}/following/`,
    );
    return response.data;
  },

  /**
   * Search users
   * @param {string} query
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async searchUsers(query, params = {}) {
    const response = await apiClient.get("/auth/search/", {
      params: { q: query, ...params },
    });
    return response.data;
  },

  /**
   * Get user settings
   * @returns {Promise<Object>}
   */
  async getUserSettings() {
    const response = await apiClient.get("/auth/settings/");
    return response.data;
  },

  /**
   * Update user settings (including location)
   * @param {Object} settings
   * @returns {Promise<Object>}
   */
  async updateUserSettings(settings) {
    console.log("Saving settings:", settings);
    const response = await apiClient.put("/auth/settings/", settings);
    return response.data;
  },

  /**
   * Delete user account
   * @param {string} password - User's password for confirmation
   * @returns {Promise<Object>}
   */
  async deleteAccount(password) {
    const response = await apiClient.delete("/auth/delete-account/", {
      data: { password },
    });
    return response.data;
  },

  /**
   * Discover nearby users
   * @param {Object} params - {lat, lng, radius}
   * @returns {Promise<Array>}
   */
  async discoverNearbyUsers(params) {
    const response = await apiClient.get("/auth/discover/", { params });
    return response.data;
  },
};
