// frontend/src/components/SuccessAlert.jsx
import React from "react";
import { CheckCircle, X } from "lucide-react";

function SuccessAlert({ message, onClose }) {
	if (!message) return null;

	return (
		<div className="fixed top-4 right-4 max-w-md z-50 animate-slide-in">
			<div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md shadow-lg">
				<div className="flex items-start">
					<CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
					<div className="flex-1">
						<h3 className="text-sm font-medium text-green-800">Success</h3>
						<p className="text-sm text-green-700 mt-1">{message}</p>
					</div>
					{onClose && (
						<button
							onClick={onClose}
							className="ml-3 flex-shrink-0 text-green-400 hover:text-green-600"
						>
							<X className="w-5 h-5" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default SuccessAlert;
