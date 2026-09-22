import api from './client';

export const dashboardApi = {
  getStats: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}/dashboard/stats`);
    return response.data;
  },

  getOccupancyChart: async (hotelId, days = 30) => {
    const response = await api.get(`/hotels/${hotelId}/dashboard/occupancy?days=${days}`);
    return response.data;
  },

  getRevenueChart: async (hotelId, days = 30) => {
    const response = await api.get(`/hotels/${hotelId}/dashboard/revenue?days=${days}`);
    return response.data;
  }
};
