// src/components/photographers/PhotographerFilters.jsx
import { useState, useEffect, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  AlignJustify,
  X,
  ChevronDown,
  Star,
  Camera,
  Heart,
  Grid2X2,
  List,
} from "lucide-react";
import { createPortal } from "react-dom";

const PhotographerFilters = ({ onFilterChange, onViewChange, styles = [], locations = [], language }) => {
  const labels = {
    en: {
      searchPlaceholder: "Search photographer name...",
      filterBtn: "Filter",
      sortBtn: "Sort",
      filterTitle: "Filters",
      clearBtn: "Clear filters",
      applyBtn: "Apply",
      experienceLabel: "Years of experience",
      expAll: "All",
      expUnder1: "Under 1 year",
      exp1to3: "1-3 years",
      expOver3: "Over 3 years",
      expOver5: "Over 5 years",
      stylesLabel: "Photography styles",
      locationLabel: "Working location",
      allLocations: "All locations",
      ratingLabel: "Minimum rating",
      ratingAll: "All",
      sortNewest: "Newest",
      sortExperience: "Experience",
      sortLikes: "Favorites",
      sortRating: "Rating",
      descending: "High to low",
      ascending: "Low to high",
      clearAll: "Clear all",
      grid: "Grid",
      list: "List",
    },
    vi: {
      searchPlaceholder: "T\u00ecm ki\u1ebfm nhi\u1ebfp \u1ea3nh gia...",
      filterBtn: "B\u1ed9 l\u1ecdc",
      sortBtn: "S\u1eafp x\u1ebfp",
      filterTitle: "B\u1ed9 l\u1ecdc",
      clearBtn: "B\u1ecf l\u1ecdc",
      applyBtn: "\u00c1p d\u1ee5ng",
      experienceLabel: "S\u1ed1 n\u0103m kinh nghi\u1ec7m",
      expAll: "T\u1ea5t c\u1ea3",
      expUnder1: "D\u01b0\u1edbi 1 n\u0103m",
      exp1to3: "T\u1eeb 1-3 n\u0103m",
      expOver3: "Tr\u00ean 3 n\u0103m",
      expOver5: "Tr\u00ean 5 n\u0103m",
      stylesLabel: "Phong c\u00e1ch ch\u1ee5p",
      locationLabel: "Khu v\u1ef1c l\u00e0m vi\u1ec7c",
      allLocations: "T\u1ea5t c\u1ea3 khu v\u1ef1c",
      ratingLabel: "\u0110\u00e1nh gi\u00e1 t\u1ed1i thi\u1ec3u",
      ratingAll: "T\u1ea5t c\u1ea3",
      sortNewest: "M\u1edbi nh\u1ea5t",
      sortExperience: "Kinh nghi\u1ec7m",
      sortLikes: "Y\u00eau th\u00edch",
      sortRating: "\u0110\u00e1nh gi\u00e1",
      descending: "Cao \u0111\u1ebfn th\u1ea5p",
      ascending: "Th\u1ea5p \u0111\u1ebfn cao",
      clearAll: "X\u00f3a t\u1ea5t c\u1ea3",
      grid: "D\u1ea1ng l\u01b0\u1edbi",
      list: "D\u1ea1ng danh s\u00e1ch",
    },
  };

  const t = labels[language] || labels.en;
  const [searchValue, setSearchValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState("relevance");
  const [viewMode, setViewMode] = useState("grid");
  const [tempFilters, setTempFilters] = useState({ experienceRange: "all", styles: [], location: "", minRating: 0 });
  const [appliedFilters, setAppliedFilters] = useState({ location: "", styles: [], minRating: 0, minExperience: 0 });
  const sortRef = useRef(null);
  const [sortPos, setSortPos] = useState({ top: 0, right: 0 });

  const experienceOptions = [
    { value: "all", label: t.expAll, minExp: 0 },
    { value: "under1", label: t.expUnder1, minExp: 0 },
    { value: "1to3", label: t.exp1to3, minExp: 1 },
    { value: "over3", label: t.expOver3, minExp: 3 },
    { value: "over5", label: t.expOver5, minExp: 5 },
  ];

  const ratingOptions = [
    { value: 0, label: t.ratingAll },
    { value: 3, label: "3+ stars" },
    { value: 3.5, label: "3.5+ stars" },
    { value: 4, label: "4+ stars" },
    { value: 4.5, label: "4.5+ stars" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search: searchValue, ...appliedFilters, sortBy: currentSort });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (sortOpen) setSortOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sortOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleStyle = (style) => {
    setTempFilters((prev) => ({
      ...prev,
      styles: prev.styles.includes(style) ? prev.styles.filter((s) => s !== style) : [...prev.styles, style],
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
    setSearchValue("");
    setCurrentSort("relevance");
    onFilterChange({ search: "", ...newApplied, sortBy: "relevance" });
  };

  const handleSortSelect = (sortValue) => {
    setCurrentSort(sortValue);
    setSortOpen(false);
    onFilterChange({ search: searchValue, ...appliedFilters, sortBy: sortValue });
  };

  const handleViewMode = (mode) => {
    setViewMode(mode);
    onViewChange?.(mode);
  };

  const activeCount = [
    appliedFilters.location !== "",
    appliedFilters.styles.length > 0,
    appliedFilters.minRating > 0,
    appliedFilters.minExperience > 0,
  ].filter(Boolean).length;
  const hasAnyActive = activeCount > 0 || searchValue.trim() !== "" || currentSort !== "relevance";

  const toolbarButton = "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 select-none";
  const inactiveButton = "border-orange-100 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 dark:border-orange-500/20 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-orange-500/10";
  const activeButton = "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-400/60 dark:bg-orange-500/15 dark:text-orange-200";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[210px] flex-1 max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange-500/80" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-xl border border-orange-100 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 dark:border-orange-500/20 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <button onClick={() => { setFilterOpen(true); setSortOpen(false); }} className={`${toolbarButton} ${activeCount > 0 ? activeButton : inactiveButton}`}>
          <SlidersHorizontal size={15} />
          {t.filterBtn}
          {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{activeCount}</span>}
        </button>

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
            className={`${toolbarButton} ${sortOpen ? activeButton : inactiveButton}`}
          >
            <AlignJustify size={15} />
            {t.sortBtn}
          </button>

          {sortOpen && createPortal(
            <div style={{ position: "fixed", top: sortPos.top, right: sortPos.right, zIndex: 99999, width: "244px" }} className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-xl shadow-orange-100/80 dark:border-orange-500/20 dark:bg-slate-900 dark:shadow-black/50">
              <button onClick={() => handleSortSelect("relevance")} className={`flex w-full items-center gap-2.5 border-b border-orange-50 px-4 py-3 text-sm font-bold transition-colors dark:border-orange-500/10 ${currentSort === "relevance" ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-700 hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-orange-500/10"}`}>
                <AlignJustify size={14} className="opacity-70" />
                {t.sortNewest}
              </button>

              <div className="border-b border-orange-50 dark:border-orange-500/10">
                <p className="px-4 pb-1 pt-3 text-[10px] font-black uppercase tracking-wide text-orange-500/80">{t.sortExperience}</p>
                <button onClick={() => handleSortSelect("experience")} className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${currentSort === "experience" ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-600 hover:bg-orange-50 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                  <Camera size={14} /> {t.descending}
                </button>
                <button onClick={() => handleSortSelect("bookings_asc")} className={`flex w-full items-center gap-2.5 px-4 py-2.5 pb-3 text-sm transition-colors ${currentSort === "bookings_asc" ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-600 hover:bg-orange-50 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                  <Camera size={14} /> {t.ascending}
                </button>
              </div>

              <div className="border-b border-orange-50 dark:border-orange-500/10">
                <p className="px-4 pb-1 pt-3 text-[10px] font-black uppercase tracking-wide text-orange-500/80">{t.sortLikes}</p>
                <button onClick={() => handleSortSelect("likes_desc")} className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${currentSort === "likes_desc" ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-600 hover:bg-orange-50 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                  <Heart size={14} /> {t.descending}
                </button>
                <button onClick={() => handleSortSelect("likes_asc")} className={`flex w-full items-center gap-2.5 px-4 py-2.5 pb-3 text-sm transition-colors ${currentSort === "likes_asc" ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-600 hover:bg-orange-50 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                  <Heart size={14} /> {t.ascending}
                </button>
              </div>

              <div>
                <p className="px-4 pb-1 pt-3 text-[10px] font-black uppercase tracking-wide text-orange-500/80">{t.sortRating}</p>
                <button onClick={() => handleSortSelect("rating")} className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${currentSort === "rating" ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-600 hover:bg-orange-50 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                  <Star size={14} /> {t.descending}
                </button>
                <button onClick={() => handleSortSelect("price")} className={`flex w-full items-center gap-2.5 px-4 py-2.5 pb-3 text-sm transition-colors ${currentSort === "price" ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-600 hover:bg-orange-50 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                  <Star size={14} /> {t.ascending}
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>

        <div className="flex rounded-xl border border-orange-100 bg-white p-1 dark:border-orange-500/20 dark:bg-slate-900">
          <button type="button" onClick={() => handleViewMode("grid")} className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-300 dark:hover:bg-orange-500/10"}`} title={t.grid} aria-label={t.grid}>
            <Grid2X2 size={15} />
          </button>
          <button type="button" onClick={() => handleViewMode("list")} className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${viewMode === "list" ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-300 dark:hover:bg-orange-500/10"}`} title={t.list} aria-label={t.list}>
            <List size={16} />
          </button>
        </div>

        {hasAnyActive && (
          <button onClick={handleClearFilters} className="ml-auto flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 transition-all hover:bg-orange-100 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/20">
            <X size={14} />
            {t.clearAll}
          </button>
        )}
      </div>

      {filterOpen && createPortal(
        <>
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" style={{ zIndex: 9998 }} onClick={() => setFilterOpen(false)} />
          <div className="fixed right-0 top-0 flex h-full w-full max-w-[400px] flex-col border-l border-orange-100 bg-white shadow-2xl dark:border-orange-500/20 dark:bg-slate-950" style={{ zIndex: 9999 }}>
            <div className="flex shrink-0 items-center justify-between border-b border-orange-100 px-5 py-4 dark:border-orange-500/15">
              <h3 className="text-base font-black text-slate-950 dark:text-white">{t.filterTitle}</h3>
              <button onClick={() => setFilterOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-orange-50 hover:text-orange-700 dark:text-slate-300 dark:hover:bg-orange-500/10">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-3 text-sm font-black text-slate-900 dark:text-slate-100">{t.experienceLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {experienceOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setTempFilters((prev) => ({ ...prev, experienceRange: opt.value }))} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-all ${tempFilters.experienceRange === opt.value ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "border-orange-100 text-slate-600 hover:border-orange-300 hover:bg-orange-50 dark:border-orange-500/20 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                      {tempFilters.experienceRange === opt.value && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {styles.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-black text-slate-900 dark:text-slate-100">{t.stylesLabel}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {styles.map((style) => (
                      <button key={style} onClick={() => toggleStyle(style)} className="group flex items-center gap-2.5 text-left">
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${tempFilters.styles.includes(style) ? "border-orange-500 bg-orange-500" : "border-orange-200 group-hover:border-orange-400 dark:border-orange-500/30"}`}>
                          {tempFilters.styles.includes(style) && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className="select-none text-sm font-medium text-slate-700 dark:text-slate-300">{style}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-3 text-sm font-black text-slate-900 dark:text-slate-100">{t.ratingLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {ratingOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setTempFilters((prev) => ({ ...prev, minRating: opt.value }))} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-all ${tempFilters.minRating === opt.value ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "border-orange-100 text-slate-600 hover:border-orange-300 hover:bg-orange-50 dark:border-orange-500/20 dark:text-slate-300 dark:hover:bg-orange-500/10"}`}>
                      {tempFilters.minRating === opt.value && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {locations.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-black text-slate-900 dark:text-slate-100">{t.locationLabel}</p>
                  <div className="relative">
                    <select value={tempFilters.location} onChange={(e) => setTempFilters((prev) => ({ ...prev, location: e.target.value }))} className="w-full appearance-none rounded-xl border border-orange-100 bg-white px-4 py-2.5 pr-9 text-sm font-medium text-slate-700 transition-all focus:border-orange-400 focus:outline-none dark:border-orange-500/20 dark:bg-slate-900 dark:text-slate-200">
                      <option value="">{t.allLocations}</option>
                      {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-3 border-t border-orange-100 px-5 py-4 dark:border-orange-500/15">
              <button onClick={handleClearFilters} className="flex-1 rounded-xl border border-orange-200 py-2.5 text-sm font-black text-orange-700 transition-all hover:bg-orange-50 dark:border-orange-500/25 dark:text-orange-200 dark:hover:bg-orange-500/10">
                {t.clearBtn}
              </button>
              <button onClick={handleApplyFilter} className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-black text-white shadow-md shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-[0.98]">
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