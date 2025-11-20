import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import PostForm from "../components/posts/PostForm";
import Feed from "../components/posts/Feed";
import { api } from "../services/api";

function HomePage() {
	const { user, isAuthenticated } = useAuth();
	const [posts, setPosts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// Load posts from the API with full response handling
	const loadPosts = async () => {
		try {
			setIsLoading(true);
			setError(null);

			console.log("Loading posts...");
			const response = await api.getPosts();
			console.log("Posts loaded:", response);

			if (Array.isArray(response)) {
				setPosts(response);
			} else if (Array.isArray(response?.results)) {
				setPosts(response.results);
			} else if (Array.isArray(response?.data)) {
				setPosts(response.data);
			} else {
				console.error("Unexpected response format:", response);
				setPosts([]);
			}
		} catch (err) {
			console.error("Error loading posts:", err);
			setError(err.message || "Failed to load posts");
			setPosts([]);
		} finally {
			setIsLoading(false);
		}
	};

	// Trigger loading when auth state changes
	useEffect(() => {
		if (isAuthenticated) {
			loadPosts();
		}
	}, [isAuthenticated]);

	// Handle new posts pushed into the feed
	const handlePostCreated = (newPost) => {
		console.log("New post created:", newPost);
		setPosts((prevPosts) => [newPost, ...prevPosts]);
	};

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
				<div className="max-w-2xl mx-auto pt-12 px-4 pb-8">
					<div className="bg-white rounded-lg shadow-md p-10 text-center border border-cream-dark/20">
						<h2 className="text-4xl font-bold text-burgundy mb-4">
							Welcome to Glade
						</h2>

						<p className="text-olive text-lg mb-8">
							Log in to view your feed and connect with your local community.
						</p>

						<a
							href="/login"
							className="inline-block bg-burgundy text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-burgundy-dark transition"
						>
							Log In
						</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
			<div className="max-w-2xl mx-auto pt-8 px-4 pb-8">
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-burgundy mb-2">Home Feed</h1>
					<p className="text-olive text-lg">
						See what's happening in your area
					</p>
				</div>

				<PostForm onPostCreated={handlePostCreated} />

				<Feed posts={posts} isLoading={isLoading} error={error} />
			</div>
		</div>
	);
}

export default HomePage;
