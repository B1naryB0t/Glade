// frontend/src/services/postService.js
import { apiClient } from "./apiClient";

export const postService = {
  /**
   * Create new post
   * @param {Object} postData - {content, visibility, location, content_warning}
   * @returns {Promise<Object>}
   */
  async createPost(postData) {
    const response = await apiClient.post("/posts/", postData);
    return response.data;
  },

  /**
   * Get all posts (feed)
   * @param {Object} params - {page, limit, visibility}
   * @returns {Promise<Array|Object>}
   */
  async getPosts(params = {}) {
    const response = await apiClient.get("/posts/", { params });
    return response.data;
  },

  /**
   * Get single post
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async getPost(postId) {
    const response = await apiClient.get(`/posts/${postId}/`);
    return response.data;
  },

  /**
   * Get posts by user
   * @param {string} username
   * @param {Object} params
   * @returns {Promise<Array|Object>}
   */
  async getUserPosts(username, params = {}) {
    const response = await apiClient.get(`/posts/user/${username}/`, {
      params,
    });
    return response.data;
  },

  /**
   * Update post
   * @param {string} postId
   * @param {Object} postData
   * @returns {Promise<Object>}
   */
  async updatePost(postId, postData) {
    const response = await apiClient.patch(`/posts/${postId}/`, postData);
    return response.data;
  },

  /**
   * Delete post
   * @param {string} postId
   * @returns {Promise<void>}
   */
  async deletePost(postId) {
    const response = await apiClient.delete(`/posts/${postId}/`);
    return response.data;
  },

  /**
   * Get local posts (geographic)
   * @param {Object} location - {latitude, longitude}
   * @param {number} radius - Radius in meters (default: 1000)
   * @returns {Promise<Array>}
   */
  async getLocalPosts(location, radius = 1000) {
    const params = {
      lat: location.latitude,
      lng: location.longitude,
      radius,
      local_only: true,
    };
    const response = await apiClient.get("/posts/local/", { params });
    return response.data;
  },

  /**
   * Like post
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async likePost(postId) {
    const response = await apiClient.post(`/posts/${postId}/like/`);
    return response.data;
  },

  /**
   * Unlike post
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async unlikePost(postId) {
    const response = await apiClient.delete(`/posts/${postId}/like/`);
    return response.data;
  },

  /**
   * Toggle like on post
   * @param {string} postId
   * @returns {Promise<{liked_by_current_user: boolean, likes_count: number}>}
   */
  async toggleLike(postId) {
    try {
      // Try to like the post
      const response = await this.likePost(postId);
      return response;
    } catch (error) {
      // If already liked, unlike it
      if (error.response?.status === 400) {
        const response = await this.unlikePost(postId);
        return response;
      }
      throw error;
    }
  },

  /**
   * Get comments for post
   * @param {string} postId
   * @returns {Promise<Array>}
   */
  async getComments(postId) {
    const response = await apiClient.get(`/posts/${postId}/comments/`);
    return response.data;
  },

  /**
   * Add comment to post
   * @param {string} postId
   * @param {string} content
   * @returns {Promise<Object>}
   */
  async addComment(postId, content) {
    const response = await apiClient.post(`/posts/${postId}/comments/`, {
      content,
    });
    return response.data;
  },

  /**
   * Delete comment
   * @param {string} postId
   * @param {string} commentId
   * @returns {Promise<void>}
   */
  async deleteComment(postId, commentId) {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}/`);
  },

  /**
   * Upload image for post
   * @param {File} file
   * @returns {Promise<{url: string}>}
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post("/posts/upload-image/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Search posts
   * @param {string} query
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async searchPosts(query, params = {}) {
    const response = await apiClient.get("/posts/search/", {
      params: { q: query, ...params },
    });
    return response.data;
  },
};
