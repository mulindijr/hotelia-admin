import api, { buildUrl } from './client';

export const bookingsApi = {
  getBookings: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/bookings`, options));
    return response.data;
  },

  getBooking: async (hotelId, id, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/bookings/${id}`, options));
    return response.data;
  },

  createBooking: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/bookings`, data);
    return response.data;
  },

  updateBookingStatus: async (hotelId, id, status) => {
    let response;
    if (status === 'checked_in') {
      response = await api.post(`/hotels/${hotelId}/bookings/${id}/check-in`);
    } else if (status === 'checked_out') {
      response = await api.post(`/hotels/${hotelId}/bookings/${id}/check-out`);
    } else if (status === 'cancelled') {
      response = await api.post(`/hotels/${hotelId}/bookings/${id}/cancel`);
    } else {
      response = await api.patch(`/hotels/${hotelId}/bookings/${id}`, { status });
    }
    return response.data;
  },
  downloadInvoice: async (hotelId, id) => {
    const response = await api.get(`/hotels/${hotelId}/bookings/${id}/invoice/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  cancelBooking: async (hotelId, id) => {
    const response = await api.post(`/hotels/${hotelId}/bookings/${id}/cancel`);
    return response.data;
  },

  addPayment: async (hotelId, id, data) => {
    const response = await api.post(`/hotels/${hotelId}/bookings/${id}/payments`, data);
    return response.data;
  },

  patchBooking: async (hotelId, id, data) => {
    const response = await api.patch(`/hotels/${hotelId}/bookings/${id}`, data);
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
