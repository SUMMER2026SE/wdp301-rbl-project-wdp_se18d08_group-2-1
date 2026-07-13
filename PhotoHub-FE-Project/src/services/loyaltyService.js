const BASE_URL = "http://localhost:3000/api/loyalty";

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
};
