// frontend/src/components/NotificationBell.jsx
import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";
import NotificationDropdown from "./NotificationDropdown";

function NotificationBell() {
	const [showDropdown, setShowDropdown] = useState(false);

	const { data: count, isError } = useQuery({
		queryKey: ["notificationCount"],
		queryFn: notificationService.getUnreadCount,
		refetchInterval: 30000, // Refresh every 30 seconds
		retry: false,
	});

	// Always render the bell, even if API fails
	return (
		<div className="relative">
			<button
				onClick={() => setShowDropdown(!showDropdown)}
				className="relative p-2 text-gray-400 hover:text-gray-500"
				title="Notifications"
			>
				<Bell className="w-5 h-5" />
				{count > 0 && (
					<span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
						{count > 9 ? "9+" : count}
					</span>
				)}
			</button>

			{showDropdown && (
				<NotificationDropdown onClose={() => setShowDropdown(false)} />
			)}
		</div>
	);
}

export default NotificationBell;
