import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, MapPin, DollarSign, Clock, User, AlertCircle, CreditCard, Ban, FolderHeart, Eye, ChevronLeft, ChevronRight, X, Star, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";
import { bookingService } from "../services/bookingService";

export default function CustomerBookingList({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(""); // empty means 'ALL'
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // States for viewing album
  const [selectedAlbum, setSelectedAlbum] = useState(null); // { title, images: [...] }
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null); // index for fullscreen view

  const t = {
    vi: {
      title: "Lịch Sử Đặt Lịch Chụp Ảnh",
      statusAll: "Tất cả",
      statusPending: "Chờ xác nhận",
      statusAccepted: "Đã chấp nhận (Chờ thanh toán)",
      statusConfirmed: "Đã thanh toán (Sắp diễn ra)",
      statusCompleted: "Đã hoàn thành",
      statusRejected: "Bị từ chối",
      statusCancelled: "Đã hủy",
      noBookings: "Bạn chưa có lịch đặt chụp ảnh nào.",
      location: "Địa điểm:",
      photographer: "Nhiếp ảnh gia:",
      time: "Thời gian:",
      price: "Tổng tiền:",
      status: "Trạng thái:",
      cancelBtn: "Hủy lịch đặt",
      payBtn: "Thanh toán cọc (PayOS)",
      viewAlbumBtn: "Xem Album ảnh hoàn thành",
      rejectionReason: "Lý do từ chối:",
      cancelConfirm: "Bạn có chắc chắn muốn hủy lịch đặt này?",
      cancelConfirmSub: "Hành động này không thể hoàn tác!",
      cancelSuccess: "Hủy lịch đặt thành công!",
      payRedirectMsg: "Hệ thống đang chuyển hướng bạn đến cổng thanh toán PayOS...",
      error: "Lỗi",
      success: "Thành công",
      loading: "Đang tải danh sách...",
      bookingDate: "Ngày đặt:",
      note: "Ghi chú của bạn:",
      noNote: "Không có ghi chú",
      albumTitle: "Album Ảnh Hoàn Thành",
      albumEmpty: "Nhiếp ảnh gia chưa đăng ảnh nào trong album này.",
      close: "Đóng",
      reviewBtn: "Đánh giá",
      reviewedBtn: "Đã đánh giá",
      reviewTitle: "Đánh giá nhiếp ảnh gia",
      reviewSuccess: "Gửi đánh giá thành công!",
      ratingRequired: "Vui lòng chọn số sao đánh giá",
      commentRequired: "Vui lòng nhập nội dung đánh giá",
    },
    en: {
      title: "My Booking History",
      statusAll: "All",
      statusPending: "Pending Approval",
      statusAccepted: "Accepted (Awaiting Payment)",
      statusConfirmed: "Paid (Upcoming)",
      statusCompleted: "Completed",
      statusRejected: "Rejected",
      statusCancelled: "Cancelled",
      noBookings: "You have no booking records.",
      location: "Location:",
      photographer: "Photographer:",
      time: "Time:",
      price: "Total Price:",
      status: "Status:",
      cancelBtn: "Cancel Booking",
      payBtn: "Pay Deposit (PayOS)",
      viewAlbumBtn: "View Completed Album",
      rejectionReason: "Rejection Reason:",
      cancelConfirm: "Are you sure you want to cancel this booking?",
      cancelConfirmSub: "This action cannot be undone!",
      cancelSuccess: "Booking cancelled successfully!",
      payRedirectMsg: "Redirecting to PayOS checkout page...",
      error: "Error",
      success: "Success",
      loading: "Loading bookings...",
      bookingDate: "Booked On:",
      note: "Your Notes:",
      noNote: "No notes",
      albumTitle: "Completed Photo Album",
      albumEmpty: "Photographer hasn't uploaded any photos to this album yet.",
      close: "Close",
      reviewBtn: "Review",
      reviewedBtn: "Reviewed",
      reviewTitle: "Rate Photographer",
      reviewSuccess: "Review submitted successfully!",
      ratingRequired: "Please select a rating",
      commentRequired: "Please write a comment",
    },
  }[language];

  useEffect(() => {
    fetchBookings(pagination.page, activeStatus);
  }, [pagination.page, activeStatus]);

  const fetchBookings = async (page = 1, status = "") => {
    setLoading(true);
    try {
      const res = await bookingService.getMyBookings({
        page,
        limit: 6,
        status: status || undefined,
      });
      if (res.success) {
        setBookings(res.data.bookings || []);
        setPagination({
          page: res.data.pagination.page,
          totalPages: res.data.pagination.totalPages,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    const result = await Swal.fire({
      title: t.cancelConfirm,
      text: t.cancelConfirmSub,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: language === "vi" ? "Đồng ý hủy" : "Yes, cancel",
      cancelButtonText: language === "vi" ? "Đóng" : "Close",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });

    if (result.isConfirmed) {
      try {
        const res = await bookingService.cancelBooking(bookingId);
        if (res.success) {
          if (res.data) {
            setBookings((current) =>
              current
                .map((booking) => (booking._id === bookingId ? { ...booking, ...res.data } : booking))
                .filter((booking) => !activeStatus || booking.status === activeStatus)
            );
          }
          Swal.fire(t.success, t.cancelSuccess, "success");
          fetchBookings(pagination.page, activeStatus);
        }
      } catch (err) {
        Swal.fire(t.error, err.response?.data?.message || err.message, "error");
      }
    }
  };

  const handlePayment = async (bookingId) => {
    Swal.fire({
      title: t.payRedirectMsg,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });

    try {
      const res = await bookingService.createPaymentLink(bookingId);
      if (res.success && res.data.paymentLink) {
        window.location.href = res.data.paymentLink; // Redirect to PayOS
      } else {
        throw new Error(language === "vi" ? "Không tạo được link thanh toán" : "Failed to create payment link");
      }
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  const handleViewAlbum = async (booking) => {
    if (!booking.finalAlbum) return;

    setAlbumLoading(true);
    try {
      const res = await bookingService.getBookingDetail(booking._id);
      // Backend populate finalAlbum. Let's inspect booking detail
      const populatedBooking = res.data || res;

      // Fetch the actual album images from the backend if not fully populated
      // Or if the backend returns it populated in finalAlbum.
      // Wait, let's look at getAlbum in photographerMarketplaceService
      const albumRes = await bookingService.getBookingDetail(booking._id);
      // Wait, in photographerMarketplaceService, there is getAlbum(bookingId) which is GET /api/photographer/albums/:bookingId. Let's see if we can use bookingDetail finalAlbum
      let images = [];
      let albumTitle = booking.title;

      if (populatedBooking.finalAlbum) {
        // finalAlbum is populated or is an ID. Let's see if we can get it via photographerMarketplaceService.getAlbum
        // Let's call GET /api/photographer/albums/${booking._id} (Since the route might be shared or public? Let's check.)
        // Actually, we can fetch album details or populatedBooking.finalAlbum has images.
        // Let's check populatedBooking.finalAlbum:
        const finalAlbum = populatedBooking.finalAlbum;
        albumTitle = finalAlbum.title || booking.title;
        // Wait, let's load album images from BE.
        // Let's look at user view:
        const response = await fetch(`http://localhost:3000/api/photographer/albums/${booking._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        });
        const albumData = await response.json();
        if (albumData.success && albumData.data) {
          images = albumData.data.images || [];
        } else {
          images = finalAlbum.images || [];
        }
      }

      setSelectedAlbum({
        title: albumTitle,
        images: images,
      });
      setShowAlbumModal(true);
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.message, "error");
    } finally {
      setAlbumLoading(false);
    }
  };

  const handleReview = async (bookingId) => {
    let selectedRating = 5;
    const result = await Swal.fire({
      title: t.reviewTitle,
      html: `
        <div class="flex justify-center gap-2 my-4" id="swal-stars">
          ${[1, 2, 3, 4, 5].map(star => `
            <span data-val="${star}" class="cursor-pointer text-4xl text-amber-400 star-btn" style="transition: all 0.2s;">★</span>
          `).join('')}
        </div>
        <textarea id="swal-comment" class="w-full h-24 p-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="${language === 'vi' ? 'Nhập nhận xét của bạn...' : 'Write your review here...'}"></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: language === "vi" ? "Gửi" : "Submit",
      cancelButtonText: language === "vi" ? "Hủy" : "Cancel",
      confirmButtonColor: "#f97316",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
      didOpen: () => {
        const container = document.getElementById("swal-stars");
        const stars = container.querySelectorAll(".star-btn");
        const updateStars = (rating) => {
          selectedRating = rating;
          stars.forEach(s => {
            const val = parseInt(s.getAttribute("data-val"));
            if (val <= rating) {
              s.innerHTML = "★";
              s.style.color = "#fbbf24";
              s.style.transform = "scale(1.15)";
            } else {
              s.innerHTML = "☆";
              s.style.color = "#94a3b8";
              s.style.transform = "scale(1)";
            }
          });
        };
        stars.forEach(s => {
          s.addEventListener("click", () => {
            const val = parseInt(s.getAttribute("data-val"));
            updateStars(val);
          });
        });
        updateStars(5);
      },
      preConfirm: () => {
        const comment = document.getElementById("swal-comment").value;
        if (!comment.trim()) {
          Swal.showValidationMessage(t.commentRequired);
          return false;
        }
        return { rating: selectedRating, comment: comment.trim() };
      }
    });

    if (result.isConfirmed) {
      const { rating, comment } = result.value;
      try {
        const res = await bookingService.createReview(bookingId, rating, comment);
        if (res.success) {
          Swal.fire(t.success, t.reviewSuccess, "success");
          fetchBookings(pagination.page, activeStatus);
        }
      } catch (err) {
        Swal.fire(t.error, err.response?.data?.message || err.message, "error");
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      accepted: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      confirmed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return `px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${badges[status] || "bg-gray-500/10 text-gray-400"}`;
  };

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:3000${url}`;
  };

  const inputClass = isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900";
  const cardBgClass = isDark ? "bg-[#121214]/60 border-white/[0.06] hover:border-white/[0.1] shadow-xl" : "bg-white border-slate-100 shadow-md";

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-200/50 dark:border-white/[0.06] pb-4">
        <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: "", label: t.statusAll },
            { id: "pending", label: t.statusPending },
            { id: "accepted", label: t.statusAccepted },
            { id: "confirmed", label: t.statusConfirmed },
            { id: "completed", label: t.statusCompleted },
            { id: "rejected", label: t.statusRejected },
            { id: "cancelled", label: t.statusCancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveStatus(tab.id);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeStatus === tab.id
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : isDark
                  ? "hover:bg-white/[0.04] text-slate-400 hover:text-white border border-white/5"
                  : "hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Booking List Container */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
          <AlertCircle size={48} className="mb-3 opacity-40 text-orange-500 animate-pulse" />
          <p className="text-sm font-semibold">{t.noBookings}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <div key={booking._id} className={`p-6 rounded-3xl border transition-all duration-300 ${cardBgClass} flex flex-col justify-between`}>
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/50 dark:border-white/[0.06] pb-3">
                    <div>
                      <h3 className="font-extrabold text-lg tracking-tight line-clamp-1">{booking.title}</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                        {t.bookingDate} {new Date(booking.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                      </p>
                    </div>
                    <div>
                      <span className={getStatusBadge(booking.status)}>{booking.status}</span>
                    </div>
                  </div>

                  {/* Booking Info Grid */}
                  <div className="space-y-2 text-sm">
                    {/* Photographer Info */}
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-orange-500" />
                      <div className="flex items-center gap-2">
                        <strong>{t.photographer}</strong>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {booking.photographer?.fullName || booking.photographer?.email}
                        </span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <strong>{t.time}</strong>
                        <div className="font-semibold text-slate-700 dark:text-zinc-200 text-xs sm:text-sm mt-0.5">
                          <div>📅 {new Date(booking.start).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</div>
                          <div className="opacity-90">🕒 {new Date(booking.start).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <strong>{t.location}</strong>
                        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-sm mt-0.5">{booking.location}</p>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-200/50 dark:border-white/[0.03] text-xs">
                      <span className="text-slate-400 block mb-1 font-bold">{t.note}</span>
                      <p className="italic text-slate-600 dark:text-slate-300 whitespace-pre-line">
                        {booking.note || t.noNote}
                      </p>
                    </div>

                    {/* Rejection Reason (if rejected) */}
                    {booking.status === "rejected" && booking.rejectReason && (
                      <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                        <span className="font-bold block mb-1">❌ {t.rejectionReason}</span>
                        <p className="font-semibold">{booking.rejectReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-5 border-t border-slate-200/50 dark:border-white/[0.06]">

                  {/* Price */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                      {t.price}
                    </span>

                    {booking.discountAmount > 0 ? (
                      <div className="mt-1">
                        <p className="text-xs text-slate-400 line-through">
                          {booking.price.toLocaleString()} VNĐ
                        </p>

                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <p className="text-2xl font-black text-rose-500">
                            {booking.finalPrice.toLocaleString()} VNĐ
                          </p>

                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            -{Number(booking.discountAmount).toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-2xl font-black text-rose-500 mt-1">
                        {booking.price.toLocaleString()} VNĐ
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {/* Hủy */}
                    {["pending", "accepted"].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="w-full h-11 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                      >
                        <Ban size={16} />
                        {t.cancelBtn}
                      </button>
                    )}

                    {/* Thanh toán */}
                    {booking.status === "accepted" && (
                      <button
                        onClick={() => handlePayment(booking._id)}
                        className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 font-semibold text-sm"
                      >
                        <CreditCard size={16} />
                        {t.payBtn}
                      </button>
                    )}

                    {/* Xem album */}
                    {booking.status === "completed" && booking.finalAlbum && (
                      <button
                        onClick={() => handleViewAlbum(booking)}
                        disabled={albumLoading}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:brightness-110 text-white transition-all shadow-md flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-50"
                      >
                        {t.viewAlbumBtn}
                      </button>
                    )}

                    {/* Đánh giá */}
                    {booking.status === "completed" &&
                      (booking.isReviewed ? (
                        <div className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center gap-2 font-semibold text-sm">
                          <CheckCircle size={16} className="text-emerald-500" />
                          {t.reviewedBtn}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleReview(booking._id)}
                          className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md flex items-center justify-center gap-2 font-semibold text-sm"
                        >
                          <Star size={16} className="fill-white" />
                          {t.reviewBtn}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className={`p-3 rounded-2xl border transition-all ${pagination.page === 1
                  ? "opacity-40 cursor-not-allowed"
                  : isDark
                    ? "border-white/5 hover:bg-white/5"
                    : "border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-extrabold text-sm text-slate-500">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className={`p-3 rounded-2xl border transition-all ${pagination.page === pagination.totalPages
                  ? "opacity-40 cursor-not-allowed"
                  : isDark
                    ? "border-white/5 hover:bg-white/5"
                    : "border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Album Viewer Modal */}
      {showAlbumModal && selectedAlbum && createPortal(
        <div className="fixed inset-0 z-[110] flex flex-col bg-slate-950/98 p-6 md:p-10 backdrop-blur-2xl overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-5 max-w-6xl w-full mx-auto text-white">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-400 border border-orange-500/15 mb-2">
                <FolderHeart size={12} />
                {t.albumTitle}
              </span>
              <h3 className="text-2xl font-black tracking-tight">{selectedAlbum.title}</h3>
            </div>
            <button
              onClick={() => {
                setShowAlbumModal(false);
                setSelectedAlbum(null);
              }}
              className="p-3 rounded-full border border-white/10 bg-white/5 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 text-slate-300 flex items-center justify-center"
              aria-label={t.close}
              title={t.close}
            >
              <X size={20} />
            </button>
          </div>

          {/* Album content */}
          <div className="flex-1 max-w-6xl w-full mx-auto overflow-y-auto py-8">
            {selectedAlbum.images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FolderHeart size={48} className="mb-4 text-slate-600 animate-pulse" />
                <p className="text-sm font-semibold">{t.albumEmpty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-2">
                {selectedAlbum.images.map((img, index) => (
                  <div
                    key={img._id || index}
                    onClick={() => setLightboxIndex(index)}
                    className="group relative aspect-square overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] cursor-pointer transition-all duration-500 ease-out"
                  >
                    <img
                      src={getFullUrl(img.url || img.image_url)}
                      alt={img.caption || `Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="p-3 rounded-full bg-white/10 border border-white/20 text-white scale-90 group-hover:scale-100 transition-all duration-300">
                        <Eye size={20} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lightbox for fullscreen image */}
          {lightboxIndex !== null && selectedAlbum.images[lightboxIndex] && (
            <div
              className="fixed inset-0 z-[120] bg-black/98 flex items-center justify-center p-4 animate-fadeIn"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={lightboxIndex === 0}
                className="absolute left-6 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-orange-500 hover:border-orange-500 text-white disabled:opacity-20 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <ChevronLeft size={28} />
              </button>

              <div className="relative max-h-[85vh] max-w-[85vw] flex flex-col items-center">
                <img
                  src={getFullUrl(selectedAlbum.images[lightboxIndex].url || selectedAlbum.images[lightboxIndex].image_url)}
                  alt="Fullscreen"
                  className="max-h-[80vh] max-w-[80vw] object-contain rounded-3xl select-none shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                />
                {selectedAlbum.images[lightboxIndex].caption && (
                  <p className="text-white/90 text-sm font-semibold bg-black/75 backdrop-blur-md px-5 py-2.5 rounded-2xl mt-5 max-w-md text-center border border-white/5">
                    {selectedAlbum.images[lightboxIndex].caption}
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => Math.min(selectedAlbum.images.length - 1, prev + 1));
                }}
                disabled={lightboxIndex === selectedAlbum.images.length - 1}
                className="absolute right-6 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-orange-500 hover:border-orange-500 text-white disabled:opacity-20 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <ChevronRight size={28} />
              </button>

              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-6 right-6 h-12 w-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-orange-500 hover:border-orange-500 hover:scale-105 active:scale-95 transition-all shadow-lg"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
