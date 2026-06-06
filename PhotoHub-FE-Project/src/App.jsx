import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "./components/landingPage/Footer";
import Header from "./components/landingPage/Header";
import Home from "./pages/Home";
import PhotographerProfile from "./components/photographers/PhotographerProfile";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import GoogleSuccess from "./pages/GoogleSuccess";
import PhotographerDashboard from "./pages/PhotographerDashboard";

function getInitialTheme() {
  const storedTheme = localStorage.getItem("photohub-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getInitialLanguage() {
  const storedLanguage = localStorage.getItem("photohub-language");
  return storedLanguage === "vi" ? "vi" : "en";
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [language, setLanguage] = useState(getInitialLanguage);

  const location = useLocation();
  const isAuthPage = location.pathname === "/login";

  useEffect(() => {
    localStorage.setItem("photohub-theme", theme);

    // Đổi đoạn này để Tailwind nhận diện được class "dark"
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Bạn vẫn có thể giữ dòng này nếu có CSS custom chạy bằng data-theme
    root.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("photohub-language", language);
    document.documentElement.lang = language === "vi" ? "vi" : "en";
  }, [language]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const toggleLanguage = () => {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "vi" : "en"));
  };

  return (
    <div className={`theme-${theme} relative flex min-h-screen w-full flex-col overflow-x-hidden`}>
      {/* Đã gỡ bỏ !isAuthPage -> Header tổng sẽ hiển thị ở toàn bộ các trang, kể cả /login */}
      <Header
        language={language}
        theme={theme}
        onToggleLanguage={toggleLanguage}
        onToggleTheme={toggleTheme}
      />

      <Routes>
        <Route path="/" element={<Home language={language} />} />
        <Route path="/photographers/:id" element={<PhotographerProfile language={language} />} />

        <Route
          path="/login"
          element={
            <AuthPage
              language={language}
              theme={theme}
              onToggleLanguage={toggleLanguage}
              onToggleTheme={toggleTheme}
            />
          }
        />

        <Route
          path="/profile"
          element={
            <ProfilePage
              language={language}
              theme={theme}
              onToggleLanguage={toggleLanguage}
              onToggleTheme={toggleTheme}
            />
          }
        />

        <Route
          path="/photographerProfile"
          element={
            <PhotographerDashboard
              language={language}
              theme={theme}
              onToggleLanguage={toggleLanguage}
              onToggleTheme={toggleTheme}
            />
          }
        />

        <Route path="/auth/google/success" element={<GoogleSuccess />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Giữ nguyên ẩn footer ở trang login để giao diện gọn gàng hơn */}
      {!isAuthPage && <Footer language={language} />}
    </div>
  );
}