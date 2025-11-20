import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import Feed from "../components/posts/Feed";
import FollowButton from "../components/users/FollowButton";
import ErrorAlert from "../components/common/ErrorAlert";
import Loading from "../components/common/Loading";

function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    loadProfile();
    loadUserPosts();
  }, [username]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profileData = await api.getUserProfile(username);
      setProfile(profileData);
    } catch (err) {
      setError(err.message || "Failed to load profile");
      if (err.response?.status === 404) {
        setError("User not found");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      setPostsLoading(true);
      const userPosts = await api.getUserPosts(username);

      if (Array.isArray(userPosts)) {
        setPosts(userPosts);
      } else if (userPosts?.results) {
        setPosts(userPosts.results);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleEditProfile = () => navigate("/settings");

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorAlert error={error} />
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-[#7A3644] hover:text-[#5f2a35]"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#FFE3AB] rounded-lg shadow p-6 text-center">
          <p className="text-[#7A3644] font-medium">User not found</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-[#7A3644] hover:text-[#5f2a35]"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-[#FFE3AB] rounded-lg shadow mb-6 border border-[#FF9886]/40">
        <div className="p-6">
          <div className="flex items-start justify-between">
            {/* Left side: Avatar + info */}
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-20 h-20 bg-[#7A3644] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {profile.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>

              {/* User info */}
              <div>
                <h1 className="text-2xl font-bold text-[#7A3644]">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-[#85993D]">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-[#7A3644]/80">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div>
              {isOwnProfile ? (
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 bg-[#FF9886] text-white rounded-md shadow 
                             hover:bg-[#e97a66]"
                >
                  Edit Profile
                </button>
              ) : isAuthenticated ? (
                <FollowButton
                  userId={profile.id}
                  username={profile.username}
                  initialFollowing={profile.is_following}
                />
              ) : null}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-[#FF9886]/40">
            <div>
              <span className="font-bold text-[#7A3644]">
                {profile.posts_count || 0}
              </span>
              <span className="text-[#85993D] ml-1">posts</span>
            </div>
            <div>
              <span className="font-bold text-[#7A3644]">
                {profile.followers_count || 0}
              </span>
              <span className="text-[#85993D] ml-1">followers</span>
            </div>
            <div>
              <span className="font-bold text-[#7A3644]">
                {profile.following_count || 0}
              </span>
              <span className="text-[#85993D] ml-1">following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-xl font-bold text-[#7A3644] mb-4">Posts</h2>
        <Feed posts={posts} isLoading={postsLoading} error={null} />
      </div>
    </div>
  );
}

export default ProfilePage;
