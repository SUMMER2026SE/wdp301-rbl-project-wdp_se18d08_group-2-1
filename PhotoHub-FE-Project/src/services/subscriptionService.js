import axios from "axios";
import { getJsonAuthConfig, normalizeAuthError } from "./apiAuth";

const API_BASE = "http://localhost:3000/api/subscriptions";

export const subscriptionService = {
  getPackages: async () => {
    const res = await axios.get(`${API_BASE}/packages`);
    return res.data;
  },

  getMySubscriptions: async () => {
    try {
      const res = await axios.get(`${API_BASE}/my`, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  getSubscriptionById: async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/${id}`, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  updatePreferredSchedule: async (id, preferredSchedule = []) => {
    try {
      const res = await axios.post(`${API_BASE}/${id}/preferred-schedule`, { preferredSchedule }, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  createSubscription: async (payload) => {
    try {
      const res = await axios.post(`${API_BASE}/purchase`, payload, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  pauseSubscription: async (id, pauseDays = 30) => {
    try {
      const res = await axios.post(`${API_BASE}/${id}/pause`, { pauseDays }, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  resumeSubscription: async (id) => {
    try {
      const res = await axios.post(`${API_BASE}/${id}/resume`, {}, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  cancelSubscription: async (id, reason = "") => {
    try {
      const res = await axios.post(`${API_BASE}/${id}/cancel`, { reason }, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  renewSubscription: async (id, forceCharge = false) => {
    try {
      const res = await axios.post(`${API_BASE}/${id}/renew`, { forceCharge }, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  getRemainingSessions: async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/${id}/remaining-sessions`, getJsonAuthConfig());
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },

  getPaymentStatus: async (orderCode) => {
    try {
      const res = await axios.get(`${API_BASE}/payment/status`, {
        ...getJsonAuthConfig(),
        params: { orderCode },
      });
      return res.data;
    } catch (error) {
      normalizeAuthError(error);
    }
  },
};
