import api, { buildUrl } from './client';

export const paymentsApi = {
  getPayments: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/payments`, options));
    return response.data;
  },

  recordPayment: async (hotelId, bookingId, data) => {
    // Expected data: amount, payment_method, status, transaction_reference
    const response = await api.post(`/hotels/${hotelId}/bookings/${bookingId}/payments`, data);
    return response.data;
  },

  refundPayment: async (hotelId, paymentId, data) => {
    const response = await api.post(`/hotels/${hotelId}/payments/${paymentId}/refund`, data);
    return response.data;
  }
};
