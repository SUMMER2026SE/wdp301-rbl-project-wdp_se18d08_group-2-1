import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PhotographerCard from "./PhotographerCard";
import usePhotographers from "../../hooks/usePhotographers";
import PhotographerDrawer from "./PhotographerDrawer";
import { ArrowRight, Star, Sparkles } from "lucide-react";

/**
 * TopPhotographerSection — chỉ hiển thị top N nhiếp ảnh gia đánh giá cao nhất
 * Dùng trên Landing page, KHÔNG có thanh search/filter
 */
export default function TopPhotographerSection({ language = "en", limit = 6 }) {
  const { photographers, loading, getTopPhotographers } = usePhotographers();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  const t = {
    en: {
      eyebrow: "Top Rated Creators",
      title: "Meet Our Best Photographers",
      subtitle: "Handpicked by rating, experience and verified bookings",
      viewAll: "View All Photographers",
      loading: "Loading...",
    },
    vi: {
      eyebrow: "Nhiếp ảnh gia tiêu biểu",
      title: "Những nhiếp ảnh gia xuất sắc nhất",
      subtitle: "Được chọn lọc theo đánh giá, kinh nghiệm và lịch sử đặt lịch xác thực",
      viewAll: "Xem tất cả nhiếp ảnh gia",
      loading: "Đang tải...",
    },
  }[language] || {};

  useEffect(() => {
    getTopPhotographers(limit);
  }, [getTopPhotographers, limit]);

  const handleViewClick = useCallback((photographer) => {
    setSelectedId(photographer._id);
    setDrawerOpen(true);
  }, []);

  const handleRequireLogin = useCallback(() => {
    const ok = window.confirm(
      "Bạn cần đăng nhập để thêm vào danh sách yêu thích.\nNhấn OK để đến trang đăng nhập."
    );
    if (ok) navigate("/login");
  }, [navigate]);

  return (
    <section className="relative bg-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            {t.eyebrow}
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-400">
            {t.subtitle}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {photographers.slice(0, limit).map((p) => (
              <PhotographerCard
                key={p._id}
                photographer={p}
                language={language}
                onViewClick={handleViewClick}
                onRequireLogin={handleRequireLogin}
              />
            ))}
          </div>
        )}

        {/* CTA — chuyển sang trang đầy đủ */}
        <div className="mt-14 flex justify-center">
          <Link
            to="/photographers"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-white/[0.09] hover:-translate-y-0.5"
          >
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" strokeWidth={1.5} />
            {t.viewAll}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Drawer */}
      <PhotographerDrawer
        photographerId={selectedId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        language={language}
      />
    </section>
  );
}
