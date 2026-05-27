import { useEffect } from "react";
import { googleAuthService } from "../services/googleAuthService";

export default function GoogleSuccess() {
  useEffect(() => {
    const { token, userId, error } =
      googleAuthService.getGoogleAuthResult();

    if (error) {
      console.log("Google login failed:", error);
      return;
    }

    if (token) {
      // lưu token
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      // clear URL cho sạch
      googleAuthService.clearUrl();

      // redirect về home
      window.location.href = "/";
    }
  }, []);

  return <div>Đang đăng nhập bằng Google...</div>;
}