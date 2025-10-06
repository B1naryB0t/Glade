import { apiClient } from './apiClient';

export const authService = {
  login: async ({ email, password }) => {
    try {
      console.log('AuthService: Attempting login');
      
      const response = await apiClient.post('/auth/login/', {
        username: email, // Backend uses 'username' not 'email'
        password: password
      });
      
      console.log('AuthService: Login successful', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Login failed', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async ({ username, email, password }) => {
    try {
      console.log('AuthService: Attempting registration');
      
      const response = await apiClient.post('/auth/register/', {
        username: username,
        email: email,
        password: password,
        password_confirm: password, // Backend requires password confirmation
        display_name: username // Optional display name
      });
      
      console.log('AuthService: Registration successful', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Registration failed', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  getCurrentUser: async () => {
    try {
      console.log('AuthService: Fetching current user');
      
      const response = await apiClient.get('/auth/profile/me/');
      
      console.log('AuthService: Current user fetched', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Failed to fetch current user', error);
      throw new Error('Failed to fetch user data');
    }
  }
};