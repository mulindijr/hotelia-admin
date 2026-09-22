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
  
  createHotel: async (formData) => {
    // Note: Use FormData for logo upload
    const response = await api.post('/hotels', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  updateHotel: async (id, formData) => {
    // Note: Laravel handles PUT with FormData if _method is set, or Axios handles it
    // Usually FormData with PUT in Laravel requires POST with _method=PUT
    formData.append('_method', 'PUT');
    const response = await api.post(`/hotels/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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
