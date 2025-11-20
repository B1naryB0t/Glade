// frontend/src/hooks/useAuth.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { apiClient } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const queryClient = useQueryClient();

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      // Use 'Token' format (DRF Token Authentication), not 'Bearer'
      apiClient.defaults.headers.common["Authorization"] = `Token ${token}`;
      localStorage.setItem("authToken", token);
    } else {
      delete apiClient.defaults.headers.common["Authorization"];
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
  }, [token]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authService.login({ email, password }),
    onSuccess: (data) => {
      console.log("useAuth: Login success, data:", data);

      const authToken = data.token;
      const userData = data.user;

      console.log("useAuth: Extracted token:", authToken);
      console.log("useAuth: Extracted user:", userData);

      if (authToken && userData) {
        // Set token in headers FIRST
        apiClient.defaults.headers.common["Authorization"] =
          `Token ${authToken}`;
        console.log("useAuth: Set Authorization header");

        // Update state
        setToken(authToken);
        setUser(userData);
        console.log("useAuth: Updated state - token and user set");

        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      } else {
        console.error("useAuth: Login failed - missing token or user", {
          authToken,
          userData,
        });
        throw new Error("Missing token or user in response");
      }
    },
    onError: (error) => {
      console.error("useAuth: Login mutation error:", error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: ({ username, email, password, confirmPassword }) =>
      authService.register({ username, email, password, confirmPassword }),
    onSuccess: (data) => {
      console.log("useAuth: Register success", data);

      if (data.success) {
        const authToken = data.data.token || data.data.access_token;

        if (authToken && data.data.user) {
          setToken(authToken);
          setUser(data.data.user);
          localStorage.setItem("authToken", authToken);
          localStorage.setItem("user", JSON.stringify(data.data.user));

          // Set the token in axios headers immediately
          apiClient.defaults.headers.common["Authorization"] =
            `Token ${authToken}`;

          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }
      }
    },
    onError: (error) => {
      console.error("useAuth: Register failed", error);
    },
  });

  // Logout
  const logout = () => {
    console.log("useAuth: Logging out");
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  // Delete Account
  const deleteAccount = async () => {
    await authService.deleteAccount();
    logout();
  };

  // Update user data
  const updateUser = (userData) => {
    console.log("useAuth: Updating user", userData);
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    queryClient.setQueryData(["currentUser"], updatedUser);
  };

  const value = {
    user,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!token && !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    deleteAccount,
    updateUser,
    error: loginMutation.error || registerMutation.error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
