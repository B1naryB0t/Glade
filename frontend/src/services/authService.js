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
      console.log("AuthService: Attempting login");

      const response = await apiClient.post("/auth/login/", {
        username: email, // Backend uses 'username' field
        password: password,
      });

      console.log("AuthService: Login successful", response.data);

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
      throw new Error(error.response?.data?.message || "Login failed");
    }
  },

  /**
   * Register new user
   * @param {Object} userData - {username, email, password}
   * @returns {Promise<{user: Object, token: string}>}
   */
  register: async ({ username, email, password }) => {
    try {
      console.log("AuthService: Attempting registration");

      const response = await apiClient.post("/auth/register/", {
        username: username,
        email: email,
        password: password,
        password_confirm: password,
        display_name: username,
      });

      console.log("AuthService: Registration successful", response.data);

      // Store token and user data
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("AuthService: Registration failed", error);
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>}
   */
  getCurrentUser: async () => {
    try {
      console.log("AuthService: Fetching current user");

      const response = await apiClient.get("/auth/me/");

      console.log("AuthService: Current user fetched", response.data);
      return response.data;
    } catch (error) {
      console.error("AuthService: Failed to fetch current user", error);
      throw new Error("Failed to fetch user data");
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    console.log("AuthService: Logging out");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  /**
   * Request password reset
   * @param {string} email
   * @returns {Promise<{message: string}>}
   */
  requestPasswordReset: async (email) => {
    try {
      console.log("AuthService: Requesting password reset");

      const response = await apiClient.post("/auth/password-reset/", {
        email,
      });

      console.log("AuthService: Password reset requested", response.data);
      return response.data;
    } catch (error) {
      console.error("AuthService: Password reset request failed", error);
      throw new Error(
        error.response?.data?.message || "Failed to request password reset",
      );
    }
  },

  /**
   * Reset password with token
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<{message: string}>}
   */
  resetPassword: async (token, newPassword) => {
    try {
      console.log("AuthService: Resetting password");

      const response = await apiClient.post("/auth/password-reset/confirm/", {
        token,
        password: newPassword,
      });

      console.log("AuthService: Password reset successful", response.data);
      return response.data;
    } catch (error) {
      console.error("AuthService: Password reset failed", error);
      throw new Error(
        error.response?.data?.message || "Failed to reset password",
      );
    }
  },

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
