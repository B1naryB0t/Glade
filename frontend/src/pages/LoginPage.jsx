import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await login({ email: formData.email, password: formData.password });
    } catch (error) {
      setErrors({ submit: "Invalid email or password." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFE3AB] via-[#FFE3AB] to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-bold text-[#7A3644]">
          Sign in to Glade
        </h2>
        <p className="mt-2 text-center text-sm text-[#85993D]">
          Or{" "}
          <Link
            to="/register"
            className="font-medium text-[#FF9886] hover:text-[#e97a66]"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-[#FFE3AB]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="rounded-md bg-[#FF9886]/20 p-4 border border-[#FF9886]">
                <div className="text-sm text-[#7A3644]">{errors.submit}</div>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#7A3644]"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm placeholder-[#bda4a9] focus:outline-none focus:ring-2 focus:ring-[#B8CC42] focus:border-[#B8CC42] 
                  ${errors.email ? "border-[#FF9886]" : "border-gray-300"}
                `}
              />

              {errors.email && (
                <p className="mt-2 text-sm text-[#7A3644]">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#7A3644]"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm placeholder-[#bda4a9] focus:outline-none focus:ring-2 focus:ring-[#B8CC42] focus:border-[#B8CC42]
                  ${errors.password ? "border-[#FF9886]" : "border-gray-300"}
                `}
              />

              {errors.password && (
                <p className="mt-2 text-sm text-[#7A3644]">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#FF9886] hover:text-[#e97a66]"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 rounded-md shadow text-sm font-medium text-white
                           bg-[#7A3644] hover:bg-[#6a2f3c] focus:outline-none focus:ring-2 focus:ring-[#B8CC42]
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
