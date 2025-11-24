import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, user, error } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const inputTypes = {
    username: "text",
    email: "email",
    password: "password",
    confirmPassword: "password",
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors({ ...errors, submit: "" });
    }
  };

  const formatThrottleError = (errorMessage) => {
    // Check if this is a throttling error
    if (errorMessage.toLowerCase().includes("throttle")) {
      // Extract seconds if available
      const match = errorMessage.match(/(\d+)\s*seconds?/i);
      if (match) {
        const seconds = parseInt(match[1]);
        const minutes = Math.floor(seconds / 60);

        if (minutes > 0) {
          return `Too many registration attempts. Please try again in about ${minutes} minute${minutes > 1 ? "s" : ""}.`;
        }
        return `Too many registration attempts. Please try again in ${seconds} seconds.`;
      }
      return "Too many registration attempts. Please wait a few minutes and try again.";
    }
    return errorMessage;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      console.log("RegisterPage: Attempting registration with:", {
        username: formData.username,
        email: formData.email,
      });

      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      console.log("RegisterPage: Registration result", result);

      if (!result.success && result.error) {
        setErrors({
          submit: formatThrottleError(result.error),
        });
      }
    } catch (error) {
      console.error("RegisterPage: Registration error:", error);
      const errorMessage = error.message || "An unexpected error occurred";
      setErrors({
        submit: formatThrottleError(errorMessage),
      });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#FFE3AB" }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          className="mt-6 text-center text-3xl font-extrabold"
          style={{ color: "#7A3644" }}
        >
          Create your Glade account
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "#85993D" }}>
          Or{" "}
          <Link
            to="/login"
            className="font-medium hover:underline"
            style={{ color: "#B8CC42" }}
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="py-8 px-4 shadow sm:rounded-lg sm:px-10"
          style={{ backgroundColor: "#FF9886" }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.submit && (
              <div
                className="rounded-md p-4"
                style={{ backgroundColor: "#7A3644" }}
              >
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 flex-shrink-0 mr-2"
                    style={{ color: "#FFE3AB" }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm" style={{ color: "#FFE3AB" }}>
                    {errors.submit}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className="rounded-md p-4"
                style={{ backgroundColor: "#7A3644" }}
              >
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 flex-shrink-0 mr-2"
                    style={{ color: "#FFE3AB" }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm" style={{ color: "#FFE3AB" }}>
                    {formatThrottleError(error.message || "An error occurred")}
                  </div>
                </div>
              </div>
            )}

            {["username", "email", "password", "confirmPassword"].map(
              (field) => (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="block text-sm font-medium"
                    style={{ color: "#85993D" }}
                  >
                    {field === "confirmPassword"
                      ? "Confirm Password"
                      : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <div className="mt-1">
                    <input
                      id={field}
                      name={field}
                      type={inputTypes[field]}
                      autoComplete={
                        field === "password" || field === "confirmPassword"
                          ? "new-password"
                          : field
                      }
                      required
                      value={formData[field]}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B8CC42]"
                      style={{
                        borderColor: errors[field] ? "#7A3644" : "#B8CC42",
                        backgroundColor: "#FFE3AB",
                        color: "#7A3644",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    />
                    {errors[field] && (
                      <p className="mt-2 text-sm" style={{ color: "#7A3644" }}>
                        {errors[field]}
                      </p>
                    )}
                    {field === "password" && !errors[field] && (
                      <p className="mt-1 text-xs text-gray-600">
                        Must be at least 8 characters long
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "#B8CC42",
                  color: "#7A3644",
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
