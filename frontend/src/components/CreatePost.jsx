import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth'; // Import auth context

function CreatePost() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); // Get current user from auth context
  
  console.log('CreatePost component - currentUser:', currentUser);
  
  // Form state
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public'); // Default
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useDefaultPrivacy, setUseDefaultPrivacy] = useState(true);

  // Constants
  const MAX_POST_LENGTH = 500;
  const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', icon: '🌎', description: 'Everyone can see this post' },
    { value: 'followers', label: 'Followers', icon: '👥', description: 'Only your followers can see this post' },
    { value: 'private', label: 'Private', icon: '🔒', description: 'Only you can see this post' }
  ];

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Loading user settings');
        const settings = await api.getUserSettings();
        console.log('User settings loaded:', settings);
        setUserSettings(settings);
        
        // Apply default settings
        if (settings.default_post_privacy && useDefaultPrivacy) {
          console.log('Applying default privacy:', settings.default_post_privacy);
          setVisibility(settings.default_post_privacy);
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    
    if (content.length > MAX_POST_LENGTH) {
      setError(`Post content cannot exceed ${MAX_POST_LENGTH} characters`);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get location from user settings or current user
      const location = userSettings?.location || currentUser?.location || { city: '', region: '' };
      
      console.log('Creating post with:', {
        content,
        visibility,
        city: location.city,
        region: location.region,
        user: {
          id: currentUser?.id,
          username: currentUser?.username
        }
      });
      
      // IMPORTANT: Include the user info in the post data
      const post = await postService.createPost({
        content,
        visibility,
        city: location.city,
        region: location.region,
        // Ensure user info is passed
        user: {
          id: currentUser?.id,
          username: currentUser?.username
        }
      });
      
      console.log('Created post:', post);
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Failed to create post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const remainingChars = MAX_POST_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto my-6">
      <h1 className="text-xl font-bold mb-4 text-burgundy">Create Post</h1>
      
      {error && (
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
            <div className="ml-auto">
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Post content */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className={`w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-1 ${
              isOverLimit ? "border-red-500 focus:ring-red-500" : "focus:ring-lime border-gray-300"
            }`}
            rows="4"
          />
          <div className={`text-right text-sm mt-1 ${
            remainingChars < 50
              ? isOverLimit
                ? "text-red-600"
                : "text-yellow-600"
              : "text-gray-500"
          }`}>
            {remainingChars} characters remaining
          </div>
        </div>
        
        {/* Location information display */}
        {(userSettings?.location || currentUser?.location) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                Your post will include your location: 
                <span className="font-medium ml-1">
                  {userSettings?.location?.city || currentUser?.location?.city || ''}
                  {(userSettings?.location?.city || currentUser?.location?.city) && 
                   (userSettings?.location?.region || currentUser?.location?.region) ? ', ' : ''}
                  {userSettings?.location?.region || currentUser?.location?.region || ''}
                </span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              You can change your location in <button 
                type="button" 
                onClick={() => navigate('/settings')}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Settings
              </button>
            </p>
          </div>
        )}
        
        {/* Visibility */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Who can see this post?</label>
            {userSettings?.default_post_privacy && (
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useDefaultPrivacy}
                  onChange={(e) => {
                    setUseDefaultPrivacy(e.target.checked);
                    if (e.target.checked && userSettings.default_post_privacy) {
                      setVisibility(userSettings.default_post_privacy);
                    }
                  }}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Use default privacy ({userSettings.default_post_privacy})
              </label>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisibility(option.value)}
                className={`p-3 border rounded-md text-left transition-colors ${
                  visibility === option.value
                    ? "border-lime bg-green-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || isOverLimit || loading}
            className="px-4 py-2 bg-lime text-white rounded-md hover:bg-olive focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;