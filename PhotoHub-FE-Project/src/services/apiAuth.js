export const getStoredToken = () => {
  const candidates = [
    localStorage.getItem("token"),
    localStorage.getItem("accessToken"),
  ];

  const token = candidates
    .map((value) => String(value || "").trim())
    .find((value) => value && value !== "undefined" && value !== "null" && value.split(".").length === 3);

  return token || "";
};

export const getJsonAuthConfig = () => {
  const token = getStoredToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const getAuthConfig = () => {
  const token = getStoredToken();
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const clearInvalidSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.dispatchEvent(new Event("storage_user_changed"));
};

export const normalizeAuthError = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || "";
  if (status === 401 || /invalid token|unauthorized/i.test(message)) {
    clearInvalidSession();
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    const loginError = new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    loginError.redirectTo = `/login?redirect=${next}`;
    throw loginError;
  }
  throw error;
};
