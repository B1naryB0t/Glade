import React, { useState, useEffect } from 'react';
import PostForm from '../components/posts/PostForm';
import Feed from '../components/posts/Feed';
import { api } from '../services/api';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load posts from the API
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        const response = await api.getPosts();
        setPosts(response.results);
      } catch (err) {
        setError("Failed to load posts.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  const handlePostCreated = async (newPost) => {
    // Option 1: reload from API after creating (recommended)
    const updated = await api.getPosts();
    setPosts(updated.results);

    // OR Option 2 (faster, no reload):
    // setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
      <div className="max-w-2xl mx-auto pt-8 px-4 pb-8">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-burgundy mb-2">Home Feed</h1>
          <p className="text-olive text-lg">See what's happening in your area</p>
        </div>

        <PostForm onPostCreated={handlePostCreated} />

        <Feed posts={posts} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}

export default HomePage;
