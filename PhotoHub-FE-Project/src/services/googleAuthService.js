const BASE_URL = "http://localhost:3000/api/auth";

export const googleAuthService = {
  // mở Google login (redirect backend)
  loginWithGoogle() {
    window.location.href = `${BASE_URL}/google`;
  },

  // lấy token từ URL sau khi redirect về
  getGoogleAuthResult() {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const userId = params.get("userId");
    const error = params.get("error");

    return { token, userId, error };
  },

  // clear URL sau khi lấy token
  clearUrl() {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};