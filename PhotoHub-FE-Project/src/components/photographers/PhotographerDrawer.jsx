// src/components/photographers/PhotographerDrawer.jsx
import { useEffect, useState } from "react";
import { aiRecommendService } from "../../services/aiRecommendService";

import {
  X,
  MapPin,
  Star,
  Award,
  BookOpen,
  Heart,
  CalendarCheck,
  Camera,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Globe,
  CheckCircle,
  Eye,
} from "lucide-react";
import usePhotographers from "../../hooks/usePhotographers";
import { useFavorite } from "../../hooks/useFavorite";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const dummyGallery = [
  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520390138845-12006b42937c?auto=format&fit=crop&w=800&q=80",
];

const PhotographerDrawer = ({ photographerId, isOpen, onClose, language = "en" }) => {
  const { getPhotographerDetail } = usePhotographers();
  const [photographer, setPhotographer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("photos");
  const [showMoreBio, setShowMoreBio] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const navigate = useNavigate();
  const [realPortfolios, setRealPortfolios] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumImages, setSelectedAlbumImages] = useState(null); // null | { album, images }


  // Hook yêu thích — dùng photographerId từ props
  const {
    isFavorited,
    loading: favLoading,
    toggle: toggleFavorite,
    checkStatus,
  } = useFavorite(photographerId);

  const labels = {
    en: {
      title: "Photographer Profile",
      loading: "Loading...",
      experience: "years exp.",
      likes: "likes",
      bookBtn: "Book This Photographer",
      likeBtn: "Like",
      intro: "Introduction",
      equipment: "Equipment",
      styles: "Photography Styles",
      showMore: "See more",
      showLess: "Show less",
      tabPhotos: "Photos Taken",
      tabReviews: "Reviews",
      available: "Available",
      unavailable: "Unavailable",
      verified: "Verified Pro",
      hourlyRate: "/ hour",
      completedBookings: "completed shoots",
      noPhotos: "No photos yet",
      noReviews: "No reviews yet",
    },
    vi: {
      title: "Hồ Sơ Nhiếp Ảnh Gia",
      loading: "Đang tải...",
      experience: "năm kinh nghiệm",
      likes: "lượt thích",
      bookBtn: "Đặt lịch với người này",
      likeBtn: "Yêu thích",
      intro: "Giới thiệu",
      equipment: "Thiết bị",
      styles: "Thể loại chụp",
      showMore: "Xem thêm",
      showLess: "Thu gọn",
      tabPhotos: "Ảnh đã chụp",
      tabReviews: "Đánh giá",
      available: "Sẵn sàng",
      unavailable: "Đang bận",
      verified: "Đã xác minh",
      hourlyRate: "/ giờ",
      completedBookings: "buổi chụp",
      noPhotos: "Chưa có ảnh",
      noReviews: "Chưa có đánh giá",
    },
  };
  const t = labels[language] || labels.en;

  // Load photographer detail khi mở drawer
  useEffect(() => {
    if (isOpen && photographerId) {
      setPhotographer(null);
      setLoading(false); // Cập nhật lại logic loading để tránh conflict
      setActiveTab("photos");
      setShowMoreBio(false);

      const load = async () => {
        setLoading(true);
        const data = await getPhotographerDetail(photographerId);
        setPhotographer(data);

        try {
          const albumRes = await aiRecommendService.getAlbumsByPhotographer(photographerId);
          if (albumRes.success) {
            setAlbums(albumRes.data?.albums || []);
          }
        } catch (err) {
          console.error("Lỗi tải albums drawer:", err);
        }
        setLoading(false);
      };
      load();
      checkStatus();
    }
  }, [isOpen, photographerId, getPhotographerDetail, checkStatus]);


  // Khóa scroll khi drawer mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Đóng bằng phím Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
    return `http://localhost:3000${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ zIndex: 99996 }}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
        style={{ zIndex: 99997, overflowY: "auto" }}
      >

        {/* =========== LOADING STATE =========== */}
        {loading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 min-h-screen">
            <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{t.loading}</p>
          </div>
        )}

        {/* =========== MAIN CONTENT =========== */}
        {!loading && photographer && (() => {
          const {
            user,
            displayName,
            location,
            experienceYears,
            bio,
            styles,
            equipment,
            socialLinks,
            averageRating,
            completedBookings,
            totalReviews,
            hourlyRate,
            verificationStatus,
            isAvailable,
          } = photographer;

          const avatarUrl = getAvatarUrl(user?.avatar);
          const bioText = bio || "";
          const bioShort = bioText.length > 180 ? bioText.slice(0, 180) + "..." : bioText;

          return (
            <div className="flex flex-col">

              {/* --- CLOSE BUTTON (luôn hiển thị trên ảnh bìa) --- */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
              >
                <X size={18} />
              </button>

              {/* --- COVER IMAGE --- */}
              <div className="relative h-44 w-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shrink-0">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover opacity-40 blur-lg scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* --- AVATAR + NAME SECTION --- */}
              <div className="relative px-5 pb-4">
                {/* Avatar nổi lên trên cover */}
                <div className="relative -mt-14 mb-3 flex items-end gap-3">
                  <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-full border-4 border-white dark:border-zinc-900 shadow-xl bg-gradient-to-br from-cyan-400 to-purple-500">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
                        {displayName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name & stats */}
                  <div className="mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {displayName}
                      </h2>
                      {verificationStatus === "VERIFIED" && (
                        <CheckCircle size={16} className="text-blue-500 fill-blue-100" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0.5 flex-wrap">
                      {experienceYears > 0 && (
                        <span className="flex items-center gap-1">
                          <Award size={11} className="text-emerald-500" />
                          Trên {experienceYears} {t.experience}
                        </span>
                      )}
                      {totalReviews > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart size={11} className="text-pink-500" />
                          {totalReviews} {t.likes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location Tags */}
                {location && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {location.split(",").map((loc, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-zinc-300"
                      >
                        <MapPin size={10} className="text-red-400" />
                        {loc.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats bar */}
                <div className="mb-4 grid grid-cols-3 divide-x divide-slate-100 dark:divide-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 overflow-hidden">
                  <div className="flex flex-col items-center py-3">
                    <span className="flex items-center gap-1 text-amber-500 font-black text-base">
                      <Star size={13} className="fill-amber-500" />
                      {averageRating ? averageRating.toFixed(1) : "5.0"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mt-0.5">Rating</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="font-black text-base text-slate-800 dark:text-white">
                      {completedBookings || 0}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mt-0.5">{t.completedBookings}</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="font-black text-base text-purple-600 dark:text-purple-400">
                      {hourlyRate ? `$${hourlyRate}` : "--"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mt-0.5">{t.hourlyRate}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-5 flex gap-2">
                  {/* Yêu thích — gọi API thật */}
                  <button
                    onClick={async () => {
                      const result = await toggleFavorite();
                      if (result?.requireLogin) {
                        const ok = window.confirm(
                          "Bạn cần đăng nhập để yêu thích.\nNhấn OK để đến trang đăng nhập."
                        );
                        if (ok) navigate("/login");
                      }
                    }}
                    disabled={favLoading}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 ${isFavorited
                        ? "border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400"
                        : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-pink-400 hover:text-pink-500"
                      } ${favLoading ? "animate-pulse cursor-not-allowed opacity-70" : ""}`}
                  >
                    <Heart
                      size={16}
                      className={isFavorited ? "fill-pink-500 text-pink-500" : ""}
                    />
                    {t.likeBtn}
                  </button>

                  {/* Đặt lịch */}
                  <button
                    className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-200 shadow-md active:scale-[0.98] ${isAvailable
                        ? "bg-orange-500 hover:bg-orange-600 shadow-orange-400/30"
                        : "bg-slate-400 cursor-not-allowed"
                      }`}
                    disabled={!isAvailable}
                  >
                    <CalendarCheck size={16} />
                    {t.bookBtn}
                  </button>
                </div>

                {/* Availability badge */}
                <div className={`mb-5 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold w-fit ${isAvailable
                    ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
                  }`}>
                  <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                  {isAvailable ? t.available : t.unavailable}
                </div>

                {/* --- Giới thiệu (Bio) --- */}
                {bioText && (
                  <div className="mb-5">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-white">
                      <Camera size={15} className="text-blue-500" />
                      {t.intro}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300 whitespace-pre-line">
                      {showMoreBio ? bioText : bioShort}
                    </p>
                    {bioText.length > 180 && (
                      <button
                        onClick={() => setShowMoreBio(!showMoreBio)}
                        className="mt-1.5 flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        {showMoreBio ? (
                          <><ChevronUp size={13} /> {t.showLess}</>
                        ) : (
                          <><ChevronDown size={13} /> {t.showMore}</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* --- Thiết bị --- */}
                {equipment && (
                  <div className="mb-5">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-white">
                      <Cpu size={15} className="text-green-500" />
                      {t.equipment}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-zinc-300">{equipment}</p>
                  </div>
                )}

                {/* --- Thể loại chụp (Styles) --- */}
                {styles && styles.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-white">
                      <Layers size={15} className="text-purple-500" />
                      {t.styles}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {styles.map((style, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-orange-50 dark:bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-500/20"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {socialLinks && Object.values(socialLinks).some(Boolean) && (
                  <div className="mb-5 flex gap-2">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-500 transition-all">
                        <Facebook size={14} className="text-blue-600" /> Facebook
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:border-pink-400 hover:text-pink-500 transition-all">
                        <Instagram size={14} className="text-pink-500" /> Instagram
                      </a>
                    )}
                    {socialLinks.website && (
                      <a href={socialLinks.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-500 transition-all">
                        <Globe size={14} className="text-indigo-500" /> Website
                      </a>
                    )}
                  </div>
                )}

                {/* Contact info */}
                <div className="mb-5 space-y-2">
                  {user?.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                      <Mail size={14} className="text-slate-400" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user?.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                      <Phone size={14} className="text-slate-400" />
                      <a href={`tel:${user.phoneNumber}`} className="hover:text-blue-500 transition-colors">
                        {user.phoneNumber}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* --- TABS --- */}
              <div className="sticky top-0 z-10 flex border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5">
                <button
                  onClick={() => { setActiveTab("photos"); setSelectedAlbumImages(null); }}
                  className={`flex items-center gap-1.5 py-3 mr-6 text-sm font-bold border-b-2 transition-all ${activeTab === "photos"
                      ? "border-orange-500 text-orange-500"
                      : "border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600"
                    }`}
                >
                  <Camera size={14} />
                  {t.tabPhotos}
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex items-center gap-1.5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === "reviews"
                      ? "border-orange-500 text-orange-500"
                      : "border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600"
                    }`}
                >
                  <Star size={14} />
                  {t.tabReviews}
                </button>
              </div>

              {/* --- TAB CONTENT --- */}
              <div className="px-5 py-5 pb-10">
                {activeTab === "photos" && (
                  albums.length > 0 ? (
                    selectedAlbumImages ? (
                      /* Album detail in drawer */
                      <div>
                        <button onClick={() => setSelectedAlbumImages(null)}
                          className="flex items-center gap-1.5 mb-4 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                          <ChevronDown size={13} className="rotate-90" /> Quay lại Albums
                        </button>
                        <p className="font-black text-sm mb-1">{selectedAlbumImages.album?.title}</p>
                        {selectedAlbumImages.album?.price_package && (
                          <p className="text-xs font-bold text-cyan-500 mb-3">{selectedAlbumImages.album.price_package.toLocaleString()} VNĐ</p>
                        )}
                        {selectedAlbumImages.images?.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {selectedAlbumImages.images.map((img, idx) => (
                              <div key={img._id || idx} onClick={() => setLightboxImg(getAvatarUrl(img.image_url) || img.image_url)}
                                className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800 cursor-pointer">
                                <img
                                  src={img.image_url?.startsWith("http") ? img.image_url : `http://localhost:3000${img.image_url}`}
                                  alt={img.caption || `Photo ${idx+1}`}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye size={18} className="text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-6 text-sm text-slate-400">Album chưa có ảnh</p>
                        )}
                      </div>
                    ) : (
                      /* Album list in drawer */
                      <div className="grid grid-cols-2 gap-2">
                        {albums.map(album => (
                          <div key={album._id}
                            onClick={async () => {
                              try {
                                const res = await aiRecommendService.getAlbumDetail(album._id);
                                if (res.success) setSelectedAlbumImages(res.data);
                              } catch(e) { console.error(e); }
                            }}
                            className="group cursor-pointer rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:shadow-md transition-all">
                            <div className="relative aspect-square overflow-hidden bg-slate-200 dark:bg-zinc-800">
                              {album.coverImageUrl ? (
                                <img
                                  src={album.coverImageUrl?.startsWith("http") ? album.coverImageUrl : `http://localhost:3000${album.coverImageUrl}`}
                                  alt={album.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Camera size={20} className="text-slate-300 dark:text-zinc-700" />
                                </div>
                              )}
                              <div className="absolute bottom-1 right-1 bg-black/60 rounded-full px-1.5 py-0.5 text-white text-[9px] font-bold">
                                {album.imageCount || 0}
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-[11px] font-black truncate text-slate-800 dark:text-zinc-100">{album.title}</p>
                              <p className="text-[9px] font-bold text-cyan-500 mt-0.5">{album.price_package?.toLocaleString()} VNĐ</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-center py-10 text-sm text-slate-400 dark:text-zinc-500">{t.noPhotos}</p>
                  )
                )}

                {activeTab === "reviews" && (
                  <div className="py-10 text-center">
                    <Star size={40} className="mx-auto mb-3 text-slate-200 dark:text-zinc-700" />
                    <p className="text-sm text-slate-400 dark:text-zinc-500">{t.noReviews}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          style={{ zIndex: 99998 }}
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Fullscreen view"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>,
    document.body
  );

};

export default PhotographerDrawer;
