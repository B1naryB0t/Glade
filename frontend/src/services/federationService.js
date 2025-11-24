import { apiClient } from './apiClient';
import axios from 'axios';

export const searchRemoteUser = async (handle) => {
  // Use axios directly to avoid /api/v1 prefix
  // Let axios handle URL encoding by using params
  const response = await axios.get('/api/lookup', {
    params: { handle }
  });
  return response.data;
};

export const getRemoteActor = async (actorUrl) => {
  // Proxy through backend to avoid CORS and auth issues
  const response = await axios.get('/api/fetch-actor', {
    params: { actor_url: actorUrl }
  });
  return response.data;
};

export const followRemoteUser = async (actorUri) => {
  // Use POST body for actor URI (handles slashes properly)
  const response = await apiClient.post('/auth/follow/', {
    actor_uri: actorUri
  });
  return response.data;
};

export const unfollowRemoteUser = async (username) => {
  const response = await apiClient.delete(`/api/auth/follow/${username}/`);
  return response.data;
};

export const getFederatedFeed = async (page = 1) => {
  // Use axios directly to avoid /api/v1 prefix
  const response = await axios.get(`/api/federated-timeline?page=${page}`, {
    headers: {
      'Authorization': `Token ${localStorage.getItem('authToken')}`,
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return response.data;
};
