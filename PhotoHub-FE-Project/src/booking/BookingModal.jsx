import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, FileText, Gift, Info } from "lucide-react";
import Swal from "sweetalert2";
import { bookingService } from "../services/bookingService";

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

export default function BookingModal({ isOpen, onClose, photographer, theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
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

  const [loading, setLoading] = useState(false);

  const t = {
    vi: {
      bookTitle: "Đặt Lịch Chụp Ảnh",
      sessionTitle: "Tiêu đề buổi chụp",
      sessionTitlePlaceholder: "Ví dụ: Chụp ảnh ngoại cảnh kỷ niệm, Chụp phóng sự cưới...",
      selectPackage: "Chọn gói dịch vụ",
      customBooking: "Đặt lịch tự do (Theo giờ)",
      startDate: "Ngày giờ bắt đầu",
      endDate: "Ngày giờ kết thúc",
      locationLabel: "Địa điểm chụp",
      locationPlaceholder: "Địa chỉ cụ thể, công viên, studio...",
      noteLabel: "Ghi chú gửi Nhiếp ảnh gia",
      notePlaceholder: "Yêu cầu chi tiết về trang phục, phong cách, tone màu...",
      priceLabel: "Tổng chi phí tạm tính",
      submitBtn: "Gửi Yêu Cầu Đặt Lịch",
      submitting: "Đang gửi yêu cầu...",
      close: "Đóng",
      loadingPackages: "Đang tải các gói dịch vụ...",
      hourlyRateInfo: "Giá đặt theo giờ của nhiếp ảnh gia này là:",
      calcHourly: "Chi phí tính bằng: Số giờ chụp × Mức giá/giờ",
      error: "Lỗi",
      success: "Thành công",
      successMsg: "Yêu cầu đặt lịch đã được gửi thành công đến Nhiếp ảnh gia!",
      invalidDates: "Ngày kết thúc phải sau ngày bắt đầu và buổi chụp phải kéo dài ít nhất 30 phút",
      pastStartDate: "Ngày bắt đầu phải ở thời điểm tương lai",
      requiredFields: "Vui lòng điền đầy đủ các thông tin bắt buộc!",
      loginRequired: "Bạn cần đăng nhập bằng tài khoản customer để đặt lịch.",
      customerOnly: "Chỉ tài khoản customer mới có thể đặt lịch và thanh toán. Hãy đăng xuất rồi đăng nhập tài khoản customer.",
      cannotBookSelf: "Bạn không thể đặt lịch với chính mình.",
    },
    en: {
      bookTitle: "Book Photography Session",
      sessionTitle: "Session Title",
      sessionTitlePlaceholder: "e.g., Outdoor portrait session, Wedding photoshoot...",
      selectPackage: "Select Service Package",
      customBooking: "Custom Booking (Hourly)",
      startDate: "Start Date & Time",
      endDate: "End Date & Time",
      locationLabel: "Shoot Location",
      locationPlaceholder: "Specific address, park, studio...",
      noteLabel: "Note to Photographer",
      notePlaceholder: "Specific requests, outfits, style, color grading...",
      priceLabel: "Estimated Total Price",
      submitBtn: "Submit Booking Request",
      submitting: "Submitting...",
      close: "Close",
      loadingPackages: "Loading packages...",
      hourlyRateInfo: "This photographer's hourly rate is:",
      calcHourly: "Price calculated by: Duration hours × Hourly rate",
      error: "Error",
      success: "Success",
      successMsg: "Booking request submitted successfully to the Photographer!",
      invalidDates: "End date must be after start date and shoot duration must be at least 30 minutes",
      pastStartDate: "Start date must be in the future",
      requiredFields: "Please fill in all required fields!",
      loginRequired: "Please sign in with a customer account to book this photographer.",
      customerOnly: "Only customer accounts can create bookings and pay. Please sign out and sign in with a customer account.",
      cannotBookSelf: "You cannot book yourself.",
    },
  }[language];

  // Fetch packages when modal opens
  useEffect(() => {
    if (isOpen && photographer?._id) {
      const fetchPackages = async () => {
        setPackagesLoading(true);
        try {
          const res = await bookingService.getPhotographerPackages(photographer._id);
          if (res.success) {
            const actualPackages = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setPackages(actualPackages);
          }
        } catch (err) {
          console.error("Error fetching photographer packages:", err);
        } finally {
          setPackagesLoading(false);
        }
      };
      fetchPackages();
    }
  }, [isOpen, photographer]);

  // Recalculate price and pre-fill title when package selection changes
  useEffect(() => {
    if (!selectedPackageId) {
      setFormData((prev) => ({ ...prev, title: "", price: 0 }));
      calculateCustomPrice(formData.start, formData.end);
    } else {
      const pkg = packages.find((p) => p._id === selectedPackageId);
      if (pkg) {
        let updatedEnd = formData.end;
        if (formData.start) {
          const startTime = new Date(formData.start).getTime();
          const endTime = startTime + (pkg.durationHours || 0) * 60 * 60 * 1000;
          updatedEnd = formatDateTimeLocal(new Date(endTime));
        }
        setFormData((prev) => ({
          ...prev,
          title: pkg.title,
          price: pkg.price,
          end: updatedEnd,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackageId, packages]);

  const handleDateChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };

    if (selectedPackageId && field === "start" && value) {
      const pkg = packages.find((p) => p._id === selectedPackageId);
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
  };

  const calculateCustomPrice = (start, end) => {
    if (!start || !end || !photographer?.hourlyRate) return;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (endTime > startTime) {
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      const calculatedPrice = Math.max(0.5, durationHours) * (photographer.hourlyRate || 0);
      setFormData((prev) => ({ ...prev, price: Math.round(calculatedPrice) }));
    } else {
      setFormData((prev) => ({ ...prev, price: 0 }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, start, end, location, price } = formData;
    const authPayload = getAuthPayload();
    const storedUser = getStoredUser();
    const currentRole = authPayload?.role || storedUser?.role;
    const currentUserId = authPayload?.id || storedUser?._id || storedUser?.id;
    const photographerUserId = photographer?.user?._id || photographer?.user;

    if (!localStorage.getItem("token")) {
      Swal.fire({ icon: "warning", title: t.error, text: t.loginRequired, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }
    if (currentRole !== "customer") {
      Swal.fire({ icon: "warning", title: t.error, text: t.customerOnly, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }
    if (currentUserId && photographerUserId && String(currentUserId) === String(photographerUserId)) {
      Swal.fire({ icon: "warning", title: t.error, text: t.cannotBookSelf, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }
    if (!title || !start || !end || !location) {
      Swal.fire({ icon: "warning", title: t.error, text: t.requiredFields, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    if (startDate <= now) {
      Swal.fire({ icon: "warning", title: t.error, text: t.pastStartDate, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }
    if (endDate <= startDate || endDate - startDate < 30 * 60 * 1000) {
      Swal.fire({ icon: "warning", title: t.error, text: t.invalidDates, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }

    setLoading(true);
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
        Swal.fire({ icon: "success", title: t.success, text: t.successMsg, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000", confirmButtonColor: "#f97316" });
        onClose();
        setFormData({ title: "", note: "", start: "", end: "", location: "", price: 0 });
        setSelectedPackageId("");
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
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBgClass = isDark
    ? "bg-slate-900 border-slate-700 text-white"
    : "bg-slate-50 border-slate-200 text-slate-900";
  const labelClass = `text-xs font-bold tracking-wider uppercase mb-1.5 block ${isDark ? "text-slate-400" : "text-slate-600"}`;

  return (
    /* Overlay: full-screen, scrollable so long form is accessible on small screens */
    <div
      className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 py-8">
        {/* Modal card */}
        <div
          className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 border shadow-2xl transition-all ${
            isDark ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50 dark:border-white/[0.06]">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{t.bookTitle}</h2>
              <p className={`text-xs mt-1 ${isDark ? "text-orange-400" : "text-orange-600"} font-semibold`}>
                @ {photographer?.displayName}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? "border-white/5 hover:bg-white/5 text-slate-400 hover:text-white"
                  : "border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900"
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Package Selection */}
            <div>
              <label className={labelClass}>{t.selectPackage}</label>
              <div className="relative">
                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
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
              {packagesLoading && (
                <p className="text-xs text-slate-500 mt-1.5 animate-pulse">{t.loadingPackages}</p>
              )}
            </div>

            {/* Session Title */}
            <div>
              <label className={labelClass}>
                {t.sessionTitle} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={t.sessionTitlePlaceholder}
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border transition focus:border-orange-500 ${inputBgClass}`}
                  disabled={!!selectedPackageId}
                  required
                />
              </div>
            </div>

            {/* Start & End Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t.startDate} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="datetime-local"
                    value={formData.start}
                    onChange={(e) => handleDateChange("start", e.target.value)}
                    className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border transition focus:border-orange-500 ${inputBgClass}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  {t.endDate} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                    className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border transition focus:border-orange-500 ${inputBgClass} ${
                      selectedPackageId ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    required
                    disabled={!!selectedPackageId}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className={labelClass}>
                {t.locationLabel} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={t.locationPlaceholder}
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border transition focus:border-orange-500 ${inputBgClass}`}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>{t.noteLabel}</label>
              <textarea
                placeholder={t.notePlaceholder}
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
                className={`w-full rounded-2xl p-4 outline-none border transition focus:border-orange-500 resize-none ${inputBgClass}`}
              />
            </div>

            {/* Hourly Rate Guidance (if custom) */}
            {!selectedPackageId && photographer?.hourlyRate && (
              <div
                className={`flex items-start gap-3 p-4 rounded-2xl border text-xs font-semibold ${
                  isDark
                    ? "bg-orange-500/5 border-orange-500/20 text-orange-300"
                    : "bg-orange-50/50 border-orange-200 text-orange-700"
                }`}
              >
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p>
                    {t.hourlyRateInfo}{" "}
                    <strong className="text-sm font-black text-rose-500">
                      {Number(photographer.hourlyRate || 0).toLocaleString("vi-VN")} đ/giờ
                    </strong>
                  </p>
                  <p className="opacity-80 mt-1">{t.calcHourly}</p>
                </div>
              </div>
            )}

            {/* Package Fixed Duration Notice */}
            {selectedPackageId && (
              <div
                className={`flex items-start gap-3 p-4 rounded-2xl border text-xs font-semibold ${
                  isDark
                    ? "bg-orange-500/5 border-orange-500/20 text-orange-300"
                    : "bg-orange-50/50 border-orange-200 text-orange-700"
                }`}
              >
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                  {language === "vi"
                    ? "Gói dịch vụ đã chọn có thời lượng cố định. Thời gian kết thúc đã được tự động tính toán và khóa."
                    : "The selected package has a fixed duration. The end time has been calculated automatically and locked."}
                </p>
              </div>
            )}

            {/* Pricing & Submit */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-white/[0.06]">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t.priceLabel}
                </p>
                <p className="text-3xl font-black text-rose-500 tracking-tight mt-1 flex items-center">
                  {formData.price.toLocaleString("vi-VN")}{" "}
                  <span className="text-sm font-bold ml-1 uppercase">đ</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || formData.price <= 0}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? t.submitting : t.submitBtn}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
