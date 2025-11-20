import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ErrorAlert from "./common/ErrorAlert";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setIsLoading(true);
      await login(username, password);
      setAttemptCount(0);
      navigate("/");
    } catch (err) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      let errorMessage = "Login failed. Please try again.";

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) errorMessage = "Invalid username or password";
        else if (status === 429)
          errorMessage = "Too many login attempts. Try again later.";
        else if (status === 400)
          errorMessage =
            data?.error || data?.detail || "Invalid login credentials";
        else if (status >= 500) errorMessage = "Server error. Try again later.";
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      if (newAttemptCount >= 3) {
        errorMessage +=
          " After 5 failed attempts, your account may be temporarily locked.";
      }

      setError(errorMessage);
      setPassword("");
    } finally {
      setIsLoading(false);
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
          Sign in to Glade
        </h2>

        <p className="mt-2 text-center text-sm" style={{ color: "#7A3644" }}>
          Or{" "}
          <Link
            to="/register"
            style={{ color: "#85993D" }}
            className="font-medium hover:opacity-80"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <ErrorAlert error={error} onClose={() => setError(null)} />
            )}

            {attemptCount >= 3 && (
              <div
                className="rounded-md p-4"
                style={{
                  backgroundColor: "#FF9886",
                  border: "1px solid #7A3644",
                }}
              >
                <p className="text-sm" style={{ color: "#7A3644" }}>
                  Multiple failed login attempts detected. Please ensure your
                  credentials are correct.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium"
                style={{ color: "#7A3644" }}
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400"
                  style={{
                    borderColor: "#85993D",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: "#7A3644" }}
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400"
                  style={{
                    borderColor: "#85993D",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "#B8CC42" }}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm"
                  style={{ color: "#7A3644" }}
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  style={{ color: "#85993D" }}
                  className="font-medium hover:opacity-80"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50"
                style={{
                  backgroundColor: "#85993D",
                }}
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
