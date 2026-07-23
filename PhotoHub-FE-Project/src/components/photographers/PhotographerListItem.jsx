// src/components/photographers/PhotographerListItem.jsx
import { Star, MapPin, Award, BookOpen, MessageCircle, Camera, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { photographerMarketplaceService } from "../../services/photographerService";

const PhotographerListItem = ({ photographer, language, onMessageClick }) => {
  const navigate = useNavigate();
  const labels = {
    en: {
      viewProfile: "View profile",
      experience: "Experience",
      rating: "Rating",
      reviews: "completed",
      years: "years",
      message: "Message",
      fullProfile: "Open full page",
      loginMessage: "Please sign in to message this photographer. Press OK to go to login.",
      missingChatAccount: "Cannot find this photographer chat account.",
      perHour: "/ hour",
    },
    vi: {
      viewProfile: "Xem h\u1ed3 s\u01a1",
      experience: "Kinh nghi\u1ec7m",
      rating: "\u0110\u00e1nh gi\u00e1",
      reviews: "bu\u1ed5i ch\u1ee5p",
      years: "n\u0103m",
      message: "Nh\u1eafn tin",
      fullProfile: "M\u1edf trang \u0111\u1ea7y \u0111\u1ee7",
      loginMessage: "B\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp \u0111\u1ec3 nh\u1eafn tin v\u1edbi photographer. Nh\u1ea5n OK \u0111\u1ec3 \u0111\u1ebfn trang \u0111\u0103ng nh\u1eadp.",
      missingChatAccount: "Kh\u00f4ng t\u00ecm th\u1ea5y t\u00e0i kho\u1ea3n chat c\u1ee7a photographer n\u00e0y.",
      perHour: "/ gi\u1edd",
    },
  };

  const t = labels[language] || labels.en;
  const { user, displayName, location, experienceYears, averageRating, completedBookings, bio, styles, hourlyRate, _id } = photographer;

  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith("http://") || user.avatar.startsWith("https://")) return user.avatar;
    const cleanPath = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `https://photo-hub-be-project.vercel.app${cleanPath}`;
  };

  const getPhotographerUserId = () => {
    if (typeof user === "string") return user;
    return user?._id || user?.id || photographer?.userId;
  };

  const handleMessageClick = async () => {
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
  const initial = displayName?.charAt(0)?.toUpperCase() || "P";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm shadow-orange-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 dark:border-orange-500/20 dark:bg-slate-900 dark:shadow-black/30 md:flex-row">
      <div className="relative h-48 shrink-0 overflow-hidden bg-orange-50 md:h-auto md:w-56 dark:bg-slate-950">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-white via-orange-50 to-amber-50 text-orange-500 dark:from-slate-950 dark:via-orange-950/30 dark:to-slate-900">
            <Camera size={28} />
            <span className="text-3xl font-black">{initial}</span>
          </div>
        )}
        {location && (
          <div className="absolute bottom-3 left-3 flex max-w-[85%] items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            <MapPin size={12} className="text-orange-300" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-slate-950 dark:text-white">{displayName}</h3>
              <p className="mt-1 truncate text-sm font-semibold text-slate-500 dark:text-slate-300">{user?.email}</p>
            </div>
            {hourlyRate && (
              <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-right dark:border-orange-500/20 dark:bg-orange-500/10">
                <div className="text-lg font-black text-orange-700 dark:text-orange-200">${hourlyRate}</div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.perHour}</div>
              </div>
            )}
          </div>

          {bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{bio}</p>}

          {styles && styles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {styles.slice(0, 5).map((style, idx) => (
                <span key={idx} className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                  {style.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-orange-100 pt-4 dark:border-orange-500/15">
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 dark:border-orange-500/20 dark:bg-orange-500/10">
              <Star size={15} className="fill-orange-500 text-orange-500" />
              <span className="font-black text-slate-950 dark:text-white">{averageRating?.toFixed(1) || "0"}</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.rating}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 dark:border-orange-500/20 dark:bg-slate-950">
              <Award size={15} className="text-orange-500" />
              <span className="font-black text-slate-950 dark:text-white">{experienceYears || "0"} {t.years}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 dark:border-orange-500/20 dark:bg-slate-950">
              <BookOpen size={15} className="text-orange-500" />
              <span className="font-black text-slate-950 dark:text-white">{completedBookings || 0}</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.reviews}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={handleMessageClick} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-black text-orange-700 transition-all hover:bg-orange-500 hover:text-white dark:border-orange-500/25 dark:bg-slate-950 dark:text-orange-200 dark:hover:bg-orange-500 dark:hover:text-white">
              <MessageCircle size={16} />
              {t.message}
            </button>
            <Link to={`/photographers/${_id}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-white shadow-md shadow-orange-500/25 transition-all hover:bg-orange-600">
              {t.viewProfile}
              <ExternalLink size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PhotographerListItem;