// frontend/src/services/postService.js

import { apiClient } from "./apiClient";

// Visibility mapping: frontend string -> backend integer
const VISIBILITY_MAP = {
	'public': 1,
	'local': 2,
	'followers': 3,
	'private': 4
};

export const postService = {
	async createPost(postData) {
		// Map visibility string to integer
		const mappedData = {
			...postData,
			visibility: VISIBILITY_MAP[postData.visibility] || 1
		};
		const response = await apiClient.post("/posts/", mappedData);
		return response.data;
	},

	async getPosts(params = {}) {
		const response = await apiClient.get("/posts/", { params });
		return response.data;
	},

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

	async getPost(postId) {
		const response = await apiClient.get(`/posts/${postId}/`);
		return response.data;
	},

	async deletePost(postId) {
		const response = await apiClient.delete(`/posts/${postId}/`);
		return response.data;
	},

	async likePost(postId) {
		const response = await apiClient.post(`/posts/${postId}/like/`);
		return response.data;
	},

	async unlikePost(postId) {
		const response = await apiClient.delete(`/posts/${postId}/like/`);
		return response.data;
	},

	async uploadImage(file) {
		const formData = new FormData();
		formData.append("image", file);

		const response = await apiClient.post("/posts/upload-image/", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},
};
