// frontend/src/pages/NotificationSettingsPage.jsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";
import { Bell, Mail } from "lucide-react";

function NotificationSettingsPage() {
	const queryClient = useQueryClient();

	const { data: preferences, isLoading } = useQuery({
		queryKey: ["notificationPreferences"],
		queryFn: notificationService.getPreferences,
	});

	const updateMutation = useMutation({
		mutationFn: notificationService.updatePreferences,
		onSuccess: () => {
			queryClient.invalidateQueries(["notificationPreferences"]);
		},
	});

	const handleToggle = (field) => {
		if (preferences) {
			updateMutation.mutate({
				...preferences,
				[field]: !preferences[field],
			});
		}
	};

	if (isLoading) {
		return <div className="p-8">Loading preferences...</div>;
	}

	const notificationTypes = [
		{ key: "notify_on_likes", label: "Likes on your posts", icon: Bell },
		{ key: "notify_on_replies", label: "Replies to your posts", icon: Bell },
		{ key: "notify_on_mentions", label: "Mentions", icon: Bell },
		{ key: "notify_on_follows", label: "New followers", icon: Bell },
	];

	const emailTypes = [
		{ key: "email_on_likes", label: "Likes (email)", icon: Mail },
		{ key: "email_on_replies", label: "Replies (email)", icon: Mail },
		{ key: "email_on_mentions", label: "Mentions (email)", icon: Mail },
		{ key: "email_on_follows", label: "New followers (email)", icon: Mail },
	];

	return (
		<div className="max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">
				Notification Settings
			</h1>

			<div className="bg-white rounded-lg shadow-sm border divide-y">
				{/* In-App Notifications */}
				<div className="p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
						<Bell className="w-5 h-5 mr-2" />
						In-App Notifications
					</h2>
					<div className="space-y-3">
						{notificationTypes.map(({ key, label }) => (
							<label
								key={key}
								className="flex items-center justify-between py-2"
							>
								<span className="text-gray-700">{label}</span>
								<input
									type="checkbox"
									checked={preferences?.[key] || false}
									onChange={() => handleToggle(key)}
									className="rounded border-gray-300 text-green-600 focus:ring-green-500"
								/>
							</label>
						))}
					</div>
				</div>

				{/* Email Notifications */}
				<div className="p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
						<Mail className="w-5 h-5 mr-2" />
						Email Notifications
					</h2>
					<p className="text-sm text-gray-600 mb-4">
						Receive email notifications for important updates
					</p>
					<div className="space-y-3">
						{emailTypes.map(({ key, label }) => (
							<label
								key={key}
								className="flex items-center justify-between py-2"
							>
								<span className="text-gray-700">{label}</span>
								<input
									type="checkbox"
									checked={preferences?.[key] || false}
									onChange={() => handleToggle(key)}
									className="rounded border-gray-300 text-green-600 focus:ring-green-500"
								/>
							</label>
						))}
					</div>
				</div>
			</div>

			{updateMutation.isPending && (
				<p className="text-sm text-gray-600 mt-4 text-center">Saving...</p>
			)}
		</div>
	);
}

export default NotificationSettingsPage;
