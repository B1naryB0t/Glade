// frontend/src/services/notificationService.js
import { apiClient } from "./apiClient";

export const notificationService = {
	async getNotifications() {
		const response = await apiClient.get("/notifications");
		return response.data.results || response.data;
	},

	async getUnread() {
		const response = await apiClient.get("/notifications/unread");
		return response.data.results || response.data;
	},

	async getUnreadCount() {
		const response = await apiClient.get("/notifications/count");
		return response.data.unread_count;
	},

	async markAsRead(notificationId) {
		const response = await apiClient.post(
			`/notifications/${notificationId}/read`,
		);
		return response.data;
	},

	async markAllAsRead() {
		const response = await apiClient.post("/notifications/mark-all-read");
		return response.data;
	},

	async getPreferences() {
		const response = await apiClient.get("/notifications/preferences");
		return response.data;
	},

	async updatePreferences(preferences) {
		const response = await apiClient.put(
			"/notifications/preferences",
			preferences,
		);
		return response.data;
	},
};
