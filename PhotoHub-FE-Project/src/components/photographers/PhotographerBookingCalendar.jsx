import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, User, Users, Clock, Check, AlertCircle, MessageCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { photographerMarketplaceService } from "../../services/photographerService";
import UploadFinalAlbum from "./UploadFinalAlbum";

export default function PhotographerBookingCalendar({ theme = "dark", language = "vi" }) {
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayBookings, setSelectedDayBookings] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeUploadBookingId, setActiveUploadBookingId] = useState(null);

  const t = {
    vi: {
      calendarTitle: "L\u1ecbch tr\u00ecnh ch\u1ee5p \u1ea3nh",
      loading: "\u0110ang t\u1ea3i l\u1ecbch tr\u00ecnh...",
      prevMonth: "Th\u00e1ng tr\u01b0\u1edbc",
      nextMonth: "Th\u00e1ng sau",
      mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN",
      noEvents: "Kh\u00f4ng c\u00f3 l\u1ecbch ch\u1ee5p v\u00e0o ng\u00e0y n\u00e0y",
      detailsFor: "Chi ti\u1ebft l\u1ecbch ch\u1ee5p ng\u00e0y",
      location: "\u0110\u1ecba \u0111i\u1ec3m:",
      customer: "Kh\u00e1ch h\u00e0ng:",
      time: "Th\u1eddi gian:",
      price: "Chi ph\u00ed:",
      status: "Tr\u1ea1ng th\u00e1i:",
      rejectBtn: "T\u1eeb ch\u1ed1i l\u1ecbch",
      completeBtn: "Ho\u00e0n th\u00e0nh d\u1ef1 \u00e1n",
      rejectReasonPrompt: "Nh\u1eadp l\u00fd do t\u1eeb ch\u1ed1i:",
      rejectSuccess: "T\u1eeb ch\u1ed1i l\u1ecbch ch\u1ee5p th\u00e0nh c\u00f4ng",
      completeSuccess: "\u0110\u00e3 \u0111\u00e1nh d\u1ea5u ho\u00e0n th\u00e0nh d\u1ef1 \u00e1n",
      error: "\u0110\u00e3 x\u1ea3y ra l\u1ed7i",
      uploadAlbumBtn: "T\u1ea3i \u1ea3nh ho\u00e0n ch\u1ec9nh",
      viewAlbumBtn: "Xem album \u0111\u00e3 t\u1ea3i l\u00ean",
      acceptBtn: "Nh\u1eadn l\u1ecbch",
      acceptedSuccess: "\u0110\u00e3 nh\u1eadn l\u1ecbch",
      openChatBtn: "M\u1edf chat t\u01b0 v\u1ea5n",
      chatOpened: "Ph\u00f2ng chat t\u01b0 v\u1ea5n v\u1edbi kh\u00e1ch h\u00e0ng \u0111\u00e3 \u0111\u01b0\u1ee3c m\u1edf.",
    },
    en: {
      calendarTitle: "Shooting Calendar",
      loading: "Loading schedule...",
      prevMonth: "Previous Month",
      nextMonth: "Next Month",
      mon: "Mo", tue: "Tu", wed: "We", thu: "Th", fri: "Fr", sat: "Sa", sun: "Su",
      noEvents: "No bookings for this date",
      detailsFor: "Bookings on",
      location: "Location:",
      customer: "Customer:",
      time: "Time:",
      price: "Price:",
      status: "Status:",
      rejectBtn: "Reject Booking",
      completeBtn: "Mark Completed",
      rejectReasonPrompt: "Enter rejection reason:",
      rejectSuccess: "Booking rejected successfully",
      completeSuccess: "Project marked as completed",
      error: "An error occurred",
      uploadAlbumBtn: "Upload Final Album",
      viewAlbumBtn: "View Uploaded Album",
      acceptBtn: "Accept Booking",
      acceptedSuccess: "Booking accepted",
      openChatBtn: "Open Consultation Chat",
      chatOpened: "A consultation chat with the customer has been opened.",
    },
  }[language];

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
      const res = await photographerMarketplaceService.getCalendar({ start, end });
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentDate]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0, Monday is 1...
  // Adjust so Monday is first day of week
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayBookings([]);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayBookings([]);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const getBookingsForDay = (day) => {
    return bookings.filter((b) => {
      const bDate = new Date(b.start);
      return bDate.getDate() === day && bDate.getMonth() === month && bDate.getFullYear() === year;
    });
  };

  const isCompletedStatus = (status) => String(status).toLowerCase() === "completed";
  const isPendingStatus = (status) => String(status).toLowerCase() === "pending";
  const canOpenChatStatus = (status) => !["rejected", "cancelled", "canceled"].includes(String(status).toLowerCase());

  const handleDayClick = (day) => {
    const dayBookings = getBookingsForDay(day);
    setSelectedDayBookings(dayBookings);
    const dateStr = `${day}/${month + 1}/${year}`;
    setSelectedDateStr(dateStr);
  };

  const handleReject = async (bookingId) => {
    const { value: reason } = await Swal.fire({
      title: t.rejectBtn,
      input: "text",
      inputLabel: t.rejectReasonPrompt,
      inputPlaceholder: "...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      background: isDark ? "#121214" : "#fff",
      color: isDark ? "#fff" : "#000",
    });

    if (reason === undefined) return; // user cancelled

    try {
      const res = await photographerMarketplaceService.rejectBooking(bookingId, reason);
      const alternativeSlots = res.data?.alternativeSlots || [];
      if (alternativeSlots.length > 0) {
        const slotHtml = alternativeSlots
          .map((slot) => {
            const start = new Date(slot.start).toLocaleString(language === "vi" ? "vi-VN" : "en-US");
            const end = new Date(slot.end).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return `<li><strong>${start} - ${end}</strong><br/><small>${slot.reason}</small></li>`;
          })
          .join("");

        Swal.fire({
          icon: "success",
          title: t.rejectSuccess,
          html: `<p>Suggested replacement slots:</p><ul style="text-align:left">${slotHtml}</ul>`,
          background: isDark ? "#121214" : "#fff",
          color: isDark ? "#fff" : "#000",
          confirmButtonColor: "#06b6d4",
        });
      } else {
        Swal.fire("Success", t.rejectSuccess, "success");
      }
      fetchCalendar();
      setSelectedDayBookings([]);
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  const getBookingId = (booking) => booking?.id || booking?._id;

  const getCustomerId = (booking) => {
    if (typeof booking?.customer === "string") return booking.customer;
    return booking?.customer?._id || booking?.customer?.id;
  };

  const openConsultationChat = async (booking) => {
    const customerId = getCustomerId(booking);
    if (!customerId) {
      throw new Error(language === "vi" ? "Kh\u00f4ng t\u00ecm th\u1ea5y kh\u00e1ch h\u00e0ng \u0111\u1ec3 m\u1edf chat" : "Cannot find customer to open chat");
    }

    const bookingId = getBookingId(booking);
    const res = await photographerMarketplaceService.createConversation(customerId, bookingId);
    return res.data?._id || res.data?.id || res._id || res.id;
  };

  const handleAccept = async (booking) => {
    try {
      await photographerMarketplaceService.acceptBooking(getBookingId(booking));
      let conversationId = null;
      try {
        conversationId = await openConsultationChat(booking);
      } catch (chatErr) {
        console.warn(chatErr);
      }

      const result = await Swal.fire({
        icon: "success",
        title: t.acceptedSuccess,
        text: t.chatOpened,
        showCancelButton: true,
        confirmButtonText: t.openChatBtn,
        cancelButtonText: language === "vi" ? "\u1ede l\u1ea1i l\u1ecbch" : "Stay here",
        confirmButtonColor: "#06b6d4",
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
      });

      fetchCalendar();
      setSelectedDayBookings([]);
      if (result.isConfirmed) {
        navigate(conversationId ? `/chat?conversationId=${conversationId}` : "/chat");
      }
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  const handleOpenBookingChat = async (booking) => {
    try {
      const conversationId = await openConsultationChat(booking);
      navigate(conversationId ? `/chat?conversationId=${conversationId}` : "/chat");
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      await photographerMarketplaceService.completeBooking(bookingId);
      Swal.fire("Success", t.completeSuccess, "success");
      fetchCalendar();
      setSelectedDayBookings([]);
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  const handleUploadAlbumSuccess = () => {
    setShowUploadModal(false);
    fetchCalendar();
    setSelectedDayBookings([]);
  };

  const handleViewAlbum = async (bookingId) => {
    try {
      const res = await photographerMarketplaceService.getAlbum(bookingId);
      const album = res.data || {};
      const imagesHtml = (album.images || [])
        .slice(0, 8)
        .map((image) => {
          const src = `${image.previewUrl || image.url}`;
          const download = image.downloadUrl ? `https://photo-hub-be-project.vercel.app${image.downloadUrl}` : "";
          return `<div style="display:inline-block;margin:4px;text-align:center"><img src="${src}" style="width:90px;height:70px;object-fit:cover;border-radius:8px"/><br/>${download ? `<a href="${download}" target="_blank">Full HD</a>` : `<small>Watermark preview</small>`
            }</div>`;
        })
        .join("");

      Swal.fire({
        title: album.canDownloadFullHD ? "Album unlocked" : "Secure album preview",
        html: `<p>${album.lockedReason || "Full-HD downloads are available."}</p><div>${imagesHtml}</div>`,
        width: 720,
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#06b6d4",
      });
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  // Build grid days
  const daysGrid = [];
  // Prev month padding
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    daysGrid.push({ day: prevMonthTotalDays - i, isCurrentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({ day: i, isCurrentMonth: true });
  }
  // Next month padding to fill full grid weeks (usually 6 rows = 42 cells)
  const remainingCells = 42 - daysGrid.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysGrid.push({ day: i, isCurrentMonth: false });
  }

  const monthsLabel = {
    vi: ["Th\u00e1ng 1", "Th\u00e1ng 2", "Th\u00e1ng 3", "Th\u00e1ng 4", "Th\u00e1ng 5", "Th\u00e1ng 6", "Th\u00e1ng 7", "Th\u00e1ng 8", "Th\u00e1ng 9", "Th\u00e1ng 10", "Th\u00e1ng 11", "Th\u00e1ng 12"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  }[language];

  return (
    <div className={`p-6 rounded-3xl border ${isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"}`}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-black tracking-tight">{t.calendarTitle}</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className={`p-3 rounded-2xl border transition-all ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-extrabold text-lg min-w-[120px] text-center">
            {monthsLabel[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className={`p-3 rounded-2xl border transition-all ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {/* Calendar Grid */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <div>{t.mon}</div>
              <div>{t.tue}</div>
              <div>{t.wed}</div>
              <div>{t.thu}</div>
              <div>{t.fri}</div>
              <div className="text-orange-500">{t.sat}</div>
              <div className="text-orange-500">{t.sun}</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {daysGrid.map((cell, idx) => {
                const dayBookings = cell.isCurrentMonth ? getBookingsForDay(cell.day) : [];
                const hasBookings = dayBookings.length > 0;
                const hasConflict = dayBookings.some((b) => b.hasConflict);

                return (
                  <div
                    key={idx}
                    onClick={() => cell.isCurrentMonth && handleDayClick(cell.day)}
                    className={`min-h-[70px] p-1.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${!cell.isCurrentMonth
                      ? isDark
                        ? "bg-transparent border-transparent text-slate-700 pointer-events-none"
                        : "bg-transparent border-transparent text-slate-300 pointer-events-none"
                      : hasConflict
                        ? "border-red-500 bg-red-500/10"
                        : isToday(cell.day)
                          ? "border-orange-500 bg-orange-500/10"
                          : isDark
                            ? "border-white/5 bg-white/[0.02] hover:bg-white/5"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-100"
                      }`}
                  >
                    <span className={`text-xs font-black ${isToday(cell.day) ? "text-orange-500" : ""}`}>
                      {cell.day}
                    </span>

                    {hasBookings && (
                      <div className="space-y-1 mt-1">
                        {dayBookings.slice(0, 2).map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className={`text-[9px] px-1.5 py-0.5 rounded truncate font-bold ${b.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : b.status === "confirmed"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : b.status === "group_pending"
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 border-dashed"
                                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                              }`}
                          >
                            {b.title}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-[8px] text-center text-slate-500 font-extrabold">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bookings Sidebar */}
          <div className="md:col-span-1">
            <div
              className={`p-4 rounded-2xl border h-full flex flex-col ${isDark ? "bg-[#09090b] border-white/5" : "bg-slate-50 border-slate-100"
                }`}
            >
              <h3 className="font-extrabold text-base mb-3">
                {selectedDateStr ? `${t.detailsFor} ${selectedDateStr}` : t.calendarTitle}
              </h3>

              {selectedDayBookings.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-10">
                  <AlertCircle size={28} className="mb-2 opacity-50" />
                  <p className="text-xs font-medium">{t.noEvents}</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[400px] flex-1 pr-1">
                  {selectedDayBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border space-y-2.5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-sm"
                        }`}
                    >
                      <h4 className="font-extrabold text-xs">{b.title}</h4>
                      <div className="text-[11px] space-y-1.5 text-slate-500">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-orange-500" />
                          <span>
                            <strong>{t.customer}</strong> {b.customer?.fullName || b.customer?.email} (Trưởng nhóm)
                          </span>
                        </div>
                        {b.isGroupBooking && (
                          <div className="flex items-center gap-2">
                            <Users size={13} className="text-orange-500" />
                            <span>
                              <strong>Tiến độ:</strong> {b.memberProgress}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-orange-500" />
                          <span>
                            <strong>{t.time}</strong> {new Date(b.start).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-orange-500" />
                          <span className="truncate">
                            <strong>{t.location}</strong> {b.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-500">
                            {t.price} ${b.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>{t.status}</strong>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${b.hasConflict
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : isCompletedStatus(b.status)
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : b.status === "confirmed"
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  : b.status === "group_pending"
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 border-dashed"
                                    : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                              }`}
                          >
                            {b.status === "group_pending" ? "Nhóm chờ cọc" : b.status}
                          </span>
                        </div>
                        {b.deliveryDeadline && (
                          <div className={`rounded-lg border px-2 py-1 text-[10px] ${b.isDeliveryOverdue ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-amber-500/20 bg-amber-500/10 text-amber-300"}`}>
                            Delivery deadline: {new Date(b.deliveryDeadline).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                          </div>
                        )}
                        {b.hasConflict && (
                          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
                            Calendar conflict detected with {b.conflictWith?.length || 0} booking(s).
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-white/[0.04]">
                        {!b.isGroupBooking && isPendingStatus(b.status) && (
                          <button
                            onClick={() => handleAccept(b)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/10 transition hover:bg-orange-600"
                          >
                            <Check size={14} />
                            {t.acceptBtn}
                          </button>
                        )}

                        {canOpenChatStatus(b.status) && !isPendingStatus(b.status) && (
                          <button
                            onClick={() => handleOpenBookingChat(b)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/5 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white dark:text-orange-400"
                          >
                            <MessageCircle size={14} />
                            {t.openChatBtn}
                          </button>
                        )}

                        {b.status === "group_pending" && (
                          <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
                            ⚠️ Nhóm chưa chốt cọc. Lịch này sẽ chính thức kích hoạt sau khi các thành viên hoàn tất đặt cọc.
                          </div>
                        )}

                        {!b.isGroupBooking && !isCompletedStatus(b.status) && (
                          <button
                            onClick={() => handleReject(b.id)}
                            className="w-full py-2 rounded-lg text-xs font-bold border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition"
                          >
                            {t.rejectBtn}
                          </button>
                        )}

                        {!b.isGroupBooking && !isCompletedStatus(b.status) && (
                          <button
                            onClick={() => {
                              setActiveUploadBookingId(b.id);
                              setShowUploadModal(true);
                            }}
                            className="w-full py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition shadow-sm shadow-orange-500/10"
                          >
                            {t.uploadAlbumBtn}
                          </button>
                        )}

                        {b.finalAlbum && (
                          <button
                            onClick={() => handleViewAlbum(b.id)}
                            className="w-full py-2 rounded-lg text-xs font-bold border border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/5 hover:bg-orange-500/10 transition"
                          >
                            {t.viewAlbumBtn}
                          </button>
                        )}

                        {!b.isGroupBooking && !isCompletedStatus(b.status) && (
                          <button
                            onClick={() => handleComplete(b.id)}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-md shadow-emerald-500/10"
                          >
                            {t.completeBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Album Modal */}
      {showUploadModal && (
        <UploadFinalAlbum
          bookingId={activeUploadBookingId}
          theme={theme}
          language={language}
          onSuccess={handleUploadAlbumSuccess}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}

