import api, { buildUrl } from './client';

export const usersApi = {
  getUsers: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/users`, options));
    return response.data;
  },

  createUser: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/users`, data);
    return response.data;
  },

  updateUser: async (hotelId, id, data) => {
    const response = await api.put(`/hotels/${hotelId}/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (hotelId, id) => {
    const response = await api.delete(`/hotels/${hotelId}/users/${id}`);
    return response.data;
  },

  getRoles: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}/roles`);
    return response.data;
  }
};
