import api from './client';

export const authApi = {
  register: async (credentials) => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },
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
  forgotPassword: async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },
  
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
  
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
  
  logoutAllDevices: async () => {
    const response = await api.post('/auth/logout-all-devices');
    return response.data;
  },
};