import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FollowButton from '../components/users/FollowButton';

function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  const isOwnProfile = currentUser && currentUser.id.toString() === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      // TODO: Replace with actual API call
      const mockProfile = {
        id: parseInt(userId),
        username: `user_${userId}`,
        email: `user${userId}@example.com`,
        bio: 'This is a sample bio for the user profile.',
        followers_count: 42,
        following_count: 18,
        posts_count: 7,
        joined_date: '2024-01-15',
        location: 'Charlotte, NC'
      };

      const mockPosts = [
        {
          id: 1,
          content: 'Just had an amazing coffee at a local cafe! ☕',
          created_at: '2024-09-25T10:30:00Z',
          city: 'Charlotte',
          region: 'North Carolina'
        },
        {
          id: 2,
          content: 'Beautiful sunset from uptown today 🌅',
          created_at: '2024-09-24T19:45:00Z',
          city: 'Charlotte',
          region: 'North Carolina'
        }
      ];

      setProfileUser(mockProfile);
      setPosts(mockPosts);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
          <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
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
              <p className="text-gray-600">{profileUser.email}</p>
              {profileUser.location && (
                <p className="text-sm text-gray-500">📍 {profileUser.location}</p>
              )}
              <p className="text-sm text-gray-500">
                Joined {new Date(profileUser.joined_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Follow Button */}
          {!isOwnProfile && (
            <FollowButton 
              userId={profileUser.id} 
              username={profileUser.username}
            />
          )}
        </div>

        {profileUser.bio && (
          <div className="mt-4">
            <p className="text-gray-700">{profileUser.bio}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex space-x-6 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {profileUser.posts_count}
            </div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {profileUser.followers_count}
            </div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {profileUser.following_count}
            </div>
            <div className="text-sm text-gray-500">Following</div>
          </div>
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
            posts.map((post) => (
              <div key={post.id} className="p-6">
                <p className="text-gray-900 mb-2">{post.content}</p>
                {(post.city || post.region) && (
                  <p className="text-sm text-gray-500 mb-2">
                    📍 {post.city}{post.city && post.region && ', '}{post.region}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()} at{' '}
                  {new Date(post.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              {isOwnProfile ? "You haven't posted anything yet." : "No posts to show."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;