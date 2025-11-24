// frontend/src/services/instanceService.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const instanceService = {
  // Get public instance information
  async getInstanceInfo() {
    const response = await api.get("/api/instance/info");
    return response.data;
  },

  // Get user's federation status
  async getFederationStatus() {
    const response = await api.get("/api/instance/federation-status");
    return response.data;
  },

  // Get list of connected remote instances
  async getRemoteInstances() {
    const response = await api.get("/api/instance/remote-instances");
    return response.data;
  },

  // Get list of remote users
  async getRemoteUsers(page = 1) {
    const response = await api.get("/api/instance/remote-users", {
      params: { page },
    });
    return response.data;
  },

  // Get activity log
  async getActivityLog(page = 1, filters = {}) {
    const response = await api.get("/api/instance/activity-log", {
      params: { page, ...filters },
    });
    return response.data;
  },
};
