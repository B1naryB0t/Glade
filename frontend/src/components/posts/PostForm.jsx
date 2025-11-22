import { useState } from 'react';
import { postService } from '../../services/postService';

function PostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [limitToNearby, setLimitToNearby] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(0.5); // in miles
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);

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

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      // Reset form
      setContent('');
      setVisibility('public');
      setLimitToNearby(false);
      setNearbyRadius(0.5);
      setError(null);
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
    if (miles < 0.1) {
      return `${Math.round(miles * 5280)} ft`;
    }
    return `${miles.toFixed(1)} mi`;
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

        {/* Visibility Selector */}
        <div className="mb-4">
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
          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={limitToNearby}
                onChange={(e) => setLimitToNearby(e.target.checked)}
                className="h-4 w-4 text-lime focus:ring-lime border-cream-dark/30 rounded"
              />
              <span className="ml-2 text-sm text-burgundy">
                Also limit to people nearby
              </span>
            </label>
          </div>
        )}

        {/* Nearby Radius Slider - Only shown when nearby filter is enabled */}
        {limitToNearby && visibility !== 'private' && (
          <div className="mb-4 p-4 bg-cream-light rounded-md border border-cream-dark/20">
            <label className="block text-sm font-medium text-burgundy mb-3">
              Nearby radius: {formatRadius(nearbyRadius)}
            </label>
            <input
              type="range"
              min="0.05"
              max="30"
              step="0.05"
              value={nearbyRadius}
              onChange={(e) => setNearbyRadius(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lime"
            />
            <div className="flex justify-between text-xs text-olive mt-1">
              <span>250 ft</span>
              <span>30 mi</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPosting || !content.trim()}
            className="bg-burgundy text-white px-6 py-2 rounded-md font-medium hover:bg-burgundy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostForm;
