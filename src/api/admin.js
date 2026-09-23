import api, { buildUrl } from './client';

export const adminApi = {
  getAuditLogs: async (options = {}) => {
    // Note: audit-logs is a global endpoint, not scoped to a hotel ID
    const url = buildUrl('/admin/audit-logs', options);
    const response = await api.get(url);
    return response.data;
  },
};
