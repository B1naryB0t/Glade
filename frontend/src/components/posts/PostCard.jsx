import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../services/api';

function PostCard({ post }) {
  // Post state
  const [liked, setLiked] = useState(post?.liked_by_current_user || false);
  const [likeCount, setLikeCount] = useState(post?.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // User settings state
  const [settings, setSettings] = useState(null);

  // Load user settings once
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await api.getUserSettings();
        setSettings(s);
      } catch (error) {
        console.error('Failed to load user settings for post:', error);
      }
    };

    loadSettings();
  }, []);

  // Load comments only when expanded
  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, post?.id]);

  const loadComments = async () => {
    if (!post?.id) return;

    try {
      setIsLoading(true);
      const commentsData = await api.getComments(post.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post?.id) return;

    try {
      const result = await api.toggleLike(post.id);
      setLiked(result.liked_by_current_user);
      setLikeCount(result.likes_count);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!post?.id || !newComment.trim()) return;

    try {
      await api.addComment(post.id, newComment);
      await loadComments(); // reload comments to prevent duplicates
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (!post) return null;

  // -------------------------------
  // 🔥 OVERRIDES ONLY APPLY TO CURRENT USER'S OWN POSTS
  // -------------------------------
  const isMyPost = settings && post.user?.id === settings.id;

  const finalVisibility = isMyPost
    ? settings?.default_post_privacy || post.visibility
    : post.visibility;

  const finalCity = isMyPost
    ? settings?.location?.city || post.city
    : post.city;

  const finalRegion = isMyPost
    ? settings?.location?.region || post.region
    : post.region;

  // Visibility label + icon
  const getVisibilityInfo = () => {
    switch (finalVisibility) {
      case 'private': return { label: 'Private', icon: '🔒' };
      case 'followers': return { label: 'Followers', icon: '👥' };
      default: return { label: 'Public', icon: '🌎' };
    }
  };

  const visibilityInfo = getVisibilityInfo();

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'recently';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const username = post.author?.username || post.user?.username || 'Unknown';
  const displayName = post.author?.display_name || post.user?.display_name || username;
  const userId = post.author?.id || post.user?.id || 'unknown';
  const userInitial = (displayName[0] || 'U').toUpperCase();

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-5 mb-4">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Link to={`/profile/${username}`} className="flex items-center">
          <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{userInitial}</span>
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-burgundy">{displayName}</h3>
            <div className="text-xs text-gray-500 flex items-center">
              <span>{getTimeAgo(post.created_at)}</span>

              {(finalCity || finalRegion) && (
                <>
                  <span className="mx-1">•</span>
                  <span>
                    📍 {finalCity}
                    {finalRegion && finalCity ? `, ${finalRegion}` : finalRegion || ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* Visibility badge */}
        <div className="flex items-center text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
          <span className="mr-1">{visibilityInfo.icon}</span>
          <span className="font-medium">{visibilityInfo.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-burgundy whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-cream">
        <div className="flex items-center space-x-6">

          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${
              liked ? 'text-coral scale-105' : 'text-olive hover:text-coral'
            }`}
          >
            <svg className="w-6 h-6" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{likeCount}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-sm font-medium text-olive hover:text-lime"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{showComments ? 'Hide Comments' : 'Comment'}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          {isLoading ? (
            <div className="text-center py-3 text-gray-500">Loading comments...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {comments.map(comment => (
                <div key={comment.id} className="p-3 bg-cream rounded-lg">
                  <div className="flex items-center mb-2">
                    <Link to={`/profile/${comment.author?.username || 'unknown'}`} className="flex items-center">
                      <div className="w-8 h-8 bg-olive rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-sm">
                          {(comment.author?.username?.[0] || 'U').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{comment.author?.display_name || comment.author?.username || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{getTimeAgo(comment.created_at)}</div>
                      </div>
                    </Link>
                  </div>
                  <p className="text-burgundy">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}

          {/* Add comment */}
          <form onSubmit={handleComment} className="mt-3 flex">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-grow border rounded-l-md p-2 focus:outline-none focus:ring-1 focus:ring-lime"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-lime text-white p-2 rounded-r-md disabled:opacity-50"
            >
              <svg className="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PostCard;
