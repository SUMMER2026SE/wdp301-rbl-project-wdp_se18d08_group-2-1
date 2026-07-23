// src/components/photographers/PhotographerProfile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import usePhotographers from "../../hooks/usePhotographers";
import { aiRecommendService } from "../../services/aiRecommendService";
import Swal from "sweetalert2";
import { photographerMarketplaceService } from "../../services/photographerService";
import { getPhotographerPackages } from "../../services/photographerPackageService";
import { bookingService } from "../../services/bookingService";
import ReviewList from "../review/ReviewList";

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
  ArrowLeft,
  Tag,
  DollarSign,
  Grid3X3,
  CreditCard,
  MessageSquare,
  X,
} from "lucide-react";

const PhotographerProfile = ({ language = "en" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { getPhotographerDetail, loading, error } = usePhotographers();
  const [photographer, setPhotographer] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [monthlyPackages, setMonthlyPackages] = useState([]);
  const [loadingMonthlyPackages, setLoadingMonthlyPackages] = useState(false);
  const [selectedAlbumDetail, setSelectedAlbumDetail] = useState(null); // { album, images }

  const handleStartChat = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        title: language === "vi" ? "Yêu cầu đăng nhập" : "Login required",
        text: language === "vi" ? "Vui lòng đăng nhập để bắt đầu trò chuyện." : "Please login to start chatting.",
        icon: "warning",
        confirmButtonText: language === "vi" ? "Đăng nhập" : "Login",
        confirmButtonColor: "#ff6b3b",
        showCancelButton: true,
        cancelButtonText: language === "vi" ? "Hủy" : "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }

    try {
      const recipientId = photographer?.user?._id;
      if (!recipientId) {
        Swal.fire(
          language === "vi" ? "Lỗi" : "Error",
          language === "vi" ? "Không tìm thấy thông tin tài khoản nhiếp ảnh gia." : "Photographer account details not found.",
          "error"
        );
        return;
      }

      // Check if current user is trying to chat with themselves
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch (_error) { return {}; } })();
      const currentUserId = localStorage.getItem("userId") || storedUser._id || storedUser.id || storedUser.userId;
      if (String(currentUserId || "") === String(recipientId)) {
        Swal.fire(
          language === "vi" ? "Thông báo" : "Notice",
          language === "vi" ? "Bạn không thể trò chuyện với chính mình." : "You cannot chat with yourself.",
          "info"
        );
        return;
      }

      Swal.fire({
        title: language === "vi" ? "Đang kết nối..." : "Connecting...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await photographerMarketplaceService.createConversation(recipientId);
      Swal.close();

      if (res && res.success && res.data) {
        navigate(res.data?._id ? `/chat?conversationId=${res.data._id}` : "/chat");
      } else {
        throw new Error(res?.message || "Failed to start conversation");
      }
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire(
        language === "vi" ? "Lỗi" : "Error",
        err.response?.data?.message || err.message,
        "error"
      );
    }
  };




  const labels = {
    en: {
      profile: "Photographer Profile",
      loading: "Loading photographer profile...",
      notFound: "Photographer not found",
      error: "Error loading profile",
      about: "Behind The Lens",
      styles: "Photography Styles",
      equipment: "Equipment",
      monthlyPackages: "Monthly Plans",
      monthlyPackagesIntro: "See the photographer's own recurring plan instead of a global subscription catalog.",
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
      monthlyPackages: "Gói tháng",
      monthlyPackagesIntro: "Xem gói định kỳ riêng của photographer thay vì một danh mục hội viên chung.",
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

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://photo-hub-be-project.vercel.app${url}`;
  };

  useEffect(() => {
    if (id) {
      const loadPhotographer = async () => {
        const data = await getPhotographerDetail(id);
        setPhotographer(data);

        // Tải danh sách Albums
        try {
          const albumRes = await aiRecommendService.getAlbumsByPhotographer(id);
          if (albumRes.success) {
            setAlbums(albumRes.data?.albums || []);
          }
        } catch (err) {
          console.error("Lỗi khi tải albums:", err);
        }

        // Tải danh sách Reviews
        try {
          const reviewRes = await bookingService.getPhotographerReviews(id);
          if (reviewRes.success && reviewRes.data) {
            setReviews(reviewRes.data.reviews || []);
          }
        } catch (err) {
          console.error("Lỗi khi tải reviews:", err);
        }
      };
      loadPhotographer();
    }
  }, [id, getPhotographerDetail]);

  useEffect(() => {
    let mounted = true;

    const loadMonthlyPackages = async () => {
      if (!id) return;
      setLoadingMonthlyPackages(true);
      try {
        const res = await getPhotographerPackages(id, { packageType: "MONTHLY" });
        if (!mounted) return;
        const list = res?.data?.data || res?.data || res?.packages || [];
        setMonthlyPackages(Array.isArray(list) ? list : []);
      } catch (err) {
        if (mounted) setMonthlyPackages([]);
      } finally {
        if (mounted) setLoadingMonthlyPackages(false);
      }
    };

    loadMonthlyPackages();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      photographer &&
      (routerLocation.state?.openBooking ||
        new URLSearchParams(routerLocation.search).get("book") === "true")
    ) {
      navigate(`/booking/${id}`, { replace: true });
    }
  }, [routerLocation, photographer, navigate, id]);

  const openAlbumDetail = async (album) => {
    try {
      const res = await aiRecommendService.getAlbumDetail(album._id);
      if (res.success) setSelectedAlbumDetail(res.data);
    } catch (err) {
      console.error("Lỗi tải chi tiết album:", err);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-orange-500" size={48} />
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
  } = photographer;

  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith("http://") || user.avatar.startsWith("https://")) {
      return user.avatar;
    }
    const BACKEND_URL = "https://photo-hub-be-project.vercel.app";
    const cleanPath = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  const avatarUrl = getAvatarUrl();

  return (
    /* ĐÃ NÂNG CẤP: Mở rộng width rộng hơn (96% màn hình, max là 1536px cực đại) */
    <div className="mx-auto w-[96%] max-w-[1536px] px-2 py-8 sm:px-4 lg:px-8 space-y-10 transition-all duration-300">

      {/* ================= HERO & HEADER SECTION ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50">
        <div className="relative h-80 w-full overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500">
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
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-orange-400 to-amber-500 shadow-2xl dark:border-gray-800 group">
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
                  <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 backdrop-blur-md dark:bg-orange-400/10 dark:text-orange-400 border border-orange-500/20">
                    <CheckCircle size={14} className="fill-orange-500/10 text-orange-500" />
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
              <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400">
                <span className="rounded-xl bg-orange-500/10 p-2 dark:bg-orange-500/20">
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
              <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400">
                <span className="rounded-xl bg-orange-500/10 p-2 dark:bg-orange-500/20">
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
                <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400">
                  <span className="rounded-xl bg-orange-500/10 p-2 dark:bg-orange-500/20">
                    <span className="text-lg font-black">đ</span>
                  </span>
                  <div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {Number(hourlyRate).toLocaleString('vi-VN')} đ/giờ
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
                <Camera size={22} className="text-orange-500" />
                {t.about}
              </h2>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line font-medium text-sm sm:text-base">
                {bio}
              </p>
            </div>
          )}

          {/* ================= ALBUM PORTFOLIO GALLERY ================= */}
          {albums.length > 0 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40 transition-all duration-300 hover:shadow-lg">
              {selectedAlbumDetail ? (
                /* ── Album Detail View ────────────────────────────────── */
                <div>
                  <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedAlbumDetail(null)}
                      className="flex items-center gap-1.5 text-sm font-bold text-orange-500 hover:text-orange-700 transition-colors"
                    >
                      <ArrowLeft size={15} /> Quay lại Albums
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAlbumDetail.album?.category?.name && (
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 rounded-full px-2.5 py-0.5 border border-orange-500/15">
                          <Tag size={9} /> {selectedAlbumDetail.album.category.name}
                        </span>
                      )}
                      {selectedAlbumDetail.album?.styleTags?.map(tag => (
                        <span key={tag._id || tag} className="text-[10px] font-bold rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 border border-orange-500/15">
                          #{tag.name || tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
                      <ImageIcon size={20} className="text-orange-500" />
                      {selectedAlbumDetail.album?.title}
                    </h3>
                    {selectedAlbumDetail.album?.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedAlbumDetail.album.description}</p>
                    )}
                    {selectedAlbumDetail.album?.price_package && (
                      <p className="flex items-center gap-1 text-sm font-black text-orange-600 dark:text-orange-400 mt-2">
                        <DollarSign size={13} /> {selectedAlbumDetail.album.price_package.toLocaleString()} VNĐ
                      </p>
                    )}
                  </div>
                  {selectedAlbumDetail.images?.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {selectedAlbumDetail.images.map((img, index) => (
                        <div key={img._id || index} onClick={() => setSelectedImg(getFullUrl(img.image_url))}
                          className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                          <img src={getFullUrl(img.image_url)} alt={img.caption || `Photo ${index + 1}`}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-center p-4">
                            <button onClick={e => { e.stopPropagation(); setSelectedImg(getFullUrl(img.image_url)); }}
                              className="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-bold text-white border border-white/20 hover:bg-white hover:text-black transition-all">
                              <Eye size={14} /> {t.viewProject}
                            </button>
                          </div>
                          {img.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs font-semibold text-white/90 truncate">{img.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-10 text-sm text-gray-400">Album này chưa có ảnh</p>
                  )}
                </div>
              ) : (
                /* ── Albums List View ─────────────────────────────────── */
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                      <ImageIcon size={22} className="text-orange-500" />
                      {t.gallery}
                    </h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {albums.length} Albums
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                    {albums.map(album => (
                      <div key={album._id} onClick={() => openAlbumDetail(album)}
                        className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="relative aspect-[16/9] overflow-hidden bg-gray-200 dark:bg-gray-800">
                          {album.coverImageUrl ? (
                            <img src={getFullUrl(album.coverImageUrl)} alt={album.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Grid3X3 size={28} className="text-gray-300 dark:text-gray-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 text-xs font-bold text-white border border-white/20">
                              <Eye size={13} /> Xem album
                            </span>
                          </div>
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-[10px] font-bold">
                            <ImageIcon size={9} /> {album.imageCount || 0}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-black text-sm text-gray-900 dark:text-white truncate">{album.title}</p>
                          {album.category?.name && (
                            <p className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 mt-1">
                              <Tag size={9} /> {album.category.name}
                            </p>
                          )}
                          <p className="text-xs font-black text-orange-600 dark:text-orange-400 mt-1.5">
                            {album.price_package?.toLocaleString()} VNĐ
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    className="rounded-xl bg-gradient-to-r from-orange-500/5 to-orange-600/5 hover:from-orange-500/10 hover:to-orange-600/10 px-4 py-2 text-sm font-semibold text-orange-700 border border-orange-500/10 dark:text-orange-300 dark:border-orange-400/20 transition-all duration-300 cursor-default"
                  >
                    #{style.name}
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

          {/* Đánh giá từ khách hàng */}
          {(loadingMonthlyPackages || monthlyPackages.length > 0) && (
            <div className="rounded-3xl border border-orange-200/70 bg-gradient-to-br from-white to-orange-50/60 p-6 shadow-md transition-all duration-300 hover:shadow-lg dark:border-orange-500/20 dark:from-gray-800 dark:to-gray-900">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                    <CreditCard size={22} className="text-orange-500" />
                    {t.monthlyPackages}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t.monthlyPackagesIntro}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/subscriptions?photographerId=${id}`)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-orange-500/20 dark:bg-white/5 dark:text-orange-300"
                >
                  {language === "vi" ? "Mở trang hội viên" : "Open membership page"}
                </button>
              </div>

              {loadingMonthlyPackages ? (
                <div className="rounded-2xl border border-dashed border-orange-200 p-6 text-sm text-gray-500 dark:border-orange-500/20 dark:text-gray-400">
                  {language === "vi" ? "Đang tải gói tháng..." : "Loading monthly plans..."}
                </div>
              ) : monthlyPackages.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {monthlyPackages.slice(0, 2).map((pkg) => (
                    <div
                      key={pkg._id}
                      className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
                            {language === "vi" ? "Gói tháng" : "Monthly plan"}
                          </p>
                          <h4 className="mt-1 text-lg font-black text-gray-900 dark:text-white">
                            {pkg.title}
                          </h4>
                        </div>
                        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 dark:text-orange-300">
                          {Number(pkg.price || 0).toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {pkg.description || (language === "vi" ? "Gói tháng riêng của photographer này." : "The photographer's recurring plan.")}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                          {pkg.commitmentMonths || 1} {language === "vi" ? "tháng cam kết" : "months commitment"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                          {pkg.sessionsPerMonth || 1} {language === "vi" ? "buổi/tháng" : "sessions/month"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-orange-200 p-5 text-sm text-gray-500 dark:border-orange-500/20 dark:text-gray-400">
                  {language === "vi"
                    ? "Photographer này chưa có gói tháng công khai."
                    : "This photographer does not have a public monthly plan yet."}
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-md dark:bg-gray-800 border border-gray-100/50 dark:border-gray-700/40 transition-all duration-300 hover:shadow-lg">
            <h3 className="mb-5 flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
              <Star size={22} className="text-amber-500 fill-amber-500" />
              {language === "vi" ? "Đánh giá từ khách hàng" : "Client Reviews"}
            </h3>
            <ReviewList reviews={reviews} language={language} />
          </div>
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
                      className="font-semibold text-gray-700 hover:text-orange-500 dark:text-gray-200 dark:hover:text-orange-400 transition"
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

          <button
            onClick={() => navigate(`/booking/${id}`)}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 px-6 py-4 font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300 tracking-wide text-base"
          >
            {t.bookNow}
          </button>

          <button
            onClick={() => navigate(`/subscriptions?photographerId=${id}`)}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-orange-500 bg-white hover:bg-orange-50 dark:bg-transparent dark:hover:bg-orange-500/10 px-6 py-3.5 font-bold text-orange-500 shadow-md hover:shadow-lg hover:shadow-orange-500/5 active:scale-[0.98] transition-all duration-300 tracking-wide text-base"
          >
            <CreditCard size={18} />
            {language === "vi" ? "Xem gói tháng" : "View monthly plan"}
          </button>

          <button
            onClick={handleStartChat}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-orange-500 bg-white hover:bg-orange-50 dark:bg-transparent dark:hover:bg-orange-500/10 px-6 py-3.5 font-bold text-orange-500 shadow-md hover:shadow-lg hover:shadow-orange-500/5 active:scale-[0.98] transition-all duration-300 tracking-wide text-base"
          >
            <MessageSquare size={18} />
            {language === "vi" ? "Trò chuyện ngay" : "Chat Now"}
          </button>
        </div>

      </div>
      {/* ================= 👉 THÊM VÀO ĐÂY: LIGHTBOX MODAL FULL SCREEN ================= */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
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
            <button
              onClick={() => setSelectedImg(null)}
              className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotographerProfile;

