// frontend/src/components/FileUpload.jsx
import React, { useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function FileUpload({
	onFileSelect,
	accept = "image/*",
	maxSize = MAX_FILE_SIZE,
}) {
	const [preview, setPreview] = useState(null);
	const [error, setError] = useState(null);
	const [dragActive, setDragActive] = useState(false);

	const validateFile = (file) => {
		// Check file type
		if (!ALLOWED_TYPES.includes(file.type)) {
			return "Only JPEG, PNG, GIF, and WebP images are allowed";
		}

		// Check file size
		if (file.size > maxSize) {
			const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
			return `File size must be less than ${maxSizeMB}MB`;
		}

		return null;
	};

	const handleFile = (file) => {
		setError(null);

		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreview(reader.result);
		};
		reader.readAsDataURL(file);

		// Notify parent
		onFileSelect(file);
	};

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFile(e.dataTransfer.files[0]);
		}
	};

	const handleChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			handleFile(e.target.files[0]);
		}
	};

	const clearFile = () => {
		setPreview(null);
		setError(null);
		onFileSelect(null);
	};

	return (
		<div className="w-full">
			{!preview ? (
				<div
					className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive
							? "border-green-500 bg-green-50"
							: "border-gray-300 hover:border-gray-400"
						}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
				>
					<Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
					<p className="text-sm text-gray-600 mb-2">
						Drag and drop an image, or click to select
					</p>
					<input
						type="file"
						onChange={handleChange}
						accept={accept}
						className="hidden"
						id="file-upload"
					/>
					<label
						htmlFor="file-upload"
						className="inline-block px-4 py-2 bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700"
					>
						Choose File
					</label>
					<p className="text-xs text-gray-500 mt-2">
						Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
					</p>
				</div>
			) : (
				<div className="relative">
					<img
						src={preview}
						alt="Preview"
						className="w-full h-auto rounded-lg"
					/>
					<button
						onClick={clearFile}
						className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			{error && (
				<div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
					<AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}
		</div>
	);
}

export default FileUpload;
