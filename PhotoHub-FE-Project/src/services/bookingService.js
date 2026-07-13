import axios from "axios";

const API_BASE = "http://localhost:3000/api";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

export const bookingService = {
  // 1. Táº¡o booking má»›i (Customer)
  createBooking: async (bookingData) => {
    const res = await axios.post(`${API_BASE}/bookings`, bookingData, getHeaders());
    return res.data;
  },

  // 2. Láº¥y danh sĂ¡ch booking cá»§a chĂ­nh mĂ¬nh (Customer)
  getMyBookings: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/bookings/my`, {
      ...getHeaders(),
      params,
    });
    return res.data;
  },

  // 3. Láº¥y danh sĂ¡ch booking Ä‘Æ°á»£c Ä‘áº·t (Photographer)
  getPhotographerBookings: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/bookings/photographer/my`, {
      ...getHeaders(),
      params,
    });
    return res.data;
  },

  // 4. Há»§y booking (Customer)
  cancelBooking: async (bookingId) => {
    const res = await axios.put(`${API_BASE}/bookings/${bookingId}/cancel`, {}, getHeaders());
    return res.data;
  },

  // 5. Táº¡o link thanh toĂ¡n PayOS (Customer)
  createPaymentLink: async (bookingId) => {
    const res = await axios.post(`${API_BASE}/bookings/${bookingId}/payment`, {}, getHeaders());
    return res.data;
  },

  syncPaymentStatus: async (bookingId, orderCode, canceled = false) => {
    const res = await axios.get(`${API_BASE}/bookings/${bookingId}/payment/status`, {
      ...getHeaders(),
      params: { orderCode, canceled },
    });
    return res.data;
  },

  syncPaymentStatusByOrderCode: async (orderCode, canceled = false) => {
    const res = await axios.get(`${API_BASE}/bookings/payment/status`, {
      ...getHeaders(),
      params: { orderCode, canceled },
    });
    return res.data;
  },

  // 6. Cháº¥p nháº­n booking (Photographer)
  acceptBooking: async (bookingId) => {
    const res = await axios.put(`${API_BASE}/bookings/${bookingId}/accept`, {}, getHeaders());
    return res.data;
  },

  // 7. Tá»« chá»‘i booking vá»›i lĂ½ do (Photographer)
  rejectBooking: async (bookingId, reason) => {
    const res = await axios.put(
      `${API_BASE}/bookings/${bookingId}/reject`,
      { reason },
      getHeaders()
    );
    return res.data;
  },

  // 8. ÄĂ¡nh dáº¥u hoĂ n thĂ nh booking (Photographer)
  completeBooking: async (bookingId) => {
    const res = await axios.put(`${API_BASE}/bookings/${bookingId}/complete`, {}, getHeaders());
    return res.data;
  },

  // 9. Láº¥y chi tiáº¿t má»™t booking
  getBookingDetail: async (bookingId) => {
    const res = await axios.get(`${API_BASE}/bookings/${bookingId}`, getHeaders());
    return res.data;
  },

  // 10. Lấy danh sách packages của một photographer (Customer xem)
  getPhotographerPackages: async (photographerId) => {
    const res = await axios.get(`${API_BASE}/packages/photographer/${photographerId}`, getHeaders());
    return res.data;
  },

  // 11. Tạo đánh giá cho booking
  createReview: async (bookingId, rating, comment) => {
    const res = await axios.post(`${API_BASE}/bookings/${bookingId}/reviews`, { rating, comment }, getHeaders());
    return res.data;
  },

  // 12. Lấy danh sách đánh giá của photographer
  getPhotographerReviews: async (photographerId, params = {}) => {
    const res = await axios.get(`${API_BASE}/photographers/${photographerId}/reviews`, { params });
    return res.data;
  },
};
