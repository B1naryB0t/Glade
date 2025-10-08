import React, { useState } from 'react';
import PostForm from '../components/posts/PostForm';
import Feed from '../components/posts/Feed';

// Initial mock data
const initialMockPosts = [
  {
    id: 1,
    content: "Just had an amazing coffee at a local cafe! ☕ The atmosphere here is perfect for getting some work done. Anyone know other great spots in the area?",
    author: {
      id: 2,
      username: "coffee_lover"
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    city: "Charlotte",
    region: "North Carolina",
    likes: 12,
    visibility: "public"
  },
  {
    id: 2,
    content: "Beautiful sunset from uptown today! 🌅 Sometimes you just have to stop and appreciate the view.",
    author: {
      id: 3,
      username: "photographer_jane"
    },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    city: "Charlotte",
    region: "North Carolina",
    likes: 28,
    visibility: "public"
  },
  {
    id: 3,
    content: "Working on a new project and feeling excited about the possibilities! 💻 There's something special about building something from scratch.",
    author: {
      id: 1,
      username: "demo_user"
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    city: "Charlotte",
    region: "North Carolina",
    likes: 5,
    visibility: "followers"
  }
];

function HomePage() {
  const [posts, setPosts] = useState(initialMockPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
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