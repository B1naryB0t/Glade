import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import PostForm from "../components/posts/PostForm";
import Feed from "../components/posts/Feed";
import { api } from "../services/api";

function HomePage() {
	const { isAuthenticated } = useAuth();
	const queryClient = useQueryClient();

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useInfiniteQuery({
		queryKey: ["posts"],
		queryFn: ({ pageParam = 1 }) => api.getPosts({ page: pageParam }),
		getNextPageParam: (lastPage) => {
			// Check if there's a next page
			if (lastPage?.next) {
				// Extract page number from next URL
				const url = new URL(lastPage.next);
				return parseInt(url.searchParams.get('page') || '2');
			}
			return undefined;
		},
		enabled: isAuthenticated,
	});

	// Flatten all pages into a single array
	const allPosts = data?.pages.flatMap(page => page?.results || page || []) || [];

	// Handle new posts pushed into the feed
	const handlePostCreated = (newPost) => {
		queryClient.setQueryData(["posts"], (old) => {
			if (!old || !old.pages || old.pages.length === 0) {
				// If no data yet, create initial structure
				return {
					pages: [{ results: [newPost], next: null, previous: null, count: 1 }],
					pageParams: [1]
				};
			}
			
			// Clone the pages array
			const newPages = [...old.pages];
			const firstPage = newPages[0];
			
			// Update first page with new post at the beginning
			newPages[0] = {
				...firstPage,
				results: [newPost, ...(firstPage?.results || [])],
				count: (firstPage?.count || 0) + 1
			};
			
			return { ...old, pages: newPages };
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

				<Feed posts={allPosts} isLoading={isLoading} error={error?.message} />

				{/* Load More Button */}
				{hasNextPage && !isFetchingNextPage && (
					<div className="mt-6 text-center">
						<button
							onClick={() => fetchNextPage()}
							className="bg-olive text-white px-6 py-3 rounded-lg font-semibold hover:bg-lime transition-colors"
						>
							Load More Posts
						</button>
					</div>
				)}

				{isFetchingNextPage && (
					<div className="mt-6 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
						<p className="text-olive mt-2">Loading more posts...</p>
					</div>
				)}

				{!hasNextPage && allPosts.length > 0 && (
					<div className="mt-6 text-center text-gray-500">
						<p>You've reached the end!</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default HomePage;
