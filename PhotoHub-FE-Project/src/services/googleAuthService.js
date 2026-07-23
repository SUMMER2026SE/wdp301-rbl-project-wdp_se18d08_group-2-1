import axios from "axios";

const BASE_URL = "https://photo-hub-be-project.vercel.app/api/auth";

export const googleAuthService = {
  loginWithGoogle() {
    window.location.href = `${BASE_URL}/google`;
  },

  getGoogleAuthResult() {
    const params = new URLSearchParams(window.location.search);

    return {
      token: params.get("token"),
      userId: params.get("userId"),
      error: params.get("error"),
    };
  },

  clearUrl() {
    window.history.replaceState({}, document.title, window.location.pathname);
  },

  async fetchGoogleUser(token) {
    const res = await axios.get(`${BASE_URL}/google/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data.data.user;
  },
};