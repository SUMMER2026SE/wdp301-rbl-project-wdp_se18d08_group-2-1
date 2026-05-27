import {
  Camera,
  Github,
  Instagram,
  Linkedin,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const iconProps = { strokeWidth: 1.5 };

const copy = {
  en: {
    description:
      "Premium photography booking with verified creators, protected payment, and AI-guided discovery.",
    trust: "Escrow-backed creative work",
    signal: "Signal",
    signalCopy:
      "Follow product updates, creator tools, and trust infrastructure notes.",
    rights: "(c) 2026 PhotoHub. All rights reserved.",
    built: "Built for secure creative commerce.",
    columns: [
      {
        title: "Product",
        links: ["Marketplace", "AI Matching", "Escrow", "Portfolio"],
      },
      {
        title: "Company",
        links: ["About", "Trust", "Careers", "Press"],
      },
      {
        title: "Legal",
        links: ["Privacy", "Terms", "Protection", "Disputes"],
      },
    ],
  },
  vi: {
    description:
      "Nền tảng đặt nhiếp ảnh cao cấp với creator đã xác thực, thanh toán được bảo vệ và gợi ý bằng AI.",
    trust: "Công việc sáng tạo được bảo vệ bằng ký quỹ",
    signal: "Cập nhật",
    signalCopy:
      "Theo dõi cập nhật sản phẩm, công cụ cho creator và các ghi chú về hạ tầng niềm tin.",
    rights: "(c) 2026 PhotoHub. Đã bảo lưu mọi quyền.",
    built: "Xây dựng cho thương mại sáng tạo an toàn.",
    columns: [
      {
        title: "Sản phẩm",
        links: ["Marketplace", "Ghép cặp AI", "Ký quỹ", "Portfolio"],
      },
      {
        title: "Công ty",
        links: ["Giới thiệu", "Niềm tin", "Tuyển dụng", "Báo chí"],
      },
      {
        title: "Pháp lý",
        links: ["Riêng tư", "Điều khoản", "Bảo vệ", "Tranh chấp"],
      },
    ],
  },
};

export default function Footer({ language }) {
  const t = copy[language] || copy.en;

  return (
    <footer className="relative border-t border-white/10 bg-black px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1.4fr_0.8fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-100">
                <Camera className="h-5 w-5" {...iconProps} />
              </span>
              <span className="text-xl font-semibold tracking-tight text-white">
                PhotoHub
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
              {t.description}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400">
              <ShieldCheck className="h-4 w-4 text-cyan-200" {...iconProps} />
              {t.trust}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {t.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                  {column.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="/"
                        className="text-sm text-slate-500 transition-colors duration-300 hover:text-cyan-100"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              {t.signal}
            </h3>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              {t.signalCopy}
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Linkedin, Github, Mail].map((Icon, index) => (
                <a
                  key={index}
                  href="/"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-300 hover:border-cyan-200/40 hover:text-cyan-100"
                >
                  <Icon className="h-4 w-4" {...iconProps} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{t.rights}</p>
          <p>{t.built}</p>
        </div>
      </div>
    </footer>
  );
}
