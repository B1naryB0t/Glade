import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, user, error } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    console.log("LoginPage useEffect: user=", user, "isLoading=", isLoading);
    if (user && !isLoading) {
      console.log(
        "LoginPage: User is authenticated, redirecting to home",
        user,
      );
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const inputTypes = {
    email: "email",
    password: "password",
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
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
      console.log("LoginPage: Attempting login with email:", formData.email);

      await login({
        email: formData.email,
        password: formData.password,
      });

      console.log(
        "LoginPage: Login successful - redirecting will happen via useEffect",
      );
      // useEffect will handle redirect when user is set
    } catch (err) {
      console.error("LoginPage: Login error:", err);
      setErrors({
        submit: err.message || "An unexpected error occurred during login",
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
          Sign in to Glade
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "#85993D" }}>
          Or{" "}
          <Link
            to="/register"
            className="font-medium"
            style={{ color: "#B8CC42" }}
          >
            create a new account
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
                <div className="text-sm" style={{ color: "#FFE3AB" }}>
                  {errors.submit}
                </div>
              </div>
            )}

            {error && (
              <div
                className="rounded-md p-4"
                style={{ backgroundColor: "#7A3644" }}
              >
                <div className="text-sm" style={{ color: "#FFE3AB" }}>
                  {error.message || "An error occurred"}
                </div>
              </div>
            )}

            {["email", "password"].map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium"
                  style={{ color: "#85993D" }}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <div className="mt-1">
                  <input
                    id={field}
                    name={field}
                    type={inputTypes[field]}
                    autoComplete={field}
                    required
                    value={formData[field]}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm"
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
                </div>
              </div>
            ))}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium"
                style={{
                  backgroundColor: "#B8CC42",
                  color: "#7A3644",
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm"
                style={{ color: "#7A3644" }}
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
