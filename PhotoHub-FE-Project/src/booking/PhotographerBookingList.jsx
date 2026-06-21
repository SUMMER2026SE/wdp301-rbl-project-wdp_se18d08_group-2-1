import React, { useState, useEffect } from "react";
import { Calendar, MapPin, DollarSign, Clock, User, AlertCircle, Check, X, Eye, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import Swal from "sweetalert2";
import { bookingService } from "../services/bookingService";

export default function PhotographerBookingList({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("pending"); // default to pending first
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const t = {
    vi: {
      title: "Yêu Cầu Đặt Lịch Của Khách Hàng",
      statusAll: "Tất cả",
      statusPending: "Chờ xác nhận (Mới)",
      statusAccepted: "Đã duyệt (Chờ khách thanh toán)",
      statusConfirmed: "Khách đã thanh toán (Đã cọc)",
      statusCompleted: "Đã chụp xong",
      statusRejected: "Đã từ chối",
      statusCancelled: "Khách đã hủy",
      noBookings: "Không có yêu cầu đặt lịch nào trong mục này.",
      location: "Địa điểm chụp:",
      customer: "Khách hàng:",
      time: "Thời gian:",
      price: "Tổng tiền dịch vụ:",
      status: "Trạng thái:",
      acceptBtn: "Chấp nhận lịch chụp",
      rejectBtn: "Từ chối lịch chụp",
      rejectionReasonPrompt: "Vui lòng nhập lý do từ chối lịch đặt chụp này:",
      rejectionReasonLabel: "Lý do từ chối:",
      acceptSuccess: "Đã chấp nhận yêu cầu đặt lịch chụp!",
      rejectSuccess: "Từ chối yêu cầu đặt lịch chụp thành công!",
      error: "Lỗi",
      success: "Thành công",
      loading: "Đang tải danh sách...",
      bookingDate: "Ngày đặt:",
      note: "Yêu cầu của khách:",
      noNote: "Không có yêu cầu đặc biệt",
      chatBtn: "Trò chuyện",
    },
    en: {
      title: "Client Booking Requests",
      statusAll: "All",
      statusPending: "Pending Approval",
      statusAccepted: "Approved (Awaiting Payment)",
      statusConfirmed: "Paid (Deposit Received)",
      statusCompleted: "Completed",
      statusRejected: "Rejected",
      statusCancelled: "Cancelled by Client",
      noBookings: "No bookings found in this section.",
      location: "Location:",
      customer: "Client:",
      time: "Time:",
      price: "Service Price:",
      status: "Status:",
      acceptBtn: "Accept Booking",
      rejectBtn: "Reject Booking",
      rejectionReasonPrompt: "Please enter the reason for rejecting this booking:",
      rejectionReasonLabel: "Rejection Reason:",
      acceptSuccess: "Booking request accepted successfully!",
      rejectSuccess: "Booking request rejected successfully!",
      error: "Error",
      success: "Success",
      loading: "Loading bookings...",
      bookingDate: "Booked On:",
      note: "Client Requirements:",
      noNote: "No special requirements",
      chatBtn: "Chat Now",
    },
  }[language];

  useEffect(() => {
    fetchBookings(pagination.page, activeStatus);
  }, [pagination.page, activeStatus]);

  const fetchBookings = async (page = 1, status = "") => {
    setLoading(true);
    try {
      const res = await bookingService.getPhotographerBookings({
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

  const handleAccept = async (bookingId) => {
    const confirmResult = await Swal.fire({
      title: language === "vi" ? "Chấp nhận lịch đặt này?" : "Accept this booking?",
      text: language === "vi" ? "Buổi chụp sẽ được đưa vào lịch làm việc của bạn sau khi khách thanh toán cọc." : "This session will be scheduled once the client pays the deposit.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#06b6d4",
      cancelButtonColor: "#64748b",
      confirmButtonText: language === "vi" ? "Đồng ý" : "Yes, accept",
      cancelButtonText: language === "vi" ? "Đóng" : "Close",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });

    if (confirmResult.isConfirmed) {
      try {
        const res = await bookingService.acceptBooking(bookingId);
        if (res.success) {
          Swal.fire(t.success, t.acceptSuccess, "success");
          fetchBookings(pagination.page, activeStatus);
        }
      } catch (err) {
        Swal.fire(t.error, err.response?.data?.message || err.message, "error");
      }
    }
  };

  const handleReject = async (bookingId) => {
    const { value: reason } = await Swal.fire({
      title: t.rejectBtn,
      input: "text",
      inputLabel: t.rejectionReasonPrompt,
      inputPlaceholder: "...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: language === "vi" ? "Từ chối" : "Reject",
      cancelButtonText: language === "vi" ? "Đóng" : "Close",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
      inputValidator: (value) => {
        if (!value) {
          return language === "vi" ? "Vui lòng nhập lý do!" : "Reason is required!";
        }
      }
    });

    if (reason) {
      try {
        const res = await bookingService.rejectBooking(bookingId, reason);
        if (res.success) {
          Swal.fire(t.success, t.rejectSuccess, "success");
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
                    {/* Customer Info */}
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-orange-500" />
                      <div className="flex items-center gap-2">
                        <strong>{t.customer}</strong>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {booking.customer?.fullName || booking.customer?.email}
                        </span>
                        {booking.customer?.phoneNumber && (
                          <span className="text-xs text-slate-400">({booking.customer.phoneNumber})</span>
                        )}
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
                        <span className="font-bold block mb-1">❌ {t.rejectionReasonLabel}</span>
                        <p className="font-semibold">{booking.rejectReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing and Actions */}
                <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-white/[0.06] flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t.price}</span>
                    <p className="text-xl font-black text-rose-500 flex items-center mt-0.5">
                      <DollarSign size={16} className="-mr-0.5" />
                      {booking.price.toLocaleString()} <span className="text-xs font-bold ml-0.5">VNĐ</span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* Accept/Reject (Only for PENDING status) */}
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleReject(booking._id)}
                          className="p-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center gap-1 text-xs font-bold"
                        >
                          <X size={15} />
                          <span>{t.rejectBtn}</span>
                        </button>

                        <button
                          onClick={() => handleAccept(booking._id)}
                          className="px-4 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl shadow-md shadow-orange-500/10 font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Check size={15} />
                          {t.acceptBtn}
                        </button>
                      </>
                    )}
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
    </div>
  );
}
