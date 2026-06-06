import { Star, MapPin, Award, Camera } from "lucide-react";
import { Link } from "react-router-dom";

const PhotographerCard = ({ photographer, language }) => {
  const labels = {
    en: {
      bookNow: "View Portfolio",
      experience: "Exp",
      rating: "Rating",
      reviews: "reviews",
      years: "yrs",
    },
    vi: {
      bookNow: "Xem Hồ Sơ",
      experience: "Kinh nghiệm",
      rating: "Đánh Giá",
      reviews: "đánh giá",
      years: "năm",
    },
  };

  const t = labels[language] || labels.en;
  const { user, displayName, location, experienceYears, averageRating, completedBookings, styles, _id } = photographer;

  // Helper xử lý chuẩn hóa URL avatar từ backend
  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith("http://") || user.avatar.startsWith("https://")) {
      return user.avatar;
    }
    const BACKEND_URL = "http://localhost:3000"; // Hãy thay port backend của bạn tại đây
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

          {/* Location Badge (Ghim đè lên góc ảnh nhìn điện ảnh hơn) */}
          {location && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white tracking-wide border border-white/5 shadow-inner">
              <MapPin size={12} className="text-cyan-400" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>

        {/* Info Content Section */}
        <div className="p-5">
          {/* Main Stage Name */}
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
            {displayName || "Anonymous Creator"}
          </h3>

          {/* Email */}
          <p className="mt-0.5 mb-4 line-clamp-1 text-xs font-medium text-slate-400 dark:text-zinc-500 tracking-wide">
            {user?.email}
          </p>

          {/* Specialized Styles Container */}
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

          {/* Dual Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Rating Box */}
            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 p-2.5 dark:bg-amber-500/[0.02]">
              <Star size={15} className="text-amber-500 fill-amber-500" />
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{t.rating}</div>
                <div className="text-sm font-black text-slate-800 dark:text-zinc-200 mt-0.5">
                  {averageRating ? averageRating.toFixed(1) : "5.0"}
                </div>
              </div>
            </div>

            {/* Experience Box */}
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

      {/* Primary Action Button (Luôn dính sát đáy Card) */}
      <div className="px-5 pb-5">
        <Link
          to={`/photographers/${_id}`}
          className="block w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/10 transition-transform active:scale-[0.98] duration-200"
        >
          <span className="block w-full rounded-[14px] bg-white dark:bg-zinc-950 px-4 py-3 text-center text-xs font-black tracking-widest uppercase text-slate-900 dark:text-white transition-colors group-hover:bg-transparent group-hover:text-white">
            {t.bookNow}
          </span>
        </Link>
      </div>

    </div>
  );
};

export default PhotographerCard;