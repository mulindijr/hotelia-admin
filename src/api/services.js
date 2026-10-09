import api from './client';

export const servicesApi = {
  getServices: async (hotelId, params = {}) => {
    const response = await api.get(`/hotels/${hotelId}/services`, { params });
    return response.data;
  },

  getService: async (hotelId, id) => {
    const response = await api.get(`/hotels/${hotelId}/services/${id}`);
    return response.data;
  },

  createService: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/services`, data);
    return response.data;
  },

  updateService: async (hotelId, id, data) => {
    const response = await api.patch(`/hotels/${hotelId}/services/${id}`, data);
    return response.data;
  },

  deleteService: async (hotelId, id) => {
    const response = await api.delete(`/hotels/${hotelId}/services/${id}`);
    return response.data;
  }
};
