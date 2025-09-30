// frontend/src/components/EmailVerificationBanner.jsx
import React, { useState } from "react";
import { Mail, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";

function EmailVerificationBanner({ user }) {
	const [dismissed, setDismissed] = useState(false);

	const resendMutation = useMutation({
		mutationFn: authService.resendVerificationEmail,
		onSuccess: () => {
			alert("Verification email sent! Please check your inbox.");
		},
		onError: () => {
			alert("Failed to send verification email. Please try again.");
		},
	});

	if (user?.email_verified || dismissed) return null;

	return (
		<div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<Mail className="w-5 h-5 text-yellow-600" />
					<div>
						<p className="text-sm font-medium text-yellow-800">
							Please verify your email address
						</p>
						<p className="text-xs text-yellow-700">
							Check your inbox for a verification link
						</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<button
						onClick={() => resendMutation.mutate()}
						disabled={resendMutation.isPending}
						className="text-sm text-yellow-700 hover:text-yellow-800 font-medium disabled:opacity-50"
					>
						{resendMutation.isPending ? "Sending..." : "Resend Email"}
					</button>
					<button
						onClick={() => setDismissed(true)}
						className="text-yellow-600 hover:text-yellow-800"
					>
						<X className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
}

export default EmailVerificationBanner;
