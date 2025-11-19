// frontend/src/components/NotificationDropdown.jsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, Settings, Bell } from "lucide-react";
import { notificationService } from "../services/notificationService";
import { Link } from "react-router-dom";

const NOTIFICATION_ICONS = {
	like: Heart,
	reply: MessageCircle,
	follow: UserPlus,
	mention: MessageCircle,
};

function NotificationDropdown({ onClose }) {
	const queryClient = useQueryClient();

	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications", "unread"],
		queryFn: notificationService.getUnread,
	});

	const markReadMutation = useMutation({
		mutationFn: notificationService.markAsRead,
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
			queryClient.invalidateQueries(["notificationCount"]);
		},
	});

	const markAllReadMutation = useMutation({
		mutationFn: notificationService.markAllAsRead,
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
			queryClient.invalidateQueries(["notificationCount"]);
		},
	});

	const handleNotificationClick = (notification) => {
		if (!notification.read) {
			markReadMutation.mutate(notification.id);
		}
		onClose();
	};

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-40" onClick={onClose} />

			{/* Dropdown */}
			<div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[600px] flex flex-col">
				{/* Header */}
				<div className="p-4 border-b flex items-center justify-between">
					<h3 className="font-semibold text-gray-900">Notifications</h3>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => markAllReadMutation.mutate()}
							disabled={markAllReadMutation.isPending || !notifications?.length}
							className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
						>
							Mark all read
						</button>
						<Link
							to="/settings/notifications"
							onClick={onClose}
							className="p-1 text-gray-400 hover:text-gray-600"
						>
							<Settings className="w-4 h-4" />
						</Link>
					</div>
				</div>

				{/* Notifications List */}
				<div className="overflow-y-auto flex-1">
					{isLoading ? (
						<div className="p-8 text-center text-gray-500">
							Loading notifications...
						</div>
					) : notifications?.length === 0 ? (
						<div className="p-8 text-center text-gray-500">
							<Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
							<p>No new notifications</p>
						</div>
					) : (
						<div className="divide-y">
							{notifications?.map((notification) => {
								const Icon =
									NOTIFICATION_ICONS[notification.notification_type] || Bell;

								return (
									<div
										key={notification.id}
										onClick={() => handleNotificationClick(notification)}
										className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? "bg-blue-50" : ""
											}`}
									>
										<div className="flex items-start space-x-3">
											<img
												src={notification.actor.avatar_url}
												alt={notification.actor.display_name}
												className="w-10 h-10 rounded-full"
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-start space-x-2">
													<Icon
														className={`w-4 h-4 mt-1 flex-shrink-0 ${notification.notification_type === "like"
																? "text-red-500"
																: notification.notification_type === "follow"
																	? "text-blue-500"
																	: "text-gray-500"
															}`}
													/>
													<div className="flex-1">
														<p className="text-sm text-gray-900">
															{notification.message}
														</p>
														<p className="text-xs text-gray-500 mt-1">
															{formatDistanceToNow(
																new Date(notification.created_at),
																{
																	addSuffix: true,
																},
															)}
														</p>
													</div>
												</div>
											</div>
											{!notification.read && (
												<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-3 border-t text-center">
					<Link
						to="/notifications"
						onClick={onClose}
						className="text-sm text-green-600 hover:text-green-700 font-medium"
					>
						View all notifications
					</Link>
				</div>
			</div>
		</>
	);
}

export default NotificationDropdown;
