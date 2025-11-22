import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [postId, showComments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/posts/${postId}/comments/`);
      setComments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`/api/v1/posts/${postId}/comments/`, {
        content: newComment
      });
      setComments([...comments, response.data]);
      setNewComment('');
      setError(null);
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <button 
        onClick={toggleComments}
        className="text-olive hover:text-lime transition-colors text-sm font-medium flex items-center"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        {showComments ? 'Hide Comments' : 'Show Comments'}
        {!showComments && comments.length > 0 && ` (${comments.length})`}
      </button>

      {showComments && (
        <>
          {loading && comments.length === 0 ? (
            <div className="py-3 text-center text-sm text-gray-500">
              Loading comments...
            </div>
          ) : error ? (
            <div className="py-3 text-center text-sm text-red-500">
              {error}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-3 text-center text-sm text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {comments.map((comment) => {
                const username = comment.author?.username || 'Unknown';
                const displayName = comment.author?.display_name || username;
                return (
                  <div key={comment.id} className="p-3 bg-cream rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 bg-olive rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium">{displayName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-burgundy">{comment.content}</div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-3">
            <div className="flex items-center">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-lime focus:border-lime"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="bg-lime text-white p-2 rounded-r-md hover:bg-olive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default CommentSection;