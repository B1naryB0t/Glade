// frontend/src/components/ErrorAlert.jsx
import React from "react";
import { AlertCircle, X } from "lucide-react";

function ErrorAlert({ error, onClose }) {
	if (!error) return null;

	return (
		<div className="fixed top-4 right-4 max-w-md z-50 animate-slide-in">
			<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-lg">
				<div className="flex items-start">
					<AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
					<div className="flex-1">
						<h3 className="text-sm font-medium text-red-800">Error</h3>
						<p className="text-sm text-red-700 mt-1">{error}</p>
					</div>
					{onClose && (
						<button
							onClick={onClose}
							className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
						>
							<X className="w-5 h-5" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default ErrorAlert;
