import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft, Home, Calendar } from "lucide-react";

export default function PaymentResult({ language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const isCanceled = queryParams.get("canceled") === "true" || queryParams.get("cancel") === "true";
  const orderCode = queryParams.get("orderCode");

  const t = {
    vi: {
      successTitle: "Thanh Toán Thành Công! 🎉",
      successSub: "Cảm ơn bạn đã sử dụng dịch vụ của PhotoHub. Lịch hẹn chụp ảnh của bạn đã được xác nhận và thông báo đã được gửi đến Nhiếp ảnh gia.",
      failTitle: "Thanh Toán Bị Hủy ❌",
      failSub: "Giao dịch thanh toán cọc đã bị hủy hoặc không thành công. Lịch đặt của bạn vẫn được lưu dưới trạng thái chờ thanh toán.",
      orderCodeLabel: "Mã đơn hàng:",
      goBookingsBtn: "Quản lý lịch đặt của tôi",
      goHomeBtn: "Về trang chủ",
    },
    en: {
      successTitle: "Payment Successful! 🎉",
      successSub: "Thank you for booking with PhotoHub. Your session is now confirmed, and a confirmation email has been sent to both you and the photographer.",
      failTitle: "Payment Cancelled ❌",
      failSub: "Your deposit payment was cancelled or failed. Your booking is still saved under accepted status and awaits payment.",
      orderCodeLabel: "Order Code:",
      goBookingsBtn: "Manage My Bookings",
      goHomeBtn: "Back to Home",
    },
  }[language];

  const cardBgClass = isDark ? "bg-[#0f172a]/80 border-white/10 shadow-2xl shadow-cyan-500/5" : "bg-white border-slate-100 shadow-xl shadow-slate-100/50";
  const textTitleClass = isCanceled ? "text-rose-500" : "text-emerald-500";

  return (
    <div className={`min-h-screen pt-32 pb-16 px-6 flex items-center justify-center transition-colors duration-500 ${
      isDark ? "bg-[#030303] text-white" : "bg-slate-50 text-slate-900"
    }`}>
      <div className={`relative max-w-lg w-full rounded-3xl p-8 border text-center backdrop-blur-md ${cardBgClass}`}>
        {/* Glow effect */}
        <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${
          isCanceled ? "bg-rose-500" : "bg-emerald-500"
        }`}></div>

        {/* Icon status */}
        <div className="flex justify-center mb-6">
          {isCanceled ? (
            <XCircle size={72} className="text-rose-500 animate-bounce" />
          ) : (
            <CheckCircle2 size={72} className="text-emerald-500 animate-pulse" />
          )}
        </div>

        {/* Status text */}
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mb-4 ${textTitleClass}`}>
          {isCanceled ? t.failTitle : t.successTitle}
        </h1>

        <p className={`text-sm leading-relaxed mb-6 ${isDark ? "text-slate-400" : "text-slate-600"} font-medium`}>
          {isCanceled ? t.failSub : t.successSub}
        </p>

        {orderCode && (
          <div className={`py-3 px-4 rounded-2xl border mb-8 inline-flex items-center gap-2 text-xs font-semibold ${
            isDark ? "bg-white/[0.02] border-white/5 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
          }`}>
            <span>{t.orderCodeLabel}</span>
            <strong className={isDark ? "text-cyan-400" : "text-indigo-600 font-extrabold"}>#{orderCode}</strong>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate("/profile")}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Calendar size={16} />
            {t.goBookingsBtn}
          </button>
          
          <button
            onClick={() => navigate("/")}
            className={`w-full sm:w-auto px-6 py-3.5 border font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm ${
              isDark 
                ? "border-white/10 bg-white/5 hover:bg-white/10 text-white" 
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            }`}
          >
            <Home size={16} />
            {t.goHomeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
