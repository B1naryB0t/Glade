// frontend/src/components/CreatePost.jsx
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Globe, Users, Lock, AlertTriangle, Image } from "lucide-react";
import { postService } from "../services/postService";
import { useLocation } from "../hooks/useLocation";
import { useFileUpload } from "../hooks/useFileUpload";
import { useErrorHandler } from "../hooks/useErrorHandler";
import FileUpload from "./FileUpload";
import ErrorAlert from "./ErrorAlert";

const VISIBILITY_OPTIONS = [
	{
		value: 1,
		label: "Public",
		icon: Globe,
		description: "Visible to everyone",
	},
	{
		value: 2,
		label: "Local",
		icon: MapPin,
		description: "Visible to nearby users",
	},
	{ value: 3, label: "Followers", icon: Users, description: "Followers only" },
	{ value: 4, label: "Private", icon: Lock, description: "Only you" },
];

const MAX_POST_LENGTH = 5000;

function CreatePost() {
	const [content, setContent] = useState("");
	const [contentWarning, setContentWarning] = useState("");
	const [showContentWarning, setShowContentWarning] = useState(false);
	const [visibility, setVisibility] = useState(2);
	const [localOnly, setLocalOnly] = useState(false);
	const [includeLocation, setIncludeLocation] = useState(false);
	const [showImageUpload, setShowImageUpload] = useState(false);

	const { location, hasLocation } = useLocation();
	const queryClient = useQueryClient();
	const { error, handleError, clearError } = useErrorHandler();
	const {
		file: imageFile,
		preview: imagePreview,
		selectFile,
		clearFile,
	} = useFileUpload();

	const createPostMutation = useMutation({
		mutationFn: postService.createPost,
		onSuccess: () => {
			setContent("");
			setContentWarning("");
			setShowContentWarning(false);
			clearFile();
			setShowImageUpload(false);
			queryClient.invalidateQueries(["posts"]);
		},
		onError: handleError,
	});

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!content.trim()) {
			handleError(new Error("Post content is required"));
			return;
		}

		if (content.length > MAX_POST_LENGTH) {
			handleError(
				new Error(`Post must be less than ${MAX_POST_LENGTH} characters`),
			);
			return;
		}

		const postData = {
			content: content.trim(),
			visibility,
			local_only: localOnly,
			...(showContentWarning &&
				contentWarning && { content_warning: contentWarning }),
			...(includeLocation &&
				hasLocation && {
				location: {
					latitude: location.latitude,
					longitude: location.longitude,
				},
			}),
		};

		createPostMutation.mutate(postData);
	};

	const selectedVisibility = VISIBILITY_OPTIONS.find(
		(opt) => opt.value === visibility,
	);
	const remainingChars = MAX_POST_LENGTH - content.length;
	const isOverLimit = remainingChars < 0;

	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<ErrorAlert error={error} onClose={clearError} />

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Content Warning */}
				{showContentWarning && (
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Content Warning
						</label>
						<input
							type="text"
							value={contentWarning}
							onChange={(e) => setContentWarning(e.target.value)}
							className="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500"
							placeholder="Warn others about sensitive content"
							maxLength={200}
						/>
					</div>
				)}

				{/* Main Content */}
				<div>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className={`w-full p-3 border rounded-md resize-none focus:ring-green-500 focus:border-green-500 ${isOverLimit ? "border-red-500" : ""
							}`}
						rows="4"
						placeholder="What's happening in your neighborhood?"
					/>
					<div
						className={`text-right text-sm mt-1 ${remainingChars < 100
								? isOverLimit
									? "text-red-600"
									: "text-yellow-600"
								: "text-gray-500"
							}`}
					>
						{remainingChars < 100 && `${remainingChars} characters remaining`}
					</div>
				</div>

				{/* Image Upload */}
				{showImageUpload && (
					<FileUpload onFileSelect={selectFile} maxSize={10 * 1024 * 1024} />
				)}

				{/* Options */}
				<div className="space-y-3">
					{/* Visibility */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Who can see this post?
						</label>
						<div className="grid grid-cols-2 gap-2">
							{VISIBILITY_OPTIONS.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setVisibility(option.value)}
									className={`p-3 border rounded-md text-left transition-colors ${visibility === option.value
											? "border-green-500 bg-green-50"
											: "border-gray-200 hover:border-gray-300"
										}`}
								>
									<div className="flex items-center space-x-2">
										<option.icon className="w-4 h-4" />
										<span className="font-medium">{option.label}</span>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										{option.description}
									</p>
								</button>
							))}
						</div>
					</div>

					{/* Additional Options */}
					<div className="flex flex-wrap gap-4">
						{hasLocation && (
							<label className="flex items-center space-x-2">
								<input
									type="checkbox"
									checked={includeLocation}
									onChange={(e) => setIncludeLocation(e.target.checked)}
									className="rounded border-gray-300 text-green-600 focus:ring-green-500"
								/>
								<span className="text-sm text-gray-700">
									Include approximate location
								</span>
							</label>
						)}

						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={localOnly}
								onChange={(e) => setLocalOnly(e.target.checked)}
								className="rounded border-gray-300 text-green-600 focus:ring-green-500"
							/>
							<span className="text-sm text-gray-700">
								Keep on this instance only
							</span>
						</label>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center space-x-2">
						<button
							type="button"
							onClick={() => setShowImageUpload(!showImageUpload)}
							className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
						>
							<Image className="w-4 h-4" />
							<span>Image</span>
						</button>

						<button
							type="button"
							onClick={() => setShowContentWarning(!showContentWarning)}
							className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
						>
							<AlertTriangle className="w-4 h-4" />
							<span>Content Warning</span>
						</button>
					</div>
				</div>

				{/* Submit */}
				<div className="flex justify-between items-center pt-4 border-t">
					<div className="flex items-center space-x-2 text-sm text-gray-500">
						<selectedVisibility.icon className="w-4 h-4" />
						<span>{selectedVisibility.label}</span>
						{localOnly && <span>• Local Only</span>}
						{includeLocation && <span>• Location</span>}
					</div>

					<button
						type="submit"
						disabled={
							!content.trim() || isOverLimit || createPostMutation.isPending
						}
						className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{createPostMutation.isPending ? "Posting..." : "Post"}
					</button>
				</div>
			</form>
		</div>
	);
}

export default CreatePost;
