const BASE_URL = "https://photo-hub-be-project.vercel.app/api/admin";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const adminService = {
  // ================= DASHBOARD STATISTICS =================
  getDashboardStatistics: async () => {
    const response = await fetch(`${BASE_URL}/dashboard/statistics`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  // ================= MANAGE USERS =================
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/users?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getUserById: async (id) => {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  updateUserStatus: async (id, isBlocked) => {
    const response = await fetch(`${BASE_URL}/users/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ isBlocked }),
    });
    return response.json();
  },

  deleteUser: async (id) => {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return response.json();
  },

  // ================= VERIFY PHOTOGRAPHER =================
  getPhotographerVerifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/photographer-verifications?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getPhotographerVerificationById: async (id) => {
    const response = await fetch(`${BASE_URL}/photographer-verifications/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  approvePhotographerVerification: async (id, adminNote = "") => {
    const response = await fetch(`${BASE_URL}/photographer-verifications/${id}/approve`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ adminNote }),
    });
    return response.json();
  },

  rejectPhotographerVerification: async (id, adminNote) => {
    const response = await fetch(`${BASE_URL}/photographer-verifications/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ adminNote }),
    });
    return response.json();
  },

  // ================= MANAGE BOOKINGS =================
  getBookings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/bookings?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getBookingById: async (id) => {
    const response = await fetch(`${BASE_URL}/bookings/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  updateBookingStatus: async (id, status, note = "") => {
    const response = await fetch(`${BASE_URL}/bookings/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, note }),
    });
    return response.json();
  },

  // ================= MANAGE PAYMENTS & ESCROW =================
  getPayments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/payments?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getPaymentById: async (id) => {
    const response = await fetch(`${BASE_URL}/payments/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  confirmPayment: async (id, adminNote = "") => {
    const response = await fetch(`${BASE_URL}/payments/${id}/confirm`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ adminNote }),
    });
    return response.json();
  },

  refundPayment: async (id, refundAmount, adminNote = "") => {
    const response = await fetch(`${BASE_URL}/payments/${id}/refund`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ refundAmount, adminNote }),
    });
    return response.json();
  },

  // ================= MANAGE COMMISSION =================
  getCommissions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/commissions?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getCommissionSummary: async () => {
    const response = await fetch(`${BASE_URL}/commissions/summary`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  updateCommissionRate: async (commissionRate) => {
    const response = await fetch(`${BASE_URL}/commission-rate`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ commissionRate }),
    });
    return response.json();
  },

  // ================= RESOLVE DISPUTES =================
  getDisputes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/disputes?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getDisputeById: async (id) => {
    const response = await fetch(`${BASE_URL}/disputes/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  investigateDispute: async (id) => {
    const response = await fetch(`${BASE_URL}/disputes/${id}/investigate`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return response.json();
  },

  resolveDispute: async (id, data) => {
    const response = await fetch(`${BASE_URL}/disputes/${id}/resolve`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data), // { resolutionType, refundAmount, releaseAmount, resolutionNote }
    });
    return response.json();
  },

  rejectDispute: async (id, resolutionNote) => {
    const response = await fetch(`${BASE_URL}/disputes/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ resolutionNote }),
    });
    return response.json();
  },

  // ================= MANAGE REPORTS =================
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/reports?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getReportById: async (id) => {
    const response = await fetch(`${BASE_URL}/reports/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  resolveReport: async (id, resolution, blockUser = false) => {
    const response = await fetch(`${BASE_URL}/reports/${id}/resolve`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ resolution, blockUser }),
    });
    return response.json();
  },

  rejectReport: async (id, resolution = "") => {
    const response = await fetch(`${BASE_URL}/reports/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ resolution }),
    });
    return response.json();
  },

  // ================= MODERATE CHAT =================
  getChatMessages: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/chat-messages?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  hideChatMessage: async (id) => {
    const response = await fetch(`${BASE_URL}/chat-messages/${id}/hide`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return response.json();
  },

  unhideChatMessage: async (id) => {
    const response = await fetch(`${BASE_URL}/chat-messages/${id}/unhide`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return response.json();
  },

  // ================= MANAGE FEATURED PACKAGES =================
  getFeaturedPackages: async () => {
    const response = await fetch(`${BASE_URL}/featured-packages`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  createFeaturedPackage: async (data) => {
    const response = await fetch(`${BASE_URL}/featured-packages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateFeaturedPackage: async (id, data) => {
    const response = await fetch(`${BASE_URL}/featured-packages/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteFeaturedPackage: async (id) => {
    const response = await fetch(`${BASE_URL}/featured-packages/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return response.json();
  },

  // ================= SEND NOTIFICATIONS =================
  sendSystemNotification: async (data) => {
    const response = await fetch(`${BASE_URL}/notifications/send`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data), // { recipientType, recipientId, title, message }
    });
    return response.json();
  },

  // ================= MANAGE WITHDRAW REQUESTS =================
  getWithdrawRequests: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/withdraw-requests?${query}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getWithdrawRequestById: async (id) => {
    const response = await fetch(`${BASE_URL}/withdraw-requests/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  approveWithdrawRequest: async (id, adminNote = "") => {
    const response = await fetch(`${BASE_URL}/withdraw-requests/${id}/approve`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ adminNote }),
    });
    return response.json();
  },

  rejectWithdrawRequest: async (id, adminNote) => {
    const response = await fetch(`${BASE_URL}/withdraw-requests/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ adminNote }),
    });
    return response.json();
  },

  markPaidWithdrawRequest: async (id, adminNote = "") => {
    const response = await fetch(`${BASE_URL}/withdraw-requests/${id}/mark-paid`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ adminNote }),
    });
    return response.json();
  },
};
