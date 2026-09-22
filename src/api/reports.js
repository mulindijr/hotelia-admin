import api, { buildUrl } from './client';

export const reportsApi = {
  getDashboardStats: async (hotelId, options = {}) => {
    // Expected endpoint: /api/v1/hotels/{hotelId}/reports/dashboard
    const url = buildUrl(`/hotels/${hotelId}/reports/dashboard`, options);
    const response = await api.get(url);
    return response.data;
  },

  getRevenueReport: async (hotelId, options = {}) => {
    // Expected endpoint: /api/v1/hotels/{hotelId}/reports/revenue
    const url = buildUrl(`/hotels/${hotelId}/reports/revenue`, options);
    const response = await api.get(url);
    return response.data;
  }
};
