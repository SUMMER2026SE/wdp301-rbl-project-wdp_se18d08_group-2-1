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
import FavoritesPage from "./pages/FavoritesPage";
import PhotographersPage from "./pages/PhotographersPage";
import AiSearchPage from "./pages/AiSearchPage";

// Admin Imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminReportsChats from "./pages/admin/AdminReportsChats";
import AdminSettingsPackages from "./pages/admin/AdminSettingsPackages";
import AdminRiskDashboard from "./pages/admin/AdminRiskDashboard";
import AdminWithdrawalManagement from "./pages/admin/AdminWithdrawalManagement";
import AdminMarketplaceInsights from "./pages/admin/AdminMarketplaceInsights";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminPhotographerAudit from "./pages/admin/AdminPhotographerAudit";
import AdminCustomerBehavior from "./pages/admin/AdminCustomerBehavior";
import AdminCampaignManager from "./pages/admin/AdminCampaignManager";
import AdminRevenueForecast from "./pages/admin/AdminRevenueForecast";

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
  const isAdminRoute = location.pathname.startsWith("/admin");

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
      {!isAdminRoute && (
        <Header
          language={language}
          theme={theme}
          onToggleLanguage={toggleLanguage}
          onToggleTheme={toggleTheme}
        />
      )}

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

        <Route
          path="/photographers"
          element={
            <PhotographersPage
              language={language}
              theme={theme}
            />
          }
        />

        <Route path="/auth/google/success" element={<GoogleSuccess />} />

        {/* Phân hệ Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="finance" element={<AdminFinance />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="reports-chats" element={<AdminReportsChats />} />
          <Route path="settings-packages" element={<AdminSettingsPackages />} />
          <Route path="risk-dashboard" element={<AdminRiskDashboard />} />
          <Route path="withdrawals" element={<AdminWithdrawalManagement />} />
          <Route path="marketplace-insights" element={<AdminMarketplaceInsights />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="photographer-performance" element={<AdminPhotographerAudit />} />
          <Route path="customer-behavior" element={<AdminCustomerBehavior />} />
          <Route path="campaigns" element={<AdminCampaignManager />} />
          <Route path="revenue-forecast" element={<AdminRevenueForecast />} />
        </Route>
        <Route
          path="/favorites"
          element={
            <FavoritesPage
              language={language}
              theme={theme}
            />
          }
        />

        <Route
          path="/ai-search"
          element={
            <AiSearchPage
              language={language}
              theme={theme}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Giữ nguyên ẩn footer ở trang login để giao diện gọn gàng hơn và không hiển thị ở admin */}
      {!isAuthPage && !isAdminRoute && <Footer language={language} />}
    </div>
  );
}