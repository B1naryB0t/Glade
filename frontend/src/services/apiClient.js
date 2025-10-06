// TEMPORARY MOCK - Replace with apiClient.REAL_BACKUP.js when backend is ready
const mockApiClient = {
  defaults: { headers: { common: {} } },
  
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  },
  
  async post(url, data) {
    console.log(' Mock POST:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/auth/login')) {
      const username = data.get ? data.get('username') : data.username;
      return {
        data: {
          access_token: 'mock_token_' + Date.now(),
          user: { 
            id: 1, 
            username: username || 'demo_user',
            email: (username || 'demo') + '@example.com'
          }
        }
      };
    }
    
    if (url.includes('/auth/register')) {
      return {
        data: {
          access_token: 'mock_token_' + Date.now(),
          user: {
            id: 1,
            username: data.username,
            email: data.email
          }
        }
      };
    }
    
    return { data: { success: true } };
  },
  
  async get(url) {
    console.log(' Mock GET:', url);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/auth/profile/me')) {
      return {
        data: { 
          id: 1, 
          username: 'demo_user', 
          email: 'demo@example.com' 
        }
      };
    }
    
    return { data: {} };
  }
};

export const apiClient = mockApiClient;
