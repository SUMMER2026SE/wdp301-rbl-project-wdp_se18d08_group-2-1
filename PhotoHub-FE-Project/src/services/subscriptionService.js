import axios from "axios";

const API_BASE = "http://localhost:3000/api/subscriptions";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

export const subscriptionService = {
  getPackages: async () => {
    const res = await axios.get(`${API_BASE}/packages`);
    return res.data;
  },

  getMySubscriptions: async () => {
    const res = await axios.get(`${API_BASE}/my`, getAuthHeaders());
    return res.data;
  },

  getSubscriptionById: async (id) => {
    const res = await axios.get(`${API_BASE}/${id}`, getAuthHeaders());
    return res.data;
  },

  createSubscription: async (payload) => {
    const res = await axios.post(`${API_BASE}/purchase`, payload, getAuthHeaders());
    return res.data;
  },

  pauseSubscription: async (id, pauseDays = 30) => {
    const res = await axios.post(`${API_BASE}/${id}/pause`, { pauseDays }, getAuthHeaders());
    return res.data;
  },

  resumeSubscription: async (id) => {
    const res = await axios.post(`${API_BASE}/${id}/resume`, {}, getAuthHeaders());
    return res.data;
  },

  cancelSubscription: async (id, reason = "") => {
    const res = await axios.post(`${API_BASE}/${id}/cancel`, { reason }, getAuthHeaders());
    return res.data;
  },

  renewSubscription: async (id, forceCharge = false) => {
    const res = await axios.post(`${API_BASE}/${id}/renew`, { forceCharge }, getAuthHeaders());
    return res.data;
  },

  getRemainingSessions: async (id) => {
    const res = await axios.get(`${API_BASE}/${id}/remaining-sessions`, getAuthHeaders());
    return res.data;
  },

  getPaymentStatus: async (orderCode) => {
    const res = await axios.get(`${API_BASE}/payment/status`, {
      ...getAuthHeaders(),
      params: { orderCode },
    });
    return res.data;
  },
};
