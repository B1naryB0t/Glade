// frontend/src/hooks/useErrorHandler.jsx
import { useState, useCallback } from "react";

export function useErrorHandler() {
	const [error, setError] = useState(null);

	const handleError = useCallback((err) => {
		let errorMessage = "An unexpected error occurred";

		if (err.response) {
			// Server responded with error
			if (err.response.data?.error) {
				errorMessage = err.response.data.error;
			} else if (err.response.data?.detail) {
				errorMessage = err.response.data.detail;
			} else if (err.response.status === 429) {
				errorMessage = "Too many requests. Please slow down.";
			} else if (err.response.status === 413) {
				errorMessage = "File is too large. Please choose a smaller file.";
			} else if (err.response.status >= 500) {
				errorMessage = "Server error. Please try again later.";
			}
		} else if (err.request) {
			// Request made but no response
			errorMessage = "Network error. Please check your connection.";
		} else if (err.message) {
			errorMessage = err.message;
		}

		setError(errorMessage);

		// Auto-clear error after 5 seconds
		setTimeout(() => setError(null), 5000);
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return { error, handleError, clearError };
}
