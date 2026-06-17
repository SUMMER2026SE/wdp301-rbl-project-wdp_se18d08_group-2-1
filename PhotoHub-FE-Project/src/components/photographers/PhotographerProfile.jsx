// src/components/photographers/PhotographerProfile.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import usePhotographers from "../../hooks/usePhotographers";
import { aiRecommendService } from "../../services/aiRecommendService";

import {
  Star,
  MapPin,
  Award,
  BookOpen,
  Mail,
  Phone,
  Loader,
  AlertCircle,
  Facebook,
  Instagram,
  Globe,
  CheckCircle,
  Camera,
  Layers,
  Cpu,
  Image as ImageIcon,
  Eye,
} from "lucide-react";

const PhotographerProfile = ({ language = "en" }) => {
  const { id } = useParams();
  const { getPhotographerDetail, loading, error } = usePhotographers();
  const [photographer, setPhotographer] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [realPortfolios, setRealPortfolios] = useState([]);


  // Giả lập danh sách ảnh portfolio nếu DB chưa có (Thay bằng data thật từ photographer.portfolio sau này)
  const dummyGallery = [
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520390138845-12006b42937c?auto=format&fit=crop&w=800&q=80",
  ];

  const labels = {
    en: {
      profile: "Photographer Profile",
      loading: "Loading photographer profile...",
      notFound: "Photographer not found",
      error: "Error loading profile",
      about: "Behind The Lens",
      styles: "Photography Styles",
      equipment: "Equipment",
      experience: "Experience",
      completedBookings: "Completed Shoots",
      rating: "Rating",
      reviews: "reviews",
      years: "years",
      socialLinks: "Social Networks",
      bookNow: "Book A Session Now",
      contact: "Direct Contact",
      availability: "Status",
      available: "Available For Hire",
      unavailable: "Fully Booked",
      verified: "Verified Pro",
      unverified: "Unverified",
      pending: "Pending Verification",
      hourlyRate: "Hourly Rate",
      gallery: "Featured Portfolio",
      viewProject: "View Fullscreen",
    },
    vi: {
      profile: "Hồ Sơ Nhiếp Ảnh Gia",
      loading: "Đang tải hồ sơ...",
      notFound: "Không tìm thấy nhiếp ảnh gia",
      error: "Lỗi khi tải hồ sơ",
      about: "Câu Chuyện Phía Sau Ống Kính",
      styles: "Phong Cách Nhiếp Ảnh",
      equipment: "Thiết Bị",
      experience: "Kinh Nghiệm",
      completedBookings: "Lịch Chụp Hoàn Thành",
      rating: "Đánh Giá",
      reviews: "đánh giá",
      years: "năm",
      socialLinks: "Mạng Xã Hội",
      bookNow: "Đặt Lịch Chụp Ngay",
      contact: "Liên Hệ Trực Tiếp",
      availability: "Trạng Thái",
      available: "Sẵn Sàng Nhận Lịch",
      unavailable: "Đang Bận",
      verified: "Đã Xác Minh Pro",
      unverified: "Chưa Xác Minh",
      pending: "Đang Xác Minh",
      hourlyRate: "Mức Giá / Giờ",
      gallery: "Tác Phẩm Nổi Bật",
      viewProject: "Xem Toàn Màn Hình",
    },
  };

  const t = labels[language] || labels.en;

  useEffect(() => {
  if (id) {
    const loadPhotographer = async () => {
      const data = await getPhotographerDetail(id);
      setPhotographer(data);

      // Tải danh sách ảnh portfolio thực tế
      try {
        const portfolioRes = await aiRecommendService.getPortfolios(id);
        if (portfolioRes.success && portfolioRes.data?.portfolios) {
          // Lấy ra danh sách url ảnh đầy đủ
          const urls = portfolioRes.data.portfolios.map(p => {
            const imgUrl = p.image_url;
            return imgUrl.startsWith("http") ? imgUrl : `http://localhost:3000${imgUrl}`;
          });
          setRealPortfolios(urls);
        }
      } catch (err) {
        console.error("Lỗi khi tải ảnh portfolio thực tế:", err);
      }
    };
    loadPhotographer();
  }
}, [id, getPhotographerDetail]);


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-blue-500" size={48} />
          <p className="text-sm font-medium text-gray-500 animate-pulse">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !photographer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-12 text-center backdrop-blur-md dark:border-red-900/30 dark:bg-red-900/10">
          <AlertCircle size={64} className="mb-4 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-red-700 dark:text-red-400">
            {error ? t.error : t.notFound}
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  const {
    user,
    displayName,
    location,
    experienceYears,
    equipment,
    bio,
    styles,
    socialLinks,
    averageRating,
    completedBookings,
    totalReviews,
    verificationStatus,
    isAvailable,
    hourlyRate,
    portfolio = realPortfolios.length > 0 ? realPortfolios : dummyGallery,
 // Sử dụng ảnh từ server, nếu trống sẽ lấy list dummy trên
  } = photographer;

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
    /* ĐÃ NÂNG CẤP: Mở rộng width rộng hơn (96% màn hình, max là 1536px cực đại) */
    <div className="mx-auto w-[96%] max-w-[1536px] px-2 py-8 sm:px-4 lg:px-8 space-y-10 transition-all duration-300">

      {/* ================= HERO & HEADER SECTION ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50">
        <div className="relative h-80 w-full overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover opacity-30 blur-xl scale-110"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        <div className="relative -mt-24 px-6 pb-8 sm:px-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left w-full md:w-auto">
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-blue-400 to-purple-500 shadow-2xl dark:border-gray-800 group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white">
                  {displayName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-2 pb-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">
                  {displayName}
                </h1>
                {verificationStatus === "VERIFIED" && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 backdrop-blur-md dark:bg-blue-400/10 dark:text-blue-400 border border-blue-500/20">
                    <CheckCircle size={14} className="fill-blue-500/10" />
                    {t.verified}
                  </span>
                )}
              </div>
              {user?.email && (
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={14} />
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 pb-2">
            <div
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-sm shadow-md transition-all duration-300 ${isAvailable
                ? "bg-green-500 text-white shadow-green-500/20 dark:bg-green-600"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
            >
              <div className={`h-2 w-2 rounded-full ${isAvailable ? "bg-white animate-ping" : "bg-gray-400"}`} />
              {isAvailable ? t.available : t.unavailable}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-6 dark:border-gray-700/60 dark:bg-gray-900/30">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="group rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2.5 text-amber-500">
                <span className="rounded-xl bg-amber-500/10 p-2 dark:bg-amber-500/20">
                  <Star size={20} className="fill-amber-500" />
                </span>
                <div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {averageRating?.toFixed(1) || "0"}
                  </div>
                  <p className="text-xs font-medium text-gray-400">
                    {totalReviews || 0} {t.reviews}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2.5 text-green-600 dark:text-green-400">
                <span className="rounded-xl bg-green-500/10 p-2 dark:bg-green-500/20">
                  <Award size={20} />
                </span>
                <div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {experienceYears || "0"}
                  </div>
                  <p className="text-xs font-medium text-gray-400">
                    {t.years} {t.experience.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <span className="rounded-xl bg-blue-500/10 p-2 dark:bg-blue-500/20">
                  <BookOpen size={20} />
                </span>
                <div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {completedBookings || "0"}
                  </div>
                  <p className="text-xs font-medium text-gray-400">
                    {t.completedBookings}
                  </p>
                </div>
              </div>
            </div>

            {hourlyRate && (
              <div className="group rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400">
                  <span className="rounded-xl bg-purple-500/10 p-2 dark:bg-purple-500/20">
                    <span className="text-lg font-black">$</span>
                  </span>
                  <div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      ${hourlyRate}
                    </div>
                    <p className="text-xs font-medium text-gray-400">
                      {t.hourlyRate}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT SECTION ================= */}
      {/* ĐÃ NÂNG CẤP: Thay đổi tỉ lệ grid thành 3:1 (lg:grid-cols-4) giúp đẩy khung bên trái rộng hơn nữa */}
      <div className="grid gap-8 lg:grid-cols-4 items-start">

        {/* Khối thông tin bên trái (Chi tiết hồ sơ) */}
        <div className="space-y-8 lg:col-span-3">

          {/* Giới thiệu bản thân */}
          {bio && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40 transition-all duration-300 hover:shadow-lg">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                <Camera size={22} className="text-blue-500" />
                {t.about}
              </h2>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line font-medium text-sm sm:text-base">
                {bio}
              </p>
            </div>
          )}

          {/* ================= ĐÃ THÊM: KHU VỰC TRIỂN LÃM ẢNH (PORTFOLIO GALLERY) ================= */}
          {portfolio && portfolio.length > 0 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                  <ImageIcon size={22} className="text-indigo-500" />
                  {t.gallery}
                </h3>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {portfolio.length} Photos
                </span>
              </div>

              {/* Grid hình ảnh Masonry-style mượt mà */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {portfolio.map((imgUrl, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImg(imgUrl)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <img
                      src={imgUrl}
                      alt={`Portfolio item ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Hiệu ứng lớp phủ Dark Overlay mang tính điện ảnh khi hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-center p-4">
                      <button onClick={(e) => {
                        e.stopPropagation(); // 👉 THÊM: Ngăn sự kiện nổi bọt để không lỗi click đúp
                        setSelectedImg(imgUrl);
                      }}
                        className="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-bold text-white tracking-wide border border-white/20 hover:bg-white hover:text-black transition-all duration-300">
                        <Eye size={14} />
                        {t.viewProject}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phong cách nhiếp ảnh */}
          {styles && styles.length > 0 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40 transition-all duration-300 hover:shadow-lg">
              <h3 className="mb-5 flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                <Layers size={22} className="text-purple-500" />
                {t.styles}
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {styles.map((style, idx) => (
                  <span
                    key={idx}
                    className="rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-500/10 dark:text-blue-300 dark:border-blue-400/20 transition-all duration-300 cursor-default"
                  >
                    #{style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Thiết bị Gear */}
          {equipment && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40 transition-all duration-300 hover:shadow-lg">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                <Cpu size={22} className="text-green-500" />
                {t.equipment}
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                {equipment}
              </p>
            </div>
          )}
        </div>

        {/* Khối liên hệ bên phải (Sidebar) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-3xl bg-white p-6 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40">
            <h3 className="mb-4 text-lg font-black text-gray-900 dark:text-white">
              {t.contact}
            </h3>
            <div className="space-y-4">
              {location && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={20} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Location</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">{location}</p>
                  </div>
                </div>
              )}
              {user?.phoneNumber && (
                <div className="flex items-start gap-3 text-sm">
                  <Phone size={20} className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Phone Call</p>
                    <a
                      href={`tel:${user.phoneNumber}`}
                      className="font-semibold text-gray-700 hover:text-blue-500 dark:text-gray-200 dark:hover:text-blue-400 transition"
                    >
                      {user.phoneNumber}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {socialLinks && Object.keys(socialLinks).some((k) => socialLinks[k]) && (
            <div className="rounded-3xl bg-white p-6 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40">
              <h3 className="mb-4 text-lg font-black text-gray-900 dark:text-white">
                {t.socialLinks}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl p-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-500/10 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-all duration-200"
                  >
                    <Facebook size={20} className="text-blue-600" />
                    Facebook
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl p-2.5 text-sm font-semibold text-gray-700 hover:bg-pink-500/10 hover:text-pink-600 dark:text-gray-300 dark:hover:bg-pink-500/20 dark:hover:text-pink-400 transition-all duration-200"
                  >
                    <Instagram size={20} className="text-pink-500" />
                    Instagram
                  </a>
                )}
                {socialLinks.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl p-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-500/10 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:text-white transition-all duration-200"
                  >
                    <Globe size={20} className="text-indigo-500" />
                    Portfolio Website
                  </a>
                )}
              </div>
            </div>
          )}

          <button className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300 tracking-wide text-base">
            {t.bookNow}
          </button>
        </div>

      </div>
      {/* ================= 👉 THÊM VÀO ĐÂY: LIGHTBOX MODAL FULL SCREEN ================= */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
          onClick={() => setSelectedImg(null)} // Click ra ngoài vùng ảnh để đóng
        >
          {/* Khung chứa ảnh Full Screen */}
          <div className="relative max-h-[90vh] max-w-[95vw] overflow-hidden rounded-2xl shadow-2xl">
            <img
              src={selectedImg}
              alt="Fullscreen view"
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl select-none"
              onClick={(e) => e.stopPropagation()} // Click vào chính bức ảnh thì không bị đóng nhầm
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotographerProfile;