// frontend/src/components/PostCard.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share, MapPin, MoreHorizontal } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postService } from '../services/postService'

function PostCard({ post, showLocation = true }) {
  const queryClient = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: () => post.is_liked ? postService.unlikePost(post.id) : postService.likePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
    }
  })

  const formatLocation = (location) => {
    if (!location) return null
    // This would be replaced with actual reverse geocoding
    return "Nearby"
  }

  return (
    <article className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author.username}`}>
            <img
              src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${post.author.display_name}`}
              alt={post.author.display_name}
              className="w-10 h-10 rounded-full"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${post.author.username}`}
              className="font-medium text-gray-900 hover:underline"
            >
              {post.author.display_name || post.author.username}
            </Link>
            <p className="text-sm text-gray-500">@{post.author.username}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-500">
          {showLocation && post.location && (
            <div className="flex items-center space-x-1 text-xs">
              <MapPin className="w-3 h-3" />
              <span>{formatLocation(post.location)}</span>
            </div>
          )}
          <span className="text-sm">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Warning */}
      {post.content_warning && (
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-sm text-yellow-800">
            <strong>Content Warning:</strong> {post.content_warning}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center space-x-2 text-sm ${
              post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
            <span>{post.likes_count}</span>
          </button>

          <Link
            to={`/post/${post.id}`}
            className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.replies_count}</span>
          </Link>

          <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-500">
            <Share className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        {/* Privacy indicator */}
        <div className="flex items-center space-x-1">
          {post.local_only && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Local Only
            </span>
          )}
          {post.visibility === 3 && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              Followers Only
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default PostCard
