import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import ConfirmModal from "../common/ConfirmModal";
import FederatedPostIndicator from "../FederatedPostIndicator";
import UserTypeBadge from "../UserTypeBadge";

function PostCard({ post, onDelete }) {
  const { user: currentUser } = useAuth();
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Post state
  const [liked, setLiked] = useState(post?.liked_by_current_user || false);
  const [likeCount, setLikeCount] = useState(post?.likes_count || 0);
  const [commentCount, setCommentCount] = useState(post?.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load comments when expanded
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
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post?.id) return;

    const prevLiked = liked;
    const prevCount = likeCount;

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const result = liked
        ? await api.unlikePost(post.id)
        : await api.likePost(post.id);

      setLiked(result.liked_by_current_user);
      setLikeCount(result.likes_count);
    } catch (error) {
      console.error("Error toggling like:", error);
      setLiked(prevLiked);
      setLikeCount(prevCount);
      alert("Failed to update like. Please try again.");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!post?.id || !newComment.trim()) return;

    const prevCount = commentCount;
    setCommentCount(prevCount + 1);

    try {
      await api.addComment(post.id, newComment);
      await loadComments();
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentCount(prevCount);
      alert("Failed to add comment.");
    }
  };

  if (!post) return null;

  const finalCity = post.city;
  const finalRegion = post.region;
  const visibility = post.visibility;

  const isMyPost =
    currentUser && post.author?.username === currentUser.username;

  const getVisibilityInfo = () => {
    if (visibility === 4 || visibility === "private")
      return { label: "Private", icon: "🔒" };
    if (visibility === 3 || visibility === "followers")
      return { label: "Followers", icon: "👥" };
    if (visibility === 2 || visibility === "local")
      return { label: "Nearby", icon: "📍" };
    return { label: "Public", icon: "🌎" };
  };

  const visibilityInfo = getVisibilityInfo();

  const formatRadius = (meters) => {
    const miles = meters / 1609.34;
    return `${Math.round(miles)} mi`;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "recently";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const username = post.author?.username || post.user?.username || "Unknown";
  const displayName =
    post.author?.display_name || post.user?.display_name || username;

  const userInitial = (displayName[0] || "U").toUpperCase();

  const handleDeletePost = async () => {
    try {
      await api.deletePost(post.id);
      setShowDeletePostModal(false);
      if (onDelete) onDelete(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    const prevCount = commentCount;
    const prevComments = comments;

    setCommentCount(Math.max(0, commentCount - 1));
    setComments(comments.filter((c) => c.id !== commentId));

    try {
      await api.deleteComment(commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
      setCommentCount(prevCount);
      setComments(prevComments);
      alert("Failed to delete comment.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {/* Left side: avatar + name */}
        <Link to={`/profile/${username}`} className="flex items-center">
          <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{userInitial}</span>
          </div>

          <div className="ml-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-burgundy">{displayName}</h3>
              <UserTypeBadge user={post.author} size="sm" />
            </div>

            <div className="text-xs text-gray-500 flex items-center">
              <span>{getTimeAgo(post.created_at)}</span>

              {(finalCity || finalRegion) && (
                <>
                  <span className="mx-1">•</span>
                  <span>
                    📍 {finalCity}
                    {finalRegion && finalCity
                      ? `, ${finalRegion}`
                      : finalRegion || ""}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* Right side: badges + delete */}
        <div className="flex items-center gap-2">
          <FederatedPostIndicator post={post} />

          <div className="flex items-center text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
            <span className="mr-1">{visibilityInfo.icon}</span>
            <span className="font-medium">{visibilityInfo.label}</span>
          </div>

          {post.location_radius && (
            <div className="flex items-center text-xs bg-blue-100 text-blue-900 px-3 py-1 rounded-full">
              <span className="mr-1">📍</span>
              <span className="font-medium">
                {isMyPost ? formatRadius(post.location_radius) : "Nearby"}
              </span>
            </div>
          )}

          {isMyPost && (
            <button
              onClick={() => setShowDeletePostModal(true)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Delete post"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.activity_id ? (
          <div
            className="text-burgundy prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-burgundy whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-cream">
        <div className="flex items-center space-x-6">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${
              liked ? "text-coral scale-105" : "text-olive hover:text-coral"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{likeCount}</span>
          </button>

          {/* Comments toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-sm font-medium text-olive hover:text-lime"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{commentCount}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          {isLoading ? (
            <div className="text-center py-3 text-gray-500">
              Loading comments...
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-cream rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      to={`/profile/${comment.author?.username || "unknown"}`}
                      className="flex items-center"
                    >
                      <div className="w-8 h-8 bg-olive rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-sm">
                          {(comment.author?.username?.[0] || "U").toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-medium">
                          {comment.author?.display_name ||
                            comment.author?.username ||
                            "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getTimeAgo(comment.created_at)}
                        </div>
                      </div>
                    </Link>

                    {/* Delete comment */}
                    {currentUser &&
                      comment.author?.username === currentUser.username && (
                        <button
                          onClick={() => setCommentToDelete(comment.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete comment"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
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
              <svg
                className="w-5 h-5"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Delete Post Modal */}
      <ConfirmModal
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
      />

      {/* Delete Comment Modal */}
      <ConfirmModal
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => handleDeleteComment(commentToDelete)}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}

export default PostCard;
