// frontend/src/hooks/useFileUpload.jsx
import { useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function useFileUpload(maxSize = MAX_FILE_SIZE) {
	const [file, setFile] = useState(null);
	const [preview, setPreview] = useState(null);
	const [error, setError] = useState(null);
	const [uploading, setUploading] = useState(false);

	const validateFile = (file) => {
		setError(null);

		if (!ALLOWED_TYPES.includes(file.type)) {
			setError("Only JPEG, PNG, GIF, and WebP images are allowed");
			return false;
		}

		if (file.size > maxSize) {
			const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
			setError(`File size must be less than ${maxSizeMB}MB`);
			return false;
		}

		return true;
	};

	const selectFile = (selectedFile) => {
		if (!validateFile(selectedFile)) {
			return false;
		}

		setFile(selectedFile);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreview(reader.result);
		};
		reader.readAsDataURL(selectedFile);

		return true;
	};

	const clearFile = () => {
		setFile(null);
		setPreview(null);
		setError(null);
	};

	const uploadFile = async (uploadFn) => {
		if (!file) return null;

		setUploading(true);
		setError(null);

		try {
			const result = await uploadFn(file);
			return result;
		} catch (err) {
			setError(err.response?.data?.error || "Upload failed");
			throw err;
		} finally {
			setUploading(false);
		}
	};

	return {
		file,
		preview,
		error,
		uploading,
		selectFile,
		clearFile,
		uploadFile,
	};
}
