import { ArrowLeft, Camera, Menu, Moon, ShieldCheck, Sun, X, User, LogOut, Settings, Briefcase, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const iconProps = { strokeWidth: 1.5 };

const copy = {
  en: {
    navItems: [
      { label: "About Us", href: "/#ecosystem" },
      { label: "Photographer", href: "/photographers", isRoute: true },
      { label: "Booking", href: "/#workflow" },
      { label: "Community", href: "/community", isRoute: true },
    ],
    cta: "Login",
    languageLabel: "Chuyển sang tiếng Việt",
    themeLabel: {
      dark: "Light mode",
      light: "Dark mode",
    },
    profileLabel: "Profile",
    dashboardLabel: "Photographer Space",
    favoritesLabel: "Favorite Photographers",
  },
  vi: {
    navItems: [
      { label: "Giới thiệu", href: "/#ecosystem" },
      { label: "Nhiếp Ảnh Gia", href: "/photographers", isRoute: true },
      { label: "Đặt Lịch", href: "/#workflow" },
      { label: "Diễn Đàn", href: "/community", isRoute: true },
    ],
    cta: "Đăng nhập",
    languageLabel: "Switch to English",
    themeLabel: {
      dark: "Giao diện sáng",
      light: "Giao diện tối",
    },
    profileLabel: "Hồ sơ cá nhân",
    dashboardLabel: "Không gian Nhiếp ảnh",
    favoritesLabel: "Nhiếp ảnh gia yêu thích",
  },
};

function BrandMark() {
  const handleClick = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <Link to="/" onClick={handleClick} className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-orange-500 dark:text-orange-200 shadow-[0_0_35px_rgba(249,115,22,0.18)] backdrop-blur-md transition-all duration-500 group-hover:border-orange-300/50">
        <Camera className="h-5 w-5" {...iconProps} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
        PhotoHub
      </span>
    </Link>
  );
}

export default function Header({ language, theme, onToggleLanguage, onToggleTheme }) {
  const location = useLocation();
  const showBackHome = location.pathname !== "/";
  const [scrolled, setScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener("storage_user_changed", checkUser);
    window.addEventListener("storage", checkUser);

    return () => {
      window.removeEventListener("storage_user_changed", checkUser);
      window.removeEventListener("storage", checkUser);
    };
  }, []);

  const t = copy[language] || copy.en;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Resolve profile route from user role
  const isPhotographer = user?.role === "photographer";
  const profileTargetRoute = isPhotographer ? "/photographerProfile" : "/profile";

  const isDark = theme === "dark";
  const shellClass = isDark
    ? scrolled
      ? "border-white/10 bg-slate-950/85 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
      : "border-white/10 bg-slate-950/75 shadow-[0_18px_60px_rgba(0,0,0,0.2)]"
    : "border-orange-100 bg-white/95 shadow-[0_18px_60px_rgba(249,115,22,0.12)]";

  return (
    <header className="fixed inset-x-0 top-0 z-[100] px-4 py-4 sm:px-6 lg:px-8">
      {showBackHome && (
        <Link
          to="/"
          className="fixed left-4 top-24 z-[90] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/10 transition-all hover:-translate-x-0.5 hover:bg-orange-500 hover:text-white dark:border-white/10 dark:bg-slate-950/90 dark:text-white dark:shadow-black/30 dark:hover:bg-orange-500"
          aria-label={language === "vi" ? "Về trang đầu" : "Back home"}
          title={language === "vi" ? "Về trang đầu" : "Back home"}
        >
          <ArrowLeft className="h-5 w-5" {...iconProps} />
        </Link>
      )}
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border px-4 py-3 backdrop-blur-md transition-all duration-500 sm:px-5 ${shellClass}`}
      >
        <BrandMark />

        <nav className="hidden items-center gap-1 lg:flex">
          {t.navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => {
                if (location.pathname + location.hash === item.href || (location.pathname === "/" && item.href === "/#ecosystem" && location.hash === "#ecosystem")) {
                  if (item.href.includes("#")) {
                    const id = item.href.split("#")[1];
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }
              }}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:border-orange-300/50 hover:bg-white/[0.09]"
            aria-label={t.languageLabel}
            title={t.languageLabel}
          >
            {language === "en" ? "VI" : "EN"}
          </button>

          <button
            onClick={onToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-all duration-300 hover:border-orange-300/50 hover:bg-white/[0.09]"
            aria-label={t.themeLabel[theme]}
            title={t.themeLabel[theme]}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" {...iconProps} />
            ) : (
              <Moon className="h-4 w-4" {...iconProps} />
            )}
          </button>

          {/* ================= DESKTOP USER DROPDOWN ================= */}
          {user ? (
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* AVATAR */}
              <div className="flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3 py-2 backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-semibold">
                  {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="text-left">
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Hello,
                  </p>
                  <p className="max-w-[120px] truncate text-sm font-semibold text-slate-200 dark:text-slate-100">
                    {user.fullName}
                  </p>
                </div>
              </div>

              {/* DROPDOWN MENU */}
              {showDropdown && (
                <div className="absolute right-0 top-full z-50 pt-2">
                  <div className="w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                    
                    {/* Dynamic route by role */}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white border-b border-slate-100 dark:border-white/5"
                      >
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        Admin Space
                      </Link>
                    )}

                    <Link
                      to={profileTargetRoute}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      {isPhotographer ? <Briefcase className="h-4 w-4 text-orange-500" /> : <User className="h-4 w-4" />}
                      {isPhotographer ? t.dashboardLabel : t.profileLabel}
                    </Link>

                    {/* Customer favorites */}
                    {!isPhotographer && (
                      <Link
                        to="/favorites"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Heart className="h-4 w-4 text-rose-400" />
                        {t.favoritesLabel}
                      </Link>
                    )}

                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        window.location.href = "/";
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black border border-white/20 hover:bg-white hover:text-black transition-none"
            >
              {t.cta}
            </Link>
          )}

          <button
            onClick={() => setShowMobileNav((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white lg:hidden"
            aria-label="Toggle navigation"
          >
            {showMobileNav ? (
              <X className="h-5 w-5" {...iconProps} />
            ) : (
              <Menu className="h-5 w-5" {...iconProps} />
            )}
          </button>
        </div>
      </div>

      {/* ================= MOBILE NAVIGATION ================= */}
      {showMobileNav && (
        <div className="mx-auto mt-3 max-w-7xl rounded-3xl border border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl lg:hidden">
          {t.navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => {
                setShowMobileNav(false);
                if (location.pathname + location.hash === item.href || (location.pathname === "/" && item.href === "/#ecosystem" && location.hash === "#ecosystem")) {
                  if (item.href.includes("#")) {
                    const id = item.href.split("#")[1];
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }
              }}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
              <ShieldCheck className="h-4 w-4 text-orange-300" {...iconProps} />
            </Link>
          ))}

          {/* Mobile user actions */}
          {user ? (
            <>
              {/* Mobile user actions */}
              <Link
                to={profileTargetRoute}
                onClick={() => setShowMobileNav(false)}
                className="mt-2 flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.08]"
              >
                <span className="flex items-center gap-2">
                  {isPhotographer ? <Briefcase className="h-4 w-4 text-orange-500" /> : <User className="h-4 w-4" />}
                  {isPhotographer ? t.dashboardLabel : t.profileLabel}
                </span>
                <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
              </Link>

              {/* Customer favorites */}
              {!isPhotographer && (
                <Link
                  to="/favorites"
                  onClick={() => setShowMobileNav(false)}
                  className="mt-1 flex items-center justify-between rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/20"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    {t.favoritesLabel}
                  </span>
                </Link>
              )}

              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
                className="mt-1 flex w-full items-center justify-between rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20"
              >
                Logout
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setShowMobileNav(false)}
              className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-orange-100"
            >
              {t.cta}
              <ShieldCheck className="h-4 w-4 text-slate-950" {...iconProps} />
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
