const BASE_URL = "https://photo-hub-be-project.vercel.app/api/loyalty";

export const loyaltyService = {
  getLoyaltyAccount: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/my-account`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getLoyaltyHistory: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/my-history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getLoyaltyRewards: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/my-rewards`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  redeemReward: async (rewardType) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rewardType }),
    });
    return response.json();
  },

  adminGetAccounts: async (page = 1, limit = 10) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admin/accounts?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  adminGetHistories: async (page = 1, limit = 20) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admin/histories?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getRewardCatalog: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/catalog`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  adminGetVouchers: async (page = 1, limit = 10, status = "all") => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admin/vouchers?page=${page}&limit=${limit}&status=${status}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  adminCreateVoucher: async (payload) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admin/vouchers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  adminUpdateVoucher: async (id, payload) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admin/vouchers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  adminDeleteVoucher: async (id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admin/vouchers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};
