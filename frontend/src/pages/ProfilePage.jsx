import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import PostCard from '../components/posts/PostCard';

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const profileUsername = username === 'me' ? currentUser?.username : username;

  // Fetch profile data
  const { data: profileUser, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile', profileUsername],
    queryFn: () => api.getUserProfile(profileUsername),
    enabled: !!profileUsername,
  });

  // Fetch user posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', profileUsername],
    queryFn: () => api.getUserPosts(profileUsername),
    enabled: !!profileUsername,
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: (isFollowing) => 
      isFollowing ? api.unfollowUser(profileUsername) : api.followUser(profileUsername),
    onSuccess: () => {
      // Invalidate all related queries to keep data consistent
      queryClient.invalidateQueries({ queryKey: ['userProfile', profileUsername] });
      queryClient.invalidateQueries({ queryKey: ['followers', profileUsername] });
      queryClient.invalidateQueries({ queryKey: ['following', currentUser?.username] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', currentUser?.username] });
    },
  });

  const posts = postsData?.results || [];
  const loading = profileLoading || postsLoading;
  const error = profileError?.message || null;

  // Check if this is the current user's profile
  const isOwnProfile = currentUser && (
    username === 'me' || 
    username === currentUser.username || 
    (profileUser && profileUser.username === currentUser.username)
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-4">
          <button 
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
          <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profileUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profileUser.username}
              </h1>
              {profileUser.email && (
                <p className="text-gray-600">{profileUser.email}</p>
              )}
              {profileUser.location && (
                <p className="text-sm text-gray-500">
                  📍 {profileUser.location.city}
                  {profileUser.location.region ? `, ${profileUser.location.region}` : ''}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Joined {new Date(profileUser.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Follow Button - Only shown on other users' profiles */}
          {!isOwnProfile && (
            <button 
              className={`px-4 py-2 rounded-md ${
                profileUser.is_following 
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                  : profileUser.follow_requested
                  ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              onClick={() => followMutation.mutate(profileUser.is_following)}
              disabled={followMutation.isPending}
            >
              {followMutation.isPending 
                ? '...' 
                : profileUser.is_following 
                  ? 'Unfollow' 
                  : profileUser.follow_requested 
                    ? 'Requested' 
                    : 'Follow'}
            </button>
          )}
        </div>

        {profileUser.bio && (
          <div className="mt-4">
            <p className="text-gray-700">{profileUser.bio}</p>
          </div>
        )}

        {/* Stats - WITH CLICKABLE LINKS */}
        <div className="flex space-x-6 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {posts.length || profileUser.posts_count || 0}
            </div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          
          {/* CLICKABLE FOLLOWERS COUNT */}
          <Link to={`/profile/${username}/followers`} className="text-center hover:opacity-80 transition-opacity">
            <div className="text-xl font-bold text-gray-900">
              {profileUser.followers_count || 0}
            </div>
            <div className="text-sm text-gray-500 hover:text-indigo-600">Followers</div>
          </Link>
          
          {/* CLICKABLE FOLLOWING COUNT */}
          <Link to={`/profile/${username}/following`} className="text-center hover:opacity-80 transition-opacity">
            <div className="text-xl font-bold text-gray-900">
              {profileUser.following_count || 0}
            </div>
            <div className="text-sm text-gray-500 hover:text-indigo-600">Following</div>
          </Link>
        </div>
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isOwnProfile ? 'Your Posts' : `${profileUser.username}'s Posts`}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {posts.length > 0 ? (
            posts.map(post => (
              <div key={post.id} className="p-4">
                <PostCard post={post} />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;