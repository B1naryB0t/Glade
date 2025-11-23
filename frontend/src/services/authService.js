// frontend/src/services/authService.js
import { apiClient } from "./apiClient";

export const authService = {
  /**
   * Login user
   * @param {Object} credentials - {email, password}
   * @returns {Promise<{user: Object, token: string}>}
   */
  login: async ({ email, password }) => {
    try {
      console.log("AuthService: Attempting login with:", { email });

      const response = await apiClient.post("/auth/login/", {
        username: email, // Backend uses 'username' field
        password: password,
      });

      console.log("AuthService: Full login response:", response);
      console.log("AuthService: Response data:", response.data);
      console.log(
        "AuthService: Response data keys:",
        Object.keys(response.data),
      );
      console.log("AuthService: Token:", response.data.token);
      console.log("AuthService: User:", response.data.user);

      // Store token and user data
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("AuthService: Login failed", error);
      console.error("AuthService: Error response:", error.response?.data);
      throw new Error(error.response?.data?.message || "Login failed");
    }
  },

  /**
   * Register new user
   * @param {Object} userData - {username, email, password, confirmPassword}
   * @returns {Promise<{user: Object, token: string, message: string}>}
   */
  register: async ({ username, email, password, confirmPassword }) => {
    try {
      console.log("AuthService: Attempting registration");

      const registrationData = {
        username: username,
        email: email,
        password: password,
        password_confirm: confirmPassword,
        display_name: username,
      };

      console.log("AuthService: Sending registration data", {
        username,
        email,
        display_name: username,
      });

      const response = await apiClient.post(
        "/auth/register/",
        registrationData,
      );

      console.log("AuthService: Registration successful", response.data);

      // Store token and user data
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("AuthService: Registration failed", error);

      // Log detailed server response
      if (error.response?.data) {
        console.error("Server validation errors:", error.response.data);
      }

      // Parse error message from various possible response formats
      let errorMessage = "Registration failed";

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle field-specific errors
        if (typeof errorData === "object" && !Array.isArray(errorData)) {
          const firstErrorKey = Object.keys(errorData)[0];
          if (firstErrorKey) {
            const errorValue = errorData[firstErrorKey];
            errorMessage = Array.isArray(errorValue)
              ? errorValue[0]
              : errorValue;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData[0]?.message || "Registration failed";
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Get current user profile from localStorage
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    try {
      console.log("AuthService: Fetching current user from localStorage");
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("AuthService: Failed to parse user data", error);
      return null;
    }
  },

  /**
   * Get user profile by username
   * @param {string} username
   * @returns {Promise<Object>}
   */
  getUserProfile: async (username) => {
    try {
      console.log("AuthService: Fetching user profile for", username);
      const response = await apiClient.get(`/auth/profile/${username}/`);
      console.log("AuthService: User profile fetched", response.data);
      return response.data;
    } catch (error) {
      console.error("AuthService: Failed to fetch user profile", error);
      throw new Error("Failed to fetch user profile");
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      console.log("AuthService: Logging out");

      // Call backend logout endpoint
      await apiClient.post("/auth/logout/");

      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      return { success: true };
    } catch (error) {
      console.error("AuthService: Logout error", error);
      // Still clear local storage even if API call fails
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      return { success: true };
    }
  },

  /**
   * Verify email with token
   * @param {string} token
   * @returns {Promise<{message: string}>}
   */
  verifyEmail: async (token) => {
    try {
      console.log("AuthService: Verifying email");

      const response = await apiClient.post(`/auth/verify-email/${token}/`);

      console.log("AuthService: Email verified", response.data);
      return response.data;
    } catch (error) {
      console.error("AuthService: Email verification failed", error);
      throw new Error(
        error.response?.data?.message || "Email verification failed",
      );
    }
  },

  /**
   * Resend verification email
   * @returns {Promise<{message: string}>}
   */
  resendVerificationEmail: async () => {
    try {
      console.log("AuthService: Resending verification email");

      const response = await apiClient.post("/auth/resend-verification/");

      console.log("AuthService: Verification email resent", response.data);
      return response.data;
    } catch (error) {
      console.error("AuthService: Failed to resend verification email", error);
      // Re-throw the original error so the component can access response data
      throw error;
    }
  },

  /**
   * NOTE: Password reset endpoints (/auth/password-reset/, /auth/password-reset/confirm/)
   * are not yet implemented in the backend. These methods are placeholders.
   * Uncomment when backend endpoints are available.
   */

  /**
   * Request password reset (NOT YET IMPLEMENTED)
   * @param {string} email
   * @returns {Promise<{message: string}>}
   */
  // requestPasswordReset: async (email) => {
  //   try {
  //     console.log("AuthService: Requesting password reset");
  //     const response = await apiClient.post("/auth/password-reset/", { email });
  //     console.log("AuthService: Password reset requested", response.data);
  //     return response.data;
  //   } catch (error) {
  //     console.error("AuthService: Password reset request failed", error);
  //     throw new Error(
  //       error.response?.data?.message || "Failed to request password reset",
  //     );
  //   }
  // },

  /**
   * Reset password with token (NOT YET IMPLEMENTED)
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<{message: string}>}
   */
  // resetPassword: async (token, newPassword) => {
  //   try {
  //     console.log("AuthService: Resetting password");
  //     const response = await apiClient.post("/auth/password-reset/confirm/", {
  //       token,
  //       password: newPassword,
  //     });
  //     console.log("AuthService: Password reset successful", response.data);
  //     return response.data;
  //   } catch (error) {
  //     console.error("AuthService: Password reset failed", error);
  //     throw new Error(
  //       error.response?.data?.message || "Failed to reset password",
  //     );
  //   }
  // },

  /**
   * Delete account
   * @returns {Promise<Object>}
   */
  deleteAccount: async () => {
    try {
      console.log("AuthService: Attempting to delete account");

      const response = await apiClient.delete("/auth/delete/");

      console.log("AuthService: Account deleted successfully", response.data);

      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      return response.data;
    } catch (error) {
      console.error("AuthService: Failed to delete account", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete account",
      );
    }
  },
};
