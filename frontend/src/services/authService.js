// frontend/src/services/authService.js
import { apiClient } from "./apiClient";

export const authService = {
	async login(credentials) {
		const formData = new FormData();
		formData.append("username", credentials.username);
		formData.append("password", credentials.password);

		const response = await apiClient.post("/auth/login/", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},

	async register(userData) {
		const response = await apiClient.post("/auth/register/", userData);
		return response.data;
	},

	async logout() {
		const response = await apiClient.post("/auth/logout/");
		return response.data;
	},

	async getCurrentUser() {
		const response = await apiClient.get("/auth/profile/me/");
		return response.data;
	},

	async updateProfile(profileData) {
		const response = await apiClient.put("/auth/profile/me/", profileData);
		return response.data;
	},

	async verifyEmail(token) {
		const response = await apiClient.post(`/auth/verify-email/${token}/`);
		return response.data;
	},

	async resendVerificationEmail() {
		const response = await apiClient.post("/auth/resend-verification/");
		return response.data;
	},

	async uploadAvatar(file) {
		const formData = new FormData();
		formData.append("avatar", file);

		const response = await apiClient.post(
			"/auth/profile/me/avatar/",
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			},
		);
		return response.data;
	},
};
