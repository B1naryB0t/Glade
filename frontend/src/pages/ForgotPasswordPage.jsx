import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import ErrorAlert from "../components/common/ErrorAlert";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.requestPasswordReset(email);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to send reset email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white flex items-center px-4 py-12">
      <div className="max-w-lg mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-burgundy mb-3">
            Reset Your Password
          </h2>
          <p className="text-olive text-lg">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white border border-cream-dark/20 shadow-md rounded-lg p-8">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-5">
              <div className="flex">
                <svg
                  className="h-6 w-6 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>

                <div className="ml-3">
                  <h3 className="text-md font-semibold text-green-800">
                    Check your email
                  </h3>
                  <p className="text-green-700 mt-1 text-sm">
                    If an account exists with that email, you’ll receive a reset
                    link shortly.
                  </p>

                  <div className="mt-4">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-green-700 hover:text-green-600"
                    >
                      Return to login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <ErrorAlert error={error} onClose={() => setError(null)} />
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-burgundy"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full px-4 py-2 border border-cream-dark/40 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-burgundy focus:border-burgundy"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-burgundy text-white py-3 rounded-md font-semibold shadow hover:bg-burgundy-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-burgundy hover:text-burgundy-dark"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
