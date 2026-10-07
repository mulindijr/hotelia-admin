import api, { buildUrl } from './client';

export const hotelsApi = {
  // Hotel Management
  getHotels: async (options = {}) => {
    const response = await api.get(buildUrl('/hotels', options));
    return response.data;
  },
  
  getHotel: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  },
  
  createHotel: async (data) => {
    const response = await api.post('/hotels', data);
    return response.data;
  },
  
  updateHotel: async (id, data) => {
    // If FormData is passed (e.g. for file upload), Laravel requires POST with _method=PUT
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      if (!data.has('_method')) {
        data.append('_method', 'PUT');
      }
      const response = await api.post(`/hotels/${id}`, data);
      return response.data;
    }
    const response = await api.put(`/hotels/${id}`, data);
    return response.data;
  },
  
  deleteHotel: async (id) => {
    const response = await api.delete(`/hotels/${id}`);
    return response.data;
  },

  // Hotel Settings
  getSettings: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}/settings`);
    return response.data;
  },

  updateSettings: async (hotelId, data) => {
    const response = await api.put(`/hotels/${hotelId}/settings`, data);
    return response.data;
  }
};
