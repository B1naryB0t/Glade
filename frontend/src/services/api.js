// Wrapper API service that uses real backend services
import { authService } from './authService';
import { postService } from './postService';
import { userService } from './userService';
import { apiClient } from './apiClient';

export const api = {
  // User methods
  async getUserProfile(username) {
    return await userService.getUserProfile(username);
  },

  async getUserSettings() {
    return await authService.getCurrentUser();
  },

  async updateUserSettings(settings) {
    const currentUser = await authService.getCurrentUser();
    return await userService.updateProfile(currentUser.username, settings);
  },

  async followUser(username) {
    return await userService.followUser(username);
  },

  async unfollowUser(username) {
    return await userService.unfollowUser(username);
  },

  async searchUsers(query) {
    const response = await apiClient.get('/auth/search/users/', {
      params: { q: query }
    });
    return response.data;
  },

  // Post methods
  async getPosts() {
    return await postService.getPosts();
  },

  async getUserPosts(username) {
    const response = await apiClient.get(`/posts/user/${username}/`);
    return response.data;
  },

  async createPost(postData) {
    return await postService.createPost(postData);
  },

  async deletePost(postId) {
    return await postService.deletePost(postId);
  },

  async toggleLike(postId) {
    try {
      const response = await postService.likePost(postId);
      return response;
    } catch (error) {
      // If already liked, unlike it
      const response = await postService.unlikePost(postId);
      return response;
    }
  },

  async getComments(postId) {
    const response = await apiClient.get(`/posts/${postId}/comments/`);
    return response.data;
  },

  async addComment(postId, content) {
    const response = await apiClient.post(`/posts/${postId}/comments/`, { content });
    return response.data;
  }
};
