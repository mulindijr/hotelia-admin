import api, { buildUrl } from './client';

export const roomsApi = {
  // Amenities
  getAmenities: async (options = {}) => {
    const response = await api.get(buildUrl('/amenities', options));
    return response.data;
  },
  
  createAmenity: async (data) => {
    const response = await api.post('/amenities', data);
    return response.data;
  },

  updateAmenity: async (id, data) => {
    const response = await api.put(`/amenities/${id}`, data);
    return response.data;
  },

  deleteAmenity: async (id) => {
    const response = await api.delete(`/amenities/${id}`);
    return response.data;
  },

  // Room Types
  getRoomTypes: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/room-types`, options));
    return response.data;
  },

  createRoomType: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/room-types`, data);
    return response.data;
  },

  updateRoomType: async (hotelId, roomTypeId, data) => {
    const response = await api.put(`/hotels/${hotelId}/room-types/${roomTypeId}`, data);
    return response.data;
  },

  deleteRoomType: async (hotelId, roomTypeId) => {
    const response = await api.delete(`/hotels/${hotelId}/room-types/${roomTypeId}`);
    return response.data;
  },

  // Individual Rooms
  getRooms: async (hotelId, options = {}) => {
    const response = await api.get(buildUrl(`/hotels/${hotelId}/rooms`, options));
    return response.data;
  },

  createRoom: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/rooms`, data);
    return response.data;
  },

  updateRoom: async (hotelId, roomId, data) => {
    const response = await api.put(`/hotels/${hotelId}/rooms/${roomId}`, data);
    return response.data;
  },

  deleteRoom: async (hotelId, roomId) => {
    const response = await api.delete(`/hotels/${hotelId}/rooms/${roomId}`);
    return response.data;
  },

  // Availability Matrix
  getAvailability: async (hotelId, startDate, endDate, roomTypeId = null) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    if (roomTypeId) params.append('room_type_id', roomTypeId);
    
    const response = await api.get(`/hotels/${hotelId}/availability?${params.toString()}`);
    return response.data;
  }
};
