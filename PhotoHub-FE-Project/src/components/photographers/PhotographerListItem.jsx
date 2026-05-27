// src/components/photographers/PhotographerListItem.jsx
import { Star, MapPin, Award, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const PhotographerListItem = ({ photographer, language }) => {
  const labels = {
    en: {
      bookNow: "Book Now",
      experience: "Experience",
      rating: "Rating",
      reviews: "reviews",
      years: "years",
      about: "About",
    },
    vi: {
      bookNow: "Đặt Ngay",
      experience: "Kinh Nghiệm",
      rating: "Đánh Giá",
      reviews: "đánh giá",
      years: "năm",
      about: "Giới Thiệu",
    },
  };

  const t = labels[language] || labels.en;
  const { user, displayName, location, experienceYears, averageRating, completedBookings, bio, styles, hourlyRate, _id } = photographer;

  return (
    <div className="flex gap-4 overflow-hidden rounded-lg bg-white p-4 shadow-md transition-all duration-200 hover:shadow-lg dark:bg-gray-800">
      {/* Avatar */}
      <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-400 to-purple-500">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
            {displayName?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>

          {/* Location & Bio */}
          {location && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin size={14} />
              <span>{location}</span>
            </div>
          )}

          {bio && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {bio}
            </p>
          )}

          {/* Styles */}
          {styles && styles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {styles.map((style, idx) => (
                <span
                  key={idx}
                  className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {style}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="flex flex-shrink-0 flex-col items-end justify-between">
        {/* Stats */}
        <div className="space-y-2 text-sm">
          {/* Rating */}
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1 dark:bg-amber-900/20">
            <Star size={14} className="text-amber-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {averageRating?.toFixed(1) || "0"}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ({completedBookings})
            </span>
          </div>

          {/* Experience */}
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1 dark:bg-green-900/20">
            <Award size={14} className="text-green-600" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {experienceYears || "0"} {t.years}
            </span>
          </div>

          {/* Bookings */}
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 dark:bg-blue-900/20">
            <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {completedBookings} {t.reviews}
            </span>
          </div>
        </div>

        {/* Price & Button */}
        <div className="flex flex-col items-end gap-2">
          {hourlyRate && (
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ${hourlyRate}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">/hour</div>
            </div>
          )}
          <Link
            to={`/photographers/${_id}`}
            className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:from-blue-600 hover:to-purple-700"
          >
            {t.bookNow}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PhotographerListItem;
