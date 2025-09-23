// frontend/src/components/CreatePost.jsx
import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Globe, Users, Lock, AlertTriangle } from 'lucide-react'
import { postService } from '../services/postService'
import { useLocation } from '../hooks/useLocation'

const VISIBILITY_OPTIONS = [
	{ value: 1, label: 'Public', icon: Globe, description: 'Visible to everyone, including other instances' },
	{ value: 2, label: 'Local', icon: MapPin, description: 'Visible to nearby users and local instance' },
	{ value: 3, label: 'Followers', icon: Users, description: 'Visible to your followers only' },
	{ value: 4, label: 'Private', icon: Lock, description: 'Only visible to you' },
]

function CreatePost() {
	const [content, setContent] = useState('')
	const [contentWarning, setContentWarning] = useState('')
	const [visibility, setVisibility] = useState(2)
	const [localOnly, setLocalOnly] = useState(false)
	const [includeLocation, setIncludeLocation] = useState(false)

	const { location, hasLocation } = useLocation()
	const queryClient = useQueryClient()

	const createPostMutation = useMutation({
		mutationFn: postService.createPost,
		onSuccess: () => {
			setContent('')
			setContentWarning('')
			queryClient.invalidateQueries(['posts'])
		}
	})

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!content.trim()) return

		const postData = {
			content: content.trim(),
			visibility,
			local_only: localOnly,
			...(contentWarning && { content_warning: contentWarning }),
			...(includeLocation && hasLocation && {
				location: {
					latitude: location.latitude,
					longitude: location.longitude
				}
			})
		}

		createPostMutation.mutate(postData)
	}

	const selectedVisibility = VISIBILITY_OPTIONS.find(opt => opt.value === visibility)

	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Content Warning */}
				{contentWarning !== null && (
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Content Warning (optional)
						</label>
						<input
							type="text"
							value={contentWarning}
							onChange={(e) => setContentWarning(e.target.value)}
							className="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500"
							placeholder="Warn others about sensitive content"
						/>
					</div>
				)}

				{/* Main Content */}
				<div>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className="w-full p-3 border rounded-md resize-none focus:ring-green-500 focus:border-green-500"
						rows="4"
						placeholder="What's happening in your neighborhood?"
						maxLength="500"
					/>
					<div className="text-right text-sm text-gray-500 mt-1">
						{content.length}/500
					</div>
				</div>

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
											? 'border-green-500 bg-green-50'
											: 'border-gray-200 hover:border-gray-300'
										}`}
								>
									<div className="flex items-center space-x-2">
										<option.icon className="w-4 h-4" />
										<span className="font-medium">{option.label}</span>
									</div>
									<p className="text-xs text-gray-500 mt-1">{option.description}</p>
								</button>
							))}
						</div>
					</div>

					{/* Location Toggle */}
					{hasLocation && (
						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={includeLocation}
								onChange={(e) => setIncludeLocation(e.target.checked)}
								className="rounded border-gray-300 text-green-600 focus:ring-green-500"
							/>
							<span className="text-sm text-gray-700">Include approximate location</span>
						</label>
					)}

					{/* Local Only Toggle */}
					<label className="flex items-center space-x-2">
						<input
							type="checkbox"
							checked={localOnly}
							onChange={(e) => setLocalOnly(e.target.checked)}
							className="rounded border-gray-300 text-green-600 focus:ring-green-500"
						/>
						<span className="text-sm text-gray-700">Keep on this instance only</span>
					</label>

					{/* Content Warning Toggle */}
					<button
						type="button"
						onClick={() => setContentWarning(contentWarning === null ? '' : null)}
						className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
					>
						<AlertTriangle className="w-4 h-4" />
						<span>Add content warning</span>
					</button>
				</div>

				{/* Submit */}
				<div className="flex justify-between items-center pt-4 border-t">
					<div className="flex items-center space-x-2 text-sm text-gray-500">
						<selectedVisibility.icon className="w-4 h-4" />
						<span>{selectedVisibility.label}</span>
						{localOnly && <span>• Local Only</span>}
						{includeLocation && <span>• Location Included</span>}
					</div>

					<button
						type="submit"
						disabled={!content.trim() || createPostMutation.isPending}
						className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{createPostMutation.isPending ? 'Posting...' : 'Post'}
					</button>
				</div>
			</form>
		</div>
	)
}

export default CreatePost
