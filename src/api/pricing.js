import api, { buildUrl } from './client';

export const pricingApi = {
  // Rate Plans
  getRatePlans: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/rate-plans`, options));
    return response.data;
  },
  createRatePlan: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/rate-plans`, data);
    return response.data;
  },
  updateRatePlan: async (hotelId, id, data) => {
    const response = await api.put(`/hotels/${hotelId}/rate-plans/${id}`, data);
    return response.data;
  },
  deleteRatePlan: async (hotelId, id) => {
    const response = await api.delete(`/hotels/${hotelId}/rate-plans/${id}`);
    return response.data;
  },

  // Pricing Rules
  getPricingRules: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/pricing-rules`, options));
    return response.data;
  },
  createPricingRule: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/pricing-rules`, data);
    return response.data;
  },
  updatePricingRule: async (hotelId, id, data) => {
    const response = await api.put(`/hotels/${hotelId}/pricing-rules/${id}`, data);
    return response.data;
  },
  deletePricingRule: async (hotelId, id) => {
    const response = await api.delete(`/hotels/${hotelId}/pricing-rules/${id}`);
    return response.data;
  },
};

