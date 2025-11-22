// frontend/src/components/FollowRequestsBadge.jsx
import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

function FollowRequestsBadge() {
  const queryClient = useQueryClient();
  
  const { data: requests } = useQuery({
    queryKey: ["followRequests"],
    queryFn: async () => {
      const response = await apiClient.get("/auth/follow-requests/");
      const data = response.data.requests || response.data.results || response.data || [];
      console.log("Follow requests data:", data);
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  const count = requests?.length || 0;
  console.log("Follow requests count:", count);

  const handleClick = async () => {
    // Mark all follow_request notifications as read
    try {
      const notifications = await apiClient.get("/notifications/");
      const followRequestNotifications = notifications.data.results?.filter(
        (n) => n.notification_type === "follow_request" && !n.is_read
      ) || [];
      
      // Mark each as read using the correct endpoint
      await Promise.all(
        followRequestNotifications.map((n) => 
          apiClient.post(`/notifications/${n.id}/read/`)
        )
      );
      
      // Refresh notification count
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    } catch (error) {
      console.error("Failed to mark follow request notifications as read:", error);
    }
  };

  return (
    <div className="relative">
      <Link
        to="/follow-requests"
        onClick={handleClick}
        className="relative p-2 text-gray-400 hover:text-gray-500 block"
        title="Follow Requests"
      >
        <UserPlus className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </div>
  );
}

export default FollowRequestsBadge;
