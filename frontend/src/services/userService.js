// frontend/src/services/userService.js
import { apiClient } from "./apiClient";

export const userService = {
  /**
   * Get user profile
   * @param {string} username
   * @returns {Promise<Object>}
   */
  async getUserProfile(username) {
    const response = await apiClient.get(`/users/${username}/`);
    return response.data;
  },

  /**
   * Update user profile
   * @param {string} username
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async updateProfile(username, profileData) {
    const response = await apiClient.patch(`/users/${username}/`, profileData);
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
      `/users/${username}/avatar/`,
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
    const response = await apiClient.post(`/users/${username}/follow/`);
    return response.data;
  },

  /**
   * Unfollow user
   * @param {string} username
   * @returns {Promise<{following: boolean}>}
   */
  async unfollowUser(username) {
    const response = await apiClient.delete(`/users/${username}/follow/`);
    return response.data;
  },

  /**
   * Get user's followers
   * @param {string} username
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async getFollowers(username, params = {}) {
    const response = await apiClient.get(`/users/${username}/followers/`, {
      params,
    });
    return response.data;
  },

  /**
   * Get users that user is following
   * @param {string} username
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async getFollowing(username, params = {}) {
    const response = await apiClient.get(`/users/${username}/following/`, {
      params,
    });
    return response.data;
  },

  /**
   * Search users
   * @param {string} query
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async searchUsers(query, params = {}) {
    const response = await apiClient.get("/users/search/", {
      params: { q: query, ...params },
    });
    return response.data;
  },

  /**
   * Get user settings
   * @returns {Promise<Object>}
   */
  async getUserSettings() {
    const response = await apiClient.get("/users/settings/");
    return response.data;
  },

  /**
   * Update user settings
   * @param {Object} settings
   * @returns {Promise<Object>}
   */
  async updateUserSettings(settings) {
    const response = await apiClient.put("/users/settings/", settings);
    return response.data;
  },

  /**
   * Discover nearby users
   * @param {Object} params - {lat, lng, radius}
   * @returns {Promise<Array>}
   */
  async discoverNearbyUsers(params) {
    const response = await apiClient.get("/discover/users/", { params });
    return response.data;
  },
};
