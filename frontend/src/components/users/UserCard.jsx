import React from "react";
import { useNavigate } from "react-router-dom";
import FollowButton from "./FollowButton";
import UserTypeBadge from "../UserTypeBadge";

function UserCard({ user, showFollowButton = true }) {
	const navigate = useNavigate();

	const handleProfileClick = () => {
		navigate(`/profile/${user.username}`);
	};

	return (
		<div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between">
				<div
					className="flex items-center space-x-3 flex-1 cursor-pointer"
					onClick={handleProfileClick}
				>
					{/* Avatar */}
					<div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
						<span className="text-white font-semibold">
							{user.username?.charAt(0).toUpperCase() || "U"}
						</span>
					</div>

					{/* User Info */}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-gray-900 truncate">
								{user.display_name || user.username}
							</h3>
							<UserTypeBadge user={user} size="sm" />
						</div>

						{user.bio && (
							<p className="text-sm text-gray-500 truncate">{user.bio}</p>
						)}
						{user.location && (
							<p className="text-xs text-gray-400 mt-1">📍 {user.location}</p>
						)}
					</div>
				</div>

				{/* Follow Button */}
				{showFollowButton && (
					<div className="ml-4">
						<FollowButton
							userId={user.id}
							username={user.username}
							initialFollowing={user.isFollowing || false}
						/>
					</div>
				)}
			</div>

			{/* Stats */}
			{(user.followers_count !== undefined ||
				user.posts_count !== undefined) && (
				<div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
					{user.posts_count !== undefined && (
						<span>
							<span className="font-semibold text-gray-900">
								{user.posts_count}
							</span>{" "}
							posts
						</span>
					)}
					{user.followers_count !== undefined && (
						<span>
							<span className="font-semibold text-gray-900">
								{user.followers_count}
							</span>{" "}
							followers
						</span>
					)}
					{user.following_count !== undefined && (
						<span>
							<span className="font-semibold text-gray-900">
								{user.following_count}
							</span>{" "}
							following
						</span>
					)}
				</div>
			)}
		</div>
	);
}

export default UserCard;
