// frontend/src/pages/ProfilePage.jsx (Updated with federation info)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  Edit2,
  Settings,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import { postService } from "../services/postService";
import PostCard from "../components/posts/PostCard";
import UserTypeBadge, { UserTypeInfo } from "../components/UserTypeBadge";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const isOwnProfile = username === "me" || username === currentUser?.username;
  const profileUsername = isOwnProfile ? currentUser?.username : username;

  // Fetch user profile
  const { data: profileUser, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", profileUsername],
    queryFn: () => userService.getUserProfile(profileUsername),
    enabled: !!profileUsername,
  });

  // Fetch user posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["userPosts", profileUsername],
    queryFn: () => postService.getUserPosts(profileUsername),
    enabled: !!profileUsername,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: (username) => userService.followUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile", profileUsername]);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (username) => userService.unfollowUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile", profileUsername]);
    },
  });

  const handleFollowToggle = () => {
    if (profileUser?.is_following) {
      unfollowMutation.mutate(profileUsername);
    } else {
      followMutation.mutate(profileUsername);
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-burgundy mb-4">
          User Not Found
        </h2>
        <p className="text-gray-600">
          The user you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  const posts = postsData?.results || postsData || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-2 border-cream">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profileUser.avatar_url ? (
                <img
                  src={profileUser.avatar_url}
                  alt={profileUser.display_name || profileUser.username}
                  className="w-32 h-32 rounded-full border-4 border-cream"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-olive flex items-center justify-center text-white text-4xl font-bold border-4 border-cream">
                  {(profileUser.display_name || profileUser.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-burgundy">
                      {profileUser.display_name || profileUser.username}
                    </h1>
                    <UserTypeBadge user={profileUser} />
                  </div>
                  <p className="text-olive text-lg">@{profileUser.username}</p>
                </div>

                {/* Action Buttons */}
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg hover:bg-lime transition-colors font-semibold"
                    >
                      <Settings size={18} />
                      Settings
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={
                      followMutation.isPending || unfollowMutation.isPending
                    }
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      profileUser.is_following
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-olive text-white hover:bg-lime"
                    }`}
                  >
                    {profileUser.is_following ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="text-gray-700 mb-4">{profileUser.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 mb-4">
                <Link
                  to={`/profile/${profileUsername}/followers`}
                  className="text-gray-600 hover:text-burgundy transition-colors"
                >
                  <span className="font-bold text-burgundy">
                    {profileUser.followers_count || 0}
                  </span>{" "}
                  Followers
                </Link>
                <Link
                  to={`/profile/${profileUsername}/following`}
                  className="text-gray-600 hover:text-burgundy transition-colors"
                >
                  <span className="font-bold text-burgundy">
                    {profileUser.following_count || 0}
                  </span>{" "}
                  Following
                </Link>
                <span className="text-gray-600">
                  <span className="font-bold text-burgundy">
                    {profileUser.posts_count || 0}
                  </span>{" "}
                  Posts
                </span>
              </div>

              {/* Join Date */}
              {profileUser.created_at && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar size={16} />
                  <span>
                    Joined{" "}
                    {new Date(profileUser.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Federation Info - Show for remote users */}
          {!isOwnProfile && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <UserTypeInfo user={profileUser} />
            </div>
          )}
        </div>

        {/* Posts Section */}
        <div>
          <h2 className="text-2xl font-bold text-burgundy mb-4 flex items-center gap-2">
            <FileText size={24} />
            Posts
          </h2>

          {postsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md border-2 border-cream">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">
                {isOwnProfile
                  ? "You haven't posted anything yet"
                  : "No posts yet"}
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
