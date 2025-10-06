import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

function PostForm({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const MAX_CHARS = 500;
  const remainingChars = MAX_CHARS - content.length;

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

    const newPost = {
      id: Date.now(),
      content: content.trim(),
      author: {
        id: user.id,
        username: user.username
      },
      created_at: new Date().toISOString(),
      // Backend doesn't use city/region directly - it uses location coordinates
      // For now, we'll store city/region for display only
      city: city.trim() || null,
      region: region.trim() || null,
      likes: 0,
      visibility: visibilityMap[visibility], // Convert to number
      local_only: false
    };

    console.log('Creating post:', newPost);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (onPostCreated) {
      onPostCreated(newPost);
    }

    setContent('');
    setCity('');
    setRegion('');
    setVisibility('public');
    
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

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="flex-1 min-w-[150px] px-4 py-2 border-2 border-cream rounded-xl focus:outline-none focus:ring-2 focus:ring-lime focus:border-transparent text-burgundy placeholder-olive"
          />

          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="State/Region"
            className="flex-1 min-w-[150px] px-4 py-2 border-2 border-cream rounded-xl focus:outline-none focus:ring-2 focus:ring-lime focus:border-transparent text-burgundy placeholder-olive"
          />

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="flex-1 min-w-[150px] px-4 py-2 border-2 border-cream rounded-xl focus:outline-none focus:ring-2 focus:ring-lime focus:border-transparent text-burgundy font-medium"
          >
            <option value="public">🌍 Public</option>
            <option value="followers">👥 Followers</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>

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