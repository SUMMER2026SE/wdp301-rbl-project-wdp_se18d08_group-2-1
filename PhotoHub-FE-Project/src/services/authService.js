const BASE_URL = "http://localhost:3000/api/auth";

export const authService = {
  // REGISTER
  register: async (data) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  // VERIFY EMAIL
  verifyEmail: async (data) => {
    const response = await fetch(`${BASE_URL}/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  // RESEND OTP
  resendVerifyEmail: async (email) => {
    const response = await fetch(`${BASE_URL}/resend-verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    return response.json();
  },

  // LOGIN
  login: async (data) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  // FORGOT PASSWORD
  forgotPassword: async (email) => {
    const response = await fetch(`${BASE_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    return response.json();
  },

  // RESET PASSWORD
  resetPassword: async (data) => {
    const response = await fetch(`${BASE_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },
};