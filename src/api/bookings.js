import api, { buildUrl } from './client';

export const bookingsApi = {
  getBookings: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/bookings`, options));
    return response.data;
  },

  getBooking: async (hotelId, id) => {
    const response = await api.get(`/hotels/${hotelId}/bookings/${id}`);
    return response.data;
  },

  createBooking: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/bookings`, data);
    return response.data;
  },

  updateBookingStatus: async (hotelId, id, status) => {
    const response = await api.patch(`/hotels/${hotelId}/bookings/${id}/status`, { status });
    return response.data;
  },

  cancelBooking: async (hotelId, id) => {
    const response = await api.post(`/hotels/${hotelId}/bookings/${id}/cancel`);
    return response.data;
  },

  // Invoices & Payments related to bookings
  getBookingInvoice: async (hotelId, bookingId) => {
    const response = await api.get(`/hotels/${hotelId}/bookings/${bookingId}/invoice`, {
      responseType: 'blob' // Handling PDF download
    });
    return response;
  }
};
