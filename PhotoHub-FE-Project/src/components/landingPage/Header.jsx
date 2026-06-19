import { Camera, Menu, Moon, ShieldCheck, Sun, X, User, LogOut, Settings, Briefcase, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


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
    languageLabel: "Chuy\u1ec3n sang ti\u1ebfng Vi\u1ec7t",
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
      { label: "V\u1ec1 PhotoHub", href: "/#ecosystem" },
      { label: "Nhi\u1ebfp \u1ea2nh Gia", href: "/photographers", isRoute: true },
      { label: "\u0110\u1eb7t L\u1ecbch", href: "/#workflow" },
      { label: "Di\u1ec5n \u0110\u00e0n", href: "/community", isRoute: true },
    ],
    cta: "\u0110\u0103ng nh\u1eadp",
    languageLabel: "Switch to English",
    themeLabel: {
      dark: "Giao di\u1ec7n s\u00e1ng",
      light: "Giao di\u1ec7n t\u1ed1i",
    },
    profileLabel: "H\u1ed3 s\u01a1 c\u00e1 nh\u00e2n",
    dashboardLabel: "Kh\u00f4ng gian Nhi\u1ebfp \u1ea3nh",
    favoritesLabel: "Nhi\u1ebfp \u1ea3nh gia y\u00eau th\u00edch",
  },
};
function BrandMark() {
  return (
    <Link to="/" className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.16)] backdrop-blur-md transition-all duration-500 group-hover:border-cyan-200/40">
        <Camera className="h-5 w-5" {...iconProps} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        PhotoHub
      </span>
    </Link>
  );
}

export default function Header({ language, theme, onToggleLanguage, onToggleTheme }) {
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

  const shellClass = scrolled
    ? "border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
    : "border-white/5 bg-slate-950/25";

  const avatarUrl = user?.avatar
    ? `${BASE_URL}${user.avatar}`
    : null;

  return (
    <header className="fixed inset-x-0 top-0 z-[100] px-4 py-4 sm:px-6 lg:px-8">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border px-4 py-3 backdrop-blur-md transition-all duration-500 sm:px-5 ${shellClass}`}
      >
        <BrandMark />

        <nav className="hidden items-center gap-1 lg:flex">
          {t.navItems.map((item) =>
            item.isRoute ? (
              <Link
                key={item.label}
                to={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:border-cyan-200/40 hover:bg-white/[0.09]"
            aria-label={t.languageLabel}
            title={t.languageLabel}
          >
            {language === "en" ? "VI" : "EN"}
          </button>

          <button
            onClick={onToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-all duration-300 hover:border-cyan-200/40 hover:bg-white/[0.09]"
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
              <div className="h-10 w-10 overflow-hidden rounded-full bg-cyan-500">
                {user?.avatar ? (
                  <img
                    src={avatarUrl}
                    alt={user.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white font-semibold">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              {/* DROPDOWN MENU */}
              {showDropdown && (
                <div className="absolute right-0 top-full z-50 pt-2">
                  <div className="w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                    {/* Đường dẫn linh hoạt dựa trên Role */}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white border-b border-slate-100 dark:border-white/5"
                      >
                        <ShieldCheck className="h-4 w-4 text-cyan-400" />
                        Admin Space
                      </Link>
                    )}

                    <Link
                      to={profileTargetRoute}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      {isPhotographer ? <Briefcase className="h-4 w-4 text-cyan-400" /> : <User className="h-4 w-4" />}
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
            item.isRoute ? (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setShowMobileNav(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
                <ShieldCheck className="h-4 w-4 text-cyan-200" {...iconProps} />
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setShowMobileNav(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
                <ShieldCheck className="h-4 w-4 text-cyan-200" {...iconProps} />
              </a>
            )
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
                  {isPhotographer ? <Briefcase className="h-4 w-4 text-cyan-400" /> : <User className="h-4 w-4" />}
                  {isPhotographer ? t.dashboardLabel : t.profileLabel}
                </span>
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
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
              className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-100"
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


