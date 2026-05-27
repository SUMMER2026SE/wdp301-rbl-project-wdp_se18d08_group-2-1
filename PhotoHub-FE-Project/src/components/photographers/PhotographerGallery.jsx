// src/components/photographers/PhotographerGallery.jsx
import { useState, useEffect } from "react";
import PhotographerCard from "./PhotographerCard";
import PhotographerListItem from "./PhotographerListItem";
import PhotographerFilters from "./PhotographerFilters";
import usePhotographers from "../../hooks/usePhotographers";
import { Loader, AlertCircle } from "lucide-react";

const PhotographerGallery = ({ language = "en" }) => {
  const { photographers, loading, error, searchPhotographers, getStyles, getLocations } = usePhotographers();

  const [viewType, setViewType] = useState("grid");
  const [styles, setStyles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({});

  // Load styles and locations
  useEffect(() => {
    const loadOptions = async () => {
      const [stylesList, locationsList] = await Promise.all([getStyles(), getLocations()]);
      setStyles(stylesList);
      setLocations(locationsList);
    };
    loadOptions();
  }, [getStyles, getLocations]);

  // Search photographers when filters change
  useEffect(() => {
    const searchParams = {
      ...filters,
      limit: 12,
      page: 1,
    };
    searchPhotographers(searchParams);
  }, [filters, searchPhotographers]);

  const labels = {
    en: {
      noResults: "No photographers found",
      noResultsMessage: "Try adjusting your filters",
      error: "Error loading photographers",
    },
    vi: {
      noResults: "Không tìm thấy nhiếp ảnh gia",
      noResultsMessage: "Hãy thử điều chỉnh bộ lọc của bạn",
      error: "Lỗi khi tải nhiếp ảnh gia",
    },
  };

  const t = labels[language] || labels.en;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PhotographerFilters
        onFilterChange={setFilters}
        onViewChange={setViewType}
        styles={styles}
        locations={locations}
        language={language}
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-500" size={32} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={20} />
          <div>
            <h3 className="font-semibold">{t.error}</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && photographers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-12 dark:bg-gray-800">
          <AlertCircle size={48} className="mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t.noResults}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{t.noResultsMessage}</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && !error && photographers.length > 0 && viewType === "grid" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photographers.map((photographer) => (
            <PhotographerCard
              key={photographer._id}
              photographer={photographer}
              language={language}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && !error && photographers.length > 0 && viewType === "list" && (
        <div className="space-y-4">
          {photographers.map((photographer) => (
            <PhotographerListItem
              key={photographer._id}
              photographer={photographer}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotographerGallery;
