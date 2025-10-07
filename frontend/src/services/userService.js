// frontend/src/services/userService.js
import { apiClient } from './apiClient';

export const userService = {
  async getUserProfile(username) {
    const response = await apiClient.get(`/auth/profile/${username}/`);
    return response.data;
  },

  async updateProfile(username, profileData) {
    const response = await apiClient.put(`/auth/profile/${username}/`, profileData);
    return response.data;
  },

  async uploadAvatar(username, file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post(
      `/auth/profile/${username}/avatar/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async followUser(username) {
    const response = await apiClient.post(`/auth/follow/${username}/`);
    return response.data;
  },

  async unfollowUser(username) {
    const response = await apiClient.delete(`/auth/follow/${username}/`);
    return response.data;
  },

  async getFollowers(username) {
    const response = await apiClient.get(`/auth/profile/${username}/followers/`);
    return response.data;
  },

  async getFollowing(username) {
    const response = await apiClient.get(`/auth/profile/${username}/following/`);
    return response.data;
  }
};