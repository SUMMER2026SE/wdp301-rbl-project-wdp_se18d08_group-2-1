import { Star, MapPin, Award, Camera } from "lucide-react";
import { Link } from "react-router-dom";

const PhotographerCard = ({ photographer, language, onViewClick }) => {
  const labels = {
    en: {
      viewProfile: "View Profile",
      experience: "Exp",
      rating: "Rating",
      reviews: "reviews",
      years: "yrs",
    },
    vi: {
      viewProfile: "Xem Hồ Sơ",
      experience: "Kinh nghiệm",
      rating: "Đánh Giá",
      reviews: "đánh giá",
      years: "năm",
    },
  };

  const t = labels[language] || labels.en;
  const { user, displayName, location, experienceYears, averageRating, completedBookings, styles, _id } = photographer;

  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith("http://") || user.avatar.startsWith("https://")) {
      return user.avatar;
    }
    const BACKEND_URL = "http://localhost:3000";
    const cleanPath = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-100/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/5 hover:border-cyan-500/20 dark:bg-zinc-950 dark:border-zinc-900/80 dark:shadow-black/40 dark:hover:border-purple-500/20 h-full">
      <div>
        {/* Top Image Section */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-zinc-900">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-tr from-cyan-500/10 to-purple-600/10 text-cyan-500 dark:text-cyan-400 gap-2">
              <Camera size={28} className="opacity-80 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-black tracking-tight">{displayName?.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {location && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white tracking-wide border border-white/5 shadow-inner">
              <MapPin size={12} className="text-cyan-400" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>

        {/* Info Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
            {displayName || "Anonymous Creator"}
          </h3>
          <p className="mt-0.5 mb-4 line-clamp-1 text-xs font-medium text-slate-400 dark:text-zinc-500 tracking-wide">
            {user?.email}
          </p>

          {styles && styles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {styles.slice(0, 3).map((style, idx) => (
                <span
                  key={idx}
                  className="inline-block rounded-xl bg-slate-100 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-zinc-400 tracking-wide border border-transparent dark:border-zinc-800/40"
                >
                  {style}
                </span>
              ))}
              {styles.length > 3 && (
                <span className="inline-block self-center text-xs font-bold text-slate-400 dark:text-zinc-600 ml-1">
                  +{styles.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 p-2.5 dark:bg-amber-500/[0.02]">
              <Star size={15} className="text-amber-500 fill-amber-500" />
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{t.rating}</div>
                <div className="text-sm font-black text-slate-800 dark:text-zinc-200 mt-0.5">
                  {averageRating ? averageRating.toFixed(1) : "5.0"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/10 p-2.5 dark:bg-emerald-500/[0.02]">
              <Award size={15} className="text-emerald-500" />
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{t.experience}</div>
                <div className="text-sm font-black text-slate-800 dark:text-zinc-200 mt-0.5">
                  {experienceYears || 0} {t.years}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-5 flex gap-2">
        {/* Nút Xem Hồ Sơ → mở Drawer */}
        <button
          onClick={() => onViewClick && onViewClick(photographer)}
          className="flex-1 block rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/10 transition-transform active:scale-[0.98] duration-200"
        >
          <span className="block w-full rounded-[14px] bg-white dark:bg-zinc-950 px-4 py-3 text-center text-xs font-black tracking-widest uppercase text-slate-900 dark:text-white transition-colors group-hover:bg-transparent group-hover:text-white">
            {t.viewProfile}
          </span>
        </button>

        {/* Nút xem trang đầy đủ */}
        <Link
          to={`/photographers/${_id}`}
          className="flex h-full items-center justify-center rounded-2xl border border-slate-200 dark:border-zinc-700 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600 transition-all"
          title="Xem trang đầy đủ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default PhotographerCard;
