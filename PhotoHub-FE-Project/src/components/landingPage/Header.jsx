import { Camera, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const iconProps = { strokeWidth: 1.5 };

const copy = {
  en: {
    navItems: [
      { label: "Ecosystem", href: "/#ecosystem" },
      { label: "Escrow", href: "/#security" },
      { label: "Workflow", href: "/#workflow" },
      { label: "Pricing", href: "/#pricing" },
    ],
    cta: "Secure a shoot",
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
    cta: "Bảo vệ buổi chụp",
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

          <a
            href="/#security"
            className="hidden rounded-full border border-white/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] sm:inline-flex"
          >
            {t.cta}
          </a>

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
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
              <ShieldCheck className="h-4 w-4 text-cyan-200" {...iconProps} />
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
