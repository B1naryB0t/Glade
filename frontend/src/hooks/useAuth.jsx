// frontend/src/hooks/useAuth.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { apiClient } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const queryClient = useQueryClient();

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("authToken", token);
    } else {
      delete apiClient.defaults.headers.common["Authorization"];
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
  }, [token]);

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
    enabled: !!token,
    retry: false,
    onError: () => {
      setToken(null);
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authService.login({ email, password }),
    onSuccess: (data) => {
      const authToken = data.token || data.access_token;
      setToken(authToken);

      // Store user data
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      queryClient.invalidateQueries(["currentUser"]);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: ({ username, email, password }) =>
      authService.register({ username, email, password }),
    onSuccess: (data) => {
      const authToken = data.token || data.access_token;
      setToken(authToken);

      // Store user data
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      queryClient.invalidateQueries(["currentUser"]);
    },
  });

  // Logout
  const logout = () => {
    setToken(null);
    queryClient.clear();
  };

  // Delete Account
  const deleteAccount = async () => {
    await authService.deleteAccount();
    logout();
  };

  // Update user data
  const updateUser = (userData) => {
    queryClient.setQueryData(["currentUser"], (oldData) => {
      const updatedUser = { ...oldData, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const value = {
    user,
    isLoading:
      isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!token && !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    deleteAccount,
    updateUser,
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
