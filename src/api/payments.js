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

  updatePaymentStatus: async (hotelId, bookingId, paymentId, data) => {
    // Expected data: { status: 'pending' | 'completed' | 'failed' | 'refunded', notes?: string }
    const response = await api.post(`/hotels/${hotelId}/bookings/${bookingId}/payments/${paymentId}/status`, data);
    return response.data;
  },

  refundPayment: async (hotelId, bookingId, paymentId, notes = '') => {
    const response = await api.post(`/hotels/${hotelId}/bookings/${bookingId}/payments/${paymentId}/status`, {
      status: 'refunded',
      ...(notes ? { notes } : {})
    });
    return response.data;
  },

  downloadReceipt: async (hotelId, paymentId) => {
    const response = await api.get(`/hotels/${hotelId}/payments/${paymentId}/receipt/pdf`, {
      responseType: 'blob'
    });
    return response;
  }
};
