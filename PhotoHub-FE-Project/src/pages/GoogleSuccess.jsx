import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthService } from "../services/googleAuthService";

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogin = async () => {
      const { token, error } = googleAuthService.getGoogleAuthResult();

      if (error || !token) {
        navigate("/auth");
        return;
      }

      localStorage.setItem("token", token);

      // 🔥 lấy full user từ backend
      const user = await googleAuthService.fetchGoogleUser(token);

      localStorage.setItem("user", JSON.stringify(user));

      window.dispatchEvent(new Event("storage_user_changed"));

      googleAuthService.clearUrl();

      if (user && user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    };

    handleLogin();
  }, []);

  return <div>Logging in with Google...</div>;
}