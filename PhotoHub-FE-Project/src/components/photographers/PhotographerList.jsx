// src/components/photographers/PhotographerList.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PhotographerCard from "./PhotographerCard";
import PhotographerListItem from "./PhotographerListItem";
import PhotographerFilters from "./PhotographerFilters";
import usePhotographers from "../../hooks/usePhotographers";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PhotographerDrawer from "./PhotographerDrawer";


export default function PhotographerList({ language = "en" }) {
  const {
    photographers,
    loading,
    error,
    pagination,
    listPhotographers,
    searchPhotographers,
    getStyles,
    getCategories,
    getLocations,
  } = usePhotographers();

  const [viewType, setViewType] = useState("grid");
  const [availableStyles, setAvailableStyles] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    search: "",
    location: "",
    styles: [],
    categories: [],
    minRating: 0,
    maxPrice: 1000,
    minExperience: 0,
    sortBy: "relevance",
    page: 1,
    limit: 12,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState(null);
  const navigate = useNavigate();


  const labels = {
    en: {
      title: "Our Photographers",
      subtitle: "Discover elite creators capturing timeless visual stories",
      noResults: "No creators found matching this criteria",
      showing: "Showing",
      of: "of",
      results: "results",
      prev: "Previous",
      next: "Next",
    },
    vi: {
      title: "Hội Biểu Diễn Thị Giác",
      subtitle: "Khám phá những nhiếp ảnh gia hàng đầu định hình phong cách của bạn",
      noResults: "Không tìm thấy nhiếp ảnh gia nào",
      showing: "Hiển thị",
      of: "trong",
      results: "kết quả",
      prev: "Trước",
      next: "Tiếp",
    },
  };
  const t = labels[language] || labels.en;

  // Load styles & locations một lần khi mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const [styles, categories, locations] = await Promise.all([getStyles(), getCategories(), getLocations()]);
      setAvailableStyles(styles);
      setAvailableCategories(categories);
      setAvailableLocations(locations);
    };
    loadFilterOptions();
  }, [getStyles, getCategories, getLocations]);

  // Gọi API mỗi khi filter thay đổi
  useEffect(() => {
    const hasFilter =
      currentFilters.search ||
      currentFilters.location ||
      currentFilters.styles.length > 0 ||
      currentFilters.categories.length > 0 ||
      currentFilters.minRating > 0 ||
      currentFilters.maxPrice < 1000 ||
      currentFilters.minExperience > 0;

    if (hasFilter) {
      searchPhotographers(currentFilters);
    } else {
      listPhotographers({
        page: currentFilters.page,
        limit: currentFilters.limit,
        sortBy: currentFilters.sortBy,
      });
    }
  }, [currentFilters, searchPhotographers, listPhotographers]);

  // Nhận filter thay đổi từ PhotographerFilters
  const handleFilterChange = useCallback((newFilters) => {
    setCurrentFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  }, []);

  // Chuyển trang
  const handlePageChange = (newPage) => {
    setCurrentFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewClick = useCallback((photographer) => {
    setSelectedPhotographerId(photographer._id);
    setDrawerOpen(true);
  }, []);

  const handleRequireLogin = useCallback(() => {
    const confirmLogin = window.confirm(
      "Bạn cần đăng nhập để thêm vào danh sách yêu thích.\nNhấn OK để đến trang đăng nhập."
    );
    if (confirmLogin) navigate("/login");
  }, [navigate]);


  // ✅ QUAN TRỌNG: Luôn render toàn bộ layout, KHÔNG return sớm
  // PhotographerFilters phải luôn được mount để tránh infinite loop
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 text-slate-900 dark:text-zinc-100 relative transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-8">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
          {t.title}
        </h2>
        <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium tracking-wide">
          {t.subtitle}
        </p>
      </div>

      {/* ✅ Filter Panel — luôn render, không bao giờ bị unmount */}
      <div className="relative z-10 mb-8">
        <PhotographerFilters
          onFilterChange={handleFilterChange}
          onViewChange={setViewType}
          styles={availableStyles}
          categories={availableCategories}
          locations={availableLocations}
          language={language}
        />
      </div>

      {/* Result count */}
      {!loading && pagination?.total > 0 && (
        <div className="relative z-10 mb-4 text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t.showing} {photographers.length} {t.of} {pagination.total} {t.results}
        </div>
      )}

      {/* ✅ Chỉ phần NÀY mới hiện skeleton — KHÔNG return sớm toàn bộ component */}
      <div className="relative z-10">
        {loading ? (
          /* Skeleton chỉ cho grid */
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-[430px] rounded-3xl bg-slate-100 dark:bg-zinc-900 animate-pulse border border-slate-200/50 dark:border-zinc-800/50"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 rounded-3xl border border-red-500/10 bg-red-500/5 backdrop-blur-md">
            <p className="font-semibold text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : photographers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-sm font-semibold text-slate-400 dark:text-zinc-500 tracking-wider uppercase">
              {t.noResults}
            </p>
          </div>
        ) : viewType === "grid" ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photographers.map((p) => {
              // Thêm log này để thấy chính xác phần tử nào bị lỗi
              if (typeof p !== 'object') {
                console.error("Phần tử không phải object:", p);
              }

              return (
                <PhotographerCard
                  key={p._id}
                  photographer={p}
                  language={language}
                  onViewClick={handleViewClick}
                  onRequireLogin={handleRequireLogin}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {photographers.map((p) => (
              <PhotographerListItem key={p._id} photographer={p} language={language} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination?.totalPages > 1 && (
        <div className="relative z-10 mt-12 flex items-center justify-center gap-3">
          <button
            onClick={() => handlePageChange(currentFilters.page - 1)}
            disabled={currentFilters.page <= 1}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
            {t.prev}
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - currentFilters.page) <= 1
              )
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-slate-400 dark:text-zinc-500">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`h-9 w-9 rounded-xl text-sm font-bold transition-all ${p === currentFilters.page
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                      : "border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                      }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            onClick={() => handlePageChange(currentFilters.page + 1)}
            disabled={currentFilters.page >= pagination.totalPages}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {t.next}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {/* Drawer */}
      <PhotographerDrawer
        photographerId={selectedPhotographerId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        language={language}
      />

    </div>
  );
}