// src/components/photographers/PhotographerFilters.jsx
import { useState, useEffect } from "react";
import { Search, X, Grid3x3, List } from "lucide-react";

const PhotographerFilters = ({ onFilterChange, onViewChange, styles = [], locations = [], language }) => {
  const labels = {
    en: {
      searchPlaceholder: "Search photographer name...",
      filters: "Filters",
      clearAll: "Clear All",
      location: "Location",
      styles: "Photography Styles",
      priceRange: "Price Range",
      rating: "Minimum Rating",
      experience: "Experience (years)",
      sortBy: "Sort By",
      gridView: "Grid",
      listView: "List",
      relevance: "Relevance",
      rating_sort: "Rating",
      price: "Price (Low to High)",
      experience_sort: "Experience",
      perHour: "/hour",
      to: "to",
      stars: "stars",
    },
    vi: {
      searchPlaceholder: "Tìm tên nhiếp ảnh gia...",
      filters: "Bộ Lọc",
      clearAll: "Xóa Tất Cả",
      location: "Vị Trí",
      styles: "Phong Cách Chụp",
      priceRange: "Khoảng Giá",
      rating: "Đánh Giá Tối Thiểu",
      experience: "Kinh Nghiệm (năm)",
      sortBy: "Sắp Xếp",
      gridView: "Lưới",
      listView: "Danh Sách",
      relevance: "Độ Phù Hợp",
      rating_sort: "Đánh Giá",
      price: "Giá (Thấp đến Cao)",
      experience_sort: "Kinh Nghiệm",
      perHour: "/giờ",
      to: "đến",
      stars: "sao",
    },
  };

  const t = labels[language] || labels.en;
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    styles: [],
    minPrice: 0,
    maxPrice: 1000,
    minRating: 0,
    minExperience: 0,
    sortBy: "relevance",
  });

  const [viewType, setViewType] = useState("grid");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  // Handle view change
  const handleViewChange = (view) => {
    setViewType(view);
    onViewChange(view);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Handle style toggle
  const handleStyleToggle = (style) => {
    setFilters((prev) => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      location: "",
      styles: [],
      minPrice: 0,
      maxPrice: 1000,
      minRating: 0,
      minExperience: 0,
      sortBy: "relevance",
    });
  };

  return (
    <div className="space-y-4 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.filters}
        </h3>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex gap-1 rounded-lg border border-gray-300 bg-gray-100 p-1 dark:border-gray-600 dark:bg-gray-700">
            <button
              onClick={() => handleViewChange("grid")}
              className={`rounded px-3 py-1 transition-all ${
                viewType === "grid"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
              title={t.gridView}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={`rounded px-3 py-1 transition-all ${
                viewType === "list"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
              title={t.listView}
            >
              <List size={18} />
            </button>
          </div>

          {/* Clear All */}
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            <X size={16} />
            {t.clearAll}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-3 text-gray-400 dark:text-gray-500"
        />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-900"
        />
      </div>

      {/* Location */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.location}
        </label>
        <select
          value={filters.location}
          onChange={(e) => handleFilterChange("location", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Styles */}
      {styles.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.styles}
          </label>
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => handleStyleToggle(style)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
                  filters.styles.includes(style)
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.priceRange}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
            placeholder="Min"
          />
          <span className="text-gray-500 dark:text-gray-400">{t.to}</span>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
            placeholder="Max"
          />
          <span className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {t.perHour}
          </span>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.rating}
        </label>
        <select
          value={filters.minRating}
          onChange={(e) => handleFilterChange("minRating", parseFloat(e.target.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
        >
          <option value="0">All Ratings</option>
          <option value="3">3+ {t.stars}</option>
          <option value="3.5">3.5+ {t.stars}</option>
          <option value="4">4+ {t.stars}</option>
          <option value="4.5">4.5+ {t.stars}</option>
        </select>
      </div>

      {/* Experience */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.experience}
        </label>
        <input
          type="number"
          min="0"
          value={filters.minExperience}
          onChange={(e) => handleFilterChange("minExperience", parseInt(e.target.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
          placeholder="Minimum years"
        />
      </div>

      {/* Sort By */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.sortBy}
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
        >
          <option value="relevance">{t.relevance}</option>
          <option value="rating">{t.rating_sort}</option>
          <option value="price">{t.price}</option>
          <option value="experience">{t.experience_sort}</option>
        </select>
      </div>
    </div>
  );
};

export default PhotographerFilters;
