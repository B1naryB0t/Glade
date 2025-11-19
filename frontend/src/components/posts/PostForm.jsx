import React, { useState } from 'react';
import { postService } from '../../services/postService';

function PostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsPosting(true);

      const postData = {
        content: content.trim(),
        visibility: 'public',
        local_only: false
      };

      console.log('Creating post:', postData);
      const newPost = await postService.createPost(postData);

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      setContent('');
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          rows="3"
          className="w-full border rounded-md p-2 text-gray-800"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isPosting}
            className="bg-burgundy text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostForm;
