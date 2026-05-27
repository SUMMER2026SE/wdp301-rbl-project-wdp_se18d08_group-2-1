// src/components/photographers/PhotographerCard.jsx
import { Star, MapPin, Award, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const PhotographerCard = ({ photographer, language }) => {
  const labels = {
    en: {
      bookNow: "Book Now",
      completedBookings: "Completed Bookings",
      experience: "Experience",
      rating: "Rating",
      reviews: "reviews",
      years: "years",
    },
    vi: {
      bookNow: "Đặt Ngay",
      completedBookings: "Lịch Chụp Hoàn Thành",
      experience: "Kinh Nghiệm",
      rating: "Đánh Giá",
      reviews: "đánh giá",
      years: "năm",
    },
  };

  const t = labels[language] || labels.en;
  const { user, displayName, location, experienceYears, averageRating, completedBookings, styles, _id } = photographer;

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl dark:bg-gray-800">
      {/* Avatar */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
            {displayName?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-gray-900 dark:text-white">
          {displayName}
        </h3>

        {/* Email */}
        <p className="mb-3 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
          {user?.email}
        </p>

        {/* Location */}
        {location && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={14} />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}

        {/* Styles */}
        {styles && styles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {styles.slice(0, 2).map((style, idx) => (
              <span
                key={idx}
                className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {style}
              </span>
            ))}
            {styles.length > 2 && (
              <span className="inline-block text-xs text-gray-500 dark:text-gray-400">
                +{styles.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          {/* Rating */}
          <div className="flex items-center gap-1 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
            <Star size={14} className="text-amber-500" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {averageRating?.toFixed(1) || "0"}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {completedBookings} {t.reviews}
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="flex items-center gap-1 rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
            <Award size={14} className="text-green-600" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {experienceYears || "0"}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t.years}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-2 text-sm dark:bg-blue-900/20">
          <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-gray-600 dark:text-gray-300">
            {completedBookings} {t.completedBookings}
          </span>
        </div>

        {/* Book Button */}
        <Link
          to={`/photographers/${_id}`}
          className="block w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-center font-medium text-white transition-all duration-200 hover:from-blue-600 hover:to-purple-700"
        >
          {t.bookNow}
        </Link>
      </div>
    </div>
  );
};

export default PhotographerCard;
