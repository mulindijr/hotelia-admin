import api, { buildUrl } from './client';

export const housekeepingApi = {
  getTasks: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/housekeeping`, options));
    return response.data;
  },
  getTask: async (hotelId, taskId) => {
    const response = await api.get(`/hotels/${hotelId}/housekeeping/${taskId}`);
    return response.data;
  },
  createTask: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/housekeeping`, data);
    return response.data;
  },
  updateTask: async (hotelId, taskId, data) => {
    const response = await api.put(`/hotels/${hotelId}/housekeeping/${taskId}`, data);
    return response.data;
  },
  deleteTask: async (hotelId, taskId) => {
    const response = await api.delete(`/hotels/${hotelId}/housekeeping/${taskId}`);
    return response.data;
  }
};

export const maintenanceApi = {
  getRequests: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/maintenance`, options));
    return response.data;
  },
  getRequest: async (hotelId, requestId) => {
    const response = await api.get(`/hotels/${hotelId}/maintenance/${requestId}`);
    return response.data;
  },
  createRequest: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/maintenance`, data);
    return response.data;
  },
  updateRequest: async (hotelId, requestId, data) => {
    const response = await api.put(`/hotels/${hotelId}/maintenance/${requestId}`, data);
    return response.data;
  },
  deleteRequest: async (hotelId, requestId) => {
    const response = await api.delete(`/hotels/${hotelId}/maintenance/${requestId}`);
    return response.data;
  }
};
