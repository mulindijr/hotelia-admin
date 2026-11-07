import api, { buildUrl } from './client';

const buildReportUrl = (endpoint, options = {}) => {
  const { start_date, end_date, filters, ...rest } = options;
  const baseUrl = buildUrl(endpoint, { ...rest, filters });
  const params = new URLSearchParams();

  const resolvedStart = start_date || filters?.start_date;
  const resolvedEnd = end_date || filters?.end_date;

  if (resolvedStart) params.set('start_date', resolvedStart);
  if (resolvedEnd) params.set('end_date', resolvedEnd);

  const extraQuery = params.toString();
  if (!extraQuery) return baseUrl;
  return baseUrl.includes('?') ? `${baseUrl}&${extraQuery}` : `${baseUrl}?${extraQuery}`;
};

export const reportsApi = {
  getDashboardStats: async (hotelId, options = {}) => {
    // Expected endpoint: /api/v1/hotels/{hotelId}/reports/dashboard
    const url = buildReportUrl(`/hotels/${hotelId}/reports/dashboard`, options);
    const response = await api.get(url);
    return response.data;
  },

  getRevenueReport: async (hotelId, options = {}) => {
    // Expected endpoint: /api/v1/hotels/{hotelId}/reports/revenue
    const url = buildReportUrl(`/hotels/${hotelId}/reports/revenue`, options);
    const response = await api.get(url);
    return response.data;
  }
};
