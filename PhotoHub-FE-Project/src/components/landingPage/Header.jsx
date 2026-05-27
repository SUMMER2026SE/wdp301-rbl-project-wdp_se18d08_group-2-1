import { Camera, Menu, Moon, ShieldCheck, Sun, X, User, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Sẽ dùng Link cho Login

const iconProps = { strokeWidth: 1.5 };

const copy = {
  en: {
    navItems: [
      { label: "Ecosystem", href: "/#ecosystem" },
      { label: "Escrow", href: "/#security" },
      { label: "Workflow", href: "/#workflow" },
      { label: "Pricing", href: "/#pricing" },
    ],
    cta: "Login",
    languageLabel: "Chuyển sang tiếng Việt",
    themeLabel: {
      dark: "Light mode",
      light: "Dark mode",
    },
  },
  vi: {
    navItems: [
      { label: "Hệ sinh thái", href: "/#ecosystem" },
      { label: "Ký quỹ", href: "/#security" },
      { label: "Quy trình", href: "/#workflow" },
      { label: "Chi phí", href: "/#pricing" },
    ],
    cta: "Đăng nhập",
    languageLabel: "Switch to English",
    themeLabel: {
      dark: "Giao diện sáng",
      light: "Giao diện tối",
    },
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
    // Hàm lấy user từ localStorage
    const checkUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    // Chạy lần đầu khi mount
    checkUser();

    // Lắng nghe sự kiện khi AuthPage thay đổi dữ liệu
    window.addEventListener("storage_user_changed", checkUser);

    // (Tùy chọn) Lắng nghe nếu thay đổi từ tab khác
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

  const shellClass = scrolled
    ? "border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
    : "border-white/5 bg-slate-950/25";

  return (
    <header className="fixed inset-x-0 top-0 z-[100] px-4 py-4 sm:px-6 lg:px-8">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border px-4 py-3 backdrop-blur-md transition-all duration-500 sm:px-5 ${shellClass}`}
      >
        <BrandMark />

        <nav className="hidden items-center gap-1 lg:flex">
          {t.navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </a>
          ))}
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

          {/* ================= THAY ĐỔI Ở ĐÂY (DESKTOP) ================= */}
          {user ? (
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* AVATAR */}
              <div className="flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3 py-2 backdrop-blur-md">                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-white font-semibold">
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>

                <div className="text-left">
                  {/* Sửa text-slate-500 thành text-slate-400 (light) và dark:text-slate-400 */}
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Hello,
                  </p>

                  {/* Sửa text-slate-900 thành text-slate-200 (light) và dark:text-slate-100 */}
                  <p className="max-w-[120px] truncate text-sm font-semibold text-slate-200 dark:text-slate-100">
                    {user.fullName}
                  </p>
                </div>
              </div>

              {/* DROPDOWN */}
              {showDropdown && (
                <div className="absolute right-0 top-full z-50 pt-2">
                  <div className="w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>

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
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-400 transition hover:bg-red-500/10"
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
              className="hidden sm:inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black border border-white/20
             hover:bg-white hover:text-black transition-none"
            >
              {t.cta}
            </Link>
          )}
          {/* ========================================================== */}

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

      {showMobileNav && (
        <div className="mx-auto mt-3 max-w-7xl rounded-3xl border border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl lg:hidden">
          {t.navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setShowMobileNav(false)}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
              <ShieldCheck className="h-4 w-4 text-cyan-200" {...iconProps} />
            </a>
          ))}

          {/* === THÊM NÚT LOGIN TRÊN MOBILE (Vì mặc định ban đầu bị ẩn trên mobile) === */}
          {user ? (
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
              }}
              className="mt-2 flex w-full items-center justify-between rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-500 dark:text-red-400"
            >
              Logout
              <LogOut className="h-4 w-4" />
            </button>
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