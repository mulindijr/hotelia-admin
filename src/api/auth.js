import api from './client';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/status'); // The doc says status, let's use it for getMe/auth check
    return response.data;
  },
  
  me: async () => {
    const response = await api.get('/auth/me');
    return response;
  }
};
