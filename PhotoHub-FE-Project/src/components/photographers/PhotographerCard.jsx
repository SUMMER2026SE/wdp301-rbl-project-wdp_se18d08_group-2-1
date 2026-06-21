import { Star, MapPin, Award, Camera, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useFavorite } from "../../hooks/useFavorite";
import { photographerMarketplaceService } from "../../services/photographerService";

const PhotographerCard = ({ photographer, language, onViewClick, onRequireLogin, onMessageClick }) => {
  const navigate = useNavigate();
  const labels = {
    en: {
      viewProfile: "View profile",
      experience: "Exp",
      rating: "Rating",
      reviews: "reviews",
      years: "yrs",
      message: "Message",
      chat: "Chat",
      fullProfile: "Open full page",
      loginMessage: "Please sign in to message this photographer. Press OK to go to login.",
      missingChatAccount: "Cannot find this photographer chat account.",
      removeFavorite: "Remove favorite",
      addFavorite: "Add favorite",
    },
    vi: {
      viewProfile: "Xem h\u1ed3 s\u01a1",
      experience: "Kinh nghi\u1ec7m",
      rating: "\u0110\u00e1nh gi\u00e1",
      reviews: "\u0111\u00e1nh gi\u00e1",
      years: "n\u0103m",
      message: "Nh\u1eafn tin",
      chat: "Nh\u1eafn tin",
      fullProfile: "M\u1edf trang \u0111\u1ea7y \u0111\u1ee7",
      loginMessage: "B\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp \u0111\u1ec3 nh\u1eafn tin v\u1edbi photographer. Nh\u1ea5n OK \u0111\u1ec3 \u0111\u1ebfn trang \u0111\u0103ng nh\u1eadp.",
      missingChatAccount: "Kh\u00f4ng t\u00ecm th\u1ea5y t\u00e0i kho\u1ea3n chat c\u1ee7a photographer n\u00e0y.",
      removeFavorite: "B\u1ecf y\u00eau th\u00edch",
      addFavorite: "Th\u00eam y\u00eau th\u00edch",
    },
  };

  const t = labels[language] || labels.en;
  const { user, displayName, location, experienceYears, averageRating, styles, _id } = photographer;
  const { isFavorited, loading: favLoading, toggle: toggleFavorite, checkStatus } = useFavorite(_id);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith("http://") || user.avatar.startsWith("https://")) {
      return user.avatar;
    }
    const BACKEND_URL = "http://localhost:3000";
    const cleanPath = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  const getPhotographerUserId = () => {
    if (typeof user === "string") return user;
    return user?._id || user?.id || photographer?.userId;
  };

  const handleMessageClick = async (e) => {
    e?.stopPropagation?.();
    if (onMessageClick) {
      onMessageClick(photographer);
      return;
    }

    if (!localStorage.getItem("token")) {
      const ok = window.confirm(t.loginMessage);
      if (ok) navigate("/login");
      return;
    }

    const recipientId = getPhotographerUserId();
    if (!recipientId) {
      window.alert(t.missingChatAccount);
      return;
    }

    try {
      const res = await photographerMarketplaceService.createConversation(recipientId);
      const conversationId = res.data?._id || res.data?.id || res._id || res.id;
      navigate(conversationId ? `/chat?conversationId=${conversationId}` : "/chat");
    } catch (err) {
      window.alert(err.response?.data?.message || err.message);
    }
  };

  const avatarUrl = getAvatarUrl();
  const initials = displayName?.charAt(0)?.toUpperCase() || "P";

  return (
    <article className="group relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 !bg-white shadow-sm shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 dark:border-orange-500/20 dark:!bg-slate-950 dark:shadow-black/30 dark:hover:border-orange-400/50">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-white via-orange-50 to-amber-50 text-orange-500 dark:from-slate-950 dark:via-orange-950/20 dark:to-slate-900">
            <Camera size={26} className="opacity-80 transition-transform group-hover:scale-110" />
            <span className="text-2xl font-black tracking-tight">{initials}</span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <button
            type="button"
            onClick={handleMessageClick}
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-3 text-[11px] font-black uppercase tracking-wide text-slate-900 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-500 hover:text-white dark:border-orange-500/20 dark:!bg-slate-950/75 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-500"
            title={t.message}
            aria-label={t.message}
          >
            <MessageCircle size={13} />
            <span>{t.chat}</span>
          </button>

          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              const result = await toggleFavorite();
              if (result?.requireLogin && onRequireLogin) {
                onRequireLogin();
              }
            }}
            disabled={favLoading}
            aria-label={isFavorited ? t.removeFavorite : t.addFavorite}
            className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-200 ${
              isFavorited
                ? "scale-105 border-rose-300 bg-rose-500 text-white shadow-rose-500/30"
                : "border-white/70 bg-white/85 text-slate-400 hover:scale-105 hover:border-rose-200 hover:bg-rose-500 hover:text-white dark:border-white/10 dark:bg-slate-950/75 dark:text-white/70 dark:hover:border-rose-400 dark:hover:bg-rose-500 dark:hover:!text-white"
            } ${favLoading ? "animate-pulse cursor-not-allowed" : "active:scale-95"}`}
          >
            <Heart
              size={16}
              className="transition-transform duration-200"
              fill={isFavorited ? "currentColor" : "none"}
              strokeWidth={isFavorited ? 0 : 2}
            />
          </button>
        </div>

        {location && (
          <div className="absolute bottom-3 left-3 flex max-w-[78%] items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/65 px-3 py-1.5 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur-md">
            <MapPin size={12} className="text-orange-300" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div>
          <h3 className="line-clamp-1 text-base font-extrabold tracking-tight !text-slate-950 transition-colors group-hover:!text-orange-600 dark:!text-white dark:group-hover:!text-orange-300">
            {displayName || "Anonymous Creator"}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs font-semibold tracking-wide !text-slate-600 dark:!text-slate-300">
            {user?.email}
          </p>

          {styles && styles.length > 0 && (
            <div className="mt-4 flex min-h-[28px] flex-wrap gap-1.5">
              {styles.slice(0, 3).map((style, idx) => (
                <span
                  key={idx}
                  className="inline-flex h-7 items-center rounded-full border border-orange-100 bg-orange-50 px-2.5 text-[11px] font-bold tracking-wide !text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200"
                >
                  {style}
                </span>
              ))}
              {styles.length > 3 && (
                <span className="inline-flex h-7 items-center rounded-full bg-orange-100 px-2 text-xs font-bold !text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
                  +{styles.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="flex min-h-[64px] items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/70 p-2.5 dark:border-orange-500/20 dark:bg-orange-500/[0.06]">
              <Star size={15} className="shrink-0 fill-orange-500 text-orange-500" />
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wide !text-slate-600 dark:!text-slate-300">{t.rating}</div>
                <div className="mt-0.5 text-sm font-black !text-slate-950 dark:!text-white">
                  {averageRating ? averageRating.toFixed(1) : "5.0"}
                </div>
              </div>
            </div>
            <div className="flex min-h-[64px] items-center gap-2 rounded-xl border border-orange-100 bg-white p-2.5 dark:border-orange-500/20 dark:bg-orange-500/[0.06]">
              <Award size={15} className="shrink-0 text-orange-500" />
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wide !text-slate-600 dark:!text-slate-300">{t.experience}</div>
                <div className="mt-0.5 text-sm font-black !text-slate-950 dark:!text-white">
                  {experienceYears || 0} {t.years}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-orange-100 pt-4 dark:border-orange-500/20">
          <button
            type="button"
            onClick={() => onViewClick && onViewClick(photographer)}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-orange-200 bg-white px-4 text-xs font-black uppercase tracking-wide !text-orange-600 shadow-sm shadow-orange-100/70 transition-all hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-500 hover:!text-white hover:shadow-lg hover:shadow-orange-500/20 dark:border-orange-500 dark:bg-orange-500 dark:!text-white dark:shadow-orange-500/10 dark:hover:bg-orange-400"
          >
            {t.viewProfile}
          </button>

          <Link
            to={`/photographers/${_id}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-white !text-orange-500 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:!text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:!text-orange-200 dark:hover:border-orange-400 dark:hover:bg-orange-500 dark:hover:!text-white"
            title={t.fullProfile}
            aria-label={t.fullProfile}
          >
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PhotographerCard;