import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import PostForm from "../components/posts/PostForm";
import Feed from "../components/posts/Feed";
import { api } from "../services/api";

function HomePage() {
	const { isAuthenticated } = useAuth();
	const queryClient = useQueryClient();

	const { data: response, isLoading, error } = useQuery({
		queryKey: ["posts"],
		queryFn: api.getPosts,
		enabled: isAuthenticated,
	});

	// Normalize response format
	const posts = Array.isArray(response)
		? response
		: response?.results || response?.data || [];

	// Handle new posts pushed into the feed
	const handlePostCreated = (newPost) => {
		queryClient.setQueryData(["posts"], (old) => {
			const oldPosts = Array.isArray(old) ? old : old?.results || [];
			return [newPost, ...oldPosts];
		});
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

				<Feed posts={posts} isLoading={isLoading} error={error?.message} />
			</div>
		</div>
	);
}

export default HomePage;
