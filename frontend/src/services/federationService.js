import apiClient from './apiClient';

export const searchRemoteUser = async (handle) => {
  const response = await apiClient.get(`/.well-known/webfinger?resource=acct:${handle.replace('@', '')}`);
  return response.data;
};

export const getRemoteActor = async (actorUrl) => {
  const response = await apiClient.get(actorUrl, {
    headers: { 'Accept': 'application/activity+json' }
  });
  return response.data;
};

export const followRemoteUser = async (username) => {
  const response = await apiClient.post(`/api/auth/follow/${username}/`);
  return response.data;
};

export const unfollowRemoteUser = async (username) => {
  const response = await apiClient.delete(`/api/auth/follow/${username}/`);
  return response.data;
};

export const getFederatedFeed = async (page = 1) => {
  const response = await apiClient.get(`/api/posts/?federated=true&page=${page}`);
  return response.data;
};
