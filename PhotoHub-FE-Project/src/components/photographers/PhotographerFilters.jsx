// src/components/photographers/PhotographerFilters.jsx
import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, AlignJustify, X, ChevronDown, Star } from "lucide-react";
import { createPortal } from "react-dom"; // eslint-disable-line no-unused-vars

const PhotographerFilters = ({ onFilterChange, onViewChange, styles = [], locations = [], language }) => {
  const labels = {
    en: {
      searchPlaceholder: "Search photographer name...",
      filterBtn: "Filter",
      sortBtn: "Sort",
      filterTitle: "Filters",
      clearBtn: "Clear Filters",
      applyBtn: "Apply",
      experienceLabel: "Years of Experience",
      expAll: "All", expUnder1: "Under 1 year",
      exp1to3: "1-3 years", expOver3: "Over 3 years", expOver5: "Over 5 years",
      stylesLabel: "Photography Styles",
      locationLabel: "Working Location",
      allLocations: "All Locations",
      ratingLabel: "Minimum Rating",
      ratingAll: "All",
      sortNewest: "Newest",
      sortBookings: "Bookings",
      sortLikes: "Likes",
      sortRating: "Rating",
      descending: "High to Low",
      ascending: "Low to High",
    },
    vi: {
      searchPlaceholder: "Tìm kiếm nhiếp ảnh gia...",
      filterBtn: "Bộ lọc",
      sortBtn: "Sắp xếp",
      filterTitle: "Bộ lọc",
      clearBtn: "Bỏ lọc",
      applyBtn: "Lọc",
      experienceLabel: "Số năm kinh nghiệm",
      expAll: "Tất cả", expUnder1: "Dưới 1 năm",
      exp1to3: "Từ 1-3 năm", expOver3: "Trên 3 năm", expOver5: "Trên 5 năm",
      stylesLabel: "Thể loại chụp",
      locationLabel: "Địa điểm làm việc",
      allLocations: "Tất cả địa điểm",
      ratingLabel: "Số điểm đánh giá",
      ratingAll: "Tất cả",
      sortNewest: "Mới cập nhật",
      sortBookings: "Số buổi chụp",
      sortLikes: "Số lượt yêu thích",
      sortRating: "Số điểm đánh giá",
      descending: "Giảm dần",
      ascending: "Tăng dần",
    },
  };

  const t = labels[language] || labels.vi;

  // ── State ──────────────────────────────────────────────────────────────
  const [searchValue, setSearchValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState("relevance");

  // Temp state (chỉ apply khi bấm "Lọc")
  const [tempFilters, setTempFilters] = useState({
    experienceRange: "all",
    styles: [],
    location: "",
    minRating: 0,
  });

  // Applied state (đã được gửi lên parent)
  const [appliedFilters, setAppliedFilters] = useState({
    location: "",
    styles: [],
    minRating: 0,
    minExperience: 0,
  });

  const sortRef = useRef(null);
  const [sortPos, setSortPos] = useState({ top: 0, right: 0 });


  // ── Experience mapping ─────────────────────────────────────────────────
  const experienceOptions = [
    { value: "all", label: t.expAll, minExp: 0 },
    { value: "under1", label: t.expUnder1, minExp: 0 },
    { value: "1to3", label: t.exp1to3, minExp: 1 },
    { value: "over3", label: t.expOver3, minExp: 3 },
    { value: "over5", label: t.expOver5, minExp: 5 },
  ];

  const ratingOptions = [
    { value: 0, label: t.ratingAll },
    { value: 3, label: "3+ ⭐" },
    { value: 3.5, label: "3.5+ ⭐" },
    { value: 4, label: "4+ ⭐" },
    { value: 4.5, label: "4.5+ ⭐" },
  ];

  // ── Debounce search ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        search: searchValue,
        ...appliedFilters,
        sortBy: currentSort,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Đóng sort dropdown khi click ngoài ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Đóng filter panel bằng Escape ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setFilterOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────
  const toggleStyle = (style) => {
    setTempFilters((prev) => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style],
    }));
  };

  const handleApplyFilter = () => {
    const expOption = experienceOptions.find((o) => o.value === tempFilters.experienceRange);
    const newApplied = {
      location: tempFilters.location,
      styles: tempFilters.styles,
      minRating: tempFilters.minRating,
      minExperience: expOption?.minExp || 0,
    };
    setAppliedFilters(newApplied);
    onFilterChange({ search: searchValue, ...newApplied, sortBy: currentSort });
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    const cleared = { experienceRange: "all", styles: [], location: "", minRating: 0 };
    setTempFilters(cleared);
    const newApplied = { location: "", styles: [], minRating: 0, minExperience: 0 };
    setAppliedFilters(newApplied);
    onFilterChange({ search: searchValue, ...newApplied, sortBy: currentSort });
  };

  const handleSortSelect = (sortValue) => {
    setCurrentSort(sortValue);
    setSortOpen(false);
    onFilterChange({ search: searchValue, ...appliedFilters, sortBy: sortValue });
  };

  // ── Đếm số filter đang active ─────────────────────────────────────────
  const activeCount = [
    appliedFilters.location !== "",
    appliedFilters.styles.length > 0,
    appliedFilters.minRating > 0,
    appliedFilters.minExperience > 0,
  ].filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══ TOOLBAR ═══ */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2.5 text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:focus:border-orange-500 transition-all"
          />
        </div>

        {/* Bộ lọc button */}
        <button
          onClick={() => { setFilterOpen(true); setSortOpen(false); }}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 select-none
            ${activeCount > 0
              ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-600"
            }`}
        >
          <SlidersHorizontal size={15} />
          {t.filterBtn}
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {/* Sắp xếp button */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => {
              if (!sortOpen && sortRef.current) {
                const rect = sortRef.current.getBoundingClientRect();
                setSortPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
              }
              setSortOpen(!sortOpen);
              setFilterOpen(false);
            }}

            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 select-none
              ${sortOpen
                ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-600"
              }`}
          >
            <AlignJustify size={15} />
            {t.sortBtn}
          </button>

          {/* Sort Dropdown - rendered via portal to escape transform stacking context */}
          {sortOpen && createPortal(
            <div
              style={{ position: "fixed", top: sortPos.top, right: sortPos.right, zIndex: 99999, width: "240px" }}
              className="rounded-2xl border border-slate-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-slate-200/60 dark:shadow-black/50 overflow-hidden"
            >


              {/* Mới cập nhật */}
              <button
                onClick={() => handleSortSelect("relevance")}
                className={`flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b border-slate-50 dark:border-zinc-800 transition-colors
                  ${currentSort === "relevance" ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
              >
                <AlignJustify size={14} className="opacity-60" />
                {t.sortNewest}
              </button>

              {/* Số buổi chụp */}
              <div className="border-b border-slate-50 dark:border-zinc-800">
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {t.sortBookings}
                </p>
                <button
                  onClick={() => handleSortSelect("experience")}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                    ${currentSort === "experience" ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                >
                  <span className="text-base leading-none">📷</span> {t.descending}
                </button>
                <button
                  onClick={() => handleSortSelect("bookings_asc")}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 pb-3 text-sm transition-colors
                    ${currentSort === "bookings_asc" ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                >
                  <span className="text-base leading-none">👤</span> {t.ascending}
                </button>
              </div>

              {/* Số lượt yêu thích */}
              <div className="border-b border-slate-50 dark:border-zinc-800">
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {t.sortLikes}
                </p>
                <button
                  onClick={() => handleSortSelect("likes_desc")}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                    ${currentSort === "likes_desc" ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                >
                  <span className="text-base leading-none">♡</span> {t.descending}
                </button>
                <button
                  onClick={() => handleSortSelect("likes_asc")}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 pb-3 text-sm transition-colors
                    ${currentSort === "likes_asc" ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                >
                  <span className="text-base leading-none">♡</span> {t.ascending}
                </button>
              </div>

              {/* Số điểm đánh giá */}
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {t.sortRating}
                </p>
                <button
                  onClick={() => handleSortSelect("rating")}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                    ${currentSort === "rating" ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                >
                  <Star size={13} className="opacity-60" /> {t.descending}
                </button>
                <button
                  onClick={() => handleSortSelect("price")}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 pb-3 text-sm transition-colors
                    ${currentSort === "price" ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                >
                  <Star size={13} className="opacity-60" /> {t.ascending}
                </button>
              </div>
            </div>,
             document.body
          )}
        </div>
      </div>

      {/* ═══ FILTER PANEL (right-side overlay) ═══ */}
      {filterOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={() => setFilterOpen(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 flex h-full w-full max-w-[400px] flex-col bg-white dark:bg-zinc-900 shadow-2xl"
            style={{ zIndex: 9999 }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-zinc-800 px-5 py-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">{t.filterTitle}</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

              {/* ── Số năm kinh nghiệm ── */}
              <div>
                <p className="mb-3 text-sm font-bold text-slate-800 dark:text-zinc-200">{t.experienceLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {experienceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTempFilters((prev) => ({ ...prev, experienceRange: opt.value }))}
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all ${tempFilters.experienceRange === opt.value
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-orange-300"
                        }`}
                    >
                      {tempFilters.experienceRange === opt.value && (
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Thể loại chụp (Styles từ API) ── */}
              {styles.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-800 dark:text-zinc-200">{t.stylesLabel}</p>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    {styles.map((style) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style)}
                        className="flex items-center gap-2.5 text-left group"
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${tempFilters.styles.includes(style)
                          ? "border-orange-500 bg-orange-500"
                          : "border-slate-300 dark:border-zinc-600 group-hover:border-orange-400"
                          }`}>
                          {tempFilters.styles.includes(style) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-zinc-300 select-none">{style}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Đánh giá tối thiểu ── */}
              <div>
                <p className="mb-3 text-sm font-bold text-slate-800 dark:text-zinc-200">{t.ratingLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {ratingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTempFilters((prev) => ({ ...prev, minRating: opt.value }))}
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all ${tempFilters.minRating === opt.value
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-orange-300"
                        }`}
                    >
                      {tempFilters.minRating === opt.value && (
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Địa điểm làm việc ── */}
              {locations.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-800 dark:text-zinc-200">{t.locationLabel}</p>
                  <div className="relative">
                    <select
                      value={tempFilters.location}
                      onChange={(e) => setTempFilters((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 pr-9 text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-orange-400 transition-all"
                    >
                      <option value="">{t.allLocations}</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer - action buttons */}
            <div className="shrink-0 border-t border-slate-100 dark:border-zinc-800 px-5 py-4 flex gap-3">
              <button
                onClick={handleClearFilters}
                className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-700 py-2.5 text-sm font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
              >
                {t.clearBtn}
              </button>
              <button
                onClick={handleApplyFilter}
                className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-400/30 active:scale-[0.98] transition-all"
              >
                {t.applyBtn}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );

};

export default PhotographerFilters;
