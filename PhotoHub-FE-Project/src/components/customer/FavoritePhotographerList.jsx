import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, MapPin, Trash2, Camera, Award } from "lucide-react";
import { favoriteService } from "../../services/favoriteService";

export default function FavoritePhotographerList({ language = "vi", isDark = true }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const t = {
    vi: {
      title: "Nhiếp ảnh gia yêu thích",
      subtitle: "Danh sách những nhiếp ảnh gia bạn đã lưu",
      empty: "Bạn chưa có nhiếp ảnh gia yêu thích nào",
      emptyHint: "Hãy khám phá và bấm ❤️ để lưu nhiếp ảnh gia",
      remove: "Bỏ yêu thích",
      viewProfile: "Xem hồ sơ",
      rating: "Đánh giá",
      experience: "Kinh nghiệm",
      years: "năm",
      loading: "Đang tải...",
    },
    en: {
      title: "Favorite Photographers",
      subtitle: "Photographers you have saved",
      empty: "You haven't favorited any photographer yet",
      emptyHint: "Explore and tap ❤️ to save photographers",
      remove: "Remove",
      viewProfile: "View Profile",
      rating: "Rating",
      experience: "Experience",
      years: "yrs",
      loading: "Loading...",
    },
  }[language] || {
    vi: {
      title: "Nhiếp ảnh gia yêu thích",
    },
  }["vi"];

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await favoriteService.getFavorites();
      if (res.success !== false && Array.isArray(res.data)) {
        setFavorites(res.data);
      }
    } catch (_) {}
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = async (photographerId, e) => {
    e.preventDefault();
    setRemovingId(photographerId);
    try {
      const res = await favoriteService.removeFavorite(photographerId);
      if (res.success !== false) {
        setFavorites((prev) =>
          prev.filter((fav) => fav.photographer?._id !== photographerId)
        );
      }
    } catch (_) {}
    finally {
      setRemovingId(null);
    }
  };

  const getAvatarUrl = (photographer) => {
    const avatar = photographer?.user?.avatar;
    if (!avatar) return null;
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
    return `http://localhost:3000${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
  };

  const cardBg = isDark
    ? "bg-white/5 border-white/10 hover:border-rose-500/30"
    : "bg-slate-50 border-slate-200 hover:border-rose-400/40 shadow-sm";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div
      className={`border rounded-3xl p-8 transition-all ${
        isDark ? "bg-white/5 border-white/10" : "bg-slate-50/50 border-slate-200/80 shadow-sm"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <Heart size={20} fill="currentColor" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className={`text-sm mt-0.5 ${textMuted}`}>{t.subtitle}</p>
        </div>
        <span
          className={`ml-auto text-sm font-bold px-3 py-1 rounded-full ${
            isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          {favorites.length}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-56 rounded-2xl animate-pulse ${
                isDark ? "bg-white/5" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-3xl ${
              isDark ? "bg-white/5" : "bg-slate-100"
            }`}
          >
            <Heart size={36} className="text-rose-300" />
          </div>
          <p className={`text-base font-semibold ${textMuted}`}>{t.empty}</p>
          <p className={`text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>
            {t.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => {
            const pg = fav.photographer;
            if (!pg) return null;
            const avatarUrl = getAvatarUrl(pg);

            return (
              <div
                key={fav._id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${cardBg}`}
              >
                {/* Avatar / thumbnail */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-200 dark:bg-zinc-900">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={pg.displayName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-tr from-orange-500/10 to-amber-600/10 text-orange-500 gap-2">
                      <Camera size={26} className="opacity-70" />
                      <span className="text-xl font-black">
                        {pg.displayName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Remove btn */}
                  <button
                    onClick={(e) => handleRemove(pg._id, e)}
                    disabled={removingId === pg._id}
                    title={t.remove}
                    className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md border transition-all
                      bg-rose-500 border-rose-400 text-white shadow-lg hover:bg-rose-600 active:scale-90
                      ${removingId === pg._id ? "animate-pulse cursor-not-allowed opacity-60" : ""}
                    `}
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Location */}
                  {pg.location && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-xl bg-black/40 backdrop-blur-md px-2 py-1 text-xs text-white border border-white/5">
                      <MapPin size={10} className="text-orange-400" />
                      <span className="line-clamp-1 max-w-[100px]">{pg.location}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className={`font-bold text-base line-clamp-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {pg.displayName || "—"}
                  </h3>
                  <p className={`mt-0.5 text-xs line-clamp-1 ${textMuted}`}>
                    {pg.user?.email}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <div className={`flex flex-1 items-center gap-1.5 rounded-xl px-2 py-1.5 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold">
                        {pg.averageRating ? pg.averageRating.toFixed(1) : "5.0"}
                      </span>
                    </div>
                    <div className={`flex flex-1 items-center gap-1.5 rounded-xl px-2 py-1.5 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                      <Award size={12} className="text-emerald-400" />
                      <span className="text-xs font-bold">
                        {pg.experienceYears || 0} {t.years}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/photographers/${pg._id}`}
                    className="mt-3 block w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 py-2 text-center text-xs font-bold text-white shadow hover:opacity-90 transition"
                  >
                    {t.viewProfile}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
