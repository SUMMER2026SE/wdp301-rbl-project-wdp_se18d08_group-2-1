// src/components/photographers/PhotographerList.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PhotographerCard from "./PhotographerCard";
import PhotographerListItem from "./PhotographerListItem";
import PhotographerFilters from "./PhotographerFilters";
import usePhotographers from "../../hooks/usePhotographers";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
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
    getLocations,
  } = usePhotographers();

  const [viewType, setViewType] = useState("grid");
  const [availableStyles, setAvailableStyles] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    search: "",
    location: "",
    styles: [],
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
      badge: "PhotoHub creators",
      title: "Our Photographers",
      subtitle: "Find trusted photographers by style, location, rating, and availability.",
      noResults: "No photographers match your filters",
      showing: "Showing",
      of: "of",
      results: "results",
      prev: "Previous",
      next: "Next",
      loading: "Loading photographers...",
      loginRequired: "Please sign in to add this photographer to favorites. Press OK to go to login.",
    },
    vi: {
      badge: "\u0110\u1ed9i ng\u0169 PhotoHub",
      title: "Nhi\u1ebfp \u1ea3nh gia PhotoHub",
      subtitle: "T\u00ecm nhi\u1ebfp \u1ea3nh gia ph\u00f9 h\u1ee3p theo phong c\u00e1ch, khu v\u1ef1c, \u0111\u00e1nh gi\u00e1 v\u00e0 l\u1ecbch r\u1ea3nh.",
      noResults: "Kh\u00f4ng t\u00ecm th\u1ea5y nhi\u1ebfp \u1ea3nh gia ph\u00f9 h\u1ee3p",
      showing: "Hi\u1ec3n th\u1ecb",
      of: "trong",
      results: "k\u1ebft qu\u1ea3",
      prev: "Tr\u01b0\u1edbc",
      next: "Ti\u1ebfp",
      loading: "\u0110ang t\u1ea3i nhi\u1ebfp \u1ea3nh gia...",
      loginRequired: "B\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp \u0111\u1ec3 th\u00eam v\u00e0o danh s\u00e1ch y\u00eau th\u00edch. Nh\u1ea5n OK \u0111\u1ec3 \u0111\u1ebfn trang \u0111\u0103ng nh\u1eadp.",
    },
  };
  const t = labels[language] || labels.en;

  useEffect(() => {
    const loadFilterOptions = async () => {
      const [styles, locations] = await Promise.all([getStyles(), getLocations()]);
      setAvailableStyles(styles);
      setAvailableLocations(locations);
    };
    loadFilterOptions();
  }, [getStyles, getLocations]);

  useEffect(() => {
    const hasFilter =
      currentFilters.search ||
      currentFilters.location ||
      currentFilters.styles.length > 0 ||
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

  const handleFilterChange = useCallback((newFilters) => {
    setCurrentFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  }, []);

  const handlePageChange = (newPage) => {
    setCurrentFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewClick = useCallback((photographer) => {
    setSelectedPhotographerId(photographer._id);
    setDrawerOpen(true);
  }, []);

  const handleRequireLogin = useCallback(() => {
    const confirmLogin = window.confirm(t.loginRequired);
    if (confirmLogin) navigate("/login");
  }, [navigate, t.loginRequired]);

  return (
    <div className="relative mx-auto max-w-7xl px-5 py-10 text-slate-950 transition-colors duration-300 dark:text-slate-100 sm:px-6">
      <section className="mb-8 rounded-[28px] border border-orange-100 bg-white px-6 py-7 shadow-sm shadow-orange-100/70 dark:border-orange-500/20 dark:bg-slate-900 dark:shadow-black/20 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-200">
              <Camera size={14} />
              {t.badge}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
              {t.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300 md:text-base">
              {t.subtitle}
            </p>
          </div>
          {!loading && pagination?.total > 0 && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
              {t.showing} {photographers.length} {t.of} {pagination.total} {t.results}
            </div>
          )}
        </div>

        <div className="mt-7 border-t border-orange-100 pt-5 dark:border-orange-500/15">
          <PhotographerFilters
            onFilterChange={handleFilterChange}
            onViewChange={setViewType}
            styles={availableStyles}
            locations={availableLocations}
            language={language}
          />
        </div>
      </section>

      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-[520px] animate-pulse rounded-2xl border border-orange-100 bg-white shadow-sm dark:border-orange-500/20 dark:bg-slate-900"
                aria-label={t.loading}
              />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto my-12 flex max-w-md flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
            <p className="font-semibold">{error}</p>
          </div>
        ) : photographers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white py-16 text-center dark:border-orange-500/25 dark:bg-slate-900">
            <p className="text-sm font-black uppercase tracking-wide text-orange-700 dark:text-orange-200">
              {t.noResults}
            </p>
          </div>
        ) : viewType === "grid" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photographers.map((p) => (
              <PhotographerCard
                key={p._id}
                photographer={p}
                language={language}
                onViewClick={handleViewClick}
                onRequireLogin={handleRequireLogin}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {photographers.map((p) => (
              <PhotographerListItem key={p._id} photographer={p} language={language} />
            ))}
          </div>
        )}
      </div>

      {!loading && pagination?.totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => handlePageChange(currentFilters.page - 1)}
            disabled={currentFilters.page <= 1}
            className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 transition-all hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-orange-500/25 dark:bg-slate-900 dark:text-orange-200 dark:hover:bg-orange-500/10"
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
                    <span className="text-slate-400 dark:text-slate-500">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`h-9 w-9 rounded-xl text-sm font-black transition-all ${p === currentFilters.page
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                      : "border border-orange-200 bg-white text-orange-700 hover:bg-orange-50 dark:border-orange-500/25 dark:bg-slate-900 dark:text-orange-200 dark:hover:bg-orange-500/10"
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
            className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 transition-all hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-orange-500/25 dark:bg-slate-900 dark:text-orange-200 dark:hover:bg-orange-500/10"
          >
            {t.next}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <PhotographerDrawer
        photographerId={selectedPhotographerId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        language={language}
      />
    </div>
  );
}