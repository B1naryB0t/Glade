// frontend/src/services/authService.js
import { apiClient } from "./apiClient";

export const authService = {
	async login(credentials) {
		const formData = new FormData();
		formData.append("username", credentials.username);
		formData.append("password", credentials.password);

		const response = await apiClient.post("/auth/token", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},

	async register(userData) {
		const response = await apiClient.post("/auth/register", userData);
		return response.data;
	},

	async getCurrentUser() {
		const response = await apiClient.get("/users/me");
		return response.data;
	},

	async updateProfile(profileData) {
		const response = await apiClient.put("/users/me", profileData);
		return response.data;
	},
};
