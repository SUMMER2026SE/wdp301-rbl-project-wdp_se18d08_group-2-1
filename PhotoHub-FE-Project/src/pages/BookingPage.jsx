import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import {
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Gift,
  Info,
  ChevronLeft,
  ChevronRight,
  User,
  Star,
  Award,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { bookingService } from "../services/bookingService";
import { photographerService, photographerMarketplaceService } from "../services/photographerService";

// Helper formatting dates
const formatDateTimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getAuthPayload = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (error) {
    return null;
  }
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    return {};
  }
};

export default function BookingPage({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const { photographerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Photographers listing (for dropdown)
  const [photographers, setPhotographers] = useState([]);
  const [selectedPhotographerOption, setSelectedPhotographerOption] = useState(null);
  
  // Active selected photographer details
  const [photographer, setPhotographer] = useState(null);
  const [photographerLoading, setPhotographerLoading] = useState(false);

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // Date object

  // Booking Form States
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    note: "",
    start: "",
    end: "",
    location: "",
    price: 0,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(null); // null | { start, end, title }
  const [showAllImages, setShowAllImages] = useState(false); // expand gallery

  const t = {
    vi: {
      bookingTitle: "Trang Đặt Lịch Chụp Ảnh",
      bookingSubtitle: "Đặt lịch an toàn, minh bạch qua hệ thống ký quỹ PhotoHub",
      selectPhotographer: "Chọn nhiếp ảnh gia",
      chooseCreatorPrompt: "Hãy chọn một nhiếp ảnh gia để xem lịch rảnh và đặt lịch",
      photographerLabel: "Nhiếp ảnh gia:",
      packagesLabel: "Chọn gói dịch vụ",
      customBooking: "Đặt lịch tự do (Theo giờ)",
      sessionTitle: "Tiêu đề buổi chụp",
      sessionTitlePlaceholder: "Ví dụ: Chụp ảnh ngoại cảnh kỷ niệm, Chụp phóng sự cưới...",
      startDate: "Ngày giờ bắt đầu",
      endDate: "Ngày giờ kết thúc",
      locationLabel: "Địa điểm chụp",
      locationPlaceholder: "Địa chỉ cụ thể, công viên, studio...",
      noteLabel: "Ghi chú gửi Nhiếp ảnh gia",
      notePlaceholder: "Yêu cầu chi tiết về trang phục, phong cách, tone màu...",
      priceLabel: "Tổng chi phí tạm tính",
      submitBtn: "Gửi Yêu Cầu Đặt Lịch",
      submitting: "Đang gửi yêu cầu...",
      hourlyRateInfo: "Giá đặt theo giờ của nhiếp ảnh gia này là:",
      calcHourly: "Chi phí tính bằng: Số giờ chụp × Mức giá/giờ",
      loadingPackages: "Đang tải các gói dịch vụ...",
      loadingPhotographer: "Đang tải thông tin nhiếp ảnh gia...",
      loadingCalendar: "Đang tải lịch làm việc...",
      error: "Lỗi",
      success: "Thành công",
      successMsg: "Yêu cầu đặt lịch đã được gửi thành công đến Nhiếp ảnh gia!",
      invalidDates: "Ngày kết thúc phải sau ngày bắt đầu và buổi chụp phải kéo dài ít nhất 30 phút",
      pastStartDate: "Ngày bắt đầu phải ở thời điểm tương lai",
      requiredFields: "Vui lòng điền đầy đủ các thông tin bắt buộc!",
      loginRequired: "Bạn cần đăng nhập bằng tài khoản customer để đặt lịch.",
      customerOnly: "Chỉ tài khoản customer mới có thể đặt lịch và thanh toán. Hãy đăng xuất rồi đăng nhập tài khoản customer.",
      cannotBookSelf: "Bạn không thể đặt lịch với chính mình.",
      selectDatePrompt: "Vui lòng chọn ngày chụp trên lịch làm việc",
      timeConflict: "Khung giờ này đã có lịch đặt! Vui lòng chọn khung giờ khác.",
      calendarHeader: "Lịch Trống & Lịch Bận",
      calendarSub: "Xem lịch làm việc của creator để chọn ngày phù hợp",
      busyDay: "Bận",
      freeDay: "Trống",
      timeSlotTitle: "Khung giờ ngày",
      timeSlotSub: "Chọn giờ phù hợp với lịch còn trống bên dưới",
      bookedSlots: "Lịch đã đặt trong ngày",
      noBookingToday: "Ngày này chưa có lịch đặt nào – bạn có thể chọn bất kỳ giờ nào!",
      slotFree: "Trống",
      slotBusy: "Đã đặt",
      mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN",
      rating: "Đánh giá",
      exp: "Kinh nghiệm",
      hourly: "Mức giá",
      years: "năm",
      photographerUnavailable: "Nhiếp ảnh gia hiện tại đang bận nhận lịch mới.",
      packageNotice: "Gói dịch vụ đã chọn có thời lượng cố định. Thời gian kết thúc đã được tự động tính toán và khóa.",
    },
    en: {
      bookingTitle: "Book Photography Session",
      bookingSubtitle: "Secure and transparent booking via PhotoHub escrow system",
      selectPhotographer: "Choose Photographer",
      chooseCreatorPrompt: "Please choose a photographer to view their availability and book",
      photographerLabel: "Photographer:",
      packagesLabel: "Select Service Package",
      customBooking: "Custom Booking (Hourly)",
      sessionTitle: "Session Title",
      sessionTitlePlaceholder: "e.g., Outdoor portrait session, Wedding photoshoot...",
      startDate: "Start Date & Time",
      endDate: "End Date & Time",
      locationLabel: "Shoot Location",
      locationPlaceholder: "Specific address, park, studio...",
      noteLabel: "Note to Photographer",
      notePlaceholder: "Specific requests, outfits, style, color grading...",
      priceLabel: "Estimated Total Price",
      submitBtn: "Submit Booking Request",
      submitting: "Submitting...",
      hourlyRateInfo: "This photographer's hourly rate is:",
      calcHourly: "Price calculated by: Duration hours × Hourly rate",
      loadingPackages: "Loading packages...",
      loadingPhotographer: "Loading photographer profile...",
      loadingCalendar: "Loading schedule calendar...",
      error: "Error",
      success: "Success",
      successMsg: "Booking request submitted successfully to the Photographer!",
      invalidDates: "End date must be after start date and shoot duration must be at least 30 minutes",
      pastStartDate: "Start date must be in the future",
      requiredFields: "Please fill in all required fields!",
      loginRequired: "Please sign in with a customer account to book this photographer.",
      customerOnly: "Only customer accounts can create bookings and pay. Please sign out and sign in with a customer account.",
      cannotBookSelf: "You cannot book yourself.",
      selectDatePrompt: "Please select a shoot date from the schedule calendar",
      timeConflict: "This time slot is already booked! Please choose a different time.",
      calendarHeader: "Availability Schedule",
      calendarSub: "View creator's schedule to choose a vacant date",
      busyDay: "Busy",
      freeDay: "Vacant",
      timeSlotTitle: "Time Slots for",
      timeSlotSub: "Pick an available slot from the timeline below",
      bookedSlots: "Booked Slots Today",
      noBookingToday: "No bookings yet today – any hour is available!",
      slotFree: "Free",
      slotBusy: "Booked",
      mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
      rating: "Rating",
      exp: "Exp",
      hourly: "Hourly",
      years: "yrs",
      photographerUnavailable: "The photographer is currently not available for new bookings.",
      packageNotice: "The selected package has a fixed duration. The end time has been calculated automatically and locked.",
    },
  }[language];

  // 1. Fetch all photographers list for dropdown selection
  useEffect(() => {
    const loadPhotographers = async () => {
      try {
        const res = await photographerService.listPhotographers({ limit: 100 });
        let list = [];
        if (res) {
          if (Array.isArray(res.data)) {
            list = res.data;
          } else if (res.data && Array.isArray(res.data.data)) {
            list = res.data.data;
          } else if (res.data && Array.isArray(res.data.photographers)) {
            list = res.data.photographers;
          } else if (Array.isArray(res)) {
            list = res;
          }
        }
        setPhotographers(list);

        // If there is an ID in the URL, pre-select it
        if (photographerId) {
          const found = list.find((p) => p._id === photographerId);
          if (found) {
            setSelectedPhotographerOption({
              value: found._id,
              label: `${found.displayName} - ${found.location || ""} ($${found.hourlyRate || 0}/h)`,
            });
          } else {
            // Fetch detail directly if not found in list
            try {
              const detailRes = await photographerService.getPhotographerDetail(photographerId);
              const p = detailRes?.data || detailRes;
              if (p && p._id) {
                setSelectedPhotographerOption({
                  value: p._id,
                  label: `${p.displayName} - ${p.location || ""} ($${p.hourlyRate || 0}/h)`,
                });
              }
            } catch (err) {
              console.error("Error loading pre-selected photographer details:", err);
            }
          }
        }
      } catch (err) {
        console.error("Error loading photographers list:", err);
      }
    };
    loadPhotographers();
  }, [photographerId]);

  // 2. Fetch selected photographer details
  useEffect(() => {
    const loadPhotographerDetail = async () => {
      const activeId = selectedPhotographerOption?.value;
      if (!activeId) {
        setPhotographer(null);
        return;
      }
      setPhotographerLoading(true);
      try {
        const res = await photographerService.getPhotographerDetail(activeId);
        if (res && res.data) {
          setPhotographer(res.data);
        } else if (res) {
          setPhotographer(res);
        }
      } catch (err) {
        console.error("Error loading photographer details:", err);
      } finally {
        setPhotographerLoading(false);
      }
    };
    loadPhotographerDetail();
  }, [selectedPhotographerOption]);

  // 3. Fetch Selected Photographer Packages & Calendar Bookings (Busy Schedule)
  useEffect(() => {
    const activeId = selectedPhotographerOption?.value;
    if (!activeId) {
      setPackages([]);
      setCalendarBookings([]);
      return;
    }

    const loadPackages = async () => {
      setPackagesLoading(true);
      try {
        const res = await bookingService.getPhotographerPackages(activeId);
        if (res.success) {
          const actualPackages = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setPackages(actualPackages);
        }
      } catch (err) {
        console.error("Error loading packages:", err);
      } finally {
        setPackagesLoading(false);
      }
    };

    loadPackages();
  }, [selectedPhotographerOption]);

  // 4. Fetch Calendar bookings for active photographer
  useEffect(() => {
    const activeId = selectedPhotographerOption?.value;
    if (!activeId) {
      setCalendarBookings([]);
      return;
    }

    const loadCalendar = async () => {
      setCalendarLoading(true);
      try {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        const res = await photographerMarketplaceService.getPhotographerCalendar(activeId, { start, end });
        if (res.success) {
          setCalendarBookings(res.data || []);
        }
      } catch (err) {
        console.error("Error loading photographer schedule calendar:", err);
      } finally {
        setCalendarLoading(false);
      }
    };

    loadCalendar();
  }, [selectedPhotographerOption, currentDate]);

  // 5. Package selection changes -> Recalculate price & end date
  useEffect(() => {
    if (!selectedPackageId) {
      setFormData(prev => ({
        ...prev,
        title: "",
        price: 0,
      }));
      calculateCustomPrice(formData.start, formData.end);
    } else {
      const pkg = packages.find(p => p._id === selectedPackageId);
      if (pkg) {
        let updatedEnd = formData.end;
        if (formData.start) {
          const startTime = new Date(formData.start).getTime();
          const endTime = startTime + (pkg.durationHours || 0) * 60 * 60 * 1000;
          updatedEnd = formatDateTimeLocal(new Date(endTime));
        }
        setFormData(prev => ({
          ...prev,
          title: pkg.title,
          price: pkg.price,
          end: updatedEnd,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackageId, packages]);

  const calculateCustomPrice = (start, end) => {
    if (!start || !end || !photographer?.hourlyRate) return;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (endTime > startTime) {
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      const calculatedPrice = Math.max(0.5, durationHours) * (photographer.hourlyRate || 0);
      setFormData(prev => ({
        ...prev,
        price: Math.round(calculatedPrice),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        price: 0,
      }));
    }
  };

  /**
   * Kiểm tra xem khoảng [newStart, newEnd] có trùng với bất kỳ booking nào không.
   * Trả về booking bị trùng đầu tiên, hoặc null nếu không có conflict.
   */
  const hasTimeConflict = (newStart, newEnd) => {
    if (!newStart || !newEnd) return null;
    const ns = new Date(newStart).getTime();
    const ne = new Date(newEnd).getTime();
    if (ne <= ns) return null;
    for (const b of calendarBookings) {
      const bs = new Date(b.start).getTime();
      const be = b.end ? new Date(b.end).getTime() : bs + 3600000;
      // overlap: ns < be && ne > bs
      if (ns < be && ne > bs) {
        return b; // trả về booking đầu tiên bị trùng
      }
    }
    return null;
  };

  const handleDateChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    if (selectedPackageId && field === "start" && value) {
      const pkg = packages.find(p => p._id === selectedPackageId);
      if (pkg) {
        const startTime = new Date(value).getTime();
        const endTime = startTime + (pkg.durationHours || 0) * 60 * 60 * 1000;
        updatedData.end = formatDateTimeLocal(new Date(endTime));
      }
    }
    setFormData(updatedData);

    if (!selectedPackageId) {
      calculateCustomPrice(updatedData.start, updatedData.end);
    }

    // Kiểm tra conflict sau khi cập nhật cả 2 field
    const checkStart = field === "start" ? value : updatedData.start;
    const checkEnd   = field === "end"   ? value : updatedData.end;
    const conflict = hasTimeConflict(checkStart, checkEnd);
    setConflictWarning(conflict || null);
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon is 0
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const getBookingsForDay = (day) => {
    // Lấy tất cả bookings có thời gian chồng lên ngày này (không chỉ bắt đầu trong ngày)
    const dayStart = new Date(year, month, day, 0, 0, 0).getTime();
    const dayEnd   = new Date(year, month, day, 23, 59, 59).getTime();
    return calendarBookings.filter((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd   = b.end ? new Date(b.end).getTime() : bStart + 60 * 60 * 1000;
      // Có overlap với ngày này
      return bStart < dayEnd && bEnd > dayStart;
    });
  };

  /**
   * Tính tổng số phút bận trong khung giờ làm việc [workStart, workEnd] của ngày đó.
   * Dùng thuật toán merge-interval để tránh tính trùng khi các booking chồng nhau.
   */
  const getBusyMinutesInDay = (day, bookings) => {
    const WORK_START = 8;  // 08:00
    const WORK_END   = 20; // 20:00
    const dayWorkStart = new Date(year, month, day, WORK_START, 0, 0).getTime();
    const dayWorkEnd   = new Date(year, month, day, WORK_END,   0, 0).getTime();

    // Chuyển mỗi booking thành interval clamp trong khung làm việc
    const intervals = bookings
      .map((b) => ({
        s: Math.max(new Date(b.start).getTime(), dayWorkStart),
        e: Math.min(b.end ? new Date(b.end).getTime() : new Date(b.start).getTime() + 60 * 60 * 1000, dayWorkEnd),
      }))
      .filter((iv) => iv.e > iv.s)
      .sort((a, b) => a.s - b.s);

    // Merge overlapping intervals
    let totalMs = 0;
    let mergedEnd = -Infinity;
    for (const iv of intervals) {
      if (iv.s >= mergedEnd) {
        totalMs += iv.e - iv.s;
        mergedEnd = iv.e;
      } else if (iv.e > mergedEnd) {
        totalMs += iv.e - mergedEnd;
        mergedEnd = iv.e;
      }
    }
    return totalMs / 60000; // đổi sang phút
  };

  const isDateInPast = (day) => {
    const compareDate = new Date(year, month, day, 23, 59, 59);
    return compareDate < new Date();
  };

  // Build grid days
  const daysGrid = [];
  // Prev month padding
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    daysGrid.push({ day: prevMonthTotalDays - i, isCurrentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const isPast = isDateInPast(i);
    const dayBookings = getBookingsForDay(i);
    // Khung giờ làm việc: 8h → 20h = 720 phút
    // Chỉ đánh dấu BẬN khi tổng giờ booking lấp đầy toàn bộ khung giờ làm việc (>= 720 phút)
    const WORK_TOTAL_MINUTES = (20 - 8) * 60; // 720 phút
    const busyMinutes = dayBookings.length > 0 ? getBusyMinutesInDay(i, dayBookings) : 0;
    const isBusy = busyMinutes >= WORK_TOTAL_MINUTES;
    daysGrid.push({ day: i, isCurrentMonth: true, isPast, isBusy, busyMinutes, dayBookings });
  }
  // Next month padding to fill grid
  const remainingCells = 42 - daysGrid.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysGrid.push({ day: i, isCurrentMonth: false });
  }

  const handleCalendarDayClick = (day) => {
    const targetDate = new Date(year, month, day, 10, 0); // Default to 10:00 AM on selected day
    setSelectedDate(targetDate);

    // Auto populate starting date local format
    const formattedStart = formatDateTimeLocal(targetDate);
    const formattedEnd = formatDateTimeLocal(new Date(targetDate.getTime() + 2 * 60 * 60 * 1000)); // Default +2 hours

    setFormData(prev => {
      const updated = {
        ...prev,
        start: formattedStart,
        end: selectedPackageId ? prev.end : formattedEnd,
      };
      if (selectedPackageId) {
        const pkg = packages.find(p => p._id === selectedPackageId);
        if (pkg) {
          const startTime = new Date(formattedStart).getTime();
          const endTime = startTime + (pkg.durationHours || 0) * 60 * 60 * 1000;
          updated.end = formatDateTimeLocal(new Date(endTime));
        }
      }
      return updated;
    });

    if (!selectedPackageId) {
      calculateCustomPrice(formattedStart, new Date(targetDate.getTime() + 2 * 60 * 60 * 1000).toISOString());
    } else {
      const pkg = packages.find(p => p._id === selectedPackageId);
      if (pkg) {
        setFormData(prev => ({ ...prev, price: pkg.price }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photographer) return;

    const { title, start, end, location, price } = formData;
    const authPayload = getAuthPayload();
    const storedUser = getStoredUser();
    const currentRole = authPayload?.role || storedUser?.role;
    const currentUserId = authPayload?.id || storedUser?._id || storedUser?.id;
    const photographerUserId = photographer?.user?._id || photographer?.user;

    if (!localStorage.getItem("token")) {
      Swal.fire({
        icon: "warning",
        title: t.error,
        text: t.loginRequired,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      return;
    }

    if (currentRole !== "customer") {
      Swal.fire({
        icon: "warning",
        title: t.error,
        text: t.customerOnly,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      return;
    }

    if (currentUserId && photographerUserId && String(currentUserId) === String(photographerUserId)) {
      Swal.fire({
        icon: "warning",
        title: t.error,
        text: t.cannotBookSelf,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      return;
    }

    if (!title || !start || !end || !location) {
      Swal.fire({
        icon: "warning",
        title: t.error,
        text: t.requiredFields,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    if (startDate <= now) {
      Swal.fire({
        icon: "warning",
        title: t.error,
        text: t.pastStartDate,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      return;
    }

    if (endDate <= startDate || (endDate - startDate) < 30 * 60 * 1000) {
      Swal.fire({
        icon: "warning",
        title: t.error,
        text: t.invalidDates,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      return;
    }

    // Chặn submit nếu khung giờ trùng với booking hiện có
    const conflictBooking = hasTimeConflict(start, end);
    if (conflictBooking) {
      const fmt = (iso) => {
        const d = new Date(iso);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      };
      const conflictStart = fmt(conflictBooking.start);
      const conflictEnd   = conflictBooking.end ? fmt(conflictBooking.end) : fmt(new Date(new Date(conflictBooking.start).getTime() + 3600000));
      Swal.fire({
        icon: "error",
        title: t.timeConflict,
        html: `<p style="font-size:14px;color:${isDark?'#d1d5db':'#374151'}">
          Khung giờ bạn chọn trùng với lịch đã đặt:<br/>
          <strong style="color:#ef4444">${conflictStart} – ${conflictEnd}</strong>
          ${conflictBooking.title ? `<br/><em>${conflictBooking.title}</em>` : ''}
        </p>`,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        photographerUserId,
        packageId: selectedPackageId || null,
        title,
        note: formData.note,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        location,
        price,
      };

      const res = await bookingService.createBooking(payload);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: t.success,
          text: t.successMsg,
          background: isDark ? "#0f172a" : "#fff",
          color: isDark ? "#fff" : "#000",
          confirmButtonColor: "#06b6d4",
        });

        // Reset Form
        setFormData({
          title: "",
          note: "",
          start: "",
          end: "",
          location: "",
          price: 0,
        });
        setSelectedPackageId("");
        setSelectedDate(null);

        // Refresh schedule bookings
        const s = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const ed = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        const refreshedBookings = await photographerMarketplaceService.getPhotographerCalendar(photographer._id, { start: s, end: ed });
        if (refreshedBookings.success) {
          setCalendarBookings(refreshedBookings.data || []);
        }

        // Redirect to booking list
        navigate("/profile#bookings");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: t.error,
        text: err.response?.status === 403 ? t.customerOnly : (err.response?.data?.message || err.message),
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const monthsLabel = {
    vi: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  }[language];

  // Dropdown options mapping
  const photographerOptions = photographers.map((p) => ({
    value: p._id,
    label: `${p.displayName} - ${p.location || ""} ($${p.hourlyRate || 0}/h)`,
  }));

  const inputBgClass = isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900";
  const labelClass = `text-xs font-bold tracking-wider uppercase mb-1.5 block ${isDark ? "text-slate-400" : "text-slate-600"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-slate-900 dark:text-zinc-100 min-h-screen">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
          {t.bookingTitle}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-zinc-400 font-medium tracking-wide">
          {t.bookingSubtitle}
        </p>
      </div>

      {/* Select Photographer Dropdown */}
      <div className="mb-8 max-w-xl rounded-3xl p-5 border shadow-sm bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/80">
        <label className="text-sm font-black mb-2.5 block text-slate-800 dark:text-zinc-200">
          📍 {t.selectPhotographer}
        </label>
        <Select
          value={selectedPhotographerOption}
          onChange={(opt) => {
            setSelectedPhotographerOption(opt);
            setSelectedDate(null);
            setSelectedPackageId("");
          }}
          options={photographerOptions}
          placeholder="Tìm kiếm & chọn nhiếp ảnh gia..."
          isClearable={true}
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: isDark ? "#09090b" : "#f8fafc",
              borderColor: isDark ? "#27272a" : "#cbd5e1",
              color: isDark ? "#fff" : "#0f172a",
              borderRadius: "16px",
              padding: "4px 8px",
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: isDark ? "#09090b" : "#ffffff",
              color: isDark ? "#fff" : "#0f172a",
              borderRadius: "16px",
              border: isDark ? "1px solid #27272a" : "1px solid #e2e8f0",
              overflow: "hidden",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected 
                ? "#f97316" 
                : state.isFocused 
                  ? (isDark ? "#27272a" : "#f1f5f9") 
                  : "transparent",
              color: state.isSelected ? "#ffffff" : (isDark ? "#ffffff" : "#0f172a"),
              fontWeight: "600",
              cursor: "pointer",
            }),
            singleValue: (base) => ({
              ...base,
              color: isDark ? "#ffffff" : "#0f172a",
              fontWeight: "600",
            }),
          }}
        />
      </div>

      {!selectedPhotographerOption ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/10">
          <HelpCircle size={48} className="text-slate-400 mb-3 animate-bounce" />
          <p className="font-extrabold text-lg text-slate-500 dark:text-zinc-400">{t.chooseCreatorPrompt}</p>
        </div>
      ) : (
        /* Main Booking View */
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Photographer profile card + Availability calendar */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Photographer summary card */}
            {photographerLoading ? (
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100 dark:bg-zinc-900" />
            ) : photographer ? (
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-3xl border bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
                <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 border-2 border-orange-500 bg-orange-100">
                  {photographer.user?.avatar ? (
                    <img 
                      src={photographer.user.avatar.startsWith("http") ? photographer.user.avatar : `http://localhost:3000${photographer.user.avatar.startsWith("/") ? "" : "/"}${photographer.user.avatar}`}
                      alt={photographer.displayName} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-black text-white text-xl bg-gradient-to-br from-orange-400 to-amber-500">
                      {photographer.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {photographer.displayName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold truncate mt-0.5">
                    {photographer.user?.email}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Star size={13} className="fill-amber-500 text-amber-500" />
                      <strong>{t.rating}:</strong> {photographer.averageRating?.toFixed(1) || "5.0"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award size={13} className="text-emerald-500" />
                      <strong>{t.exp}:</strong> {photographer.experienceYears || 0} {t.years}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={13} className="text-rose-500" />
                      <strong>{t.hourly}:</strong> <strong className="text-rose-500">${photographer.hourlyRate}/h</strong>
                    </span>
                  </div>
                </div>

                {!photographer.isAvailable && (
                  <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full text-xs font-black">
                    {t.photographerUnavailable}
                  </div>
                )}
              </div>
            ) : null}

            {/* Availability Calendar grid */}
            <div className="p-6 rounded-3xl border bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black tracking-tight">{t.calendarHeader}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">{t.calendarSub}</p>
                </div>
                
                {/* Month navigation */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevMonth}
                    className={`p-2.5 rounded-xl border transition-all ${isDark ? "border-zinc-800 hover:bg-zinc-900 text-white" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-extrabold text-sm min-w-[110px] text-center">
                    {monthsLabel[month]} {year}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className={`p-2.5 rounded-xl border transition-all ${isDark ? "border-zinc-800 hover:bg-zinc-900 text-white" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {calendarLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Calendar Grid Header */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <div>{t.mon}</div>
                    <div>{t.tue}</div>
                    <div>{t.wed}</div>
                    <div>{t.thu}</div>
                    <div>{t.fri}</div>
                    <div className="text-orange-500">{t.sat}</div>
                    <div className="text-orange-500">{t.sun}</div>
                  </div>

                  {/* Calendar Grid Cells */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {daysGrid.map((cell, idx) => {
                      const isCellSelected = selectedDate && cell.isCurrentMonth && selectedDate.getDate() === cell.day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                      // Ngày có booking nhưng chưa bận hoàn toàn (còn giờ trống)
                      const hasPartialBooking = cell.isCurrentMonth && !cell.isBusy && !cell.isPast && cell.dayBookings && cell.dayBookings.length > 0;
                      const clickable = cell.isCurrentMonth && !cell.isPast && !cell.isBusy && photographer?.isAvailable;

                      return (
                        <div
                          key={idx}
                          title={
                            hasPartialBooking
                              ? `Đã có ${cell.dayBookings.length} lịch đặt – còn khung giờ trống`
                              : cell.isBusy
                              ? "Nhiếp ảnh gia đã kín lịch ngày này"
                              : undefined
                          }
                          onClick={() => clickable && handleCalendarDayClick(cell.day)}
                          className={`aspect-square p-1 rounded-xl border transition-all flex flex-col justify-between select-none relative ${
                            !cell.isCurrentMonth
                              ? "bg-transparent border-transparent text-slate-300 dark:text-zinc-800 pointer-events-none"
                              : cell.isPast
                                ? "bg-slate-100 dark:bg-zinc-900/40 border-transparent text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                                : cell.isBusy
                                  ? "bg-rose-500/10 border-rose-300/30 text-rose-500 cursor-not-allowed"
                                  : hasPartialBooking
                                    ? isCellSelected
                                      ? "bg-orange-500 border-orange-500 text-white font-black shadow-md shadow-orange-500/20"
                                      : "bg-amber-500/10 border-amber-400/40 text-amber-600 dark:text-amber-400 hover:border-orange-500 cursor-pointer"
                                    : isCellSelected
                                      ? "bg-orange-500 border-orange-500 text-white font-black shadow-md shadow-orange-500/20"
                                      : "bg-slate-50 dark:bg-zinc-900/60 border-slate-200/50 dark:border-zinc-800/80 hover:border-orange-500 hover:text-orange-500 cursor-pointer"
                          }`}
                        >
                          <span className={`text-[11px] font-bold ${isToday(cell.day) && !isCellSelected ? "text-orange-500 underline decoration-2 decoration-orange-500/80" : ""}`}>
                            {cell.day}
                          </span>
                          
                          {cell.isCurrentMonth && (
                            <div className="text-[8px] font-black uppercase tracking-wide self-end">
                              {cell.isBusy ? (
                                <span className="text-rose-500">{t.busyDay}</span>
                              ) : cell.isPast ? (
                                ""
                              ) : hasPartialBooking ? (
                                <span className={`opacity-90 ${isCellSelected ? "text-white" : "text-amber-500"}`}>
                                  {language === "vi" ? "CÓ LỊCH" : "BUSY"}
                                </span>
                              ) : (
                                <span className={`opacity-80 ${isCellSelected ? "text-white" : "text-emerald-500 dark:text-emerald-400"}`}>{t.freeDay}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ─────────────────────────────────────────────────── */}
              {/* Day Time-Slot Timeline – shows when selected date has bookings */}
              {selectedDate && (() => {
                const sd = selectedDate;
                const dayBookingsForSelected = calendarBookings.filter((b) => {
                  const dayStart = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), 0, 0, 0).getTime();
                  const dayEnd   = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), 23, 59, 59).getTime();
                  const bStart   = new Date(b.start).getTime();
                  const bEnd     = b.end ? new Date(b.end).getTime() : bStart + 3600000;
                  return bStart < dayEnd && bEnd > dayStart;
                });

                const WORK_START_H = 8;   // 08:00
                const WORK_END_H   = 20;  // 20:00
                const TOTAL_MINS   = (WORK_END_H - WORK_START_H) * 60;

                // Build segments for the progress bar
                const segments = [];
                let cursorMs = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), WORK_START_H, 0, 0).getTime();
                const endMs   = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), WORK_END_H,   0, 0).getTime();

                // Merge & sort bookings clipped to work window
                const clipped = dayBookingsForSelected
                  .map(b => ({
                    s: Math.max(new Date(b.start).getTime(), cursorMs),
                    e: Math.min(b.end ? new Date(b.end).getTime() : new Date(b.start).getTime() + 3600000, endMs),
                    title: b.title || "Lịch đã đặt",
                  }))
                  .filter(iv => iv.e > iv.s)
                  .sort((a, b) => a.s - b.s);

                // Build free/busy segments
                let ptr = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), WORK_START_H, 0, 0).getTime();
                const merged = [];
                for (const iv of clipped) {
                  if (iv.s > ptr) merged.push({ s: ptr, e: iv.s, busy: false });
                  if (merged.length && merged[merged.length-1].busy && merged[merged.length-1].e >= iv.s) {
                    merged[merged.length-1].e = Math.max(merged[merged.length-1].e, iv.e);
                  } else {
                    merged.push({ s: iv.s, e: iv.e, busy: true, title: iv.title });
                  }
                  ptr = Math.max(ptr, iv.e);
                }
                if (ptr < endMs) merged.push({ s: ptr, e: endMs, busy: false });

                const fmt = (ms) => {
                  const d = new Date(ms);
                  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                };

                return (
                  <div className={`mt-4 p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50/80 border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={14} className="text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-zinc-100">
                          {t.timeSlotTitle} {sd.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">{t.timeSlotSub}</p>
                      </div>
                    </div>

                    {/* Hour labels */}
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-zinc-600 mb-1 px-0.5">
                      {Array.from({ length: WORK_END_H - WORK_START_H + 1 }, (_, i) => (
                        <span key={i}>{String(WORK_START_H + i).padStart(2,'0')}h</span>
                      ))}
                    </div>

                    {/* Timeline bar */}
                    <div className="flex h-6 rounded-xl overflow-hidden w-full border border-slate-200/50 dark:border-zinc-800">
                      {merged.map((seg, i) => {
                        const widthPct = ((seg.e - seg.s) / (TOTAL_MINS * 60000)) * 100;
                        return (
                          <div
                            key={i}
                            title={seg.busy ? `🔴 ${fmt(seg.s)} – ${fmt(seg.e)}: ${t.slotBusy}` : `🟢 ${fmt(seg.s)} – ${fmt(seg.e)}: ${t.slotFree}`}
                            className={`h-full transition-all ${
                              seg.busy
                                ? 'bg-rose-500 opacity-80'
                                : 'bg-emerald-500/40'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500/50 inline-block" />{t.slotFree}</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />{t.slotBusy}</span>
                    </div>

                    {/* Booked slot list */}
                    {dayBookingsForSelected.length === 0 ? (
                      <p className="mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 rounded-xl px-3 py-2">
                        ✅ {t.noBookingToday}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-500">{t.bookedSlots}</p>
                        {dayBookingsForSelected.map((b, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-rose-500 font-black tabular-nums">
                              {fmt(new Date(b.start).getTime())} – {fmt(b.end ? new Date(b.end).getTime() : new Date(b.start).getTime() + 3600000)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-600 italic">{t.slotBusy}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* RIGHT SIDE: Booking Form */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-3xl border bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Visual date selected prompt */}
                {selectedDate ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>
                      Đã chọn ngày chụp: <strong>{selectedDate.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <Info size={14} className="text-amber-500" />
                    <span>{t.selectDatePrompt}</span>
                  </div>
                )}

                {/* Package selection — Dropdown */}
                <div>
                  <label className={labelClass}>{t.packagesLabel}</label>
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={selectedPackageId}
                      onChange={(e) => { setSelectedPackageId(e.target.value); setShowAllImages(false); }}
                      className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border transition focus:border-orange-500 appearance-none font-semibold ${inputBgClass}`}
                      disabled={packagesLoading}
                    >
                      <option value="">✨ {t.customBooking}</option>
                      {packages.map((pkg) => (
                        <option key={pkg._id} value={pkg._id}>
                          📦 {pkg.title} - {pkg.price.toLocaleString()} VNĐ ({pkg.durationHours}h)
                        </option>
                      ))}
                    </select>
                  </div>
                  {packagesLoading && <p className="text-xs text-slate-500 mt-1.5 animate-pulse">{t.loadingPackages}</p>}
                </div>

                {/* Package image gallery — hiển thị khi gói được chọn có ảnh */}
                {selectedPackageId && (() => {
                  const pkg = packages.find(p => p._id === selectedPackageId);
                  const rawImages = Array.isArray(pkg?.images) ? pkg.images : [];
                  if (rawImages.length === 0) return null;
                  const urls = rawImages
                    .map(img => typeof img === "string" ? img : img?.imageUrl || "")
                    .filter(Boolean)
                    .map(url => url.startsWith("http") ? url : `http://localhost:3000${url.startsWith("/") ? "" : "/"}${url}`);
                  const MAX_VISIBLE = 6;
                  const visibleUrls = showAllImages ? urls : urls.slice(0, MAX_VISIBLE);
                  const remaining = urls.length - MAX_VISIBLE;
                  return (
                    <div className={`p-3 rounded-2xl border ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-slate-200 bg-slate-50/60"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                          🖼 {language === "vi" ? "Ảnh mẫu của gói" : "Package sample photos"}
                          <span className="ml-1 normal-case font-semibold">({urls.length})</span>
                        </p>
                        {showAllImages && urls.length > MAX_VISIBLE && (
                          <button
                            type="button"
                            onClick={() => setShowAllImages(false)}
                            className="text-[10px] font-black text-orange-500 hover:text-orange-400 transition-colors"
                          >
                            {language === "vi" ? "Thu gọn ↑" : "Collapse ↑"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {visibleUrls.map((url, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-zinc-800">
                            <img src={url} alt={`sample-${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          </div>
                        ))}
                        {/* "Xem thêm" tile — ô cuối trong grid */}
                        {!showAllImages && remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAllImages(true)}
                            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:border-orange-500 hover:text-orange-500 ${
                              isDark ? "border-zinc-700 text-zinc-400" : "border-slate-300 text-slate-500"
                            }`}
                          >
                            <span className="text-lg font-black">+{remaining}</span>
                            <span className="text-[9px] font-black uppercase tracking-wide">
                              {language === "vi" ? "Xem thêm" : "See more"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Session Title */}
                <div>
                  <label className={labelClass}>{t.sessionTitle} <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder={t.sessionTitlePlaceholder}
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border transition focus:border-orange-500 ${inputBgClass}`}
                      disabled={!!selectedPackageId}
                      required
                    />
                  </div>
                </div>

                {/* Start & End Dates */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t.startDate} <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="datetime-local"
                        value={formData.start}
                        onChange={(e) => handleDateChange("start", e.target.value)}
                        className={`w-full rounded-2xl pl-10 pr-3 py-3 outline-none border transition focus:border-orange-500 ${inputBgClass} ${conflictWarning ? "border-rose-500 focus:border-rose-500" : ""}`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t.endDate} <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="datetime-local"
                        value={formData.end}
                        onChange={(e) => handleDateChange("end", e.target.value)}
                        className={`w-full rounded-2xl pl-10 pr-3 py-3 outline-none border transition focus:border-orange-500 ${inputBgClass} ${
                          selectedPackageId ? "opacity-60 cursor-not-allowed" : ""
                        } ${conflictWarning ? "border-rose-500 focus:border-rose-500" : ""}`}
                        required
                        disabled={!!selectedPackageId}
                      />
                    </div>
                  </div>
                </div>

                {/* Conflict Warning Banner */}
                {conflictWarning && (() => {
                  const fmt = (iso) => {
                    const d = new Date(iso);
                    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                  };
                  const cs = fmt(conflictWarning.start);
                  const ce = conflictWarning.end ? fmt(conflictWarning.end) : fmt(new Date(new Date(conflictWarning.start).getTime() + 3600000));
                  return (
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-pulse">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <p className="font-black">{t.timeConflict}</p>
                        <p className="mt-0.5 opacity-80">
                          {language === "vi" ? "Trùng với lịch" : "Conflicts with"}: <strong className="text-rose-500">{cs} – {ce}</strong>
                          {conflictWarning.title && <span className="ml-1 italic">({conflictWarning.title})</span>}
                        </p>
                      </div>
                    </div>
                  );
                })()}


                {/* Location */}
                <div>
                  <label className={labelClass}>{t.locationLabel} <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder={t.locationPlaceholder}
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border transition focus:border-orange-500 ${inputBgClass}`}
                      required
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className={labelClass}>{t.noteLabel}</label>
                  <textarea
                    placeholder={t.notePlaceholder}
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    className={`w-full rounded-2xl p-4 outline-none border transition focus:border-orange-500 ${inputBgClass}`}
                  />
                </div>

                {/* Pricing / Packages info messages */}
                {!selectedPackageId && photographer?.hourlyRate && (
                  <div className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-xs font-semibold ${isDark ? "bg-orange-500/5 border-orange-500/20 text-orange-300" : "bg-orange-50/50 border-orange-200 text-orange-700"}`}>
                    <Info size={14} className="shrink-0 mt-0.5 text-orange-500" />
                    <div>
                      <p>{t.hourlyRateInfo} <strong className="text-sm font-black text-rose-500">${photographer.hourlyRate}/h</strong></p>
                      <p className="opacity-80 mt-0.5">{t.calcHourly}</p>
                    </div>
                  </div>
                )}

                {selectedPackageId && (
                  <div className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-xs font-semibold ${isDark ? "bg-orange-500/5 border-orange-500/20 text-orange-300" : "bg-orange-50/50 border-orange-200 text-orange-700"}`}>
                    <Info size={14} className="shrink-0 mt-0.5 text-orange-500" />
                    <p className="opacity-90">{t.packageNotice}</p>
                  </div>
                )}

                {/* Total Price and Submit Button */}
                <div className="pt-4 border-t border-slate-200/50 dark:border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      {t.priceLabel}
                    </p>
                    <p className="text-2xl font-black text-rose-500 tracking-tight flex items-center">
                      <DollarSign size={20} className="-mr-0.5 text-rose-500" />
                      {formData.price.toLocaleString()} <span className="text-xs font-extrabold ml-1 uppercase">VNĐ</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading || formData.price <= 0 || !photographer?.isAvailable}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitLoading ? t.submitting : t.submitBtn}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// Small helper CheckCircle icon
function CheckCircle(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || "24"}
      height={props.size || "24"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
