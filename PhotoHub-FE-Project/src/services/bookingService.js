import axios from "axios";

const API_BASE = "http://localhost:3000/api";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

export const bookingService = {
  // 1. Tạo booking mới (Customer)
  createBooking: async (bookingData) => {
    const res = await axios.post(`${API_BASE}/bookings`, bookingData, getHeaders());
    return res.data;
  },

  // 2. Lấy danh sách booking của chính mình (Customer)
  getMyBookings: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/bookings/my`, {
      ...getHeaders(),
      params,
    });
    return res.data;
  },

  // 3. Lấy danh sách booking được đặt (Photographer)
  getPhotographerBookings: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/bookings/photographer/my`, {
      ...getHeaders(),
      params,
    });
    return res.data;
  },

  // 4. Hủy booking (Customer)
  cancelBooking: async (bookingId) => {
    const res = await axios.put(`${API_BASE}/bookings/${bookingId}/cancel`, {}, getHeaders());
    return res.data;
  },

  // 5. Tạo link thanh toán PayOS (Customer)
  createPaymentLink: async (bookingId) => {
    const res = await axios.post(`${API_BASE}/bookings/${bookingId}/payment`, {}, getHeaders());
    return res.data;
  },

  // 6. Chấp nhận booking (Photographer)
  acceptBooking: async (bookingId) => {
    const res = await axios.put(`${API_BASE}/bookings/${bookingId}/accept`, {}, getHeaders());
    return res.data;
  },

  // 7. Từ chối booking với lý do (Photographer)
  rejectBooking: async (bookingId, reason) => {
    const res = await axios.put(
      `${API_BASE}/bookings/${bookingId}/reject`,
      { reason },
      getHeaders()
    );
    return res.data;
  },

  // 8. Đánh dấu hoàn thành booking (Photographer)
  completeBooking: async (bookingId) => {
    const res = await axios.put(`${API_BASE}/bookings/${bookingId}/complete`, {}, getHeaders());
    return res.data;
  },

  // 9. Lấy chi tiết một booking
  getBookingDetail: async (bookingId) => {
    const res = await axios.get(`${API_BASE}/bookings/${bookingId}`, getHeaders());
    return res.data;
  },

  // 10. Lấy danh sách packages của một photographer (Customer xem)
  getPhotographerPackages: async (photographerId) => {
    const res = await axios.get(`${API_BASE}/packages/photographer/${photographerId}`, getHeaders());
    return res.data;
  },
};
