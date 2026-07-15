import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
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
import PaymentResult from "./booking/PaymentResult";
import ChatPage from "./pages/ChatPage";
import AiSearchPage from "./pages/AiSearchPage";
import CommunityPage from "./pages/CommunityPage";
import BookingPage from "./pages/BookingPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

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
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";

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
  const isHomePage = location.pathname === "/";
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem("photohub-theme", theme);
    // Toggle Tailwind dark class
    const root = document.documentElement;
    const isDark = theme === "dark" || location.pathname.startsWith("/admin");
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Keep data-theme for custom CSS
    root.dataset.theme = location.pathname.startsWith("/admin") ? "dark" : theme;
  }, [theme, location.pathname]);

  useEffect(() => {
    localStorage.setItem("photohub-language", language);
    document.documentElement.lang = language === "vi" ? "vi" : "en";
  }, [language]);

  // Scroll to top or target hash on route changes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Wait a brief moment for DOM to finish rendering
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.search, location.hash]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const toggleLanguage = () => {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "vi" : "en"));
  };

  return (
    <div className={`theme-${isAdminRoute ? "dark" : theme} relative flex min-h-screen w-full flex-col overflow-x-hidden`}>
      {/* Show global header except admin routes */}
      {!isAdminRoute && (
        <Header
          language={language}
          theme={theme}
          onToggleLanguage={toggleLanguage}
          onToggleTheme={toggleTheme}
        />
      )}

      <Routes>
        <Route path="/" element={<Home language={language} theme={theme} />} />
        <Route path="/photographers/:id" element={<PhotographerProfile language={language} />} />
        <Route path="/booking" element={<BookingPage language={language} theme={theme} />} />
        <Route path="/booking/:photographerId" element={<BookingPage language={language} theme={theme} />} />
        <Route path="/subscriptions" element={<SubscriptionPage language={language} theme={theme} />} />

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
          path="/forgot-password"
          element={
            <ForgotPasswordPage
              language={language}
              theme={theme}
              onToggleLanguage={toggleLanguage}
              onToggleTheme={toggleTheme}
            />
          }
        />
        <Route
          path="/verify-otp"
          element={
            <VerifyOtpPage
              language={language}
              theme={theme}
            />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPasswordPage
              language={language}
              theme={theme}
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

        <Route
          path="/chat"
          element={
            <ChatPage
              language={language}
              theme={theme}
            />
          }
        />

        <Route path="/auth/google/success" element={<GoogleSuccess />} />
        <Route path="/chat" element={<ChatPage language={language} theme={theme} />} />
        <Route path="/payment-result" element={<PaymentResult language={language} theme={theme} />} />
        <Route path="/payment/result" element={<PaymentResult language={language} theme={theme} />} />
        <Route
          path="/payment/result"
          element={
            <PaymentResult
              language={language}
              theme={theme}
            />
          }
        />
        <Route
          path="/payment-result"
          element={
            <PaymentResult
              language={language}
              theme={theme}
            />
          }
        />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="finance" element={<AdminFinance />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="reports-chats" element={<AdminReportsChats />} />
          <Route path="settings-packages" element={<AdminSettingsPackages />} />
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

        <Route
          path="/community"
          element={
            <CommunityPage
              language={language}
              theme={theme}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Hide footer on login and admin routes */}
      {!isAuthPage && !isAdminRoute && <Footer language={language} />}

      {/* Scroll to Top button for Home Page */}
      {isHomePage && showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[99] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 hover:brightness-110 active:scale-95 animate-fadeIn"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} className="stroke-[3px]" />
        </button>
      )}
    </div>
  );
}
