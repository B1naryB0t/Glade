import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LocationPicker } from '../location';
import { PrivacySelector, LocationPrivacyControl } from '../privacy';

function PostForm({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [locationPrivacy, setLocationPrivacy] = useState('city'); // NEW
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const MAX_CHARS = 500;
  const remainingChars = MAX_CHARS - content.length;

  // Handle location selection from LocationPicker
  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    // If location is cleared, reset location privacy to 'none'
    if (!selectedLocation) {
      setLocationPrivacy('none');
    } else if (locationPrivacy === 'none') {
      // If adding location and privacy was 'none', default to 'city'
      setLocationPrivacy('city');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Convert visibility to backend format
      const visibilityMap = {
        'public': 1,
        'followers': 2,
        'private': 3
      };

      // Build the post data
      const newPost = {
        id: Date.now(),
        content: content.trim(),
        author: {
          id: user.id,
          username: user.username
        },
        created_at: new Date().toISOString(),
        visibility: visibilityMap[visibility],
        local_only: false,
        likes: 0
      };

      // Add location data based on privacy settings
      if (location && locationPrivacy !== 'none') {
        // Apply location privacy filtering
        switch (locationPrivacy) {
          case 'country':
            newPost.city = null;
            newPost.region = null;
            newPost.country = location.country || null;
            newPost.country_code = location.countryCode || null;
            break;
          case 'region':
            newPost.city = null;
            newPost.region = location.region || null;
            newPost.country = location.country || null;
            newPost.country_code = location.countryCode || null;
            break;
          case 'city':
            newPost.city = location.city || null;
            newPost.region = location.region || null;
            newPost.country = location.country || null;
            newPost.country_code = location.countryCode || null;
            break;
          default:
            newPost.city = null;
            newPost.region = null;
            newPost.country = null;
            newPost.country_code = null;
        }
        
        console.log('Post with location privacy:', {
          locationPrivacy,
          city: newPost.city,
          region: newPost.region,
          country: newPost.country
        });
      } else {
        // No location or privacy set to 'none'
        newPost.city = null;
        newPost.region = null;
        newPost.country = null;
        newPost.country_code = null;
      }

      // Simulate API call (replace with real API when ready)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      // Clear form after successful post
      setContent('');
      setLocation(null);
      setVisibility('public');
      setLocationPrivacy('city');
      
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Post creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-cream-light to-white rounded-2xl shadow-md border-2 border-cream p-6 mb-6">
      <form onSubmit={handleSubmit}>
        {/* Post Content */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-coral to-burgundy rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your area?"
              className="w-full px-4 py-3 border-2 border-cream rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent resize-none text-burgundy placeholder-olive bg-white"
              rows="3"
              maxLength={MAX_CHARS}
            />
            
            <div className="flex justify-end mt-2">
              <span className={`text-sm font-medium ${
                remainingChars < 50 ? 'text-coral' : 'text-olive'
              }`}>
                {remainingChars}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-coral-light border-2 border-coral rounded-xl">
            <p className="text-sm text-burgundy font-medium">{error}</p>
          </div>
        )}

        {/* Location Picker Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-burgundy mb-2">
            📍 Add Location (Optional)
          </label>
          <LocationPicker 
            onLocationSelect={handleLocationSelect}
            initialLocation={location}
          />
        </div>

        {/* Location Privacy Control - NEW */}
        <div className="mb-4">
          <LocationPrivacyControl
            value={locationPrivacy}
            onChange={setLocationPrivacy}
            hasLocation={!!location}
          />
        </div>

        {/* Privacy Selector - NEW (Replaces old dropdown) */}
        <div className="mb-4">
          <PrivacySelector
            value={visibility}
            onChange={setVisibility}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-8 py-3 bg-gradient-to-r from-coral to-coral-dark text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostForm;