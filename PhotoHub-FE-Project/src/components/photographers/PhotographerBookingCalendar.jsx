import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, User, Clock, Check, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { photographerMarketplaceService } from "../../services/photographerService";
import UploadFinalAlbum from "./UploadFinalAlbum";

export default function PhotographerBookingCalendar({ theme = "dark", language = "vi" }) {
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
      calendarTitle: "Lịch Trình Chụp Ảnh",
      loading: "Đang tải lịch trình...",
      prevMonth: "Tháng trước",
      nextMonth: "Tháng sau",
      mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN",
      noEvents: "Không có lịch chụp vào ngày này",
      detailsFor: "Chi tiết lịch chụp ngày",
      location: "Địa điểm:",
      customer: "Khách hàng:",
      time: "Thời gian:",
      price: "Chi phí:",
      status: "Trạng thái:",
      rejectBtn: "Từ chối lịch",
      completeBtn: "Hoàn thành dự án",
      rejectReasonPrompt: "Nhập lý do từ chối:",
      rejectSuccess: "Từ chối lịch chụp thành công",
      completeSuccess: "Đã đánh dấu hoàn thành dự án",
      error: "Đã xảy ra lỗi",
      uploadAlbumBtn: "Tải ảnh hoàn chỉnh",
      viewAlbumBtn: "Xem Album đã tải lên",
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
      await photographerMarketplaceService.rejectBooking(bookingId, reason);
      Swal.fire("Success", t.rejectSuccess, "success");
      fetchCalendar();
      setSelectedDayBookings([]);
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
    vi: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
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
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <div>{t.mon}</div>
              <div>{t.tue}</div>
              <div>{t.wed}</div>
              <div>{t.thu}</div>
              <div>{t.fri}</div>
              <div className="text-cyan-500">{t.sat}</div>
              <div className="text-cyan-500">{t.sun}</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {daysGrid.map((cell, idx) => {
                const dayBookings = cell.isCurrentMonth ? getBookingsForDay(cell.day) : [];
                const hasBookings = dayBookings.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => cell.isCurrentMonth && handleDayClick(cell.day)}
                    className={`min-h-[80px] p-2 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      !cell.isCurrentMonth
                        ? isDark
                          ? "bg-transparent border-transparent text-slate-700 pointer-events-none"
                          : "bg-transparent border-transparent text-slate-300 pointer-events-none"
                        : isToday(cell.day)
                        ? "border-cyan-500 bg-cyan-500/10"
                        : isDark
                        ? "border-white/5 bg-white/[0.02] hover:bg-white/5"
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`text-sm font-black ${isToday(cell.day) ? "text-cyan-400" : ""}`}>
                      {cell.day}
                    </span>

                    {hasBookings && (
                      <div className="space-y-1 mt-1">
                        {dayBookings.slice(0, 2).map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className={`text-[9px] px-2 py-0.5 rounded-lg truncate font-bold ${
                              b.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : b.status === "confirmed"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
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
              className={`p-6 rounded-3xl border h-full flex flex-col ${
                isDark ? "bg-[#09090b] border-white/5" : "bg-slate-50 border-slate-100"
              }`}
            >
              <h3 className="font-extrabold text-lg mb-4">
                {selectedDateStr ? `${t.detailsFor} ${selectedDateStr}` : t.calendarTitle}
              </h3>

              {selectedDayBookings.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-10">
                  <AlertCircle size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">{t.noEvents}</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[400px] flex-1 pr-1">
                  {selectedDayBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <h4 className="font-extrabold text-sm">{b.title}</h4>
                      <div className="text-xs space-y-2 text-slate-500">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-cyan-500" />
                          <span>
                            <strong>{t.customer}</strong> {b.customer?.fullName || b.customer?.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-cyan-500" />
                          <span>
                            <strong>{t.time}</strong> {new Date(b.start).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-cyan-500" />
                          <span className="truncate">
                            <strong>{t.location}</strong> {b.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-400">
                            {t.price} ${b.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>{t.status}</strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              b.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : b.status === "confirmed"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.04]">
                        {b.status !== "completed" && (
                          <button
                            onClick={() => handleReject(b.id)}
                            className="w-full py-2.5 rounded-xl text-xs font-bold border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition"
                          >
                            {t.rejectBtn}
                          </button>
                        )}

                        {b.status !== "completed" && (
                          <button
                            onClick={() => {
                              setActiveUploadBookingId(b.id);
                              setShowUploadModal(true);
                            }}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-600 text-white transition shadow-md shadow-cyan-500/10"
                          >
                            {t.uploadAlbumBtn}
                          </button>
                        )}

                        {b.status !== "completed" && (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`relative max-w-xl w-full rounded-3xl p-6 border ${
            isDark ? "bg-[#121214] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>
            <UploadFinalAlbum
              bookingId={activeUploadBookingId}
              theme={theme}
              language={language}
              onSuccess={handleUploadAlbumSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
