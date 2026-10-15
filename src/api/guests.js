import api, { buildUrl } from './client';

export const guestsApi = {
  getGuests: async (options = {}) => {
    const response = await api.get(buildUrl('/guests', options));
    return response.data;
  },

  getGuest: async (id) => {
    const response = await api.get(`/guests/${id}`);
    return response.data;
  },

  createGuest: async (data) => {
    const response = await api.post('/guests', data);
    return response.data;
  },

  updateGuest: async (id, data) => {
    const response = await api.put(`/guests/${id}`, data);
    return response.data;
  },

  deleteGuest: async (id) => {
    const response = await api.delete(`/guests/${id}`);
    return response.data;
  },

  getGuestBookings: async (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.hotel_id) {
      params.append('hotel_id', options.hotel_id);
    }
    const queryString = params.toString();
    const url = queryString ? `/guests/${id}/bookings?${queryString}` : `/guests/${id}/bookings`;
    const response = await api.get(url);
    return response.data;
  }
};
