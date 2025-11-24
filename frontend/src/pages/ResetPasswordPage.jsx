import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import ErrorAlert from "../components/common/ErrorAlert";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.resetPassword(token, password);

      alert("Password reset successful! Please log in with your new password.");
      navigate("/login");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to reset password. The link may have expired.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  //
  // Invalid / missing token view
  //
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white flex items-center px-4 py-12">
        <div className="max-w-lg mx-auto w-full">
          <div className="bg-white border border-cream-dark/20 shadow-md rounded-lg p-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-5">
              <h3 className="text-md font-semibold text-red-800">
                Invalid Reset Link
              </h3>
              <p className="mt-2 text-sm text-red-700">
                This password reset link is invalid or has expired.
              </p>

              <div className="mt-4">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Request a new reset link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //
  // Main reset form
  //
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white flex items-center px-4 py-12">
      <div className="max-w-lg mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-burgundy mb-3">
            Set a New Password
          </h2>
          <p className="text-olive text-lg">Enter your new password below</p>
        </div>

        <div className="bg-white border border-cream-dark/20 shadow-md rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <ErrorAlert error={error} onClose={() => setError(null)} />
            )}

            {/* New password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-burgundy"
              >
                New Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-cream-dark/40 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-burgundy focus:border-burgundy"
              />

              <p className="mt-1 text-xs text-olive">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-burgundy"
              >
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-cream-dark/40 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-burgundy focus:border-burgundy"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-burgundy text-white py-3 rounded-md font-semibold shadow hover:bg-burgundy-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-sm font-medium text-burgundy hover:text-burgundy-dark"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
