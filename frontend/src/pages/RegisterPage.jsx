import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();

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
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
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
    setIsLoading(true);
    setErrors({});
    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      if (!result.success)
        setErrors({ submit: result.error || "Registration failed" });
    } catch {
      setErrors({ submit: "An unexpected error occurred" });
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
          Create your Glade account
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "#85993D" }}>
          Or{" "}
          <Link
            to="/login"
            className="font-medium"
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
                <div className="text-sm" style={{ color: "#FFE3AB" }}>
                  {errors.submit}
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
                      className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm"
                      style={{
                        borderColor: errors[field] ? "#7A3644" : "#B8CC42",
                        backgroundColor: "#FFE3AB",
                        color: "#7A3644",
                      }}
                    />
                    {errors[field] && (
                      <p className="mt-2 text-sm" style={{ color: "#7A3644" }}>
                        {errors[field]}
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium"
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
