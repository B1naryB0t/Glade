import { useState, useEffect } from 'react';
import { postService } from '../../services/postService';
import { api } from '../../services/api';

function PostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [limitToNearby, setLimitToNearby] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(1); // in miles
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  // Check if user has a location set
  useEffect(() => {
    const checkUserLocation = async () => {
      try {
        const userSettings = await api.getUserSettings();
        setHasLocation(userSettings.latitude !== null && userSettings.longitude !== null);
      } catch (error) {
        console.error('Error checking user location:', error);
      }
    };
    checkUserLocation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    if (content.length > 5000) {
      setError('Post content must be under 5000 characters');
      return;
    }
    if (!content.trim() || isPosting) return; // Prevent double submission

    try {
      setIsPosting(true);

      const postData = {
        content: content.trim(),
        visibility: visibility,
      };

      // Add nearby filter if enabled (convert miles to meters for backend)
      // this should probably be handled on the backend, but we're running
      // out of time
      if (limitToNearby) {
        postData.nearby_radius_meters = Math.round(nearbyRadius * 1609.34);
      }

      const newPost = await postService.createPost(postData);

      // Clear content immediately after successful post
      setContent('');

      if (onPostCreated) {
        onPostCreated(newPost);
      }
      // Reset form
      setContent('');
      setVisibility('public');
      setLimitToNearby(false);
      setNearbyRadius(1);
      setError(null);
      setShowPrivacySettings(false);
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.content?.[0]
        || error.response?.data?.visibility?.[0]
        || 'Failed to create post. Please try again.';
      setError(errorMsg);
    } finally {
      setIsPosting(false);
    }
  };

  // Format radius for display
  const formatRadius = (miles) => {
    return `${Math.round(miles)} mi`;
  };

  // Get privacy badge info (matching PostCard styling)
  const getVisibilityInfo = () => {
    const visibilityMap = {
      public: { label: 'Public', icon: '🌎' },
      followers: { label: 'Followers', icon: '👥' },
      private: { label: 'Private', icon: '🔒' }
    };
    return visibilityMap[visibility] || visibilityMap.public;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6 border border-cream-dark/20">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Post Content */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={5000}
            className="w-full border border-cream-dark/30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime resize-none text-gray-800"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {content.length}/5000 characters
          </p>
        </div>

        {/* Privacy Badge, Toggle Button, and Post Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPrivacySettings(!showPrivacySettings)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {/* Visibility Badge */}
            <div className="flex items-center text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
              <span className="mr-1">{getVisibilityInfo().icon}</span>
              <span className="font-medium">{getVisibilityInfo().label}</span>
            </div>
            
            {/* Nearby Badge (if enabled) */}
            {limitToNearby && visibility !== 'private' && (
              <div className="flex items-center text-xs bg-blue-100 text-blue-900 px-3 py-1 rounded-full">
                <span className="mr-1">📍</span>
                <span className="font-medium">{formatRadius(nearbyRadius)}</span>
              </div>
            )}
            
            {/* Toggle Arrow */}
            <span className="text-olive text-sm">
              {showPrivacySettings ? '▲' : '▼'}
            </span>
          </button>

          {/* Post Button */}
          <button
            type="submit"
            disabled={isPosting || !content.trim()}
            className="bg-burgundy text-white px-6 py-2 rounded-md font-medium hover:bg-burgundy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Privacy Settings - Collapsible */}
        {showPrivacySettings && (
          <div className="mt-4 p-4 bg-cream-light rounded-md border border-cream-dark/20 space-y-4">
            {/* Visibility Selector */}
            <div>
              <label className="block text-sm font-medium text-burgundy mb-2">
                Who can see this?
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full border border-cream-dark/30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime bg-white text-gray-800"
              >
                <option value="public">Public (everyone)</option>
                <option value="followers">Followers (my followers)</option>
                <option value="private">Private (just me)</option>
              </select>
            </div>

            {/* Nearby Filter Checkbox - Only show for public/followers */}
            {visibility !== 'private' && (
              <div>
                <label className={`flex items-center ${hasLocation ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                  <input
                    type="checkbox"
                    checked={limitToNearby}
                    onChange={(e) => setLimitToNearby(e.target.checked)}
                    disabled={!hasLocation}
                    className="h-4 w-4 text-lime focus:ring-lime border-cream-dark/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="ml-2 text-sm text-burgundy">
                    Also limit to people nearby
                  </span>
                </label>
                {!hasLocation && (
                  <p className="text-xs text-red-600 mt-1 ml-6">
                    You must set your location in settings to use this feature
                  </p>
                )}
              </div>
            )}

            {/* Nearby Radius Slider - Only shown when nearby filter is enabled */}
            {limitToNearby && visibility !== 'private' && (
              <div className="p-3 bg-white rounded-md border border-cream-dark/20">
                <label className="block text-sm font-medium text-burgundy mb-3">
                  Nearby radius: {formatRadius(nearbyRadius)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={nearbyRadius}
                  onChange={(e) => setNearbyRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lime"
                />
                <div className="flex justify-between text-xs text-olive mt-1">
                  <span>1 mi</span>
                  <span>30 mi</span>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default PostForm;
