import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import UserCard from '../components/users/UserCard';

function FollowingPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const profileUsername = username === 'me' ? currentUser?.username : username;

  // Fetch profile data
  const { data: profileUser } = useQuery({
    queryKey: ['userProfile', profileUsername],
    queryFn: () => userService.getUserProfile(profileUsername),
    enabled: !!profileUsername,
  });

  // Fetch following list
  const { data: followingData, isLoading: loading, error } = useQuery({
    queryKey: ['following', profileUsername],
    queryFn: () => userService.getFollowing(profileUsername),
    enabled: !!profileUsername,
  });

  const following = followingData?.results || followingData || [];

  const isOwnProfile = currentUser && (
    username === 'me' || 
    username === currentUser.username || 
    (profileUser && profileUser.username === currentUser.username)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-sm text-red-700">
              {error?.message || 'Could not load following. Please try again.'}
            </p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="text-coral hover:text-burgundy font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(`/profile/${username}`)}
              className="mr-4 text-olive hover:text-burgundy transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-burgundy">
                {isOwnProfile ? 'Following' : `${profileUser?.username} Following`}
              </h1>
              <p className="text-olive text-lg mt-1">
                {following.length} {following.length === 1 ? 'user' : 'users'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 border-b border-gray-200">
            <Link
              to={`/profile/${username}/followers`}
              className="px-4 py-2 font-medium text-olive hover:text-burgundy transition-colors"
            >
              Followers
            </Link>
            <button className="px-4 py-2 font-medium text-burgundy border-b-2 border-coral">
              Following
            </button>
          </div>
        </div>

        {/* Following List */}
        {following.length > 0 ? (
          <div className="space-y-4">
            {following.map(user => (
              <UserCard
                key={user.id}
                user={{
                  ...user,
                  location: user.location ? 
                    `${user.location.city}${user.location.region ? `, ${user.location.region}` : ''}` 
                    : null
                }}
                showFollowButton={!isOwnProfile || user.id !== currentUser?.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Not following anyone yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              {isOwnProfile 
                ? 'Discover and follow users to see their posts in your feed!' 
                : 'This user is not following anyone yet.'}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-coral text-white rounded-md hover:bg-burgundy transition-colors"
              >
                Explore Feed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowingPage;