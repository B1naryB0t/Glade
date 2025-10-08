import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

function PostCard({ post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    console.log(`${liked ? 'Unliked' : 'Liked'} post ${post.id}`);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const isOwnPost = user && post.author && user.id === post.author.id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-cream p-6 mb-4 hover:shadow-md transition-all duration-200">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Author Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-coral to-burgundy rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">
              {post.author?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          
          {/* Author Info */}
          <div>
            <h3 className="font-bold text-burgundy">
              {post.author?.username || 'Anonymous'}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-olive">
              <span>{formatTimeAgo(post.created_at)}</span>
              {post.city && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    📍 {post.city}{post.region ? `, ${post.region}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Options Menu */}
        {isOwnPost && (
          <button className="text-olive hover:text-burgundy transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-burgundy leading-relaxed whitespace-pre-wrap text-lg">
          {post.content}
        </p>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-cream">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${
              liked 
                ? 'text-coral scale-105' 
                : 'text-olive hover:text-coral'
            }`}
          >
            <svg className="w-6 h-6" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-semibold">{likeCount}</span>
          </button>

          {/* Comment Button */}
          <button className="flex items-center space-x-2 text-sm font-medium text-olive hover:text-lime transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment</span>
          </button>

          {/* Share Button */}
          <button className="flex items-center space-x-2 text-sm font-medium text-olive hover:text-lime transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>

        {/* Privacy Indicator */}
        {post.visibility && post.visibility !== 'public' && (
          <div className="flex items-center text-xs text-burgundy bg-cream px-3 py-1 rounded-full">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">{post.visibility === 'followers' ? 'Followers' : 'Private'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostCard;